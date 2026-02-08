import os
from functools import lru_cache
from typing import Literal, cast
from urllib.parse import quote_plus

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # Project
    PROJECT_NAME: str = "fullstack-starter-api"
    PROJECT_ENV: Literal["local", "dev", "staging", "prod"] = "local"
    ENVIRONMENT: str | None = None

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/app"
    DATABASE_URL_SYNC: str = "postgresql://postgres:postgres@localhost:5432/app"
    DATABASE_HOST: str | None = None
    DATABASE_NAME: str | None = None
    DATABASE_USER: str | None = None
    DATABASE_PASSWORD: str | None = None
    DATABASE_PORT: int = 5432

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    # Auth (better-auth)
    BETTER_AUTH_URL: str = "http://localhost:3000"

    # JWT/JWE (stateless authentication)
    JWT_SECRET: str = "your-super-secret-jwt-key-change-in-production"  # noqa: S105
    JWE_SECRET_KEY: str = "your-super-secret-jwe-encryption-key-change-in-production"  # noqa: S105

    # Redis (optional)
    REDIS_URL: str | None = None
    REDIS_HOST: str | None = None
    REDIS_PORT: int | None = None

    # Worker
    WORKER_URL: str = "http://localhost:8080"

    # OpenTelemetry (optional)
    OTEL_EXPORTER_OTLP_ENDPOINT: str | None = None
    OTEL_SERVICE_NAME: str | None = None

    # AI (optional)
    AI_PROVIDER: Literal["gemini", "openai"] = "gemini"
    GOOGLE_CLOUD_PROJECT: str | None = None
    GEMINI_API_KEY: str | None = None
    OPENAI_API_KEY: str | None = None

    # Storage (optional)
    STORAGE_BACKEND: Literal["gcs", "s3", "minio"] = "minio"
    GCS_BUCKET_NAME: str | None = None
    STORAGE_BUCKET: str | None = None
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"  # noqa: S105

    # Paddle Billing
    PADDLE_API_KEY: str | None = None
    PADDLE_WEBHOOK_SECRET: str | None = None
    PADDLE_CLIENT_TOKEN: str | None = None
    PADDLE_PRICE_ID_PRO: str | None = None
    PADDLE_ENVIRONMENT: Literal["sandbox", "production"] = "sandbox"

    def model_post_init(self, __context: object) -> None:
        # Backward compatible: support Terraform's ENVIRONMENT variable.
        if (
            self.ENVIRONMENT
            and self.PROJECT_ENV == "local"
            and self.ENVIRONMENT in {"local", "dev", "staging", "prod"}
        ):
            self.PROJECT_ENV = cast(
                Literal["local", "dev", "staging", "prod"],
                self.ENVIRONMENT,
            )

        # Compose DATABASE_URL from split env vars when DATABASE_URL isn't explicitly
        # provided.
        # (BaseSettings always applies defaults, so we must check the real env vars.)
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
            if os.getenv("DATABASE_URL_SYNC") is None:
                self.DATABASE_URL_SYNC = (
                    f"postgresql://{user}:{password}@{host}:{port}/{name}"
                )

        if self.REDIS_URL is None and self.REDIS_HOST and self.REDIS_PORT:
            self.REDIS_URL = f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}"

        # Support Terraform's STORAGE_BUCKET as alias.
        if self.GCS_BUCKET_NAME is None and self.STORAGE_BUCKET:
            self.GCS_BUCKET_NAME = self.STORAGE_BUCKET


@lru_cache
def get_settings() -> Settings:
    """Cached settings instance."""
    return Settings()


settings = get_settings()
