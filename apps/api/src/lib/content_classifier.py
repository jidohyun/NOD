"""URL-based content type classifier for article summarization."""

from enum import StrEnum
from urllib.parse import urlparse


class ContentType(StrEnum):
    TECH_BLOG = "tech_blog"
    ACADEMIC_PAPER = "academic_paper"
    GENERAL_NEWS = "general_news"
    GITHUB_REPO = "github_repo"
    OFFICIAL_DOCS = "official_docs"
    VIDEO_PODCAST = "video_podcast"


_DOMAIN_RULES: list[tuple[list[str], ContentType]] = [
    # GitHub / GitLab / Bitbucket
    (["github.com", "gitlab.com", "bitbucket.org"], ContentType.GITHUB_REPO),
    # Academic
    (
        [
            "arxiv.org",
            "scholar.google.com",
            "semanticscholar.org",
            "pubmed.ncbi.nlm.nih.gov",
            "ieee.org",
            "acm.org",
            "researchgate.net",
            "ssrn.com",
        ],
        ContentType.ACADEMIC_PAPER,
    ),
    # Video / Podcast
    (
        [
            "youtube.com",
            "youtu.be",
            "podcasts.apple.com",
            "spotify.com",
            "soundcloud.com",
            "vimeo.com",
        ],
        ContentType.VIDEO_PODCAST,
    ),
    # Tech Blogs
    (
        [
            "medium.com",
            "dev.to",
            "velog.io",
            "hashnode.dev",
            "tistory.com",
            "brunch.co.kr",
            "zenn.dev",
            "qiita.com",
            "hackernoon.com",
            "freecodecamp.org",
            "css-tricks.com",
            "smashingmagazine.com",
            "infoq.com",
            "dzone.com",
            "techcrunch.com",
        ],
        ContentType.TECH_BLOG,
    ),
    # Official Docs
    (
        [
            # Python / Rust / Go
            "docs.python.org",
            "docs.rs",
            "pkg.go.dev",
            # Microsoft / Apple / Google
            "docs.microsoft.com",
            "learn.microsoft.com",
            "developer.apple.com",
            "cloud.google.com",
            "developers.google.com",
            # Mozilla
            "developer.mozilla.org",
            # JavaScript frameworks (current domains)
            "react.dev",
            "nextjs.org",
            "vuejs.org",
            "angular.io",
            "angular.dev",
            "svelte.dev",
            "kit.svelte.dev",
            "solidjs.com",
            "preactjs.com",
            "astro.build",
            # JavaScript frameworks (legacy domains)
            "reactjs.org",
            "legacy.reactjs.org",
            # TypeScript / Node / Deno / Bun
            "typescriptlang.org",
            "nodejs.org",
            "deno.land",
            "deno.com",
            "bun.sh",
            # CSS / UI frameworks
            "tailwindcss.com",
            "getbootstrap.com",
            # Backend frameworks
            "fastapi.tiangolo.com",
            "docs.djangoproject.com",
            "flask.palletsprojects.com",
            "spring.io",
            "rubyonrails.org",
            # Databases
            "redis.io",
            "postgresql.org",
            "mongodb.com",
            # Cloud / DevOps
            "docs.aws.amazon.com",
            "vercel.com",
            "docs.docker.com",
            "kubernetes.io",
            # Other
            "graphql.org",
            "docs.github.com",
            "platform.openai.com",
            "docs.anthropic.com",
        ],
        ContentType.OFFICIAL_DOCS,
    ),
]


def classify_url(url: str) -> ContentType:
    """Classify content type from URL pattern."""
    parsed = urlparse(url)
    host = parsed.hostname or ""
    host = host.removeprefix("www.")
    path = parsed.path.lower()

    for domains, content_type in _DOMAIN_RULES:
        if any(host == d or host.endswith(f".{d}") for d in domains):
            return content_type

    # Path-based heuristics
    docs_paths = (
        "/docs/",
        "/documentation/",
        "/reference/",
        "/api/",
        "/guide/",
        "/learn/",
        "/tutorial/",
    )
    if host.startswith("docs.") or any(p in path for p in docs_paths):
        return ContentType.OFFICIAL_DOCS
    if host.startswith("blog.") or "/blog/" in path or "/posts/" in path:
        return ContentType.TECH_BLOG

    return ContentType.GENERAL_NEWS
