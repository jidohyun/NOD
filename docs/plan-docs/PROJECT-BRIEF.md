# NOD 프로젝트 브리핑 (에이전트용)

> 이 문서는 AI 에이전트가 NOD 프로젝트의 새로운 PRD를 작성하기 위한 컨텍스트 문서입니다.
> 기존 PRD v2.0 / TRD v2.0 / SPEC v2.0 / 실제 구현물을 종합 분석하여 작성되었습니다.

---

## 1. 프로젝트 정체성

### 이름과 의미

- **NOD** = "고개를 끄덕이다"
- 과거에 읽었던 기술 지식을 다시 만났을 때 "아, 맞다!" 하고 떠올리는 순간을 만들어주는 서비스

### 한 줄 정의

**읽은 기술 아티클을 AI가 자동 분석하고, 유사한 글을 다시 만났을 때 과거 지식을 자동 회수해주는 플랫폼**

### 핵심 철학 (PRD에서 추출)

| 원칙 | 설명 |
|------|------|
| 최소 개입 | 사용자에게 정리/태깅/분류를 요구하지 않음. 저장 버튼 한 번이면 끝 |
| 자동 연결 | AI가 개념 단위로 아티클을 분석, 지식 간 연결고리를 자동 생성 |
| 적시 회수 | 새 아티클을 읽을 때, 관련 과거 지식을 "그 순간"에 제공 |
| 프라이버시 우선 | 사용자의 읽기 습관 데이터는 최소한으로 취급 |

---

## 2. 해결하는 문제

### 타겟 사용자

- **주니어 개발자**: 매일 기술 블로그 2-3개 읽지만 북마크만 쌓아두는 사람
- **취업준비생**: CS 기초~프레임워크까지 광범위 학습하지만 체계적 정리가 안 되는 사람
- **시니어 개발자**: 깊이 있는 기술 문서를 읽지만 팀원 공유 시 과거 글을 못 찾는 사람

### 핵심 Pain Point → Solution

| 문제 | NOD의 해결 |
|------|-----------|
| 읽은 글을 북마크만 해두고 다시 안 봄 | 저장 버튼 1번 → AI 자동 분석/요약 |
| 비슷한 내용을 다시 만나도 이전 글이 기억 안 남 | 임베딩 기반 유사 아티클 자동 매칭 |
| 정리에 시간/에너지가 많이 듦 | 정리 강요 없이 자동화된 지식 회수 |
| 과거 지식을 활용 못하고 처음부터 다시 읽음 | 관련 아티클 요약을 즉시 표시 |

### 시장 포지셔닝

**"정리 필요성 낮음 + 자동 회수"** 영역. Pocket(수동/정리 불필요), Readwise(능동적 하이라이트 필요), Notion(정리 도구 필요)과 차별화.

---

## 3. 현재 상태 (2026년 1월 기준)

### Phase 로드맵과 실제 진행

| Phase | 내용 | 상태 |
|-------|------|------|
| **Phase 1** | Chrome Extension MVP | **완료** |
| **Phase 2** | 웹 대시보드 (NOD Web) | **초기 구현 중** (Next.js 프로젝트 존재) |
| Phase 3 | 모바일 앱 (React Native + Expo) | 예정 |
| Phase 4 | 협업 및 팀 기능 | 예정 |

### Phase 1 완료 기능 (Chrome Extension)

- Google OAuth 로그인 (Supabase Auth)
- 원클릭 아티클 저장 + AI 요약 (GPT-4o-mini)
- 임베딩 기반 유사 아티클 추천 (text-embedding-3-small, Cosine Similarity)
- 토큰 기반 사용량 관리
- Supabase 클라우드 저장 (RLS 적용)
- 저장 아티클 목록/상세/삭제

---

## 4. 기술 아키텍처 현황

### 4.1 문서 vs 실제의 차이 (중요)

기존 PRD/TRD 문서에는 **"로컬 우선(IndexedDB) + 직접 OpenAI API 호출"**로 설계되었으나, 실제 구현은 다음과 같이 **서버 중심 아키텍처로 전환**됨:

| 영역 | 문서상 설계 | 실제 구현 |
|------|-----------|----------|
| 인증 | 없음 (로컬 전용) | **Supabase Auth (Google OAuth)** |
| 데이터 저장 | IndexedDB (로컬) | **Supabase PostgreSQL (클라우드)** |
| AI 호출 | Extension → OpenAI 직접 | **Supabase Edge Functions 경유** |
| API 키 관리 | 사용자가 직접 입력 | **서버 사이드 관리 (Edge Functions)** |
| API 서버 | 없음 | **Cloudflare Workers (Hono) 존재** |

### 4.2 실제 시스템 구성

```
┌─────────────────────────────────────────────────────────────┐
│  클라이언트 레이어                                            │
│                                                              │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │ Chrome Extension │  │  NOD Web        │                   │
│  │ (Phase 1 완료)   │  │  (Phase 2 진행) │                   │
│  │ React + TS       │  │  Next.js 14     │                   │
│  └────────┬─────────┘  └────────┬────────┘                   │
│           └────────────┬────────┘                             │
│                        │                                      │
├────────────────────────┼──────────────────────────────────────┤
│  백엔드 레이어         │                                      │
│                        ▼                                      │
│  ┌─────────────────────────────────────────┐                 │
│  │           Supabase Cloud                 │                 │
│  │  • Auth (Google OAuth, JWT)              │                 │
│  │  • PostgreSQL (articles, summaries, etc) │                 │
│  │  • Edge Functions (AI 처리)              │                 │
│  │  • RLS (Row Level Security)              │                 │
│  └─────────────────────┬───────────────────┘                 │
│                        │                                      │
│  ┌─────────────────────┼───────────────────┐                 │
│  │  Cloudflare Workers (Hono)              │                 │
│  │  • API 라우팅                            │                 │
│  │  • 미들웨어                              │                 │
│  └─────────────────────┬───────────────────┘                 │
│                        │                                      │
├────────────────────────┼──────────────────────────────────────┤
│  외부 서비스           │                                      │
│                        ▼                                      │
│  ┌─────────────────────────────┐                             │
│  │  OpenAI API                  │                             │
│  │  • GPT-4o-mini (요약)        │                             │
│  │  • text-embedding-3-small    │                             │
│  └─────────────────────────────┘                             │
└──────────────────────────────────────────────────────────────┘
```

### 4.3 기술 스택 정리

| 영역 | 기술 | 비고 |
|------|------|------|
| **Extension** | TypeScript, React 18, Zustand, Tailwind CSS, Vite + CRXJS | Phase 1 완료 |
| **Web** | Next.js 14 (App Router), TypeScript, Tailwind CSS | Phase 2 진행 |
| **API** | Cloudflare Workers, Hono, TypeScript | 존재 |
| **Backend** | Supabase (Auth, PostgreSQL, Edge Functions, RLS) | 운영 중 |
| **AI** | OpenAI GPT-4o-mini, text-embedding-3-small | Edge Functions 경유 |
| **배포** | Vercel (Web), Cloudflare (API) | - |

### 4.4 프로젝트 디렉토리 구조

```
NOD-backup/
├── knowledge-recall-extension/   # Phase 1: Chrome Extension (완료)
│   ├── src/
│   │   ├── popup/                # Popup UI (React)
│   │   ├── content/              # Content Script (본문 추출)
│   │   ├── background/           # Background Service Worker
│   │   ├── services/             # OpenAI, Storage, Similarity
│   │   ├── store/                # Zustand 상태 관리
│   │   ├── types/                # TypeScript 타입
│   │   └── utils/                # 유틸리티
│   └── manifest.json
│
├── web/                          # Phase 2: Web Dashboard (진행 중)
│   ├── src/
│   │   ├── app/                  # Next.js App Router
│   │   ├── components/           # UI 컴포넌트
│   │   ├── hooks/                # Custom Hooks
│   │   ├── lib/                  # 유틸리티 (Supabase 등)
│   │   └── types/                # TypeScript 타입
│   └── design-system/
│
├── api/                          # API 서버 (Cloudflare Workers)
│   ├── src/
│   │   ├── routes/               # API 라우트
│   │   ├── services/             # 비즈니스 로직
│   │   ├── middleware/           # 미들웨어
│   │   ├── lib/                  # 유틸리티
│   │   └── types/                # TypeScript 타입
│   └── wrangler.toml
│
├── docs/                         # 문서
│   ├── PRD.md                    # 제품 요구사항 정의서
│   ├── TRD.md                    # 기술 요구사항 정의서
│   ├── SPEC.md                   # 기능 명세서
│   ├── DESIGN.md                 # 디자인 문서
│   └── AUTH-TOKEN-REFRESH.md     # 인증 토큰 갱신 문서
│
└── pencil-shadcn.pen             # UI 디자인 파일 (Pencil)
```

---

## 5. 핵심 데이터 모델

### Supabase 테이블 (실제 운영)

```
articles
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── url (TEXT)
├── title (TEXT)
├── content (TEXT)
├── excerpt (TEXT)
├── site_name (TEXT)
├── author (TEXT, nullable)
├── published_at (TIMESTAMPTZ, nullable)
├── saved_at (TIMESTAMPTZ)
├── word_count (INT)
└── reading_time (INT)

summaries
├── article_id (UUID, PK/FK → articles)
├── core_summary (TEXT)
├── section_summaries (JSONB)
├── concepts (TEXT[])
├── generated_at (TIMESTAMPTZ)
└── model_version (TEXT)

embeddings
├── article_id (UUID, PK/FK → articles)
├── vector (vector(1536))   -- pgvector
├── model (TEXT)
└── created_at (TIMESTAMPTZ)
```

### 핵심 TypeScript 타입

```typescript
interface Article {
  id: string
  url: string
  title: string
  content: string
  excerpt: string
  siteName: string
  author?: string
  publishedAt?: string
  savedAt: string
  wordCount: number
  readingTime: number
}

interface Summary {
  articleId: string
  coreSummary: string
  sectionSummaries: { heading: string; summary: string }[]
  concepts: string[]
  generatedAt: string
  modelVersion: string
}

interface Recommendation {
  article: Article
  summary: Summary
  similarity: number  // 0-100 (%)
}
```

---

## 6. 핵심 플로우

### 6.1 아티클 저장

```
사용자: 익스텐션 저장 버튼 클릭
  → Content Script: 현재 페이지 DOM 파싱 (Readability.js)
  → Background Worker: 메타데이터 + 본문 수집
  → Supabase Edge Function: GPT-4o-mini 요약 + 개념 추출
  → Supabase Edge Function: text-embedding-3-small 벡터 생성
  → Supabase PostgreSQL: article + summary + embedding 저장
  → Popup UI: 저장 완료 + 요약 미리보기 표시
```

### 6.2 유사 아티클 추천

```
사용자: 새로운 기술 아티클 페이지 방문
  → Content Script: 본문 감지 및 추출
  → Background Worker: 현재 페이지 임베딩 생성 요청
  → Supabase: pgvector Cosine Similarity 검색
  → 상위 3개 유사 아티클 반환
  → 익스텐션 아이콘 배지에 숫자 표시
  → 팝업 열면 유사 아티클 목록 + 요약 미리보기
```

---

## 7. Phase 2 계획 (웹 대시보드)

### 목표 기능

| 우선순위 | 기능 | 설명 |
|:--------:|------|------|
| P0 | 웹 로그인 | Extension과 동일 Google OAuth (Supabase Auth) |
| P0 | 아티클 목록 | 무한 스크롤, 전체 조회 |
| P0 | 아티클 상세 | 요약 + 원문 하이라이트 뷰 |
| P0 | 검색 | 제목/본문/개념 통합 검색 (Full-text + 벡터) |
| P1 | 필터링 | 사이트, 날짜, 개념별 필터 |
| P1 | 지식 맵 | 개념 클러스터 기반 그래프 시각화 (D3.js / React Flow) |
| P1 | 통계 대시보드 | 읽기 패턴, 관심 주제 분석 |
| P2 | 내보내기 | Markdown, Notion, Obsidian 연동 |

### 기술 스택 (확정)

- Next.js 14 (App Router)
- Tailwind CSS + shadcn/ui
- TanStack Query (서버 상태)
- Supabase Auth (SSR 지원)
- Vercel 배포

---

## 8. 성능 기준

| 지표 | 목표값 |
|------|--------|
| 아티클 저장 완료 | ≤ 5초 |
| 유사도 분석 | ≤ 1초 |
| 팝업 로드 | ≤ 500ms |
| 아티클 목록 로드 | ≤ 300ms |
| Extension 메모리 | ≤ 50MB |

---

## 9. 비즈니스 KPI

| 지표 | 목표 (출시 3개월 후) |
|------|---------------------|
| DAU | 1,000명 |
| 사용자당 평균 저장 아티클 | 50개 |
| 유사 아티클 추천 클릭률 | 30% |
| 7일 재방문율 | 60% |

---

## 10. 새 PRD 작성 시 반영해야 할 포인트

### 10.1 문서와 실제의 괴리 해소

- 기존 PRD는 **로컬 우선 설계**였으나, 실제는 **Supabase 클라우드 중심**으로 전환됨
- 새 PRD에서는 **실제 아키텍처(Supabase + Cloudflare Workers)를 기준**으로 재작성 필요
- API 키 관리 방식이 "사용자 직접 입력" → "서버 사이드 관리 + 토큰 기반 사용량"으로 변경됨

### 10.2 Phase 1에서 추가된 기능

- Google OAuth 로그인 (원래 PRD에는 인증 없음)
- 토큰 기반 사용량 관리 시스템
- Supabase RLS를 통한 사용자별 데이터 격리
- 인증 토큰 자동 갱신 (별도 문서 존재: AUTH-TOKEN-REFRESH.md)

### 10.3 Phase 2에서 명확화 필요한 사항

- Extension과 Web 간 **세션 공유 전략** (동일 Supabase 프로젝트이므로 토큰 기반)
- **지식 맵 시각화**의 구체적 UX/인터랙션 정의
- **통계 대시보드**에서 보여줄 메트릭 구체화
- 검색 시 **벡터 검색 + Full-text 검색 하이브리드** 전략 구체화
- Cloudflare Workers API 서버의 역할과 Supabase Edge Functions의 역할 분리 기준

### 10.4 누락된 영역

- **에러 복구 전략**: 오프라인 → 온라인 전환 시 동기화
- **마이그레이션 전략**: 기존 로컬 데이터 → 클라우드 이관
- **사용량 제한 정책**: 무료/유료 티어 구분 기준
- **모니터링**: 서버 사이드 에러 추적, 사용자 행동 분석
- **접근성(a11y)**: 키보드 내비게이션, 스크린리더 지원

---

## 11. 경쟁 서비스 포지셔닝 요약

```
정리 필요 ↑
           │  Notion / Obsidian / Roam
           │
수동 ──────┼────── 자동
           │
           │  Pocket / Raindrop    ★ NOD
           │                       Readwise
정리 불필요 ↓
```

NOD의 독자적 위치: **"정리 없이 + 자동으로 과거 지식을 회수"**

---

*이 문서는 2026-02-03 기준으로 PRD v2.0, TRD v2.0, SPEC v2.0, 실제 소스코드를 종합 분석하여 작성되었습니다.*
