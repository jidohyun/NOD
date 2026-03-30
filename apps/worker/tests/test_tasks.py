from __future__ import annotations

from typing import Any

import pytest

from src.routers import tasks


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

    await tasks.execute_task(
        tasks.TaskPayload(task_type="analysis", data={"article_id": "123"})
    )

    assert called == [{"article_id": "123"}]


@pytest.mark.asyncio
async def test_execute_task_ignores_unknown_task(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    warnings: list[str] = []

    def _fake_warning(message: str, **_: object) -> None:
        warnings.append(message)

    monkeypatch.setattr(tasks.logger, "warning", _fake_warning)
    monkeypatch.setattr("src.routers.task_registry.TASK_HANDLERS", {})

    await tasks.execute_task(tasks.TaskPayload(task_type="unknown", data={}))

    assert warnings == ["Unknown task type"]


@pytest.mark.asyncio
async def test_execute_task_warns_on_invalid_payload(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    warnings: list[str] = []

    async def _fake_handler(payload: tasks.TaskPayload) -> None:
        raise ValueError(f"bad payload: {payload.data!r}")

    def _fake_warning(message: str, **_: object) -> None:
        warnings.append(message)

    monkeypatch.setattr(tasks.logger, "warning", _fake_warning)
    monkeypatch.setattr(
        "src.routers.task_registry.TASK_HANDLERS",
        {"analysis": _fake_handler},
    )

    await tasks.execute_task(tasks.TaskPayload(task_type="analysis", data={}))

    assert warnings == ["Invalid task payload"]
