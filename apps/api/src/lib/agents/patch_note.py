"""Patch note / changelog summarization agent."""

from src.lib.agents.base import BaseSummaryAgent, BaseSummaryResult
from src.lib.agents.registry import register
from src.lib.ai.prompts import _get_lang
from src.lib.content_classifier import ContentType


class PatchNoteResult(BaseSummaryResult):
    """Patch note specific fields stored in type_metadata."""

    version: str = ""
    breaking_changes: list[str] = []  # noqa: RUF012
    new_features: list[str] = []  # noqa: RUF012
    bug_fixes: list[str] = []  # noqa: RUF012
    improvements: list[str] = []  # noqa: RUF012
    tags: list[str] = []  # noqa: RUF012


class PatchNoteAgent(BaseSummaryAgent):
    content_type = ContentType.PATCH_NOTE

    def get_result_schema(self) -> type[BaseSummaryResult]:
        return PatchNoteResult

    def build_system_prompt(self, lang: str) -> str:
        lc = _get_lang(lang)
        native = lc["native"]
        return (
            f"You are a release note analyst that summarizes"
            f" software changelogs in {native}.\n\n"
            "Principles:\n"
            "- Categorize changes: new features, bug fixes,"
            " improvements, breaking changes.\n"
            "- Extract version numbers and release dates.\n"
            "- Highlight user-facing impact over internals.\n"
            "- Keep descriptions concise and actionable.\n"
            "- Return ONLY the JSON object requested"
            " (no preamble / commentary)."
        )

    def build_user_prompt(
        self, title: str, content: str, lang: str
    ) -> str:
        lc = _get_lang(lang)
        native = lc["native"]
        return f"""Analyze this release note and create a {native} markdown note.

Title: {title}

Content:
{content}

Markdown note format:
# {lc["summary_heading"]}
- Version and release overview in 2-3 sentences

# New Features
- List of new features with brief descriptions

# Bug Fixes
- List of bug fixes with brief descriptions

# Improvements
- List of improvements and optimizations

# Breaking Changes
- List of breaking changes (empty if none)

The final output MUST be entirely in {native}"""

    def build_json_prompt(self, lang: str) -> str:
        lang_name = _get_lang(lang)["name"]
        return f"""Return a JSON object with these fields:
- summary: 2-4 sentences in {lang_name}
- concepts: 3-7 short keywords
- root_concept: one representative concept from concepts
- key_points: 3-5 key changes (one sentence each)
- language: the article's language (ISO 639-1 code)
- reading_time_minutes: estimated reading time (~200 words/min)
{self._markdown_note_prompt_fragment(lang_name)}
- version: version number if mentioned (empty string if none)
- breaking_changes: list of breaking changes
- new_features: list of new features
- bug_fixes: list of bug fixes
- improvements: list of improvements
- tags: always include "patch-note" in this list
"""


register(PatchNoteAgent())
