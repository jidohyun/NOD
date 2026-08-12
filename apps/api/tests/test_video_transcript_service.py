from __future__ import annotations

import pytest

from src.lib.video_transcript.errors import (
    TranscriptProviderError,
    TranscriptUnavailableError,
    UnsupportedVideoUrlError,
)
from src.lib.video_transcript.schemas import TranscriptSegment
from src.lib.video_transcript.service import TranscriptProvider, VideoTranscriptService


class _OkProvider(TranscriptProvider):
    async def fetch_transcript(
        self,
        *,
        video_id: str,
        languages: tuple[str, ...],
        timeout_seconds: float,
    ) -> list[TranscriptSegment]:
        assert video_id == "abc123"
        assert languages == ("ko", "en")
        assert timeout_seconds == 4.0
        return [
            TranscriptSegment(text="first sentence", start=0.0, duration=1.2),
            TranscriptSegment(text="second sentence", start=1.2, duration=1.4),
        ]


class _UnavailableProvider(TranscriptProvider):
    async def fetch_transcript(
        self,
        *,
        video_id: str,
        languages: tuple[str, ...],
        timeout_seconds: float,
    ) -> list[TranscriptSegment]:
        raise TranscriptUnavailableError("not available")


class _TransientFailureProvider(TranscriptProvider):
    async def fetch_transcript(
        self,
        *,
        video_id: str,
        languages: tuple[str, ...],
        timeout_seconds: float,
    ) -> list[TranscriptSegment]:
        raise RuntimeError("upstream temporary failure")


class _FlakyProvider(TranscriptProvider):
    def __init__(self) -> None:
        self.calls = 0

    async def fetch_transcript(
        self,
        *,
        video_id: str,
        languages: tuple[str, ...],
        timeout_seconds: float,
    ) -> list[TranscriptSegment]:
        self.calls += 1
        if self.calls == 1:
            raise TranscriptProviderError("temporary upstream issue", is_transient=True)

        assert video_id == "abc123"
        assert languages == ("ko", "en")
        assert timeout_seconds == 4.0
        return [
            TranscriptSegment(text="retry succeeded", start=0.0, duration=1.0),
        ]


class _AlwaysTransientProvider(TranscriptProvider):
    def __init__(self) -> None:
        self.calls = 0

    async def fetch_transcript(
        self,
        *,
        video_id: str,
        languages: tuple[str, ...],
        timeout_seconds: float,
    ) -> list[TranscriptSegment]:
        self.calls += 1
        raise TranscriptProviderError("still unavailable", is_transient=True)


@pytest.mark.asyncio
async def test_extract_transcript_from_youtube_url() -> None:
    service = VideoTranscriptService(
        provider=_OkProvider(),
        enabled=True,
        fallback_languages=("ko", "en"),
        timeout_seconds=4.0,
        max_chars=10_000,
    )

    result = await service.extract_transcript("https://www.youtube.com/watch?v=abc123")

    assert result.video_id == "abc123"
    assert result.segment_count == 2
    assert result.text == "first sentence second sentence"


@pytest.mark.asyncio
async def test_extract_transcript_rejects_unsupported_url() -> None:
    service = VideoTranscriptService(provider=_OkProvider(), enabled=True)

    with pytest.raises(UnsupportedVideoUrlError):
        await service.extract_transcript("https://example.com/article")


@pytest.mark.asyncio
async def test_extract_transcript_propagates_unavailable() -> None:
    service = VideoTranscriptService(provider=_UnavailableProvider(), enabled=True)

    with pytest.raises(TranscriptUnavailableError):
        await service.extract_transcript("https://youtu.be/abc123")


@pytest.mark.asyncio
async def test_extract_transcript_maps_transient_provider_error() -> None:
    service = VideoTranscriptService(provider=_TransientFailureProvider(), enabled=True)

    with pytest.raises(TranscriptProviderError) as exc_info:
        await service.extract_transcript("https://youtu.be/abc123")

    assert exc_info.value.is_transient is True


@pytest.mark.asyncio
async def test_extract_transcript_disabled_feature_raises_unavailable() -> None:
    service = VideoTranscriptService(provider=_OkProvider(), enabled=False)

    with pytest.raises(TranscriptUnavailableError):
        await service.extract_transcript("https://youtu.be/abc123")


@pytest.mark.asyncio
async def test_extract_transcript_retries_transient_provider_error() -> None:
    provider = _FlakyProvider()
    service = VideoTranscriptService(
        provider=provider,
        enabled=True,
        fallback_languages=("ko", "en"),
        timeout_seconds=4.0,
        transient_retries=2,
        retry_base_delay_seconds=0.0,
    )

    result = await service.extract_transcript("https://youtu.be/abc123")

    assert result.text == "retry succeeded"
    assert provider.calls == 2


@pytest.mark.asyncio
async def test_extract_transcript_raises_after_transient_retries_exhausted() -> None:
    provider = _AlwaysTransientProvider()
    service = VideoTranscriptService(
        provider=provider,
        enabled=True,
        transient_retries=2,
        retry_base_delay_seconds=0.0,
    )

    with pytest.raises(TranscriptProviderError) as exc_info:
        await service.extract_transcript("https://youtu.be/abc123")

    assert exc_info.value.is_transient is True
    assert provider.calls == 3
