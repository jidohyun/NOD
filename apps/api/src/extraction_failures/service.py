import uuid
from typing import TypedDict
from urllib.parse import urlparse

import structlog
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.extraction_failures.model import ExtractionFailure
from src.extraction_failures.schemas import ExtractionFailureCreate

logger = structlog.get_logger(__name__)

StatsRow = dict[str, int | str]


class FailureStats(TypedDict):
    total_failures: int
    by_domain: list[StatsRow]
    by_error_code: list[StatsRow]


def extract_domain(url: str) -> str:
    try:
        parsed = urlparse(url)
        return parsed.netloc or "unknown"
    except Exception:
        return "unknown"


async def create_failure(
    db: AsyncSession,
    data: ExtractionFailureCreate,
    user_id: uuid.UUID | None = None,
) -> ExtractionFailure:
    domain = extract_domain(data.url)
    failure = ExtractionFailure(
        url=data.url,
        domain=domain,
        error_code=data.error_code,
        error_message=data.error_message,
        page_title=data.page_title,
        user_id=user_id,
        user_agent=data.user_agent,
        extension_version=data.extension_version,
    )
    db.add(failure)
    await db.flush()
    logger.info(
        "Extraction failure logged",
        failure_id=str(failure.id),
        domain=domain,
        error_code=data.error_code,
        url=data.url[:200],
    )
    return failure


async def get_failure_stats(
    db: AsyncSession,
    user_id: uuid.UUID | None = None,
    limit: int = 20,
) -> FailureStats:
    # By domain
    domain_query = (
        select(
            ExtractionFailure.domain,
            func.count().label("count"),
        )
        .group_by(ExtractionFailure.domain)
        .order_by(func.count().desc())
        .limit(limit)
    )
    if user_id:
        domain_query = domain_query.where(ExtractionFailure.user_id == user_id)

    domain_result = await db.execute(domain_query)
    by_domain: list[StatsRow] = [
        {"domain": row.domain, "count": int(row._mapping["count"])}
        for row in domain_result.all()
    ]

    # By error code
    error_query = (
        select(
            ExtractionFailure.error_code,
            func.count().label("count"),
        )
        .group_by(ExtractionFailure.error_code)
        .order_by(func.count().desc())
    )
    if user_id:
        error_query = error_query.where(ExtractionFailure.user_id == user_id)

    error_result = await db.execute(error_query)
    by_error_code: list[StatsRow] = [
        {"error_code": row.error_code, "count": int(row._mapping["count"])}
        for row in error_result.all()
    ]

    # Total
    total_query = select(func.count()).select_from(ExtractionFailure)
    if user_id:
        total_query = total_query.where(ExtractionFailure.user_id == user_id)
    total_result = await db.execute(total_query)
    total = total_result.scalar() or 0

    return {
        "total_failures": total,
        "by_domain": by_domain,
        "by_error_code": by_error_code,
    }
