"""Tests for URL-based content type classifier."""

from src.lib.content_classifier import ContentType, classify_url


class TestClassifyUrl:
    def test_github(self):
        assert (
            classify_url("https://github.com/vercel/next.js")
            == ContentType.GITHUB_REPO
        )

    def test_gitlab(self):
        assert (
            classify_url("https://gitlab.com/group/project")
            == ContentType.GITHUB_REPO
        )

    def test_arxiv(self):
        assert (
            classify_url("https://arxiv.org/abs/2301.00001")
            == ContentType.ACADEMIC_PAPER
        )

    def test_scholar(self):
        assert (
            classify_url("https://scholar.google.com/citations?user=abc")
            == ContentType.ACADEMIC_PAPER
        )

    def test_medium(self):
        assert classify_url("https://medium.com/some-article") == ContentType.TECH_BLOG

    def test_velog(self):
        assert classify_url("https://velog.io/@user/post") == ContentType.TECH_BLOG

    def test_dev_to(self):
        assert classify_url("https://dev.to/user/post") == ContentType.TECH_BLOG

    def test_youtube(self):
        assert (
            classify_url("https://youtube.com/watch?v=abc")
            == ContentType.VIDEO_PODCAST
        )

    def test_youtu_be(self):
        assert classify_url("https://youtu.be/abc123") == ContentType.VIDEO_PODCAST

    def test_spotify(self):
        assert (
            classify_url("https://open.spotify.com/episode/abc")
            == ContentType.VIDEO_PODCAST
        )

    def test_mdn(self):
        assert (
            classify_url("https://developer.mozilla.org/en-US/docs/Web")
            == ContentType.OFFICIAL_DOCS
        )

    def test_python_docs(self):
        assert (
            classify_url("https://docs.python.org/3/library/asyncio.html")
            == ContentType.OFFICIAL_DOCS
        )

    def test_unknown_defaults_to_general(self):
        assert (
            classify_url("https://random-site.com/article")
            == ContentType.GENERAL_NEWS
        )

    def test_docs_subdomain_heuristic(self):
        assert (
            classify_url("https://docs.example.com/guide")
            == ContentType.OFFICIAL_DOCS
        )

    def test_blog_path_heuristic(self):
        assert (
            classify_url("https://example.com/blog/my-post") == ContentType.TECH_BLOG
        )

    def test_posts_path_heuristic(self):
        assert (
            classify_url("https://example.com/posts/article-1") == ContentType.TECH_BLOG
        )

    def test_documentation_path_heuristic(self):
        assert (
            classify_url("https://example.com/documentation/api")
            == ContentType.OFFICIAL_DOCS
        )

    def test_www_prefix_stripped(self):
        assert (
            classify_url("https://www.github.com/user/repo")
            == ContentType.GITHUB_REPO
        )

    def test_naver_blog_general_news(self):
        assert (
            classify_url("https://blog.naver.com/user/12345") == ContentType.TECH_BLOG
        )

    def test_all_content_types_exist(self):
        """Verify all enum values are valid strings."""
        assert len(ContentType) == 6
        for ct in ContentType:
            assert isinstance(ct.value, str)
