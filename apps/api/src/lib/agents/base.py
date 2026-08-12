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

    def _markdown_note_prompt_fragment(self, lang_name: str) -> str:
        """Return a standardized markdown_note field instruction for JSON prompts."""
        return (
            f"- markdown_note: a COMPLETE {lang_name} markdown note"
            " following the template above."
            " CRITICAL: Use ACTUAL newline characters in JSON string encoding."
            " The note MUST be complete and not truncated mid-sentence or mid-section."
            " Do NOT use literal backslash-n sequences."
        )
