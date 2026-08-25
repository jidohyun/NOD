# Tidying Guide

Reference contract for the `suggest-tidyings` skill. One reviewer reads one
commit with this guide and produces advisory suggestions only. Nothing here
authorizes an edit, a stage, a commit, or a push.

The guide is scoped to NOD's P0 roots: `apps/api`, `apps/worker`, `apps/web`.
Anything outside those three roots is out of scope, no matter how tidy it
would look afterward.

## What a tidying is here

A tidying is a very small structural change that makes code easier to read for
the next person or agent touching it. It isn't a refactoring project, isn't a
cleanup sweep, and isn't preparation for some vague future.

Source of the whitelist below: the pinned external guide at
`corca-ai/claude-plugins@08983e0a` (`plugins/cwf/skills/refactor/references/tidying-guide.md`),
corroborated locally by `.omo/ulw-research/20260815-071712/SYNTHESIS.md:83-104`,
which lists Beck's fifteen named tidyings. NOD deliberately uses a narrower
eight. If the pinned URL is unreachable, the inline list below is authoritative.
Don't widen it, don't merge in the other seven names, don't invent variants.

## The eight techniques (ordered whitelist)

Only these eight may be named in a suggestion. A candidate that fits none of
them is not a suggestion, it's a proposal for separate work.

1. **Guard Clauses** — flatten nested conditionals with early returns, keeping
   every branch outcome identical.
2. **Dead Code and/or Comments Removal** — delete code or comments that no
   caller, test, reflection path, or generator references.
3. **Normalize Symmetries** — make logic that already does the same thing look
   the same, without altering what any branch computes.
4. **New Interface, Old Implementation** — add a pass-through entry point that
   delegates to the existing code, leaving current callers untouched.
5. **Reading Order** — move declarations so the file reads top-down in the
   order a reader needs them.
6. **Explaining Variables** — bind a complex expression to a descriptively
   named local so the condition reads as prose.
7. **Extract Helper** — pull a small block with one clear purpose into a
   private helper in the same module.
8. **Explaining Comments** — add a short comment where the intent behind
   correct-but-opaque code isn't recoverable from the code alone.

Technique names are candidate labels, not verdicts. Naming a technique proves
nothing about the change. Each suggestion still has to pass the NOD caveats
below on its own evidence.

## Suggestion output format

Every suggestion, without exception, contains all seven parts:

1. `file_path:line_range` as the opening token, e.g. `apps/api/src/lib/auth.py:120-134`.
2. A one-sentence description of the change, on the same line, after an em dash.
3. `(reason: ...)` in parentheses at the end of that line, saying why it helps
   and why it looks low-risk here.
4. The technique name, copied verbatim from the whitelist.
5. Minimal `before` and `after` snippets. Only the lines that carry the change.
   No whole functions, no whole files.
6. A safety rationale that cites the specific caveat checks performed, naming
   the callers, exports, or contracts inspected.
7. The exact validation command the user would run if they choose to apply it,
   taken from `nod-validation.md`. Never a substitute or a shortened form.

Shape:

```
apps/web/src/lib/foo.ts:42-47 — Replace the nested conditional with an early return (reason: removes two levels of nesting, all branch outcomes unchanged)
Technique: <whitelist entry 1>

before:
  if (user) {
    if (user.active) { return render(user); }
  }
  return null;

after:
  if (!user?.active) { return null; }
  return render(user);

Safety: local function, not exported, no callers outside this module; no await
or lock crossed; null-path result identical.
Validation: mise //apps/web:lint && mise //apps/web:typecheck && mise //apps/web:test
```

A suggestion missing any of the seven parts is incomplete and gets dropped, not
patched up with guesses.

## Atomicity and easy review

- **One change, one suggestion.** If applying it requires a second edit
  somewhere else to keep things consistent, it's too big. Split or drop it.
- **Independently applicable.** Each suggestion stands alone as a single small
  commit. Suggestions must not depend on each other's ordering.
- **Reviewable at a glance.** Someone unfamiliar with the file should be able to
  read the diff and see that nothing moved that shouldn't have. A diff that
  needs a walkthrough is too big.
- **Two or three per commit, at most.** More than that means the reviewer is
  sweeping rather than tidying.
- **Read-only.** Produce text. The user decides what, if anything, gets applied.

## NOD-specific caveats

These come from real NOD surfaces mapped in
`.omo/ulw-research/20260815-071712/SYNTHESIS.md:221-265,409-415`. Each is a
stop condition: if you can't rule it out with evidence you actually gathered,
don't suggest the change.

**Exports and module boundaries.** A symbol exported from its module may have
callers you didn't read: other apps, tests, generated clients, dynamic imports.
Renaming, reordering parameters, or deleting anything reachable from an export
is a contract change. Grep for the symbol across all three roots before you
call it local.

**Cross-app contracts.** `apps/api` and `apps/worker` define overlapping data
models independently, and the API's OpenAPI output feeds Orval-generated Web
clients. Field names, JSON keys, DB column mappings, Pydantic wire names, and
anything reachable through `gen_openapi.py` are behavior, not structure. A
"rename for clarity" here breaks a wire.

**Import order.** Python import order can carry registration side effects
(decorator registries, DI providers, plugin discovery). TypeScript import order
can carry module-init side effects. Moving imports isn't a formatting decision
unless you've confirmed no module executes at import time.

**Decorators and metaprogramming.** Decorators, dependency injection, ABC and
provider hierarchies, and anything reading `__name__` (see `rate_limit.py`) bind
by name or by definition order. Extraction, reordering, and renaming near
these can change dispatch without changing any visible logic.

**Declaration and initialization.** Moving a declaration also moves when it's
initialized. Module-level constants, class attributes, singletons, and cached
clients can shift construction time or bind different state. Positional
construction is another trap: today's call sites use keywords, but a dataclass
without `kw_only` gives no such guarantee.

**Async ordering.** Anything crossing `await`, `asyncio.Lock`, a transaction
boundary, a scheduler tick, or queue ordering is interleaving-sensitive. The
JWKS cache check-then-fetch in `apps/api/src/lib/auth.py` is the canonical NOD
example: hoisting a guard past the lock changes concurrency, not just shape.

**Implicit observables.** Log lines, metric names, error message strings, trace
span names, and exception types are consumed by dashboards, alerts, and
sometimes by client parsing. They look like incidental text and behave like an
interface.

**Green tests aren't clearance.** Passing tests don't cover reflection, dynamic
dispatch, concurrency, or serialization contracts. Coverage gaps are exactly
where these caveats bite.

## Exclusions

The root and surface exclusions are mirrored in
[`nod-validation.md`](nod-validation.md); update both contracts together if
the P0 boundary changes.

Never suggest a change touching:

- **Generated files.** `openapi.json`, Orval output, mobile generated clients,
  lockfiles, and anything a generator overwrites.
- **Migrations and schema.** Alembic migrations, DDL, model changes carrying a
  column mapping. If a suggestion would need a migration to land, it's ineligible.
  Don't run migrations as part of tidying.
- **Public contracts.** Cross-app API surfaces, DB keys, JSON wire keys, queue
  payloads, and any symbol reachable from generated output.
- **Proof surfaces.** `mise.toml`, `commitlint.config.cjs`, Git hooks,
  `.github/workflows/**`, formatter and linter configuration. Editing the thing
  that judges you isn't tidying.
- **Ordering-sensitive async code.** See the async caveat above.
- **Files outside the three P0 roots.** Extension, Mobile, Infra, packages,
  scripts, docs, and repository root files are out of scope for P0.
- **Dirty or drifted regions.** Files with uncommitted user changes, and regions
  the target commit touched that later commits changed again. See
  `context-recovery.md`.

## What this guide does not claim

- No technique in the whitelist proves behavior preservation. There is no such
  proof available from a name, a diff shape, or a green suite. Every suggestion
  is a candidate carrying residual risk, and it says so.
- Separating structural from behavioral commits does not make a revert clean.
  Local experiments in `.omo/ulw-research/20260815-071712/verify-revertability.md`
  showed that outcomes turned on line overlap and last-touch position, not on
  commit labels. What separation buys is finer rollback granularity and easier
  diagnosis, nothing more.
- Tidying has no demonstrated return on investment in this codebase. The
  corpus has no randomized comparison of tidy-first against behavior-first, so
  don't write payoff claims into a suggestion's reason.
- Small and reviewable are not the same as risk-free. Say "looks low-risk
  because X was checked", never "is safe".
