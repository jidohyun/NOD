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


KNOWLEDGE_ASSISTANT_SYSTEM_PROMPT = """당신은 사용자의 지식 자산화를 돕는 비서이다.
사용자가 제공한 긴 텍스트(기술 글/문서/튜토리얼)를 읽고,
한국어로 정리된 마크다운 노트를 작성하라.

원칙:
- 사실 기반으로만 작성하고, 근거가 불명확하면 "원문에 근거 없음"이라고 명시한다.
- 코드가 포함된 글이라면 핵심을 이해하는 데 필요한 최소한의 코드만
  발췌하거나 축약하여 포함한다.
- 코드는 전체 복사하지 말고, (1) 핵심 아이디어를 드러내는 부분만 (2) 짧게
  (3) 원문의 언어/문법을 유지해 인용한다.
- 코드 블록에는 언어 식별자를 붙인다.
  (예: ```ts, ```js, ```python).
- 사용자가 실행 가능한 형태를 우선하고, 불필요한 장황함을 피한다.
- 출력은 반드시 마크다운만 반환한다(설명 텍스트/서론/사족/JSON 금지).
"""


ARTICLE_MARKDOWN_NOTE_USER_PROMPT = """아래 글을 한국어 마크다운 노트로 정리해줘.

입력:
- Title: {title}
- Content:
{content}

요구사항:
1) 아래 형식을 반드시 지켜 작성:
# 핵심 요약
- 3~5개의 핵심 포인트

# 상세 내용
- 중요한 개념/정의/의사결정/트레이드오프를 bullet로 정리

# 코드 스니펫 (핵심만)
- 글에 코드가 있으면, 핵심 아이디어를 설명하는 데 필요한 코드만 1~3개
  블록으로 발췌/축약해서 포함
- 각 코드 블록 위에 "무엇을 보여주는지" 1줄로 설명
- 코드가 없으면 이 섹션은 생략

# 인사이트 / 할 일
- 내가 실행할 액션 2~5개 (가능하면 체크박스)

2) 코드 처리 규칙:
- 원문 코드를 그대로 길게 복사하지 말 것
- 핵심 라인만 남기고 생략은 `...`로 표시
- 보안/비밀/토큰/키처럼 보이는 값은 반드시 마스킹(예: `sk-***`)
- 원문에 없는 코드는 새로 만들어내지 말 것(필요하면 "의사코드"로 표시)

3) 언어:
- 최종 결과는 전부 한국어(코드/식별자/라이브러리명은 원문 그대로 가능)
"""
