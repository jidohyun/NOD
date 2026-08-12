from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI

from src.lib.config import settings
from src.routers import health, tasks


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    yield


app = FastAPI(
    title=f"{settings.PROJECT_NAME} Worker",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.PROJECT_ENV != "prod" else None,
)

app.include_router(health.router)
app.include_router(tasks.router, prefix="/tasks")
