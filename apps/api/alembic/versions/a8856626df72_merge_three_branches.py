"""merge three branches

Revision ID: a8856626df72
Revises: e3f5a7b9c1d2
Create Date: 2026-03-21 00:00:00.000000

"""
from collections.abc import Sequence

# revision identifiers, used by Alembic.
revision: str = "a8856626df72"
down_revision: str | None = "e3f5a7b9c1d2"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
