import uuid
from datetime import UTC, datetime
from types import SimpleNamespace

import pytest
from sqlalchemy.exc import IntegrityError

import src.subscriptions.promo_admin_service as promo_admin_service
from src.subscriptions import service


class _ScalarResult:
    def __init__(self, value: object) -> None:
        self._value = value

    def scalar_one_or_none(self) -> object:
        return self._value

    def scalars(self) -> "_ScalarResult":
        return self

    def all(self) -> list[object]:
        if isinstance(self._value, list):
            return self._value
        return []


class _CreateDB:
    def __init__(self, *, flush_error: Exception | None = None) -> None:
        self.added: list[object] = []
        self.flush_error = flush_error

    def add(self, value: object) -> None:
        if hasattr(value, "id") and getattr(value, "id", None) is None:
            value.id = uuid.uuid4()
        if hasattr(value, "created_at") and getattr(value, "created_at", None) is None:
            value.created_at = datetime(2026, 3, 25, 0, 0, tzinfo=UTC)
        if (
            hasattr(value, "redeemed_count")
            and getattr(value, "redeemed_count", None) is None
        ):
            value.redeemed_count = 0
        self.added.append(value)

    async def flush(self) -> None:
        if self.flush_error is not None:
            raise self.flush_error


class _ExecuteDB:
    def __init__(self, execute_results: list[object]) -> None:
        self.execute_results = execute_results
        self.added: list[object] = []

    async def execute(self, _query: object) -> _ScalarResult:
        value = self.execute_results.pop(0) if self.execute_results else None
        return _ScalarResult(value)

    def add(self, value: object) -> None:
        self.added.append(value)

    async def flush(self) -> None:
        return None


@pytest.mark.asyncio
async def test_create_promo_code_returns_response(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    db = _CreateDB()
    actor_id = str(uuid.uuid4())
    payload = SimpleNamespace(
        code="SPRING2026",
        campaign_tag="spring-launch",
        grant_days=30,
        max_redemptions=100,
        per_user_limit=1,
        normalized_expires_at=None,
    )

    async def _fake_write_promo_audit_log(_db: object, **_kwargs: object) -> None:
        return None

    monkeypatch.setattr(service, "_write_promo_audit_log", _fake_write_promo_audit_log)

    response = await promo_admin_service.create_promo_code(
        db=db, actor_user_id=actor_id, payload=payload
    )

    assert response.grant_plan == "pro"
    assert response.grant_days == 30
    assert response.is_active is True


@pytest.mark.asyncio
async def test_create_promo_code_maps_integrity_error_to_value_error() -> None:
    db = _CreateDB(flush_error=IntegrityError("stmt", {}, Exception("dup")))
    payload = SimpleNamespace(
        code="SPRING2026",
        campaign_tag=None,
        grant_days=30,
        max_redemptions=None,
        per_user_limit=1,
        normalized_expires_at=None,
    )

    with pytest.raises(ValueError, match="promo_code_already_exists"):
        await promo_admin_service.create_promo_code(
            db=db, actor_user_id=str(uuid.uuid4()), payload=payload
        )


@pytest.mark.asyncio
async def test_list_promo_codes_returns_mapped_items() -> None:
    now = datetime(2026, 3, 25, 0, 0, tzinfo=UTC)
    code = SimpleNamespace(
        id=uuid.uuid4(),
        campaign_tag="spring-launch",
        grant_plan="pro",
        grant_days=30,
        max_redemptions=100,
        redeemed_count=2,
        per_user_limit=1,
        expires_at=None,
        is_active=True,
        created_at=now,
    )
    db = _ExecuteDB([[code]])

    items = await promo_admin_service.list_promo_codes(db)

    assert len(items) == 1
    assert items[0].campaign_tag == "spring-launch"
    assert items[0].redeemed_count == 2


@pytest.mark.asyncio
async def test_disable_promo_code_returns_not_found_error() -> None:
    db = _ExecuteDB([None])

    with pytest.raises(ValueError, match="promo_code_not_found"):
        await promo_admin_service.disable_promo_code(
            db=db,
            actor_user_id=str(uuid.uuid4()),
            promo_code_id=uuid.uuid4(),
        )
