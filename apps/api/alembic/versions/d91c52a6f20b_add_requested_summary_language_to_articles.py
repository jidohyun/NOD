"""add requested_summary_language to articles

Revision ID: d91c52a6f20b
Revises: b7e9f2a3c4d1
Create Date: 2026-02-20 12:40:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "d91c52a6f20b"
down_revision: str | None = "b7e9f2a3c4d1"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "articles",
        sa.Column("requested_summary_language", sa.String(length=10), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("articles", "requested_summary_language")
