import uuid
from datetime import UTC, datetime
from typing import cast

import pytest
from sqlalchemy import CheckConstraint
from sqlalchemy.ext.asyncio import AsyncSession

from src.subscriptions import service
from src.subscriptions.model import (
    PromoCode,
    PromoRedemption,
    Subscription,
    UserPromoEntitlement,
)


def test_promo_code_constraints_and_columns_exist() -> None:
    code_hash_column = PromoCode.__table__.c.code_hash
    grant_days_column = PromoCode.__table__.c.grant_days

    assert code_hash_column.nullable is False
    assert code_hash_column.unique is True
    assert grant_days_column.nullable is False

    table_args = PromoCode.__table_args__
    assert isinstance(table_args, tuple)
    check_names = {
        cast(str, constraint.name)
        for constraint in table_args
        if isinstance(constraint, CheckConstraint)
    }
    assert any(name.endswith("promo_codes_grant_plan_valid") for name in check_names)
    assert any(name.endswith("promo_codes_grant_days_positive") for name in check_names)


def test_user_entitlement_plan_constraint_exists() -> None:
    table_args = UserPromoEntitlement.__table_args__
    assert isinstance(table_args, tuple)

    check_names = {
        cast(str, constraint.name)
        for constraint in table_args
        if isinstance(constraint, CheckConstraint)
    }
    assert any(
        name.endswith("user_promo_entitlements_plan_valid") for name in check_names
    )


def test_resolve_effective_plan_prefers_pro_when_promo_active() -> None:
    subscription = Subscription(user_id=uuid.uuid4(), plan="basic", status="active")

    plan, status = service.resolve_effective_plan(
        subscription=subscription, has_active_promo=True
    )

    assert plan == "pro"
    assert status == "active"


def test_resolve_effective_plan_keeps_basic_without_promo() -> None:
    subscription = Subscription(user_id=uuid.uuid4(), plan="basic", status="active")

    plan, status = service.resolve_effective_plan(
        subscription=subscription,
        has_active_promo=False,
    )

    assert plan == "basic"
    assert status == "active"


class _FakeResult:
    def __init__(self, value: object) -> None:
        self._value = value

    def scalar_one_or_none(self) -> object:
        return self._value

    def scalars(self) -> "_FakeResult":
        return self

    def first(self) -> object:
        return self._value


class _FakeDB:
    def __init__(self, execute_results: list[object]) -> None:
        self._execute_results = execute_results

    async def execute(self, _query: object) -> _FakeResult:
        value = self._execute_results.pop(0) if self._execute_results else None
        return _FakeResult(value)


@pytest.mark.asyncio
async def test_get_current_promo_entitlement_returns_inactive_when_not_found() -> None:
    db = _FakeDB(execute_results=[None])

    response = await service.get_current_promo_entitlement(
        db=cast(AsyncSession, cast(object, db)),
        user_id=uuid.uuid4(),
    )

    assert response.has_active_promo is False
    assert response.plan is None


@pytest.mark.asyncio
async def test_get_current_promo_entitlement_returns_campaign_data() -> None:
    entitlement = UserPromoEntitlement(
        user_id=uuid.uuid4(),
        promo_redemption_id=uuid.uuid4(),
        plan="pro",
        starts_at=datetime(2026, 3, 24, 12, 0, tzinfo=UTC),
        ends_at=datetime(2026, 4, 24, 12, 0, tzinfo=UTC),
        is_active=True,
    )
    code = PromoCode(
        code_hash="hash",
        campaign_tag="spring-launch",
        grant_plan="pro",
        grant_days=30,
        is_active=True,
    )
    db = _FakeDB(execute_results=[entitlement, code])

    response = await service.get_current_promo_entitlement(
        db=cast(AsyncSession, cast(object, db)),
        user_id=uuid.uuid4(),
    )

    assert response.has_active_promo is True
    assert response.plan == "pro"
    assert response.campaign_tag == "spring-launch"


def test_promo_redemption_status_constraint_exists() -> None:
    table_args = PromoRedemption.__table_args__
    assert isinstance(table_args, tuple)
    check_names = {
        cast(str, constraint.name)
        for constraint in table_args
        if isinstance(constraint, CheckConstraint)
    }
    assert any(name.endswith("promo_redemptions_status_valid") for name in check_names)


@pytest.mark.asyncio
async def test_redeem_extends_existing_active_entitlement(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    user_id = uuid.uuid4()
    promo_code = PromoCode(
        id=uuid.uuid4(),
        code_hash=service._hash_promo_code("SPRING2026"),
        campaign_tag="spring-launch",
        grant_plan="pro",
        grant_days=30,
        redeemed_count=0,
        per_user_limit=1,
        is_active=True,
    )
    existing_entitlement = UserPromoEntitlement(
        user_id=user_id,
        promo_redemption_id=uuid.uuid4(),
        plan="pro",
        starts_at=datetime(2026, 3, 1, 0, 0, tzinfo=UTC),
        ends_at=datetime(2026, 4, 1, 0, 0, tzinfo=UTC),
        is_active=True,
    )

    class _FakeCountResult:
        def scalar_one(self) -> int:
            return 0

    class _FakeScalarsResult:
        def __init__(self, value: object) -> None:
            self._value = value

        def scalars(self) -> "_FakeScalarsResult":
            return self

        def first(self) -> object:
            return self._value

    class _FakeRedeemDB:
        def __init__(self) -> None:
            self.added: list[object] = []
            self.calls = 0

        async def execute(self, _query: object) -> object:
            self.calls += 1
            if self.calls == 1:
                return _FakeResult(promo_code)
            if self.calls == 2:
                return _FakeCountResult()
            if self.calls == 3:
                return _FakeScalarsResult(existing_entitlement)
            return _FakeScalarsResult(None)

        def add(self, value: object) -> None:
            self.added.append(value)

        async def flush(self) -> None:
            return None

    fake_db = _FakeRedeemDB()

    async def _fake_write_promo_audit_log(_db: object, **_kwargs: object) -> None:
        return None

    monkeypatch.setattr(service, "_write_promo_audit_log", _fake_write_promo_audit_log)

    await service.redeem_promo_code(
        db=cast(AsyncSession, cast(object, fake_db)),
        user_id=user_id,
        code="spring2026",
    )

    entitlements = [
        item for item in fake_db.added if isinstance(item, UserPromoEntitlement)
    ]
    assert len(entitlements) == 1
    assert entitlements[0].ends_at == datetime(2026, 5, 1, 0, 0, tzinfo=UTC)
