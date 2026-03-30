from __future__ import annotations

import uuid

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


def test_is_nod_patch_note_url_accepts_changelog_detail_path() -> None:
    assert router._is_nod_patch_note_url("https://nod-archive.com/ko/changelog/v1-3-x")
    assert router._is_nod_patch_note_url(
        "https://www.nod-archive.com/zh-CN/changelog/v1-2-0?ref=share"
    )


def test_is_nod_patch_note_url_rejects_non_detail_nod_paths() -> None:
    assert not router._is_nod_patch_note_url("https://nod-archive.com/ko/changelog")
    assert not router._is_nod_patch_note_url("https://nod-archive.com/ko/shared/abc")
    assert not router._is_nod_patch_note_url("https://example.com/ko/changelog/v1-3-x")


def test_attach_patch_note_tag_adds_and_preserves_tags() -> None:
    metadata = {"foo": "bar", "tags": ["alpha"]}

    tagged = router._attach_patch_note_tag(
        metadata,
        "https://nod-archive.com/ko/changelog/v1-3-x",
    )

    assert tagged["foo"] == "bar"
    assert tagged["tags"] == ["alpha", "patch-note"]


def test_attach_patch_note_tag_noop_for_non_patch_note_url() -> None:
    metadata = {"foo": "bar"}

    tagged = router._attach_patch_note_tag(
        metadata,
        "https://nod-archive.com/ko/shared/abc",
    )

    assert tagged == {"foo": "bar"}
