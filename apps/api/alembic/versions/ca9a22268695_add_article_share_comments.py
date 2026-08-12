"""add article share comments

Revision ID: ca9a22268695
Revises: b4d8c1e2f3a4
Create Date: 2026-03-22 00:50:26.933647

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "ca9a22268695"
down_revision: str | None = "b4d8c1e2f3a4"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    _ = op.create_table(
        "article_share_comments",
        sa.Column(
            "id",
            sa.UUID(),
            nullable=False,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "share_link_id",
            sa.UUID(),
            sa.ForeignKey("article_share_links.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("author_name", sa.String(length=80), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id", name="pk_article_share_comments"),
    )
    op.create_index(
        op.f("ix_article_share_comments_share_link_id"),
        "article_share_comments",
        ["share_link_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_article_share_comments_share_link_id"),
        table_name="article_share_comments",
    )
    op.drop_table("article_share_comments")
