import uuid as uuid_lib

from sqlalchemy import and_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from src.subscriptions import service
from src.subscriptions.model import PromoCode
from src.subscriptions.schemas import PromoCodeCreateRequest, PromoCodeResponse


async def create_promo_code(
    db: AsyncSession,
    *,
    actor_user_id: uuid_lib.UUID | str,
    payload: PromoCodeCreateRequest,
) -> PromoCodeResponse:
    actor_uid = service._normalize_user_id(actor_user_id)
    normalized = service._normalize_promo_code(payload.code)
    code_hash = service._hash_promo_code(normalized)

    promo_code = PromoCode(
        code_hash=code_hash,
        campaign_tag=payload.campaign_tag,
        grant_plan="pro",
        grant_days=payload.grant_days,
        max_redemptions=payload.max_redemptions,
        per_user_limit=payload.per_user_limit,
        expires_at=payload.normalized_expires_at,
        is_active=True,
        created_by=actor_uid,
    )
    db.add(promo_code)
    try:
        await db.flush()
    except IntegrityError as exc:
        raise ValueError("promo_code_already_exists") from exc
    await service._write_promo_audit_log(
        db,
        actor_user_id=actor_uid,
        action="code_created",
        target_type="promo_code",
        target_id=promo_code.id,
        payload={"campaign_tag": payload.campaign_tag or ""},
    )
    return PromoCodeResponse(
        id=promo_code.id,
        campaign_tag=promo_code.campaign_tag,
        grant_plan=promo_code.grant_plan,
        grant_days=promo_code.grant_days,
        max_redemptions=promo_code.max_redemptions,
        redeemed_count=promo_code.redeemed_count,
        per_user_limit=promo_code.per_user_limit,
        expires_at=promo_code.expires_at,
        is_active=promo_code.is_active,
        created_at=promo_code.created_at,
    )


async def list_promo_codes(
    db: AsyncSession,
    *,
    campaign_tag: str | None = None,
    is_active: bool | None = None,
) -> list[PromoCodeResponse]:
    conditions = []
    if campaign_tag:
        conditions.append(PromoCode.campaign_tag == campaign_tag)
    if is_active is not None:
        conditions.append(PromoCode.is_active.is_(is_active))

    query = select(PromoCode).order_by(PromoCode.created_at.desc())
    if conditions:
        query = query.where(and_(*conditions))

    result = await db.execute(query)
    codes = result.scalars().all()
    return [
        PromoCodeResponse(
            id=code.id,
            campaign_tag=code.campaign_tag,
            grant_plan=code.grant_plan,
            grant_days=code.grant_days,
            max_redemptions=code.max_redemptions,
            redeemed_count=code.redeemed_count,
            per_user_limit=code.per_user_limit,
            expires_at=code.expires_at,
            is_active=code.is_active,
            created_at=code.created_at,
        )
        for code in codes
    ]


async def disable_promo_code(
    db: AsyncSession,
    *,
    actor_user_id: uuid_lib.UUID | str,
    promo_code_id: uuid_lib.UUID,
) -> PromoCodeResponse:
    actor_uid = service._normalize_user_id(actor_user_id)
    result = await db.execute(select(PromoCode).where(PromoCode.id == promo_code_id))
    code = result.scalar_one_or_none()
    if not code:
        raise ValueError("promo_code_not_found")

    code.is_active = False
    await db.flush()
    await service._write_promo_audit_log(
        db,
        actor_user_id=actor_uid,
        action="code_disabled",
        target_type="promo_code",
        target_id=code.id,
        payload={"campaign_tag": code.campaign_tag or ""},
    )

    return PromoCodeResponse(
        id=code.id,
        campaign_tag=code.campaign_tag,
        grant_plan=code.grant_plan,
        grant_days=code.grant_days,
        max_redemptions=code.max_redemptions,
        redeemed_count=code.redeemed_count,
        per_user_limit=code.per_user_limit,
        expires_at=code.expires_at,
        is_active=code.is_active,
        created_at=code.created_at,
    )
