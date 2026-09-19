---
name: nod-ship
description: Ship a finished NOD branch — open the PR, watch CI, merge, confirm deploy and issue closure. Use when a worktree branch is ready to land.
---

# nod-ship

## Steps

1. **Push** — `git push -u origin <branch>` from the worktree.
2. **PR** — `gh pr create` filling the template: Summary, Changes, `Closes #N`, checklist. Write the body via a file or single-quoted heredoc — backticks in `--body` get shell-executed.
3. **CI** — `gh pr checks <PR> --watch`. Required green: `Nod` job (check → test → db:local → build). `Deploy` skips on PRs by design.
4. **Merge** — `gh pr merge <PR> --squash --delete-branch`. If blocked by policy, check `gh pr view --json mergeStateStatus,reviewDecision`; the maintainer may use `--admin` (bypass is enrolled for `jidohyun` only).
5. **Confirm** — the merge push triggers `deploy`: remote D1 migrations → `wrangler deploy` → smoke check on `https://nod-archive.com`. Watch with `gh run watch`. The `close-issue` job closes the issue parsed from the branch name.
6. **Clean up** — `git worktree remove ../NOD-worktrees/<branch>` and `git pull --ff-only` on main.

## Gotchas

- Merge to main IS the deploy. There is no separate release step.
- A failed smoke check means the Worker is live but unhealthy — go to `nod-ops` rollback, do not re-merge.
- Done when: deploy run is green, the issue is closed, and the worktree is removed.
