from __future__ import annotations

import uuid
from types import SimpleNamespace

import pytest

from src.articles import router


class _FakeSession:
    async def commit(self) -> None:
        return None


class _FakeSessionFactory:
    async def __aenter__(self) -> _FakeSession:
        return _FakeSession()

    async def __aexit__(self, exc_type: object, exc: object, tb: object) -> bool:
        return False

    def __call__(self) -> _FakeSessionFactory:
        return self


@pytest.mark.asyncio
async def test_run_analysis_async_does_not_mark_failed_if_usage_increment_fails(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    article_id = uuid.uuid4()
    user_id = str(uuid.uuid4())
    updates: list[str] = []

    async def _fake_run_analysis(
        article_id_arg: uuid.UUID,
        title: str,
        content: str,
        provider: str,
        summary_language: str,
        article_url: str | None = None,
    ) -> bool:
        assert article_id_arg == article_id
        assert title == "Title"
        assert content == "Body"
        assert provider == "gemini"
        assert summary_language == "ko"
        assert article_url == "https://example.com"
        return True

    async def _fake_increment_summary_usage(_db: object, _user_id: str) -> None:
        raise RuntimeError("usage counter failure")

    async def _fake_update_article_status(_article_id: uuid.UUID, status: str) -> None:
        updates.append(status)

    monkeypatch.setattr(router, "_run_analysis", _fake_run_analysis)
    monkeypatch.setattr(
        router.sub_service,
        "increment_summary_usage",
        _fake_increment_summary_usage,
    )
    monkeypatch.setattr(
        router.service, "update_article_status", _fake_update_article_status
    )
    monkeypatch.setattr("src.lib.database.async_session_factory", _FakeSessionFactory())

    await router._run_analysis_async(
        article_id=article_id,
        title="Title",
        content="Body",
        provider="gemini",
        summary_language="ko",
        user_id=user_id,
        article_url="https://example.com",
    )

    assert updates == []


def test_get_article_analysis_timeout_seconds_reads_settings(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        router,
        "settings",
        SimpleNamespace(ARTICLE_ANALYSIS_TIMEOUT_SECONDS=45),
    )

    assert router.get_article_analysis_timeout_seconds() == 45


def test_get_article_analysis_timeout_seconds_clamps_minimum_value(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        router,
        "settings",
        SimpleNamespace(ARTICLE_ANALYSIS_TIMEOUT_SECONDS=0),
    )

    assert router.get_article_analysis_timeout_seconds() == 1


def test_get_article_analysis_timeout_seconds_uses_shorter_profile_for_video(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        router,
        "settings",
        SimpleNamespace(ARTICLE_ANALYSIS_TIMEOUT_SECONDS=45),
    )

    assert (
        router.get_article_analysis_timeout_seconds(router.ContentType.VIDEO_PODCAST)
        == 30
    )


def test_get_article_analysis_timeout_seconds_uses_retry_profile_for_video(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        router,
        "settings",
        SimpleNamespace(ARTICLE_ANALYSIS_TIMEOUT_SECONDS=45),
    )

    assert (
        router.get_article_analysis_timeout_seconds(
            router.ContentType.VIDEO_PODCAST,
            retry=True,
        )
        == 18
    )


def test_get_article_analysis_content_limit_chars_by_profile() -> None:
    assert (
        router.get_article_analysis_content_limit_chars(router.ContentType.GENERAL_NEWS)
        == 12000
    )
    assert (
        router.get_article_analysis_content_limit_chars(
            router.ContentType.VIDEO_PODCAST
        )
        == 9000
    )
    assert (
        router.get_article_analysis_content_limit_chars(
            router.ContentType.VIDEO_PODCAST,
            retry=True,
        )
        == 6500
    )
