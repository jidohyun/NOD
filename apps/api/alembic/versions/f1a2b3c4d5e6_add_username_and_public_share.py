"""add username and public share

Revision ID: f1a2b3c4d5e6
Revises: e62e7f6149f7
Create Date: 2026-03-23 16:00:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'f1a2b3c4d5e6'
down_revision: str | None = 'e62e7f6149f7'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Add username to users
    op.add_column('users', sa.Column('username', sa.String(50), nullable=True))
    op.create_unique_constraint('uq_users_username', 'users', ['username'])
    op.create_index('ix_users_username', 'users', ['username'], unique=True)

    # Add is_public to article_share_links (default true)
    op.add_column(
        'article_share_links',
        sa.Column('is_public', sa.Boolean(), nullable=False, server_default=sa.text('true')),
    )


def downgrade() -> None:
    op.drop_column('article_share_links', 'is_public')
    op.drop_index('ix_users_username', table_name='users')
    op.drop_constraint('uq_users_username', 'users', type_='unique')
    op.drop_column('users', 'username')
