# Dogfood

Representative prompts this skill must keep handling, with the evidence that
decided acceptance. Re-run these after editing `SKILL.md` or the scripts.

## 1. Split a mixed tree (the case the skill was written from)

**Prompt** — “쪼개서 커밋해줘”, against a tree holding a new local quality
harness, rewritten agent documents, an added skill, 130 deleted skills with 32
dangling symlinks, and 15 deleted legacy plan documents.

**Expected** — the agent accounts for every pending entry, proposes groups by
surface, confirms the split, and produces five commits that each pass the real
hooks, leaving a clean tree and no stash.

**Accepted because** — commits `1e970b3`, `f26af3e`, `a337d68`, `4bd9351`,
`a797c61` on `main` (2026-08-25) landed in that order with the working tree
clean and `git stash list` empty afterwards.

## 2. Refuse an incomplete plan

**Prompt** — the same request, but with a plan that omits a pending deletion.

**Expected** — the run stops before the first commit and names the unassigned
path, rather than committing the groups it does have and leaving a change that
blocks the next commit with `DIRTY_WORKTREE`.

**Accepted because** — `scripts/split-commit.test.sh` covers this as
“unassigned change refused”, “unassigned change named”, and “nothing committed
on refusal”.

## 3. Survive a red gate

**Prompt** — the same request, where a gate rejects the first group.

**Expected** — that group is rolled back, the stashed remainder is restored, the
run stops with the gate named, and no commit is made.

**Accepted because** — `scripts/split-commit.test.sh` covers this as “rejected
commit aborts”, “no commit made”, “both changes restored”, and “no stash left
after abort”.

## Known trap the skill exists to prevent

`git stash push -- <pathspec>` records the **index** as well as the worktree.
Staging a group and then stashing the remainder pushes the staged tree into the
stash, and popping after the commit conflicts with what was just committed. The
script always stashes before staging; do not reorder those two steps.
