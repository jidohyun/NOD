# NOD Validation Matrix

Reference contract for the `suggest-tidyings` skill. It fixes the exact
validation commands a suggestion must cite, the roots a suggestion may target,
and the surfaces that stop a suggestion outright.

This file changes no validation configuration. It records what already exists in
`mise.toml`, the per-app `mise.toml` files, `apps/api/pyproject.toml`,
`apps/worker/pyproject.toml`, and `apps/web/package.json`. Adding a task, a
hook, a workflow, or a commitlint rule is out of scope here and in P0.

## P0 target roots

Exactly three roots are eligible:

- `apps/api/**`
- `apps/worker/**`
- `apps/web/**`

A suggestion whose file path doesn't start with one of those three prefixes is
rejected before it's written. There is no partial credit and no "adjacent file
while I'm here".

## Validation commands

Run these from the repository root unless the command says otherwise. Copy the
strings verbatim into a suggestion's validation line. Don't shorten them, don't
substitute a root aggregate like `mise run lint`, and don't swap in the
`uv run poe` or `bun run` form where a `mise` task exists.

### apps/api

```bash
mise //apps/api:lint
mise //apps/api:typecheck
mise //apps/api:test
```

Backed by `apps/api/mise.toml:4,6,7`, which delegate to `uv run poe lint`
(`ruff check .`), `uv run poe typecheck` (`mypy src`, strict), and
`uv run poe test` (`pytest tests/`) from `apps/api/pyproject.toml:55-77`.

### apps/worker

```bash
mise //apps/worker:lint
cd apps/worker && uv run poe typecheck
mise //apps/worker:test
```

Worker is the one asymmetry in the matrix, and it's deliberate.
`apps/worker/pyproject.toml:35-42` defines `typecheck = "mypy src"`, but
`apps/worker/mise.toml:2-6` exposes only `dev`, `install`, `lint`, `format`, and
`test`. There is no `//apps/worker:typecheck` task, and the root `typecheck`
aggregate in `mise.toml:62` covers API and Web only. So a Worker suggestion
cites the explicit `cd apps/worker && uv run poe typecheck` form.

Do not add a local or root `typecheck` task to close this gap. `mise.toml` and
every per-app `mise.toml` are proof surfaces; changing one to make a validation
line prettier is exactly the move this contract forbids. The gap is documented
in `docs/static-harness.md:18-35` and stays a documentation fact until someone
fixes it in a separate, approved change.

`apps/worker/AGENTS.md:13-21` lists the local command table and omits
`typecheck` for the same reason. Read the typecheck command out of
`apps/worker/pyproject.toml:35-42`, not out of that table.

### apps/web

```bash
mise //apps/web:lint
mise //apps/web:typecheck
mise //apps/web:test
```

Backed by `apps/web/mise.toml:5,7,8`, which delegate to the `bun run` scripts in
`apps/web/package.json:6-16`: `biome check src`, `tsc --noEmit`, and
`vitest run`. `apps/web/AGENTS.md:15-30` documents the same set.

### Summary matrix

| App | Lint | Typecheck | Test |
|---|---|---|---|
| `apps/api` | `mise //apps/api:lint` | `mise //apps/api:typecheck` | `mise //apps/api:test` |
| `apps/worker` | `mise //apps/worker:lint` | `cd apps/worker && uv run poe typecheck` | `mise //apps/worker:test` |
| `apps/web` | `mise //apps/web:lint` | `mise //apps/web:typecheck` | `mise //apps/web:test` |

All three of an app's commands belong on the validation line for a suggestion in
that app. A lint-only run is not validation.

## DB and schema stop rule

A DB or schema touch is ineligible for tidying. That covers Alembic migrations
under `apps/api/alembic/versions/**`, DDL, and any model edit that carries a
column mapping. If a candidate would need a migration to land, drop it.

Never run a migration as part of tidying. `mise run db:migrate` and
`cd apps/api && uv run alembic upgrade head` are operational commands, not
validation steps for a suggestion.

If a later user-applied change produces `UndefinedTableError` or
`relation ... does not exist`, stop and treat it as migration drift first, per
`apps/api/AGENTS.md:19-24`. Apply migrations, re-run the same request, and only
then look at application logic. Patching runtime code to route around a missing
table is forbidden, and a tidying suggestion is never the fix for that error.

## Excluded surfaces

Each item below is a hard stop. Hitting one rejects the suggestion; it doesn't
downgrade it to a warning.

**Other apps.** `apps/extension`, `apps/mobile`, and `apps/infra` are out of
scope for P0. Extension has no root validation task at all
(`docs/static-harness.md:18-35`), Mobile validates through Flutter and Fastlane,
and Infra is Terraform. None of the three commands above applies to them.

**Shared packages.** `packages/design-tokens`, `packages/graph-physics`,
`packages/i18n`, and every other `packages/*` root. They're consumed across
apps, so a change there isn't app-local.

**Proof surfaces.** `mise.toml`, every per-app `mise.toml`,
`commitlint.config.cjs`, `.git/hooks/**` and the `git:*` tasks in
`mise.toml:64-133` that generate them, `.github/workflows/**`, and formatter or
linter configuration (`ruff`, `mypy`, `biome`, `tsconfig`). See
`docs/static-harness.md:81-103,149-155`. Editing the thing that judges the work
isn't tidying.

**Generated files.** `openapi.json`, Orval output under `apps/web`, mobile
generated clients, and lockfiles (`uv.lock`, `bun.lock`). Anything
`mise run gen:api` or `gen_openapi.py` rewrites is machine output.

**migrations/schema.** Alembic versions, DDL, schema-carrying model edits. See
the stop rule above.

**Cross-app contracts.** API-to-Web and API-to-Worker surfaces: JSON wire keys,
Pydantic field names reaching OpenAPI, DB column mappings, queue payload shapes,
and any symbol reachable from generated output. Renaming for clarity here breaks
a wire.

**Ordering-sensitive async code.** Anything crossing `await`, `asyncio.Lock`, a
transaction boundary, a scheduler tick, or queue ordering.

**Dependency manifests.** `pyproject.toml`, `package.json`, and version pins. A
tidying never updates a dependency.

**Repository root and docs.** Root `AGENTS.md`, `CLAUDE.md`, `README`, `docs/**`,
`scripts/**`, `.omo/**`. Out of scope for code tidying.

**Dirty and drifted regions.** Files with uncommitted user changes, and regions
the target commit touched that a later commit changed again. See
`context-recovery.md`.

This exclusion list is mirrored in
[`tidying-guide.md`](tidying-guide.md); keep both contracts synchronized when
the P0 boundary changes.

## Commit markers

P0 produces no commit. If the user later chooses to apply a suggestion, the
commit uses one of exactly these three subjects:

```text
refactor(api): tidy — ...
refactor(worker): tidy — ...
refactor(web): tidy — ...
```

`commitlint.config.cjs:4-12` fixes the type and scope enums: `refactor` is a
legal type, and `api`, `worker`, `web` are legal scopes. `tidy:` is not a legal
type and must never be used. Subjects are lower-case, and the app scope has to
match the app whose files changed. One app per commit.

## Stop conditions

Stop and report instead of suggesting when any of these holds:

1. The candidate path is outside the three P0 roots.
2. The candidate touches an excluded surface listed above.
3. The candidate needs a migration, a schema change, or a dependency change.
4. The file is dirty in the worktree, or the region drifted after the target
   commit.
5. The applicable validation command doesn't exist for that app, so the
   suggestion can't be validated as written.
6. Landing the change would require adding or altering a `mise` task, a hook,
   a workflow, or a commitlint rule.

## What this matrix does not do

It adds no task, no hook, no workflow, and no commitlint rule. It defines no
Worker root `typecheck` task, and it doesn't run any command on its own. Passing
all three of an app's commands means those gates were green on that checkout, not
that the change preserves behavior.
