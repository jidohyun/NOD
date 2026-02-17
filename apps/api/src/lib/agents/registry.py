"""Agent registry with auto-discovery."""

from src.lib.agents.base import BaseSummaryAgent
from src.lib.content_classifier import ContentType

_REGISTRY: dict[ContentType, BaseSummaryAgent] = {}


def register(agent: BaseSummaryAgent) -> BaseSummaryAgent:
    """Register an agent for a content type."""
    _REGISTRY[agent.content_type] = agent
    return agent


def get_agent(content_type: ContentType) -> BaseSummaryAgent:
    """Get the agent for a content type, falling back to general_news."""
    return _REGISTRY.get(content_type, _REGISTRY[ContentType.GENERAL_NEWS])


def _auto_register() -> None:
    """Import all agent modules to trigger registration."""
    from src.lib.agents import (  # noqa: F401
        academic_paper,
        general_news,
        github_repo,
        official_docs,
        tech_blog,
        video_podcast,
    )


_auto_register()
