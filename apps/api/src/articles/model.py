# pyright: reportMissingTypeStubs=false

import uuid as uuid_lib
from datetime import datetime

from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.common.models.base import TimestampMixin, UUIDMixin
from src.lib.database import Base
from src.users.model import User


class Article(UUIDMixin, TimestampMixin, Base):
    __tablename__: str = "articles"

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
        String(20), nullable=False, server_default=text("'pending'"), index=True
    )

    # Relationships
    summary: Mapped["ArticleSummary | None"] = relationship(
        back_populates="article", uselist=False, cascade="all, delete-orphan"
    )
    embedding: Mapped["ArticleEmbedding | None"] = relationship(
        back_populates="article", uselist=False, cascade="all, delete-orphan"
    )
    share_link: Mapped["ArticleShareLink | None"] = relationship(
        back_populates="article", uselist=False, cascade="all, delete-orphan"
    )


class ArticleShareLink(UUIDMixin, TimestampMixin, Base):
    __tablename__: str = "article_share_links"

    article_id: Mapped[uuid_lib.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("articles.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    owner_user_id: Mapped[uuid_lib.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    token_hash: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    share_slug: Mapped[str] = mapped_column(String(180), nullable=False, index=True)
    share_sid: Mapped[str] = mapped_column(String(12), nullable=False, unique=True)
    url_mode: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        server_default=text("'default'"),
    )
    custom_url: Mapped[str | None] = mapped_column(String(180), nullable=True)
    thumbnail_mode: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        server_default=text("'default'"),
    )
    thumbnail_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    is_public: Mapped[bool] = mapped_column(
        nullable=False,
        server_default=text("true"),
    )
    expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    revoked_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    view_count: Mapped[int] = mapped_column(
        Integer, nullable=False, server_default=text("0")
    )
    last_viewed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    article: Mapped["Article"] = relationship(back_populates="share_link")
    owner_user: Mapped["User"] = relationship(User)
    comments: Mapped[list["ArticleShareComment"]] = relationship(
        back_populates="share_link",
        cascade="all, delete-orphan",
        order_by="ArticleShareComment.created_at.desc()",
    )
    empathy_reactions: Mapped[list["ArticleShareEmpathy"]] = relationship(
        back_populates="share_link",
        cascade="all, delete-orphan",
    )
    slug_histories: Mapped[list["ArticleShareSlugHistory"]] = relationship(
        back_populates="share_link",
        cascade="all, delete-orphan",
        order_by="ArticleShareSlugHistory.created_at.desc()",
    )


class ArticleShareSlugHistory(UUIDMixin, TimestampMixin, Base):
    __tablename__: str = "article_share_slug_histories"
    __table_args__ = (
        UniqueConstraint(
            "share_link_id",
            "slug",
            name="uq_article_share_slug_histories_share_slug",
        ),
    )

    share_link_id: Mapped[uuid_lib.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("article_share_links.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    slug: Mapped[str] = mapped_column(String(180), nullable=False, index=True)

    share_link: Mapped["ArticleShareLink"] = relationship(
        "ArticleShareLink",
        back_populates="slug_histories",
    )


class ArticleShareComment(UUIDMixin, TimestampMixin, Base):
    __tablename__: str = "article_share_comments"

    share_link_id: Mapped[uuid_lib.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("article_share_links.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    author_name: Mapped[str] = mapped_column(String(80), nullable=False)
    author_image: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    author_user_id: Mapped[uuid_lib.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    parent_comment_id: Mapped[uuid_lib.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("article_share_comments.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)

    share_link: Mapped["ArticleShareLink"] = relationship(back_populates="comments")
    author_user: Mapped["User"] = relationship(User)
    parent_comment: Mapped["ArticleShareComment | None"] = relationship(
        "ArticleShareComment",
        remote_side="ArticleShareComment.id",
        back_populates="replies",
    )
    replies: Mapped[list["ArticleShareComment"]] = relationship(
        "ArticleShareComment",
        back_populates="parent_comment",
    )
    empathy_reactions: Mapped[list["ArticleShareCommentEmpathy"]] = relationship(
        back_populates="comment",
        cascade="all, delete-orphan",
    )


class ArticleShareCommentEmpathy(UUIDMixin, TimestampMixin, Base):
    __tablename__: str = "article_share_comment_empathies"
    __table_args__ = (
        UniqueConstraint(
            "comment_id",
            "user_id",
            name="uq_article_share_comment_empathies_comment_user",
        ),
    )

    comment_id: Mapped[uuid_lib.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("article_share_comments.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[uuid_lib.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    comment: Mapped["ArticleShareComment"] = relationship(
        "ArticleShareComment",
        back_populates="empathy_reactions",
    )
    user: Mapped["User"] = relationship(User)


class ArticleShareEmpathy(UUIDMixin, TimestampMixin, Base):
    __tablename__: str = "article_share_empathies"
    __table_args__ = (
        UniqueConstraint(
            "share_link_id",
            "user_id",
            name="uq_article_share_empathies_share_link_user",
        ),
    )

    share_link_id: Mapped[uuid_lib.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("article_share_links.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[uuid_lib.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    share_link: Mapped["ArticleShareLink"] = relationship(
        back_populates="empathy_reactions"
    )
    user: Mapped["User"] = relationship(User)


class ArticleSummary(UUIDMixin, TimestampMixin, Base):
    __tablename__: str = "article_summaries"

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
        String(30), nullable=False, server_default=text("'general_news'"), index=True
    )
    type_metadata: Mapped[dict[str, object]] = mapped_column(
        JSON, nullable=False, server_default=text("'{}'")
    )
    ai_provider: Mapped[str] = mapped_column(String(50), nullable=False)
    ai_model: Mapped[str] = mapped_column(String(100), nullable=False)

    # Relationships
    article: Mapped["Article"] = relationship(back_populates="summary")


class ArticleEmbedding(UUIDMixin, TimestampMixin, Base):
    __tablename__: str = "article_embeddings"

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
