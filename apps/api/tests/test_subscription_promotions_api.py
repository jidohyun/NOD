import uuid
from datetime import UTC, datetime

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pydantic import BaseModel

from src.lib.auth import get_current_user
from src.lib.database import get_db
from src.subscriptions import router


class _User(BaseModel):
    id: str
    email: str | None = None


class _DB:
    async def commit(self) -> None:
        return None


@pytest.fixture
def promo_client() -> TestClient:
    app = FastAPI()
    app.include_router(router.router, prefix="/api/subscriptions")

    async def _override_user() -> _User:
        return _User(id=str(uuid.uuid4()), email="user@example.com")

    async def _override_db() -> _DB:
        return _DB()

    app.dependency_overrides[get_current_user] = _override_user
    app.dependency_overrides[get_db] = _override_db
    return TestClient(app)


def test_redeem_promo_returns_404_for_invalid_code(
    promo_client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    async def _fake_redeem_promo_code(**_kwargs: object) -> object:
        raise router.service.PromoRedeemError("invalid_code")

    async def _fake_record_redeem_failure(**_kwargs: object) -> None:
        return None

    monkeypatch.setattr(router.service, "redeem_promo_code", _fake_redeem_promo_code)
    monkeypatch.setattr(
        router.service, "record_redeem_failure", _fake_record_redeem_failure
    )

    response = promo_client.post(
        "/api/subscriptions/promo/redeem", json={"code": "bad"}
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "invalid_code"


def test_redeem_promo_records_failure_and_commits(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    commit_called = {"value": False}

    class _CommitDB:
        async def commit(self) -> None:
            commit_called["value"] = True

    app = FastAPI()
    app.include_router(router.router, prefix="/api/subscriptions")

    async def _override_user() -> _User:
        return _User(id=str(uuid.uuid4()), email="user@example.com")

    async def _override_db() -> _CommitDB:
        return _CommitDB()

    app.dependency_overrides[get_current_user] = _override_user
    app.dependency_overrides[get_db] = _override_db

    async def _fake_redeem_promo_code(**_kwargs: object) -> object:
        raise router.service.PromoRedeemError("invalid_code")

    async def _fake_record_redeem_failure(**_kwargs: object) -> None:
        return None

    monkeypatch.setattr(router.service, "redeem_promo_code", _fake_redeem_promo_code)
    monkeypatch.setattr(
        router.service, "record_redeem_failure", _fake_record_redeem_failure
    )

    with TestClient(app) as client:
        response = client.post("/api/subscriptions/promo/redeem", json={"code": "bad"})

    assert response.status_code == 404
    assert commit_called["value"] is True


def test_redeem_promo_returns_200_on_success(
    promo_client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    async def _fake_redeem_promo_code(**_kwargs: object) -> object:
        return {
            "plan": "pro",
            "starts_at": datetime(2026, 3, 24, 12, 0, tzinfo=UTC),
            "ends_at": datetime(2026, 4, 24, 12, 0, tzinfo=UTC),
            "campaign_tag": "spring-launch",
            "message": "Promo applied",
        }

    monkeypatch.setattr(router.service, "redeem_promo_code", _fake_redeem_promo_code)

    response = promo_client.post(
        "/api/subscriptions/promo/redeem", json={"code": "SPRING2026"}
    )

    assert response.status_code == 200
    assert response.json()["plan"] == "pro"


def test_admin_create_requires_admin(promo_client: TestClient) -> None:
    response = promo_client.post(
        "/api/subscriptions/promo/admin/codes",
        json={"code": "SPRING2026", "grant_days": 30},
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "Admin permission required"


def test_admin_create_succeeds_for_admin(monkeypatch: pytest.MonkeyPatch) -> None:
    app = FastAPI()
    app.include_router(router.router, prefix="/api/subscriptions")

    admin_id = str(uuid.uuid4())

    async def _override_user() -> _User:
        return _User(id=admin_id, email="admin@example.com")

    async def _override_db() -> _DB:
        return _DB()

    app.dependency_overrides[get_current_user] = _override_user
    app.dependency_overrides[get_db] = _override_db

    async def _fake_create_promo_code(_db: object, **_kwargs: object) -> object:
        return {
            "id": str(uuid.uuid4()),
            "campaign_tag": "spring-launch",
            "grant_plan": "pro",
            "grant_days": 30,
            "max_redemptions": 100,
            "redeemed_count": 0,
            "per_user_limit": 1,
            "expires_at": None,
            "is_active": True,
            "created_at": datetime(2026, 3, 24, 12, 0, tzinfo=UTC),
        }

    monkeypatch.setattr(router.service, "create_promo_code", _fake_create_promo_code)
    monkeypatch.setattr(router.settings, "ADMIN_USER_IDS", [admin_id])

    with TestClient(app) as client:
        response = client.post(
            "/api/subscriptions/promo/admin/codes",
            json={"code": "SPRING2026", "grant_days": 30, "max_redemptions": 100},
        )

    assert response.status_code == 200
    assert response.json()["grant_days"] == 30


def test_admin_create_returns_409_for_duplicate_code(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    app = FastAPI()
    app.include_router(router.router, prefix="/api/subscriptions")

    admin_id = str(uuid.uuid4())

    async def _override_user() -> _User:
        return _User(id=admin_id, email="admin@example.com")

    async def _override_db() -> _DB:
        return _DB()

    app.dependency_overrides[get_current_user] = _override_user
    app.dependency_overrides[get_db] = _override_db

    async def _fake_create_promo_code(_db: object, **_kwargs: object) -> object:
        raise ValueError("promo_code_already_exists")

    monkeypatch.setattr(router.service, "create_promo_code", _fake_create_promo_code)
    monkeypatch.setattr(router.settings, "ADMIN_USER_IDS", [admin_id])

    with TestClient(app) as client:
        response = client.post(
            "/api/subscriptions/promo/admin/codes",
            json={"code": "SPRING2026", "grant_days": 30},
        )

    assert response.status_code == 409
    assert response.json()["detail"] == "promo_code_already_exists"


def test_get_current_promo_endpoint(
    promo_client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    async def _fake_get_current_promo_entitlement(
        _db: object, _user_id: object
    ) -> object:
        return {
            "has_active_promo": True,
            "plan": "pro",
            "starts_at": datetime(2026, 3, 24, 12, 0, tzinfo=UTC),
            "ends_at": datetime(2026, 4, 24, 12, 0, tzinfo=UTC),
            "campaign_tag": "spring-launch",
        }

    monkeypatch.setattr(
        router.service,
        "get_current_promo_entitlement",
        _fake_get_current_promo_entitlement,
    )

    response = promo_client.get("/api/subscriptions/promo/current")

    assert response.status_code == 200
    assert response.json()["has_active_promo"] is True


def test_admin_list_requires_admin(promo_client: TestClient) -> None:
    response = promo_client.get("/api/subscriptions/promo/admin/codes")

    assert response.status_code == 403
    assert response.json()["detail"] == "Admin permission required"


def test_admin_list_succeeds_for_admin(monkeypatch: pytest.MonkeyPatch) -> None:
    app = FastAPI()
    app.include_router(router.router, prefix="/api/subscriptions")

    admin_id = str(uuid.uuid4())

    async def _override_user() -> _User:
        return _User(id=admin_id, email="admin@example.com")

    async def _override_db() -> _DB:
        return _DB()

    app.dependency_overrides[get_current_user] = _override_user
    app.dependency_overrides[get_db] = _override_db

    async def _fake_list_promo_codes(_db: object, **_kwargs: object) -> list[object]:
        return [
            {
                "id": str(uuid.uuid4()),
                "campaign_tag": "spring-launch",
                "grant_plan": "pro",
                "grant_days": 30,
                "max_redemptions": 100,
                "redeemed_count": 1,
                "per_user_limit": 1,
                "expires_at": None,
                "is_active": True,
                "created_at": datetime(2026, 3, 24, 12, 0, tzinfo=UTC),
            }
        ]

    monkeypatch.setattr(router.service, "list_promo_codes", _fake_list_promo_codes)
    monkeypatch.setattr(router.settings, "ADMIN_USER_IDS", [admin_id])

    with TestClient(app) as client:
        response = client.get("/api/subscriptions/promo/admin/codes")

    assert response.status_code == 200
    assert len(response.json()["items"]) == 1
    assert response.json()["items"][0]["campaign_tag"] == "spring-launch"


def test_admin_disable_requires_admin(promo_client: TestClient) -> None:
    response = promo_client.post(
        f"/api/subscriptions/promo/admin/codes/{uuid.uuid4()}/disable"
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "Admin permission required"


def test_admin_disable_succeeds_for_admin(monkeypatch: pytest.MonkeyPatch) -> None:
    app = FastAPI()
    app.include_router(router.router, prefix="/api/subscriptions")

    admin_id = str(uuid.uuid4())

    async def _override_user() -> _User:
        return _User(id=admin_id, email="admin@example.com")

    async def _override_db() -> _DB:
        return _DB()

    app.dependency_overrides[get_current_user] = _override_user
    app.dependency_overrides[get_db] = _override_db

    async def _fake_disable_promo_code(_db: object, **_kwargs: object) -> object:
        return {
            "id": str(uuid.uuid4()),
            "campaign_tag": "spring-launch",
            "grant_plan": "pro",
            "grant_days": 30,
            "max_redemptions": 100,
            "redeemed_count": 10,
            "per_user_limit": 1,
            "expires_at": None,
            "is_active": False,
            "created_at": datetime(2026, 3, 24, 12, 0, tzinfo=UTC),
        }

    monkeypatch.setattr(router.service, "disable_promo_code", _fake_disable_promo_code)
    monkeypatch.setattr(router.settings, "ADMIN_USER_IDS", [admin_id])

    with TestClient(app) as client:
        response = client.post(
            f"/api/subscriptions/promo/admin/codes/{uuid.uuid4()}/disable"
        )

    assert response.status_code == 200
    assert response.json()["is_active"] is False


def test_admin_disable_returns_404_for_missing_code(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    app = FastAPI()
    app.include_router(router.router, prefix="/api/subscriptions")

    admin_id = str(uuid.uuid4())

    async def _override_user() -> _User:
        return _User(id=admin_id, email="admin@example.com")

    async def _override_db() -> _DB:
        return _DB()

    app.dependency_overrides[get_current_user] = _override_user
    app.dependency_overrides[get_db] = _override_db

    async def _fake_disable_promo_code(_db: object, **_kwargs: object) -> object:
        raise ValueError("promo_code_not_found")

    monkeypatch.setattr(router.service, "disable_promo_code", _fake_disable_promo_code)
    monkeypatch.setattr(router.settings, "ADMIN_USER_IDS", [admin_id])

    with TestClient(app) as client:
        response = client.post(
            f"/api/subscriptions/promo/admin/codes/{uuid.uuid4()}/disable"
        )

    assert response.status_code == 404
    assert response.json()["detail"] == "promo_code_not_found"
