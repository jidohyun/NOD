# stdy.blog의 tidying flow: 아티클 전수 조사

date: 2026-08-12 | method: 사이트맵 564 URL 중 563편 전수 스캔 + 링크 그래프(1,072 엣지) + GitHub 커밋 실측 | status: settled

## 요지 (3줄)

stdy.blog(배휘동)에서 tidying을 리터럴로 다루는 글은 563편 전수 스캔 기준 정확히 4편이고, 개념의 알맹이는 2025-12-17 레거시 코드베이스 밋업 발표와 suggest-tidyings 플러그인 원문에 있다.
"tidying flow"라는 단일 명명 프레임워크는 확인한 코퍼스 내에 없다. 실체는 "최근 커밋 → 병렬 sub-agent 제안 → 하루 1개 PR-리뷰-프리 초소형 안전 커밋 → Slack 가시화"라는 조직 루틴이다.
도구는 2026-01-10 suggest-tidyings 독립 플러그인으로 공개됐다가 2026-02-07 `cwf:refactor --tidy` 모드로 흡수됐다 (흡수 커밋 실측).

## 핵심 아티클 목록

### tidying 리터럴 직접 언급 (4편, 전수)

| 날짜 | 글 | 역할 |
|---|---|---|
| 2025-06-29 | [AI가 잘못하고 있다는 3가지 신호 + TDD를 돕는 시스템 프롬프트 by 켄트 벡](https://www.stdy.blog/warning-signs-for-off-track-ai-and-tdd-system-prompts-by-kent-beck) | **개념 도입점.** Kent Beck 『Tidy First?』 소개 + "Follow Beck's Tidy First approach by separating structural changes from behavioral changes" 시스템 프롬프트 전문 게재. "증강형 코딩에서는 … 'Tidy Code That Works', 즉 '작동하는 깔끔한 코드'를 중요시한다" |
| 2025-07-28 | [책 읽을 결심](https://www.stdy.blog/decision-to-read) | 하반기 독서 목록에 켄트 벡 『Tidy First?』·『TDD』·파울러 『리팩토링』 지정 |
| 2026-01-10 | [이상적인 AI 네이티브 제품 팀을 상상하다](https://www.stdy.blog/imagine-the-ideal-ai-native-product-team) | **팀 프랙티스 선언.** "코드 품질 지표가 대시보드로 관리되고, 우상향하는 프랙티스가 정착된다(매일 tidying 등)". 앵커는 suggest-tidyings 플러그인 |
| 2026-01-21 | [Codex에서도 서브에이전트를 사용해봅시다](https://www.stdy.blog/lets-use-sub-agents-in-codex) | **실전 인터페이스.** "`.claude/commands/suggest-tidyings.md` 에 따라 sub-agent를 spawn해서 각 제안별로 tidying 커밋을 만들어줘" |

### tidying flow 서사의 뼈대 (키워드는 슬라이드에만)

- [레거시 코드베이스에서 에이전트와 사람을 함께 일잘러로 만드는 환경 구축하기](https://www.stdy.blog/designing-better-env-for-human-and-agents-in-legacy-codebase) (2025-12-17, 클로드 코드 밋업 발표 + 31장 슬라이드)
  - "매일 PR 리뷰 없이 초소형 리팩토링(tidying) 커밋 올리기" (slide 20)
  - "초소형 리팩토링, tidying이 매일같이 코드베이스를 조금씩 개선함으로써 어느 순간 큰 리팩토링과 큰 작업을 해볼 수 있겠다는 엄두를 내게 도와주고" (slide 21)
  - 전략 프레임: "도전적인 걸 더 안전하게 (한 파일씩 tsc strict, 최소한의 룰로 eslint, 한 패키지에 하나씩 knip 등) / 안전한 걸 더 가치있게 (최근 변경사항에 대해 tidying 제안받는 프롬프트 만들기 등)" (slides 25-26)
  - suggest-tidyings 탄생 서사: "tidying 합시다! → 뭘 대상으로 하죠? → 대상 찾는 프롬프트 만듦 → 최근 커밋 n개에 대해 찾아주면 더 가치가 높겠다 → 커밋들을 병렬 분석하자 → 커밋한 걸 슬랙에 알리자" (slide 27)
  - 전망: "이런 경험과 자신감이 쌓이면 나중에는 자동으로 무한 tidying도 가능하지 않을까"

### 워크플로우 인접 (tidying 미언급이나 위치 이해에 필요)

- [나만의 워크플로우 자라나게 하기](https://www.stdy.blog/growing-custom-workflow): 세션 종료 시 회고(retro)로 지식·스킬을 정돈하는 compounding 루프
- [2026년 6월 개발 워크플로우 스냅샷](https://www.stdy.blog/2026-june-dev-workflow-snapshot): 구현 → commit lint → slice critique → pre-push quality → 자동 retro
- [환경 설계하기](https://www.stdy.blog/designing-environments): "담배꽁초가 없는 깨끗한 바닥이야말로 가장 강력한 '금연 표지판'" = 금지어 프롬프트보다 hook/환경 제약
- [대용량 JS 파일 리팩토링 경험](https://www.stdy.blog/large-js-file-refactoring-with-three-way-collaboration-kr) (2024-03-08). **선사(先史).** 18,500줄→1,335줄 AST 반복 정돈. tidying/Kent Beck 언급 0회. 개념적 수렴이지 직접 계보 아님 (저자가 밝힌 출처는 김창준의 인지적 프롬프팅 교육)

## tidying flow의 실체 구조

suggest-tidyings 플러그인 원문 (커밋 고정 `45fee376`, 2026-01-10, 현재는 삭제됨):

- SKILL: "Analyze recent commits to find small, safe code improvements. … Each suggestion must be a perfectly safe, independent, small change. No logic changes, easy to review." 이에 따라 non-tidying 최근 커밋마다 병렬 sub-agent 실행, `git diff {commit}..HEAD`로 유효성 확인
- guide: "Our team follows a rule of making one tidying commit per day. This should not be a major refactoring, but a very small and perfectly safe change that makes the code easier to read."
- 기법 카탈로그 (Kent Beck 32기법의 부분집합): Guard Clauses, Dead Code Removal, Normalize Symmetries, New Interface Old Implementation, Reading Order, Explaining Variables, Extract Helper, Explaining Comments

정리하면 flow는 이렇다: **최근 커밋 스캔 → 커밋별 병렬 sub-agent 제안 → 하루 1개, 로직 불변·독립·리뷰 용이한 초소형 커밋 → Slack 알림으로 가시화/보상.**

도구 진화: 독립 플러그인 → 2026-02-07 흡수 커밋 [`238f82dd`](https://github.com/corca-ai/claude-plugins/commit/238f82dd5f5ef46055ac16479d6a2c989677dc6c) "Absorb suggest-tidyings commit-based tidying into --code mode" → 삭제 커밋 [`2aa308fe`](https://github.com/corca-ai/claude-plugins/commit/2aa308fe5ec7d78a9983a5dc80a8c826025ddcf1) → 현행 [`cwf:refactor --tidy`](https://github.com/corca-ai/claude-plugins/blob/main/plugins/cwf/skills/refactor/SKILL.md): "Based on Kent Beck's 'Tidy First?' philosophy."

## 연대기 (5단계)

1. **2024-03** 리팩토링을 AI에 위임할 수 있다는 자신감 (대용량 JS 글, 개념적 선행)
2. **2025-06~08** Kent Beck 명시 수용. 구조/행위 변경 분리를 시스템 프롬프트·커밋 규율로 코드화
3. **2025-12** 초점 전환: 개별 리팩토링 → 레거시 코드베이스의 환경 설계 (에이전트가 잘 일하는 환경)
4. **2026-01** 도구화: suggest-tidyings 플러그인 + "매일 tidying" 팀 프랙티스
5. **2026-02~** 하네스 통합: cwf:refactor의 tidy 모드로 흡수

## 해석 (사실과 분리)

- 저자의 실천은 Tidy First(구조 정돈을 먼저)라기보다 **"Tidy continuously"**에 가깝다. feature 커밋 뒤를 에이전트가 사후 스캔해 매일 정돈하는 자동화다. 원형과의 핵심 차이는 "먼저"의 순서 규율이 아니라 "매일+최근 커밋 겨냥"의 리듬 규율이다.
- tidying이 겨냥하는 목표가 독특하다: 사람의 가독성만이 아니라 **코드베이스를 에이전트에게 좋은 few-shot 환경으로 만드는 것** ("코드베이스의 품질이 높아질수록 코딩 에이전트가 더 잘 일한다").
- 링크 그래프상 코어 4편 중 3편이 out-degree 0이다. 개념이 글 간 인용으로 전파되지 않고 뉴스레터(95/96)가 유일한 허브인 방사형 구조다. 링크만 따라가는 크롤러는 이 주제를 놓친다.
- 세션말 retro를 "프로세스 tidying"으로 부르는 것은 분석자 프레임이다. 저자는 그렇게 명명하지 않았다. 코드 층 tidying 실천과 retro 루프가 공존한다고 쓰는 것이 정확하다.

## Non-claims

- "tidying flow"라는 명칭의 부재 판정은 확인한 563편 본문에 한정된다. 삭제 글, X(@stdy_log, 접근 불가), 비공개 문서는 미확인.
- 블로그가 언급한 `.claude/commands/suggest-tidyings.md` 저자 원본은 공개 Git 히스토리에 없음. 공개 원문은 2026-01-10 SKILL+guide부터.
- 계보 서술은 연대기적 전개이며 글 간 인과(앞 글이 뒷 글을 낳았다)는 상호인용 부재로 증명되지 않음.
- 강규영 wiki "Source code quality in the AI era"는 발표의 참조원으로 확인만 했고 원문 미정독.

## 출처

조사 방법: 병렬 리서치 팀 8 + 레인 4, 웨이브 3회, 563편 전문 fetch, rss.xml 543 item 발행일 파싱, GitHub API/커밋 실측. 세션 저널: axlabs `.omo/ulw-research/20260812-230822/`.
