# Rollout Gates

Reference contract for the `suggest-tidyings` skill. It fixes what the current
phase is allowed to do, what the next phase would require, and what stays behind
an explicit new approval. The phases are gates, not a schedule. Nothing here
promises that P1 or P2 ever happens.

Three phases, one direction:

| Phase | What it is | Status |
| --- | --- | --- |
| **P0** | Read-only suggestions over `apps/api`, `apps/worker`, `apps/web` | the only implemented phase |
| **P1** | The user applying selected suggestions by hand, with full app validation | not implemented, no automation |
| **P2** | Any expansion: cadence, Slack, hook, CI, other apps, auto-apply | deferred, needs new approval |

A gate is passed by evidence, not by elapsed time or by a sense that the flow
"seems to work". Each section below lists the exact checks.

## P0: read-only three-app suggestions

P0 is the whole current skill. It selects recent commits, reads history, writes
advisory artifacts under ignored `.omo/tidy/`, reports, and stops.

Roots: `apps/api`, `apps/worker`, `apps/web`. Nothing else, per
[`nod-validation.md`](nod-validation.md).

### P0 success criteria

All five must hold for a run to count as a success. Any one of them failing is a
no-go for that run.

1. **Deterministic target selection.** `scripts/tidy-target-commits.sh <count>
   [branch]` returns the same records, in the same order, for the same repository
   state. Merge commits are excluded, `tidy:` subjects are excluded, and the
   three legal `refactor(api|worker|web): tidy` markers are excluded. Two runs
   over an unchanged `HEAD` produce byte-identical selector output.
2. **Zero forbidden-path suggestions.** Every suggestion path starts with
   `apps/api/`, `apps/worker/`, or `apps/web/`, and none hits an excluded surface
   from [`nod-validation.md`](nod-validation.md): other apps, `packages/*`, proof
   surfaces, generated files, migrations and schema, cross-app contracts,
   ordering-sensitive async code, dependency manifests, repository root and docs.
   A single forbidden path in the aggregate is a no-go, not a warning.
3. **Complete sentinel-bearing artifacts.** Every commit the run claims to have
   reviewed has `.omo/tidy/<short-sha>/suggestions.md` whose final line is
   exactly `<!-- AGENT_COMPLETE -->`, checked with `tail -n 1`. Artifacts without
   the sentinel are reported as `SKIPPED_INCOMPLETE` and contribute nothing, per
   [`context-recovery.md`](context-recovery.md).
4. **Unchanged product-file status.** `git status --porcelain=v1
   --untracked-files=all` and `git diff --name-only` are identical before and
   after the run, apart from new paths under `.omo/`. No file was edited, staged,
   unstaged, stashed, reset, checked out, cleaned, or committed. Pre-existing
   dirty paths stay exactly as the user left them.
5. **Explicit no-op handling.** When no eligible commit exists, the run says so
   in one deterministic line and exits successfully. An empty selection, an
   all-excluded selection, and a selection where every commit already has a
   complete artifact are each a stated no-op, never silence and never an invented
   suggestion to fill the report.

A per-commit artifact with `suggestion_count: 0` is also a legitimate no-op. It
means the commit was reviewed and nothing eligible was found.

### P0 evidence

Each criterion has one mechanical check. The evidence for a run is these command
results, not a narrative.

| Criterion | Check |
| --- | --- |
| Deterministic selection | run the selector twice on unchanged `HEAD`, `diff` the two outputs, expect no difference |
| Zero forbidden paths | list every `file_path` in the aggregate, assert each starts with an allowed root and matches no exclusion |
| Complete artifacts | `tail -n 1 .omo/tidy/<short-sha>/suggestions.md` equals `<!-- AGENT_COMPLETE -->` for every reported commit |
| Unchanged product files | `git status --porcelain=v1 --untracked-files=all` and `git diff --name-only`, captured before and after, compared |
| No-op handling | with no eligible commit, the run prints its no-op line and exits `0` |

`git diff --check` proves nothing about artifacts under `.omo/tidy/`, since Git
does not track them. Existence and content checks are the signal.

### P0 stop conditions

Stop the run, report what you have, and suggest nothing further when any of these
appears:

- The selector exits non-zero, including a bad count or an unknown revision. No
  reviewer is spawned on a failed selection.
- A candidate path lies outside the three P0 roots or hits an excluded surface.
  That candidate is dropped with a reason token; it never becomes a suggestion.
- The file is dirty or the region drifted after the target commit. Dropped, with
  `DIRTY` or `DRIFTED` recorded.
- The candidate would need a migration, a schema change, or a dependency change.
- The applicable validation command does not exist for that app, so no suggestion
  in it can be validated as written.
- Landing the change would require adding or altering a `mise` task, a hook, a
  workflow, or a commitlint rule. Editing a proof surface is a P2 conversation,
  and `docs/agent-north-star.md:21-45` puts it behind fresh-eye review.
- The run has produced its advisory output. That is the end of P0, always.

### P0 no-go

A run is **no-go** when any success criterion fails. Specifically:

- a forbidden or out-of-root path reached the suggestion list, or
- a reported commit's artifact lacks the exact final-line sentinel, or
- product-file status changed, or
- the selector was non-deterministic across two identical-state runs, or
- an empty or fully excluded selection was reported as anything other than a
  stated no-op.

A no-go outcome means: report the failing criterion by name, keep the artifacts
for inspection, apply nothing, and do not advance toward P1. A no-go is not fixed
by rerunning until the output looks better. Nothing about a no-go authorizes an
edit outside `.omo/tidy/`.

### Safe boundaries for dirty and drifted paths

The worktree is expected to be dirty. NOD carries uncommitted work routinely, and
that work outranks every suggestion this skill could produce.

- Dirty paths, from `git status --porcelain=v1 --untracked-files=all`, are
  ineligible for the whole run, whatever their status code. No line-level
  exception, no "the user only touched another function".
- Drifted paths, where `git diff <commit>..HEAD -- <path>` is non-empty, are
  ineligible per path. A target commit touching three files keeps the two that
  did not drift.
- Never stash, reset, checkout, or clean to obtain a tidy worktree. Never stage
  or unstage. The index belongs to the user.
- A pre-existing dirty file the run never mentions is the correct outcome, not a
  coverage gap.
- The one snapshot taken at the start governs the whole run, so two reviewers
  cannot disagree about the same file.

Full mechanics live in [`context-recovery.md`](context-recovery.md).

## P1: user-applied suggestions

P1 is not automation. It is the user reading a P0 suggestion, deciding it is
worth applying, and applying it in an ordinary app-scoped change. The skill's
role ends at the proposal.

P1 requires all of the following:

1. **Explicit user application.** The user picks the suggestion and makes the
   edit. The skill never edits, never stages, never commits, never opens a PR on
   the user's behalf. An agent may assist only under a separate, direct request,
   and that request is not this skill.
2. **App-specific validation.** All three commands for the affected app, run and
   green on that checkout, taken verbatim from
   [`nod-validation.md`](nod-validation.md):
   - `apps/api`: `mise //apps/api:lint`, `mise //apps/api:typecheck`,
     `mise //apps/api:test`
   - `apps/worker`: `mise //apps/worker:lint`,
     `cd apps/worker && uv run poe typecheck`, `mise //apps/worker:test`
   - `apps/web`: `mise //apps/web:lint`, `mise //apps/web:typecheck`,
     `mise //apps/web:test`

   A lint-only run is not validation. No `--no-verify`, no narrowed test scope,
   no weakened hook. Doing any of those revokes the standing approval in
   `docs/agent-north-star.md:35-45`.
3. **A legal commit.** One app per commit, subject in the form
   `refactor(<legal-scope>): tidy — ...`, where `<legal-scope>` is one of `api`,
   `worker`, or `web`. That gives exactly three legal subjects:

   ```text
   refactor(api): tidy — ...
   refactor(worker): tidy — ...
   refactor(web): tidy — ...
   ```

   `commitlint.config.cjs:4-12` fixes the type and scope enums. `tidy:` is not a
   legal type and is never introduced. No new scope, no new type, no branch
   convention change. `.omo/ulw-research/20260815-071712/SYNTHESIS.md:377-415`
   records the same decision: `refactor(<legal-scope>): ...`, no `tidy:` type, no
   daily quota.

P1 does not add a review-free commit lane. Pushing an app path to `main`
triggers the deploy workflow for that app
(`docs/static-harness.md:127-135`), so a P1 commit that reaches `main` is an
irreversible boundary and follows the push discipline in
`docs/agent-north-star.md:21-34`: confirm the run in a channel other than the
push exit code. `.omo/ulw-research/20260815-071712/SYNTHESIS.md:313-327` makes
the same point about NOD specifically. Daily app-code tidying here is not a
"small commit without review"; it is a push with external effects.

If a P1 change surfaces `UndefinedTableError` or `relation ... does not exist`,
stop and treat migration drift first, per `apps/api/AGENTS.md:19-24`. A tidying is
never the fix for that error.

## P2: everything else, deferred

P2 is any expansion beyond read-only suggestions in three apps. It is deferred.
It requires a **new explicit approval from the user** plus a proof-surface review
under `docs/agent-north-star.md:21-45`, because most of these items change the
code that renders verdicts.

Deferred, each one needing its own approval:

- **Cadence.** One tidying per day, any quota, any streak, any scheduled trigger,
  any bookkeeping that counts tidyings. The external routine that inspired this
  flow ran on a daily rhythm (`docs/research/stdy-blog-tidying-flow.md:8-9,42-60`);
  NOD has not adopted it, and
  `.omo/ulw-research/20260815-071712/SYNTHESIS.md:377-382` records `daily quota:
  도입하지 않음`.
- **Slack and other notifications.** Webhooks, channel posts, dashboards, any
  outbound announcement of a tidying.
- **Hooks and CI.** Anything under `.git/hooks/**`, the `git:*` generators in
  `mise.toml`, `.github/workflows/**`, commitlint rules, formatter or linter
  configuration. `docs/static-harness.md:149-155` sends CI gap work through the
  fresh-eye rule; that path is not this skill's.
- **Extension, Mobile, Infra.** `apps/extension`, `apps/mobile`, `apps/infra`,
  and `packages/*`. Extension has no root lint or test task at all
  (`docs/static-harness.md:92-93`), Mobile validates through Flutter and
  Fastlane, Infra is Terraform. Expanding into them requires a validation matrix
  that does not exist yet.
- **Auto-apply.** Any path where the skill edits, stages, commits, merges,
  cherry-picks, pushes, or opens a PR. Including "just the trivial ones".
  Including a confirmation prompt. The external source's own forward-looking note
  about eventual automatic tidying
  (`docs/research/stdy-blog-tidying-flow.md:29`) is an outside aspiration, not
  a NOD plan.
- **Wider technique whitelist.** The eight in [`tidying-guide.md`](tidying-guide.md)
  are the whole list. Adding Beck's remaining named tidyings is a P2 decision.

Approving one P2 item approves that item only. There is no bundle and no implicit
graduation: passing P0 does not authorize P1, and doing P1 well does not
authorize P2.

### What would have to be true first

Nobody should read this as a roadmap with a green light at the end. If a P2
conversation ever happens, it starts from measured facts, and
`.omo/ulw-research/20260815-071712/SYNTHESIS.md:390-403` says which ones: a
recorded baseline before the change, not an after-the-fact impression. Without a
baseline or a counterfactual, no expansion argument gets to claim improvement.

## What this document does not claim

- **No causal ROI.** Tidying has no demonstrated return on investment in this
  codebase. There is no randomized or before-and-after comparison of tidy-first
  against behavior-first here, so no phase of this rollout is justified by
  "fewer bugs", "faster review", or "higher productivity".
  `.omo/ulw-research/20260815-071712/SYNTHESIS.md:390-403` keeps that question
  open on purpose (`C-053`, left unresolved deliberately).
- **No revertability guarantee.** Separating structural from behavioral changes
  does not make a revert clean. The local experiment in
  `.omo/ulw-research/20260815-071712/verify-revertability.md` showed outcomes
  turning on line overlap and last-touch position, not on commit labels. What
  separation buys is finer rollback granularity and easier diagnosis.
- **No behavior-preservation proof.** Passing a gate here means the gate was
  green on that checkout. It does not mean a suggestion preserves behavior, and a
  technique name proves nothing on its own.
- **No graduation promise.** P1 and P2 are described so their boundaries are
  legible. Describing them is not planning them, and this file implements
  neither.
