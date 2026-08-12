"""Discussion-thread summarization agent."""

from src.lib.agents.base import BaseSummaryAgent, BaseSummaryResult
from src.lib.agents.registry import register
from src.lib.ai.prompts import _get_lang
from src.lib.content_classifier import ContentType


class DiscussionResult(BaseSummaryResult):
    """Discussion-specific fields stored in type_metadata."""

    central_question: str = ""
    insider_takeaways: list[str] = []  # noqa: RUF012
    disagreement_points: list[str] = []  # noqa: RUF012
    evidence_signals: list[str] = []  # noqa: RUF012


class DiscussionAgent(BaseSummaryAgent):
    content_type = ContentType.DISCUSSION

    def get_result_schema(self) -> type[BaseSummaryResult]:
        return DiscussionResult

    def build_system_prompt(self, lang: str) -> str:
        lc = _get_lang(lang)
        native = lc["native"]
        return (
            f"You are a discussion analyst that distills community threads into"
            f" structured notes in {native}.\n\n"
            "Principles:\n"
            "- Capture the central question or tension that drives the thread.\n"
            "- Surface insider or practitioner takeaways, not generic restatements.\n"
            "- Preserve real disagreement, trade-offs, and uncertainty.\n"
            "- Distinguish firsthand evidence from speculation or hearsay.\n"
            "- Explain the concrete stakes behind the discussion.\n"
            "- Return ONLY the JSON object requested"
            " (no preamble / commentary)."
        )

    def build_user_prompt(self, title: str, content: str, lang: str) -> str:
        lc = _get_lang(lang)
        native = lc["native"]
        return f"""Analyze this discussion thread and create a {native} markdown note.

Title: {title}

Content:
{content}

Markdown note format:
# {lc["summary_heading"]}
- 3-5 sentences capturing what the thread is really about

# Insider Takeaways
- Concrete lessons, heuristics, or lived experience shared by participants

# Main Disagreements
- Competing viewpoints, trade-offs, and why people disagree

# Evidence Signals
- Firsthand reports, examples, metrics, or linked evidence

# {lc["insight_heading"]}
- 2-5 practical actions or watchouts

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
{self._markdown_note_prompt_fragment(lang_name)}
- central_question: the core question or tension in {lang_name}
- insider_takeaways: list of practitioner or insider takeaways
- disagreement_points: list of the main disagreements or trade-offs
- evidence_signals: list of firsthand reports, examples, or evidence signals
"""


register(DiscussionAgent())
