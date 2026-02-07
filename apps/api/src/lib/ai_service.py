"""AI service for article summarization using Gemini or OpenAI."""

import structlog
from pydantic import BaseModel

from src.lib.config import settings

logger = structlog.get_logger(__name__)

SUMMARIZE_PROMPT = """Analyze the following article and provide a structured summary.

Title: {title}
Content:
{content}

Instructions:
- Write a concise summary (2-4 sentences) in the SAME language as the article.
- Extract 3-7 key concepts/tags as short keywords.
- Extract 3-5 key points (one sentence each).
- Detect the article's language (ISO 639-1 code, e.g. "en", "ko", "ja").
- Estimate reading time in minutes based on word count (~200 words/min).
"""


class ArticleSummaryResult(BaseModel):
    """Structured output from AI summarization."""

    summary: str
    concepts: list[str]
    key_points: list[str]
    language: str
    reading_time_minutes: int


async def summarize_article(title: str, content: str) -> ArticleSummaryResult:
    """Summarize an article using the configured AI provider."""
    prompt = SUMMARIZE_PROMPT.format(title=title, content=content[:15000])

    if settings.AI_PROVIDER == "gemini":
        return await _summarize_with_gemini(prompt)
    return await _summarize_with_openai(prompt)


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

    return ArticleSummaryResult.model_validate_json(response.text)


async def _summarize_with_openai(prompt: str) -> ArticleSummaryResult:
    """Summarize using OpenAI with structured output."""
    from openai import AsyncOpenAI

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    completion = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are an article analysis assistant."},
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

    return ArticleSummaryResult.model_validate_json(
        completion.choices[0].message.content
    )
