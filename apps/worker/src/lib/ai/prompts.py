ARTICLE_ANALYSIS_PROMPT = """\
Analyze the following article and provide a structured analysis.

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
