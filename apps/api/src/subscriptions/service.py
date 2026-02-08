import uuid as uuid_lib
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.subscriptions.model import Subscription, UsageRecord
from src.subscriptions.schemas import PLAN_LIMITS, UsageResponse


def _normalize_user_id(user_id: uuid_lib.UUID | str) -> uuid_lib.UUID:
    return user_id if isinstance(user_id, uuid_lib.UUID) else uuid_lib.UUID(user_id)


async def get_or_create_subscription(
    db: AsyncSession, user_id: uuid_lib.UUID | str
) -> Subscription:
    """Get user's subscription, creating a default 'basic' one if none exists."""
    uid = _normalize_user_id(user_id)
    result = await db.execute(select(Subscription).where(Subscription.user_id == uid))
    subscription = result.scalar_one_or_none()

    if not subscription:
        subscription = Subscription(user_id=uid, plan="basic", status="active")
        db.add(subscription)
        await db.flush()

    return subscription


async def get_subscription(
    db: AsyncSession, user_id: uuid_lib.UUID | str
) -> Subscription | None:
    """Get user's subscription."""
    uid = _normalize_user_id(user_id)
    result = await db.execute(select(Subscription).where(Subscription.user_id == uid))
    return result.scalar_one_or_none()


async def get_or_create_usage(
    db: AsyncSession, user_id: uuid_lib.UUID | str
) -> UsageRecord:
    """Get or create usage record for the current month."""
    current_month = datetime.now(UTC).strftime("%Y-%m")

    uid = _normalize_user_id(user_id)
    result = await db.execute(
        select(UsageRecord).where(
            UsageRecord.user_id == uid,
            UsageRecord.month == current_month,
        )
    )
    usage = result.scalar_one_or_none()

    if not usage:
        usage = UsageRecord(
            user_id=uid,
            month=current_month,
            summaries_used=0,
            articles_saved=0,
        )
        db.add(usage)
        await db.flush()

    return usage


async def get_usage_info(
    db: AsyncSession, user_id: uuid_lib.UUID | str
) -> UsageResponse:
    """Get combined subscription + usage info for the user."""
    subscription = await get_or_create_subscription(db, user_id)
    usage = await get_or_create_usage(db, user_id)
    limits = PLAN_LIMITS.get(subscription.plan, PLAN_LIMITS["basic"])

    summaries_limit = limits["summaries_per_month"]
    articles_limit = limits["max_articles"]

    can_summarize = summaries_limit == -1 or usage.summaries_used < summaries_limit
    can_save = articles_limit == -1 or usage.articles_saved < articles_limit

    return UsageResponse(
        plan=subscription.plan,
        status=subscription.status,
        summaries_used=usage.summaries_used,
        summaries_limit=summaries_limit,
        articles_saved=usage.articles_saved,
        articles_limit=articles_limit,
        can_summarize=can_summarize,
        can_save_article=can_save,
    )


async def increment_summary_usage(
    db: AsyncSession, user_id: uuid_lib.UUID | str
) -> None:
    """Increment the summary usage counter for the current month."""
    usage = await get_or_create_usage(db, user_id)
    usage.summaries_used = usage.summaries_used + 1
    await db.flush()


async def increment_article_usage(
    db: AsyncSession, user_id: uuid_lib.UUID | str
) -> None:
    """Increment the article saved counter for the current month."""
    usage = await get_or_create_usage(db, user_id)
    usage.articles_saved = usage.articles_saved + 1
    await db.flush()


async def check_can_summarize(db: AsyncSession, user_id: uuid_lib.UUID | str) -> bool:
    """Check if user can create another summary."""
    info = await get_usage_info(db, user_id)
    return info.can_summarize


async def update_subscription_from_paddle(
    db: AsyncSession,
    user_id: uuid_lib.UUID | str,
    paddle_subscription_id: str,
    paddle_customer_id: str,
    plan: str,
    status: str,
    current_period_start: datetime | None = None,
    current_period_end: datetime | None = None,
    cancel_at: datetime | None = None,
) -> Subscription:
    """Update subscription from Paddle webhook data."""
    subscription = await get_or_create_subscription(db, user_id)
    subscription.plan = plan
    subscription.status = status
    subscription.paddle_subscription_id = paddle_subscription_id
    subscription.paddle_customer_id = paddle_customer_id
    subscription.current_period_start = current_period_start
    subscription.current_period_end = current_period_end
    subscription.cancel_at = cancel_at
    await db.flush()
    return subscription
