"""rename_og_to_thumbnail_in_share_links

Revision ID: e62e7f6149f7
Revises: 5f1c9d3a7e22
Create Date: 2026-03-23 15:10:57.780866

"""
from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'e62e7f6149f7'
down_revision: str | None = '5f1c9d3a7e22'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.alter_column(
        'article_share_links', 'og_mode',
        new_column_name='thumbnail_mode',
    )
    op.alter_column(
        'article_share_links', 'og_image_url',
        new_column_name='thumbnail_url',
    )


def downgrade() -> None:
    op.alter_column(
        'article_share_links', 'thumbnail_mode',
        new_column_name='og_mode',
    )
    op.alter_column(
        'article_share_links', 'thumbnail_url',
        new_column_name='og_image_url',
    )
