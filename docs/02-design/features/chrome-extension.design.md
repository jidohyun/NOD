# NOD Chrome Extension - Design Document

> Plan 문서: [chrome-extension.plan.md](../../01-plan/features/chrome-extension.plan.md)

---

## 1. 아키텍처 개요

### 1.1 컴포넌트 다이어그램

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Chrome Extension                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────┐    ┌──────────────┐    ┌────────────────────┐     │
│  │   Popup     │    │   Content    │    │   Background       │     │
│  │   (React)   │◄──►│   Script     │◄──►│   Service Worker   │     │
│  └──────┬──────┘    └──────┬───────┘    └─────────┬──────────┘     │
│         │                  │                       │                 │
│         └──────────────────┼───────────────────────┘                 │
│                            │                                         │
│                   chrome.runtime.sendMessage                         │
│                   chrome.storage.local                               │
│                                                                      │
└────────────────────────────┼─────────────────────────────────────────┘
                             │
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Backend API                                   │
│                   (localhost:8000 / prod URL)                        │
├─────────────────────────────────────────────────────────────────────┤
│  POST /api/articles/analyze-url                                      │
│  GET  /api/articles/recent                                           │
│  GET  /api/articles/similar?url={url}                                │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 디렉토리 구조 (목표)

```
apps/extension/
├── manifest.json
├── package.json
├── vite.config.ts
├── tailwind.config.js          # NEW: Tailwind 설정
├── tsconfig.json
│
├── src/
│   ├── popup/                   # Popup UI
│   │   ├── index.html
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── components/          # NEW: UI 컴포넌트
│   │   │   ├── SaveButton.tsx
│   │   │   ├── ArticlePreview.tsx
│   │   │   ├── RecentArticles.tsx
│   │   │   ├── LoginPrompt.tsx
│   │   │   ├── StatusMessage.tsx
│   │   │   └── Loading.tsx
│   │   ├── hooks/               # NEW: 커스텀 훅
│   │   │   ├── useAuth.ts
│   │   │   ├── useArticle.ts
│   │   │   └── useSaveArticle.ts
│   │   └── styles/
│   │       └── globals.css
│   │
│   ├── content/                 # Content Script
│   │   ├── content-script.ts
│   │   └── extractor.ts         # NEW: 콘텐츠 추출 로직 분리
│   │
│   ├── background/              # Service Worker
│   │   ├── service-worker.ts
│   │   └── handlers/            # NEW: 메시지 핸들러 분리
│   │       ├── auth.ts
│   │       └── badge.ts
│   │
│   ├── lib/                     # 공유 라이브러리
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   ├── storage.ts           # NEW: 스토리지 추상화
│   │   └── constants.ts         # NEW: 상수 정의
│   │
│   └── types/                   # NEW: 타입 정의
│       ├── article.ts
│       ├── api.ts
│       └── chrome.ts
│
├── public/
│   └── icons/
│       ├── icon16.png
│       ├── icon48.png
│       └── icon128.png
│
└── dist/                        # 빌드 결과물
```

---

## 2. 컴포넌트 상세 설계

### 2.1 Popup UI 컴포넌트

#### App.tsx (메인 컨테이너)

```typescript
// 상태 흐름
type AppState =
  | "loading"        // 초기 로딩
  | "not-logged-in"  // 미인증
  | "ready"          // 저장 가능
  | "saving"         // 저장 중
  | "success"        // 저장 완료
  | "error";         // 에러 발생

// 렌더링 로직
switch (state) {
  case "loading":      return <Loading />;
  case "not-logged-in": return <LoginPrompt />;
  case "ready":        return <SaveView article={article} onSave={handleSave} />;
  case "saving":       return <Loading message="Saving..." />;
  case "success":      return <SuccessView articleId={articleId} />;
  case "error":        return <ErrorView error={error} onRetry={handleRetry} />;
}
```

#### 컴포넌트 계층

```
App
├── Header (로고 + 상태)
├── MainContent
│   ├── LoginPrompt
│   │   └── LoginButton
│   ├── SaveView
│   │   ├── ArticlePreview
│   │   │   ├── Title
│   │   │   └── Excerpt
│   │   └── SaveButton
│   ├── SuccessView
│   │   ├── SuccessIcon
│   │   ├── Message
│   │   └── ViewInDashboardButton
│   └── ErrorView
│       ├── ErrorMessage
│       └── RetryButton
└── Footer (optional: 설정 링크)
```

### 2.2 Content Script

#### extractor.ts - 콘텐츠 추출기

```typescript
interface ExtractedContent {
  title: string;
  content: string;
  excerpt: string;      // 첫 200자
  url: string;
  siteName: string;     // meta og:site_name
  author?: string;      // meta author
  publishedAt?: string; // meta article:published_time
  wordCount: number;
  readingTime: number;  // wordCount / 200 (분)
}

// 추출 전략 (우선순위)
const extractionStrategies = [
  readabilityExtraction,  // @mozilla/readability
  metaTagExtraction,      // Open Graph, Twitter Cards
  heuristicExtraction,    // DOM 휴리스틱
];
```

#### 메시지 프로토콜

```typescript
// Popup → Content Script
type ContentScriptRequest =
  | { type: "EXTRACT_CONTENT" }
  | { type: "CHECK_ARTICLE" };  // 아티클 페이지인지 확인

// Content Script → Popup
type ContentScriptResponse =
  | { success: true; data: ExtractedContent }
  | { success: false; error: string };
```

### 2.3 Background Service Worker

#### 역할 분리

| 모듈 | 책임 |
|------|------|
| `service-worker.ts` | 메시지 라우팅, 이벤트 리스너 등록 |
| `handlers/auth.ts` | 토큰 관리, 인증 상태 |
| `handlers/badge.ts` | Badge 텍스트/색상 업데이트 |

#### 메시지 핸들러

```typescript
// 메시지 타입
type BackgroundMessage =
  | { type: "SET_TOKEN"; token: string }
  | { type: "CLEAR_TOKEN" }
  | { type: "GET_AUTH_STATE" }
  | { type: "UPDATE_BADGE"; count?: number };

// 핸들러 맵
const handlers: Record<string, MessageHandler> = {
  SET_TOKEN: handleSetToken,
  CLEAR_TOKEN: handleClearToken,
  GET_AUTH_STATE: handleGetAuthState,
  UPDATE_BADGE: handleUpdateBadge,
};
```

---

## 3. 데이터 흐름

### 3.1 저장 플로우 (Sequence)

```
User          Popup         Content       Background      API
 │             │             │               │             │
 │  Click      │             │               │             │
 ├────────────►│             │               │             │
 │             │ EXTRACT     │               │             │
 │             ├────────────►│               │             │
 │             │             │ Parse DOM     │             │
 │             │             │◄──────────────│             │
 │             │◄────────────┤ content       │             │
 │             │             │               │             │
 │             │ POST /articles/analyze      │             │
 │             ├─────────────────────────────────────────►│
 │             │                             │             │ AI 요약
 │             │                             │             │ 임베딩
 │             │◄─────────────────────────────────────────┤ {id}
 │  Success    │             │               │             │
 │◄────────────┤             │               │             │
```

### 3.2 인증 플로우

```
User          Popup         Web App        Background
 │             │               │               │
 │  Not Auth   │               │               │
 │◄────────────┤               │               │
 │             │               │               │
 │  Click Login│               │               │
 ├────────────►│               │               │
 │             │ Open Tab      │               │
 │             ├──────────────►│               │
 │             │               │ Google OAuth  │
 │             │               │◄─────────────►│
 │             │               │               │
 │             │               │ postMessage   │
 │             │               ├──────────────►│
 │             │               │               │ SET_TOKEN
 │             │               │               ├──────────┐
 │             │               │               │ storage  │
 │             │               │               │◄─────────┘
 │             │               │               │
 │             │ Auth Ready    │               │
 │◄────────────┤◄──────────────┴───────────────┤
```

### 3.3 상태 관리

```typescript
// 로컬 스토리지 스키마
interface ExtensionStorage {
  // 인증
  nod_auth_token: string | null;
  nod_token_expires: number | null;

  // 캐시
  nod_recent_articles: ArticleSummary[];  // 최근 5개
  nod_settings: ExtensionSettings;

  // 오프라인 큐 (P1)
  nod_pending_sync: PendingArticle[];
}

// 설정
interface ExtensionSettings {
  autoExtract: boolean;      // 팝업 열 때 자동 추출
  showNotifications: boolean; // 저장 완료 알림
  theme: "light" | "dark" | "system";
}
```

---

## 4. API 인터페이스

### 4.1 Backend API 명세

#### POST /api/articles/analyze-url

```typescript
// Request
interface AnalyzeUrlRequest {
  url: string;
  title: string;
  content: string;
  excerpt?: string;
  siteName?: string;
  author?: string;
  publishedAt?: string;
  wordCount?: number;
  source: "extension" | "web" | "api";
}

// Response
interface AnalyzeUrlResponse {
  id: string;
  title: string;
  status: "processing" | "completed" | "failed";
  summary?: {
    coreSummary: string;
    concepts: string[];
    keyPoints?: string[];
  };
  createdAt: string;
}

// Errors
// 401: Unauthorized - 토큰 만료/무효
// 400: Bad Request - URL/content 누락
// 429: Too Many Requests - Rate limit
// 500: Internal Server Error
```

#### GET /api/articles/recent (P1)

```typescript
// Response
interface RecentArticlesResponse {
  articles: ArticleSummary[];
  total: number;
}

interface ArticleSummary {
  id: string;
  title: string;
  url: string;
  siteName: string;
  savedAt: string;
  summary?: string;  // 첫 100자
}
```

#### GET /api/articles/similar (P1)

```typescript
// Query: ?url={currentPageUrl}
// Response
interface SimilarArticlesResponse {
  articles: Array<{
    id: string;
    title: string;
    similarity: number;  // 0-100
    savedAt: string;
  }>;
}
```

---

## 5. UI/UX 설계

### 5.1 팝업 레이아웃

```
┌──────────────────────────────────┐
│  [NOD Logo]  Article Analyzer    │  Header (40px)
├──────────────────────────────────┤
│                                  │
│  ┌────────────────────────────┐  │
│  │  📄 Article Title Here     │  │  Preview Card
│  │  ────────────────────────  │  │  (100px)
│  │  First 100 characters of   │  │
│  │  the article excerpt...    │  │
│  └────────────────────────────┘  │
│                                  │
│  ┌────────────────────────────┐  │
│  │     Save & Analyze         │  │  Action Button
│  └────────────────────────────┘  │  (44px)
│                                  │
│  📊 tech.blog.com · 5 min read   │  Meta info (24px)
│                                  │
└──────────────────────────────────┘

Width: 360px
Min Height: 200px
Max Height: 500px
```

### 5.2 상태별 UI

| 상태 | UI |
|------|-----|
| Loading | 스피너 + "Loading..." |
| Not Logged In | 로그인 버튼 + 안내 메시지 |
| Ready | 아티클 미리보기 + 저장 버튼 |
| Saving | 비활성 버튼 + 스피너 |
| Success | 체크 아이콘 + "Saved!" + 대시보드 링크 |
| Error | 에러 메시지 + 재시도 버튼 |

### 5.3 디자인 토큰

```css
/* Colors */
--color-primary: #0066ff;
--color-primary-hover: #0052cc;
--color-success: #16a34a;
--color-error: #dc2626;
--color-text: #1a1a1a;
--color-text-secondary: #666666;
--color-border: #e5e5e5;
--color-background: #ffffff;
--color-background-secondary: #f5f5f5;

/* Typography */
--font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-size-sm: 12px;
--font-size-base: 14px;
--font-size-lg: 16px;

/* Spacing */
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 12px;
--spacing-lg: 16px;
--spacing-xl: 24px;

/* Border Radius */
--radius-sm: 4px;
--radius-md: 6px;
--radius-lg: 8px;
```

---

## 6. 에러 핸들링

### 6.1 에러 유형 및 대응

| 에러 | 원인 | 사용자 메시지 | 대응 |
|------|------|--------------|------|
| `AUTH_EXPIRED` | 토큰 만료 | "세션이 만료되었습니다" | 재로그인 유도 |
| `NETWORK_ERROR` | 네트워크 끊김 | "연결할 수 없습니다" | 재시도 버튼 |
| `EXTRACT_FAILED` | DOM 파싱 실패 | "콘텐츠를 추출할 수 없습니다" | 수동 입력 옵션 |
| `RATE_LIMITED` | API 제한 | "잠시 후 다시 시도해주세요" | 쿨다운 표시 |
| `SERVER_ERROR` | 서버 오류 | "서버 오류가 발생했습니다" | 재시도 + 로그 |

### 6.2 에러 처리 코드

```typescript
// lib/errors.ts
export class ExtensionError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = "ExtensionError";
  }
}

export type ErrorCode =
  | "AUTH_EXPIRED"
  | "NETWORK_ERROR"
  | "EXTRACT_FAILED"
  | "RATE_LIMITED"
  | "SERVER_ERROR"
  | "UNKNOWN";

// API 호출 래퍼
export async function apiCall<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof Response) {
      if (error.status === 401) {
        throw new ExtensionError("AUTH_EXPIRED", "인증이 만료되었습니다");
      }
      if (error.status === 429) {
        throw new ExtensionError("RATE_LIMITED", "요청 한도 초과");
      }
    }
    if (!navigator.onLine) {
      throw new ExtensionError("NETWORK_ERROR", "네트워크 연결 없음");
    }
    throw new ExtensionError("UNKNOWN", "알 수 없는 오류");
  }
}
```

---

## 7. 테스트 전략

### 7.1 테스트 범위

| 레이어 | 테스트 유형 | 도구 |
|--------|-----------|------|
| UI 컴포넌트 | Unit + Snapshot | Vitest + Testing Library |
| 훅/유틸 | Unit | Vitest |
| Content Script | Integration | Vitest + jsdom |
| E2E | User flow | Playwright (계획) |

### 7.2 핵심 테스트 케이스

```typescript
// popup/App.test.tsx
describe("App", () => {
  it("미인증 시 로그인 프롬프트 표시");
  it("인증 시 저장 버튼 표시");
  it("저장 클릭 시 로딩 상태로 전환");
  it("저장 성공 시 성공 메시지 표시");
  it("저장 실패 시 에러 메시지 + 재시도 버튼 표시");
});

// content/extractor.test.ts
describe("Extractor", () => {
  it("article 태그에서 본문 추출");
  it("main 태그에서 본문 추출");
  it("광고/네비게이션 제거");
  it("50,000자 초과 시 잘라내기");
  it("빈 페이지 에러 처리");
});
```

---

## 8. 구현 순서

### Phase 1: MVP 완성 (우선순위 순)

```
1. [ ] 프로젝트 설정
   - [ ] Tailwind CSS 설치 및 설정
   - [ ] 타입 정의 파일 생성 (types/)
   - [ ] 상수 파일 생성 (lib/constants.ts)

2. [ ] Content Script 개선
   - [ ] extractor.ts 분리 및 개선
   - [ ] Readability.js 실제 통합
   - [ ] 메타데이터 추출 (OG, author, date)

3. [ ] Popup UI 리팩토링
   - [ ] 컴포넌트 분리 (SaveButton, ArticlePreview 등)
   - [ ] Tailwind 스타일 적용
   - [ ] 상태별 UI 완성

4. [ ] 에러 핸들링
   - [ ] ExtensionError 클래스
   - [ ] API 호출 래퍼
   - [ ] 사용자 친화적 에러 메시지

5. [ ] 테스트
   - [ ] 핵심 컴포넌트 테스트
   - [ ] Extractor 테스트
   - [ ] 수동 QA
```

### Phase 2: 향상된 경험

```
6. [ ] 최근 저장 목록 (RecentArticles)
7. [ ] 유사 아티클 Badge
8. [ ] 단축키 지원 (Ctrl+Shift+S)
9. [ ] 컨텍스트 메뉴
10. [ ] 오프라인 저장 큐
```

---

## 9. 의존성 패키지

### 추가 필요 패키지

```json
{
  "dependencies": {
    "@mozilla/readability": "^0.5.0",  // 이미 있음
    "clsx": "^2.1.0"                    // 조건부 클래스
  },
  "devDependencies": {
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "@testing-library/react": "^14.0.0",
    "vitest": "^1.0.0",
    "jsdom": "^24.0.0"
  }
}
```

---

## 10. 보안 체크리스트

- [ ] 토큰은 `chrome.storage.local`에만 저장
- [ ] API 호출 시 HTTPS 강제
- [ ] Content Script에서 `textContent`만 추출 (XSS 방지)
- [ ] 사용자 입력 검증 (URL 유효성)
- [ ] `externally_connectable`은 신뢰 도메인만 허용
- [ ] CSP (Content Security Policy) 적용

---

*작성일: 2026-02-05*
*상태: Design 완료 → Do (구현) 진행 필요*
*참조: [Plan 문서](../../01-plan/features/chrome-extension.plan.md)*
