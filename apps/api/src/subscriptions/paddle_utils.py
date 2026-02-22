from __future__ import annotations

from datetime import datetime
from typing import cast

import httpx

PADDLE_API_BASE: dict[str, str] = {
    "sandbox": "https://sandbox-api.paddle.com",
    "production": "https://api.paddle.com",
}


class PaddleAPIError(Exception):
    pass


def get_paddle_base_url(environment: str) -> str:
    return PADDLE_API_BASE.get(environment, PADDLE_API_BASE["sandbox"])


def map_paddle_status(paddle_status: str | None) -> str:
    status_map = {
        "active": "active",
        "canceled": "canceled",
        "past_due": "past_due",
        "paused": "paused",
        "trialing": "active",
    }
    return status_map.get(paddle_status or "", "active")


def parse_paddle_datetime(value: str | None) -> datetime | None:
    if not value:
        return None

    normalized_value = value[:-1] + "+00:00" if value.endswith("Z") else value
    try:
        return datetime.fromisoformat(normalized_value)
    except ValueError:
        return None


def extract_period_dates(
    data: dict[str, object],
) -> tuple[datetime | None, datetime | None]:
    period_data_raw = data.get("current_billing_period")
    if not isinstance(period_data_raw, dict):
        return None, None
    period_data = cast(dict[str, object], period_data_raw)

    starts_at_raw = period_data.get("starts_at")
    ends_at_raw = period_data.get("ends_at")

    starts_at = parse_paddle_datetime(
        starts_at_raw if isinstance(starts_at_raw, str) else None
    )
    ends_at = parse_paddle_datetime(
        ends_at_raw if isinstance(ends_at_raw, str) else None
    )
    return starts_at, ends_at


def extract_cancel_at(data: dict[str, object]) -> datetime | None:
    scheduled_change_raw = data.get("scheduled_change")
    if not isinstance(scheduled_change_raw, dict):
        return None
    scheduled_change = cast(dict[str, object], scheduled_change_raw)

    effective_at_raw = scheduled_change.get("effective_at")
    if not isinstance(effective_at_raw, str):
        return None
    return parse_paddle_datetime(effective_at_raw)


def extract_management_urls(
    subscription_data: dict[str, object],
) -> tuple[str | None, str | None]:
    management_urls_raw = subscription_data.get("management_urls")
    if not isinstance(management_urls_raw, dict):
        return None, None
    management_urls = cast(dict[str, object], management_urls_raw)

    cancel_url_raw = management_urls.get("cancel")
    update_payment_method_url_raw = management_urls.get("update_payment_method")

    cancel_url = cancel_url_raw if isinstance(cancel_url_raw, str) else None
    update_payment_method_url = (
        update_payment_method_url_raw
        if isinstance(update_payment_method_url_raw, str)
        else None
    )
    return cancel_url, update_payment_method_url


async def fetch_paddle_subscription(
    paddle_subscription_id: str,
    paddle_api_key: str,
    paddle_environment: str,
    client: httpx.AsyncClient | None = None,
    request_timeout: float = 10,
) -> dict[str, object]:
    base_url = get_paddle_base_url(paddle_environment)
    url = f"{base_url}/subscriptions/{paddle_subscription_id}"
    headers = {
        "Authorization": f"Bearer {paddle_api_key}",
        "Content-Type": "application/json",
    }

    should_close_client = client is None
    active_client = client if client is not None else httpx.AsyncClient()

    try:
        response = await active_client.get(
            url,
            headers=headers,
            timeout=request_timeout,
        )
    except httpx.HTTPError as exc:
        raise PaddleAPIError("Failed to fetch subscription from Paddle") from exc
    finally:
        if should_close_client:
            await active_client.aclose()

    if response.status_code != 200:
        raise PaddleAPIError("Failed to fetch subscription from Paddle")

    try:
        payload_raw = cast(object, response.json())
    except ValueError as exc:
        raise PaddleAPIError("Failed to decode Paddle response") from exc

    payload = (
        cast(dict[str, object], payload_raw) if isinstance(payload_raw, dict) else None
    )
    data = payload.get("data") if payload is not None else None
    if not isinstance(data, dict):
        raise PaddleAPIError("Invalid Paddle response payload")

    return cast(dict[str, object], data)
