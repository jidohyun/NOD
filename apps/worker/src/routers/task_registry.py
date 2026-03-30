from collections.abc import Awaitable, Callable

from src.jobs.analyze_article import analyze_article
from src.jobs.generate_embedding import generate_embedding
from src.routers.tasks import TaskPayload

TaskHandler = Callable[[TaskPayload], Awaitable[None]]


def require_article_id(payload: TaskPayload) -> str:
    article_id = payload.data.get("article_id")
    if not isinstance(article_id, str) or not article_id.strip():
        msg = "Task payload must include a non-empty article_id"
        raise ValueError(msg)
    return article_id.strip()


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
