import asyncio
import uuid
from typing import Literal

import structlog
from fastapi import APIRouter, HTTPException, Query, status

from src.articles import service
from src.articles.schemas import (
    ArticleAnalyzeURL,
    ArticleCreate,
    ArticleListResponse,
    ArticleResponse,
    ArticleSaveResponse,
    SimilarArticleResponse,
)
from src.common.models.pagination import PaginatedResponse
from src.lib.config import settings
from src.lib.dependencies import AIService, CurrentUser, DBSession
from src.subscriptions import service as sub_service

# Keep references to background tasks so they are not garbage-collected.
_background_tasks: set[asyncio.Task] = set()  # type: ignore[type-arg]

logger = structlog.get_logger(__name__)

router = APIRouter()


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

    try:
        logger.info(
            "Calling summarize_article", article_id=str(article_id), provider=provider
        )
        result, content_type = await summarize_article(
            title,
            content,
            url=article_url,
            provider=provider,
            summary_language=summary_language,
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
                k: v
                for k, v in result.model_dump().items()
                if k not in base_fields
            }

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
        if ok:
            logger.info(
                "Analysis succeeded, incrementing summary usage",
                article_id=str(article_id),
                user_id=user_id,
            )
            from src.lib.database import async_session_factory

            async with async_session_factory() as session:
                await sub_service.increment_summary_usage(session, user_id)
                await session.commit()
    except Exception as exc:
        logger.exception(
            "Analysis wrapper failed for article",
            article_id=str(article_id),
            error=str(exc),
        )


@router.post("", response_model=ArticleResponse, status_code=status.HTTP_201_CREATED)
async def create_article(
    data: ArticleCreate,
    db: DBSession,
    user: CurrentUser,
) -> ArticleResponse:
    # Check article save limit
    usage_info = await sub_service.get_usage_info(db, user.id)
    if not usage_info.can_save_article:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Article save limit reached. Upgrade to Pro for unlimited articles.",
        )

    article = await service.create_article(db, user.id, data)
    await sub_service.increment_article_usage(db, user.id)
    await db.commit()

    # Check usage limits before running analysis
    if usage_info.can_summarize:
        selected_provider: Literal["gemini", "openai"] = "gemini"
        ok = await _run_analysis(
            article.id, article.title, article.content, selected_provider,
            article_url=article.url,
        )
        if ok:
            await sub_service.increment_summary_usage(db, user.id)
            await db.commit()
        updated = await service.get_article(db, article.id, user.id)
        if updated:
            article = updated
    else:
        await service.update_article_status(article.id, "completed")
        article.status = "completed"
        await db.commit()
        logger.info("Summary limit reached, skipping analysis", user_id=str(user.id))

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
        db, user.id, page=page, limit=limit, search=search,
        status_filter=status_filter, content_type_filter=content_type_filter,
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
    try:
        embedding = await ai.generate_embedding(q)
        return await service.search_articles_semantic(
            db, user.id, embedding, page=page, limit=limit,
            status_filter=status_filter, content_type_filter=content_type_filter,
        )
    except Exception:
        logger.warning("Semantic search failed, falling back to text search", query=q)
        return await service.list_articles(
            db, user.id, page=page, limit=limit, search=q,
            status_filter=status_filter, content_type_filter=content_type_filter,
        )


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
            detail="Summary limit reached. Upgrade to Pro for more summaries.",
        )

    await service.update_article_status(article.id, "processing")
    article.status = "processing"

    selected_provider: Literal["gemini", "openai"] = "gemini"

    summary_language = "ko"
    if article.summary and article.summary.language:
        summary_language = article.summary.language

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
    """Convenience endpoint for the Chrome Extension.

    Accepts a URL plus pre-extracted content.
    """
    create_data = ArticleCreate(
        url=data.url,
        title=data.title,
        content=data.content,
        source=data.source,
    )
    summary_language = data.summary_language or "ko"

    existing_article = await service.get_article_by_url(db, user.id, data.url)
    if existing_article:
        existing_response = ArticleSaveResponse.model_validate(existing_article)
        existing_response.already_saved = True
        return existing_response

    # Check article save limit
    usage_info = await sub_service.get_usage_info(db, user.id)
    if not usage_info.can_save_article:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Article save limit reached. Upgrade to Pro for unlimited articles.",
        )

    article = await service.create_article(db, user.id, create_data)
    await sub_service.increment_article_usage(db, user.id)
    await db.commit()

    # Check usage limits before running analysis
    if usage_info.can_summarize:
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

        # Keep sync path for create endpoint unchanged.
    else:
        await service.update_article_status(article.id, "completed")
        article.status = "completed"
        await db.commit()
        logger.info(
            "Summary limit reached, marked article as completed without analysis",
            user_id=str(user.id),
        )

    return ArticleSaveResponse.model_validate(article)
