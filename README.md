# NOD

**리서치 정보 자산화 엔진 — 요약이 아니라 지식 diff.**

정보 전달형 테크 아티클을 읽고, "이 글이 내가 알던 것을 어떻게 바꾸는가"를 구조화해 남긴다:
claim(검증 가능한 주장) → Evidence(출처 인용 앵커) → Relation(기존 지식과의 관계: new / supports / conflicts / qualifies).

2026년에 아티클 요약은 커머디티다. NOD의 실체는 요약 품질이 아니라 **자산 스키마** — 읽기가 저장이 아니라 복리로 쌓이는 변환이 되게 하는 것.

## 현재 상태 (2026-08-09)

**A0 완료** — 코드 없이 자산 5개를 손으로 채워 스키마를 실전 검증했다. 판정: 스키마 생존, v1.1 결정 5건 대기. 다음 단계는 **A: CLI 클리퍼 파이프라인** 구현.

```
A0 수동 검증(완료) → A: CLI 파이프라인(다음) → B: 브라우저 확장+diff 뷰(별도 설계 필요) → C: 발행
```

## 처음 왔다면 — 읽기 순서

| 순서 | 문서 | 내용 |
|---|---|---|
| 1 | [docs/design.md](docs/design.md) | 승인된 설계 문서: 문제 정의, 스키마, 접근 A/B/C, eng-review 반영 사항, 성공 기준 |
| 2 | [docs/claim-guidelines.md](docs/claim-guidelines.md) | claim 작성 기준 v1 — 연구 근거 기반 5규칙. 자산 작성과 LLM 프롬프트의 원천 |
| 3 | [docs/a0-retrospective.md](docs/a0-retrospective.md) | A0 검증 회고 — **v1.1 결정 대기 5건** (스키마 수정 전 필독) |
| 4 | [templates/asset.md](templates/asset.md) + [vault/](vault/) | 자산 템플릿과 실전 자산 6개 (스키마의 살아있는 예시) |

에이전트용 작업 규칙은 [CLAUDE.md](CLAUDE.md)에 있다.

## 디렉토리

- `docs/` — 설계·기준·회고 (진실 원천)
- `templates/` — 자산 스키마 템플릿
- `vault/` — 자산 저장소. 파일명 = URL 정규화 슬러그

## 복구된 기존 구현

문서판과 함께 기존 NOD 제품 구현도 보존한다. 핵심 사용자 흐름은 다음과 같다.

1. Chrome Extension이 웹 문서·PDF·GitHub·YouTube·Reddit 콘텐츠를 캡처한다.
2. API가 아티클을 저장하고 콘텐츠 유형별 분석 경로를 선택한다.
3. Worker가 AI 요약·핵심 개념·key points와 임베딩을 비동기로 생성한다.
4. Web 앱이 저장된 지식, semantic search, concept graph와 공유 화면을 제공한다.

```
apps/
├── web/          # Next.js — 대시보드, 검색, 지식 그래프
├── api/          # FastAPI — 인증, 아티클 저장, 분석 API
├── worker/       # FastAPI — 비동기 분석·임베딩 작업
├── extension/    # Chrome Extension — 콘텐츠 캡처
├── mobile/       # Flutter 앱
└── infra/        # Terraform — GCP 배포
```

### 구현 스택

- Frontend: Next.js, TypeScript, Tailwind CSS, Radix UI, Cytoscape
- Backend: FastAPI, SQLAlchemy, PostgreSQL, pgvector, Redis
- AI: Google Gemini, OpenAI
- Auth/Billing: Supabase, Paddle
- Infra/Observability: GCP Cloud Run, Terraform, OpenTelemetry, Sentry, Langfuse

기존 구현은 요약 중심으로 동작하지만, 이 코드를 버리지 않고 새 `claim / evidence / relation` 자산 흐름의 실행 기반으로 피벗한다. 요약·분류·임베딩·그래프·공유 경계는 보존하고, 결과 스키마와 사용자 경험부터 단계적으로 개선한다.

## 개발 진입점

필수 도구는 [Bun](https://bun.sh), Python 3.12+와 [uv](https://docs.astral.sh/uv/), PostgreSQL/pgvector, Redis다.

```bash
# Web
cd apps/web && bun install && bun run dev

# API
cd apps/api && uv sync && poe dev

# Worker
cd apps/worker && uv sync && poe dev

# Chrome Extension
cd apps/extension && bun install && bun run dev
```

전체 작업은 루트 `mise.toml`과 각 앱의 `AGENTS.md`를 따른다. 구현을 변경할 때는 해당 앱의 lint, typecheck, test를 먼저 확인한다.

## 라이선스

[MIT](LICENSE)
