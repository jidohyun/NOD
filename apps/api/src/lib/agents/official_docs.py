"""Official documentation summarization agent."""

from src.lib.agents.base import BaseSummaryAgent, BaseSummaryResult
from src.lib.agents.registry import register
from src.lib.ai.prompts import _get_lang
from src.lib.content_classifier import ContentType


class OfficialDocsResult(BaseSummaryResult):
    """Official docs specific fields stored in type_metadata."""

    api_highlights: list[str] = []  # noqa: RUF012
    version_info: str = ""
    prerequisites: list[str] = []  # noqa: RUF012
    related_topics: list[str] = []  # noqa: RUF012


class OfficialDocsAgent(BaseSummaryAgent):
    content_type = ContentType.OFFICIAL_DOCS

    def get_result_schema(self) -> type[BaseSummaryResult]:
        return OfficialDocsResult

    def build_system_prompt(self, lang: str) -> str:
        lc = _get_lang(lang)
        native = lc["native"]
        return (
            f"You are a technical documentation specialist that creates"
            f" concise reference notes in {native}.\n\n"
            "Principles:\n"
            "- Extract the most important API details and usage patterns.\n"
            "- Note version-specific information when present.\n"
            "- Identify prerequisites and dependencies.\n"
            "- Link to related topics for further reading.\n"
            "- Focus on practical usage over theory.\n"
            "- Return ONLY the JSON object requested"
            " (no preamble / commentary)."
        )

    def build_user_prompt(self, title: str, content: str, lang: str) -> str:
        lc = _get_lang(lang)
        native = lc["native"]
        return f"""Analyze this documentation page and create a {native} markdown note.

Title: {title}

Content:
{content}

Markdown note format:
# {lc["summary_heading"]}
- 3-5 key points about what this documentation covers

# API Highlights
- Key APIs, methods, or functions documented
- Usage patterns and examples

# Prerequisites
- Required knowledge, dependencies, or setup

# {lc["code_heading"]}
- Key code examples (abbreviated)
- Omit if no code present

# Related Topics
- Related documentation pages or concepts

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
- api_highlights: list of key APIs or methods documented
- version_info: version information if mentioned (empty string if none)
- prerequisites: list of prerequisites
- related_topics: list of related documentation topics
"""


register(OfficialDocsAgent())
