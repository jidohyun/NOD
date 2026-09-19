---
name: nod-work
description: Set up a work environment for a NOD issue — worktree, branch, dependencies, dev vars. Use when an issue is ready to start. Setup only; implementation happens after this skill hands off.
---

# nod-work

Prepares a ready-to-code environment for one issue. Stops at a working setup — writing code, tests, and commits is the next stage, not this one.

## Steps

1. **Worktree** — `mise run work <issue-N> [type]` from the repo root. Creates `../NOD-worktrees/<type>/<N>-<slug>` on branch `<type>/<N>-<slug>` off `origin/main`, and copies `.dev.vars`. All work happens inside the worktree, never on the main checkout.
2. **Install** — `cd ../NOD-worktrees/<branch> && bun install --frozen-lockfile` (node_modules is per-worktree).
3. **Local DB** — `cd apps/nod && bun run db:local` so schema-dependent behavior works on first run.
4. **Sanity** — `bun run check` passes and `bun run dev` boots (start it, confirm it serves, stop it).
5. **Hand off** — report the worktree path, branch name, and issue number. The environment is ready; implementation starts from here.

## Gotchas

- `gh` active account drifts to `dnp-dohyun` (read-only) — `gh auth switch -u jidohyun` if issue reads fail.
- Never commit `.dev.vars` or expose its values; copying it into the worktree is the only sanctioned move.
- Done when: the worktree exists on the right branch, deps are installed, local D1 is migrated, and `dev` boots.
