"""add user onboarding fields

Revision ID: 9d2c4a7b1f3e
Revises: 7b4a2b1c0f9a
Create Date: 2026-02-09

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.engine import Connection

from alembic import op

revision: str = "9d2c4a7b1f3e"
down_revision: str | None = "7b4a2b1c0f9a"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _column_exists(connection: Connection, table_name: str, column_name: str) -> bool:
    inspector = sa.inspect(connection)
    return any(
        column["name"] == column_name for column in inspector.get_columns(table_name)
    )


def upgrade() -> None:
    connection = op.get_bind()

    if not _column_exists(connection, "users", "preferred_locale"):
        op.add_column(
            "users",
            sa.Column("preferred_locale", sa.String(length=10), nullable=True),
        )

    if not _column_exists(connection, "users", "onboarding_completed_at"):
        op.add_column(
            "users",
            sa.Column(
                "onboarding_completed_at", sa.DateTime(timezone=True), nullable=True
            ),
        )


def downgrade() -> None:
    op.drop_column("users", "onboarding_completed_at")
    op.drop_column("users", "preferred_locale")
