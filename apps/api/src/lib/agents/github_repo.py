"""GitHub repository summarization agent."""

from src.lib.agents.base import BaseSummaryAgent, BaseSummaryResult
from src.lib.agents.registry import register
from src.lib.ai.prompts import _get_lang
from src.lib.content_classifier import ContentType


class GitHubRepoResult(BaseSummaryResult):
    """GitHub repo specific fields stored in type_metadata."""

    tech_stack: list[str] = []  # noqa: RUF012
    architecture_overview: str = ""
    getting_started: str = ""
    use_cases: list[str] = []  # noqa: RUF012


class GitHubRepoAgent(BaseSummaryAgent):
    content_type = ContentType.GITHUB_REPO

    def get_result_schema(self) -> type[BaseSummaryResult]:
        return GitHubRepoResult

    def build_system_prompt(self, lang: str) -> str:
        lc = _get_lang(lang)
        native = lc["native"]
        return (
            f"You are a senior developer that evaluates open-source projects"
            f" and creates actionable summaries in {native}.\n\n"
            "Principles:\n"
            "- Focus on what the project does and why it matters.\n"
            "- Identify the tech stack and architecture patterns.\n"
            "- Provide a clear getting-started guide.\n"
            "- Note practical use cases and when to use this project.\n"
            "- Be objective about strengths and limitations.\n"
            "- Return ONLY the JSON object requested"
            " (no preamble / commentary)."
        )

    def build_user_prompt(self, title: str, content: str, lang: str) -> str:
        lc = _get_lang(lang)
        native = lc["native"]
        return f"""Analyze this GitHub repository page and create \
a {native} markdown note.

Title: {title}

Content:
{content}

Markdown note format:
# Project Overview
- What it does and why it matters

# Tech Stack & Architecture
- Technologies used
- Architecture patterns and design decisions

# Getting Started
- Quick setup steps
- Key commands or configuration

# Use Cases
- When to use this project
- Ideal scenarios and alternatives

# {lc["insight_heading"]}
- 2-5 actionable items

The final output MUST be entirely in {native}"""

    def build_json_prompt(self, lang: str) -> str:
        lang_name = _get_lang(lang)["name"]
        return f"""Return a JSON object with these fields:
- summary: 2-4 sentences in {lang_name}
- concepts: 3-7 short keywords
- root_concept: one representative concept from concepts
- key_points: 3-5 key points (one sentence each)
- language: the article's language (ISO 639-1 code)
- reading_time_minutes: estimated reading time (~200 words/min)
- markdown_note: a {lang_name} markdown note following the template
- tech_stack: list of technologies/frameworks used
- architecture_overview: brief architecture description in {lang_name}
- getting_started: quick start guide in {lang_name}
- use_cases: list of practical use cases
"""


register(GitHubRepoAgent())
