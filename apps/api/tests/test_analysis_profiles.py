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


def test_video_timeout_uses_more_generous_profile(
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
        == 60
    )


def test_video_retry_preserves_configured_timeout(
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
        == 45
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


def test_official_docs_timeout_uses_slow_profile(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        analysis_profiles,
        "settings",
        SimpleNamespace(ARTICLE_ANALYSIS_TIMEOUT_SECONDS=45),
    )

    assert (
        analysis_profiles.get_article_analysis_timeout_seconds(
            ContentType.OFFICIAL_DOCS
        )
        == 60
    )



def test_academic_paper_profiles_use_large_content_defaults(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        analysis_profiles,
        "settings",
        SimpleNamespace(ARTICLE_ANALYSIS_TIMEOUT_SECONDS=45),
    )

    assert (
        analysis_profiles.get_article_analysis_timeout_seconds(
            ContentType.ACADEMIC_PAPER
        )
        == 45
    )
    assert (
        analysis_profiles.get_article_analysis_timeout_seconds(
            ContentType.ACADEMIC_PAPER,
            retry=True,
        )
        == 30
    )
    assert (
        analysis_profiles.get_article_analysis_content_limit_chars(
            ContentType.ACADEMIC_PAPER
        )
        == 30000
    )
    assert (
        analysis_profiles.get_article_analysis_content_limit_chars(
            ContentType.ACADEMIC_PAPER,
            retry=True,
        )
        == 18000
    )
