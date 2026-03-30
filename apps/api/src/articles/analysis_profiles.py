from src.lib.content_classifier import ContentType
from src.lib.config import settings

SLOW_ANALYSIS_CONTENT_TYPES = frozenset(
    {
        ContentType.OFFICIAL_DOCS,
        ContentType.VIDEO_PODCAST,
    }
)

# Academic papers get generous limits since they contain dense, important content.
LARGE_CONTENT_TYPES = frozenset(
    {
        ContentType.ACADEMIC_PAPER,
    }
)


def get_article_analysis_timeout_seconds(
    content_type: ContentType = ContentType.GENERAL_NEWS,
    *,
    retry: bool = False,
) -> int:
    configured_timeout = int(getattr(settings, "ARTICLE_ANALYSIS_TIMEOUT_SECONDS", 45))
    timeout = max(configured_timeout, 1)

    # Academic papers get full timeout for large content processing.
    if content_type in LARGE_CONTENT_TYPES:
        return max(timeout - 15, 30) if retry else timeout

    if content_type not in SLOW_ANALYSIS_CONTENT_TYPES:
        return timeout

    first_attempt_timeout = max(timeout - 15, 10)
    if not retry:
        return first_attempt_timeout

    return max(first_attempt_timeout - 12, 6)


def get_article_analysis_content_limit_chars(
    content_type: ContentType = ContentType.GENERAL_NEWS,
    *,
    retry: bool = False,
) -> int:
    if content_type in LARGE_CONTENT_TYPES:
        return 18000 if retry else 30000

    if content_type not in SLOW_ANALYSIS_CONTENT_TYPES:
        return 12000

    if retry:
        return 6500

    return 9000
