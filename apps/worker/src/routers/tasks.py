import structlog
from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel

logger = structlog.get_logger(__name__)

router = APIRouter(tags=["Tasks"])


class TaskPayload(BaseModel):
    task_type: str
    data: dict[str, object]


@router.post("/process")
async def process_task(
    payload: TaskPayload,
    background_tasks: BackgroundTasks,
) -> dict[str, str]:
    background_tasks.add_task(execute_task, payload)
    return {"status": "accepted"}


async def execute_task(payload: TaskPayload) -> None:
    logger.info("Executing task", task_type=payload.task_type, data=payload.data)

    match payload.task_type:
        case "analysis":
            from src.jobs.analyze_article import analyze_article
            article_id = str(payload.data.get("article_id", ""))
            await analyze_article(article_id)

        case "embedding":
            from src.jobs.generate_embedding import generate_embedding
            article_id = str(payload.data.get("article_id", ""))
            await generate_embedding(article_id)

        case _:
            logger.warning("Unknown task type", task_type=payload.task_type)
