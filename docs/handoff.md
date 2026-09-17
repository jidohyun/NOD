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

## Not done

- No remote Cloudflare deployment or D1 migration has been performed.
- No DNS change has been performed.
- No verification has been recorded in a separate Google Chrome application.

Commit, push, deployment, DNS, and remote-resource changes require explicit user or repository-owner approval. Local changes and successful checks do not grant standing approval.
