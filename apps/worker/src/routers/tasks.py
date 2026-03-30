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

    from src.routers.task_registry import TASK_HANDLERS

    handler = TASK_HANDLERS.get(payload.task_type)
    if handler is None:
        logger.warning("Unknown task type", task_type=payload.task_type)
        return

    try:
        await handler(payload)
    except ValueError as exc:
        logger.warning(
            "Invalid task payload",
            task_type=payload.task_type,
            error=str(exc),
            data=payload.data,
        )
