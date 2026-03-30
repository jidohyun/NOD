from collections.abc import Awaitable, Callable

from src.jobs.analyze_article import analyze_article
from src.jobs.generate_embedding import generate_embedding
from src.routers.tasks import TaskPayload

TaskHandler = Callable[[TaskPayload], Awaitable[None]]


async def _handle_analysis(payload: TaskPayload) -> None:
    article_id = str(payload.data.get("article_id", ""))
    await analyze_article(article_id)


async def _handle_embedding(payload: TaskPayload) -> None:
    article_id = str(payload.data.get("article_id", ""))
    await generate_embedding(article_id)


TASK_HANDLERS: dict[str, TaskHandler] = {
    "analysis": _handle_analysis,
    "embedding": _handle_embedding,
}
