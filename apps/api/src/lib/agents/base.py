"""Base class for content-type-aware summarization agents."""

from abc import ABC, abstractmethod

from pydantic import BaseModel

from src.lib.content_classifier import ContentType


class BaseSummaryResult(BaseModel):
    """Fields shared by all agent results."""

    summary: str
    concepts: list[str]
    root_concept: str | None = None
    key_points: list[str]
    language: str
    reading_time_minutes: int
    markdown_note: str


class BaseSummaryAgent(ABC):
    """Strategy interface for content-type-specific summarization."""

    content_type: ContentType

    @abstractmethod
    def get_result_schema(self) -> type[BaseSummaryResult]:
        """Return the Pydantic model for structured AI output."""
        ...

    @abstractmethod
    def build_system_prompt(self, lang: str) -> str:
        """Return the system prompt for this content type."""
        ...

    @abstractmethod
    def build_user_prompt(self, title: str, content: str, lang: str) -> str:
        """Return the user prompt with article content."""
        ...

    @abstractmethod
    def build_json_prompt(self, lang: str) -> str:
        """Return the JSON schema instruction prompt."""
        ...
