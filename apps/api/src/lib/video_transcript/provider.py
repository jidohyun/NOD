from __future__ import annotations

import asyncio
from urllib.parse import parse_qs, urlparse

from src.lib.video_transcript.errors import (
    TranscriptProviderError,
    TranscriptUnavailableError,
)
from src.lib.video_transcript.schemas import TranscriptSegment

_UNAVAILABLE_ERROR_NAMES = {
    "NoTranscriptFound",
    "TranscriptsDisabled",
    "VideoUnavailable",
    "InvalidVideoId",
    "CouldNotRetrieveTranscript",
}

_TRANSIENT_ERROR_NAMES = {
    "RequestBlocked",
    "IpBlocked",
    "TooManyRequests",
    "YouTubeRequestFailed",
    "TimeoutError",
}


def _to_float(value: object) -> float | None:
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        try:
            return float(value)
        except ValueError:
            return None
    return None


def extract_youtube_video_id(url: str) -> str | None:
    parsed = urlparse(url)
    host = (parsed.hostname or "").removeprefix("www.")

    if host in {"youtu.be"}:
        video_id = parsed.path.strip("/")
        return video_id or None

    if host in {"youtube.com", "m.youtube.com", "music.youtube.com"}:
        query = parse_qs(parsed.query)
        video_values = query.get("v")
        if video_values and video_values[0]:
            return video_values[0]
        if parsed.path.startswith("/shorts/"):
            short_id = parsed.path.removeprefix("/shorts/").split("/")[0]
            return short_id or None

    return None


class YouTubeTranscriptProvider:
    async def fetch_transcript(
        self,
        *,
        video_id: str,
        languages: tuple[str, ...],
        timeout_seconds: float,
    ) -> list[TranscriptSegment]:
        try:
            rows = await asyncio.wait_for(
                asyncio.to_thread(
                    self._fetch_transcript_sync,
                    video_id,
                    languages,
                ),
                timeout=timeout_seconds,
            )
        except Exception as exc:
            error_name = type(exc).__name__
            if error_name in _UNAVAILABLE_ERROR_NAMES:
                raise TranscriptUnavailableError(
                    f"Transcript unavailable for video '{video_id}'"
                ) from exc
            if error_name in _TRANSIENT_ERROR_NAMES:
                raise TranscriptProviderError(
                    f"Transcript provider temporary failure for video '{video_id}'",
                    is_transient=True,
                ) from exc
            raise TranscriptProviderError(
                f"Transcript provider failure for video '{video_id}'",
                is_transient=False,
            ) from exc

        segments = [
            TranscriptSegment(
                text=str(item.get("text", "")).strip(),
                start=_to_float(item.get("start")),
                duration=_to_float(item.get("duration")),
            )
            for item in rows
            if str(item.get("text", "")).strip()
        ]

        if not segments:
            raise TranscriptUnavailableError(
                f"Transcript unavailable for video '{video_id}'"
            )

        return segments

    def _fetch_transcript_sync(
        self,
        video_id: str,
        languages: tuple[str, ...],
    ) -> list[dict[str, object]]:
        from youtube_transcript_api import YouTubeTranscriptApi

        api = YouTubeTranscriptApi()
        transcript = api.fetch(video_id, languages=list(languages))
        return [
            {
                "text": snippet.text,
                "start": snippet.start,
                "duration": snippet.duration,
            }
            for snippet in transcript
        ]
