import json
import uuid
from typing import cast

from fastapi import APIRouter, HTTPException, Query, Request, status

import src.subscriptions.promo_admin_service as promo_admin_service
from src.lib.config import settings
from src.lib.dependencies import CurrentUser, DBSession
from src.lib.logging import get_logger
from src.subscriptions import service
from src.subscriptions.paddle_utils import (
    PaddleAPIError,
    extract_cancel_at,
    extract_management_urls,
    extract_period_dates,
    fetch_paddle_subscription,
    map_paddle_status,
)
from src.subscriptions.paddle_verify import verify_paddle_signature
from src.subscriptions.schemas import (
    CheckoutResponse,
    PortalUrlResponse,
    PromoCodeCreateRequest,
    PromoCodeListResponse,
    PromoCodeResponse,
    PromoCurrentResponse,
    PromoEntitlementResponse,
    PromoRedeemRequest,
    SubscriptionResponse,
    UsageResponse,
)

logger = get_logger(__name__)

router = APIRouter()


def _is_admin_user(user_id: str) -> bool:
    return user_id in settings.ADMIN_USER_IDS


def _require_admin(user_id: str) -> None:
    if not _is_admin_user(user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin permission required",
        )


@router.get("/usage", response_model=UsageResponse)
async def get_usage(
    db: DBSession,
    user: CurrentUser,
) -> UsageResponse:
    """Get current user's subscription plan and usage info."""
    return await service.get_usage_info(db, user.id)


@router.get("/current", response_model=SubscriptionResponse)
async def get_subscription(
    db: DBSession,
    user: CurrentUser,
) -> SubscriptionResponse:
    """Get current user's subscription details."""
    subscription = await service.get_or_create_subscription(db, user.id)
    return SubscriptionResponse.model_validate(subscription)


@router.post("/promo/redeem", response_model=PromoEntitlementResponse)
async def redeem_promo_code(
    payload: PromoRedeemRequest,
    db: DBSession,
    user: CurrentUser,
    request: Request,
) -> PromoEntitlementResponse:
    try:
        response = await service.redeem_promo_code(
            db=db,
            user_id=user.id,
            code=payload.code,
            request_ip=request.client.host if request.client else None,
            request_user_agent=request.headers.get("user-agent"),
        )
    except service.PromoRedeemError as exc:
        reason_value = str(exc.reason)
        reason = (
            cast(service.PromoRedeemErrorReason, reason_value)
            if reason_value
            in {
                "invalid_code",
                "inactive_code",
                "expired_code",
                "campaign_limit_reached",
                "per_user_limit_reached",
            }
            else "invalid_code"
        )
        await service.record_redeem_failure(
            db=db,
            user_id=user.id,
            code=payload.code,
            reason=reason,
            request_ip=request.client.host if request.client else None,
            request_user_agent=request.headers.get("user-agent"),
        )
        await db.commit()
        if reason == "expired_code":
            raise HTTPException(
                status_code=status.HTTP_410_GONE, detail=reason
            ) from exc
        if reason in {"campaign_limit_reached", "per_user_limit_reached"}:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail=reason
            ) from exc
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=reason
        ) from exc

    return response


@router.get("/promo/current", response_model=PromoCurrentResponse)
async def get_current_promo(
    db: DBSession,
    user: CurrentUser,
) -> PromoCurrentResponse:
    return await service.get_current_promo_entitlement(db, user.id)


@router.post("/promo/admin/codes", response_model=PromoCodeResponse)
async def create_promo_code(
    payload: PromoCodeCreateRequest,
    db: DBSession,
    user: CurrentUser,
) -> PromoCodeResponse:
    _require_admin(user.id)
    try:
        return await promo_admin_service.create_promo_code(
            db, actor_user_id=user.id, payload=payload
        )
    except ValueError as exc:
        if str(exc) == "promo_code_already_exists":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail=str(exc)
            ) from exc
        raise


@router.get("/promo/admin/codes", response_model=PromoCodeListResponse)
async def list_promo_codes(
    db: DBSession,
    user: CurrentUser,
    campaign_tag: str | None = Query(default=None),
    is_active: bool | None = Query(default=None),
) -> PromoCodeListResponse:
    _require_admin(user.id)
    items = await promo_admin_service.list_promo_codes(
        db,
        campaign_tag=campaign_tag,
        is_active=is_active,
    )
    return PromoCodeListResponse(items=items)


@router.post(
    "/promo/admin/codes/{promo_code_id}/disable", response_model=PromoCodeResponse
)
async def disable_promo_code(
    promo_code_id: uuid.UUID,
    db: DBSession,
    user: CurrentUser,
) -> PromoCodeResponse:
    _require_admin(user.id)
    try:
        return await promo_admin_service.disable_promo_code(
            db,
            actor_user_id=user.id,
            promo_code_id=promo_code_id,
        )
    except ValueError as exc:
        if str(exc) == "promo_code_not_found":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
            ) from exc
        raise


@router.post("/checkout", response_model=CheckoutResponse)
async def create_checkout(
    db: DBSession,
    user: CurrentUser,
) -> CheckoutResponse:
    """Get Paddle checkout parameters for upgrading to Pro."""
    if not settings.PADDLE_CLIENT_TOKEN or not settings.PADDLE_PRICE_ID_PRO:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Payment system not configured",
        )

    subscription = await service.get_or_create_subscription(db, user.id)
    if subscription.plan == "pro" and subscription.status == "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already subscribed to Pro",
        )

    return CheckoutResponse(
        client_token=settings.PADDLE_CLIENT_TOKEN,
        price_id=settings.PADDLE_PRICE_ID_PRO,
        environment=settings.PADDLE_ENVIRONMENT,
        user_id=str(user.id),
        user_email=user.email if hasattr(user, "email") else None,
    )


@router.get("/portal-url", response_model=PortalUrlResponse)
async def get_portal_url(
    db: DBSession,
    user: CurrentUser,
) -> PortalUrlResponse:
    """Get Paddle customer portal URLs for managing subscription."""
    subscription = await service.get_subscription(db, user.id)
    if not subscription or not subscription.paddle_subscription_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active Paddle subscription found",
        )

    if not settings.PADDLE_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Paddle API not configured",
        )

    try:
        paddle_data = await fetch_paddle_subscription(
            paddle_subscription_id=subscription.paddle_subscription_id,
            paddle_api_key=settings.PADDLE_API_KEY,
            paddle_environment=settings.PADDLE_ENVIRONMENT,
        )
    except PaddleAPIError as exc:
        logger.error("Paddle API error", error=str(exc))
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to fetch subscription from Paddle",
        ) from exc

    cancel_url, update_payment_method_url = extract_management_urls(paddle_data)

    return PortalUrlResponse(
        cancel_url=cancel_url,
        update_payment_method_url=update_payment_method_url,
    )


@router.post("/webhook", status_code=status.HTTP_200_OK)
async def paddle_webhook(
    request: Request,
    db: DBSession,
) -> dict[str, str]:
    """Handle Paddle webhook events.

    Events handled:
    - subscription.created: New subscription
    - subscription.updated: Plan change, status change
    - subscription.canceled: Cancellation
    - subscription.past_due: Payment failed
    """
    # Verify signature if webhook secret is configured
    if settings.PADDLE_WEBHOOK_SECRET:
        raw_body = await verify_paddle_signature(
            request, settings.PADDLE_WEBHOOK_SECRET
        )
        body_payload = cast(object, json.loads(raw_body))
    else:
        logger.warning(
            "PADDLE_WEBHOOK_SECRET not set — skipping signature verification"
        )
        body_payload = cast(object, await request.json())

    body = (
        cast(dict[str, object], body_payload) if isinstance(body_payload, dict) else {}
    )

    event_type_raw = body.get("event_type")
    event_type = event_type_raw if isinstance(event_type_raw, str) else ""

    data_raw = body.get("data")
    data: dict[str, object] = (
        cast(dict[str, object], data_raw) if isinstance(data_raw, dict) else {}
    )

    logger.info("Paddle webhook received", event_type=event_type)

    if event_type in (
        "subscription.created",
        "subscription.updated",
        "subscription.canceled",
        "subscription.past_due",
    ):
        custom_data_raw = data.get("custom_data")
        custom_data: dict[str, object] = (
            cast(dict[str, object], custom_data_raw)
            if isinstance(custom_data_raw, dict)
            else {}
        )
        user_id_raw = custom_data.get("user_id")

        if not isinstance(user_id_raw, str) or not user_id_raw:
            logger.warning("Paddle webhook missing user_id", event_type=event_type)
            return {"status": "ignored", "reason": "missing user_id"}

        paddle_sub_id_raw = data.get("id")
        paddle_sub_id = paddle_sub_id_raw if isinstance(paddle_sub_id_raw, str) else ""

        paddle_customer_id_raw = data.get("customer_id")
        paddle_customer_id = (
            paddle_customer_id_raw if isinstance(paddle_customer_id_raw, str) else ""
        )

        paddle_status = data.get("status")
        mapped_status = map_paddle_status(
            paddle_status if isinstance(paddle_status, str) else None
        )

        # Determine plan from Paddle price
        plan = "pro"  # Only pro subscriptions go through Paddle
        if mapped_status == "canceled":
            plan = "basic"  # Downgrade on cancellation

        period_start, period_end = extract_period_dates(data)
        cancel_at = extract_cancel_at(data)

        try:
            user_uuid = uuid.UUID(user_id_raw)
        except ValueError:
            logger.warning(
                "Paddle webhook has invalid user_id",
                event_type=event_type,
                user_id=user_id_raw,
            )
            return {"status": "ignored", "reason": "invalid user_id"}

        _ = await service.update_subscription_from_paddle(
            db=db,
            user_id=user_uuid,
            paddle_subscription_id=paddle_sub_id,
            paddle_customer_id=paddle_customer_id,
            plan=plan,
            status=mapped_status,
            current_period_start=period_start,
            current_period_end=period_end,
            cancel_at=cancel_at,
        )

        logger.info(
            "Subscription updated from Paddle",
            user_id=user_id_raw,
            plan=plan,
            status=mapped_status,
        )

    return {"status": "ok"}
