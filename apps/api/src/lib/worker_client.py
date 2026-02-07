import httpx
import structlog

from src.lib.config import settings

logger = structlog.get_logger(__name__)


async def dispatch_worker_task(task_type: str, data: dict) -> None:
    """Dispatch a task to the worker service.

    In local development, calls the worker HTTP endpoint directly.
    In production, this would use Cloud Tasks.
    """
    worker_url = settings.WORKER_URL
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{worker_url}/tasks/process",
                json={"task_type": task_type, "data": data},
                timeout=10.0,
            )
            response.raise_for_status()
            logger.info("Worker task dispatched", task_type=task_type, data=data)
    except Exception:
        logger.exception("Failed to dispatch worker task", task_type=task_type)
        raise
