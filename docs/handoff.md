# NOD Handoff

<!-- nod-handoff-base: 48be05f1d985b8be993cb2f42059dab9c0e9952d -->

세션 간 상태 인수인계 파일. 새 세션은 CLAUDE.md 라우팅을 거쳐 여기부터 읽는다.
갱신 규칙: 세션이 유의미한 상태 변화를 만들면 이 파일을 갱신하고 커밋한다.
Current State에는 커밋 해시를 박는다. 증명 안 된 것은 Non-claims에 남긴다.

## Next Pickup

- A 단계(CLI 클리퍼 파이프라인) 구현 착수 대기. 태스크 목록:
  `~/.gstack/projects/nod/tasks-eng-review-*.jsonl` (pending 폴백, 실패 알림,
  슬러그, frontmatter 직렬화, 테스트+eval이 P1/P2).
- 스키마를 건드리기 전 `docs/a0-retrospective.md`의 v1.1 결정 대기 5건 확인
  (structures 필드가 최우선).

## Current State

- 문서 하네스 작업 시작점: `48be05f` (docs: NOD 명칭과 문서 경로 정리)
- A0(수동 검증) 완료 — vault 자산 6개, 스키마 v1 생존 판정.
- 현재 작업 트리에서 에이전트 하네스 문서를 정렬 중이다. `AGENTS.md`,
  `CLAUDE.md`, `.gitignore`, `docs/agent-north-star.md`, `docs/handoff.md`,
  `docs/lessons.md`, `docs/static-harness.md`는 이 기준 커밋에 아직 포함되지
  않았다. clean clone에서 사용하려면 함께 커밋해야 한다.
- 2026-08-12: charness 기반 운영 원칙을 NOD의 실제 `mise`, 앱별 manifest,
  Git hook, GitHub Actions 구조에 맞춰 정렬하는 작업 진행.
- 2026-08-24: local quality harness의 root `mise` 계약은 planner가 선택한 기존 앱
  task, mutation fingerprint, atomic receipt를 `.omo/quality/<phase>/<pid>/`에서
  연결한다. 현재 작업은 no-commit shared-worktree 모드이며 CI parity는 deferred다.

## Next Session

1. CLAUDE.md 라우팅에 따라 필요한 진실 원천만 읽는다.
2. Next Pickup의 항목을 사용자와 확인 후 진행한다.

## Discuss (사용자 결정 필요)

- v1.1 스키마 결정 5건 (a0-retrospective) — A 단계 구현 전에 확정할지 여부.

## Non-claims

- 하네스 이식 문서들은 아직 실세션 검증 전 — standing approval 문구가 실제 운영과
  맞는지는 다음 작업 세션에서 확인된다.
- 실제 workflow 파일은 확인했지만 Actions run 자체를 실행하지는 않았다. Local
  harness receipt는 CI coverage를 뜻하지 않으며 CI parity는 별도 승인 전까지
  deferred다.
- TruffleHog unavailable/version mismatch와 generated-drift timeout은 fail-closed
  분류다. 실제 실행 증거 없이 green으로 재분류하지 않는다.
