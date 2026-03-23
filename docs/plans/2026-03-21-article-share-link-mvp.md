# Article Share Link MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an MVP "share summarized article by link" feature so anyone with the link can view a sanitized summary, and include a clear anonymous-viewer to signup/login conversion flow.

**Architecture:** Keep changes inside existing article/auth boundaries: add share-link persistence in `apps/api/src/articles`, expose a public read-only API endpoint, then add a public Next.js route that renders the shared summary. Reuse existing auth redirect patterns (`redirect` query + auth callback) so anonymous viewers can sign up/log in and return to the shared article context.

**Tech Stack:** FastAPI + SQLAlchemy + Alembic (`apps/api`), Next.js App Router + next-intl + React Query (`apps/web`), existing Supabase auth callback flow.

---

## Scope, Non-Goals, and Decisions

### In Scope (MVP)
- Generate/re-generate/revoke share link from article detail page.
- Public read-only page for shared article summary.
- Only allowlisted summary fields are exposed publicly.
- Anonymous viewer CTA: "Log in / Sign up" with return-to-shared-page behavior.

### Explicitly Out of Scope (Later Phase)
- Comments/conversations on shared pages.
- Multi-recipient/team sharing permissions.
- Public indexing/SEO traffic optimization for shared pages.

### Security and Product Decisions
- Token type: opaque random token with server-side hash lookup.
- Store hash only, never plaintext token in DB.
- One active share link per article in MVP (re-generate revokes previous).
- Public route defaults to `noindex, nofollow` and `no-store`.
- Public response excludes article raw content and user identifiers.

---

### Task 1: Add Share Link Persistence (Model + Migration)

**Files:**
- Create: `apps/api/alembic/versions/<new_revision>_add_article_share_links.py`
- Modify: `apps/api/src/articles/model.py`
- Test: `apps/api/tests/test_article_share_links_api.py` (new)

**Step 1: Write the failing migration/model test cases**

```python
def test_share_link_requires_article_and_owner(...):
    """Share link row must be bound to article_id and owner_user_id."""

def test_only_one_active_share_link_per_article(...):
    """MVP rule: one active link at a time."""
```

**Step 2: Run tests to verify failure**

Run (from `apps/api`):
```bash
uv run pytest tests/test_article_share_links_api.py -v
```

Expected: FAIL because model/table does not exist yet.

**Step 3: Implement minimal schema/model changes**

- Add a new model (recommended): `ArticleShareLink` in `apps/api/src/articles/model.py`.
- Fields:
  - `id` UUID PK
  - `article_id` FK -> `articles.id` (cascade delete)
  - `owner_user_id` FK -> `users.id` (cascade delete)
  - `token_hash` (string, unique, indexed)
  - `expires_at` (datetime, nullable)
  - `revoked_at` (datetime, nullable)
  - timestamps (`created_at`, `updated_at`)
  - optional metrics: `view_count`, `last_viewed_at`
- Add Alembic migration under `apps/api/alembic/versions/`.

**Step 4: Run tests and migration checks**

Run:
```bash
uv run pytest tests/test_article_share_links_api.py -v
uv run poe lint
uv run poe typecheck
```

Expected: PASS for model/migration-level assertions.

**Step 5: Commit**

```bash
git add apps/api/src/articles/model.py apps/api/alembic/versions/<new_revision>_add_article_share_links.py apps/api/tests/test_article_share_links_api.py
git commit -m "feat(api): add article share link persistence model"
```

---

### Task 2: Add Public Share Schemas and Service Functions

**Files:**
- Modify: `apps/api/src/articles/schemas.py`
- Modify: `apps/api/src/articles/service.py`
- Test: `apps/api/tests/test_article_share_links_api.py`

**Step 1: Write failing service/schema tests**

```python
def test_create_or_regenerate_share_link_returns_public_url_parts(...):
    ...

def test_get_shared_article_returns_allowlisted_summary_fields_only(...):
    ...

def test_revoked_or_expired_share_link_returns_not_found_semantics(...):
    ...
```

**Step 2: Run to confirm failure**

```bash
uv run pytest tests/test_article_share_links_api.py -v
```

Expected: FAIL due to missing service methods/schemas.

**Step 3: Implement minimal code**

- In `schemas.py`, add:
  - `ArticleShareLinkResponse` (share_id, expires_at, share_url)
  - `SharedArticleSummaryResponse` (allowlist only):
    - article id/title/source/created_at
    - summary summary/key_points/concepts/reading_time_minutes/language/content_type/type_metadata
- In `service.py`, add:
  - `create_or_regenerate_share_link(db, article_id, owner_user_id, ttl)`
  - `revoke_share_link(db, article_id, owner_user_id)`
  - `get_shared_article_by_token(db, share_id, token)`
- Token rules:
  - generate cryptographically secure token
  - store hash only
  - compare hash on read

**Step 4: Run tests**

```bash
uv run pytest tests/test_article_share_links_api.py -v
```

Expected: PASS on service/schema behavior.

**Step 5: Commit**

```bash
git add apps/api/src/articles/schemas.py apps/api/src/articles/service.py apps/api/tests/test_article_share_links_api.py
git commit -m "feat(api): add share link service and public response schemas"
```

---

### Task 3: Expose API Endpoints for Share Create/Revoke/Public Read

**Files:**
- Modify: `apps/api/src/articles/router.py`
- Modify: `apps/api/src/main.py` (only if router mount/update needed)
- Test: `apps/api/tests/test_article_share_links_api.py`

**Step 1: Write failing API-level tests first**

```python
def test_owner_can_create_share_link(...):
    # POST /api/articles/{id}/share-link

def test_owner_can_revoke_share_link(...):
    # DELETE /api/articles/{id}/share-link

def test_public_can_view_shared_summary_with_valid_token(...):
    # GET /api/articles/share/{share_id}?token=...

def test_public_endpoint_returns_404_for_invalid_revoked_expired(...):
    ...
```

**Step 2: Run tests to verify failure**

```bash
uv run pytest tests/test_article_share_links_api.py -v
```

Expected: FAIL due to missing routes.

**Step 3: Implement minimal endpoints**

- Add authenticated endpoints in `router.py`:
  - `POST /api/articles/{article_id}/share-link`
  - `DELETE /api/articles/{article_id}/share-link`
- Add public endpoint:
  - `GET /api/articles/share/{share_id}` (token input via query or header)
- Response hardening:
  - public endpoint returns allowlisted schema only
  - public endpoint sets defensive headers (`Cache-Control: no-store` and `X-Robots-Tag: noindex, nofollow`)
  - invalid/revoked/expired should be indistinguishable (`404`)

**Step 4: Run API tests and checks**

```bash
uv run pytest tests/test_article_share_links_api.py -v
uv run poe test
```

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/api/src/articles/router.py apps/api/tests/test_article_share_links_api.py
git commit -m "feat(api): add article share link endpoints"
```

---

### Task 4: Add Web API Client Hooks for Share Flows

**Files:**
- Modify: `apps/web/src/lib/api/articles.ts`
- Test: `apps/web/src/lib/__tests__/api-client.test.ts` (extend) and/or `apps/web/src/lib/__tests__/article-share-api.test.ts` (new)

**Step 1: Write failing hook/client tests**

```ts
it("creates share link for an article", async () => {
  // expect POST /api/articles/:id/share-link
});

it("fetches shared article for public page", async () => {
  // expect GET /api/articles/share/:shareId
});
```

**Step 2: Run to confirm failure**

```bash
bun run test -- src/lib/__tests__/article-share-api.test.ts
```

Expected: FAIL due to missing hooks/types.

**Step 3: Implement minimal hooks/types**

- Add TS types:
  - `ArticleShareLinkResponse`
  - `SharedArticleSummary`
- Add hooks/functions:
  - `useCreateArticleShareLink()`
  - `useRevokeArticleShareLink()`
  - `useSharedArticle(shareId, token)`

**Step 4: Run tests and typecheck**

```bash
bun run test -- src/lib/__tests__/article-share-api.test.ts
bun run typecheck
```

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/web/src/lib/api/articles.ts apps/web/src/lib/__tests__/article-share-api.test.ts
git commit -m "feat(web): add article share api hooks"
```

---

### Task 5: Add Share CTA in Article Detail (Owner View)

**Files:**
- Modify: `apps/web/src/components/articles/article-detail.tsx`
- Test: `apps/web/src/components/articles/__tests__/article-detail-share.test.tsx` (new)
- Modify (messages):
  - `apps/web/src/config/messages/ko.json`
  - `apps/web/src/config/messages/en.json`
  - `apps/web/src/config/messages/ja.json`
  - `apps/web/src/config/messages/es.json`
  - `apps/web/src/config/messages/pt-BR.json`
  - `apps/web/src/config/messages/zh-CN.json`
  - `apps/web/src/config/messages/de.json`
  - `apps/web/src/config/messages/fr.json`

**Step 1: Write failing UI tests**

```ts
it("shows share actions and copies generated link", async () => {
  // click share -> API call -> copy button available
});

it("revokes existing share link", async () => {
  // click revoke -> confirmation -> success state
});
```

**Step 2: Run to verify failure**

```bash
bun run test -- src/components/articles/__tests__/article-detail-share.test.tsx
```

Expected: FAIL (no share UI yet).

**Step 3: Implement minimal UI and i18n keys**

- Add share controls to `article-detail.tsx` near existing actions.
- Use new API hooks from Task 4.
- Add i18n keys in all supported locales for:
  - share button label
  - link copied
  - revoke action
  - share section helper text

**Step 4: Run tests/lint/typecheck**

```bash
bun run test -- src/components/articles/__tests__/article-detail-share.test.tsx
bun run lint
bun run typecheck
```

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/web/src/components/articles/article-detail.tsx apps/web/src/components/articles/__tests__/article-detail-share.test.tsx apps/web/src/config/messages/*.json
git commit -m "feat(web): add share controls to article detail"
```

---

### Task 6: Implement Public Shared Article Page (Read-Only)

**Files:**
- Create: `apps/web/src/app/[locale]/share/[shareId]/page.tsx`
- Create: `apps/web/src/components/articles/shared-article-view.tsx`
- Create: `apps/web/src/components/articles/__tests__/shared-article-view.test.tsx`

**Step 1: Write failing rendering tests**

```ts
it("renders shared summary in read-only mode", async () => {
  // title + summary + key points + concepts only
});

it("does not render owner-only actions", async () => {
  // no edit/delete/share owner controls
});
```

**Step 2: Run to verify failure**

```bash
bun run test -- src/components/articles/__tests__/shared-article-view.test.tsx
```

Expected: FAIL.

**Step 3: Implement minimal page/view**

- `page.tsx`:
  - read `shareId` and token input (query/header strategy chosen in API)
  - fetch via `useSharedArticle`
  - export metadata with `robots: { index: false, follow: false }`
- `shared-article-view.tsx`:
  - render read-only summary fields only
  - show source link if allowed by API schema

**Step 4: Run tests and route build checks**

```bash
bun run test -- src/components/articles/__tests__/shared-article-view.test.tsx
bun run typecheck
```

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/web/src/app/[locale]/share/[shareId]/page.tsx apps/web/src/components/articles/shared-article-view.tsx apps/web/src/components/articles/__tests__/shared-article-view.test.tsx
git commit -m "feat(web): add public shared article read-only page"
```

---

### Task 7: Add Anonymous Viewer -> Signup/Login Conversion Flow

**Files:**
- Modify: `apps/web/src/app/[locale]/share/[shareId]/page.tsx`
- Modify: `apps/web/src/app/[locale]/signup/page.tsx`
- Modify: `apps/web/src/lib/auth/auth-client.ts`
- Modify: `apps/web/src/app/api/auth/callback/route.ts`
- Test:
  - `apps/web/src/components/articles/__tests__/shared-article-view.test.tsx` (extend)
  - `apps/web/src/lib/auth/__tests__/auth-client.test.ts` (extend)

**Step 1: Write failing conversion tests**

```ts
it("public shared page shows login/signup CTA with redirect back to shared page", async () => {
  // links include redirect current pathname+query
});

it("signup flow preserves redirect through callback", async () => {
  // auth callback type=signup honors next/redirect if safe
});
```

**Step 2: Run tests and confirm failure**

```bash
bun run test -- src/components/articles/__tests__/shared-article-view.test.tsx
bun run test -- src/lib/auth/__tests__/auth-client.test.ts
```

Expected: FAIL (signup callback currently forces `/dashboard`).

**Step 3: Implement minimal conversion path**

- Shared page CTA rules:
  - Primary CTA: `/login?redirect=<current-shared-path>`
  - Secondary CTA: `/signup?redirect=<current-shared-path>`
- Signup page:
  - read `redirect` query param (same convention as login)
  - pass redirect to Google signup and email signup callback
- `auth-client.ts`:
  - extend `signUpWithEmail(..., redirectTo?)`
  - include safe redirect through callback URL
- `auth/callback/route.ts`:
  - for `type=signup`, if safe `next` exists then redirect there (not always dashboard)

**Step 4: Run tests/typecheck**

```bash
bun run test -- src/components/articles/__tests__/shared-article-view.test.tsx
bun run test -- src/lib/auth/__tests__/auth-client.test.ts
bun run typecheck
```

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/web/src/app/[locale]/share/[shareId]/page.tsx apps/web/src/app/[locale]/signup/page.tsx apps/web/src/lib/auth/auth-client.ts apps/web/src/app/api/auth/callback/route.ts apps/web/src/components/articles/__tests__/shared-article-view.test.tsx apps/web/src/lib/auth/__tests__/auth-client.test.ts
git commit -m "feat(web): add shared-view to signup/login conversion flow"
```

---

### Task 8: End-to-End Verification Pass and Cleanup

**Files:**
- Modify as needed from previous tasks only (no new abstraction unless required)

**Step 1: Run API verification suite**

Run in `apps/api`:
```bash
uv run poe lint
uv run poe typecheck
uv run pytest tests/test_article_share_links_api.py -v
uv run poe test
```

Expected: All PASS.

**Step 2: Run Web verification suite**

Run in `apps/web`:
```bash
bun run lint
bun run typecheck
bun run test
```

Expected: All PASS.

**Step 3: Manual checklist (must pass before merge)**

- Owner can create a share link from article detail.
- Shared URL opens read-only summary for anonymous user.
- Shared page includes clear signup/login CTA.
- Clicking CTA lands on auth page and returns user to same shared URL after successful auth.
- Revoked/expired links no longer render content.
- Shared page is not indexable.

**Step 4: Final small fixes only**

- If any failures, apply minimal corrective edits in touched files.

**Step 5: Commit**

```bash
git add -A
git commit -m "test(main): verify shared article flow with auth conversion"
```

---

## Implementation Notes (Guardrails)

- Keep architecture pragmatic per `docs/SYSTEM_DESIGN.md`: avoid generic manager layers.
- Do not expose `Article.content` or `user_id` in public share response.
- Keep runtime boundaries explicit:
  - API logic in `apps/api/src/articles/*`
  - Web UI logic in `apps/web/src/*`
- Reuse existing `redirect` semantics already used by login page.

## Acceptance Criteria

- [ ] Owner can generate and revoke share links for own article.
- [ ] Public shared page renders summary-only data from allowlisted schema.
- [ ] Shared page contains explicit signup/login CTAs.
- [ ] Signup/login returns viewer back to the shared context.
- [ ] Shared route is non-indexable and no-store by default.
- [ ] API and web tests pass with lint/typecheck clean.
