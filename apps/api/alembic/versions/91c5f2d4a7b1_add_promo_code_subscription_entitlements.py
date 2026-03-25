from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "91c5f2d4a7b1"
down_revision: str | Sequence[str] | None = ("f1a2b3c4d5e6", "f2c9b8e41d7a")
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "promo_codes",
        sa.Column("code_hash", sa.String(length=128), nullable=False),
        sa.Column("campaign_tag", sa.String(length=120), nullable=True),
        sa.Column(
            "grant_plan",
            sa.String(length=20),
            server_default=sa.text("'pro'"),
            nullable=False,
        ),
        sa.Column("grant_days", sa.Integer(), nullable=False),
        sa.Column("max_redemptions", sa.Integer(), nullable=True),
        sa.Column(
            "redeemed_count", sa.Integer(), server_default=sa.text("0"), nullable=False
        ),
        sa.Column(
            "per_user_limit", sa.Integer(), server_default=sa.text("1"), nullable=False
        ),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False
        ),
        sa.Column("created_by", sa.UUID(), nullable=True),
        sa.Column("metadata_json", sa.JSON(), nullable=True),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_promo_codes")),
        sa.UniqueConstraint("code_hash", name=op.f("uq_promo_codes_code_hash")),
        sa.CheckConstraint(
            "grant_plan IN ('pro')", name="promo_codes_grant_plan_valid"
        ),
        sa.CheckConstraint("grant_days > 0", name="promo_codes_grant_days_positive"),
    )
    op.create_index(
        op.f("ix_promo_codes_campaign_tag"), "promo_codes", ["campaign_tag"]
    )

    op.create_table(
        "promo_redemptions",
        sa.Column("promo_code_id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("failure_reason", sa.String(length=120), nullable=True),
        sa.Column("request_ip", sa.String(length=64), nullable=True),
        sa.Column("request_user_agent", sa.String(length=500), nullable=True),
        sa.Column(
            "redeemed_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(
            ["promo_code_id"], ["promo_codes.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_promo_redemptions")),
        sa.CheckConstraint(
            "status IN ('success', 'rejected', 'revoked')",
            name="promo_redemptions_status_valid",
        ),
    )
    op.create_index(
        op.f("ix_promo_redemptions_promo_code_id"),
        "promo_redemptions",
        ["promo_code_id"],
    )
    op.create_index(
        op.f("ix_promo_redemptions_user_id"), "promo_redemptions", ["user_id"]
    )

    op.create_table(
        "user_promo_entitlements",
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("promo_redemption_id", sa.UUID(), nullable=False),
        sa.Column(
            "plan",
            sa.String(length=20),
            server_default=sa.text("'pro'"),
            nullable=False,
        ),
        sa.Column("starts_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ends_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False
        ),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(
            ["promo_redemption_id"], ["promo_redemptions.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_user_promo_entitlements")),
        sa.UniqueConstraint(
            "promo_redemption_id",
            name=op.f("uq_user_promo_entitlements_promo_redemption_id"),
        ),
        sa.CheckConstraint(
            "plan IN ('pro')", name="user_promo_entitlements_plan_valid"
        ),
    )
    op.create_index(
        op.f("ix_user_promo_entitlements_ends_at"),
        "user_promo_entitlements",
        ["ends_at"],
    )
    op.create_index(
        op.f("ix_user_promo_entitlements_user_id"),
        "user_promo_entitlements",
        ["user_id"],
    )

    op.create_table(
        "promo_audit_logs",
        sa.Column("actor_user_id", sa.UUID(), nullable=True),
        sa.Column("action", sa.String(length=80), nullable=False),
        sa.Column("target_type", sa.String(length=80), nullable=False),
        sa.Column("target_id", sa.UUID(), nullable=True),
        sa.Column("payload", sa.JSON(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(["actor_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_promo_audit_logs")),
    )
    op.create_index(op.f("ix_promo_audit_logs_action"), "promo_audit_logs", ["action"])
    op.create_index(
        op.f("ix_promo_audit_logs_actor_user_id"),
        "promo_audit_logs",
        ["actor_user_id"],
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_promo_audit_logs_actor_user_id"), table_name="promo_audit_logs"
    )
    op.drop_index(op.f("ix_promo_audit_logs_action"), table_name="promo_audit_logs")
    op.drop_table("promo_audit_logs")

    op.drop_index(
        op.f("ix_user_promo_entitlements_user_id"),
        table_name="user_promo_entitlements",
    )
    op.drop_index(
        op.f("ix_user_promo_entitlements_ends_at"),
        table_name="user_promo_entitlements",
    )
    op.drop_table("user_promo_entitlements")

    op.drop_index(op.f("ix_promo_redemptions_user_id"), table_name="promo_redemptions")
    op.drop_index(
        op.f("ix_promo_redemptions_promo_code_id"),
        table_name="promo_redemptions",
    )
    op.drop_table("promo_redemptions")

    op.drop_index(op.f("ix_promo_codes_campaign_tag"), table_name="promo_codes")
    op.drop_table("promo_codes")
