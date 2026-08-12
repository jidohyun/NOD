from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "5f1c9d3a7e22"
down_revision: str | None = "e7c4f9a1b2d3"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "article_share_links",
        sa.Column(
            "url_mode",
            sa.String(length=20),
            nullable=False,
            server_default=sa.text("'default'"),
        ),
    )
    op.add_column(
        "article_share_links",
        sa.Column("custom_url", sa.String(length=180), nullable=True),
    )
    op.add_column(
        "article_share_links",
        sa.Column(
            "og_mode",
            sa.String(length=20),
            nullable=False,
            server_default=sa.text("'default'"),
        ),
    )
    op.add_column(
        "article_share_links",
        sa.Column("og_image_url", sa.String(length=2048), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("article_share_links", "og_image_url")
    op.drop_column("article_share_links", "og_mode")
    op.drop_column("article_share_links", "custom_url")
    op.drop_column("article_share_links", "url_mode")
