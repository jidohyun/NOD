import uuid
from datetime import UTC, datetime
from typing import Any

from pydantic import BaseModel, Field

# Plan limits configuration
PLAN_LIMITS = {
    "basic": {
        "summaries_per_month": 20,
        "searches_per_day": -1,
    },
    "pro": {
        "summaries_per_month": -1,
        "searches_per_day": -1,  # unlimited
    },
}


class SubscriptionResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    user_id: uuid.UUID
    plan: str
    status: str
    paddle_subscription_id: str | None = None
    current_period_start: datetime | None = None
    current_period_end: datetime | None = None
    cancel_at: datetime | None = None
    created_at: datetime
    updated_at: datetime | None = None


class UsageResponse(BaseModel):
    plan: str
    status: str
    summaries_used: int
    summaries_limit: int
    can_summarize: bool


class PaddleWebhookEvent(BaseModel):
    event_type: str
    data: dict[str, Any]


class CheckoutRequest(BaseModel):
    plan: str = Field(..., pattern="^(pro)$")


class CheckoutResponse(BaseModel):
    client_token: str
    price_id: str
    environment: str
    user_id: str
    user_email: str | None = None


class PortalUrlResponse(BaseModel):
    cancel_url: str | None = None
    update_payment_method_url: str | None = None


class PromoEntitlementResponse(BaseModel):
    plan: str
    starts_at: datetime
    ends_at: datetime
    campaign_tag: str | None = None
    message: str


class PromoCurrentResponse(BaseModel):
    has_active_promo: bool
    plan: str | None = None
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    campaign_tag: str | None = None


class PromoRedeemRequest(BaseModel):
    code: str = Field(..., min_length=3, max_length=64)


class PromoCodeCreateRequest(BaseModel):
    code: str = Field(..., min_length=3, max_length=64)
    grant_days: int = Field(..., gt=0, le=365)
    expires_at: datetime | None = None
    max_redemptions: int | None = Field(default=None, gt=0, le=1_000_000)
    per_user_limit: int = Field(default=1, gt=0, le=100)
    campaign_tag: str | None = Field(default=None, min_length=1, max_length=120)

    @property
    def normalized_expires_at(self) -> datetime | None:
        if self.expires_at is None:
            return None
        if self.expires_at.tzinfo is None:
            return self.expires_at.replace(tzinfo=UTC)
        return self.expires_at


class PromoCodeResponse(BaseModel):
    id: uuid.UUID
    campaign_tag: str | None
    grant_plan: str
    grant_days: int
    max_redemptions: int | None
    redeemed_count: int
    per_user_limit: int
    expires_at: datetime | None
    is_active: bool
    created_at: datetime


class PromoCodeListResponse(BaseModel):
    items: list[PromoCodeResponse]
