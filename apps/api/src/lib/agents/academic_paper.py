"""Academic paper summarization agent."""

from src.lib.agents.base import BaseSummaryAgent, BaseSummaryResult
from src.lib.agents.registry import register
from src.lib.ai.prompts import _get_lang
from src.lib.content_classifier import ContentType


class AcademicPaperResult(BaseSummaryResult):
    """Academic paper specific fields stored in type_metadata."""

    abstract: str = ""
    methodology: str = ""
    findings: list[str] = []  # noqa: RUF012
    limitations: list[str] = []  # noqa: RUF012


class AcademicPaperAgent(BaseSummaryAgent):
    content_type = ContentType.ACADEMIC_PAPER

    def get_result_schema(self) -> type[BaseSummaryResult]:
        return AcademicPaperResult

    def build_system_prompt(self, lang: str) -> str:
        lc = _get_lang(lang)
        native = lc["native"]
        return (
            f"You are an academic research analyst that distills research"
            f" papers into structured summaries in {native}.\n\n"
            "Principles:\n"
            "- Extract the core research question, methodology, and"
            " findings.\n"
            "- Clearly separate facts from the authors' interpretations.\n"
            "- Note limitations acknowledged by the authors.\n"
            "- Identify the research contribution and its significance.\n"
            "- Use precise academic terminology where appropriate.\n"
            "- Return ONLY the JSON object requested"
            " (no preamble / commentary)."
        )

    def build_user_prompt(self, title: str, content: str, lang: str) -> str:
        lc = _get_lang(lang)
        native = lc["native"]
        return f"""Analyze this academic paper and create a {native} markdown note.

Title: {title}

Content:
{content}

Markdown note format:
# Abstract
- Core research question and thesis

# Methodology
- Research approach and methods used

# Key Findings
- 3-5 most important results/discoveries

# Limitations
- Acknowledged limitations and constraints
- Potential gaps in the research

# Research Implications
- What this means for the field
- Potential future research directions

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
- abstract: brief abstract of the paper in {lang_name}
- methodology: description of research methodology in {lang_name}
- findings: list of key findings
- limitations: list of limitations
"""


register(AcademicPaperAgent())
