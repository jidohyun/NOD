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
    ConceptGraphResponse,
    SimilarArticleResponse,
)
from src.common.models.pagination import PaginatedResponse
from src.lib.config import settings
from src.lib.dependencies import AIService, CurrentUser, DBSession
from src.subscriptions import service as sub_service

logger = structlog.get_logger(__name__)

router = APIRouter()


async def _run_analysis(
    article_id: uuid.UUID,
    title: str,
    content: str,
    provider: Literal["gemini", "openai"],
    summary_language: str = "ko",
) -> bool:
    """Background task: summarize article with AI and save to DB."""
    from src.articles.model import Article, ArticleSummary
    from src.lib.ai_service import summarize_article
    from src.lib.database import async_session_factory

    try:
        result = await summarize_article(
            title,
            content,
            provider=provider,
            summary_language=summary_language,
        )

        model_name = "gemini-2.0-flash" if provider == "gemini" else "gpt-4o-mini"

        async with async_session_factory() as session:
            summary = ArticleSummary(
                article_id=article_id,
                summary=result.summary,
                markdown_note=result.markdown_note,
                concepts=result.concepts,
                key_points=result.key_points,
                reading_time_minutes=result.reading_time_minutes,
                language=result.language,
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
    except Exception:
        logger.exception("Article analysis failed", article_id=str(article_id))
        try:
            from sqlalchemy import update

            async with async_session_factory() as session:
                await session.execute(
                    update(Article)
                    .where(Article.id == article_id)
                    .values(status="failed")
                )
                await session.commit()
        except Exception:
            logger.exception(
                "Failed to mark article as failed",
                article_id=str(article_id),
            )
        return False


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
        # Pro plan always uses GPT-4o mini.
        selected_provider: Literal["gemini", "openai"] = (
            "openai" if usage_info.plan == "pro" else settings.AI_PROVIDER
        )
        ok = await _run_analysis(
            article.id, article.title, article.content, selected_provider
        )
        if ok:
            await sub_service.increment_summary_usage(db, user.id)
            await db.commit()
        updated = await service.get_article(db, article.id, user.id)
        if updated:
            article = updated
    else:
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
) -> PaginatedResponse[ArticleListResponse]:
    return await service.list_articles(
        db, user.id, page=page, limit=limit, search=search, status_filter=status_filter
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
) -> PaginatedResponse[ArticleListResponse]:
    try:
        embedding = await ai.generate_embedding(q)
        return await service.search_articles_semantic(
            db, user.id, embedding, page=page, limit=limit, status_filter=status_filter
        )
    except Exception:
        logger.warning("Semantic search failed, falling back to text search", query=q)
        return await service.list_articles(
            db, user.id, page=page, limit=limit, search=q, status_filter=status_filter
        )


@router.get("/graph", response_model=ConceptGraphResponse)
async def get_concept_graph(
    db: DBSession,
    user: CurrentUser,
    max_nodes: int = Query(default=1000, ge=100, le=1000),
) -> ConceptGraphResponse:
    usage_info = await sub_service.get_usage_info(db, user.id)
    if usage_info.plan != "pro":
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Graph View is available on Pro plan only.",
        )

    return await service.get_concept_graph(db, user.id, max_nodes=max_nodes)


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


@router.post(
    "/analyze-url", response_model=ArticleResponse, status_code=status.HTTP_201_CREATED
)
async def analyze_url(
    data: ArticleAnalyzeURL,
    db: DBSession,
    user: CurrentUser,
) -> ArticleResponse:
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
        selected_provider: Literal["gemini", "openai"] = (
            "openai" if usage_info.plan == "pro" else settings.AI_PROVIDER
        )
        ok = await _run_analysis(
            article.id,
            article.title,
            article.content,
            selected_provider,
            summary_language=summary_language,
        )
        if ok:
            await sub_service.increment_summary_usage(db, user.id)
            await db.commit()
        updated = await service.get_article(db, article.id, user.id)
        if updated:
            article = updated
    else:
        logger.info(
            "Summary limit reached, skipping analysis",
            user_id=str(user.id),
        )

    return ArticleResponse.model_validate(article)
