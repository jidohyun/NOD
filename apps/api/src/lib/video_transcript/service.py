from __future__ import annotations

from typing import Protocol

import structlog

from src.lib.config import settings
from src.lib.video_transcript.errors import (
    TranscriptProviderError,
    TranscriptUnavailableError,
    UnsupportedVideoUrlError,
)
from src.lib.video_transcript.provider import (
    YouTubeTranscriptProvider,
    extract_youtube_video_id,
)
from src.lib.video_transcript.schemas import TranscriptSegment, VideoTranscript

logger = structlog.get_logger(__name__)


class TranscriptProvider(Protocol):
    async def fetch_transcript(
        self,
        *,
        video_id: str,
        languages: tuple[str, ...],
        timeout_seconds: float,
    ) -> list[TranscriptSegment]: ...


class VideoTranscriptService:
    def __init__(
        self,
        *,
        provider: TranscriptProvider,
        enabled: bool,
        fallback_languages: tuple[str, ...] = ("ko", "en"),
        timeout_seconds: float = 12.0,
        max_chars: int = 20_000,
    ) -> None:
        self._provider = provider
        self._enabled = enabled
        self._fallback_languages = fallback_languages
        self._timeout_seconds = timeout_seconds
        self._max_chars = max_chars

    async def extract_transcript(self, url: str) -> VideoTranscript:
        if not self._enabled:
            raise TranscriptUnavailableError("Video transcript extraction is disabled")

        video_id = extract_youtube_video_id(url)
        if not video_id:
            raise UnsupportedVideoUrlError(f"Unsupported video URL: {url}")

        logger.info(
            "Starting transcript extraction",
            url=url,
            video_id=video_id,
            timeout_seconds=self._timeout_seconds,
            languages=list(self._fallback_languages),
        )

        try:
            segments = await self._provider.fetch_transcript(
                video_id=video_id,
                languages=self._fallback_languages,
                timeout_seconds=self._timeout_seconds,
            )
        except (TranscriptUnavailableError, TranscriptProviderError):
            raise
        except Exception as exc:
            raise TranscriptProviderError(
                f"Unexpected transcript provider failure for '{video_id}'",
                is_transient=True,
            ) from exc

        text = " ".join(
            segment.text.strip() for segment in segments if segment.text.strip()
        )
        text = text[: self._max_chars].strip()
        if not text:
            raise TranscriptUnavailableError(
                f"Transcript unavailable for video '{video_id}'"
            )

        logger.info(
            "Transcript extraction succeeded",
            url=url,
            video_id=video_id,
            segment_count=len(segments),
            text_length=len(text),
        )

        return VideoTranscript(
            video_id=video_id,
            language=None,
            text=text,
            segment_count=len(segments),
        )


_service_instance: VideoTranscriptService | None = None


def _parse_languages(raw_languages: str) -> tuple[str, ...]:
    parsed = tuple(
        language.strip() for language in raw_languages.split(",") if language
    )
    return parsed or ("ko", "en")


def get_video_transcript_service() -> VideoTranscriptService:
    global _service_instance
    if _service_instance is None:
        enabled = bool(getattr(settings, "VIDEO_TRANSCRIPT_ENABLED", True))
        languages = _parse_languages(
            str(getattr(settings, "VIDEO_TRANSCRIPT_LANGUAGES", "ko,en"))
        )
        timeout_seconds = float(
            getattr(settings, "VIDEO_TRANSCRIPT_TIMEOUT_SECONDS", 12.0)
        )
        max_chars = int(getattr(settings, "VIDEO_TRANSCRIPT_MAX_CHARS", 20_000))
        _service_instance = VideoTranscriptService(
            provider=YouTubeTranscriptProvider(),
            enabled=enabled,
            fallback_languages=languages,
            timeout_seconds=timeout_seconds,
            max_chars=max_chars,
        )
    return _service_instance
