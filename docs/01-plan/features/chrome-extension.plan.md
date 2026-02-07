# NOD Chrome Extension Plan

> 블로그/아티클을 읽다가 원클릭으로 저장하고 AI가 자동 요약하여 지식 자산화하는 Chrome Extension

---

## 1. 프로젝트 개요

### 1.1 배경 및 목적

| 항목 | 내용 |
|------|------|
| **프로젝트명** | NOD Chrome Extension |
| **목표** | 사용자가 기술 아티클/블로그를 읽다가 "딸깍" 한 번으로 저장 → AI 자동 요약 → 지식 자산화 |
| **핵심 가치** | 정리 노력 없이 자동으로 지식을 축적하고, 나중에 유사한 글을 읽을 때 과거 지식을 회수 |

### 1.2 문제 정의

| Pain Point | 현재 상황 | NOD 해결책 |
|------------|----------|-----------|
| 북마크만 쌓임 | 읽은 글을 북마크하고 다시 안 봄 | 저장 즉시 AI 요약 → 핵심만 빠르게 복습 가능 |
| 기억 안 남 | 비슷한 내용 다시 만나도 이전 글 기억 안 남 | 임베딩 기반 유사도 분석 → 관련 과거 글 자동 알림 |
| 정리 시간 부족 | 정리에 시간/에너지가 많이 듦 | 사용자 개입 없이 AI가 자동 분석/태깅 |

### 1.3 타겟 사용자

| 페르소나 | 특징 | 니즈 |
|----------|------|------|
| 주니어 개발자 | 매일 기술 블로그 2-3개 읽음 | 체계적 지식 축적 |
| 취업 준비생 | CS 기초~프레임워크 광범위 학습 | 효율적 복습 시스템 |
| 시니어 개발자 | 깊이 있는 기술 문서 읽음 | 팀 공유 시 빠른 검색 |

---

## 2. 핵심 기능 (Features)

### 2.1 P0 (Must Have) - MVP

| ID | 기능 | 설명 | 사용자 스토리 |
|----|------|------|--------------|
| F-001 | 원클릭 저장 | Extension 팝업에서 버튼 클릭 → 현재 페이지 저장 | "읽고 있는 글을 버튼 하나로 저장하고 싶어" |
| F-002 | 콘텐츠 추출 | Readability로 본문 추출 (광고/네비게이션 제거) | "글 본문만 깔끔하게 저장하고 싶어" |
| F-003 | AI 요약 | GPT-4o-mini로 핵심 요약 + 개념 태그 자동 추출 | "긴 글의 핵심만 빠르게 보고 싶어" |
| F-004 | Google OAuth | 웹앱과 동일한 인증으로 세션 공유 | "한 번 로그인하면 어디서든 내 지식에 접근하고 싶어" |
| F-005 | 저장 목록 보기 | 팝업에서 최근 저장한 아티클 목록 확인 | "방금 저장한 글들을 바로 확인하고 싶어" |

### 2.2 P1 (Should Have) - 향상된 경험

| ID | 기능 | 설명 | 사용자 스토리 |
|----|------|------|--------------|
| F-101 | 유사 아티클 알림 | 현재 페이지와 유사한 과거 저장글 Badge 표시 | "이전에 비슷한 글 읽었는지 알고 싶어" |
| F-102 | 오프라인 저장 | 네트워크 끊겨도 로컬 저장 후 나중에 동기화 | "오프라인에서도 저장하고 싶어" |
| F-103 | 단축키 지원 | `Ctrl+Shift+S`로 빠른 저장 | "마우스 안 쓰고 키보드로 저장하고 싶어" |
| F-104 | 컨텍스트 메뉴 | 우클릭 → "NOD에 저장" 메뉴 | "우클릭으로 간편하게 저장하고 싶어" |

### 2.3 P2 (Nice to Have) - 고급 기능

| ID | 기능 | 설명 |
|----|------|------|
| F-201 | 하이라이트 저장 | 텍스트 선택 후 하이라이트로 저장 |
| F-202 | 메모 추가 | 저장 시 개인 메모 첨부 |
| F-203 | 컬렉션 지정 | 저장 시 폴더/컬렉션 선택 |
| F-204 | 읽기 진행률 | 페이지 스크롤 진행률 추적 |

---

## 3. 기술 아키텍처

### 3.1 현재 구현 상태

```
apps/extension/
├── manifest.json          # MV3, permissions: activeTab, storage
├── src/
│   ├── popup/             # React 19 + Vite
│   │   ├── App.tsx        # 메인 UI (저장 버튼, 상태 표시)
│   │   └── main.tsx       # Entry point
│   ├── content/
│   │   └── content-script.ts  # DOM 파싱, 본문 추출
│   ├── background/
│   │   └── service-worker.ts  # 토큰 관리, Badge 업데이트
│   └── lib/
│       ├── api.ts         # Backend API 호출
│       └── auth.ts        # 토큰 저장/조회
└── vite.config.ts
```

### 3.2 기술 스택

| 영역 | 기술 | 선택 이유 |
|------|------|----------|
| **UI** | React 19, TypeScript | 컴포넌트 재사용, 타입 안정성 |
| **빌드** | Vite | 빠른 HMR, ES 모듈 지원 |
| **콘텐츠 추출** | @mozilla/readability | 검증된 아티클 파싱 라이브러리 |
| **상태 관리** | React hooks (+ Zustand 예정) | 가벼운 상태 관리 |
| **스타일** | CSS-in-JS (계획: Tailwind) | 일관된 디자인 시스템 |
| **API 통신** | Fetch API | 브라우저 네이티브 |
| **저장소** | chrome.storage.local | Extension 전용 스토리지 |

### 3.3 시스템 흐름

```
[사용자 액션]              [Extension]                    [Backend]
     │                         │                            │
     │  클릭 "Save & Analyze"  │                            │
     ├────────────────────────►│                            │
     │                         │  Content Script: DOM 파싱   │
     │                         ├──────────────────────────► │
     │                         │                            │
     │                         │  POST /api/articles/analyze │
     │                         ├───────────────────────────►│
     │                         │                            │ AI 요약 생성
     │                         │                            │ 임베딩 생성
     │                         │  { id, title, status }     │ DB 저장
     │                         │◄───────────────────────────┤
     │  "Saved!" + 링크        │                            │
     │◄────────────────────────┤                            │
```

### 3.4 데이터 모델

```typescript
// Extension 로컬 저장
interface LocalCache {
  recentArticles: ArticleSummary[];  // 최근 저장 5개
  pendingSync: PendingArticle[];      // 오프라인 저장 대기
  settings: ExtensionSettings;
}

// API 요청
interface SaveArticleRequest {
  url: string;
  title: string;
  content: string;       // 추출된 본문 (max 50,000자)
  source: "extension";
}

// API 응답
interface SaveArticleResponse {
  id: string;
  title: string;
  status: "processing" | "completed" | "failed";
  summary?: {
    coreSummary: string;
    concepts: string[];
  };
}
```

---

## 4. 성능 요구사항

| 지표 | 목표값 | 측정 방법 |
|------|--------|----------|
| 팝업 로드 시간 | ≤ 300ms | Performance API |
| 콘텐츠 추출 | ≤ 500ms | Content Script 실행 시간 |
| 저장 완료 (API 포함) | ≤ 3초 | 버튼 클릭 → 완료 표시 |
| 메모리 사용량 | ≤ 30MB | Chrome Task Manager |
| Extension 크기 | ≤ 500KB | 빌드 결과물 |

---

## 5. 보안 요구사항

| 항목 | 요구사항 | 구현 방법 |
|------|---------|----------|
| 토큰 저장 | 안전한 로컬 저장 | chrome.storage.local (Extension 격리) |
| API 통신 | HTTPS 필수 | API_BASE URL 검증 |
| 콘텐츠 추출 | XSS 방지 | textContent만 추출, HTML 태그 제거 |
| 권한 최소화 | 필요한 권한만 요청 | activeTab (현재 탭만), storage |
| 토큰 만료 | 자동 갱신 또는 재로그인 유도 | 401 응답 시 처리 |

---

## 6. 구현 로드맵

### Phase 1: MVP 완성 (현재 → 1주)

```
Week 1:
├── Day 1-2: UI 개선 (Tailwind CSS 적용, 로딩 상태)
├── Day 3-4: Readability.js 통합 (정확한 본문 추출)
├── Day 5-6: 에러 핸들링 강화 (오프라인, 401, 네트워크)
└── Day 7: 테스트 및 QA
```

### Phase 2: 향상된 경험 (2-3주)

```
Week 2-3:
├── 유사 아티클 Badge 알림
├── 최근 저장 목록 UI
├── 단축키/컨텍스트 메뉴
└── 오프라인 저장 큐
```

### Phase 3: 고급 기능 (4주+)

```
Week 4+:
├── 하이라이트 저장
├── 메모 기능
├── 컬렉션 관리
└── Chrome Web Store 배포
```

---

## 7. 의존성 및 제약사항

### 7.1 외부 의존성

| 의존성 | 용도 | 상태 |
|--------|------|------|
| Backend API | 아티클 저장/요약 | localhost:8000 (개발) |
| Web App | OAuth 인증 페이지 | localhost:3000 (개발) |
| OpenAI API | AI 요약 (Backend 경유) | Backend에서 관리 |

### 7.2 제약사항

| 제약 | 설명 | 대응 |
|------|------|------|
| MV3 제한 | Service Worker 비활성화 가능 | 필수 작업은 즉시 처리 |
| 콘텐츠 길이 | 50,000자 제한 | 초과 시 잘라서 전송 |
| API Rate Limit | 분당 요청 제한 예상 | 중복 저장 방지, 쓰로틀링 |

---

## 8. 성공 지표 (KPI)

| 지표 | 목표 (출시 1개월 후) | 측정 방법 |
|------|---------------------|----------|
| 설치 수 | 100+ | Chrome Web Store |
| DAU | 50+ | 일일 API 호출 사용자 수 |
| 저장 성공률 | 95%+ | 성공/실패 API 로그 |
| 평균 저장 시간 | ≤ 2초 | API 응답 시간 |

---

## 9. 리스크 및 대응

| 리스크 | 영향 | 확률 | 대응 |
|--------|------|------|------|
| API 서버 장애 | 저장 불가 | 중 | 오프라인 큐 + 재시도 |
| 콘텐츠 추출 실패 | 빈 본문 저장 | 중 | Fallback 추출 로직 |
| 토큰 만료 | 401 에러 | 높음 | 자동 갱신 또는 재로그인 유도 |
| Chrome 정책 변경 | Extension 거부 | 낮음 | 정책 모니터링 |

---

## 10. 참고 자료

- [PROJECT-BRIEF.md](../plan-docs/PROJECT-BRIEF.md) - NOD 전체 프로젝트 개요
- [Chrome Extension MV3 Docs](https://developer.chrome.com/docs/extensions/mv3/)
- [Mozilla Readability](https://github.com/mozilla/readability)

---

*작성일: 2026-02-05*
*상태: Plan 완료 → Design 진행 필요*
