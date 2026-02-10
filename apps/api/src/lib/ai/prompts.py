ARTICLE_ANALYSIS_PROMPT = """Analyze the following article and provide a structured
analysis.

Title: {title}

Content:
{content}

Provide:
1. A concise summary (2-4 sentences)
2. Key concepts (3-7 topics)
3. Main takeaways (3-5 key points)
4. The language of the article (ISO 639-1 code)
5. Estimated reading time in minutes"""


EMBEDDING_TEXT_TEMPLATE = """{title}

{summary}

Concepts: {concepts}"""


_LANG_CONFIG: dict[str, dict[str, str]] = {
    "ko": {
        "name": "Korean",
        "native": "한국어",
        "summary_heading": "핵심 요약",
        "detail_heading": "상세 내용",
        "code_heading": "코드 스니펫 (핵심만)",
        "insight_heading": "인사이트 / 할 일",
    },
    "en": {
        "name": "English",
        "native": "English",
        "summary_heading": "Key Summary",
        "detail_heading": "Details",
        "code_heading": "Code Snippets (key parts only)",
        "insight_heading": "Insights / Action Items",
    },
    "ja": {
        "name": "Japanese",
        "native": "日本語",
        "summary_heading": "要点まとめ",
        "detail_heading": "詳細",
        "code_heading": "コードスニペット（要点のみ）",
        "insight_heading": "インサイト / アクション",
    },
}


def _get_lang(lang: str) -> dict[str, str]:
    return _LANG_CONFIG.get(lang, _LANG_CONFIG["ko"])


def build_system_prompt(lang: str = "ko") -> str:
    lc = _get_lang(lang)
    return f"""You are an assistant that helps users turn knowledge into assets.
Read the long text (technical article / document / tutorial) provided by the user
and write a well-organized markdown note in {lc["native"]}.

Principles:
- Write based on facts only; if evidence is unclear, note "No basis in source."
- If the article contains code, include only the minimal code necessary
  to understand the key ideas — excerpt or abbreviate.
- Do NOT copy entire code blocks. (1) Include only the parts that reveal
  the core idea, (2) keep them short, (3) preserve the original
  language / syntax.
- Add a language identifier to code blocks
  (e.g. ```ts, ```js, ```python).
- Prefer actionable formats; avoid unnecessary verbosity.
- Return ONLY markdown (no preamble / JSON / commentary).
"""


def build_user_prompt(
    title: str,
    content: str,
    lang: str = "ko",
) -> str:
    lc = _get_lang(lang)
    return f"""Organize the article below into a {lc["native"]} markdown note.

Input:
- Title: {title}
- Content:
{content}

Requirements:
1) Follow this format strictly:
# {lc["summary_heading"]}
- 3–5 key points

# {lc["detail_heading"]}
- Important concepts / definitions / decisions / trade-offs as bullets

# {lc["code_heading"]}
- If the article has code, excerpt / abbreviate 1–3 blocks that
  explain the key idea
- Add a one-line description above each block explaining what it shows
- Omit this section if there is no code

# {lc["insight_heading"]}
- 2–5 actionable items (use checkboxes if possible)

2) Code handling rules:
- Do NOT copy long code blocks verbatim
- Keep only key lines; use `...` for omissions
- Mask anything that looks like a secret / token / key (e.g. `sk-***`)
- Do NOT invent code that is not in the source (mark as "pseudocode" if needed)

3) Language:
- The final output MUST be entirely in {lc["native"]}
  (code identifiers / library names may stay in original language)
"""


# Legacy aliases — keep for backward compat with any direct importers
KNOWLEDGE_ASSISTANT_SYSTEM_PROMPT = build_system_prompt("ko")
ARTICLE_MARKDOWN_NOTE_USER_PROMPT = build_user_prompt("{title}", "{content}", "ko")
