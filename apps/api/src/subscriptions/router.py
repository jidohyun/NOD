import json
import uuid
from typing import cast

from fastapi import APIRouter, HTTPException, Request, status

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
    SubscriptionResponse,
    UsageResponse,
)

logger = get_logger(__name__)

router = APIRouter()


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
