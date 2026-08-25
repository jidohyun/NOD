# CLAUDE.md

에이전트용 라우팅 테이블. 이 파일은 지식이 아니라 조건부 포인터다 — 조건에 맞는
문서를 읽고 나서 작업한다. 여기를 길게 만들지 말 것: 상세는 각 문서가 소유한다.

## 판정 기준 (모든 작업에 선행)

- `docs/agent-north-star.md` — 운영 판정 기준. 가역=판단 / 비가역=채널 분리 확인.
  비가역 경계 목록과 standing approval이 여기 있다. 다른 규칙과 충돌 시 이 문서가
  이기고, 충돌한 표면을 고친다.

## 라우팅 (Use when …)

| 조건 | 먼저 읽을 것 |
|---|---|
| 세션 시작, 이전 작업 이어받기 | `docs/handoff.md` (Current State 커밋 해시 확인) |
| 계약·프롬프트·훅·스키마 변경 전 | `docs/lessons.md` |
| 설계 이해·변경 | `docs/design.md` (레포 스냅샷; 원본 `~/.gstack/projects/nod/dnp-jidohyun-main-design-20260809-000413.md` — 변경은 원본 수정 후 스냅샷 재복사) |
| 자산 스키마를 건드리기 전 | `docs/a0-retrospective.md` — v1.1 결정 대기 5건 (structures 최우선) |
| 확정 결정 재논의 전 | `docs/decisions.md` — 기록된 근거부터 반박 |
| claim 작성·LLM 프롬프트 저작 | `docs/claim-guidelines.md` (5규칙) |
| vault 자산 작성 | `templates/asset.md` + 아래 vault 규칙 |
| 모노레포 코드 작업 (명령·경로·훅) | `AGENTS.md` + 해당 앱의 child AGENTS.md |
| 검증 실행·커밋/PR/issue 컨벤션 확인 | `docs/static-harness.md` (lint·test·훅·CI 단일 지도) |

## 프로젝트 한 줄

**NOD** — 리서치 정보 자산화 엔진. 요약이 아니라 **지식 diff**: claim(검증 가능한
주장) + Evidence(출처 앵커) + Relation(기존 지식과의 관계)으로 자산화한다.

로드맵: A0(수동 검증, 완료) → **A: CLI 파이프라인**(다음) → B: 브라우저 확장 +
diff 뷰(별도 설계 세션 필요) → C: 발행. 구현 태스크는
`~/.gstack/projects/nod/tasks-eng-review-*.jsonl`.

## vault 규칙

- 파일명 = URL 정규화 슬러그 (쿼리스트링·fragment·trailing slash 제거). 같은 URL
  재캡처는 새 파일이 아니라 기존 파일에 append.
- Evidence 인용에는 `(cN)` 앵커 필수 — claim과의 entailment 역검증 장치.
- relation 최종 확정은 항상 사용자 몫. 에이전트는 제안까지만 (north-star 비가역 3번).

## 스코프 규칙 (설계 확정 — 재논의 금지)

- 정보 전달형 아티클만: 의견·토론 콘텐츠(오피니언 에세이, GeekNews/Reddit 스레드)
  미지원, GitHub 저장소/README v1 미지원 (gist 장문 텍스트는 지원).
- 회상/리마인더 기능은 명시적으로 후순위 — 지금 구현·설계 금지.

## 커밋 관행

`commitlint`가 `<type>(<scope>): <subject>` 형식을 검사한다. 허용 type은
`feat|fix|docs|style|refactor|perf|test|build|ci|chore`, scope는
`api|web|mobile|worker|infra|deps|docs|root|main`이다. 이 레포의 에이전트 문서·
하네스·vault 변경은 `docs(root): ...`를 사용한다. `vault:`는 type-enum에 없으므로
사용하지 않는다. main push는 north-star의 standing approval 조건(로컬 게이트 통과 +
관련 CI/배포 workflow를 별도 채널에서 확인)을 따른다. 원격: jidohyun/NOD (public).
