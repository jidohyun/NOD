import uuid
from collections.abc import Awaitable, Callable

from src.jobs.analyze_article import analyze_article
from src.jobs.generate_embedding import generate_embedding
from src.routers.task_schemas import TaskPayload

TaskHandler = Callable[[TaskPayload], Awaitable[None]]


def require_article_id(payload: TaskPayload) -> str:
    article_id = payload.data.get("article_id")
    if not isinstance(article_id, str) or not article_id.strip():
        msg = "Task payload must include a non-empty article_id"
        raise ValueError(msg)

    normalized_article_id = article_id.strip()
    try:
        uuid.UUID(normalized_article_id)
    except ValueError as exc:
        msg = "Task payload article_id must be a valid UUID"
        raise ValueError(msg) from exc

    return normalized_article_id


async def _handle_analysis(payload: TaskPayload) -> None:
    article_id = require_article_id(payload)
    await analyze_article(article_id)


async def _handle_embedding(payload: TaskPayload) -> None:
    article_id = require_article_id(payload)
    await generate_embedding(article_id)


TASK_HANDLERS: dict[str, TaskHandler] = {
    "analysis": _handle_analysis,
    "embedding": _handle_embedding,
}
