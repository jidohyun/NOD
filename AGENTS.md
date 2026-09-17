# NOD Agent Guide

## Scope

The sole active product is `apps/nod`: a Cloudflare Worker + D1 personal link library, a vanilla public web app, and a Manifest V3 extension. Phase 1 saves and manages link metadata only: URL, title, source, and saved time. Do not add article-body collection, AI processing, or legacy application paths.

## Working conventions

- Keep HTML for structure, CSS for style, and JavaScript for behavior.
- Do not invest in styling or add a UI framework/abstraction before a product design decision requires it.
- Treat `apps/nod/.dev.vars` as secret and ignored. Do not read it, commit it, or document its values.

## Commands

Run commands from `apps/nod`:

```bash
bun install --frozen-lockfile
bun run db:local
bun run dev
bun run check
bun run build
```

`check` performs JavaScript syntax checks. `build` is `wrangler deploy --dry-run` and does not deploy remotely.

## Product and operational truth

Read [docs/decisions.md](docs/decisions.md) for the current product contract and [docs/handoff.md](docs/handoff.md) for verified behavior and outstanding remote work. The browser verification recorded there used Aside (Chromium), not a separate Google Chrome app.

Do not commit, push, deploy, change DNS, or alter remote Cloudflare resources without explicit approval from the user or repository owner. Local work and successful verification never create standing approval.
