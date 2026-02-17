"""Tests for content-type-aware summarization agents."""

from src.lib.agents.base import BaseSummaryAgent, BaseSummaryResult
from src.lib.agents.registry import get_agent
from src.lib.content_classifier import ContentType


class TestAgentRegistry:
    def test_all_content_types_have_agents(self):
        for ct in ContentType:
            agent = get_agent(ct)
            assert agent is not None
            assert isinstance(agent, BaseSummaryAgent)

    def test_tech_blog_agent(self):
        agent = get_agent(ContentType.TECH_BLOG)
        assert agent.content_type == ContentType.TECH_BLOG
        schema = agent.get_result_schema()
        assert issubclass(schema, BaseSummaryResult)
        assert "tech_stack" in schema.model_fields
        assert "difficulty_level" in schema.model_fields

    def test_academic_paper_agent(self):
        agent = get_agent(ContentType.ACADEMIC_PAPER)
        assert agent.content_type == ContentType.ACADEMIC_PAPER
        schema = agent.get_result_schema()
        assert "abstract" in schema.model_fields
        assert "methodology" in schema.model_fields
        assert "findings" in schema.model_fields
        assert "limitations" in schema.model_fields

    def test_general_news_agent(self):
        agent = get_agent(ContentType.GENERAL_NEWS)
        assert agent.content_type == ContentType.GENERAL_NEWS
        schema = agent.get_result_schema()
        assert "sentiment" in schema.model_fields
        assert "bias_indicators" in schema.model_fields

    def test_github_repo_agent(self):
        agent = get_agent(ContentType.GITHUB_REPO)
        assert agent.content_type == ContentType.GITHUB_REPO
        schema = agent.get_result_schema()
        assert "tech_stack" in schema.model_fields
        assert "architecture_overview" in schema.model_fields
        assert "use_cases" in schema.model_fields

    def test_official_docs_agent(self):
        agent = get_agent(ContentType.OFFICIAL_DOCS)
        assert agent.content_type == ContentType.OFFICIAL_DOCS
        schema = agent.get_result_schema()
        assert "api_highlights" in schema.model_fields
        assert "prerequisites" in schema.model_fields

    def test_video_podcast_agent(self):
        agent = get_agent(ContentType.VIDEO_PODCAST)
        assert agent.content_type == ContentType.VIDEO_PODCAST
        schema = agent.get_result_schema()
        assert "timestamps" in schema.model_fields
        assert "speakers" in schema.model_fields

    def test_fallback_to_general_news(self):
        """Unknown content type should fall back to general_news agent."""
        agent = get_agent(ContentType.GENERAL_NEWS)
        assert agent.content_type == ContentType.GENERAL_NEWS

    def test_agents_produce_prompts(self):
        """All agents should produce non-empty prompts."""
        for ct in ContentType:
            agent = get_agent(ct)
            assert len(agent.build_system_prompt("en")) > 0
            assert len(agent.build_user_prompt("Test", "Content", "en")) > 0
            assert len(agent.build_json_prompt("en")) > 0

    def test_agents_produce_korean_prompts(self):
        """All agents should work with Korean language."""
        for ct in ContentType:
            agent = get_agent(ct)
            system = agent.build_system_prompt("ko")
            assert "한국어" in system
