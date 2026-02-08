import os
from functools import lru_cache
from typing import Literal, cast
from urllib.parse import quote_plus

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    PROJECT_NAME: str = "fullstack-starter"
    PROJECT_ENV: Literal["local", "dev", "staging", "prod"] = "local"
    ENVIRONMENT: str | None = None

    GOOGLE_CLOUD_PROJECT: str | None = None
    CLOUD_TASKS_QUEUE: str = "default"
    CLOUD_TASKS_LOCATION: str = "asia-northeast3"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/app"
    DATABASE_HOST: str | None = None
    DATABASE_NAME: str | None = None
    DATABASE_USER: str | None = None
    DATABASE_PASSWORD: str | None = None
    DATABASE_PORT: int = 5432

    # AI
    AI_PROVIDER: Literal["gemini", "openai"] = "gemini"
    GEMINI_API_KEY: str | None = None
    OPENAI_API_KEY: str | None = None

    # Worker URL (self, for chaining tasks)
    WORKER_URL: str = "http://localhost:8080"

    def model_post_init(self, __context: object) -> None:
        if (
            self.ENVIRONMENT
            and self.PROJECT_ENV == "local"
            and self.ENVIRONMENT in {"local", "dev", "staging", "prod"}
        ):
            self.PROJECT_ENV = cast(
                Literal["local", "dev", "staging", "prod"],
                self.ENVIRONMENT,
            )

        if (
            os.getenv("DATABASE_URL") is None
            and self.DATABASE_HOST
            and self.DATABASE_NAME
            and self.DATABASE_USER
            and self.DATABASE_PASSWORD
        ):
            user = quote_plus(self.DATABASE_USER)
            password = quote_plus(self.DATABASE_PASSWORD)
            host = self.DATABASE_HOST
            port = self.DATABASE_PORT
            name = quote_plus(self.DATABASE_NAME)
            self.DATABASE_URL = (
                f"postgresql+asyncpg://{user}:{password}@{host}:{port}/{name}"
            )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
