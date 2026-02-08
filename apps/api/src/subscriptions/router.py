import json
import uuid
from datetime import datetime

import httpx
import structlog
from fastapi import APIRouter, HTTPException, Request, status

from src.lib.config import settings
from src.lib.dependencies import CurrentUser, DBSession
from src.subscriptions import service
from src.subscriptions.paddle_verify import verify_paddle_signature
from src.subscriptions.schemas import (
    CheckoutResponse,
    PortalUrlResponse,
    SubscriptionResponse,
    UsageResponse,
)

logger = structlog.get_logger(__name__)

router = APIRouter()

PADDLE_API_BASE = {
    "sandbox": "https://sandbox-api.paddle.com",
    "production": "https://api.paddle.com",
}


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

    base_url = PADDLE_API_BASE.get(
        settings.PADDLE_ENVIRONMENT, PADDLE_API_BASE["sandbox"]
    )
    url = f"{base_url}/subscriptions/{subscription.paddle_subscription_id}"

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            url,
            headers={
                "Authorization": f"Bearer {settings.PADDLE_API_KEY}",
                "Content-Type": "application/json",
            },
            timeout=10,
        )

    if resp.status_code != 200:
        logger.error(
            "Paddle API error",
            status_code=resp.status_code,
            body=resp.text,
        )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to fetch subscription from Paddle",
        )

    data = resp.json().get("data", {})
    mgmt = data.get("management_urls", {})

    return PortalUrlResponse(
        cancel_url=mgmt.get("cancel"),
        update_payment_method_url=mgmt.get("update_payment_method"),
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
        body = json.loads(raw_body)
    else:
        logger.warning(
            "PADDLE_WEBHOOK_SECRET not set — skipping signature verification"
        )
        body = await request.json()

    event_type = body.get("event_type", "")
    data = body.get("data", {})

    logger.info("Paddle webhook received", event_type=event_type)

    if event_type in (
        "subscription.created",
        "subscription.updated",
        "subscription.canceled",
        "subscription.past_due",
    ):
        custom_data = data.get("custom_data", {})
        user_id = custom_data.get("user_id")

        if not user_id:
            logger.warning("Paddle webhook missing user_id", event_type=event_type)
            return {"status": "ignored", "reason": "missing user_id"}

        paddle_sub_id = data.get("id", "")
        paddle_customer_id = data.get("customer_id", "")

        # Map Paddle status to our status
        paddle_status = data.get("status", "active")
        status_map = {
            "active": "active",
            "canceled": "canceled",
            "past_due": "past_due",
            "paused": "paused",
            "trialing": "active",
        }
        mapped_status = status_map.get(paddle_status, "active")

        # Determine plan from Paddle price
        plan = "pro"  # Only pro subscriptions go through Paddle
        if mapped_status == "canceled":
            plan = "basic"  # Downgrade on cancellation

        # Parse period dates
        period_start = None
        period_end = None
        cancel_at = None

        if data.get("current_billing_period"):
            period = data["current_billing_period"]
            if period.get("starts_at"):
                period_start = datetime.fromisoformat(period["starts_at"])
            if period.get("ends_at"):
                period_end = datetime.fromisoformat(period["ends_at"])

        if data.get("scheduled_change") and data["scheduled_change"].get(
            "effective_at"
        ):
            cancel_at = datetime.fromisoformat(data["scheduled_change"]["effective_at"])

        await service.update_subscription_from_paddle(
            db=db,
            user_id=uuid.UUID(user_id),
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
            user_id=user_id,
            plan=plan,
            status=mapped_status,
        )

    return {"status": "ok"}
