import uuid
from datetime import UTC, datetime
from types import SimpleNamespace
from typing import cast

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from src.extraction_failures import router
from src.extraction_failures.schemas import ExtractionFailureCreate
from src.lib.auth import CurrentUserInfo


class _FakeDB:
    async def commit(self) -> None:
        return None


@pytest.mark.asyncio
async def test_report_extraction_failure_converts_user_id_to_uuid(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    raw_user_id = str(uuid.uuid4())
    captured: dict[str, object] = {}

    async def _fake_create_failure(
        db: object,
        data: ExtractionFailureCreate,
        user_id: uuid.UUID | None = None,
    ) -> SimpleNamespace:
        assert db is not None
        captured["user_id"] = user_id
        return SimpleNamespace(
            id=uuid.uuid4(),
            url=data.url,
            domain="example.com",
            error_code=data.error_code,
            created_at=datetime.now(UTC),
        )

    monkeypatch.setattr(router.service, "create_failure", _fake_create_failure)

    response = await router.report_extraction_failure(
        ExtractionFailureCreate(
            url="https://example.com/article",
            error_code="blocked",
            error_message="Blocked by parser",
            page_title="Example",
            user_agent="UnitTest",
            extension_version="1.0.0",
        ),
        db=cast(AsyncSession, cast(object, _FakeDB())),
        user=CurrentUserInfo(id=raw_user_id),
    )

    assert captured["user_id"] == uuid.UUID(raw_user_id)
    assert response.url == "https://example.com/article"


@pytest.mark.asyncio
async def test_get_extraction_failure_stats_converts_user_id_to_uuid(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    raw_user_id = str(uuid.uuid4())
    captured: dict[str, object] = {}

    async def _fake_get_failure_stats(
        db: object,
        user_id: uuid.UUID | None = None,
        limit: int = 20,
    ) -> dict[str, int | list[dict[str, int | str]]]:
        assert db is not None
        assert limit == 20
        captured["user_id"] = user_id
        return {
            "total_failures": 1,
            "by_domain": [{"domain": "example.com", "count": 1}],
            "by_error_code": [{"error_code": "blocked", "count": 1}],
        }

    monkeypatch.setattr(router.service, "get_failure_stats", _fake_get_failure_stats)

    response = await router.get_extraction_failure_stats(
        db=cast(AsyncSession, object()),
        user=CurrentUserInfo(id=raw_user_id),
    )

    assert captured["user_id"] == uuid.UUID(raw_user_id)
    assert response.total_failures == 1
