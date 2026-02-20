import uuid as uuid_lib

from pgvector.sqlalchemy import Vector
from sqlalchemy import ForeignKey, Index, Integer, String, Text, text
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.common.models.base import TimestampMixin, UUIDMixin
from src.lib.database import Base


class Article(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "articles"

    user_id: Mapped[uuid_lib.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    original_title: Mapped[str | None] = mapped_column(String(500), nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    source: Mapped[str] = mapped_column(
        String(50), nullable=False, server_default=text("'web'")
    )
    requested_summary_language: Mapped[str | None] = mapped_column(
        String(10),
        nullable=True,
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, server_default=text("'pending'")
    )

    # Relationships
    summary: Mapped["ArticleSummary | None"] = relationship(
        back_populates="article", uselist=False, cascade="all, delete-orphan"
    )
    embedding: Mapped["ArticleEmbedding | None"] = relationship(
        back_populates="article", uselist=False, cascade="all, delete-orphan"
    )


class ArticleSummary(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "article_summaries"

    article_id: Mapped[uuid_lib.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("articles.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    markdown_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    concepts: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    root_concept_label: Mapped[str | None] = mapped_column(String(255), nullable=True)
    root_concept_norm: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
        index=True,
    )
    key_points: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    reading_time_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    language: Mapped[str | None] = mapped_column(String(10), nullable=True)
    content_type: Mapped[str] = mapped_column(
        String(30), nullable=False, server_default=text("'general_news'")
    )
    type_metadata: Mapped[dict[str, object]] = mapped_column(
        JSON, nullable=False, server_default=text("'{}'")
    )
    ai_provider: Mapped[str] = mapped_column(String(50), nullable=False)
    ai_model: Mapped[str] = mapped_column(String(100), nullable=False)

    # Relationships
    article: Mapped["Article"] = relationship(back_populates="summary")


class ArticleEmbedding(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "article_embeddings"

    article_id: Mapped[uuid_lib.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("articles.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    embedding: Mapped[list[float]] = mapped_column(Vector(768), nullable=False)
    ai_provider: Mapped[str] = mapped_column(String(50), nullable=False)
    ai_model: Mapped[str] = mapped_column(String(100), nullable=False)

    # Relationships
    article: Mapped["Article"] = relationship(back_populates="embedding")


# IVFFlat index for cosine similarity search (PoC; production would use HNSW)
article_embedding_index = Index(
    "ix_article_embeddings_embedding",
    ArticleEmbedding.embedding,
    postgresql_using="ivfflat",
    postgresql_with={"lists": 100},
    postgresql_ops={"embedding": "vector_cosine_ops"},
)
