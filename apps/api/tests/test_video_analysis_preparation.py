from __future__ import annotations

import asyncio
import uuid
from datetime import UTC, datetime
from types import SimpleNamespace
from typing import cast

import pytest
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.articles import router
from src.articles.schemas import ArticleAnalyzeURL
from src.lib.auth import CurrentUserInfo
from src.lib.pdf_extractor import PDFExtractResult
from src.lib.video_transcript.errors import (
    TranscriptProviderError,
    TranscriptUnavailableError,
)
from src.lib.video_transcript.schemas import VideoTranscript


class _FakeScalarResult:
    def scalar_one_or_none(self) -> None:
        return None


class _FakeDB:
    async def commit(self) -> None:
        return None

    async def execute(self, _stmt: object) -> _FakeScalarResult:
        return _FakeScalarResult()


def _fake_db_session() -> AsyncSession:
    return cast(AsyncSession, cast(object, _FakeDB()))


def _build_existing_article(user_id: str) -> SimpleNamespace:
    return SimpleNamespace(
        id=uuid.uuid4(),
        user_id=uuid.UUID(user_id),
        url="https://youtube.com/watch?v=abc123",
        title="Existing",
        original_title="Existing",
        source="extension",
        status="pending",
        created_at=datetime.now(UTC),
        updated_at=None,
        summary=None,
    )


@pytest.mark.asyncio
async def test_prepare_analyze_url_content_uses_video_transcript(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def _fake_pdf(_url: str) -> PDFExtractResult | None:
        return None

    class _Svc:
        async def extract_transcript(self, _url: str) -> VideoTranscript:
            return VideoTranscript(
                video_id="abc123",
                language="en",
                text="hello from transcript",
                segment_count=1,
            )

    monkeypatch.setattr(router, "extract_text_from_pdf_url", _fake_pdf)
    monkeypatch.setattr(router, "get_video_transcript_service", lambda: _Svc())

    title, content = await router.prepare_analyze_url_content(
        url="https://www.youtube.com/watch?v=abc123",
        title="Video title",
        content=" ",
    )

    assert title == "Video title"
    assert content == "hello from transcript"


@pytest.mark.asyncio
async def test_prepare_analyze_url_content_raises_422_for_unavailable_transcript(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def _fake_pdf(_url: str) -> PDFExtractResult | None:
        return None

    class _Svc:
        async def extract_transcript(self, _url: str) -> VideoTranscript:
            raise TranscriptUnavailableError("no transcript")

    monkeypatch.setattr(router, "extract_text_from_pdf_url", _fake_pdf)
    monkeypatch.setattr(router, "get_video_transcript_service", lambda: _Svc())

    with pytest.raises(HTTPException) as exc_info:
        await router.prepare_analyze_url_content(
            url="https://youtu.be/abc123",
            title="Video title",
            content=None,
        )

    assert exc_info.value.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT


@pytest.mark.asyncio
async def test_prepare_analyze_url_content_raises_503_for_transient_provider_failure(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def _fake_pdf(_url: str) -> PDFExtractResult | None:
        return None

    class _Svc:
        async def extract_transcript(self, _url: str) -> VideoTranscript:
            raise TranscriptProviderError("provider timeout", is_transient=True)

    monkeypatch.setattr(router, "extract_text_from_pdf_url", _fake_pdf)
    monkeypatch.setattr(router, "get_video_transcript_service", lambda: _Svc())

    with pytest.raises(HTTPException) as exc_info:
        await router.prepare_analyze_url_content(
            url="https://youtu.be/abc123",
            title="Video title",
            content="",
        )

    assert exc_info.value.status_code == status.HTTP_503_SERVICE_UNAVAILABLE


@pytest.mark.asyncio
async def test_prepare_analyze_url_content_preserves_pdf_fallback(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def _fake_pdf(_url: str) -> PDFExtractResult | None:
        return PDFExtractResult(text="pdf body", title="PDF title")

    class _Svc:
        async def extract_transcript(self, _url: str) -> VideoTranscript:
            raise AssertionError(
                "video transcript should not be used for non-video URL"
            )

    monkeypatch.setattr(router, "extract_text_from_pdf_url", _fake_pdf)
    monkeypatch.setattr(router, "get_video_transcript_service", lambda: _Svc())

    title, content = await router.prepare_analyze_url_content(
        url="https://arxiv.org/pdf/1234.56789.pdf",
        title="Original",
        content="",
    )

    assert title == "PDF title"
    assert content == "pdf body"


@pytest.mark.asyncio
async def test_analyze_url_checks_duplicate_before_content_preparation(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    user_id = str(uuid.uuid4())
    existing = _build_existing_article(user_id)

    async def _fake_get_article_by_url(
        db: object,
        user_id_arg: str,
        url: str,
    ) -> SimpleNamespace | None:
        assert db is not None
        assert user_id_arg == user_id
        assert url == "https://youtube.com/watch?v=abc123"
        return existing

    async def _should_not_prepare(**_kwargs: object) -> tuple[str, str]:
        raise AssertionError("content preparation should not run for duplicate")

    monkeypatch.setattr(router.service, "get_article_by_url", _fake_get_article_by_url)
    monkeypatch.setattr(router, "prepare_analyze_url_content", _should_not_prepare)

    response = await router.analyze_url(
        ArticleAnalyzeURL(
            url="https://youtube.com/watch?v=abc123",
            title="Video title",
            content=None,
            source="extension",
        ),
        db=_fake_db_session(),
        user=CurrentUserInfo(id=user_id),
    )

    assert response.already_saved is True
    assert response.id == existing.id


@pytest.mark.asyncio
async def test_analyze_url_checks_plan_gate_before_content_preparation(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    user_id = str(uuid.uuid4())

    async def _fake_get_article_by_url(
        db: object,
        user_id_arg: str,
        url: str,
    ) -> None:
        assert db is not None
        assert user_id_arg == user_id
        assert url == "https://youtube.com/watch?v=abc123"
        return None

    async def _fake_get_usage_info(_db: object, _user_id: str) -> SimpleNamespace:
        return SimpleNamespace(plan="basic", can_summarize=True)

    async def _should_not_prepare(**_kwargs: object) -> tuple[str, str]:
        raise AssertionError("content preparation should not run for disallowed plan")

    monkeypatch.setattr(router.service, "get_article_by_url", _fake_get_article_by_url)
    monkeypatch.setattr(router.sub_service, "get_usage_info", _fake_get_usage_info)
    monkeypatch.setattr(router, "prepare_analyze_url_content", _should_not_prepare)

    with pytest.raises(HTTPException) as exc_info:
        await router.analyze_url(
            ArticleAnalyzeURL(
                url="https://youtube.com/watch?v=abc123",
                title="Video title",
                content=None,
                source="extension",
            ),
            db=_fake_db_session(),
            user=CurrentUserInfo(id=user_id),
        )

    assert exc_info.value.status_code == status.HTTP_402_PAYMENT_REQUIRED


@pytest.mark.asyncio
async def test_analyze_url_blocks_non_patch_note_nod_links(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def _should_not_run(*_args: object, **_kwargs: object) -> None:
        raise AssertionError("should not hit database lookup for blocked NOD links")

    monkeypatch.setattr(router.service, "get_article_by_url", _should_not_run)

    with pytest.raises(HTTPException) as exc_info:
        await router.analyze_url(
            ArticleAnalyzeURL(
                url="https://nod-archive.com/ko/shared/abc123",
                title="Blocked self link",
                content=None,
                source="web",
            ),
            db=_fake_db_session(),
            user=CurrentUserInfo(id=str(uuid.uuid4())),
        )

    assert exc_info.value.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
    assert "NOD links cannot be analyzed" in str(exc_info.value.detail)


@pytest.mark.asyncio
async def test_analyze_url_allows_nod_patch_note_detail_links(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    user_id = str(uuid.uuid4())
    existing = _build_existing_article(user_id)

    async def _fake_get_article_by_url(
        db: object,
        user_id_arg: str,
        url: str,
    ) -> SimpleNamespace | None:
        assert db is not None
        assert user_id_arg == user_id
        assert url == "https://nod-archive.com/ko/changelog/v1-3-x"
        return existing

    monkeypatch.setattr(router.service, "get_article_by_url", _fake_get_article_by_url)

    response = await router.analyze_url(
        ArticleAnalyzeURL(
            url="https://nod-archive.com/ko/changelog/v1-3-x",
            title="Patch note",
            content=None,
            source="web",
        ),
        db=_fake_db_session(),
        user=CurrentUserInfo(id=user_id),
    )

    assert response.already_saved is True
    assert response.id == existing.id


@pytest.mark.asyncio
async def test_retry_uses_requested_summary_language_when_summary_missing(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    user_id = str(uuid.uuid4())
    article_id = uuid.uuid4()
    captured: dict[str, str] = {}

    article = SimpleNamespace(
        id=article_id,
        user_id=uuid.UUID(user_id),
        url="https://example.com/news",
        title="Failed article",
        original_title="Failed article",
        source="extension",
        status="failed",
        requested_summary_language="en",
        created_at=datetime.now(UTC),
        updated_at=None,
        summary=None,
        content="test content",
    )

    async def _fake_get_article(
        db: object,
        article_id_arg: uuid.UUID,
        user_id_arg: str,
    ) -> SimpleNamespace | None:
        assert db is not None
        assert article_id_arg == article_id
        assert user_id_arg == user_id
        return article

    async def _fake_get_usage_info(_db: object, _user_id: str) -> SimpleNamespace:
        return SimpleNamespace(plan="pro", can_summarize=True)

    async def _fake_update_status(_article_id: uuid.UUID, _status: str) -> None:
        return None

    async def _fake_run_analysis_async(
        article_id_arg: uuid.UUID,
        title: str,
        content: str,
        provider: str,
        summary_language: str,
        user_id_arg: str,
        article_url: str | None = None,
    ) -> None:
        assert article_id_arg == article_id
        assert title == article.title
        assert content == article.content
        assert provider == "gemini"
        assert user_id_arg == user_id
        assert article_url == article.url
        captured["summary_language"] = summary_language

    monkeypatch.setattr(router.service, "get_article", _fake_get_article)
    monkeypatch.setattr(router.sub_service, "get_usage_info", _fake_get_usage_info)
    monkeypatch.setattr(router.service, "update_article_status", _fake_update_status)
    monkeypatch.setattr(router, "_run_analysis_async", _fake_run_analysis_async)

    response = await router.retry_article_analysis(
        article_id=article_id,
        db=_fake_db_session(),
        user=CurrentUserInfo(id=user_id),
    )
    await asyncio.sleep(0)

    assert response.id == article_id
    assert captured["summary_language"] == "en"


@pytest.mark.asyncio
async def test_shared_og_image_route_uses_manual_thumbnail_derivative_when_available(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    request_token = str(uuid.uuid4())
    shared = SimpleNamespace(
        title="Shared title",
        summary="Shared summary",
        content_type="general_news",
        url="https://example.com/article",
        article_id=uuid.uuid4(),
        thumbnail_mode="manual",
        thumbnail_url="https://cdn.example.com/thumb.png",
    )

    async def _fake_get_shared_article_by_slug(
        db: object,
        share_slug: str,
        token: str | None,
        viewer_user_id: str | None,
        track_view: bool,
    ) -> SimpleNamespace:
        assert db is not None
        assert share_slug == "shared-slug"
        assert token == request_token
        assert viewer_user_id is None
        assert track_view is False
        return shared

    async def _fake_generate_from_thumbnail(_thumbnail_url: str) -> bytes:
        return b"derived-og"

    monkeypatch.setattr(
        router.service,
        "get_shared_article_by_slug",
        _fake_get_shared_article_by_slug,
    )
    monkeypatch.setattr(
        router,
        "_generate_og_from_thumbnail_url",
        _fake_generate_from_thumbnail,
    )

    response = await router.get_shared_article_og_image(
        share_slug="shared-slug",
        db=_fake_db_session(),
        user=None,
        token=request_token,
    )

    assert response is not None
    assert response.body == b"derived-og"
    assert response.headers["content-type"].startswith("image/png")


@pytest.mark.asyncio
async def test_shared_og_image_route_falls_back_to_generated_text_og(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    shared = SimpleNamespace(
        title="Fallback title",
        summary="Fallback summary",
        content_type="general_news",
        url="https://example.com/article",
        article_id=uuid.uuid4(),
        thumbnail_mode="manual",
        thumbnail_url="https://cdn.example.com/thumb.png",
    )

    async def _fake_get_shared_article_by_slug(
        db: object,
        share_slug: str,
        token: str | None,
        viewer_user_id: str | None,
        track_view: bool,
    ) -> SimpleNamespace:
        assert db is not None
        assert share_slug == "shared-slug"
        assert token is None
        assert viewer_user_id is None
        assert track_view is False
        return shared

    async def _fake_generate_from_thumbnail(_thumbnail_url: str) -> None:
        return None

    def _fake_generate_og_image(
        title: str,
        summary: str,
        content_type: str,
        article_url: str | None = None,
    ) -> bytes:
        assert title == "Fallback title"
        assert summary == "Fallback summary"
        assert content_type == "general_news"
        assert article_url == "https://example.com/article"
        return b"text-og"

    monkeypatch.setattr(
        router.service,
        "get_shared_article_by_slug",
        _fake_get_shared_article_by_slug,
    )
    monkeypatch.setattr(
        router,
        "_generate_og_from_thumbnail_url",
        _fake_generate_from_thumbnail,
    )
    monkeypatch.setattr(
        "src.articles.og_image.generate_og_image", _fake_generate_og_image
    )

    response = await router.get_shared_article_og_image(
        share_slug="shared-slug",
        db=_fake_db_session(),
        user=None,
        token=None,
    )

    assert response is not None
    assert response.body == b"text-og"
    assert response.headers["cache-control"] == "public, max-age=86400"
