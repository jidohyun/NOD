"""General news summarization agent."""

from src.lib.agents.base import BaseSummaryAgent, BaseSummaryResult
from src.lib.agents.registry import register
from src.lib.ai.prompts import _get_lang
from src.lib.content_classifier import ContentType


class GeneralNewsResult(BaseSummaryResult):
    """General news specific fields stored in type_metadata."""

    sentiment: str = "neutral"
    bias_indicators: list[str] = []  # noqa: RUF012
    fact_check_notes: list[str] = []  # noqa: RUF012


class GeneralNewsAgent(BaseSummaryAgent):
    content_type = ContentType.GENERAL_NEWS

    def get_result_schema(self) -> type[BaseSummaryResult]:
        return GeneralNewsResult

    def build_system_prompt(self, lang: str) -> str:
        lc = _get_lang(lang)
        native = lc["native"]
        return (
            f"You are a balanced news analyst that provides objective"
            f" article summaries in {native}.\n\n"
            "Principles:\n"
            "- Maintain objectivity and note potential biases.\n"
            "- Distinguish facts from opinions.\n"
            "- Include sentiment analysis (positive/neutral/negative).\n"
            "- Note any claims that may need fact-checking.\n"
            "- Write based on facts only; if evidence is unclear,"
            ' note "No basis in source."\n'
            "- Prefer actionable formats; avoid unnecessary verbosity.\n"
            "- Return ONLY the JSON object requested"
            " (no preamble / commentary)."
        )

    def build_user_prompt(self, title: str, content: str, lang: str) -> str:
        lc = _get_lang(lang)
        return f"""Analyze this article and create a {lc["native"]} markdown note.

Title: {title}

Content:
{content}

Markdown note format:
# {lc["summary_heading"]}
- 3-5 key facts

# {lc["detail_heading"]}
- Important facts / claims / data points
- Note the source or basis for each claim

# Perspective Analysis
- Identify viewpoints and potential biases
- Note what perspectives may be missing

# Fact Check Notes
- Claims that could be verified
- Any contradictions or unsupported statements

The final output MUST be entirely in {lc["native"]}"""

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
- sentiment: one of "positive", "neutral", "negative"
- bias_indicators: list of potential bias indicators found
- fact_check_notes: list of claims that need verification
"""


register(GeneralNewsAgent())
