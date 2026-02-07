"""Paddle webhook signature verification.

Verifies Paddle-Signature header using HMAC-SHA256.
No external dependencies — uses stdlib hashlib, hmac, time.
"""

import hashlib
import hmac
import time

from fastapi import HTTPException, Request, status


MAX_TIMESTAMP_AGE_SECONDS = 300  # 5 minutes


async def verify_paddle_signature(
    request: Request,
    webhook_secret: str,
) -> bytes:
    """Verify Paddle webhook signature and return raw body bytes.

    Paddle-Signature header format: ts=TIMESTAMP;h1=HMAC_SHA256_HEX

    Raises HTTPException(403) if verification fails.
    Returns raw body bytes for JSON parsing by the caller.
    """
    signature_header = request.headers.get("Paddle-Signature", "")
    if not signature_header:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Missing Paddle-Signature header",
        )

    # Parse ts and h1 from header
    parts: dict[str, str] = {}
    for part in signature_header.split(";"):
        if "=" in part:
            key, _, value = part.partition("=")
            parts[key.strip()] = value.strip()

    timestamp_str = parts.get("ts", "")
    expected_hmac = parts.get("h1", "")

    if not timestamp_str or not expected_hmac:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid Paddle-Signature format",
        )

    # Reject stale timestamps
    try:
        timestamp = int(timestamp_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid timestamp in Paddle-Signature",
        )

    age = int(time.time()) - timestamp
    if age > MAX_TIMESTAMP_AGE_SECONDS:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Paddle webhook timestamp too old",
        )

    # Read raw body
    raw_body = await request.body()

    # Compute HMAC-SHA256(secret, "ts:raw_body")
    signed_payload = f"{timestamp_str}:{raw_body.decode('utf-8')}"
    computed_hmac = hmac.new(
        webhook_secret.encode("utf-8"),
        signed_payload.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    # Timing-safe comparison
    if not hmac.compare_digest(computed_hmac, expected_hmac):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid Paddle webhook signature",
        )

    return raw_body
