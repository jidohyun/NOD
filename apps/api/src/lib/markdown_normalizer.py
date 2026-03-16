"""Utility for normalizing markdown_note strings from AI responses.

AI models sometimes return literal escape sequences (\\n, \\t) inside JSON
string values instead of actual characters. This module provides robust
normalization that handles single and double escaping.
"""

from __future__ import annotations


def normalize_markdown_note(text: str | None) -> str | None:
    """Normalize escape sequences in AI-generated markdown notes.

    Handles:
    - Single-escaped newlines: \\n → actual newline
    - Double-escaped newlines: \\\\n → actual newline
    - Single-escaped tabs: \\t → actual tab
    - Double-escaped tabs: \\\\t → actual tab
    - Windows line endings: \\r\\n → \\n

    Idempotent: calling twice produces the same result as once.
    """
    if not text:
        return text

    # Use placeholders to avoid double-processing.
    # Process double-escaped sequences first (before single-escaped ones),
    # converting them to the same placeholder → final character.
    _NL = "\x00NL\x00"
    _TAB = "\x00TAB\x00"

    result = text

    # Step 1: Replace double-escaped sequences with placeholders
    result = result.replace("\\\\n", _NL)
    result = result.replace("\\\\t", _TAB)

    # Step 2: Replace single-escaped sequences with placeholders
    result = result.replace("\\n", _NL)
    result = result.replace("\\t", _TAB)

    # Step 3: Normalize Windows line endings
    result = result.replace("\r\n", "\n")

    # Step 4: Restore placeholders to actual characters
    result = result.replace(_NL, "\n")
    result = result.replace(_TAB, "\t")

    return result
