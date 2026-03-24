from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "2be2e207536c"
down_revision: str | None = "ca9a22268695"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    _ = op.create_table(
        "article_share_empathies",
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
        sa.Column(
            "user_id",
            sa.UUID(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id", name="pk_article_share_empathies"),
        sa.UniqueConstraint(
            "share_link_id",
            "user_id",
            name="uq_article_share_empathies_share_link_user",
        ),
    )
    op.create_index(
        op.f("ix_article_share_empathies_share_link_id"),
        "article_share_empathies",
        ["share_link_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_article_share_empathies_user_id"),
        "article_share_empathies",
        ["user_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_article_share_empathies_user_id"),
        table_name="article_share_empathies",
    )
    op.drop_index(
        op.f("ix_article_share_empathies_share_link_id"),
        table_name="article_share_empathies",
    )
    op.drop_table("article_share_empathies")
