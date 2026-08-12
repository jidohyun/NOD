"""Langfuse client singleton for AI observability."""

from __future__ import annotations

from typing import TYPE_CHECKING

from src.lib.config import settings

if TYPE_CHECKING:
    from langfuse import Langfuse

_client: Langfuse | None = None
_initialized: bool = False


def get_langfuse() -> Langfuse | None:
    """Return the Langfuse client singleton, or None when keys are not set."""
    global _client, _initialized
    if _initialized:
        return _client
    _initialized = True

    if not settings.LANGFUSE_PUBLIC_KEY or not settings.LANGFUSE_SECRET_KEY:
        return None

    from langfuse import Langfuse

    _client = Langfuse(
        public_key=settings.LANGFUSE_PUBLIC_KEY,
        secret_key=settings.LANGFUSE_SECRET_KEY,
        host=settings.LANGFUSE_HOST,
    )
    return _client
