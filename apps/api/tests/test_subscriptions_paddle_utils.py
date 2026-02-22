from datetime import datetime

import httpx
import pytest

from src.subscriptions.paddle_utils import (
    PaddleAPIError,
    extract_management_urls,
    extract_period_dates,
    fetch_paddle_subscription,
    get_paddle_base_url,
    map_paddle_status,
    parse_paddle_datetime,
)


def test_get_paddle_base_url_for_known_and_unknown_environment() -> None:
    assert get_paddle_base_url("sandbox") == "https://sandbox-api.paddle.com"
    assert get_paddle_base_url("production") == "https://api.paddle.com"
    assert get_paddle_base_url("staging") == "https://sandbox-api.paddle.com"


@pytest.mark.parametrize(
    ("paddle_status", "expected"),
    [
        ("active", "active"),
        ("canceled", "canceled"),
        ("past_due", "past_due"),
        ("paused", "paused"),
        ("trialing", "active"),
        ("unknown", "active"),
        (None, "active"),
    ],
)
def test_map_paddle_status_defaults_safely(
    paddle_status: str | None,
    expected: str,
) -> None:
    assert map_paddle_status(paddle_status) == expected


def test_parse_paddle_datetime_accepts_z_suffix() -> None:
    parsed = parse_paddle_datetime("2026-01-02T03:04:05Z")
    assert parsed is not None
    assert parsed.isoformat() == "2026-01-02T03:04:05+00:00"


def test_parse_paddle_datetime_accepts_offset() -> None:
    parsed = parse_paddle_datetime("2026-01-02T03:04:05+09:00")
    assert parsed is not None
    assert parsed.isoformat() == "2026-01-02T03:04:05+09:00"


def test_parse_paddle_datetime_returns_none_for_invalid_value() -> None:
    assert parse_paddle_datetime("not-a-date") is None
    assert parse_paddle_datetime(None) is None


def test_extract_period_dates_parses_and_tolerates_invalid_values() -> None:
    starts_at, ends_at = extract_period_dates(
        {
            "current_billing_period": {
                "starts_at": "2026-01-01T00:00:00Z",
                "ends_at": "invalid-date",
            }
        }
    )
    assert isinstance(starts_at, datetime)
    assert ends_at is None


def test_extract_management_urls_returns_optional_urls() -> None:
    cancel_url, update_payment_method_url = extract_management_urls(
        {
            "management_urls": {
                "cancel": "https://example.com/cancel",
                "update_payment_method": "https://example.com/update",
            }
        }
    )
    assert cancel_url == "https://example.com/cancel"
    assert update_payment_method_url == "https://example.com/update"

    missing_cancel_url, missing_update_payment_method_url = extract_management_urls({})
    assert missing_cancel_url is None
    assert missing_update_payment_method_url is None


@pytest.mark.asyncio
async def test_fetch_paddle_subscription_returns_data_payload() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url == httpx.URL(
            "https://sandbox-api.paddle.com/subscriptions/sub_123"
        )
        assert request.headers["Authorization"] == "Bearer test-key"
        return httpx.Response(
            200,
            json={"data": {"id": "sub_123", "management_urls": {}}},
        )

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        data = await fetch_paddle_subscription(
            paddle_subscription_id="sub_123",
            paddle_api_key="test-key",
            paddle_environment="sandbox",
            client=client,
        )

    assert data["id"] == "sub_123"


@pytest.mark.asyncio
async def test_fetch_paddle_subscription_raises_on_non_200_response() -> None:
    def handler(_request: httpx.Request) -> httpx.Response:
        return httpx.Response(500, text="failure")

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        with pytest.raises(PaddleAPIError):
            _ = await fetch_paddle_subscription(
                paddle_subscription_id="sub_123",
                paddle_api_key="test-key",
                paddle_environment="sandbox",
                client=client,
            )


@pytest.mark.asyncio
async def test_fetch_paddle_subscription_raises_on_transport_error() -> None:
    def handler(_request: httpx.Request) -> httpx.Response:
        raise httpx.ReadTimeout("timeout")

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        with pytest.raises(PaddleAPIError):
            _ = await fetch_paddle_subscription(
                paddle_subscription_id="sub_123",
                paddle_api_key="test-key",
                paddle_environment="sandbox",
                client=client,
            )
