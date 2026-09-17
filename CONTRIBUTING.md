# Contributing to NOD

NOD Phase 1 is a small link-saving product in `apps/nod`. Contributions should preserve its scope: a signed-in user saves a page URL, title, source, and saved time, then manages those links in a personal library. Article-body collection and AI processing are out of scope.

## Local setup

Use Bun and run commands from `apps/nod`:

```bash
bun install --frozen-lockfile
bun run db:local
bun run dev
```

Before proposing a change, run the checks relevant to it:

```bash
bun run check # JavaScript syntax
bun run build # Wrangler deployment dry-run; no remote deployment
```

## Change guidelines

- Keep the active runtime in `apps/nod`; do not restore deleted legacy applications, packages, or infrastructure.
- Keep the public app as separate HTML, CSS, and JavaScript. Avoid UI frameworks and needless abstractions; styling investment is deferred until a design decision exists.
- Never commit, copy into documentation, or otherwise expose values from `.dev.vars` or other credentials.
- Apply local D1 migrations with `bun run db:local` before exercising schema-dependent behavior.
- Keep pull requests focused and explain user-visible behavior and verification.

For automation acting in this repository, commit, push, and deployment require explicit approval from the user or repository owner. A passing local check is not authorization for a remote action.

## Community and security

Follow the [Code of Conduct](CODE_OF_CONDUCT.md). Report vulnerabilities through the process in [SECURITY.md](SECURITY.md), not public issues.
