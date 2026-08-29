# NOD Handoff

<!-- nod-handoff-base: 84a335956e9636e780fd5b8415dde0bf1e85d093 -->

세션 간 상태 인수인계 파일. 새 세션은 CLAUDE.md 라우팅을 거쳐 여기부터 읽는다.
갱신 규칙: 세션이 유의미한 상태 변화를 만들면 이 파일을 갱신하고 커밋한다.
Current State에는 커밋 해시를 박는다. 증명 안 된 것은 Non-claims에 남긴다.

## Next Pickup

- A 단계(CLI 클리퍼 파이프라인) 구현 착수 대기. 태스크 목록:
  `~/.gstack/projects/nod/tasks-eng-review-*.jsonl` (pending 폴백, 실패 알림,
  슬러그, frontmatter 직렬화, 테스트+eval이 P1/P2).
- 스키마를 건드리기 전 `docs/a0-retrospective.md`의 v1.1 결정 대기 5건 확인
  (structures 필드가 최우선).
- push는 north-star standing approval 조건(로컬 게이트
  통과 + 관련 CI/배포 workflow를 별도 채널에서 확인)을 따른다. push 시 pre-push
  게이트가 이 파일 상단 HTML 주석의 base 마커와 원격 main OID의 일치를 검사하므로,
  마커는 push 직전의 원격 main OID로 유지한다 (현재 `84a3359`와 일치). push 할
  때마다 원격 main이 움직이므로 다음 세션은 이 값을 먼저 갱신해야 한다. 게이트는
  마커 이름의 등장 횟수도 세므로 본문에서 그 이름을 그대로 적으면 중복으로 거부된다.

## Current State

- 기준 커밋: `84a3359` (docs(root): 핸드오프 base 마커를 원격 main으로 갱신) — origin/main과 동일
- 2026-08-29: GCP 배포 workflow 4개를 비활성화하면서(결정 기록 참조) 그 안에 있던
  cloud-free `test` job까지 함께 죽어 CI 쪽 동적 검증이 공백이 됐다. `.github/workflows/ci.yml`로
  api·worker·web의 lint·typecheck·test를 복구했다. CI는 로컬 게이트와 같은 진입점
  (`uv run poe <task>` / `bun run <task>`)을 호출하므로 green의 의미가 양쪽에서 같다.
  9개 진입점 전부 로컬에서 green 확인 후 작성했다 (web 186 tests).
- A0(수동 검증) 완료 — vault 자산 6개, 스키마 v1 생존 판정.
- 2026-08-25: 미커밋 상태로 남아 있던 하네스·문서 작업을 6개 커밋으로 분리해
  랜딩했다. 전부 실제 훅(commitlint + 로컬 게이트)을 통과했고 `--no-verify`는
  쓰지 않았다.
  - `1e970b3` build(root) 품질 하네스 — `mise` 태스크(`git:plan`, `git:quality`,
    `git:doctor`, `quality:contracts`) + `scripts/quality/` + proof 문서
  - `f26af3e` docs(root) CLAUDE.md 라우팅 테이블 + `docs/research/`
  - `a337d68` docs(root) suggest-tidyings 스킬 추가, skill-creator 개정
  - `4bd9351` chore(root) 미사용 에이전트 스킬 130개 + 깨진 심링크 32개 제거
  - `a797c61` docs(root) legacy 계획 문서 15개 제거
  - `99be1fc` docs(root) split-commit 스킬 추가
- 하네스 첫 실사용에서 커밋을 전면 차단하던 결함 2건을 고쳤고, 수정 후
  `quality:contracts` 157/157 통과를 확인했다.
  - `test_secret_scan_adversarial.py`: `stdin.close()` 뒤 `communicate()`가 닫힌
    stdin을 재-flush 해 `ValueError`. 레포의 기존 관례(`test_handoff_adversarial.py`)
    대로 `process.stdin = None`을 적용. 전체 스위트에서만 재현되고 단독 실행에서는
    통과해서 flake로 보였던 건이다.
  - `mise.toml` `git:quality`: Git이 훅에 내보내는 `GIT_DIR`·`GIT_INDEX_FILE` 등이
    게이트 자식 프로세스로 새어 fixture 저장소를 오염시켰다. 모든 게이트가 지나는
    지점에서 `unset` 한 번으로 차단. "수동 실행은 통과, 훅에서만 실패"의 원인.
- `plan.py`의 surface 규칙상 부분 커밋은 `DIRTY_WORKTREE`로 거부된다. 이 레포에서
  작업 트리를 여러 커밋으로 쪼개는 절차는 `.agents/skills/split-commit`이 소유한다
  (proof 경로는 하네스 커밋과 분리 불가, stash는 스테이징 이전에 수행).
- 2026-08-24: local quality harness의 root `mise` 계약은 planner가 선택한 기존 앱
  task, mutation fingerprint, atomic receipt를 `.omo/quality/<phase>/<pid>/`에서
  연결한다. 현재 작업은 no-commit shared-worktree 모드이며 CI parity는 deferred다.

## Next Session

1. CLAUDE.md 라우팅에 따라 필요한 진실 원천만 읽는다.
2. Next Pickup의 항목을 사용자와 확인 후 진행한다.

## Discuss (사용자 결정 필요)

- v1.1 스키마 결정 5건 (a0-retrospective) — A 단계 구현 전에 확정할지 여부.
- `mise.toml`의 `experimental_monorepo_root`가 deprecated 경고를 낸다
  (`monorepo_root`로 교체, mise 2027.12.0에서 제거). 교체 시점 미정.

## Non-claims

- pre-commit·pre-push 게이트 모두 실행 증거가 있다 (`secret_scan` CLEAN, `handoff`
  HANDOFF_CURRENT). 다만 `generated_drift`는 아직 선택된 적이 없어 미검증이다.
- `ci.yml`은 로컬에서 같은 명령을 돌려 green을 확인했을 뿐, GitHub 러너에서 실행된
  증거는 이 파일 작성 시점에 없다.
- 실제 workflow 파일은 확인했지만 Actions run 자체를 실행하지는 않았다. Local
  harness receipt는 CI coverage를 뜻하지 않으며 CI parity는 별도 승인 전까지
  deferred다.
- TruffleHog unavailable/version mismatch와 generated-drift timeout은 fail-closed
  분류다. 실제 실행 증거 없이 green으로 재분류하지 않는다.
- `.agents/skills/split-commit`은 스크립트 자체 체크 14/14와 실제 하네스 커밋
  1건으로 검증됐다. fresh-context 서브에이전트 트리거 검증은 하지 않았다.
