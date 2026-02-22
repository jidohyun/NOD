import uuid as uuid_lib
from datetime import datetime

from sqlalchemy import (
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
