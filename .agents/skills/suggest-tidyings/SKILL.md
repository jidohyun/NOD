---
name: suggest-tidyings
description: Generate small, structural, read-only tidying suggestions from recent non-merge commits in apps/api, apps/worker, and apps/web. Trigger when the user asks for "suggest-tidyings", "tidying suggestions", "최근 커밋 정리 후보", or a post-commit tidying pass; do not use for full code reviews, bug hunts, broad refactors, or applying/committing changes.
---

# Suggest Tidyings

Advisory, read-only pass over recent commits. It reads history, writes suggestion
artifacts under ignored `.omo/tidy/`, and stops. It never changes product code.
It is a narrow tidying pass, not a general code review: it does not diagnose
bugs, audit an entire change, or apply a refactor.

**Invocation is on demand only.** The user asks for it. No hook, no scheduled job,
no root `mise` task, no command alias, no daily quota, no automatic trigger.

## Trigger ownership

Use this skill when the requested outcome is a small, structural suggestion
about recent commits, such as “최근 커밋 정리 후보를 추천해줘” or “suggest
tidying improvements from the last five commits.” A request for a broad review,
bug investigation, code cleanup across the repository, or an applied change
belongs to the corresponding review, debugging, refactoring, or implementation
workflow instead. This boundary keeps a narrow advisory pass from silently
expanding its scope.

## P0 scope

Only these roots are in scope for P0 suggestions:

- `apps/api`
- `apps/worker`
- `apps/web`

Everything else is out of scope: Extension, Mobile, Infra, `packages/**`,
generated output, migrations and schema, dependency manifests, and every proof
surface (`mise.toml`, `commitlint.config.cjs`, Git hooks, `.github/workflows/**`,
formatter and linter configuration). See
[`references/rollout-gates.md`](references/rollout-gates.md) for why the boundary
sits here and what a later expansion would need.

## Flow

1. Select targets. Run `scripts/tidy-target-commits.sh 5 [branch]` from the
   repository root. The default is five commits on `HEAD`. The selector excludes
   merge commits and commits that are already tidyings, and it emits one
   `<sha><tab><subject>` record per line.
   A non-zero selector exit ends the run here; no reviewer is spawned on a
   failed selection.
2. Snapshot worktree state, once, before reading any diff:

   ```sh
   git status --porcelain=v1 --untracked-files=all
   ```

   Every path in that output is dirty and ineligible for the whole run, whatever
   its status code. This one snapshot governs every reviewer, so two reviewers
   cannot disagree about the same file. Mechanics in
   [`references/context-recovery.md`](references/context-recovery.md).
3. Filter to scope. For each target, list its paths with
   `git diff-tree --no-commit-id --name-only -r <commit>`, then drop every path
   that does not start with `apps/api/`, `apps/worker/`, or `apps/web/`
   (`OUT_OF_SCOPE`) and every path hitting an excluded surface in
   [`references/nod-validation.md`](references/nod-validation.md) (`FORBIDDEN`).
   A target with no surviving path is not reviewed and is reported as skipped.
4. Skip commits that already have a complete artifact. Derive the directory name
   with `git rev-parse --short=12 <commit>` — never reuse the selector's display
   SHA as a path component — then check:

   ```sh
   tail -n 1 .omo/tidy/<12-char-short-sha>/suggestions.md
   ```

   Exactly `<!-- AGENT_COMPLETE -->` means complete: skip the commit, spawn no
   reviewer, and do not rewrite the artifact. Anything else, including a missing
   or empty file, is incomplete: discard it and re-review from scratch. An
   incomplete artifact is never treated as a result.
5. Fan out one reviewer per eligible commit, in parallel — one commit per
   reviewer, never one reviewer over several commits. Each reviewer must:
   1. read the commit with `git show <commit>`;
   2. run the per-file drift check for every candidate path:

      ```sh
      git diff <commit>..HEAD -- <file>
      ```

      Non-empty output means the path drifted and is ineligible, recorded as
      `DRIFTED`. Drift is filtered per path, not per commit, so a commit
      touching three files keeps the two that did not drift. Neither
      `git log <commit>..HEAD` nor `git diff HEAD -- <file>` substitutes for
      this check;
   3. hold every surviving suggestion to the seven-part format and the eight
      whitelisted techniques in
      [`references/tidying-guide.md`](references/tidying-guide.md), with the
      validation command copied verbatim from
      [`references/nod-validation.md`](references/nod-validation.md).
6. Write exactly one artifact per reviewed commit, at
   `.omo/tidy/<12-char-short-sha>/suggestions.md`, using the schema in
   [`references/context-recovery.md`](references/context-recovery.md): the
   metadata header, the suggestion bodies, then the sentinel
   `<!-- AGENT_COMPLETE -->` as the exact final line, written last, after the
   full body is on disk. No timestamps anywhere. A reviewed commit with nothing
   eligible writes `suggestion_count: 0` and the sentinel; that per-commit no-op
   is a real answer, not a failure.
7. Aggregate and stop:

   ```sh
   bash .agents/skills/suggest-tidyings/scripts/tidy-aggregate.sh --root .omo/tidy
   ```

   The aggregator reads only `<root>/<12-char-short-sha>/suggestions.md`, groups
   complete artifacts under their commit heading, and reports every other path
   explicitly as `SKIPPED_INCOMPLETE`, `SKIPPED_MISSING`, or
   `SKIPPED_MALFORMED`. With no complete artifact it prints one deterministic
   `NO_OP` line and exits `0`. Report its output together with the skipped
   targets from steps 3-5, then stop.

   Two exits are not results and are never reported as suggestions: `1` for
   invalid usage and `2` for an artifact root that does not exist. Exit `2` means
   either a mistyped `--root` or that step 6 wrote no artifact at all. In the
   second case the run is itself a no-op: report that no eligible commit produced
   an artifact and stop. Never create `.omo/tidy/` just to make the aggregator
   exit `0`, and never treat a missing root as an aggregate result.

## Final report contract

The final response is a report, not a continuation prompt. Include the
aggregator output verbatim, then the target-level skips from steps 3-5 (write
`Target skips: none` when there are none), and finish with this exact final
line:

```text
TIDYING_RUN_COMPLETE
```

Do not add a proposed patch, a commit command, or a “next step” after that
line. Applying a suggestion remains a separate user-directed workflow.

## Stop condition

This skill is read-only and ends at advisory output. It is finished when the
aggregate and the skip list are reported. Never downgrade a validation command,
narrow a test scope, or soften an exclusion to produce a longer report; an empty
report is a legitimate outcome and an invented suggestion is not. Applying a
suggestion is a separate, user-directed step under the P1 gate in
[`references/rollout-gates.md`](references/rollout-gates.md).

## Prohibited

Never do any of the following inside this flow:

- **edit** product code, tests, configuration, or any tracked file. Suggestions
  are text, not patches applied on the user's behalf.
- **commit** anything, including a `tidy:` type. Commit types and scopes are
  fixed by `commitlint.config.cjs`; a later user-applied change uses
  `refactor(api|worker|web): tidy — ...`.
- **merge**, rebase, cherry-pick, push, or open a PR.
- **`--no-verify`**, or any other bypass of a validation gate. Weakening a gate
  to produce green revokes the standing approval in `docs/agent-north-star.md`.
- **hook** installation or modification, including anything under `.git/hooks/`
  or the `git:*` tasks that generate them.
- **CI** changes, including `.github/workflows/**` and any deploy trigger.
- **Slack**, webhook, or any other outbound notification.
- **daily quota** enforcement, cadence, scheduling, or one-tidying-per-day
  bookkeeping. Those belong to P2 and need separate approval.

## References

- [`references/tidying-guide.md`](references/tidying-guide.md): the eight
  whitelisted techniques, suggestion format, and safety caveats.
- [`references/context-recovery.md`](references/context-recovery.md): artifact
  path, `<!-- AGENT_COMPLETE -->` sentinel, dirty and drift exclusion, resume.
- [`scripts/tidy-target-commits.sh`](scripts/tidy-target-commits.sh): the
  deterministic target selector used in step 1.
- [`scripts/tidy-aggregate.sh`](scripts/tidy-aggregate.sh): the deterministic,
  read-only aggregator used in step 7. Run it with `--help` for its contract.
- [`scripts/skill-contract.test.sh`](scripts/skill-contract.test.sh): static
  checks for frontmatter, trigger boundaries, required files, and sentinel
  spelling.
- [`dogfood.md`](dogfood.md): the representative prompt, preserved behavior,
  trigger boundaries, and acceptance evidence for maintaining this skill.
- [`references/nod-validation.md`](references/nod-validation.md): per-app
  validation commands, allowed and excluded roots, commit markers, stop rules.
- [`references/rollout-gates.md`](references/rollout-gates.md): P0, P1, and P2
  boundaries and exit criteria.

## Honest limits

The technique whitelist keeps changes small and reviewable. It does not prove
behavior preservation, and separating structure from behavior does not guarantee
a safe revert. Every suggestion still needs human review and the app-local
validation commands before it lands.
