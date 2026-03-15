import uuid

import structlog
from fastapi import APIRouter, status

from src.extraction_failures import service
from src.extraction_failures.schemas import (
    ExtractionFailureCreate,
    ExtractionFailureResponse,
    ExtractionFailureStatsResponse,
)
from src.lib.dependencies import CurrentUser, DBSession, OptionalUser

logger = structlog.get_logger(__name__)

router = APIRouter()


@router.post(
    "",
    response_model=ExtractionFailureResponse,
    status_code=status.HTTP_201_CREATED,
)
async def report_extraction_failure(
    data: ExtractionFailureCreate,
    db: DBSession,
    user: OptionalUser,
) -> ExtractionFailureResponse:
    user_id = uuid.UUID(user.id) if user else None
    failure = await service.create_failure(db, data, user_id=user_id)
    await db.commit()
    return ExtractionFailureResponse.model_validate(failure)


@router.get("/stats", response_model=ExtractionFailureStatsResponse)
async def get_extraction_failure_stats(
    db: DBSession,
    user: CurrentUser,
) -> ExtractionFailureStatsResponse:
    stats = await service.get_failure_stats(db, user_id=uuid.UUID(user.id))
    return ExtractionFailureStatsResponse(**stats)
