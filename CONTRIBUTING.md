# Contributing to NOD

NOD Phase 1 is a small link-saving product in `apps/nod`. Contributions should preserve its scope: a signed-in user saves a page URL, title, source, and saved time, then manages those links in a personal library. Article-body collection and AI processing are out of scope.

## Local setup

Use Bun and run commands from `apps/nod`:

```bash
bun install --frozen-lockfile
bun run db:local
bun run dev
```

Before proposing a change, run the checks relevant to it:

```bash
bun run check # JavaScript syntax
bun run build # Wrangler deployment dry-run; no remote deployment
```

## Change guidelines

- Keep the active runtime in `apps/nod`; do not restore deleted legacy applications, packages, or infrastructure.
- Keep the public app as separate HTML, CSS, and JavaScript. Avoid UI frameworks and needless abstractions; styling investment is deferred until a design decision exists.
- Never commit, copy into documentation, or otherwise expose values from `.dev.vars` or other credentials.
- Apply local D1 migrations with `bun run db:local` before exercising schema-dependent behavior.
- Keep pull requests focused and explain user-visible behavior and verification.

For automation acting in this repository, commit, push, and deployment require explicit approval from the user or repository owner. A passing local check is not authorization for a remote action.

## Task management

Work is tracked as GitHub issues. Every non-trivial change traces back to an issue; typo-level fixes may go direct.

### Issue lifecycle

1. **Open** — use the bug/feature template. One issue = one deliverable change.
2. **Triage** — apply one type label (`bug`, `enhancement`, `documentation`), one surface label (`web`, `extension`, `worker`, `ci`), and a `size/*` label. Untriaged issues carry `needs triage`.
3. **In progress** — assign yourself and create a branch.
4. **Done** — the PR merges and the issue closes via `Closes #N` in the PR body.

### Branches and commits

- Branch: `<type>/<issue-N>-<slug>`, e.g. `feat/12-link-sorting`. Types match commit types.
- `mise run work <issue-N> [type]` creates the branch and a git worktree at `../NOD-worktrees/<branch>` in one step, copying `.dev.vars` for local dev.
- When a PR merges, the `close-issue` job parses the issue number from the branch name and closes it — `Closes #N` in the PR body is still good practice but no longer required.
- Commits: `type(scope): subject` — types `feat`, `fix`, `docs`, `chore`, `ci`, `build`, `refactor`, `test`; scopes `nod` (app code) or `root` (repo/meta). Korean or English subjects are both fine; keep them one line.
- Keep PRs focused: one issue, one PR. The PR template checklist must pass, including `mise run check && mise run build`.

### Merge and deploy

- `main` is protected: changes land through PRs. Merging to `main` deploys automatically — remote D1 migrations run, then `wrangler deploy`, then a production smoke check.
- D1 migrations are additive-only (new tables/columns, never drops or renames) because they apply before the new Worker version goes live.
- A change is done when CI is green, the deploy smoke check passed, and `docs/handoff.md` reflects any state that changed.

## Community and security

Follow the [Code of Conduct](CODE_OF_CONDUCT.md). Report vulnerabilities through the process in [SECURITY.md](SECURITY.md), not public issues.
