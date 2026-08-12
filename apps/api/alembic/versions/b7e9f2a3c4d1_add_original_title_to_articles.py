"""add original_title to articles

Revision ID: b7e9f2a3c4d1
Revises: a1b2c3d4e5f6
Create Date: 2026-02-19 11:15:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b7e9f2a3c4d1"
down_revision: str | None = "a1b2c3d4e5f6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "articles",
        sa.Column("original_title", sa.String(length=500), nullable=True),
    )
    # Backfill: set original_title = title for existing rows
    op.execute("UPDATE articles SET original_title = title WHERE original_title IS NULL")


def downgrade() -> None:
    op.drop_column("articles", "original_title")
