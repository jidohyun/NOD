"""add db hardening indexes and checks

Revision ID: f2c9b8e41d7a
Revises: d91c52a6f20b
Create Date: 2026-02-22 10:00:00.000000

"""

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "f2c9b8e41d7a"
down_revision: str | None = "d91c52a6f20b"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_index(op.f("ix_articles_status"), "articles", ["status"], unique=False)
    op.create_index(
        op.f("ix_article_summaries_content_type"),
        "article_summaries",
        ["content_type"],
        unique=False,
    )
    op.create_check_constraint(
        op.f("ck_subscriptions_plan_valid"),
        "subscriptions",
        "plan IN ('basic', 'pro')",
    )
    op.create_check_constraint(
        op.f("ck_subscriptions_status_valid"),
        "subscriptions",
        "status IN ('active', 'canceled', 'past_due', 'paused')",
    )
    op.create_check_constraint(
        op.f("ck_usage_records_month_format"),
        "usage_records",
        r"month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'",
    )


def downgrade() -> None:
    op.drop_constraint(
        op.f("ck_usage_records_month_format"),
        "usage_records",
        type_="check",
    )
    op.drop_constraint(
        op.f("ck_subscriptions_status_valid"),
        "subscriptions",
        type_="check",
    )
    op.drop_constraint(
        op.f("ck_subscriptions_plan_valid"),
        "subscriptions",
        type_="check",
    )
    op.drop_index(
        op.f("ix_article_summaries_content_type"), table_name="article_summaries"
    )
    op.drop_index(op.f("ix_articles_status"), table_name="articles")
