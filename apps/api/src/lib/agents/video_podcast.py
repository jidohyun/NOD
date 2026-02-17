"""Video/podcast summarization agent."""

from src.lib.agents.base import BaseSummaryAgent, BaseSummaryResult
from src.lib.agents.registry import register
from src.lib.ai.prompts import _get_lang
from src.lib.content_classifier import ContentType


class VideoPodcastResult(BaseSummaryResult):
    """Video/podcast specific fields stored in type_metadata."""

    timestamps: list[str] = []  # noqa: RUF012
    speakers: list[str] = []  # noqa: RUF012
    transcript_highlights: list[str] = []  # noqa: RUF012


class VideoPodcastAgent(BaseSummaryAgent):
    content_type = ContentType.VIDEO_PODCAST

    def get_result_schema(self) -> type[BaseSummaryResult]:
        return VideoPodcastResult

    def build_system_prompt(self, lang: str) -> str:
        lc = _get_lang(lang)
        native = lc["native"]
        return (
            f"You are a media analyst that creates structured notes from"
            f" video and podcast content in {native}.\n\n"
            "Principles:\n"
            "- Create a clear timeline of topics discussed.\n"
            "- Identify speakers and their key contributions.\n"
            "- Extract the most quotable and insightful moments.\n"
            "- Note timestamps when available.\n"
            "- Focus on actionable takeaways over transcription.\n"
            "- Return ONLY the JSON object requested"
            " (no preamble / commentary)."
        )

    def build_user_prompt(self, title: str, content: str, lang: str) -> str:
        lc = _get_lang(lang)
        native = lc["native"]
        return f"""Analyze this video/podcast content and create \
a {native} markdown note.

Title: {title}

Content:
{content}

Markdown note format:
# {lc["summary_heading"]}
- 3-5 key takeaways

# Timeline / Table of Contents
- Topic progression with timestamps (if available)

# Speaker Highlights
- Key points by each speaker (if identifiable)

# Notable Quotes
- Most insightful or quotable moments

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
- reading_time_minutes: estimated reading/listening time (~200 words/min)
- markdown_note: a {lang_name} markdown note following the template
- timestamps: list of topic timestamps (e.g. "00:05:30 - Topic name")
- speakers: list of speaker names if identifiable
- transcript_highlights: list of notable quotes or key moments
"""


register(VideoPodcastAgent())
