from functools import lru_cache
from typing import Literal

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
    PROJECT_ENV: Literal["local", "staging", "prod"] = "local"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/app"
    DATABASE_URL_SYNC: str = "postgresql://postgres:postgres@localhost:5432/app"

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    # Auth (better-auth)
    BETTER_AUTH_URL: str = "http://localhost:3000"

    # JWT/JWE (stateless authentication)
    JWT_SECRET: str = "your-super-secret-jwt-key-change-in-production"  # noqa: S105
    JWE_SECRET_KEY: str = "your-super-secret-jwe-encryption-key-change-in-production"  # noqa: S105

    # Redis (optional)
    REDIS_URL: str | None = None

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
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"  # noqa: S105

    # Paddle Billing
    PADDLE_API_KEY: str | None = None
    PADDLE_WEBHOOK_SECRET: str | None = None
    PADDLE_CLIENT_TOKEN: str | None = None
    PADDLE_PRICE_ID_PRO: str | None = None
    PADDLE_ENVIRONMENT: Literal["sandbox", "production"] = "sandbox"


@lru_cache
def get_settings() -> Settings:
    """Cached settings instance."""
    return Settings()


settings = get_settings()
