import uuid
from datetime import UTC, datetime
from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel
from sqlalchemy import select

from src.lib.dependencies import CurrentUser, DBSession
from src.users.model import User

router = APIRouter()


class UserMeResponse(BaseModel):
    id: str
    email: str
    name: str | None = None
    image: str | None = None
    email_verified: bool = False
    preferred_locale: str | None = None
    onboarding_completed_at: datetime | None = None


class UpdateUserMeRequest(BaseModel):
    preferred_locale: Literal["ko", "en", "ja"] | None = None
    onboarding_completed: bool | None = None


async def _get_or_create_user(db: DBSession, user: CurrentUser) -> User:
    uid = uuid.UUID(user.id)
    result = await db.execute(select(User).where(User.id == uid))
    existing = result.scalar_one_or_none()
    if existing is not None:
        return existing

    model = User(
        id=uid,
        email=user.email or f"{user.id}@supabase.user",
        name=user.name,
        image=user.image,
        email_verified=user.email_verified,
    )
    db.add(model)
    await db.commit()
    await db.refresh(model)
    return model


def _to_response(model: User) -> UserMeResponse:
    return UserMeResponse(
        id=str(model.id),
        email=model.email,
        name=model.name,
        image=model.image,
        email_verified=model.email_verified,
        preferred_locale=model.preferred_locale,
        onboarding_completed_at=model.onboarding_completed_at,
    )


@router.get("/me", response_model=UserMeResponse)
async def get_me(db: DBSession, user: CurrentUser) -> UserMeResponse:
    model = await _get_or_create_user(db, user)
    return _to_response(model)


@router.patch("/me", response_model=UserMeResponse)
async def patch_me(
    request: UpdateUserMeRequest,
    db: DBSession,
    user: CurrentUser,
) -> UserMeResponse:
    model = await _get_or_create_user(db, user)

    if request.preferred_locale is not None:
        model.preferred_locale = request.preferred_locale

    if request.onboarding_completed is True:
        if model.onboarding_completed_at is None:
            model.onboarding_completed_at = datetime.now(UTC)
    elif request.onboarding_completed is False:
        model.onboarding_completed_at = None

    await db.commit()
    await db.refresh(model)
    return _to_response(model)
