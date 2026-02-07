from typing import Any

from src.lib.ai.base import AIProvider
from src.lib.config import settings


def create_ai_provider() -> AIProvider[Any]:
    match settings.AI_PROVIDER:
        case "openai":
            from src.lib.ai.openai_provider import OpenAIProvider
            return OpenAIProvider()
        case "gemini":
            from src.lib.ai.gemini_provider import GeminiProvider
            return GeminiProvider()
        case _:
            raise ValueError(f"Unknown AI provider: {settings.AI_PROVIDER}")
