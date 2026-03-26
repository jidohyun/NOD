"""add og_image_source_url to article_summaries

Revision ID: b3e7a1d9f4c2
Revises: 91c5f2d4a7b1
Create Date: 2026-03-26
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "b3e7a1d9f4c2"
down_revision: str | Sequence[str] | None = "91c5f2d4a7b1"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "article_summaries",
        sa.Column("og_image_source_url", sa.String(2048), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("article_summaries", "og_image_source_url")
