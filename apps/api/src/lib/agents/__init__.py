"""Content-type-aware summarization agents."""

from src.lib.agents.base import BaseSummaryAgent, BaseSummaryResult
from src.lib.agents.registry import get_agent, register

__all__ = ["BaseSummaryAgent", "BaseSummaryResult", "get_agent", "register"]
