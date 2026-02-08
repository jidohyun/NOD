"""add markdown_note to article_summaries

Revision ID: 7b4a2b1c0f9a
Revises: c9364785b892
Create Date: 2026-02-08

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "7b4a2b1c0f9a"
down_revision: str | None = "c9364785b892"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "article_summaries",
        sa.Column("markdown_note", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("article_summaries", "markdown_note")
