import uuid as uuid_lib
from datetime import UTC, datetime, timedelta
from hashlib import sha256
from typing import Literal, cast

from sqlalchemy import func, select
from sqlalchemy.exc import ProgrammingError
from sqlalchemy.ext.asyncio import AsyncSession

from src.lib.config import settings
from src.lib.content_classifier import ContentType
from src.subscriptions.model import (
    PromoAuditLog,
    PromoCode,
    PromoRedemption,
    Subscription,
    UsageRecord,
    UserPromoEntitlement,
)
from src.subscriptions.schemas import (
    PLAN_LIMITS,
    PromoCurrentResponse,
    PromoEntitlementResponse,
    UsageResponse,
)


def _is_admin(user_id: uuid_lib.UUID | str) -> bool:
    return str(user_id) in settings.ADMIN_USER_IDS


FREE_ALLOWED_CONTENT_TYPES = {
    ContentType.GENERAL_NEWS,
    ContentType.TECH_BLOG,
    ContentType.OFFICIAL_DOCS,
    ContentType.PATCH_NOTE,
}


def _normalize_user_id(user_id: uuid_lib.UUID | str) -> uuid_lib.UUID:
    return user_id if isinstance(user_id, uuid_lib.UUID) else uuid_lib.UUID(user_id)


def _normalize_promo_code(raw_code: str) -> str:
    return raw_code.strip().upper()


def _hash_promo_code(normalized_code: str) -> str:
    pepper = settings.PROMO_CODE_PEPPER or settings.JWT_SECRET
    return sha256(f"{pepper}:{normalized_code}".encode()).hexdigest()


def _is_subscription_pro_active(subscription: Subscription) -> bool:
    return subscription.plan == "pro" and subscription.status == "active"


def resolve_effective_plan(
    subscription: Subscription,
    has_active_promo: bool,
) -> tuple[str, str]:
    if _is_subscription_pro_active(subscription) or has_active_promo:
        return "pro", "active"
    return subscription.plan, subscription.status


async def get_active_promo_entitlement(
    db: AsyncSession,
    user_id: uuid_lib.UUID | str,
) -> UserPromoEntitlement | None:
    uid = _normalize_user_id(user_id)
    now = datetime.now(UTC)
    try:
        result = await db.execute(
            select(UserPromoEntitlement)
            .where(
                UserPromoEntitlement.user_id == uid,
                UserPromoEntitlement.is_active.is_(True),
                UserPromoEntitlement.ends_at > now,
            )
            .order_by(UserPromoEntitlement.ends_at.desc())
        )
        return result.scalars().first()
    except ProgrammingError:
        # Table does not exist yet — migration not applied
        await db.rollback()
        return None


async def get_current_promo_entitlement(
    db: AsyncSession,
    user_id: uuid_lib.UUID | str,
) -> PromoCurrentResponse:
    entitlement = await get_active_promo_entitlement(db, user_id)
    if not entitlement:
        return PromoCurrentResponse(has_active_promo=False)

    promo_code_result = await db.execute(
        select(PromoCode)
        .join(PromoRedemption, PromoRedemption.promo_code_id == PromoCode.id)
        .where(PromoRedemption.id == entitlement.promo_redemption_id)
    )
    promo_code = promo_code_result.scalar_one_or_none()
    return PromoCurrentResponse(
        has_active_promo=True,
        plan=entitlement.plan,
        starts_at=entitlement.starts_at,
        ends_at=entitlement.ends_at,
        campaign_tag=promo_code.campaign_tag if promo_code else None,
    )


async def get_or_create_subscription(
    db: AsyncSession, user_id: uuid_lib.UUID | str
) -> Subscription:
    """Get user's subscription, creating a default 'basic' one if none exists."""
    uid = _normalize_user_id(user_id)
    default_plan = "pro" if _is_admin(uid) else "basic"

    result = await db.execute(select(Subscription).where(Subscription.user_id == uid))
    subscription = result.scalar_one_or_none()

    if not subscription:
        subscription = Subscription(user_id=uid, plan=default_plan, status="active")
        db.add(subscription)
        await db.flush()
    elif _is_admin(uid) and subscription.plan != "pro":
        subscription.plan = "pro"
        subscription.status = "active"
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

    if _is_admin(user_id):
        return UsageResponse(
            plan="pro",
            status="active",
            summaries_used=usage.summaries_used,
            summaries_limit=-1,
            can_summarize=True,
        )

    # Cache scalar values before promo query — a rollback on missing
    # promo table would detach ORM objects loaded earlier.
    sub_plan = subscription.plan
    sub_status = subscription.status
    sub_is_pro = _is_subscription_pro_active(subscription)
    summaries_used = usage.summaries_used

    active_promo = await get_active_promo_entitlement(db, user_id)

    if sub_is_pro or active_promo is not None:
        effective_plan, effective_status = "pro", "active"
    else:
        effective_plan, effective_status = sub_plan, sub_status

    limits = PLAN_LIMITS.get(effective_plan, PLAN_LIMITS["basic"])
    summaries_limit = limits["summaries_per_month"]
    can_summarize = summaries_limit == -1 or summaries_used < summaries_limit

    return UsageResponse(
        plan=effective_plan,
        status=effective_status,
        summaries_used=summaries_used,
        summaries_limit=summaries_limit,
        can_summarize=can_summarize,
    )


async def increment_summary_usage(
    db: AsyncSession, user_id: uuid_lib.UUID | str
) -> None:
    """Increment the summary usage counter for the current month."""
    usage = await get_or_create_usage(db, user_id)
    usage.summaries_used = usage.summaries_used + 1
    await db.flush()


async def check_can_summarize(db: AsyncSession, user_id: uuid_lib.UUID | str) -> bool:
    """Check if user can create another summary."""
    info = await get_usage_info(db, user_id)
    return info.can_summarize


def can_access_content_type(plan: str, content_type: ContentType | str) -> bool:
    resolved = (
        content_type
        if isinstance(content_type, ContentType)
        else ContentType(content_type)
    )
    if plan == "pro":
        return True
    return resolved in FREE_ALLOWED_CONTENT_TYPES


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


async def _write_promo_audit_log(
    db: AsyncSession,
    *,
    actor_user_id: uuid_lib.UUID | None,
    action: str,
    target_type: str,
    target_id: uuid_lib.UUID | None,
    payload: dict[str, object] | None = None,
) -> None:
    db.add(
        PromoAuditLog(
            actor_user_id=actor_user_id,
            action=action,
            target_type=target_type,
            target_id=target_id,
            payload=payload,
        )
    )
    await db.flush()


PromoRedeemErrorReason = Literal[
    "invalid_code",
    "inactive_code",
    "expired_code",
    "campaign_limit_reached",
    "per_user_limit_reached",
]


def normalize_redeem_error_reason(reason: str) -> PromoRedeemErrorReason:
    if reason in {
        "invalid_code",
        "inactive_code",
        "expired_code",
        "campaign_limit_reached",
        "per_user_limit_reached",
    }:
        return cast(PromoRedeemErrorReason, reason)
    return "invalid_code"


class PromoRedeemError(ValueError):
    reason: PromoRedeemErrorReason

    def __init__(self, reason: PromoRedeemErrorReason) -> None:
        super().__init__(reason)
        self.reason = reason


async def redeem_promo_code(
    db: AsyncSession,
    user_id: uuid_lib.UUID | str,
    code: str,
    *,
    request_ip: str | None = None,
    request_user_agent: str | None = None,
) -> PromoEntitlementResponse:
    uid = _normalize_user_id(user_id)
    normalized = _normalize_promo_code(code)
    code_hash = _hash_promo_code(normalized)
    now = datetime.now(UTC)

    promo_result = await db.execute(
        select(PromoCode).where(PromoCode.code_hash == code_hash).with_for_update()
    )
    promo_code = promo_result.scalar_one_or_none()

    if not promo_code:
        raise PromoRedeemError("invalid_code")

    if not promo_code.is_active:
        raise PromoRedeemError("inactive_code")

    if promo_code.expires_at and promo_code.expires_at <= now:
        raise PromoRedeemError("expired_code")

    if (
        promo_code.max_redemptions is not None
        and promo_code.redeemed_count >= promo_code.max_redemptions
    ):
        raise PromoRedeemError("campaign_limit_reached")

    user_success_count_result = await db.execute(
        select(func.count(PromoRedemption.id)).where(
            PromoRedemption.promo_code_id == promo_code.id,
            PromoRedemption.user_id == uid,
            PromoRedemption.status == "success",
        )
    )
    user_success_count = user_success_count_result.scalar_one()
    if user_success_count >= promo_code.per_user_limit:
        raise PromoRedeemError("per_user_limit_reached")

    redemption = PromoRedemption(
        promo_code_id=promo_code.id,
        user_id=uid,
        status="success",
        request_ip=request_ip,
        request_user_agent=request_user_agent,
    )
    db.add(redemption)
    await db.flush()

    current_entitlement = await get_active_promo_entitlement(db, uid)
    starts_at = now
    base_end = (
        current_entitlement.ends_at
        if current_entitlement and current_entitlement.ends_at > now
        else now
    )
    ends_at = base_end + timedelta(days=promo_code.grant_days)
    entitlement = UserPromoEntitlement(
        user_id=uid,
        promo_redemption_id=redemption.id,
        plan=promo_code.grant_plan,
        starts_at=starts_at,
        ends_at=ends_at,
        is_active=True,
    )
    db.add(entitlement)
    promo_code.redeemed_count = promo_code.redeemed_count + 1
    await db.flush()

    await _write_promo_audit_log(
        db,
        actor_user_id=uid,
        action="redeem_success",
        target_type="promo_redemption",
        target_id=redemption.id,
        payload={
            "promo_code_id": str(promo_code.id),
            "campaign_tag": promo_code.campaign_tag or "",
        },
    )

    return PromoEntitlementResponse(
        plan=promo_code.grant_plan,
        starts_at=starts_at,
        ends_at=ends_at,
        campaign_tag=promo_code.campaign_tag,
        message="Promo applied",
    )


def _map_redeem_failure_reason_to_status(reason: PromoRedeemErrorReason) -> str:
    if reason == "expired_code":
        return "expired"
    if reason == "campaign_limit_reached":
        return "campaign_limit"
    if reason == "per_user_limit_reached":
        return "user_limit"
    if reason == "inactive_code":
        return "inactive"
    return "invalid"


async def record_redeem_failure(
    db: AsyncSession,
    user_id: uuid_lib.UUID | str,
    code: str,
    reason: PromoRedeemErrorReason,
    *,
    request_ip: str | None = None,
    request_user_agent: str | None = None,
) -> None:
    uid = _normalize_user_id(user_id)
    normalized = _normalize_promo_code(code)
    code_hash = _hash_promo_code(normalized)
    promo_result = await db.execute(
        select(PromoCode).where(PromoCode.code_hash == code_hash)
    )
    promo_code = promo_result.scalar_one_or_none()

    if promo_code:
        redemption = PromoRedemption(
            promo_code_id=promo_code.id,
            user_id=uid,
            status="rejected",
            failure_reason=_map_redeem_failure_reason_to_status(reason),
            request_ip=request_ip,
            request_user_agent=request_user_agent,
        )
        db.add(redemption)
        await db.flush()

    await _write_promo_audit_log(
        db,
        actor_user_id=uid,
        action="redeem_rejected",
        target_type="promo_code",
        target_id=promo_code.id if promo_code else None,
        payload={"reason": reason},
    )
