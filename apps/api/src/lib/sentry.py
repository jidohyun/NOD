"""Sentry SDK initialization for error tracking and performance monitoring."""

from typing import Any

import sentry_sdk
from sentry_sdk.integrations.asyncio import AsyncioIntegration
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.httpx import HttpxIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from sentry_sdk.integrations.starlette import StarletteIntegration

from src.lib.config import settings


def configure_sentry() -> None:
    """Initialize Sentry SDK if DSN is configured."""
    if not settings.SENTRY_DSN:
        return

    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        environment=settings.PROJECT_ENV,
        release=f"nod-api@{settings.APP_VERSION}",
        traces_sample_rate=0.1 if settings.PROJECT_ENV == "prod" else 1.0,
        profiles_sample_rate=0.1 if settings.PROJECT_ENV == "prod" else 1.0,
        before_send=_before_send,
        integrations=[
            StarletteIntegration(transaction_style="endpoint"),
            FastApiIntegration(transaction_style="endpoint"),
            SqlalchemyIntegration(),
            HttpxIntegration(),
            AsyncioIntegration(),
        ],
        send_default_pii=False,
    )


def _before_send(event: dict[str, Any], hint: dict[str, Any]) -> dict[str, Any] | None:
    """Filter out noisy or expected errors."""
    if "exc_info" in hint:
        _, exc_value, _ = hint["exc_info"]
        from fastapi import HTTPException

        if isinstance(exc_value, HTTPException) and exc_value.status_code < 500:
            return None
    return event
