import uuid as uuid_lib
from datetime import datetime

from sqlalchemy import (
    JSON,
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.common.models.base import TimestampMixin, UUIDMixin
from src.lib.database import Base


class Subscription(UUIDMixin, TimestampMixin, Base):
    __tablename__: str = "subscriptions"
    __table_args__: tuple[CheckConstraint, CheckConstraint] = (
        CheckConstraint("plan IN ('basic', 'pro')", name="plan_valid"),
        CheckConstraint(
            "status IN ('active', 'canceled', 'past_due', 'paused')",
            name="status_valid",
        ),
    )

    user_id: Mapped[uuid_lib.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    plan: Mapped[str] = mapped_column(
        String(20), nullable=False, server_default=text("'basic'")
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, server_default=text("'active'")
    )
    paddle_subscription_id: Mapped[str | None] = mapped_column(
        String(100), nullable=True, unique=True
    )
    paddle_customer_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    current_period_start: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    current_period_end: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    cancel_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )


class UsageRecord(UUIDMixin, TimestampMixin, Base):
    __tablename__: str = "usage_records"
    __table_args__: tuple[UniqueConstraint, CheckConstraint] = (
        UniqueConstraint("user_id", "month", name="uq_user_month"),
        CheckConstraint(
            r"month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'",
            name="month_format",
        ),
    )

    user_id: Mapped[uuid_lib.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    month: Mapped[str] = mapped_column(String(7), nullable=False, index=True)
    summaries_used: Mapped[int] = mapped_column(
        Integer, nullable=False, server_default=text("0")
    )
    articles_saved: Mapped[int] = mapped_column(
        Integer, nullable=False, server_default=text("0")
    )


class PromoCode(UUIDMixin, TimestampMixin, Base):
    __tablename__: str = "promo_codes"
    __table_args__: tuple[CheckConstraint, CheckConstraint] = (
        CheckConstraint("grant_plan IN ('pro')", name="promo_codes_grant_plan_valid"),
        CheckConstraint("grant_days > 0", name="promo_codes_grant_days_positive"),
    )

    code_hash: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    campaign_tag: Mapped[str | None] = mapped_column(
        String(120), nullable=True, index=True
    )
    grant_plan: Mapped[str] = mapped_column(
        String(20), nullable=False, server_default=text("'pro'")
    )
    grant_days: Mapped[int] = mapped_column(Integer, nullable=False)
    max_redemptions: Mapped[int | None] = mapped_column(Integer, nullable=True)
    redeemed_count: Mapped[int] = mapped_column(
        Integer, nullable=False, server_default=text("0")
    )
    per_user_limit: Mapped[int] = mapped_column(
        Integer, nullable=False, server_default=text("1")
    )
    expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("true")
    )
    created_by: Mapped[uuid_lib.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    metadata_json: Mapped[dict[str, object] | None] = mapped_column(JSON, nullable=True)


class PromoRedemption(UUIDMixin, Base):
    __tablename__: str = "promo_redemptions"
    __table_args__: tuple[CheckConstraint] = (
        CheckConstraint(
            "status IN ('success', 'rejected', 'revoked')",
            name="promo_redemptions_status_valid",
        ),
    )

    promo_code_id: Mapped[uuid_lib.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("promo_codes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[uuid_lib.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    failure_reason: Mapped[str | None] = mapped_column(String(120), nullable=True)
    request_ip: Mapped[str | None] = mapped_column(String(64), nullable=True)
    request_user_agent: Mapped[str | None] = mapped_column(String(500), nullable=True)
    redeemed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("now()")
    )


class UserPromoEntitlement(UUIDMixin, TimestampMixin, Base):
    __tablename__: str = "user_promo_entitlements"
    __table_args__: tuple[CheckConstraint] = (
        CheckConstraint("plan IN ('pro')", name="user_promo_entitlements_plan_valid"),
    )

    user_id: Mapped[uuid_lib.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    promo_redemption_id: Mapped[uuid_lib.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("promo_redemptions.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    plan: Mapped[str] = mapped_column(
        String(20), nullable=False, server_default=text("'pro'")
    )
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ends_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("true")
    )


class PromoAuditLog(UUIDMixin, Base):
    __tablename__: str = "promo_audit_logs"

    actor_user_id: Mapped[uuid_lib.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    action: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    target_type: Mapped[str] = mapped_column(String(80), nullable=False)
    target_id: Mapped[uuid_lib.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )
    payload: Mapped[dict[str, object] | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("now()")
    )
