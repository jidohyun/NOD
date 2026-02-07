import uuid
from datetime import datetime
from pydantic import BaseModel, Field


# Plan limits configuration
PLAN_LIMITS = {
    "basic": {
        "summaries_per_month": 10,
        "max_articles": 50,
        "searches_per_day": 5,
    },
    "pro": {
        "summaries_per_month": 300,
        "max_articles": -1,  # unlimited
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
    articles_saved: int
    articles_limit: int
    can_summarize: bool
    can_save_article: bool


class PaddleWebhookEvent(BaseModel):
    event_type: str
    data: dict


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
