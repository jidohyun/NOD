# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트

**NOD** — 리서치 정보 자산화 엔진. 요약이 아니라 **지식 diff**: 정보 전달형 테크 아티클을 읽고 claim(검증 가능한 주장) + Evidence(출처 앵커) + Relation(기존 지식과의 관계)으로 자산화한다. 아직 코드 없음 — 현재는 스키마·기준 문서와 수동 작성 자산 볼트만 있는 단계.

핵심 진실 원천 (작업 전 필독 — 읽기 순서는 `README.md`):
- `docs/design.md` — 승인된 설계 문서 (레포 내 스냅샷; 원본은 `~/.gstack/projects/nod/dnp-jidohyun-main-design-20260809-000413.md`, gstack 스킬이 자동 발견하는 위치. 설계 변경 시 원본 수정 후 스냅샷 재복사)
- `docs/claim-guidelines.md` — claim 작성 기준 v1 (연구 근거 기반 5규칙). 자산 작성·LLM 프롬프트의 원천
- `docs/decisions.md` — 결정 기록 (근거 포함). 확정 결정을 재논의하기 전 여기 근거부터 반박
- `docs/a0-retrospective.md` — A0 검증 회고. **v1.1 결정 대기 5건** (structures 필드가 최우선) — 스키마를 건드리기 전 반드시 확인

## 구조

- `templates/asset.md` — 자산 스키마 v1 템플릿. frontmatter(`url`, `captured_at`, `claims`, `relations` 객체 배열) + 본문(Context / Evidence / 기준 적용 메모)
- `vault/*.md` — 자산. **파일명 = URL 정규화 슬러그** (쿼리스트링·fragment·trailing slash 제거). 같은 URL 재캐처는 새 파일이 아니라 기존 파일에 append
- Evidence 인용에는 `(cN)` 앵커를 붙여 claim과 연결 — 이것이 entailment 역검증 장치이므로 생략 금지

## 단계 로드맵 (A0 완료 상태)

A0(수동 검증, 완료) → **A: CLI 파이프라인** (다음 단계) → B: 브라우저 확장 + 시맨틱 매칭 + diff 뷰 (별도 설계 세션 필요 — "확장"이 아님) → C: 발행. 구현 태스크는 `~/.gstack/projects/nod/tasks-eng-review-*.jsonl` 참조 (pending 폴백, 실패 알림, 슬러그, frontmatter 직렬화, 테스트+eval이 P1/P2).

## 스코프 규칙 (설계 확정 — 재논의 금지)

- 정보 전달형 아티클만: 의견·토론 콘텐츠(오피니언 에세이, GeekNews/Reddit 스레드) 미지원, GitHub 저장소/README v1 미지원 (gist 장문 텍스트는 지원)
- 회상/리마인더 기능은 명시적으로 후순위 — 지금 구현·설계 금지
- claim은 `docs/claim-guidelines.md`의 5규칙을 따른다. relation의 최종 확정은 항상 사용자 몫 (LLM은 제안만)

## 커밋 관행

한국어 커밋 메시지, `vault:` / `docs:` / `feat:` 접두사. main 직접 푸시 중 (레포 규칙상 PR 권장 경고가 뜨지만 owner bypass — 의도된 것). 원격: jidohyun/NOD (public).
