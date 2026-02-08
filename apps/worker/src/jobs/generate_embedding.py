import uuid

import structlog
from sqlalchemy import select

# Reuse models from analyze_article
from src.jobs.analyze_article import Article, ArticleEmbedding, ArticleSummary
from src.lib.ai.factory import create_ai_provider
from src.lib.ai.prompts import EMBEDDING_TEXT_TEMPLATE
from src.lib.config import settings
from src.lib.database import async_session_factory
from src.lib.retry import with_retry

logger = structlog.get_logger(__name__)


@with_retry(max_attempts=3)
async def generate_embedding(article_id: str) -> None:
    """Generate embedding for an article using its title and summary."""
    logger.info("Starting embedding generation", article_id=article_id)
    aid = uuid.UUID(article_id)

    async with async_session_factory() as session:
        # Fetch article and summary
        result = await session.execute(select(Article).where(Article.id == aid))
        article = result.scalar_one_or_none()

        if not article:
            logger.error("Article not found", article_id=article_id)
            return

        summary_result = await session.execute(
            select(ArticleSummary).where(ArticleSummary.article_id == aid)
        )
        summary = summary_result.scalar_one_or_none()

        if not summary:
            logger.error("Article summary not found", article_id=article_id)
            return

        try:
            # Compose text for embedding
            concepts_str = (
                ", ".join(summary.concepts)
                if isinstance(summary.concepts, list)
                else ""
            )
            text = EMBEDDING_TEXT_TEMPLATE.format(
                title=article.title,
                summary=summary.summary,
                concepts=concepts_str,
            )

            # Generate embedding
            ai = create_ai_provider()
            embedding_vector = await ai.generate_embedding(text)

            # Determine AI model name
            ai_model = (
                "text-embedding-3-small"
                if settings.AI_PROVIDER == "openai"
                else "text-embedding-004"
            )

            # Create embedding record
            embedding = ArticleEmbedding(
                article_id=aid,
                embedding=embedding_vector,
                ai_provider=settings.AI_PROVIDER,
                ai_model=ai_model,
            )
            session.add(embedding)

            # Update article status to completed
            article.status = "completed"
            await session.commit()

            logger.info("Embedding generation completed", article_id=article_id)

        except Exception:
            logger.exception("Embedding generation failed", article_id=article_id)
            article.status = "failed"
            await session.commit()
            raise
