"""Discord webhook alerting for critical events."""

import httpx
import structlog

from src.lib.config import settings

logger = structlog.get_logger(__name__)

ALERT_CRITICAL = 0xFF0000
ALERT_WARNING = 0xFFA500
ALERT_INFO = 0x00BFFF
ALERT_SUCCESS = 0x00FF00


async def send_discord_alert(
    title: str,
    description: str,
    color: int = ALERT_CRITICAL,
    fields: list[dict[str, str]] | None = None,
) -> None:
    """Send an alert to Discord webhook."""
    if not settings.DISCORD_WEBHOOK_URL:
        return

    embed = {
        "title": title,
        "description": description,
        "color": color,
        "fields": fields or [],
    }

    try:
        async with httpx.AsyncClient() as client:
            await client.post(
                settings.DISCORD_WEBHOOK_URL,
                json={"embeds": [embed]},
                timeout=5.0,
            )
    except Exception:
        logger.exception("Failed to send Discord alert")
