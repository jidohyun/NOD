import pytest
from fastapi.testclient import TestClient

from src.lib.config import settings
from src.main import check_redis


def test_health_check(client: TestClient) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["healthy", "degraded", "unhealthy"]
    assert "version" in data
    assert "services" in data
    assert "database" in data["services"]


def test_liveness_check(client: TestClient) -> None:
    response = client.get("/health/live")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_readiness_check(client: TestClient) -> None:
    response = client.get("/health/ready")
    # May return 200 or 503 depending on DB state
    assert response.status_code in [200, 503]


@pytest.mark.asyncio
async def test_check_redis_uses_runtime_import_without_name_error(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    class _DummyRedisClient:
        async def ping(self) -> bool:
            return True

        async def aclose(self) -> None:
            return None

    import redis.asyncio as redis_asyncio

    monkeypatch.setattr(settings, "REDIS_URL", "redis://unit-test")
    monkeypatch.setattr(
        redis_asyncio,
        "from_url",
        lambda _url: _DummyRedisClient(),
    )

    result = await check_redis()

    assert result is not None
    assert result.status == "healthy"
