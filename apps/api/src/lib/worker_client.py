from typing import Any

import httpx
import structlog

from src.lib.config import settings

logger = structlog.get_logger(__name__)


async def dispatch_worker_task(task_type: str, data: dict[str, Any]) -> None:
    """Dispatch a task to the worker service.

    In local development, calls the worker HTTP endpoint directly.
    In production, this would use Cloud Tasks.
    """
    worker_url = settings.WORKER_URL.rstrip("/")
    try:
        async with httpx.AsyncClient() as client:
            if settings.PROJECT_ENV == "local" or worker_url.startswith(
                "http://localhost"
            ):
                response = await client.post(
                    f"{worker_url}/tasks/process",
                    json={"task_type": task_type, "data": data},
                    timeout=10.0,
                )
            else:
                # Cloud Run -> Cloud Run authenticated call.
                # https://cloud.google.com/run/docs/authenticating/service-to-service
                token_resp = await client.get(
                    "http://metadata/computeMetadata/v1/instance/service-accounts/default/identity",
                    params={"audience": worker_url, "format": "full"},
                    headers={"Metadata-Flavor": "Google"},
                    timeout=2.0,
                )
                token_resp.raise_for_status()
                id_token = token_resp.text

                response = await client.post(
                    f"{worker_url}/tasks/process",
                    json={"task_type": task_type, "data": data},
                    headers={"Authorization": f"Bearer {id_token}"},
                    timeout=10.0,
                )
            response.raise_for_status()
            logger.info("Worker task dispatched", task_type=task_type, data=data)
    except Exception:
        logger.exception("Failed to dispatch worker task", task_type=task_type)
        raise
