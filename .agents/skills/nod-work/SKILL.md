---
name: nod-work
description: Start work on a NOD issue — create the worktree and implement. Use when an issue is ready to build, or the user says work on issue N.
---

# nod-work

## Steps

1. **Worktree** — `mise run work <issue-N> [type]` from the repo root. Creates `../NOD-worktrees/<type>/<N>-<slug>` on branch `<type>/<N>-<slug>` off `origin/main`, and copies `.dev.vars`. All work happens inside the worktree, never on the main checkout.
2. **Install** — `cd ../NOD-worktrees/<branch> && bun install --frozen-lockfile` (node_modules is per-worktree).
3. **Implement** — smallest correct change for the issue's 완료 조건. Respect `apps/nod` scope: vanilla HTML/CSS/JS, no frameworks, no body collection or AI features.
4. **Verify** — `bun run check`, `bun test`, `bun run build` inside `apps/nod`. Add tests to `src/worker.test.js` when the change touches worker logic.
5. **Commit** — `type(scope): subject`, scope `nod` for app code, `root` for repo/meta. Korean or English one-line subjects. The pre-push hook runs check+build; let it run.

## Gotchas

- D1 migrations are additive-only: new tables/columns, never drops or renames.
- Never commit `.dev.vars` or expose its values.
- Done when: checks+tests+build pass in the worktree and commits follow the convention.
