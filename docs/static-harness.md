# NOD Static Harness — 검증·컨벤션 지도

이 문서는 NOD의 실제 정적 하네스(앱별 명령, root `mise`, Git hook, GitHub Actions,
커밋 규칙)를 한 곳에 기록한다. 명령이나 설정이 바뀌면 해당 설정과 함께 갱신한다.
기준 커밋은 `48be05f`이며, 문서 하네스 변경은 현재 작업 트리에서 정렬 중이다.

<!-- nod-quality-contract: {"ci_parity":"deferred","execution_mode":"no_commit_shared_worktree","receipt_root":".omo/quality","runtime_boundary":".omo/"} -->

## 1. 저장소 실행 구조

| 영역 | 실제 도구 | 로컬 진입점 | root `mise` 범위 |
|---|---|---|---|
| `apps/api` | Python 3.12, `uv`, FastAPI, Ruff, mypy, pytest | `uv run poe <task>` | `lint`, `format`, `typecheck`, `test`, `db:migrate` |
| `apps/worker` | Python 3.12, `uv`, FastAPI, Ruff, mypy, pytest | `uv run poe <task>` | `lint`, `format`, `test` |
| `apps/web` | Bun, Next.js, Biome, TypeScript, Vitest | `bun run <script>` | `lint`, `format`, `typecheck`, `test` |
| `apps/extension` | Bun/npm scripts, Vite, TypeScript | `bun run <script>` | root validation task 없음 |
| `apps/mobile` | Flutter, Ruby/Fastlane | `flutter` 및 `bundle exec fastlane` | `install`, `dev:mobile` 의존성에 포함 |
| `packages/*` | package-local `mise.toml` | package task | `gen:api`, `i18n:build`, `tokens:build` 등 |

root `mise.toml`의 현재 범위는 다음과 같다.

```text
dev         = api + web + worker
dev:web     = api + web
dev:mobile  = api + mobile
install     = web + api + worker + mobile + design-tokens + i18n
format      = api + web + worker
lint        = api + web + worker
test        = api + web + worker
typecheck   = api + web
```

Extension은 `apps/extension/package.json`의 `typecheck`, `build:prod`,
`package:prod`를 사용한다. Mobile은 앱의 Fastlane task와 CI workflow를 사용한다.

## 2. 로컬 검증 명령

```bash
mise run lint
mise run typecheck
mise run test
mise run format
mise run db:migrate

# 로컬 Git 품질 경계
mise run git:doctor -- --json
mise run git:plan -- --phase pre-commit --json
printf '%s\n' '<local-ref> <local-oid> <remote-ref> <remote-oid>' \
  | mise run git:plan -- --phase pre-push --remote origin --json
mise run git:pre-commit
printf '%s\n' '<local-ref> <local-oid> <remote-ref> <remote-oid>' \
  | mise run git:pre-push -- origin '<remote-url>'
```

앱별 직접 실행이 필요하면 다음을 사용한다.

```bash
# API
cd apps/api
uv sync
uv run poe lint
uv run poe typecheck
uv run poe test

# Worker
cd apps/worker
uv sync
uv run poe lint
uv run poe typecheck
uv run poe test

# Web
cd apps/web
bun install
bun run lint
bun run typecheck
bun run test

# Extension
cd apps/extension
bun install
bun run typecheck
bun run build:prod
bun run package:prod
```

DB schema를 사용하는 API 검증은 반드시 `mise run db:migrate`를 먼저 실행한다.
`UndefinedTableError`나 `relation ... does not exist`가 나오면 애플리케이션 코드보다
migration drift를 먼저 확인한다.

## 3. Git hook 체인

`mise.toml`의 `postinstall`이 `.git/hooks/commit-msg`, `pre-commit`, `pre-push`를
생성하고 각 hook은 `mise run git:*`로 위임한다. `pre-push`는 Git이 준 remote name,
remote URL과 모든 stdin ref record를 그대로 root task에 전달한다. Fresh clone 직후
hook이 없을 수 있으며 설치/수리는 install 계약의 몫이다. `git:doctor`는 읽기 전용으로
상태만 검사하고 자동 설치·수리하지 않는다.

- `commit-msg`: 기존 `@commitlint/cli@20` 계약 유지
- `pre-commit`: staged planner → contract/API/Worker/Web/Mobile lint → Dockerfile
  lint 순서에서 선택된 항목만 한 번 실행
- `pre-push`: 모든 ref를 읽는 planner → 기존 branch-name 검증(release-please 예외
  유지) → contract → API/Worker/Web/Mobile test → secret scan → handoff → generated
  drift 순서에서 선택된 항목만 실행
- 모든 실행 gate는 전후 mutation fingerprint로 감싸고 원자적으로 receipt를 쓴다.
  planner 오류, 명령 실패, tracked/index/HEAD/non-ignored artifact mutation, receipt
  실패는 차단한다.

한 실행의 plan과 gate receipt는 `.omo/quality/<phase>/<pid>/`에 놓인다. `.omo/`는
ignored runtime/evidence 경계이며 tracked 계약이나 제품 산출물 위치가 아니다. 여러
push ref는 메모리에서 한 번 보존한 뒤 planner, secret scan, handoff에 동일하게
전달한다. Secret scan은 `scripts/quality/trufflehog.lock`과 root mise의 `3.97.0` pin만
사용하며 다른 scanner로 fallback하지 않는다. 바이너리가 없거나 버전/출력/timeout이
잘못되면 fail closed이고, task가 자동 설치하지 않는다. Generated drift의 generator
failure/timeout도 green으로 바꾸지 않으며 비재현 pair만 명시적 non-blocking 분류다.

이 계약은 commit/push를 수행하지 않는 shared-worktree 직접 실행 모드다. 기존 dirty
상태를 보존하며 제품 코드, migration, generated product output, CI workflow를 고치지
않는다. Root hook의 로컬 범위와 앱별 CI 범위는 여전히 다르다.

## 4. Commit convention

`commitlint.config.cjs`가 다음 형식을 강제한다.

```text
<type>(<scope>): <subject>
```

- type: `feat|fix|docs|style|refactor|perf|test|build|ci|chore`
- scope: `api|web|mobile|worker|infra|deps|docs|root|main`
- scope 생략은 warning, 허용되지 않은 type/scope는 error
- subject는 lowercase 규칙이며 한글 subject는 사용 가능
- branch name은 `feat/*`, `fix/*`, `chore/*` 계열을 사용

이 레포의 문서·하네스·vault 변경은 `docs(root): ...`를 사용한다. `vault:`는
commitlint의 type-enum에 없으므로 사용하지 않는다. Extension 전용 scope는 아직
허용되지 않으므로 `root` 또는 scope 생략을 사용한다.

## 5. GitHub Actions 검증·배포

### Pull request

`.github/workflows/review.yml`은 다음을 수행한다.

- PR size label
- Web Biome check
- API/Worker Ruff check
- Mobile Flutter analyze

현재 PR workflow에는 API/Web/Worker test와 typecheck, Extension 검증이 포함되어
있지 않다.

### main push

- `deploy-api.yml`: API 변경 시 Ruff, mypy, pytest 후 Cloud Run 배포
- `deploy-web.yml`: Web 변경 시 Biome, TypeScript, Vitest 후 Cloud Run 배포
- `deploy-worker.yml`: Worker 변경 시 Ruff, mypy, pytest 후 Cloud Run 배포
- `deploy-mobile.yml`: Mobile 변경 시 Fastlane lint/test, main push에서 Android/iOS
  build와 Firebase App Distribution
- `release-please.yml`: main push에서 release PR 생성 시도

### Extension release

`release-extension.yml`은 `extension-v*` tag 또는 수동 실행에서 Extension
typecheck, production build, package, GitHub Release를 수행한다.

### 운영 원칙

이 변경은 로컬 gate만 제공한다. CI parity, Extension PR validation, root/CI scope
reconciliation은 별도 승인·fresh-eye review가 필요한 후속 작업으로 **deferred**되어
있으며 현재 workflow가 이 receipt 계약을 실행한다고 주장하지 않는다. Push exit
code는 Actions 결과가 아니다. main push 후에는 관련 workflow run을 `gh run watch`
또는 GitHub Actions 화면에서 별도 확인한다. 로컬 hook이 없는 fresh clone,
`--no-verify`, 테스트 범위 축소는 검증 통과로 간주하지 않는다.

## 6. 현재 하네스의 남은 공백

- PR 단계에서 앱별 test/typecheck를 일괄 수행하는 단일 workflow는 없다.
- Extension 변경을 PR에서 자동 검증하는 workflow가 없다.
- root `mise` task 범위와 CI 범위가 완전히 같지 않다.

이 공백을 해결하는 CI 변경은 이번 로컬 harness 범위에 포함되지 않는다. 별도 계획과
승인 전까지 CI parity는 deferred 상태이며, 이후 proof-surface 변경은
`docs/agent-north-star.md`의 fresh-eye 검토 규칙을 따른다.
