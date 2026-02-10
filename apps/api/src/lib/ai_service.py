"""AI service for article summarization using Gemini or OpenAI."""

from typing import Literal

import structlog
from pydantic import BaseModel

from src.lib.ai.prompts import build_system_prompt, build_user_prompt
from src.lib.config import settings

logger = structlog.get_logger(__name__)

LANG_NAMES: dict[str, str] = {
    "ko": "Korean",
    "en": "English",
    "ja": "Japanese",
    "zh": "Chinese",
    "es": "Spanish",
    "fr": "French",
    "de": "German",
}


def _build_summarize_prompt(lang: str = "ko") -> str:
    lang_name = LANG_NAMES.get(lang, lang)
    return f"""Return a JSON object with the following fields:
- summary: 2-4 sentences in {lang_name}
- concepts: 3-7 short keywords
- key_points: 3-5 key points (one sentence each)
- language: the article's language (ISO 639-1 code)
- reading_time_minutes: estimated reading time in minutes
  (~200 words/min)
- markdown_note: a {lang_name} markdown note following the
  exact template provided
"""


class ArticleSummaryResult(BaseModel):
    """Structured output from AI summarization."""

    summary: str
    concepts: list[str]
    key_points: list[str]
    language: str
    reading_time_minutes: int
    markdown_note: str


async def summarize_article(
    title: str,
    content: str,
    provider: Literal["gemini", "openai"] | None = None,
    summary_language: str = "ko",
) -> ArticleSummaryResult:
    """Summarize an article using the configured AI provider."""
    json_prompt = _build_summarize_prompt(summary_language)
    user_prompt = build_user_prompt(
        title=title,
        content=content[:15000],
        lang=summary_language,
    )
    system_prompt = build_system_prompt(summary_language)

    prompt = f"{json_prompt}\n\n{user_prompt}"

    resolved_provider = provider or settings.AI_PROVIDER

    if resolved_provider == "openai" and not settings.OPENAI_API_KEY:
        logger.warning("OpenAI key not set, falling back to Gemini")
        resolved_provider = "gemini"

    if resolved_provider == "gemini" and not settings.GEMINI_API_KEY:
        logger.warning("Gemini key not set, falling back to OpenAI")
        resolved_provider = "openai"

    if resolved_provider == "gemini":
        gemini_prompt = f"{system_prompt}\n\n{prompt}"
        return await _summarize_with_gemini(gemini_prompt)
    return await _summarize_with_openai(prompt, system_prompt)


async def _summarize_with_gemini(prompt: str) -> ArticleSummaryResult:
    """Summarize using Google Gemini with structured output."""
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=settings.GEMINI_API_KEY)

    response = await client.aio.models.generate_content(
        model="gemini-2.0-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=ArticleSummaryResult,
        ),
    )

    if not response.text:
        raise ValueError("Gemini returned empty response")
    return ArticleSummaryResult.model_validate_json(response.text)


async def _summarize_with_openai(
    prompt: str,
    system_prompt: str,
) -> ArticleSummaryResult:
    """Summarize using OpenAI with structured output."""
    from openai import AsyncOpenAI

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    completion = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt},
        ],
        response_format={
            "type": "json_schema",
            "json_schema": {
                "name": "article_summary",
                "schema": ArticleSummaryResult.model_json_schema(),
                "strict": True,
            },
        },
    )

    content = completion.choices[0].message.content
    if not content:
        raise ValueError("OpenAI returned empty response")
    return ArticleSummaryResult.model_validate_json(content)
