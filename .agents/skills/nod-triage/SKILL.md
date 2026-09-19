---
name: nod-triage
description: Open or triage a NOD GitHub issue. Use when starting any non-trivial change, when the user describes work to do, or when an issue needs labels/assignee.
---

# nod-triage

Every non-trivial change starts as a GitHub issue in `jidohyun/NOD`. Typo-level fixes may skip this.

## Steps

1. **Search first** — `gh issue list --repo jidohyun/NOD --search "<keywords>"`. Reuse an open issue instead of duplicating.
2. **Create** — `gh issue create` with the bug/feature template shape: 배경 (why), 범위 (what, in/out), 완료 조건 (observable done state). One issue = one deliverable.
3. **Label** — exactly one type (`bug`, `enhancement`, `documentation`, `question`), one surface (`web`, `extension`, `worker`, `ci`), one `size/*`. Remove `needs triage` once labeled.
4. **Assign** — `gh issue edit <N> --add-assignee @me`.

## Gotchas

- `gh` active account drifts to `dnp-dohyun` (read-only). If a write fails with a permissions error, run `gh auth switch -u jidohyun` and retry.
- Backticks inside `--body` are shell-interpreted. Use single-quoted heredoc or a body file for bodies containing code.
- Done when: issue exists, carries type+surface+size labels, and is assigned.
