"""AI service for article summarization using content-type-aware agents."""

from typing import Literal

import structlog

from src.lib.agents.base import BaseSummaryResult
from src.lib.agents.registry import get_agent
from src.lib.config import settings
from src.lib.content_classifier import ContentType, classify_url

logger = structlog.get_logger(__name__)


async def summarize_article(
    title: str,
    content: str,
    url: str | None = None,
    provider: Literal["gemini", "openai"] | None = None,
    summary_language: str = "ko",
) -> tuple[BaseSummaryResult, ContentType]:
    """Summarize an article using content-type-aware agents."""
    content_type = classify_url(url) if url else ContentType.GENERAL_NEWS
    agent = get_agent(content_type)

    logger.info(
        "Starting article summarization",
        title_length=len(title),
        content_length=len(content),
        content_type=str(content_type),
        requested_provider=provider,
        summary_language=summary_language,
    )

    result_schema = agent.get_result_schema()
    system_prompt = agent.build_system_prompt(summary_language)
    user_prompt = agent.build_user_prompt(title, content[:15000], summary_language)
    json_prompt = agent.build_json_prompt(summary_language)

    prompt = f"{json_prompt}\n\n{user_prompt}"

    resolved_provider = provider or settings.AI_PROVIDER
    logger.info("Resolved AI provider", provider=resolved_provider)

    if resolved_provider == "openai" and not settings.OPENAI_API_KEY:
        logger.warning("OpenAI key not set, falling back to Gemini")
        resolved_provider = "gemini"

    if resolved_provider == "gemini" and not settings.GEMINI_API_KEY:
        logger.warning("Gemini key not set, falling back to OpenAI")
        resolved_provider = "openai"

    if resolved_provider == "gemini":
        logger.info("Using Gemini for summarization")
        gemini_prompt = f"{system_prompt}\n\n{prompt}"
        result = await _summarize_with_gemini(gemini_prompt, result_schema)
    else:
        logger.info("Using OpenAI for summarization")
        result = await _summarize_with_openai(prompt, system_prompt, result_schema)

    return result, content_type


async def _summarize_with_gemini(
    prompt: str,
    result_schema: type[BaseSummaryResult],
) -> BaseSummaryResult:
    """Summarize using Google Gemini with structured output."""
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=settings.GEMINI_API_KEY)

    response = await client.aio.models.generate_content(
        model=settings.GEMINI_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=result_schema,
        ),
    )

    if not response.text:
        raise ValueError("Gemini returned empty response")
    return result_schema.model_validate_json(response.text)


async def _summarize_with_openai(
    prompt: str,
    system_prompt: str,
    result_schema: type[BaseSummaryResult],
) -> BaseSummaryResult:
    """Summarize using OpenAI with structured output."""
    from openai import AsyncOpenAI

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    completion = await client.beta.chat.completions.parse(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt},
        ],
        response_format=result_schema,
    )

    parsed = completion.choices[0].message.parsed
    if parsed is None:
        raise ValueError("OpenAI returned unparseable structured response")
    return parsed
