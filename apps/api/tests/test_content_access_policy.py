from types import SimpleNamespace

import pytest
from fastapi import HTTPException, status

from src.articles.router import (
    enforce_content_type_access,
    resolve_content_type_for_retry,
    resolve_summary_language_for_retry,
)
from src.lib.content_classifier import ContentType
from src.subscriptions.service import can_access_content_type


@pytest.mark.parametrize(
    ("plan", "content_type", "expected"),
    [
        ("basic", ContentType.GENERAL_NEWS, True),
        ("basic", ContentType.TECH_BLOG, True),
        ("basic", ContentType.GITHUB_REPO, False),
        ("basic", ContentType.ACADEMIC_PAPER, False),
        ("basic", ContentType.OFFICIAL_DOCS, True),
        ("basic", ContentType.VIDEO_PODCAST, False),
        ("pro", ContentType.GENERAL_NEWS, True),
        ("pro", ContentType.GITHUB_REPO, True),
    ],
)
def test_can_access_content_type(plan: str, content_type: ContentType, expected: bool):
    assert can_access_content_type(plan, content_type) is expected


def test_enforce_content_type_access_raises_for_basic_github_repo():
    with pytest.raises(HTTPException) as exc_info:
        enforce_content_type_access("basic", ContentType.GITHUB_REPO)

    assert exc_info.value.status_code == status.HTTP_402_PAYMENT_REQUIRED


def test_enforce_content_type_access_allows_basic_general_news():
    enforce_content_type_access("basic", ContentType.GENERAL_NEWS)


def test_resolve_content_type_for_retry_prefers_summary_content_type():
    article = SimpleNamespace(
        summary=SimpleNamespace(content_type=ContentType.ACADEMIC_PAPER.value),
        url="https://medium.com/example/post",
    )

    assert resolve_content_type_for_retry(article) == ContentType.ACADEMIC_PAPER


def test_resolve_content_type_for_retry_falls_back_to_url():
    article = SimpleNamespace(
        summary=SimpleNamespace(content_type="invalid_content_type"),
        url="https://github.com/vercel/next.js",
    )

    assert resolve_content_type_for_retry(article) == ContentType.GITHUB_REPO


def test_resolve_content_type_for_retry_defaults_to_general_news():
    article = SimpleNamespace(summary=None, url=None)

    assert resolve_content_type_for_retry(article) == ContentType.GENERAL_NEWS


def test_resolve_summary_language_for_retry_prefers_saved_summary_language():
    article = SimpleNamespace(
        summary=SimpleNamespace(language="en"),
        requested_summary_language="ja",
    )

    assert resolve_summary_language_for_retry(article) == "en"


def test_retry_uses_requested_summary_language_when_summary_missing() -> None:
    article = SimpleNamespace(summary=None, requested_summary_language="en")

    assert resolve_summary_language_for_retry(article) == "en"


def test_resolve_summary_language_for_retry_defaults_to_korean():
    article = SimpleNamespace(summary=None, requested_summary_language=None)

    assert resolve_summary_language_for_retry(article) == "ko"
