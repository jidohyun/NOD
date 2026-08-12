import base64
import hashlib
import hmac
import json
import uuid
from collections.abc import Mapping
from datetime import UTC, datetime

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from src.lib import auth
from src.lib.auth import CurrentUserInfo, _ensure_user_exists


def _encode_segment(payload: Mapping[str, object]) -> str:
    raw = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    return base64.urlsafe_b64encode(raw).decode("utf-8").rstrip("=")


def _build_unsigned_jwt(payload: Mapping[str, object]) -> str:
    header = {"alg": "none", "typ": "JWT"}
    return f"{_encode_segment(header)}.{_encode_segment(payload)}.sig"


def _build_hs256_jwt(claims: Mapping[str, object], secret: str, kid: str | None) -> str:
    header: dict[str, object] = {"alg": "HS256", "typ": "JWT"}
    if kid:
        header["kid"] = kid

    encoded_header = _encode_segment(header)
    encoded_claims = _encode_segment(claims)
    signing_input = f"{encoded_header}.{encoded_claims}".encode()
    signature = hmac.new(
        secret.encode("utf-8"),
        signing_input,
        hashlib.sha256,
    ).digest()
    encoded_signature = base64.urlsafe_b64encode(signature).decode("utf-8").rstrip("=")
    return f"{encoded_header}.{encoded_claims}.{encoded_signature}"


@pytest.mark.asyncio
async def test_ensure_user_exists_rejects_non_uuid_user_id() -> None:
    with pytest.raises(HTTPException) as exc_info:
        await _ensure_user_exists(CurrentUserInfo(id="not-a-uuid"))

    assert exc_info.value.status_code == 401
    assert exc_info.value.detail == "Invalid token"


def test_me_returns_401_for_supabase_jwt_with_non_uuid_sub(client: TestClient) -> None:
    invalid_supabase_jwt = (
        "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0."
        "eyJzdWIiOiJub3QtYS11dWlkIiwiZXhwIjo0MTAyNDQ0ODAwfQ."
        "sig"
    )

    response = client.get(
        "/api/users/me",
        headers={"Authorization": f"Bearer {invalid_supabase_jwt}"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid token"


@pytest.mark.asyncio
async def test_decode_supabase_jwt_verifies_signature_and_claims(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    signing_secret = "signing-secret"  # noqa: S105
    subject = str(uuid.uuid4())
    claims = {
        "sub": subject,
        "exp": int(datetime.now(UTC).timestamp()) + 3600,
        "iss": "https://example.supabase.co/auth/v1",
        "aud": "authenticated",
        "email": "tester@example.com",
    }
    token = _build_hs256_jwt(claims=claims, secret=signing_secret, kid="test-kid")

    monkeypatch.setattr(auth.settings, "SUPABASE_VERIFY_JWT_SIGNATURE", True)
    monkeypatch.setattr(auth.settings, "SUPABASE_URL", "https://example.supabase.co")
    monkeypatch.setattr(auth.settings, "SUPABASE_JWT_SECRET", signing_secret)
    monkeypatch.setattr(auth.settings, "SUPABASE_JWT_ISSUER", None)
    monkeypatch.setattr(auth.settings, "SUPABASE_JWT_AUDIENCE", "authenticated")

    user = await auth._decode_supabase_jwt(token)

    assert user is not None
    assert user.id == subject
    assert user.email == "tester@example.com"


@pytest.mark.asyncio
async def test_decode_supabase_jwt_rejects_invalid_signature(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    signing_secret = "signing-secret"  # noqa: S105
    verify_secret = "verify-secret"  # noqa: S105

    claims = {
        "sub": str(uuid.uuid4()),
        "exp": int(datetime.now(UTC).timestamp()) + 3600,
        "iss": "https://example.supabase.co/auth/v1",
        "aud": "authenticated",
    }
    token = _build_hs256_jwt(claims=claims, secret=signing_secret, kid="different-kid")

    monkeypatch.setattr(auth.settings, "SUPABASE_VERIFY_JWT_SIGNATURE", True)
    monkeypatch.setattr(auth.settings, "SUPABASE_URL", "https://example.supabase.co")
    monkeypatch.setattr(auth.settings, "SUPABASE_JWT_SECRET", verify_secret)
    monkeypatch.setattr(auth.settings, "SUPABASE_JWT_ISSUER", None)
    monkeypatch.setattr(auth.settings, "SUPABASE_JWT_AUDIENCE", "authenticated")

    user = await auth._decode_supabase_jwt(token)

    assert user is None


@pytest.mark.asyncio
async def test_decode_supabase_jwt_accepts_legacy_hs256_without_kid(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    signing_secret = "legacy-secret"  # noqa: S105
    subject = str(uuid.uuid4())
    claims = {
        "sub": subject,
        "exp": int(datetime.now(UTC).timestamp()) + 3600,
        "iss": "https://example.supabase.co/auth/v1",
        "aud": "authenticated",
    }
    token = _build_hs256_jwt(claims=claims, secret=signing_secret, kid=None)

    monkeypatch.setattr(auth.settings, "SUPABASE_VERIFY_JWT_SIGNATURE", True)
    monkeypatch.setattr(auth.settings, "SUPABASE_URL", "https://example.supabase.co")
    monkeypatch.setattr(auth.settings, "SUPABASE_JWT_SECRET", signing_secret)
    monkeypatch.setattr(auth.settings, "SUPABASE_JWT_ISSUER", None)
    monkeypatch.setattr(auth.settings, "SUPABASE_JWT_AUDIENCE", "authenticated")

    user = await auth._decode_supabase_jwt(token)

    assert user is not None
    assert user.id == subject


@pytest.mark.asyncio
async def test_decode_supabase_jwt_rejects_hs256_without_secret(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    signing_secret = "legacy-secret"  # noqa: S105
    claims = {
        "sub": str(uuid.uuid4()),
        "exp": int(datetime.now(UTC).timestamp()) + 3600,
        "iss": "https://example.supabase.co/auth/v1",
        "aud": "authenticated",
    }
    token = _build_hs256_jwt(claims=claims, secret=signing_secret, kid=None)

    monkeypatch.setattr(auth.settings, "SUPABASE_VERIFY_JWT_SIGNATURE", True)
    monkeypatch.setattr(auth.settings, "SUPABASE_URL", "https://example.supabase.co")
    monkeypatch.setattr(auth.settings, "SUPABASE_JWT_ISSUER", None)
    monkeypatch.setattr(auth.settings, "SUPABASE_JWT_AUDIENCE", "authenticated")
    monkeypatch.setattr(auth.settings, "SUPABASE_JWT_SECRET", None)

    user = await auth._decode_supabase_jwt(token)

    assert user is None


@pytest.mark.asyncio
async def test_decode_supabase_jwt_rejects_disallowed_algorithm(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    token = _build_unsigned_jwt(
        {
            "sub": str(uuid.uuid4()),
            "exp": int(datetime.now(UTC).timestamp()) + 3600,
            "iss": "https://example.supabase.co/auth/v1",
            "aud": "authenticated",
        }
    )

    async def _fake_get_supabase_jwks() -> dict[str, object]:
        return {"keys": []}

    monkeypatch.setattr(auth, "_get_supabase_jwks", _fake_get_supabase_jwks)
    monkeypatch.setattr(auth.settings, "SUPABASE_VERIFY_JWT_SIGNATURE", True)
    monkeypatch.setattr(auth.settings, "SUPABASE_URL", "https://example.supabase.co")
    monkeypatch.setattr(auth.settings, "SUPABASE_JWT_ISSUER", None)
    monkeypatch.setattr(auth.settings, "SUPABASE_JWT_AUDIENCE", "authenticated")

    user = await auth._decode_supabase_jwt(token)

    assert user is None


@pytest.mark.asyncio
async def test_decode_supabase_jwt_uses_unverified_path_when_signature_disabled(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    subject = str(uuid.uuid4())
    token = _build_unsigned_jwt(
        {
            "sub": subject,
            "exp": int(datetime.now(UTC).timestamp()) + 3600,
            "aud": "authenticated",
            "email": "unsigned@example.com",
        }
    )

    monkeypatch.setattr(auth.settings, "SUPABASE_VERIFY_JWT_SIGNATURE", False)
    monkeypatch.setattr(auth.settings, "SUPABASE_URL", None)
    monkeypatch.setattr(auth.settings, "SUPABASE_JWT_ISSUER", None)
    monkeypatch.setattr(auth.settings, "SUPABASE_JWT_AUDIENCE", "authenticated")

    user = await auth._decode_supabase_jwt(token)

    assert user is not None
    assert user.id == subject
    assert user.email == "unsigned@example.com"
