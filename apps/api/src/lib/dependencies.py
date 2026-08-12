from typing import Annotated, Any

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.lib.ai.base import AIProvider
from src.lib.ai.factory import create_ai_provider
from src.lib.auth import (
    CurrentUser,
    CurrentUserInfo,
    OptionalUser,
    get_current_user,
    get_optional_user,
)
from src.lib.database import get_db

# Type alias for database session dependency
DBSession = Annotated[AsyncSession, Depends(get_db)]

# Type alias for AI provider dependency
AIService = Annotated[AIProvider[Any], Depends(create_ai_provider)]

# Re-export auth dependencies for convenience
__all__ = [
    "AIService",
    "CurrentUser",
    "CurrentUserInfo",
    "DBSession",
    "OptionalUser",
    "get_current_user",
    "get_optional_user",
]
