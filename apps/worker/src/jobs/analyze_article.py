import uuid
from datetime import datetime

import structlog
from pgvector.sqlalchemy import Vector  # type: ignore[import-untyped]
from sqlalchemy import DateTime, Integer, String, Text, func, select
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.lib.ai.factory import create_ai_provider
from src.lib.ai.prompts import ARTICLE_ANALYSIS_PROMPT
from src.lib.ai.schemas import ArticleAnalysisResult
from src.lib.config import settings
from src.lib.database import Base, async_session_factory
from src.lib.retry import with_retry

logger = structlog.get_logger(__name__)


class Article(Base):
    __tablename__ = "articles"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    source: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )


class ArticleSummary(Base):
    __tablename__ = "article_summaries"
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    article_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), unique=True, nullable=False
    )
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    concepts: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    key_points: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    reading_time_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    language: Mapped[str | None] = mapped_column(String(10), nullable=True)
    ai_provider: Mapped[str] = mapped_column(String(50), nullable=False)
    ai_model: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )


class ArticleEmbedding(Base):
    __tablename__ = "article_embeddings"
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    article_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), unique=True, nullable=False
    )
    embedding: Mapped[list[float]] = mapped_column(Vector(768), nullable=False)
    ai_provider: Mapped[str] = mapped_column(String(50), nullable=False)
    ai_model: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )


@with_retry(max_attempts=3)
async def analyze_article(article_id: str) -> None:
    """Analyze an article: generate summary, concepts, key points."""
    logger.info("Starting article analysis", article_id=article_id)
    aid = uuid.UUID(article_id)

    async with async_session_factory() as session:
        # Fetch article
        result = await session.execute(select(Article).where(Article.id == aid))
        article = result.scalar_one_or_none()

        if not article:
            logger.error("Article not found", article_id=article_id)
            return

        # Update status to analyzing
        article.status = "analyzing"
        await session.commit()

        try:
            # Generate analysis
            ai = create_ai_provider()
            prompt = ARTICLE_ANALYSIS_PROMPT.format(
                title=article.title,
                content=article.content[:10000],  # Limit content length
            )
            analysis: ArticleAnalysisResult = await ai.generate_structured(
                prompt, ArticleAnalysisResult
            )

            # Determine AI model name
            ai_model = (
                "gpt-4o-mini"
                if settings.AI_PROVIDER == "openai"
                else "gemini-2.0-flash"
            )

            # Create summary record
            summary = ArticleSummary(
                article_id=aid,
                summary=analysis.summary,
                concepts=analysis.concepts,
                key_points=analysis.key_points,
                reading_time_minutes=analysis.reading_time_minutes,
                language=analysis.language,
                ai_provider=settings.AI_PROVIDER,
                ai_model=ai_model,
            )
            session.add(summary)
            await session.commit()

            logger.info("Article analysis completed", article_id=article_id)

            # Dispatch embedding task
            import httpx

            try:
                async with httpx.AsyncClient() as client:
                    await client.post(
                        f"{settings.WORKER_URL}/tasks/process",
                        json={
                            "task_type": "embedding",
                            "data": {"article_id": article_id},
                        },
                        timeout=10.0,
                    )
            except Exception:
                logger.exception(
                    "Failed to dispatch embedding task", article_id=article_id
                )

        except Exception:
            logger.exception("Article analysis failed", article_id=article_id)
            article.status = "failed"
            await session.commit()
            raise
