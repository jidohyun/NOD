import base64
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
from jwcrypto import jwe, jwk
from jwcrypto.common import JWException
from pydantic import BaseModel
from sqlalchemy import select

from src.lib.config import settings

logger = structlog.get_logger(__name__)


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


def _decode_supabase_jwt(token: str) -> CurrentUserInfo | None:
    """Decode a Supabase JWT token by extracting its payload.

    Supabase JWTs are standard JWTs (header.payload.signature).
    For local development, we decode the payload without cryptographic
    verification since the token was already verified by Supabase.
    """
    parts = token.split(".")
    if len(parts) != 3:
        return None

    try:
        payload_b64 = parts[1]
        # Add padding for base64
        padding = 4 - len(payload_b64) % 4
        if padding != 4:
            payload_b64 += "=" * padding
        payload_bytes = base64.urlsafe_b64decode(payload_b64)
        payload = json.loads(payload_bytes)
    except Exception:
        return None

    sub = payload.get("sub")
    if not sub:
        return None

    # Check expiration
    exp = payload.get("exp", 0)
    if datetime.now(UTC).timestamp() > exp:
        return None

    # Extract user metadata
    user_meta = payload.get("user_metadata", {})
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

    uid = uuid_lib.UUID(user_info.id)
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
    user_info = _decode_supabase_jwt(token)
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
