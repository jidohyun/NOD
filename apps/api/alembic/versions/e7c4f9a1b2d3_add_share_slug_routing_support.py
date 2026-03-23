from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "e7c4f9a1b2d3"
down_revision: str | None = "d6f2b0e1c4a8"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "article_share_links",
        sa.Column("share_slug", sa.String(length=180), nullable=True),
    )
    op.add_column(
        "article_share_links",
        sa.Column("share_sid", sa.String(length=12), nullable=True),
    )

    op.execute("""
        UPDATE article_share_links
        SET share_slug = 'shared-article'
        WHERE share_slug IS NULL
    """)
    op.execute("""
        UPDATE article_share_links
        SET share_sid = SUBSTRING(REPLACE(id::text, '-', ''), 1, 12)
        WHERE share_sid IS NULL
    """)

    op.alter_column("article_share_links", "share_slug", nullable=False)
    op.alter_column("article_share_links", "share_sid", nullable=False)

    op.create_index(
        op.f("ix_article_share_links_share_slug"),
        "article_share_links",
        ["share_slug"],
        unique=False,
    )
    op.create_unique_constraint(
        "uq_article_share_links_share_sid",
        "article_share_links",
        ["share_sid"],
    )

    _ = op.create_table(
        "article_share_slug_histories",
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
        sa.Column("slug", sa.String(length=180), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id", name="pk_article_share_slug_histories"),
        sa.UniqueConstraint(
            "share_link_id",
            "slug",
            name="uq_article_share_slug_histories_share_slug",
        ),
    )
    op.create_index(
        op.f("ix_article_share_slug_histories_share_link_id"),
        "article_share_slug_histories",
        ["share_link_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_article_share_slug_histories_slug"),
        "article_share_slug_histories",
        ["slug"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_article_share_slug_histories_slug"),
        table_name="article_share_slug_histories",
    )
    op.drop_index(
        op.f("ix_article_share_slug_histories_share_link_id"),
        table_name="article_share_slug_histories",
    )
    op.drop_table("article_share_slug_histories")

    op.drop_constraint(
        "uq_article_share_links_share_sid",
        "article_share_links",
        type_="unique",
    )
    op.drop_index(
        op.f("ix_article_share_links_share_slug"),
        table_name="article_share_links",
    )
    op.drop_column("article_share_links", "share_sid")
    op.drop_column("article_share_links", "share_slug")
