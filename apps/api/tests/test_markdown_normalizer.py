"""Tests for markdown_note normalization utility."""

from src.lib.markdown_normalizer import normalize_markdown_note


class TestNormalizeMarkdownNote:
    def test_none_returns_none(self):
        assert normalize_markdown_note(None) is None

    def test_empty_string_returns_empty(self):
        assert normalize_markdown_note("") == ""

    def test_already_normal_is_idempotent(self):
        text = "# Title\n\nSome content\n- item 1\n- item 2"
        assert normalize_markdown_note(text) == text

    def test_single_escaped_newline(self):
        result = normalize_markdown_note("line1\\nline2")
        assert result == "line1\nline2"

    def test_double_escaped_newline(self):
        """Double-escaped \\\\n should become actual newline."""
        result = normalize_markdown_note("line1\\\\nline2")
        assert result == "line1\nline2"

    def test_escaped_tab(self):
        result = normalize_markdown_note("col1\\tcol2")
        assert result == "col1\tcol2"

    def test_double_escaped_tab(self):
        result = normalize_markdown_note("col1\\\\tcol2")
        assert result == "col1\tcol2"

    def test_windows_line_endings_normalized(self):
        result = normalize_markdown_note("line1\r\nline2\r\nline3")
        assert result == "line1\nline2\nline3"

    def test_mixed_escape_patterns(self):
        """AI output often mixes actual newlines with escaped ones."""
        result = normalize_markdown_note("# Title\\n\\nContent\\n- item")
        assert result == "# Title\n\nContent\n- item"

    def test_idempotent_on_repeated_calls(self):
        """Calling normalize twice should produce same result as once."""
        text = "line1\\nline2\\\\nline3"
        once = normalize_markdown_note(text)
        twice = normalize_markdown_note(once)
        assert once == twice

    def test_code_block_backticks_preserved(self):
        """Backtick code blocks must not be altered."""
        text = "```python\\nprint('hello')\\n```"
        result = normalize_markdown_note(text)
        assert "```python" in result
        assert "print('hello')" in result
        assert "```" in result

    def test_real_world_ai_output(self):
        """Simulate typical AI JSON string value with escaped newlines."""
        ai_output = (
            "# 요약\\n- 핵심 포인트 1\\n- 핵심 포인트 2\\n\\n# 상세\\n내용 여기"
        )
        result = normalize_markdown_note(ai_output)
        assert result == "# 요약\n- 핵심 포인트 1\n- 핵심 포인트 2\n\n# 상세\n내용 여기"
