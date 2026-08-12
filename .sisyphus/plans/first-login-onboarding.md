# First-Login Onboarding Plan (Web + Extension + API)

## Goal
For a user who has never used NOD before, show a guided onboarding flow:
1) Choose language
2) Install Chrome extension (if already installed, skip)
3) Save first article (prefer a “clean summary” friendly, non-personal, public official tech/blog/docs link)
4) When first summary succeeds, show welcome message and enter dashboard

## Current System Facts (From Repo)
- Web uses Next.js App Router with locale-prefixed routes: `apps/web/src/app/[locale]/...`
- Locales: `ko`, `en`, `ja` (`apps/web/src/lib/i18n/routing.ts`)
- Auth: Supabase OAuth; login redirects via `apps/web/src/lib/auth/auth-client.ts` → `apps/web/src/app/api/auth/callback/route.ts`
- Protected route auth is enforced in middleware-like proxy: `apps/web/src/proxy.ts` (protected paths include `/articles`, `/dashboard`, `/settings`, `/extension-auth`)
- API uses Supabase JWT Bearer; when first request arrives, user row is auto-created: `apps/api/src/lib/auth.py:_ensure_user_exists` and `apps/api/src/users/model.py`
- Article status in API: default `pending`, then updated to `analyzed` when summary is created (`apps/api/src/articles/router.py`, `apps/api/src/articles/model.py`)
- Web article polling already exists: `useArticle()` refetches every 3s while status is `pending` or `analyzing` (`apps/web/src/lib/api/articles.ts`)
- Extension:
  - Content script runs on `<all_urls>` and listens for `window.postMessage({type:"NOD_AUTH_TOKEN", token})` (`apps/extension/src/content/content-script.ts`)
  - Extension accepts external messages from `https://nod-archive.com/*` via `externally_connectable` (`apps/extension/manifest.json`)
  - Background handles `SET_TOKEN` from external and internal messages (`apps/extension/src/background/service-worker.ts`)
  - Extension login flow opens `${WEB_BASE}/login?redirect=/extension-auth` (`apps/extension/src/popup/components/LoginPrompt.tsx`)
  - Extension saves an article via `POST /api/articles/analyze-url` with extracted content (`apps/extension/src/lib/api.ts`)

## Key Definitions
- **First-login user** (recommended): `users.onboarding_completed_at IS NULL`.
  - Rationale: avoids re-triggering onboarding if user later deletes all articles.
  - Optional secondary heuristic: no articles (`/api/articles?limit=1&page=1` → `meta.total === 0`).
- **Extension installed** (recommended): website can successfully ping the extension via externally-connectable messaging.
- **First summary success** (recommended): newest saved article has `summary != null` OR `status === "analyzed"`.

## Proposed UX Flow (Single Route + Stepper)
Route: `/<locale>/onboarding` (new)

### Step 1 — Language Selection
- UI: explicit language choices (KO/EN/JA) with one-click switch.
- Behavior:
  - When user picks a language, redirect to that locale version of onboarding route.
  - Persist preference:
    - Set `NEXT_LOCALE` cookie (next-intl convention) and/or rely on next-intl locale routing.
    - Also write to API user profile `preferred_locale` (recommended; see API changes).

### Step 2 — Extension Install + Connect
- Primary CTA: open `CHROME_EXTENSION_INSTALL_URL` in a new tab.
- Secondary CTA: “이미 설치했어요” / “다음”
- Auto-detect (recommended):
  - In Chrome: call `chrome.runtime.sendMessage(EXTENSION_ID, { type: "PING" }, cb)`.
  - If response returns → extension installed.
  - If response includes `authenticated: true` → treat as connected; else show “연결하기” CTA.
- Connect (recommended): open `/<locale>/extension-auth` (or locale-less `/extension-auth` if you keep it that way) in a new tab.
  - This page already posts `NOD_AUTH_TOKEN`; extension content script forwards it to background which stores token.

### Step 3 — Save First Article (Guided)
- Provide a pre-selected “clean summary” sample article link (non-personal; official/public).
- UX:
  - “샘플 아티클 열기” opens the article in a new tab.
  - Show instruction: “샘플 탭에서 확장 프로그램 아이콘 → Save”.
  - Provide “저장했어요” button.
- Detect save completion:
  - Poll `/api/articles?limit=1&page=1` (web already has hooks) until `meta.total > 0` and newest article `url` matches the sample (if available) OR simply until total > 0 for a first-time user.
  - Capture latest `articleId` for next step.

### Step 4 — Wait for Summary Success → Welcome → Dashboard
- Poll article detail (`GET /api/articles/{id}`):
  - success when `summary != null` OR `status === "analyzed"`.
  - failure if status becomes `failed` (if introduced later) or if timeout exceeded.
- On success:
  - Show welcome message.
  - Persist onboarding completion (`users.onboarding_completed_at = now()`).
  - Redirect to `/<locale>/dashboard`.

## Data / API Changes (Recommended for Correct “First Login” Detection)
### 1) DB schema
Add fields to `users` table (via Alembic migration in `apps/api/alembic/versions/...`):
- `preferred_locale` (varchar(10), nullable)
- `onboarding_completed_at` (timestamptz, nullable)
- Optional: `onboarding_version` (int, nullable) to safely re-run onboarding after major UX changes.

### 2) API endpoints
Add `apps/api/src/users/router.py` and mount it (where routers are aggregated):
- `GET /api/users/me` → returns `{ id, email, name, preferred_locale, onboarding_completed_at }`
- `PATCH /api/users/me` → accepts `{ preferred_locale?, onboarding_completed_at? }` (server sets timestamp if value is `true`)

## Web Changes (Implementation Map)
### 1) Protect onboarding route
Update `apps/web/src/proxy.ts`:
- Add `"/onboarding"` to `protectedPaths`.

### 2) Gate entry into app for first-time users
Add a client component gate (recommended minimal-risk approach):
- `apps/web/src/components/onboarding/onboarding-gate.tsx` (new)
  - Reads current Supabase user session.
  - Calls API `GET /api/users/me` (recommended) OR uses `useArticles({page:1, limit:1})` as heuristic.
  - If onboarding not complete → `router.replace("/onboarding")`.
Integrate gate into protected layouts:
- `apps/web/src/app/[locale]/dashboard/layout.tsx`
- `apps/web/src/app/[locale]/articles/layout.tsx`
- (Optional) `apps/web/src/app/[locale]/settings/layout.tsx`

### 3) Onboarding route UI
Add:
- `apps/web/src/app/[locale]/onboarding/page.tsx`
- `apps/web/src/components/onboarding/onboarding-stepper.tsx`
- `apps/web/src/components/onboarding/steps/*.tsx`

### 4) Shared constants
Centralize:
- `apps/web/src/lib/chrome-extension.ts`: `CHROME_EXTENSION_INSTALL_URL`, `CHROME_EXTENSION_ID`
- `apps/web/src/lib/onboarding/sample-articles.ts`: list of candidate sample URLs by locale

### 5) i18n copy
Add onboarding copy to:
- `apps/web/src/config/messages/ko.json`
- `apps/web/src/config/messages/en.json`
- `apps/web/src/config/messages/ja.json`

## Extension Changes (Recommended for Reliable Install Detection)
Update `apps/extension/src/background/service-worker.ts`:
- In `onMessageExternal`, add support for:
  - `{ type: "PING" }` → `sendResponse({ success: true, authenticated: await isAuthenticated() })`
  - Optionally `{ type: "GET_AUTH_STATUS" }` same response

Why: without this, website install detection is ambiguous (no deterministic response).

## Sample Article Selection Strategy
Constraints from extractor (`apps/extension/src/content/extractor.ts`):
- Avoid blocked hosts: `github.com`, `reddit.com`, `twitter.com`, `x.com`, `youtube.com`, etc.
- Must not be homepage (`/`), must be HTML, and should have >100 words.

Recommended approach:
- Maintain 3 candidate URLs per locale.
- During development, validate candidates by opening them and confirming:
  - Extension `CHECK_ARTICLE` returns success
  - Extracted content length is healthy and summary quality is good
- Choose 1 default URL per locale for onboarding, keep others as fallbacks.

## Verification (Agent-Executable QA Scenarios)
Scenario: First-time user onboarding happy path
- Preconditions: new Supabase user (no `users.onboarding_completed_at`), extension installed
- Steps:
  1) Visit `https://nod-archive.com/login?redirect=%2Fdashboard`
  2) Complete Google OAuth
  3) Expect redirect to `/<locale>/onboarding`
  4) Select language → expect route locale changes
  5) Step 2 detects extension via PING → auto-advance or show “Connected”
  6) Open sample article; use extension popup to Save; return to onboarding tab
  7) Step 4 shows progress until summary appears
  8) Expect welcome screen then redirect to `/<locale>/dashboard`

Scenario: Extension not installed
- Preconditions: new user, no extension
- Steps:
  1) Enter onboarding Step 2
  2) Detection fails; install CTA shown
  3) Clicking install opens Web Store
  4) User can still proceed (manual) but Step 3 clearly instructs install requirement

Scenario: Returning user
- Preconditions: `users.onboarding_completed_at` set
- Steps:
  1) Login redirect to `/dashboard`
  2) Ensure onboarding gate does not redirect

## Risks / Gotchas
- API article status uses `"analyzed"`; web UI uses `"completed"` in some places. Onboarding should key off `summary != null` to avoid mismatch.
- External extension messaging only works in Chromium-based browsers; onboarding must handle Safari/Firefox gracefully.
- If we rely only on `articles.meta.total === 0` to detect first-time, onboarding may re-trigger after deletions; prefer DB field.
