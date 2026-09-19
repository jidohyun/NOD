---
name: nod-ops
description: Operate NOD production — rollback, secrets, remote D1, Cloudflare/GitHub settings. Use for deploy failures, credential rotation, or remote-state changes. Remote actions need explicit user approval.
---

# nod-ops

Production: `https://nod-archive.com` — Worker `nod-links`, D1 `nod-links` (id `b687a3d4-5016-44fa-8ee1-74afcaa3a6fe`, APAC), account id `307e231ed540969f16722a6bba5311ae`.

## Rollback

- Bad deploy: revert the commit on main and push (the deploy job redeploys), or `cd apps/nod && bunx wrangler rollback`.
- Bad migration: migrations are additive-only, so a bad one stays — fix forward with a corrective migration.

## Secrets and credentials

- `CLOUDFLARE_API_TOKEN` (GitHub repo secret): scoped token `github-actions-nod-links` — Account Workers Scripts:Edit + D1:Edit, zone nod-archive.com Workers Routes:Edit + Zone:Read. Rotate at dash.cloudflare.com → My Profile → API Tokens, then `gh secret set CLOUDFLARE_API_TOKEN`.
- `apps/nod/.dev.vars`: local-only secrets (Google OAuth client, session secret). Never read into docs/commits; copy between worktrees only.
- Google OAuth client "NOD Links Local": redirect URIs must include the production callback; consent screen is in Testing mode — add test users there or publish when opening sign-in broadly.

## Remote state

- Remote migrations: `mise run db:remote` (or let the deploy job apply them).
- Cloudflare MCP servers (`cloudflare-bindings`, `cloudflare-docs`, `cloudflare-observability`) are registered in `~/.claude.json`; first call triggers OAuth.
- Branch protection "Protect main": PR required, 0 approvals, no force-push/delete; `jidohyun` bypass enrolled. `gh` may drift to `dnp-dohyun` — `gh auth switch -u jidohyun` before writes.

## Done when

The remote change is verified against production (curl smoke or `gh run watch`), never assumed.
