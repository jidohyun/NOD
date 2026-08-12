import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class ExtractionFailureCreate(BaseModel):
    url: str = Field(..., max_length=2048)
    error_code: str = Field(..., max_length=50)
    error_message: str | None = Field(None, max_length=2000)
    page_title: str | None = Field(None, max_length=500)
    user_agent: str | None = Field(None, max_length=500)
    extension_version: str | None = Field(None, max_length=20)


class ExtractionFailureResponse(BaseModel):
    id: uuid.UUID
    url: str
    domain: str
    error_code: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ExtractionFailureStatsResponse(BaseModel):
    total_failures: int
    by_domain: list[dict[str, int | str]]
    by_error_code: list[dict[str, int | str]]
