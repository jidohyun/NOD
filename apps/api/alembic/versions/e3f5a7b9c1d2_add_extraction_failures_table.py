"""add extraction_failures table

Revision ID: e3f5a7b9c1d2
Revises: f2c9b8e41d7a
Create Date: 2026-03-11 22:00:00.000000
"""

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

from alembic import op

revision = "e3f5a7b9c1d2"
down_revision = "f2c9b8e41d7a"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "extraction_failures",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("url", sa.String(2048), nullable=False),
        sa.Column("domain", sa.String(255), nullable=False, index=True),
        sa.Column("error_code", sa.String(50), nullable=False, index=True),
        sa.Column("error_message", sa.Text, nullable=True),
        sa.Column("page_title", sa.String(500), nullable=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True),
        sa.Column("user_agent", sa.String(500), nullable=True),
        sa.Column("extension_version", sa.String(20), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index(
        "ix_extraction_failures_created_at",
        "extraction_failures",
        ["created_at"],
    )


def downgrade() -> None:
    op.drop_table("extraction_failures")
