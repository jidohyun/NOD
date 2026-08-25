---
name: split-commit
description: Split a large pending working tree into several gated commits under the local quality harness, which rejects partial commits. Trigger when the user asks to "쪼개서 커밋", "커밋 나눠줘", "split these changes into commits", or wants a big uncommitted tree landed as a readable history; do not use for a single-group commit, for writing one commit message, for pushing, or for deciding whether a change is correct.
---

# Split Commit

Land one large pending working tree as several commits, each of which really
passes the local gates. It groups changes, commits them one at a time against a
clean tree, and stops. It does not decide whether the code is right, and it does
not push.

## Trigger ownership

Use this skill when the outcome is several commits out of one dirty tree, such as
“이거 쪼개서 커밋해줘” or “split this into a harness commit and a docs commit.”
A single commit of everything needs no skill — just commit. Review of the change
belongs to the review workflow, and landing or deploying belongs to the ship
workflow. Keeping that boundary stops a mechanical commit pass from turning into
an unrequested review.

## Why this is not just `git add` twice

`scripts/quality/plan.py` maps every path to a **surface** and refuses any commit
whose staged surfaces overlap its *unstaged* surfaces, reporting `DIRTY_WORKTREE`.
Because nearly every non-app path maps to `root` or `quality`, an ordinary partial
commit is blocked. The way through is to make the tree honestly clean for each
group: stash everything else, commit, restore.

## Surfaces that decide the grouping

| Surface | Paths |
|---|---|
| `quality` | `scripts/quality/**` plus the proof paths `mise.toml`, `commitlint.config.cjs`, `AGENTS.md`, `docs/agent-north-star.md`, `docs/static-harness.md` |
| `api` / `worker` / `web` / `mobile` / `extension` | the matching `apps/<name>/**` |
| `packages` | `packages/**` |
| `root` | `apps/infra/**`, any top-level file, and anything under `.agents`, `.github`, `.opencode`, `docs`, `scripts`, `templates`, `vault`, and the other root directories |

Two grouping rules follow from the harness and are not negotiable:

- **Proof paths ride with the harness commit.** They are the `quality` surface, so
  splitting `mise.toml` or `AGENTS.md` away from a `scripts/quality/**` change
  blocks both commits.
- **The harness commit must also carry the documents its own tests read.**
  `quality:contracts` asserts that `docs/static-harness.md`, `docs/handoff.md`,
  `docs/agent-north-star.md`, `docs/lessons.md`, `AGENTS.md`, and `SECURITY.md`
  exist in the worktree, and that every relative link in them resolves. Stashing
  one of them away turns the harness commit red for a reason that looks unrelated.

## Flow

1. Read the pending tree — `git status --porcelain` — and account for every entry.
   Deletions and untracked files count.
2. Draft the groups with the user before committing anything. Group by surface
   first and by intent second, and confirm the split; the grouping is the part a
   person owns.
3. Write a plan file. `== ` starts a group and carries its commit subject; the
   lines under it are paths, directories included:

   ```text
   == build(root): 로컬 품질 하네스와 게이트 계약 도입
   mise.toml
   scripts/quality
   AGENTS.md
   docs/static-harness.md
   == docs(root): 에이전트 라우팅 테이블 정리
   CLAUDE.md
   ```

4. Check the split with `scripts/split-commit.sh <plan> --dry-run`. It refuses
   when any pending change belongs to no group, which is the check that catches a
   forgotten deletion before it blocks a later commit.
5. Run `scripts/split-commit.sh <plan>`. Each group is stashed clear, staged,
   committed through the real hooks, and restored. A rejected gate rolls that
   group back and stops, leaving the tree as it was.

## Commit messages

`commitlint` enforces `<type>(<scope>): <subject>` with type in
`feat|fix|docs|style|refactor|perf|test|build|ci|chore` and scope in
`api|web|mobile|worker|infra|deps|docs|root|main`. `subject-case` is
**lower-case**, so a Latin acronym in the subject fails — write `nod`, not `NOD`.
Harness, agent-document, and vault changes use `docs(root)` or `build(root)`.

## When a gate rejects a group

The receipt under `.omo/quality/<phase>/<pid>/` records `COMMAND_FAILED` and the
gate name, but deliberately discards stderr, so it will not say why. Re-run the
gate directly to see the failure, for example `mise run quality:contracts`.

If it passes directly but fails inside the hook, the difference is the
environment: Git exports `GIT_DIR`, `GIT_INDEX_FILE`, and friends to hooks, and
gates that build their own fixture repositories break when those leak.
Reproduce it with `GIT_DIR=.git GIT_INDEX_FILE=.git/index mise run quality:contracts`.

## What this skill does not do

It does not push, amend, rebase, or drop commits; it does not use `--no-verify`,
because a commit that skipped the gates is the thing the harness exists to
prevent; and it does not fix a failing gate on its own — a red gate is reported
to the user with the reason, and fixing it is a separate decision.
