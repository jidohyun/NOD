import asyncio
import base64
import hashlib
import hmac
import json
import uuid as uuid_lib
from collections.abc import Callable
from datetime import UTC, datetime, timedelta
from functools import wraps
from typing import Annotated, Any, Literal

import bcrypt
import httpx
import structlog
from fastapi import Depends, HTTPException, Request, status
from jwcrypto import jwe, jwk, jwt
from jwcrypto.common import JWException
from pydantic import BaseModel
from sqlalchemy import select

from src.lib.config import settings

logger = structlog.get_logger(__name__)

_SUPABASE_JWKS_CACHE: dict[str, Any] | None = None
_SUPABASE_JWKS_EXPIRES_AT: datetime = datetime.fromtimestamp(0, UTC)
_SUPABASE_JWKS_LOCK = asyncio.Lock()
_SUPABASE_ALLOWED_JWT_ALGS = frozenset({"RS256", "ES256", "EdDSA", "HS256"})


class TokenPayload(BaseModel):
    """JWT/JWE token payload."""

    user_id: str
    token_type: Literal["access", "refresh"]
    exp: int
    iat: int


class TokenResponse(BaseModel):
    """Token response."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"  # noqa: S105


class OAuthLoginRequest(BaseModel):
    """OAuth login request."""

    provider: Literal["google", "github", "facebook"]
    access_token: str
    email: str
    name: str | None = None


class RefreshTokenRequest(BaseModel):
    """Refresh token request."""

    refresh_token: str


class CredentialLoginRequest(BaseModel):
    """Email/password login request."""

    email: str
    password: str


class RegisterRequest(BaseModel):
    """Email/password register request."""

    email: str
    password: str
    name: str | None = None


class OAuthUserInfo(BaseModel):
    """OAuth user information from provider."""

    id: str
    email: str | None = None
    name: str | None = None
    image: str | None = None
    email_verified: bool = False


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    """Verify a password against its bcrypt hash."""
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


class CurrentUserInfo(BaseModel):
    """Current authenticated user info."""

    id: str
    email: str | None = None
    name: str | None = None
    image: str | None = None
    email_verified: bool = False


def _get_jwe_key() -> jwk.JWK:
    """Get JWK key for JWE encryption/decryption."""
    key_bytes = settings.JWE_SECRET_KEY.encode("utf-8")
    if len(key_bytes) < 32:
        key_bytes = key_bytes.ljust(32, b"\0")
    elif len(key_bytes) > 32:
        key_bytes = key_bytes[:32]
    return jwk.JWK(kty="oct", k=jwk.base64url_encode(key_bytes))


def create_access_token(user_id: str) -> str:
    """Create JWE access token."""
    now = datetime.now(UTC)
    payload = {
        "user_id": user_id,
        "token_type": "access",
        "exp": int((now + timedelta(hours=1)).timestamp()),
        "iat": int(now.timestamp()),
    }

    key = _get_jwe_key()
    jwe_token = jwe.JWE(
        json.dumps(payload).encode("utf-8"),
        recipient=key,
        protected={"alg": "A256KW", "enc": "A256GCM"},
    )
    return str(jwe_token.serialize(compact=True))


def create_refresh_token(user_id: str) -> str:
    """Create JWE refresh token."""
    now = datetime.now(UTC)
    payload = {
        "user_id": user_id,
        "token_type": "refresh",
        "exp": int((now + timedelta(days=7)).timestamp()),
        "iat": int(now.timestamp()),
    }

    key = _get_jwe_key()
    jwe_token = jwe.JWE(
        json.dumps(payload).encode("utf-8"),
        recipient=key,
        protected={"alg": "A256KW", "enc": "A256GCM"},
    )
    return str(jwe_token.serialize(compact=True))


def decode_token(token: str) -> TokenPayload:
    """Decode and validate JWE token."""
    try:
        key = _get_jwe_key()
        jwe_token = jwe.JWE()
        jwe_token.deserialize(token)
        jwe_token.decrypt(key)
        payload = json.loads(jwe_token.payload.decode("utf-8"))
        return TokenPayload(**payload)
    except JWException:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from None
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from None


async def verify_google_token(access_token: str) -> OAuthUserInfo:
    """Verify Google OAuth token."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=5.0,
        )
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Google access token",
            )
        data = response.json()
        return OAuthUserInfo(
            id=data["sub"],
            email=data["email"],
            name=data.get("name"),
            image=data.get("picture"),
            email_verified=data.get("email_verified", False),
        )


async def verify_github_token(access_token: str) -> OAuthUserInfo:
    """Verify GitHub OAuth token."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=5.0,
        )
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid GitHub access token",
            )
        data = response.json()
        return OAuthUserInfo(
            id=str(data["id"]),
            email=data.get("email"),
            name=data.get("name"),
            image=data.get("avatar_url"),
        )


async def verify_facebook_token(access_token: str) -> OAuthUserInfo:
    """Verify Facebook OAuth token."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://graph.facebook.com/me?fields=id,email,name,picture",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=5.0,
        )
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Facebook access token",
            )
        data = response.json()
        picture_url = data.get("picture", {}).get("data", {}).get("url")
        return OAuthUserInfo(
            id=data["id"],
            email=data.get("email"),
            name=data.get("name"),
            image=picture_url,
        )


async def verify_oauth_token(provider: str, access_token: str) -> OAuthUserInfo:
    """Verify OAuth token based on provider."""
    if provider == "google":
        return await verify_google_token(access_token)
    elif provider == "github":
        return await verify_github_token(access_token)
    elif provider == "facebook":
        return await verify_facebook_token(access_token)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported provider: {provider}",
        )


def _decode_supabase_jwt_payload_without_verification(
    token: str,
) -> dict[str, Any] | None:
    parts = token.split(".")
    if len(parts) != 3:
        return None

    try:
        payload_b64 = parts[1]
        padding = 4 - len(payload_b64) % 4
        if padding != 4:
            payload_b64 += "=" * padding
        payload_bytes = base64.urlsafe_b64decode(payload_b64)
        payload = json.loads(payload_bytes)
        if not isinstance(payload, dict):
            return None
        return payload
    except Exception:
        return None


def _verify_hs256_jwt_signature(token: str, secret: str) -> bool:
    parts = token.split(".")
    if len(parts) != 3:
        return False

    header_payload = f"{parts[0]}.{parts[1]}".encode()
    signature_b64 = parts[2]
    padding = 4 - len(signature_b64) % 4
    if padding != 4:
        signature_b64 += "=" * padding

    try:
        signature = base64.urlsafe_b64decode(signature_b64)
    except Exception:
        return False

    expected = hmac.new(
        secret.encode("utf-8"),
        header_payload,
        hashlib.sha256,
    ).digest()
    return hmac.compare_digest(signature, expected)


def _decode_supabase_jwt_header(token: str) -> dict[str, Any] | None:
    parts = token.split(".")
    if len(parts) != 3:
        return None

    try:
        header_b64 = parts[0]
        padding = 4 - len(header_b64) % 4
        if padding != 4:
            header_b64 += "=" * padding
        header_bytes = base64.urlsafe_b64decode(header_b64)
        header = json.loads(header_bytes)
        if not isinstance(header, dict):
            return None
        return header
    except Exception:
        return None


def _get_supabase_jwt_issuer() -> str | None:
    if settings.SUPABASE_JWT_ISSUER:
        return settings.SUPABASE_JWT_ISSUER.rstrip("/")

    if not settings.SUPABASE_URL:
        return None

    return f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1"


def _is_expected_audience(aud: object, expected_audience: str) -> bool:
    if isinstance(aud, str):
        return aud == expected_audience
    if isinstance(aud, list):
        return expected_audience in {value for value in aud if isinstance(value, str)}
    return False


def _is_valid_supabase_claims(payload: dict[str, Any]) -> bool:
    sub = payload.get("sub")
    if not isinstance(sub, str) or not sub:
        return False

    exp = payload.get("exp")
    if not isinstance(exp, int | float):
        return False
    if datetime.now(UTC).timestamp() > exp:
        return False

    issuer = _get_supabase_jwt_issuer()
    if issuer:
        token_issuer = payload.get("iss")
        if not isinstance(token_issuer, str) or token_issuer.rstrip("/") != issuer:
            return False

    if settings.SUPABASE_JWT_AUDIENCE:
        return _is_expected_audience(payload.get("aud"), settings.SUPABASE_JWT_AUDIENCE)

    return True


async def _get_supabase_jwks() -> dict[str, Any] | None:
    global _SUPABASE_JWKS_CACHE, _SUPABASE_JWKS_EXPIRES_AT

    now = datetime.now(UTC)
    if _SUPABASE_JWKS_CACHE and now < _SUPABASE_JWKS_EXPIRES_AT:
        return _SUPABASE_JWKS_CACHE

    if not settings.SUPABASE_URL:
        return None

    async with _SUPABASE_JWKS_LOCK:
        now = datetime.now(UTC)
        if _SUPABASE_JWKS_CACHE and now < _SUPABASE_JWKS_EXPIRES_AT:
            return _SUPABASE_JWKS_CACHE

        jwks_url = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/.well-known/jwks.json"
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(jwks_url, timeout=5.0)
            response.raise_for_status()
            body = response.json()
            keys = body.get("keys") if isinstance(body, dict) else None
            if not isinstance(keys, list) or not keys:
                return None
            _SUPABASE_JWKS_CACHE = {"keys": keys}
            ttl = max(settings.SUPABASE_JWKS_CACHE_TTL_SECONDS, 60)
            _SUPABASE_JWKS_EXPIRES_AT = now + timedelta(seconds=ttl)
            return _SUPABASE_JWKS_CACHE
        except Exception:
            return None


def _jwks_contains_kid(jwks: dict[str, Any], kid: str) -> bool:
    keys = jwks.get("keys")
    if not isinstance(keys, list):
        return False
    return any(isinstance(key, dict) and key.get("kid") == kid for key in keys)


async def _decode_supabase_jwt(token: str) -> CurrentUserInfo | None:
    payload: dict[str, Any] | None = None

    if settings.SUPABASE_VERIFY_JWT_SIGNATURE:
        header = _decode_supabase_jwt_header(token)
        if not header:
            return None

        alg = header.get("alg")
        if not isinstance(alg, str) or alg not in _SUPABASE_ALLOWED_JWT_ALGS:
            return None

        kid = header.get("kid")
        if alg == "HS256":
            secret = settings.SUPABASE_JWT_SECRET
            if not secret:
                return None
            if not _verify_hs256_jwt_signature(token, secret):
                return None
            payload = _decode_supabase_jwt_payload_without_verification(token)
            if payload is None:
                return None
        else:
            if not isinstance(kid, str) or not kid:
                return None

            jwks = await _get_supabase_jwks()
            if not jwks:
                return None

            if not _jwks_contains_kid(jwks, kid):
                return None

            try:
                keyset = jwk.JWKSet()
                keyset.import_keyset(json.dumps(jwks))
                verified = jwt.JWT(jwt=token, key=keyset)
                claims = json.loads(verified.claims)
                if not isinstance(claims, dict):
                    return None
                payload = claims
            except Exception:
                return None
    else:
        payload = _decode_supabase_jwt_payload_without_verification(token)

    if not payload or not _is_valid_supabase_claims(payload):
        return None

    sub = payload.get("sub")
    user_meta = payload.get("user_metadata", {})
    if not isinstance(user_meta, dict):
        user_meta = {}

    return CurrentUserInfo(
        id=sub,
        email=payload.get("email"),
        name=user_meta.get("full_name") or user_meta.get("name"),
        image=user_meta.get("avatar_url") or user_meta.get("picture"),
        email_verified=payload.get("email_confirmed_at") is not None,
    )


async def _ensure_user_exists(user_info: CurrentUserInfo) -> None:
    """Auto-create user row if it doesn't exist (for Supabase JWT users).

    Uses a standalone session to commit independently of the request session,
    so the user exists before the route handler's session tries to reference it.
    """
    from src.lib.database import async_session_factory
    from src.users.model import User

    try:
        uid = uuid_lib.UUID(user_info.id)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from None

    async with async_session_factory() as session:
        result = await session.execute(select(User.id).where(User.id == uid))
        if result.scalar_one_or_none() is not None:
            return

        user = User(
            id=uid,
            email=user_info.email or f"{user_info.id}@supabase.user",
            name=user_info.name,
            image=user_info.image,
            email_verified=user_info.email_verified,
        )
        session.add(user)
        try:
            await session.commit()
            logger.info("Auto-created user from Supabase JWT", user_id=str(uid))
        except Exception:
            await session.rollback()
            # User may have been created concurrently, which is fine
            logger.debug("User already exists (concurrent creation)", user_id=str(uid))


async def get_current_user(request: Request) -> CurrentUserInfo:
    """Get current authenticated user from Authorization header.

    Supports both JWE tokens (API-issued) and Supabase JWTs (extension/web).
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = auth_header.replace("Bearer ", "")

    # Try JWE token first (API-issued tokens)
    try:
        payload = decode_token(token)
        if payload.token_type != "access":  # noqa: S105
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
            )
        if datetime.now(UTC).timestamp() > payload.exp:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token expired",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return CurrentUserInfo(id=payload.user_id)
    except HTTPException:
        pass

    # Fallback: try Supabase JWT (from extension or web app)
    user_info = await _decode_supabase_jwt(token)
    if user_info:
        logger.debug("Authenticated via Supabase JWT", user_id=user_info.id)
        await _ensure_user_exists(user_info)
        return user_info

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid token",
        headers={"WWW-Authenticate": "Bearer"},
    )


async def get_optional_user(request: Request) -> CurrentUserInfo | None:
    """Get current user if authenticated, otherwise None."""
    try:
        return await get_current_user(request)
    except HTTPException:
        return None


CurrentUser = Annotated[CurrentUserInfo, Depends(get_current_user)]
OptionalUser = Annotated[CurrentUserInfo | None, Depends(get_optional_user)]


def require_auth(
    func: Callable[..., Any] | None = None,
) -> Callable[..., Any]:
    """Decorator to require authentication on a route.

    Usage:
        @router.get("/protected")
        @require_auth
        async def protected_route(user: CurrentUser):
            return {"user": user}
    """

    def decorator(f: Callable[..., Any]) -> Callable[..., Any]:
        @wraps(f)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            return await f(*args, **kwargs)

        return wrapper

    if func is not None:
        return decorator(func)
    return decorator
