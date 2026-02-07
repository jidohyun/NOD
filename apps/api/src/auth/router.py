from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from src.lib.auth import (
    CredentialLoginRequest,
    OAuthLoginRequest,
    RefreshTokenRequest,
    RegisterRequest,
    TokenResponse,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_oauth_token,
    verify_password,
)
from src.lib.dependencies import DBSession
from src.users.model import User

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
async def login(
    request: OAuthLoginRequest,
    db: DBSession,
) -> TokenResponse:
    """OAuth login endpoint.

    Verify OAuth token, create/update user, and issue JWE tokens.
    """
    user_info = await verify_oauth_token(request.provider, request.access_token)

    result = await db.execute(select(User).where(User.email == user_info.email))
    user = result.scalar_one_or_none()

    if not user:
        user = User(
            email=user_info.email,
            name=user_info.name,
            image=user_info.image,
            email_verified=user_info.email_verified,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token(str(user.id))

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.post("/register", response_model=TokenResponse)
async def register(
    request: RegisterRequest,
    db: DBSession,
) -> TokenResponse:
    """Register with email and password."""
    if len(request.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters",
        )

    result = await db.execute(select(User).where(User.email == request.email))
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already in use",
        )

    user = User(
        email=request.email,
        name=request.name,
        password_hash=hash_password(request.password),
        email_verified=False,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token(str(user.id))

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.post("/login/credentials", response_model=TokenResponse)
async def login_credentials(
    request: CredentialLoginRequest,
    db: DBSession,
) -> TokenResponse:
    """Login with email and password."""
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()

    if not user or not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token(str(user.id))

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    request: RefreshTokenRequest,
    db: DBSession,
) -> TokenResponse:
    """Refresh access token using refresh token."""
    payload = decode_token(request.refresh_token)

    if payload.token_type != "refresh":  # noqa: S105
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
        )

    result = await db.execute(select(User).where(User.id == UUID(payload.user_id)))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    access_token = create_access_token(str(user.id))

    return TokenResponse(
        access_token=access_token,
        refresh_token=request.refresh_token,
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout() -> None:
    """Logout endpoint.

    Client should remove tokens from localStorage.
    """
    return None
