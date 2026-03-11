<p align="center">
  <a href="https://nod-archive.com">
    <img src="apps/web/public/brand/nod-icon.png" width="80" alt="NOD" />
  </a>
</p>

<h3 align="center">NOD</h3>

<p align="center">
  읽은 것을 잊지 않는 지식으로 바꿔줍니다.
  <br />
  <a href="https://nod-archive.com">웹사이트</a> · <a href="https://chromewebstore.google.com/detail/nod-article-analyzer/lifmaapjkbpfbdppiaeidcnicidpfknp">크롬 익스텐션</a> · <a href="https://github.com/jidohyun/NOD/issues">이슈</a>
</p>

<p align="center">
  <a href="https://github.com/jidohyun/NOD/blob/main/LICENSE"><img src="https://img.shields.io/github/license/jidohyun/NOD" alt="License" /></a>
  <a href="https://github.com/jidohyun/NOD/stargazers"><img src="https://img.shields.io/github/stars/jidohyun/NOD" alt="Stars" /></a>
  <a href="https://github.com/jidohyun/NOD/issues"><img src="https://img.shields.io/github/issues/jidohyun/NOD" alt="Issues" /></a>
</p>

<p align="center">
  <a href="README.md">English</a>
</p>

---

NOD는 웹 콘텐츠를 AI로 요약하고, 검색 가능한 지식으로 저장하는 크롬 익스텐션 + 웹앱입니다. 북마크가 아니라 지식으로.

원래 개인용 [n8n + Gemini + Obsidian 자동화](https://velog.io/@do-hyun123/ipone-n8n-automation)로 만들었는데, 세팅을 부탁하는 사람이 많아서 누구나 30초만에 쓸 수 있는 서비스로 만들었습니다.

<p align="center">
  <img width="720" height="1236" alt="스크린샷 2026-03-11 오전 11 14 06" src="https://github.com/user-attachments/assets/e9b5a517-daba-449d-b8f4-55c557710630" />
</p>


## 기능

- **웹 아티클** — 웹페이지를 요약하고 핵심 인사이트를 추출
- **GitHub 레포** — README만이 아니라 프로젝트 구조와 핵심 로직을 분석
- **YouTube 영상** — 1시간짜리 영상을 안 봐도 핵심만 뽑아줌
- **논문 & PDF** — arXiv 논문, 기술 문서를 빠르게 파악
- **시맨틱 검색** — 키워드가 아니라 의미로 저장된 지식을 검색
- **지식 그래프** — 저장된 개념들의 연결 관계를 시각화

## 구조

```
apps/
├── web/          # Next.js 16 — 대시보드, 검색, 지식 그래프
├── api/          # FastAPI — AI 요약, 인증, 저장
├── worker/       # FastAPI — Cloud Tasks & Pub/Sub 비동기 작업
├── extension/    # Chrome Extension — 콘텐츠 캡처 & 요약
├── mobile/       # flutter (예정)
└── infra/        # Terraform — GCP Cloud Run 배포
```

## 기술 스택

| 레이어 | 스택 |
|--------|------|
| 프론트엔드 | [Next.js](https://nextjs.org) · [TypeScript](https://www.typescriptlang.org) · [Tailwind CSS](https://tailwindcss.com) · [Radix UI](https://www.radix-ui.com) · [Cytoscape](https://js.cytoscape.org) |
| 백엔드 | [FastAPI](https://fastapi.tiangolo.com) · [Python](https://www.python.org) · [SQLAlchemy](https://www.sqlalchemy.org) · [pgvector](https://github.com/pgvector/pgvector) |
| AI | [Google Gemini](https://ai.google.dev) · [OpenAI](https://platform.openai.com) |
| 데이터베이스 | [PostgreSQL](https://www.postgresql.org) · [Redis](https://redis.io) |
| 인증 | [Supabase](https://supabase.com) |
| 인프라 | [GCP Cloud Run](https://cloud.google.com/run) · [Terraform](https://www.terraform.io) |
| 결제 | [Paddle](https://www.paddle.com) |
| 관찰성 | [OpenTelemetry](https://opentelemetry.io) · [Sentry](https://sentry.io) · [Langfuse](https://langfuse.com) |

## 시작하기

### 사전 요구사항

- [Bun](https://bun.sh) (패키지 매니저)
- [Python 3.12+](https://www.python.org) + [uv](https://docs.astral.sh/uv/)
- [PostgreSQL](https://www.postgresql.org) (pgvector 확장 포함)
- [Redis](https://redis.io)

### 개발 환경

```bash
# 웹 대시보드
cd apps/web
bun install
bun run dev

# API 서버
cd apps/api
uv sync
poe dev

# 워커
cd apps/worker
uv sync
poe dev

# 크롬 익스텐션
cd apps/extension
npm install
npm run dev
```

각 앱 디렉토리에서 상세 설정을 확인하세요.

## 셀프 호스팅

NOD는 셀프 호스팅이 가능합니다. 필요한 것:

1. pgvector가 설치된 PostgreSQL
2. Redis 인스턴스
3. Gemini 또는 OpenAI API 키

인프라는 `apps/infra/`에 Terraform으로 정의되어 있습니다. 직접 운영하기 번거로우시면 [nod-archive.com](https://nod-archive.com)에서 월 $5로 이용할 수 있습니다.

## 기여

버그 리포트, 기능 제안, PR 모두 환영합니다. [이슈](https://github.com/jidohyun/NOD/issues)를 확인해주세요.

```bash
# PR 제출 전 체크
cd apps/web && bun run lint && bun run typecheck
cd apps/api && poe all-checks
```

## 라이선스

[MIT](LICENSE)
