from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    PROJECT_NAME: str = "fullstack-starter"
    PROJECT_ENV: Literal["local", "staging", "prod"] = "local"

    GOOGLE_CLOUD_PROJECT: str | None = None
    CLOUD_TASKS_QUEUE: str = "default"
    CLOUD_TASKS_LOCATION: str = "asia-northeast3"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/app"

    # AI
    AI_PROVIDER: Literal["gemini", "openai"] = "gemini"
    GEMINI_API_KEY: str | None = None
    OPENAI_API_KEY: str | None = None

    # Worker URL (self, for chaining tasks)
    WORKER_URL: str = "http://localhost:8080"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
