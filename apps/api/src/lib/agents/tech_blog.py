"""Tech blog summarization agent."""

from src.lib.agents.base import BaseSummaryAgent, BaseSummaryResult
from src.lib.agents.registry import register
from src.lib.ai.prompts import _get_lang
from src.lib.content_classifier import ContentType


class TechBlogResult(BaseSummaryResult):
    """Tech blog specific fields stored in type_metadata."""

    tech_stack: list[str] = []  # noqa: RUF012
    difficulty_level: str = "intermediate"


class TechBlogAgent(BaseSummaryAgent):
    content_type = ContentType.TECH_BLOG

    def get_result_schema(self) -> type[BaseSummaryResult]:
        return TechBlogResult

    def build_system_prompt(self, lang: str) -> str:
        lc = _get_lang(lang)
        native = lc["native"]
        return (
            f"You are a senior tech writer that distills complex technical"
            f" articles into actionable developer notes in {native}.\n\n"
            "Principles:\n"
            "- Write based on facts only; if evidence is unclear,"
            ' note "No basis in source."\n'
            "- If the article contains code, include only the minimal code"
            " necessary to understand the key ideas.\n"
            "- Do NOT copy entire code blocks. Include only parts that reveal"
            " the core idea, keep them short.\n"
            "- Add a language identifier to code blocks"
            " (e.g. ```ts, ```python).\n"
            "- Identify the tech stack and difficulty level of the article.\n"
            "- Prefer actionable formats; avoid unnecessary verbosity.\n"
            "- Return ONLY the JSON object requested"
            " (no preamble / commentary)."
        )

    def build_user_prompt(self, title: str, content: str, lang: str) -> str:
        lc = _get_lang(lang)
        native = lc["native"]
        return f"""Analyze this tech blog article and create a {native} markdown note.

Title: {title}

Content:
{content}

Markdown note format:
# {lc["summary_heading"]}
- 3-5 key points

# {lc["detail_heading"]}
- Important concepts / definitions / decisions / trade-offs

# {lc["code_heading"]}
- If code exists, excerpt 1-3 blocks with one-line descriptions
- Omit this section if there is no code

# {lc["insight_heading"]}
- 2-5 actionable items (use checkboxes)

Code handling:
- Do NOT copy long code blocks verbatim
- Keep only key lines; use `...` for omissions
- Mask secrets (e.g. `sk-***`)
- The final output MUST be entirely in {lc["native"]}"""

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
- tech_stack: list of technologies/frameworks mentioned
- difficulty_level: one of "beginner", "intermediate", "advanced"
"""


register(TechBlogAgent())
