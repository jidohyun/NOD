# NOD Handoff

## Current product

`apps/nod` is the sole active implementation: a Cloudflare Worker + D1 personal link library, vanilla public HTML/CSS/JavaScript, and a Manifest V3 extension. Phase 1 stores only URL, title, source, and saved time. It does not collect article bodies or perform AI analysis.

Keep HTML, CSS, and JavaScript separate. Styling investment, UI frameworks, and needless UI abstractions are deferred until a user design decision.

## Verified locally

- Google web login completed with real local configuration.
- An installed `NOD Save` extension connected to the local app; toolbar saving, duplicate handling, and library search were exercised.
- Browser verification used Aside (Chromium). It was not a verification in a separate Google Chrome application.
- After repository cleanup, root `mise run install`, `check`, `db:local`, and `build` passed. Local migration reported no pending changes. The installed pre-push hook executed syntax checks and a real Wrangler dry-run; no push occurred.
- The signed-in library still displayed the saved GC article after cleanup. Home and app JavaScript returned 200; unauthenticated `/api/me` returned 401; the unused direct `/api/extension-tokens` issuance endpoint was removed and returned 404. The extension's PKCE exchange and revoke routes remain.
- All 15 relative documentation links resolved. Root TOML and CI/dependency YAML parsed. The revised CI and local hooks received an independent review; GitHub-hosted CI itself has not run.

## Repository cleanup

Only the new app, its lockfile, focused automation, and active documentation remain. The installed extension path, local OAuth configuration, and D1 state were preserved. Untracked local records from `.omo`, `.gstack`, and `.opencode` were moved outside the repository to `../nod-legacy-local-20260913`; obsolete dependency caches were deleted. Tracked historical implementation remains recoverable from Git history.

The current checkout's local pre-commit hook runs syntax checks; pre-push runs syntax checks and a dry-run build. These hooks are local Git metadata and are not automatically installed in a fresh clone.

## Local operation
Requires Bun and Node.js 22 or newer.

Run from `apps/nod`:

```bash
bun install --frozen-lockfile
bun run db:local
bun run dev
bun run check
bun run build
```

The app is available locally at `http://localhost:8787`. `check` performs JavaScript syntax checks. `build` is a Wrangler deployment dry-run and does not deploy remotely.

The real local Google configuration is in ignored `.dev.vars`. Do not read, commit, or document its values. A separate environment needs its own authorized configuration.

For local extension use, load `apps/nod/extension` as an unpacked extension in a Chromium-based browser and set its service URL to `http://localhost:8787`.

## Deployed

- 2026-09-17: `nod-links` Worker is live at `https://nod-archive.com` (custom domain) and `https://nod-links.nod-api.workers.dev`. Remote D1 `nod-links` (id `b687a3d4-5016-44fa-8ee1-74afcaa3a6fe`, APAC) has migration `0001_initial` applied. `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` secrets are set from `.dev.vars` values.
- The OAuth client "NOD Links Local" (GCP project `89230550200`) now allows both `http://localhost:8787/auth/callback` and `https://nod-archive.com/auth/callback`. The consent screen remains in Testing mode — only listed test users can sign in.
- The previous GitHub Pages shutdown notice (`jidohyun/nod-shutdown`, Pages disabled 2026-09-17) no longer serves the domain; its A/CNAME records were deleted. SES mail records (MX/TXT) were preserved. The `nod-shutdown` repo itself still exists — deleting it needs `delete_repo` scope on the `jidohyun` gh token.
- Verified on production: `/`, `/app.js`, `/styles.css` → 200; `/api/me` → 401; `/api/extension/exchange` POST and cross-origin OPTIONS → 403; `/auth/google` → 302 to Google with the production redirect URI.

## Not done

- No verification has been recorded in a separate Google Chrome application.
- The OAuth consent screen is still in Testing mode; publishing it for non-test users has not been decided.
- The extension has not been re-tested against production; its default origin is already `https://nod-archive.com`.

Commit, push, deployment, DNS, and remote-resource changes require explicit user or repository-owner approval. Local changes and successful checks do not grant standing approval.
