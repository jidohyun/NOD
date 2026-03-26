import asyncio
import ipaddress
import re
import time as _time
import uuid
from typing import Literal
from urllib.parse import urlparse

import httpx
import structlog
from fastapi import APIRouter, HTTPException, Query, status
from fastapi.responses import Response

from src.articles import service
from src.articles.schemas import (
    ArticleAnalyzeURL,
    ArticleCreate,
    ArticleListResponse,
    ArticleResponse,
    ArticleSaveResponse,
    ArticleShareLinkCreate,
    ArticleShareLinkResponse,
    ArticleUpdate,
    ContentTypeStatsResponse,
    MyShareLinkItem,
    SharedArticleCommentCreate,
    SharedArticleCommentEmpathyResponse,
    SharedArticleCommentResponse,
    SharedArticleCommentUpdate,
    SharedArticleEmpathyResponse,
    SharedArticleSummaryResponse,
    SimilarArticleResponse,
)
from src.common.models.pagination import PaginatedResponse
from src.lib.config import settings
from src.lib.content_classifier import ContentType, classify_url
from src.lib.dependencies import AIService, CurrentUser, DBSession, OptionalUser
from src.lib.metrics import (
    AI_SUMMARY_DURATION,
    AI_SUMMARY_REQUESTS,
    ARTICLE_SAVE_REQUESTS,
    BACKGROUND_TASKS_ACTIVE,
    SEARCH_DURATION,
    SEARCH_REQUESTS,
)
from src.lib.pdf_extractor import extract_text_from_pdf_url
from src.lib.video_transcript import (
    TranscriptProviderError,
    TranscriptUnavailableError,
    UnsupportedVideoUrlError,
    get_video_transcript_service,
)
from src.subscriptions import service as sub_service

# Keep references to background tasks so they are not garbage-collected.
_background_tasks: set[asyncio.Task[None]] = set()

logger = structlog.get_logger(__name__)

router = APIRouter()


def _parse_user_uuid_or_raise(user_id: str) -> uuid.UUID:
    try:
        return uuid.UUID(user_id)
    except (ValueError, TypeError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user context",
        ) from exc


VIDEO_TRANSCRIPT_MIN_CONTENT_CHARS = int(
    getattr(settings, "VIDEO_TRANSCRIPT_MIN_CONTENT_CHARS", 100)
)

SLOW_ANALYSIS_CONTENT_TYPES = frozenset(
    {
        ContentType.OFFICIAL_DOCS,
        ContentType.VIDEO_PODCAST,
    }
)

# Academic papers get generous limits since they contain dense, important content.
LARGE_CONTENT_TYPES = frozenset(
    {
        ContentType.ACADEMIC_PAPER,
    }
)


def get_article_analysis_timeout_seconds(
    content_type: ContentType = ContentType.GENERAL_NEWS,
    *,
    retry: bool = False,
) -> int:
    configured_timeout = int(getattr(settings, "ARTICLE_ANALYSIS_TIMEOUT_SECONDS", 45))
    timeout = max(configured_timeout, 1)

    # Academic papers get full timeout for large content processing.
    if content_type in LARGE_CONTENT_TYPES:
        return max(timeout - 15, 30) if retry else timeout

    if content_type not in SLOW_ANALYSIS_CONTENT_TYPES:
        return timeout

    first_attempt_timeout = max(timeout - 15, 10)
    if not retry:
        return first_attempt_timeout

    return max(first_attempt_timeout - 12, 6)


def get_article_analysis_content_limit_chars(
    content_type: ContentType = ContentType.GENERAL_NEWS,
    *,
    retry: bool = False,
) -> int:
    if content_type in LARGE_CONTENT_TYPES:
        return 18000 if retry else 30000

    if content_type not in SLOW_ANALYSIS_CONTENT_TYPES:
        return 12000

    if retry:
        return 6500

    return 9000


def resolve_content_type_for_retry(article: object) -> ContentType:
    summary = getattr(article, "summary", None)
    summary_content_type = getattr(summary, "content_type", None)
    if isinstance(summary_content_type, str):
        try:
            return ContentType(summary_content_type)
        except ValueError:
            pass

    article_url = getattr(article, "url", None)
    if isinstance(article_url, str) and article_url:
        return classify_url(article_url)

    return ContentType.GENERAL_NEWS


def resolve_summary_language_for_retry(article: object) -> str:
    summary = getattr(article, "summary", None)
    summary_language = getattr(summary, "language", None)
    if isinstance(summary_language, str) and summary_language.strip():
        return summary_language

    requested_language = getattr(article, "requested_summary_language", None)
    if isinstance(requested_language, str) and requested_language.strip():
        return requested_language

    return "ko"


def enforce_content_type_access(plan: str, content_type: ContentType) -> None:
    if sub_service.can_access_content_type(plan, content_type):
        return
    raise HTTPException(
        status_code=status.HTTP_402_PAYMENT_REQUIRED,
        detail=(
            "This content type is available on Pro plan only. "
            "Free plan supports general news, tech blog, and official docs."
        ),
    )


async def prepare_analyze_url_content(
    *,
    url: str,
    title: str,
    content: str | None,
) -> tuple[str, str]:
    normalized_content = (content or "").strip()
    if len(normalized_content) >= VIDEO_TRANSCRIPT_MIN_CONTENT_CHARS:
        return title, normalized_content

    requested_content_type = classify_url(url)
    if requested_content_type == ContentType.VIDEO_PODCAST:
        transcript_service = get_video_transcript_service()
        try:
            transcript = await transcript_service.extract_transcript(url)
            return title, transcript.text
        except (TranscriptUnavailableError, UnsupportedVideoUrlError) as exc:
            if normalized_content:
                return title, normalized_content
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Could not extract transcript from this video URL",
            ) from exc
        except TranscriptProviderError as exc:
            logger.warning(
                "Transcript provider failed",
                url=url,
                is_transient=exc.is_transient,
            )
            if normalized_content:
                return title, normalized_content
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=(
                    "Transcript provider is temporarily unavailable. Please try again."
                ),
            ) from exc

    pdf_result = await extract_text_from_pdf_url(url)
    if pdf_result:
        return (pdf_result.title or title), pdf_result.text

    if normalized_content:
        return title, normalized_content

    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        detail="Could not extract content from this URL",
    )


async def _run_analysis(
    article_id: uuid.UUID,
    title: str,
    content: str,
    provider: Literal["gemini", "openai"],
    summary_language: str = "ko",
    article_url: str | None = None,
) -> bool:
    """Background task: summarize article with AI and save to DB."""
    from src.articles.model import Article, ArticleSummary
    from src.lib.ai_service import summarize_article
    from src.lib.database import async_session_factory

    logger.info(
        "Starting article analysis",
        article_id=str(article_id),
        provider=provider,
        summary_language=summary_language,
        content_length=len(content),
    )

    analysis_content_type = (
        classify_url(article_url) if article_url else ContentType.GENERAL_NEWS
    )

    BACKGROUND_TASKS_ACTIVE.inc()
    _start_time = _time.monotonic()
    try:
        initial_timeout_seconds = get_article_analysis_timeout_seconds(
            analysis_content_type
        )
        initial_content_limit = get_article_analysis_content_limit_chars(
            analysis_content_type
        )

        logger.info(
            "Calling summarize_article",
            article_id=str(article_id),
            provider=provider,
            timeout_seconds=initial_timeout_seconds,
            content_limit=initial_content_limit,
            content_type=str(analysis_content_type),
        )

        try:
            result, content_type = await asyncio.wait_for(
                summarize_article(
                    title,
                    content[:initial_content_limit],
                    url=article_url,
                    provider=provider,
                    summary_language=summary_language,
                ),
                timeout=initial_timeout_seconds,
            )
        except TimeoutError:
            if analysis_content_type not in SLOW_ANALYSIS_CONTENT_TYPES:
                raise

            retry_timeout_seconds = get_article_analysis_timeout_seconds(
                analysis_content_type,
                retry=True,
            )
            retry_content_limit = get_article_analysis_content_limit_chars(
                analysis_content_type,
                retry=True,
            )

            logger.warning(
                "Article analysis timed out, retrying with compact input",
                article_id=str(article_id),
                content_type=str(analysis_content_type),
                initial_timeout_seconds=initial_timeout_seconds,
                retry_timeout_seconds=retry_timeout_seconds,
                retry_content_limit=retry_content_limit,
            )

            result, content_type = await asyncio.wait_for(
                summarize_article(
                    title,
                    content[:retry_content_limit],
                    url=article_url,
                    provider=provider,
                    summary_language=summary_language,
                ),
                timeout=retry_timeout_seconds,
            )

        logger.info(
            "summarize_article completed successfully",
            article_id=str(article_id),
            result_summary_length=len(result.summary),
            concepts_count=len(result.concepts),
        )

        model_name = settings.GEMINI_MODEL if provider == "gemini" else "gpt-4o-mini"
        root_concept_label = (result.root_concept or "").strip()
        if not root_concept_label and result.concepts:
            root_concept_label = result.concepts[0].strip()

        logger.info("Saving summary to database", article_id=str(article_id))
        async with async_session_factory() as session:
            from sqlalchemy import select

            user_res = await session.execute(
                select(Article.user_id).where(Article.id == article_id)
            )
            user_id = user_res.scalar_one_or_none()

            existing_norms: list[str] = []
            if user_id:
                norms_res = await session.execute(
                    select(ArticleSummary.root_concept_norm)
                    .join(Article, ArticleSummary.article_id == Article.id)
                    .where(
                        Article.user_id == user_id,
                        ArticleSummary.root_concept_norm.is_not(None),
                        ArticleSummary.root_concept_norm != "",
                    )
                    .distinct()
                )
                existing_norms = [n for n in norms_res.scalars().all() if n]

            (
                resolved_root_label,
                resolved_root_norm,
                resolved_concepts,
            ) = service.resolve_concept_candidates(
                root_concept_label=root_concept_label,
                concepts=result.concepts,
                existing_norms=existing_norms,
                max_candidates=2,
                threshold=0.92,
            )

            # Extract type-specific metadata (fields beyond base)
            from src.lib.agents.base import BaseSummaryResult

            base_fields = set(BaseSummaryResult.model_fields.keys())
            type_metadata = {
                k: v for k, v in result.model_dump().items() if k not in base_fields
            }
            type_metadata = _attach_patch_note_tag(type_metadata, article_url)

            # Extract og:image from source URL (best-effort, non-blocking)
            og_image_url: str | None = None
            if article_url:
                try:
                    og_image_url = await extract_og_image_url(article_url)
                except Exception:
                    logger.debug(
                        "og:image extraction failed",
                        article_id=str(article_id),
                    )

            summary = ArticleSummary(
                article_id=article_id,
                summary=result.summary,
                markdown_note=result.markdown_note,
                concepts=resolved_concepts,
                root_concept_label=resolved_root_label,
                root_concept_norm=resolved_root_norm,
                key_points=result.key_points,
                reading_time_minutes=result.reading_time_minutes,
                language=result.language,
                content_type=str(content_type),
                type_metadata=type_metadata,
                og_image_source_url=og_image_url,
                ai_provider=provider,
                ai_model=model_name,
            )
            session.add(summary)

            from sqlalchemy import update

            await session.execute(
                update(Article)
                .where(Article.id == article_id)
                .values(status="analyzed")
            )
            await session.commit()
            logger.info(
                "Summary saved and status updated to analyzed",
                article_id=str(article_id),
            )

        logger.info("Article analysis complete", article_id=str(article_id))

        _duration = _time.monotonic() - _start_time
        AI_SUMMARY_DURATION.labels(
            provider=provider,
            content_type=str(analysis_content_type),
        ).observe(_duration)
        AI_SUMMARY_REQUESTS.labels(
            provider=provider,
            content_type=str(analysis_content_type),
            status="success",
        ).inc()
        ARTICLE_SAVE_REQUESTS.labels(status="success").inc()

        # Trigger embedding generation asynchronously.
        try:
            from src.lib.worker_client import dispatch_worker_task

            await dispatch_worker_task("embedding", {"article_id": str(article_id)})
        except Exception:
            logger.exception(
                "Failed to dispatch embedding task",
                article_id=str(article_id),
            )
        return True
    except Exception as e:
        _duration = _time.monotonic() - _start_time
        AI_SUMMARY_DURATION.labels(
            provider=provider,
            content_type=str(analysis_content_type),
        ).observe(_duration)
        AI_SUMMARY_REQUESTS.labels(
            provider=provider,
            content_type=str(analysis_content_type),
            status="failed",
        ).inc()
        ARTICLE_SAVE_REQUESTS.labels(status="failed").inc()

        logger.exception(
            "Article analysis failed",
            article_id=str(article_id),
            error_type=type(e).__name__,
            error_message=str(e),
            exc_info=True,
        )
        try:
            from sqlalchemy import update

            async with async_session_factory() as session:
                await session.execute(
                    update(Article)
                    .where(Article.id == article_id)
                    .values(status="failed")
                )
                await session.commit()
                logger.info("Status updated to failed", article_id=str(article_id))
        except Exception as db_error:
            logger.exception(
                "Failed to mark article as failed",
                article_id=str(article_id),
                db_error_type=type(db_error).__name__,
                db_error_message=str(db_error),
            )
        return False
    finally:
        BACKGROUND_TASKS_ACTIVE.dec()


async def _run_analysis_async(
    article_id: uuid.UUID,
    title: str,
    content: str,
    provider: Literal["gemini", "openai"],
    summary_language: str,
    user_id: str,
    article_url: str | None = None,
) -> None:
    """Background wrapper to run analysis and update summary usage."""
    logger.info(
        "Background analysis task started",
        article_id=str(article_id),
        user_id=user_id,
        provider=provider,
    )
    try:
        ok = await _run_analysis(
            article_id,
            title,
            content,
            provider,
            summary_language=summary_language,
            article_url=article_url,
        )
    except Exception as exc:
        logger.exception(
            "Analysis wrapper failed for article",
            article_id=str(article_id),
            error=str(exc),
        )
        try:
            await service.update_article_status(article_id, "failed")
        except Exception:
            logger.exception(
                "Failed to mark article as failed from wrapper",
                article_id=str(article_id),
            )
        return

    if not ok:
        return

    logger.info(
        "Analysis succeeded, incrementing summary usage",
        article_id=str(article_id),
        user_id=user_id,
    )

    from src.lib.database import async_session_factory

    try:
        async with async_session_factory() as session:
            await sub_service.increment_summary_usage(session, user_id)
            await session.commit()
    except Exception:
        logger.exception(
            "Failed to increment summary usage after successful analysis",
            article_id=str(article_id),
            user_id=user_id,
        )


@router.post("", response_model=ArticleResponse, status_code=status.HTTP_201_CREATED)
async def create_article(
    data: ArticleCreate,
    db: DBSession,
    user: CurrentUser,
) -> ArticleResponse:
    # Check analysis credit
    usage_info = await sub_service.get_usage_info(db, user.id)
    if not usage_info.can_summarize:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Analysis limit reached. Upgrade to Pro for unlimited.",
        )

    requested_content_type = (
        classify_url(data.url) if data.url else ContentType.GENERAL_NEWS
    )
    enforce_content_type_access(usage_info.plan, requested_content_type)

    article = await service.create_article(db, user.id, data)
    await db.commit()

    selected_provider: Literal["gemini", "openai"] = "gemini"
    ok = await _run_analysis(
        article.id,
        article.title,
        article.content,
        selected_provider,
        article_url=article.url,
    )
    if ok:
        await sub_service.increment_summary_usage(db, user.id)
        await db.commit()
    updated = await service.get_article(db, article.id, user.id)
    if updated:
        article = updated

    return ArticleResponse.model_validate(article)


@router.get("", response_model=PaginatedResponse[ArticleListResponse])
async def list_articles(
    db: DBSession,
    user: CurrentUser,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    search: str | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    content_type_filter: str | None = Query(default=None, alias="content_type"),
) -> PaginatedResponse[ArticleListResponse]:
    return await service.list_articles(
        db,
        user.id,
        page=page,
        limit=limit,
        search=search,
        status_filter=status_filter,
        content_type_filter=content_type_filter,
    )


@router.get("/search", response_model=PaginatedResponse[ArticleListResponse])
async def search_articles(
    db: DBSession,
    user: CurrentUser,
    ai: AIService,
    q: str = Query(min_length=2),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    status_filter: str | None = Query(default=None, alias="status"),
    content_type_filter: str | None = Query(default=None, alias="content_type"),
) -> PaginatedResponse[ArticleListResponse]:
    _search_start = _time.monotonic()
    try:
        embedding = await ai.generate_embedding(q)
        result = await service.search_articles_semantic(
            db,
            user.id,
            embedding,
            page=page,
            limit=limit,
            status_filter=status_filter,
            content_type_filter=content_type_filter,
        )
        SEARCH_REQUESTS.labels(type="semantic").inc()
        SEARCH_DURATION.labels(type="semantic").observe(
            _time.monotonic() - _search_start
        )
        return result
    except Exception:
        logger.warning("Semantic search failed, falling back to text search", query=q)
        result = await service.list_articles(
            db,
            user.id,
            page=page,
            limit=limit,
            search=q,
            status_filter=status_filter,
            content_type_filter=content_type_filter,
        )
        SEARCH_REQUESTS.labels(type="fallback_text").inc()
        SEARCH_DURATION.labels(type="fallback_text").observe(
            _time.monotonic() - _search_start
        )
        return result


@router.get("/stats/content-types", response_model=ContentTypeStatsResponse)
async def get_content_type_stats(
    db: DBSession,
    user: CurrentUser,
) -> ContentTypeStatsResponse:
    """Return article counts grouped by content type."""
    counts = await service.get_content_type_stats(db, user.id)
    return ContentTypeStatsResponse(counts=counts, total=sum(counts.values()))


@router.get("/my-shares", response_model=list[MyShareLinkItem])
async def list_my_shares(
    db: DBSession,
    user: CurrentUser,
) -> list[MyShareLinkItem]:
    return await service.list_my_share_links(db, _parse_user_uuid_or_raise(user.id))


@router.post("/{article_id}/share-link", response_model=ArticleShareLinkResponse)
async def create_article_share_link(
    article_id: uuid.UUID,
    db: DBSession,
    user: CurrentUser,
    payload: ArticleShareLinkCreate | None = None,
) -> ArticleShareLinkResponse:
    try:
        share_link = await service.create_or_regenerate_share_link(
            db=db,
            article_id=article_id,
            owner_user_id=_parse_user_uuid_or_raise(user.id),
            config=payload,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    await db.commit()
    return share_link


@router.delete("/{article_id}/share-link", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_article_share_link(
    article_id: uuid.UUID,
    db: DBSession,
    user: CurrentUser,
) -> None:
    revoked = await service.revoke_share_link(
        db=db,
        article_id=article_id,
        owner_user_id=_parse_user_uuid_or_raise(user.id),
    )
    if not revoked:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Share link not found",
        )
    await db.commit()


@router.get("/share/{share_id}", response_model=SharedArticleSummaryResponse)
async def get_shared_article(
    share_id: uuid.UUID,
    db: DBSession,
    user: OptionalUser,
    token: str | None = Query(default=None),
    no_track: bool = Query(default=False),
) -> SharedArticleSummaryResponse:
    shared = await service.get_shared_article_by_token(
        db=db,
        share_id=share_id,
        token=token,
        viewer_user_id=user.id if user else None,
        track_view=not no_track,
    )
    if shared is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shared article not found",
        )
    return shared


@router.get("/share/by-slug/{share_slug}", response_model=SharedArticleSummaryResponse)
async def get_shared_article_by_slug(
    share_slug: str,
    db: DBSession,
    user: OptionalUser,
    token: str | None = Query(default=None),
    no_track: bool = Query(default=False),
) -> SharedArticleSummaryResponse:
    shared = await service.get_shared_article_by_slug(
        db=db,
        share_slug=share_slug,
        token=token,
        viewer_user_id=user.id if user else None,
        track_view=not no_track,
    )
    if shared is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shared article not found",
        )
    return shared


@router.get("/share/og-image/{share_slug}")
async def get_shared_article_og_image(
    share_slug: str,
    db: DBSession,
    user: OptionalUser,
    token: str | None = Query(default=None),
) -> Response:
    from src.articles.og_image import generate_og_image

    shared = await service.get_shared_article_by_slug(
        db=db,
        share_slug=share_slug,
        token=token,
        viewer_user_id=user.id if user else None,
        track_view=False,
    )
    if shared is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shared article not found",
        )

    # 1) Manual thumbnail override (user-specified image)
    thumbnail_mode = getattr(shared, "thumbnail_mode", "default")
    thumbnail_url = getattr(shared, "thumbnail_url", None)
    if thumbnail_mode == "manual" and isinstance(thumbnail_url, str):
        derived = await _generate_og_from_thumbnail_url(thumbnail_url.strip())
        if derived is not None:
            return Response(
                content=derived,
                media_type="image/png",
                headers={"Cache-Control": "public, max-age=86400"},
            )

    # 2) Source og:image from original article (auto-extracted)
    from sqlalchemy import select

    from src.articles.model import ArticleSummary as SummaryModel

    row = await db.execute(
        select(SummaryModel.og_image_source_url).where(
            SummaryModel.article_id == shared.article_id
        )
    )
    og_source_url = row.scalar_one_or_none()

    if og_source_url and _is_public_thumbnail_url(og_source_url):
        from fastapi.responses import RedirectResponse

        return RedirectResponse(
            url=og_source_url,
            status_code=302,
            headers={"Cache-Control": "public, max-age=86400"},
        )

    # 2b) Live extraction: fetch og:image from source URL and cache in DB
    if og_source_url is None and shared.url:
        try:
            live_og_url = await extract_og_image_url(shared.url)
        except Exception:
            live_og_url = None

        if live_og_url and _is_public_thumbnail_url(live_og_url):
            # Cache for future requests
            from sqlalchemy import update as sql_update

            await db.execute(
                sql_update(SummaryModel)
                .where(SummaryModel.article_id == shared.article_id)
                .values(og_image_source_url=live_og_url)
            )
            await db.commit()

            from fastapi.responses import RedirectResponse

            return RedirectResponse(
                url=live_og_url,
                status_code=302,
                headers={"Cache-Control": "public, max-age=86400"},
            )

    # 3) Fallback: generate gradient card with Pillow
    png_bytes = generate_og_image(
        title=shared.title,
        summary=shared.summary,
        content_type=shared.content_type,
        article_url=shared.url,
    )
    return Response(
        content=png_bytes,
        media_type="image/png",
        headers={"Cache-Control": "public, max-age=86400"},
    )


@router.get(
    "/share/by-user/{username}/{share_slug}",
    response_model=SharedArticleSummaryResponse,
)
async def get_shared_article_by_username(
    username: str,
    share_slug: str,
    db: DBSession,
    user: OptionalUser,
) -> SharedArticleSummaryResponse:
    shared = await service.get_shared_article_by_username(
        db=db,
        username=username,
        share_slug=share_slug,
        viewer_user_id=user.id if user else None,
    )
    if shared is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shared article not found",
        )
    return shared


@router.get(
    "/share/{share_id}/comments",
    response_model=list[SharedArticleCommentResponse],
)
async def get_shared_article_comments(
    share_id: uuid.UUID,
    db: DBSession,
    user: OptionalUser,
    token: str | None = Query(default=None),
) -> list[SharedArticleCommentResponse]:
    comments = await service.list_shared_article_comments(
        db=db,
        share_id=share_id,
        token=token,
        viewer_user_id=user.id if user else None,
    )
    if comments is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shared article not found",
        )
    return comments


@router.post(
    "/share/{share_id}/comments",
    response_model=SharedArticleCommentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def post_shared_article_comment(
    share_id: uuid.UUID,
    payload: SharedArticleCommentCreate,
    db: DBSession,
    user: CurrentUser,
    token: str | None = Query(default=None),
) -> SharedArticleCommentResponse:
    comment = await service.create_shared_article_comment(
        db=db,
        share_id=share_id,
        token=token,
        user_id=user.id,
        payload=payload,
    )
    if comment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shared article not found",
        )
    await db.commit()
    return comment


@router.patch(
    "/share/{share_id}/comments/{comment_id}",
    response_model=SharedArticleCommentResponse,
)
async def patch_shared_article_comment(
    share_id: uuid.UUID,
    comment_id: uuid.UUID,
    payload: SharedArticleCommentUpdate,
    db: DBSession,
    user: CurrentUser,
    token: str | None = Query(default=None),
) -> SharedArticleCommentResponse:
    comment = await service.update_shared_article_comment(
        db=db,
        share_id=share_id,
        token=token,
        comment_id=comment_id,
        user_id=user.id,
        payload=payload,
    )
    if comment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shared article comment not found",
        )
    await db.commit()
    return comment


@router.delete(
    "/share/{share_id}/comments/{comment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_shared_article_comment(
    share_id: uuid.UUID,
    comment_id: uuid.UUID,
    db: DBSession,
    user: CurrentUser,
    token: str | None = Query(default=None),
) -> None:
    deleted = await service.delete_shared_article_comment(
        db=db,
        share_id=share_id,
        token=token,
        comment_id=comment_id,
        user_id=user.id,
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shared article comment not found",
        )
    await db.commit()


@router.post(
    "/share/{share_id}/comments/{comment_id}/empathy",
    response_model=SharedArticleCommentEmpathyResponse,
)
async def post_shared_article_comment_empathy(
    share_id: uuid.UUID,
    comment_id: uuid.UUID,
    db: DBSession,
    user: CurrentUser,
    token: str | None = Query(default=None),
) -> SharedArticleCommentEmpathyResponse:
    empathy = await service.toggle_shared_article_comment_empathy(
        db=db,
        share_id=share_id,
        token=token,
        comment_id=comment_id,
        user_id=user.id,
    )
    if empathy is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shared article not found",
        )
    await db.commit()
    return empathy


@router.post(
    "/share/{share_id}/empathy",
    response_model=SharedArticleEmpathyResponse,
)
async def post_shared_article_empathy(
    share_id: uuid.UUID,
    db: DBSession,
    user: CurrentUser,
    token: str | None = Query(default=None),
) -> SharedArticleEmpathyResponse:
    empathy = await service.toggle_shared_article_empathy(
        db=db,
        share_id=share_id,
        token=token,
        user_id=user.id,
    )
    if empathy is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shared article not found",
        )
    await db.commit()
    return empathy


@router.get("/{article_id}", response_model=ArticleResponse)
async def get_article(
    article_id: uuid.UUID,
    db: DBSession,
    user: CurrentUser,
) -> ArticleResponse:
    article = await service.get_article(db, article_id, user.id)
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article not found",
        )
    return ArticleResponse.model_validate(article)


@router.patch("/{article_id}", response_model=ArticleResponse)
async def update_article(
    article_id: uuid.UUID,
    data: ArticleUpdate,
    db: DBSession,
    user: CurrentUser,
) -> ArticleResponse:
    article = await service.update_article(db, article_id, user.id, data)
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article not found",
        )
    await db.commit()
    return ArticleResponse.model_validate(article)


@router.delete("/{article_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_article(
    article_id: uuid.UUID,
    db: DBSession,
    user: CurrentUser,
) -> None:
    deleted = await service.delete_article(db, article_id, user.id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article not found",
        )


@router.get("/{article_id}/similar", response_model=list[SimilarArticleResponse])
async def get_similar_articles(
    article_id: uuid.UUID,
    db: DBSession,
    user: CurrentUser,
    limit: int = Query(default=5, ge=1, le=20),
) -> list[SimilarArticleResponse]:
    # Verify article exists and belongs to user
    article = await service.get_article(db, article_id, user.id)
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article not found",
        )
    return await service.get_similar_articles(db, article_id, user.id, limit=limit)


@router.post("/{article_id}/retry", response_model=ArticleResponse)
async def retry_article_analysis(
    article_id: uuid.UUID,
    db: DBSession,
    user: CurrentUser,
) -> ArticleResponse:
    article = await service.get_article(db, article_id, user.id)
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article not found",
        )

    if article.status != "failed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only retry failed articles",
        )

    usage_info = await sub_service.get_usage_info(db, user.id)
    if not usage_info.can_summarize:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Analysis limit reached. Upgrade to Pro for unlimited.",
        )

    requested_content_type = resolve_content_type_for_retry(article)
    enforce_content_type_access(usage_info.plan, requested_content_type)

    await service.update_article_status(article.id, "processing")
    article.status = "processing"

    selected_provider: Literal["gemini", "openai"] = "gemini"

    summary_language = resolve_summary_language_for_retry(article)

    task = asyncio.create_task(
        _run_analysis_async(
            article.id,
            article.title,
            article.content,
            selected_provider,
            summary_language,
            user.id,
            article_url=article.url,
        ),
        name=f"article-analysis-retry-{article.id}",
    )
    _background_tasks.add(task)
    task.add_done_callback(_background_tasks.discard)

    return ArticleResponse.model_validate(article)


_LOCALE_SEGMENT_PATTERN = re.compile(r"^[a-z]{2}(?:-[a-zA-Z]{2})?$")
_MAX_THUMBNAIL_DOWNLOAD_BYTES = 8 * 1024 * 1024
_OG_FETCH_TIMEOUT_SECONDS = 8.0
_OG_META_FETCH_TIMEOUT_SECONDS = 5.0
_OG_META_MAX_BYTES = 256 * 1024  # Only need <head> section


async def extract_og_image_url(article_url: str) -> str | None:
    """Extract og:image URL from a web page's <head> meta tags."""
    if not article_url or not _is_public_thumbnail_url(article_url):
        return None

    try:
        async with (
            httpx.AsyncClient(
                follow_redirects=True,
                timeout=_OG_META_FETCH_TIMEOUT_SECONDS,
            ) as client,
            client.stream("GET", article_url) as response,
        ):
                if response.status_code != 200:
                    return None
                content_type = response.headers.get("content-type", "").lower()
                if "html" not in content_type:
                    return None
                chunks: list[bytes] = []
                total = 0
                async for chunk in response.aiter_bytes(chunk_size=8192):
                    chunks.append(chunk)
                    total += len(chunk)
                    if total >= _OG_META_MAX_BYTES:
                        break
        head_html = b"".join(chunks).decode("utf-8", errors="ignore")
    except (httpx.HTTPError, UnicodeDecodeError):
        return None

    import re as _re

    match = _re.search(
        r'<meta\s[^>]*property=["\']og:image["\'][^>]*content=["\']([^"\']+)["\']',
        head_html,
        _re.IGNORECASE,
    )
    if not match:
        match = _re.search(
            r'<meta\s[^>]*content=["\']([^"\']+)["\'][^>]*property=["\']og:image["\']',
            head_html,
            _re.IGNORECASE,
        )
    if not match:
        return None

    og_url = match.group(1).strip()
    if not og_url:
        return None

    # Resolve relative URLs
    if og_url.startswith("//"):
        og_url = "https:" + og_url
    elif og_url.startswith("/"):
        from urllib.parse import urlparse as _urlparse

        parsed = _urlparse(article_url)
        og_url = f"{parsed.scheme}://{parsed.netloc}{og_url}"

    if not og_url.startswith(("http://", "https://")):
        return None

    return og_url


def _normalize_hostname(hostname: str | None) -> str:
    if not hostname:
        return ""
    return hostname.lower().removeprefix("www.")


def _is_nod_patch_note_url(url: str) -> bool:
    from urllib.parse import urlparse

    parsed = urlparse(url)
    if _normalize_hostname(parsed.hostname) != "nod-archive.com":
        return False

    segments = [segment for segment in parsed.path.split("/") if segment]
    if len(segments) != 3:
        return False

    locale_segment, changelog_segment, version_segment = segments
    if changelog_segment.lower() != "changelog":
        return False
    if not _LOCALE_SEGMENT_PATTERN.match(locale_segment):
        return False

    return bool(version_segment)


def _attach_patch_note_tag(
    type_metadata: dict[str, object], article_url: str | None
) -> dict[str, object]:
    if not article_url or not _is_nod_patch_note_url(article_url):
        return type_metadata

    raw_tags = type_metadata.get("tags")
    tags: list[str] = []
    if isinstance(raw_tags, list):
        tags = [tag.strip() for tag in raw_tags if isinstance(tag, str) and tag.strip()]
    elif isinstance(raw_tags, str) and raw_tags.strip():
        tags = [raw_tags.strip()]

    if "patch-note" not in tags:
        tags.append("patch-note")

    type_metadata["tags"] = tags
    return type_metadata


def _is_public_thumbnail_url(url: str) -> bool:
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"}:
        return False

    hostname = parsed.hostname
    if not hostname:
        return False

    normalized = hostname.lower()
    if normalized in {"localhost", "127.0.0.1", "::1"}:
        return False

    try:
        ip_addr = ipaddress.ip_address(normalized)
        if (
            ip_addr.is_private
            or ip_addr.is_loopback
            or ip_addr.is_link_local
            or ip_addr.is_reserved
            or ip_addr.is_multicast
        ):
            return False
    except ValueError:
        return not normalized.endswith(".local")

    return True


async def _generate_og_from_thumbnail_url(thumbnail_url: str) -> bytes | None:
    if not _is_public_thumbnail_url(thumbnail_url):
        return None

    from src.articles.og_image import generate_og_image_from_thumbnail_bytes

    try:
        async with httpx.AsyncClient(
            follow_redirects=True,
            timeout=_OG_FETCH_TIMEOUT_SECONDS,
        ) as client:
            response = await client.get(thumbnail_url)
    except httpx.HTTPError:
        return None

    if response.status_code != status.HTTP_200_OK:
        return None

    content_type = response.headers.get("content-type", "").lower()
    if not content_type.startswith("image/"):
        return None

    body = response.content
    if not body or len(body) > _MAX_THUMBNAIL_DOWNLOAD_BYTES:
        return None

    return generate_og_image_from_thumbnail_bytes(body)


@router.post(
    "/analyze-url",
    response_model=ArticleSaveResponse,
    status_code=status.HTTP_201_CREATED,
)
async def analyze_url(
    data: ArticleAnalyzeURL,
    db: DBSession,
    user: CurrentUser,
) -> ArticleSaveResponse:
    from urllib.parse import urlparse

    parsed = urlparse(data.url)
    normalized_hostname = _normalize_hostname(parsed.hostname)
    if normalized_hostname == "nod-archive.com" and not _is_nod_patch_note_url(
        data.url
    ):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="NOD links cannot be analyzed. "
            "Please provide the original article URL.",
        )

    existing_article = await service.get_article_by_url(db, user.id, data.url)
    if existing_article:
        existing_response = ArticleSaveResponse.model_validate(existing_article)
        existing_response.already_saved = True
        return existing_response

    # Check analysis credit
    usage_info = await sub_service.get_usage_info(db, user.id)
    if not usage_info.can_summarize:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Analysis limit reached. Upgrade to Pro for unlimited.",
        )

    requested_content_type = classify_url(data.url)
    enforce_content_type_access(usage_info.plan, requested_content_type)

    title, content = await prepare_analyze_url_content(
        url=data.url,
        title=data.title,
        content=data.content,
    )
    summary_language = data.summary_language or "ko"

    create_data = ArticleCreate(
        url=data.url,
        title=title,
        content=content,
        source=data.source,
        requested_summary_language=summary_language,
    )

    article = await service.create_article(db, user.id, create_data)
    await db.commit()

    selected_provider: Literal["gemini", "openai"] = "gemini"
    await service.update_article_status(article.id, "processing")
    article.status = "processing"

    analysis_task = asyncio.create_task(
        _run_analysis_async(
            article.id,
            article.title,
            article.content,
            selected_provider,
            summary_language,
            user.id,
            article_url=data.url,
        ),
        name=f"article-analysis-{article.id}",
    )
    _background_tasks.add(analysis_task)
    analysis_task.add_done_callback(_background_tasks.discard)
    logger.info(
        "Dispatched article analysis task",
        article_id=str(article.id),
        task_name=analysis_task.get_name(),
    )

    return ArticleSaveResponse.model_validate(article)
