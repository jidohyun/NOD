"""add content_type and type_metadata to article_summaries

Revision ID: a1b2c3d4e5f6
Revises: 3e4abc8fb43d
Create Date: 2026-02-17 14:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: str | None = "3e4abc8fb43d"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "article_summaries",
        sa.Column(
            "content_type",
            sa.String(length=30),
            server_default=sa.text("'general_news'"),
            nullable=False,
        ),
    )
    op.add_column(
        "article_summaries",
        sa.Column(
            "type_metadata",
            sa.JSON(),
            server_default=sa.text("'{}'"),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_column("article_summaries", "type_metadata")
    op.drop_column("article_summaries", "content_type")
