# NOD Plan -> Design (Draft)

> Source: `docs/plan-docs/PROJECT-BRIEF.md`
> 
> 목표: 브리프에 있는 제품/기술/로드맵 정보를 기반으로, 다음 단계(Design)에서 결정해야 할 구조/컴포넌트/데이터/플로우/오픈이슈를 명확히 정의한다.

---

## 1) Design 범위

### 1.1 포함 (In Scope)

- **현재 구현 기준 아키텍처 정렬**: Supabase 중심(Auth/Postgres/RLS/Edge Functions) + Cloudflare Workers(Hono) + Web(Next.js) + Extension(React/TS)
- **핵심 도메인 설계**: Article / Summary / Embedding / Recommendation
- **핵심 플로우 설계**: 아티클 저장, 유사 아티클 추천, (Phase 2) 웹 대시보드 주요 기능(P0~P2)
- **책임 분리 원칙**: Client / API(Workers) / AI 처리(Edge Functions) / DB(Postgres+pgvector)
- **명확화 필요 항목(브리프 10.3~10.4)**를 Design 단계 산출물로 격상

### 1.2 제외 (Out of Scope)

- UI 픽셀 단위 디자인(별도 디자인 파일/디자인 시스템 문서로 관리)
- Phase 3(모바일 앱) 및 Phase 4(팀 협업) 상세 설계
- 과금/가격 정책 확정(요구사항 수준에서만 준비)

---

## 2) 시스템 아키텍처 (논리/물리)

### 2.1 논리 아키텍처

```
[Client]
  - Chrome Extension (Phase 1)
  - Web Dashboard (Phase 2)

        |
        v
[API Layer]
  - Cloudflare Workers (Hono)
    - Routing / Middleware / 정책(레이트리밋, 인증 검증, 관측)

        |
        v
[Backend Platform]
  - Supabase
    - Auth (OAuth)
    - Postgres (articles/summaries/embeddings)
    - RLS
    - Edge Functions (AI: 요약/임베딩/분석)

        |
        v
[External]
  - OpenAI (요약/임베딩)
```

### 2.2 책임 분리 (Design Decision)

- **Supabase Edge Functions**: OpenAI 호출/프롬프트/모델 버전/토큰(사용량) 계산 등 “AI 처리”의 단일 진입점
- **Cloudflare Workers (Hono)**: API 게이트웨이 역할(인증/정책/캐싱/레이트리밋/관측) + Web/Extension이 필요로 하는 공용 API 제공
- **Client**: 콘텐츠 추출/UX, 서버 호출, 결과 렌더링(저장/추천/대시보드)

---

## 3) 도메인/데이터 설계

### 3.1 핵심 엔티티

- Article
  - 식별자: `id`(UUID)
  - 소유자: `user_id` (Supabase Auth user)
  - 원문 메타: `url`, `title`, `site_name`, `author?`, `published_at?`
  - 원문 텍스트: `content`, `excerpt`
  - 파생 메타: `word_count`, `reading_time`, `saved_at`

- Summary
  - 1:1 관계: `article_id`
  - `core_summary`
  - `section_summaries` (JSON)
  - `concepts` (TEXT[])
  - `generated_at`, `model_version`

- Embedding
  - 1:1 관계: `article_id`
  - `vector` (pgvector)
  - `model`, `created_at`

### 3.2 데이터 액세스 원칙

- 모든 사용자 데이터는 **RLS로 사용자별 격리**
- 공용 검색/추천은 **사용자 스코프**를 기본값으로 유지(프라이버시 우선)

---

## 4) 핵심 플로우 설계

### 4.1 아티클 저장(Extension)

요구사항(브리프 6.1): 저장 버튼 1번으로 끝(최소 개입)

Design:
1) Content Script: Readability 기반으로 본문 추출
2) Background: 메타데이터 수집 및 서버 호출 준비
3) Edge Function:
   - 요약 생성(GPT-4o-mini)
   - 개념 추출(concepts)
   - 임베딩 생성(text-embedding-3-small)
4) DB 저장:
   - articles + summaries + embeddings 트랜잭션/일관성 전략을 정의
5) Client UI:
   - 저장 완료 상태 + 요약 미리보기

### 4.2 유사 아티클 추천(Extension)

요구사항(브리프 6.2): 새 글을 읽는 “그 순간”에 관련 과거 지식 회수

Design:
1) 현재 페이지 임베딩 생성 요청
2) pgvector cosine similarity 검색 (Top N)
3) 추천 결과(유사도 포함) 반환
4) UI: 배지 카운트 + 팝업에서 리스트/미리보기

---

## 5) Phase 2 (Web Dashboard) 설계

브리프 7의 P0~P2를 “구현 가능한 설계 단위”로 쪼갠다.

### 5.1 P0: 웹 로그인

- 동일 Supabase 프로젝트 기반 OAuth 로그인
- SSR 지원 요구(브리프 7 기술 스택에 명시)

설계 포인트:
- 세션/토큰 저장 위치(쿠키 vs 로컬스토리지)와 SSR에서의 검증 흐름을 확정

### 5.2 P0: 아티클 목록(무한 스크롤)

- 기본 정렬: `saved_at desc`
- 페이지네이션: 커서 기반(권장) vs 오프셋 기반(단순)
- 성능 목표(브리프 8): 목록 로드 ≤ 300ms

### 5.3 P0: 아티클 상세

- 요약(core/sections) + 원문 하이라이트

설계 포인트:
- 하이라이트 기준(개념/키워드/문장 매칭)의 최소 스펙을 정의

### 5.4 P0: 검색(하이브리드)

브리프 10.3: 벡터 + Full-text 하이브리드 전략 구체화 필요

설계 포인트(결정 필요):
- 쿼리 라우팅: 키워드 중심(FULL TEXT) + 의미 중심(VECTOR) 혼합
- 결과 병합: 스코어 정규화/가중치/Top-K 정책
- 인덱스/성능: pg_trgm/tsvector/pgvector 인덱싱 전략(추후 TRD로 구체화)

### 5.5 P1: 필터링

- 사이트(site_name), 날짜(saved_at/published_at), 개념(concepts) 기반

### 5.6 P1: 지식 맵

브리프 10.3: UX/인터랙션 정의 필요

설계 포인트(결정 필요):
- 노드: concept
- 엣지: co-occurrence(동일 article 내), 혹은 embedding 기반 proximity
- 인터랙션: 확대/축소, 드릴다운, 선택 시 관련 아티클 리스트

### 5.7 P1: 통계 대시보드

브리프 10.3: 보여줄 메트릭 구체화 필요

설계 포인트(후보, 결정 필요):
- 저장 빈도(일/주), 사이트 분포, 개념 분포, 평균 reading_time
- 추천 클릭률/추천 노출 수(Extension 이벤트 필요)

### 5.8 P2: 내보내기

- Markdown/Notion/Obsidian 연동
- 최소 스펙: Markdown export부터 정의

---

## 6) 비기능(품질/운영) 설계

### 6.1 성능 SLO (브리프 8)

- 저장 완료 ≤ 5s
- 유사도 분석 ≤ 1s
- 팝업 로드 ≤ 500ms
- 목록 로드 ≤ 300ms

### 6.2 프라이버시/보안

- RLS로 사용자별 데이터 격리(기본)
- 읽기 습관 데이터 최소 취급(브리프 철학)

### 6.3 모니터링/관측 (브리프 10.4)

- 서버 에러 추적(Workers/Edge Functions)
- 사용자 행동 분석(추천 클릭, 저장 성공/실패 등) 범위 정의

### 6.4 접근성(a11y) (브리프 10.4)

- 키보드 내비게이션, 스크린리더 지원을 Phase 2 Web의 기본 요구로 포함

---

## 7) Design 단계에서 확정해야 하는 오픈 이슈(결정 목록)

브리프 10.3~10.4를 그대로 “결정 항목”으로 변환한다.

1) Extension과 Web 간 세션 공유 전략
2) 지식 맵 UX/인터랙션 정의
3) 통계 대시보드 메트릭 정의
4) 검색 하이브리드(벡터 + full-text) 전략
5) Cloudflare Workers vs Supabase Edge Functions 역할 분리 기준
6) 에러 복구 전략(오프라인 -> 온라인 동기화)
7) 마이그레이션 전략(로컬 -> 클라우드)
8) 사용량 제한 정책(무료/유료 티어) 정의 범위
9) 모니터링/관측 도입 범위
10) 접근성 기준(목표 WCAG 레벨 등)

---

## 8) 산출물(Design -> 다음 단계)

이 문서 확정 후, 다음 문서/작업으로 내려간다.

- (문서) PRD/TRD/SPEC 재작성 시 반영 체크리스트로 활용
- (설계) API 계약서 초안(검색/목록/상세/추천/내보내기)
- (설계) DB 인덱스/검색 전략(TRD)
- (실행) Phase 2 P0 구현 작업 분해(티켓 단위)
