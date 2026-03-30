from __future__ import annotations

import uuid
from typing import Any

import pytest

from src.routers import tasks
from src.routers.task_schemas import TaskPayload


@pytest.mark.asyncio
async def test_execute_task_dispatches_registered_handler(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    called: list[dict[str, Any]] = []

    async def _fake_handler(payload: tasks.TaskPayload) -> None:
        called.append(payload.data)

    monkeypatch.setattr(
        "src.routers.task_registry.TASK_HANDLERS",
        {"analysis": _fake_handler},
    )

    article_id = str(uuid.uuid4())

    await tasks.execute_task(
        TaskPayload(task_type="analysis", data={"article_id": article_id})
    )

    assert called == [{"article_id": article_id}]


@pytest.mark.asyncio
async def test_execute_task_ignores_unknown_task(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    warnings: list[str] = []

    def _fake_warning(message: str, **_: object) -> None:
        warnings.append(message)

    monkeypatch.setattr(tasks.logger, "warning", _fake_warning)
    monkeypatch.setattr("src.routers.task_registry.TASK_HANDLERS", {})

    await tasks.execute_task(TaskPayload(task_type="unknown", data={}))

    assert warnings == ["Unknown task type"]


@pytest.mark.asyncio
async def test_execute_task_raises_on_invalid_payload(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    warnings: list[str] = []

    def _fake_warning(message: str, **_: object) -> None:
        warnings.append(message)

    monkeypatch.setattr(tasks.logger, "warning", _fake_warning)

    with pytest.raises(ValueError, match="valid UUID"):
        await tasks.execute_task(TaskPayload(task_type="analysis", data={"article_id": "not-a-uuid"}))

    assert warnings == ["Invalid task payload"]
