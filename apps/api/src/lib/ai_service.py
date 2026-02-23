"""AI service for article summarization using content-type-aware agents."""

from __future__ import annotations

import time
from typing import TYPE_CHECKING, Literal

import structlog

from src.lib.agents.base import BaseSummaryResult
from src.lib.agents.registry import get_agent
from src.lib.config import settings
from src.lib.content_classifier import ContentType, classify_url
from src.lib.langfuse_client import get_langfuse

if TYPE_CHECKING:
    from langfuse import Langfuse

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

    if not settings.GEMINI_API_KEY and not settings.OPENAI_API_KEY:
        raise ValueError(
            "No AI API key configured. Set GEMINI_API_KEY or OPENAI_API_KEY."
        )

    if resolved_provider == "openai" and not settings.OPENAI_API_KEY:
        logger.warning("OpenAI key not set, falling back to Gemini")
        resolved_provider = "gemini"

    if resolved_provider == "gemini" and not settings.GEMINI_API_KEY:
        logger.warning("Gemini key not set, falling back to OpenAI")
        resolved_provider = "openai"

    # --- Langfuse tracing ---
    langfuse = get_langfuse()
    span = None
    if langfuse:
        span = langfuse.start_span(
            name="article-summarization",
            metadata={
                "content_type": str(content_type),
                "provider": resolved_provider,
                "summary_language": summary_language,
                "article_url": url or "",
            },
            input={
                "title": title,
                "content_length": len(content),
            },
        )

    try:
        if resolved_provider == "gemini":
            logger.info("Using Gemini for summarization")
            gemini_prompt = f"{system_prompt}\n\n{prompt}"
            result = await _summarize_with_gemini(
                gemini_prompt, result_schema, langfuse=langfuse, parent_span=span
            )
        else:
            logger.info("Using OpenAI for summarization")
            result = await _summarize_with_openai(
                prompt, system_prompt, result_schema,
                langfuse=langfuse, parent_span=span,
            )

        # Normalize markdown_note: AI sometimes returns literal \n instead of
        # actual newlines inside JSON string values.
        if result.markdown_note:
            result.markdown_note = result.markdown_note.replace("\\n", "\n")

        if span:
            span.update(
                output={
                    "summary_length": len(result.summary) if result.summary else 0,
                    "key_points_count": (
                        len(result.key_points) if result.key_points else 0
                    ),
                    "concepts_count": (
                        len(result.concepts) if result.concepts else 0
                    ),
                    "has_markdown_note": result.markdown_note is not None,
                },
            )
            span.end()

    except Exception as exc:
        if span:
            span.update(
                level="ERROR",
                status_message=str(exc),
                output={"error": str(exc)},
            )
            span.end()
        raise
    finally:
        if langfuse:
            langfuse.flush()

    return result, content_type


async def _summarize_with_gemini(
    prompt: str,
    result_schema: type[BaseSummaryResult],
    *,
    langfuse: Langfuse | None = None,
    parent_span: object | None = None,
) -> BaseSummaryResult:
    """Summarize using Google Gemini with structured output."""
    from google import genai
    from google.genai import types

    generation = None
    if langfuse and parent_span:
        generation = parent_span.start_generation(  # type: ignore[union-attr]
            name="gemini-generation",
            model=settings.GEMINI_MODEL,
            input=prompt[:2000],
        )

    start = time.monotonic()
    client = genai.Client(api_key=settings.GEMINI_API_KEY)

    response = await client.aio.models.generate_content(
        model=settings.GEMINI_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=result_schema,
        ),
    )
    latency_ms = (time.monotonic() - start) * 1000

    if not response.text:
        if generation:
            generation.update(
                level="ERROR",
                status_message="Gemini returned empty response",
            )
            generation.end()
        raise ValueError("Gemini returned empty response")

    result = result_schema.model_validate_json(response.text)

    if generation:
        usage_meta = getattr(response, "usage_metadata", None)
        usage = (
            {
                "input": getattr(usage_meta, "prompt_token_count", 0),
                "output": getattr(usage_meta, "candidates_token_count", 0),
                "total": getattr(usage_meta, "total_token_count", 0),
            }
            if usage_meta
            else None
        )
        generation.update(
            output=response.text[:2000],
            usage_details=usage,
            metadata={"latency_ms": round(latency_ms, 1)},
        )
        generation.end()

    return result


async def _summarize_with_openai(
    prompt: str,
    system_prompt: str,
    result_schema: type[BaseSummaryResult],
    *,
    langfuse: Langfuse | None = None,
    parent_span: object | None = None,
) -> BaseSummaryResult:
    """Summarize using OpenAI with structured output."""
    from openai import AsyncOpenAI

    generation = None
    if langfuse and parent_span:
        generation = parent_span.start_generation(  # type: ignore[union-attr]
            name="openai-generation",
            model="gpt-4o-mini",
            input=[
                {"role": "system", "content": system_prompt[:1000]},
                {"role": "user", "content": prompt[:1000]},
            ],
        )

    start = time.monotonic()
    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    completion = await client.beta.chat.completions.parse(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt},
        ],
        response_format=result_schema,
    )
    latency_ms = (time.monotonic() - start) * 1000

    parsed = completion.choices[0].message.parsed
    if parsed is None:
        if generation:
            generation.update(
                level="ERROR",
                status_message="OpenAI returned unparseable structured response",
            )
            generation.end()
        raise ValueError("OpenAI returned unparseable structured response")

    if generation:
        usage = completion.usage
        generation.update(
            output=str(parsed.model_dump_json())[:2000],
            usage_details=(
                {
                    "input": usage.prompt_tokens,
                    "output": usage.completion_tokens,
                    "total": usage.total_tokens,
                }
                if usage
                else None
            ),
            metadata={"latency_ms": round(latency_ms, 1)},
        )
        generation.end()

    return parsed
