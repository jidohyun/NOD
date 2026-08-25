# Context Recovery

Reference contract for the `suggest-tidyings` skill. It defines where suggestion
artifacts live, how a run knows an artifact is finished, and which paths a
reviewer must refuse to touch because the worktree or later history moved under
them.

Two failures motivate this file. A run that dies halfway leaves a truncated
artifact that looks like a result, and a suggestion written against a region the
user has already edited points at code that no longer exists. Both are caught by
mechanical checks, not by judgment.

Nothing here authorizes a write outside `.omo/tidy/`.

## Artifact location

One directory per reviewed commit, one suggestion file inside it:

```text
.omo/tidy/<short-sha>/suggestions.md
```

`<short-sha>` is the **stable 12-character** abbreviation of the target commit,
produced by:

```sh
git rev-parse --short=12 <commit>
```

Twelve characters, always, for every commit in every repository state. Git's
default abbreviation length is dynamic: it grows as the object count grows, and
`core.abbrev` can change it per repository or per user. A directory named from
`%h` or from a bare `--short` would be a different string tomorrow, and resume
would stop finding yesterday's work. So the reviewer never reuses the selector's
display SHA as a path component. The selector's job is to print records for
humans; path derivation goes through `git rev-parse --short=12` on its own.

Rules for the artifact root:

- One directory per commit. Never one shared file with sections per commit.
- Never a second file name for results. `suggestions.md` is the only file the
  aggregator reads. Scratch notes, if any, use a different name and are ignored.
- Never a nested path deeper than `<short-sha>/suggestions.md`.
- Never a run identifier, date, or counter in the directory name. The commit SHA
  is the identity.

## The completion sentinel

A finished artifact ends with this exact line, byte for byte:

```text
<!-- AGENT_COMPLETE -->
```

Placement is exact, and every part of it is load-bearing:

- It is the **final line** of the file. Nothing follows it, not a blank
  paragraph, not a trailing note, not another heading.
- It is checked with `tail -n 1 <file>`, and the comparison is exact string
  equality against `<!-- AGENT_COMPLETE -->`.
- It is written **last**, after the full body is on disk. Writing the sentinel
  first, or writing it alongside a partially formed body, defeats the whole
  mechanism.
- It is a comment, so it stays invisible in rendered Markdown while remaining
  trivially greppable.

The sentinel is a marker of completion, not of correctness. It says one reviewer
finished writing the artifact and every suggestion in it satisfied the format in
`tidying-guide.md`. It says nothing about whether applying a suggestion is a
good idea.

## Artifact schema

A complete `suggestions.md` has a metadata header, then the suggestion bodies,
then the sentinel. Every field below is required.

Per-commit metadata header:

| Field | Value |
| --- | --- |
| `commit` | full 40-character SHA of the target commit |
| `short_sha` | the 12-character `git rev-parse --short=12` value, matching the directory name |
| `subject` | the commit subject, verbatim from `%s` |
| `app_root` | exactly one of `apps/api`, `apps/worker`, `apps/web` |
| `reviewed_paths` | every path from the commit the reviewer actually read |
| `excluded_paths` | every path from the commit the reviewer refused, each with a reason token |
| `suggestion_count` | the number of complete suggestions in the body, `0` for a per-commit no-op |

Reason tokens for `excluded_paths`, one per entry, no free-form substitutes:

- `DIRTY`: the file has uncommitted changes in the worktree.
- `DRIFTED`: a commit after the target changed the file.
- `OUT_OF_SCOPE`: the path lies outside the three P0 app roots.
- `FORBIDDEN`: the path hits an exclusion in `nod-validation.md`, such as a
  generated file, a migration, or a proof surface.

Body: zero or more suggestions, each carrying all seven parts required by
[`tidying-guide.md`](tidying-guide.md), which are the `file_path:line_range`
token, the one-sentence description, `(reason: ...)`, the whitelisted technique
name, minimal before and after snippets, the safety rationale, and the exact
validation command from [`nod-validation.md`](nod-validation.md).

Shape:

```markdown
# Tidying suggestions: 48be05f1d985

- commit: 48be05f1d985c0ffee0123456789abcdef012345
- short_sha: 48be05f1d985
- subject: feat(api): add clip ingest endpoint
- app_root: apps/api
- reviewed_paths: apps/api/src/routers/clips.py
- excluded_paths: apps/api/alembic/versions/0007_add_clips.py (FORBIDDEN), apps/api/src/lib/auth.py (DIRTY)
- suggestion_count: 1

## Suggestions

apps/api/src/routers/clips.py:41-52 — ... (reason: ...)
Technique: Guard Clauses

before:
  ...

after:
  ...

Safety: ...
Validation: mise //apps/api:lint && mise //apps/api:typecheck && mise //apps/api:test

<!-- AGENT_COMPLETE -->
```

An artifact with zero suggestions is still a legitimate complete result. It
records that the commit was reviewed and nothing eligible was found, sets
`suggestion_count: 0`, and ends with the sentinel like any other. That is a
per-commit no-op, and it is a real answer, not a failure.

**No timestamps anywhere.** Not in the directory name, not in the header, not in
the run summary. A timestamp makes two runs over the same commit produce
different bytes, which turns a resumable artifact into a moving target and makes
diffing two runs useless. The commit SHA plus the content is the whole identity.
Mtime on disk is available if anyone genuinely needs it.

## Incomplete artifacts

An artifact is **incomplete** whenever any of these holds:

- `suggestions.md` does not exist.
- Its final line is not exactly `<!-- AGENT_COMPLETE -->`.
- It exists but is empty.

Handling is uniform and non-negotiable:

- **Never treated as a result.** An incomplete artifact contributes zero
  suggestions to the aggregate, no matter what text sits in it. Half a suggestion
  is not a suggestion.
- **Never reused.** A resumed run does not read an incomplete artifact, does not
  parse it for partial findings, does not append to it, and does not trust any
  metadata in its header. The commit is re-reviewed from scratch and the file is
  rewritten in full.
- **Reported explicitly.** The aggregator names the path and marks it
  `SKIPPED_INCOMPLETE`. It is never silently dropped, because a silent drop is
  indistinguishable from a commit nobody selected.

Truncation is expected, not exceptional. A reviewer can be interrupted, hit a
context limit, or fail mid-write. The contract makes that outcome loud and
harmless instead of quietly wrong.

## Dirty-state capture

Before any diff is read, snapshot the worktree once:

```sh
git status --porcelain=v1 --untracked-files=all
```

The flags are pinned deliberately. `--porcelain=v1` gives a stable, parseable
format that doesn't shift with Git versions or user config, and
`--untracked-files=all` lists individual untracked files rather than collapsing
them into a directory entry, so a new file inside a partially untracked
directory is still visible.

Every path in that output is **dirty**, whichever status code it carries:
modified, staged, added, deleted, renamed, unmerged, or untracked. A dirty file
is ineligible for the whole run, with no line-level exception. Line numbers in
the artifact refer to committed content, and an uncommitted edit invalidates
them silently, so "the user only changed a different function" is not a
distinction this contract makes.

Take the snapshot once, at the start, and reuse it for the whole run. Re-reading
mid-run makes eligibility depend on when a reviewer happened to look, and
different reviewers would then disagree about the same file.

## Post-target commit drift

A commit selected for review may not be the last commit touching its files. For
every path in the target commit, check drift against the current tip:

```sh
git diff <commit>..HEAD -- <path>
```

Non-empty output means the path **drifted**: some commit after the target changed
it. A drifted path is ineligible.

The reason is mechanical, and NOD has already measured it. The local experiment
in `.omo/ulw-research/20260815-071712/verify-revertability.md` showed that
revertability turned on last-touch position and line overlap, not on how commits
were labeled: reverting an earlier commit whose region a later commit had
rewritten produced a conflict, while a disjoint region reverted cleanly. Line
ranges from a non-last-touch commit describe code that may no longer be there.
`.omo/ulw-research/20260815-071712/SYNTHESIS.md:240-265` records the same
finding.

Apply drift filtering per path, not per commit. A target commit touching three
files where one drifted keeps the other two eligible, and the drifted one is
recorded in `excluded_paths` with the `DRIFTED` token.

Do not substitute a weaker check. `git log <commit>..HEAD` tells you commits
exist after the target, which says nothing about the paths involved.
`git diff HEAD -- <path>` compares the worktree to the tip, which is the dirty
check, not the drift check. The pinned form, `git diff <commit>..HEAD -- <path>`,
is the one that answers this question.

## No-overwrite protection

The run writes only inside `.omo/tidy/`. Nothing else on disk is a legitimate
write target.

- **Never write outside `.omo/tidy/`.** Not product code, not tests, not
  configuration, not documentation, not a report next to the source it discusses.
- **Never touch a dirty file, in any way.** A file carrying uncommitted user work
  is not read for line ranges, not reformatted, not staged, not stashed, not
  normalized, not "cleaned up while we're here". Suggestions about it are
  withheld from this run entirely.
- **Never stash, reset, checkout, or clean** to obtain a tidy worktree. Producing
  a clean state destroys uncommitted work that exists nowhere else. If the
  worktree is dirty, the dirty paths are excluded and the run continues on
  what's left.
- **Never stage or unstage anything.** The index belongs to the user.
- **Only ever rewrite `.omo/tidy/<short-sha>/suggestions.md` whole**, and only
  when re-reviewing that commit. No in-place append to an existing artifact.

A pre-existing dirty file that the run never mentions is the correct outcome, not
a gap. The user's uncommitted work outranks any suggestion this skill could make.

## Safe resume

A re-run over the same targets behaves the same way every time:

1. Recompute `<short-sha>` for each selected commit with
   `git rev-parse --short=12`. Never carry a path over from an earlier run's
   output.
2. Re-take the dirty snapshot with
   `git status --porcelain=v1 --untracked-files=all`. Worktree state may have
   changed since the previous run, and the fresh snapshot wins.
3. Re-check drift with `git diff <commit>..HEAD -- <path>`. `HEAD` may have moved,
   which can make a previously eligible path drifted.
4. For each commit, check `tail -n 1 .omo/tidy/<short-sha>/suggestions.md`:
   - equal to `<!-- AGENT_COMPLETE -->`: complete. Skip the commit, spawn no
     reviewer, and reuse the artifact as-is. Do not rewrite it.
   - anything else, including a missing file: incomplete. Discard it and
     re-review the commit from scratch, writing the file in full.
5. Aggregate over complete artifacts only, and report every skipped, incomplete,
   and no-op result by path.

Resume is therefore idempotent for finished work and repeats only what didn't
finish. Because no timestamps are involved, a second run over an unchanged
repository produces byte-identical artifacts.

One caveat worth stating plainly: a complete artifact is reused without being
re-validated against current worktree or history state. If `HEAD` advanced or the
user edited a file after that artifact was written, its line ranges may be stale.
Reuse means "this reviewer finished", not "these line numbers are still correct".
The user reads the suggestion and confirms the region before applying anything,
and the validation commands in `nod-validation.md` run before it lands.

## `.omo/tidy/` is runtime-only

`.omo/` is ignored by `.gitignore:72`, so everything under `.omo/tidy/` is
**runtime-only and untracked** by construction.

What that means in practice:

- Artifacts are never staged, never committed, and never included in a tracked
  diff. No `git add -f`, no exception for "just the summary".
- `.omo/tidy/` is disposable. Deleting it loses no tracked state, and the next
  run rebuilds what it needs.
- Artifacts are not documentation. Nothing under `docs/` or in a tracked
  reference should link to a path under `.omo/tidy/`.
- `git diff --check` on these files proves nothing, because Git isn't tracking
  them. Existence and content checks (`test -s`, `tail -n 1`, a token assertion)
  are the acceptance signal.
- Evidence for a task run goes to `.omo/evidence/`, separate from suggestion
  artifacts. The two directories don't mix.
