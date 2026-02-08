import uuid

import structlog
from fastapi import APIRouter, HTTPException, Query, status

from src.articles import service
from src.articles.schemas import (
    ArticleAnalyzeURL,
    ArticleCreate,
    ArticleListResponse,
    ArticleResponse,
    SimilarArticleResponse,
)
from src.common.models.pagination import PaginatedResponse
from src.lib.dependencies import CurrentUser, DBSession
from src.subscriptions import service as sub_service

logger = structlog.get_logger(__name__)

router = APIRouter()


async def _run_analysis(article_id: uuid.UUID, title: str, content: str) -> None:
    """Background task: summarize article with AI and save to DB."""
    from src.articles.model import Article, ArticleSummary
    from src.lib.ai_service import summarize_article
    from src.lib.database import async_session_factory

    try:
        result = await summarize_article(title, content)

        from src.lib.config import settings as app_settings

        provider = app_settings.AI_PROVIDER
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
    except Exception:
        logger.exception("Article analysis failed", article_id=str(article_id))


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
        await _run_analysis(article.id, article.title, article.content)
        await sub_service.increment_summary_usage(db, user.id)
        await db.commit()
        article = await service.get_article(db, article.id, user.id)
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
        await _run_analysis(article.id, article.title, article.content)
        await sub_service.increment_summary_usage(db, user.id)
        await db.commit()
        article = await service.get_article(db, article.id, user.id)
    else:
        logger.info("Summary limit reached, skipping analysis", user_id=str(user.id))

    return ArticleResponse.model_validate(article)
