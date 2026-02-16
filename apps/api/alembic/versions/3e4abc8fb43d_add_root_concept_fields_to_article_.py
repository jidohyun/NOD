"""add root concept fields to article summaries

Revision ID: 3e4abc8fb43d
Revises: 9d2c4a7b1f3e
Create Date: 2026-02-12 10:33:25.573453

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "3e4abc8fb43d"
down_revision: str | None = "9d2c4a7b1f3e"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "article_summaries",
        sa.Column("root_concept_label", sa.String(length=255), nullable=True),
    )
    op.add_column(
        "article_summaries",
        sa.Column("root_concept_norm", sa.String(length=255), nullable=True),
    )
    op.create_index(
        "ix_article_summaries_root_concept_norm",
        "article_summaries",
        ["root_concept_norm"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_article_summaries_root_concept_norm",
        table_name="article_summaries",
    )
    op.drop_column("article_summaries", "root_concept_norm")
    op.drop_column("article_summaries", "root_concept_label")
