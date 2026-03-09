from collections.abc import AsyncGenerator

from sqlalchemy import MetaData
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from src.lib.config import settings

# Naming convention for constraints
convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""

    metadata = MetaData(naming_convention=convention)


# Async engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.PROJECT_ENV == "local",
    pool_pre_ping=True,
)

# Async session factory
async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for database session injection."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


def update_pool_metrics() -> None:
    """Update database connection pool Prometheus metrics."""
    from src.lib.metrics import (
        DB_POOL_CHECKED_IN,
        DB_POOL_CHECKED_OUT,
        DB_POOL_OVERFLOW,
        DB_POOL_SIZE,
    )

    pool = engine.pool
    DB_POOL_SIZE.set(pool.size())  # type: ignore[union-attr]
    DB_POOL_CHECKED_IN.set(pool.checkedin())  # type: ignore[union-attr]
    DB_POOL_CHECKED_OUT.set(pool.checkedout())  # type: ignore[union-attr]
    DB_POOL_OVERFLOW.set(pool.overflow())  # type: ignore[union-attr]
