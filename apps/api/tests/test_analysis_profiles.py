from types import SimpleNamespace

import pytest

from src.articles import analysis_profiles
from src.lib.content_classifier import ContentType


def test_timeout_uses_configured_value(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        analysis_profiles,
        "settings",
        SimpleNamespace(ARTICLE_ANALYSIS_TIMEOUT_SECONDS=45),
    )

    assert analysis_profiles.get_article_analysis_timeout_seconds() == 45


def test_timeout_clamps_minimum(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        analysis_profiles,
        "settings",
        SimpleNamespace(ARTICLE_ANALYSIS_TIMEOUT_SECONDS=0),
    )

    assert analysis_profiles.get_article_analysis_timeout_seconds() == 1


def test_video_timeout_uses_shorter_profile(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        analysis_profiles,
        "settings",
        SimpleNamespace(ARTICLE_ANALYSIS_TIMEOUT_SECONDS=45),
    )

    assert (
        analysis_profiles.get_article_analysis_timeout_seconds(
            ContentType.VIDEO_PODCAST
        )
        == 30
    )


def test_video_retry_uses_compact_profile(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        analysis_profiles,
        "settings",
        SimpleNamespace(ARTICLE_ANALYSIS_TIMEOUT_SECONDS=45),
    )

    assert (
        analysis_profiles.get_article_analysis_timeout_seconds(
            ContentType.VIDEO_PODCAST,
            retry=True,
        )
        == 18
    )


def test_content_limits_follow_profiles() -> None:
    assert (
        analysis_profiles.get_article_analysis_content_limit_chars(
            ContentType.GENERAL_NEWS
        )
        == 12000
    )
    assert (
        analysis_profiles.get_article_analysis_content_limit_chars(
            ContentType.VIDEO_PODCAST
        )
        == 9000
    )
    assert (
        analysis_profiles.get_article_analysis_content_limit_chars(
            ContentType.VIDEO_PODCAST,
            retry=True,
        )
        == 6500
    )
