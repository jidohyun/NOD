# Share Slug Routing Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate shared article URLs from token-query format (`/share/{shareId}?token=...`) to SEO/AEO-friendly canonical slug format (`/share/{slug}-{sid}`) without breaking existing links.

**Architecture:** Keep existing token validation and permission semantics in API service layer, then add a canonical slug identifier and slug-history redirects. Introduce a new slug route in web app while preserving legacy route compatibility during migration.

**Tech Stack:** FastAPI + SQLAlchemy + Alembic (`apps/api`), Next.js App Router + React Query (`apps/web`), Orval client generation (`mise run gen:api`).

---

## Scope and Non-Goals

### In Scope
- Canonical slug route for shared articles (`/[locale]/share/{slug}-{sid}`).
- Backward-compatible legacy route support for existing token links.
- Slug generation + uniqueness + slug history for title updates.
- 301 redirect from stale slug to canonical slug.
- Web share link generation switched to canonical URL.

### Out of Scope
- Full removal of token validation from API.
- Public search indexing policy change (keep existing noindex until explicit product decision).
- Cross-product URL strategy beyond shared articles.

---

## Current State (Verified Touchpoints)

- `apps/api/src/articles/service.py`
  - `create_or_regenerate_share_link` currently returns `share_url=f"/share/{share_id}?token={token}"`
  - `_get_valid_share_link` handles token hash validation and revoked/expired checks
- `apps/api/src/articles/router.py`
  - `GET /api/articles/share/{share_id}?token=...` + comment/empathy endpoints under share_id + token
- `apps/web/src/app/[locale]/share/[shareId]/page.tsx`
  - consumes query `token`, metadata currently noindex/nofollow
- `apps/web/src/lib/api/articles.ts`
  - `fetchSharedArticle(shareId, token)` and all shared comment/empathy APIs require token
- `apps/web/src/components/articles/article-detail.tsx`
  - share link generation + localStorage cache (`article-share-link:{articleId}`)

---

## Execution Order

### Task 1: Define canonical slug contract in API schema (Red)

**Files:**
- Modify: `apps/api/src/articles/schemas.py`
- Test: `apps/api/tests/test_article_share_links_api.py`

**Step 1: Write failing test for canonical URL shape**

```python
def test_create_share_link_response_includes_slug_and_canonical_url(...):
    ...
```

**Step 2: Run test to verify failure**

Run (`apps/api`):
```bash
uv run pytest tests/test_article_share_links_api.py -k canonical -v
```

Expected: FAIL (missing fields).

**Step 3: Add minimal schema fields**

- Extend response model with:
  - `share_slug: str`
  - `canonical_share_url: str`

**Step 4: Re-run targeted test**

```bash
uv run pytest tests/test_article_share_links_api.py -k canonical -v
```

Expected: PASS.

---

### Task 2: Add slug columns + uniqueness + history table (Red)

**Files:**
- Create: `apps/api/alembic/versions/<revision>_add_share_slug_columns.py`
- Modify: `apps/api/src/articles/model.py`
- Test: `apps/api/tests/test_article_share_links_api.py`

**Step 1: Write failing model/migration tests**

```python
def test_share_link_has_slug_and_short_id_columns(...):
    ...

def test_share_slug_history_enforces_uniqueness(...):
    ...
```

**Step 2: Run tests (expect fail)**

```bash
uv run pytest tests/test_article_share_links_api.py -k "slug or history" -v
```

**Step 3: Implement minimal DB/model changes**

- In `ArticleShareLink` add:
  - `share_slug` (indexed)
  - `share_sid` (short stable id, indexed)
  - unique constraint on `share_sid`
- Add `article_share_slug_histories` table:
  - `id`, `share_link_id`, `slug`, `created_at`
  - unique on (`share_link_id`, `slug`) and globally unique active slug if required by policy

**Step 4: Apply migration and validate revision**

From repo root:
```bash
mise run db:migrate
```

From `apps/api`:
```bash
uv run alembic current
```

**Step 5: Re-run targeted tests**

```bash
uv run pytest tests/test_article_share_links_api.py -k "slug or history" -v
```

Expected: PASS.

---

### Task 3: Generate canonical slug URL in share-link service (Red)

**Files:**
- Modify: `apps/api/src/articles/service.py`
- Test: `apps/api/tests/test_article_share_links_api.py`

**Step 1: Write failing service tests**

```python
def test_create_or_regenerate_share_link_returns_canonical_slug_url(...):
    ...

def test_title_change_preserves_old_slug_in_history(...):
    ...
```

**Step 2: Run tests (expect fail)**

```bash
uv run pytest tests/test_article_share_links_api.py -k "canonical_slug_url or slug_history" -v
```

**Step 3: Implement minimal service logic**

- Add slugify helper (ASCII, hyphen, lowercase, bounded length)
- Build canonical path format:
  - `/share/{share_slug}-{share_sid}`
- Keep tokenized legacy URL for compatibility response field (if needed)
- On title change/regeneration, append previous slug to history table

**Step 4: Re-run tests**

```bash
uv run pytest tests/test_article_share_links_api.py -k "canonical_slug_url or slug_history" -v
```

Expected: PASS.

---

### Task 4: Add slug resolver endpoint and stale-slug redirect metadata (Red)

**Files:**
- Modify: `apps/api/src/articles/router.py`
- Modify: `apps/api/src/articles/schemas.py`
- Modify: `apps/api/src/articles/service.py`
- Test: `apps/api/tests/test_article_share_links_api.py`

**Step 1: Write failing API tests**

```python
def test_get_shared_article_by_slug_returns_payload_and_token_context(...):
    ...

def test_stale_slug_returns_redirect_target(...):
    ...
```

**Step 2: Run tests (expect fail)**

```bash
uv run pytest tests/test_article_share_links_api.py -k "by_slug or stale_slug" -v
```

**Step 3: Implement minimal endpoint**

- Add endpoint (example):
  - `GET /api/articles/share/by-slug/{slug_with_sid}`
- Return either:
  - shared payload (canonical hit)
  - redirect metadata for stale slug (target canonical path)
- Keep existing `GET /api/articles/share/{share_id}` untouched

**Step 4: Sync contract**

From repo root:
```bash
mise run gen:api
```

**Step 5: Re-run focused API tests**

```bash
uv run pytest tests/test_article_share_links_api.py -k "slug" -v
```

Expected: PASS.

---

### Task 5: Add new web route for canonical slug page (Red)

**Files:**
- Create: `apps/web/src/app/[locale]/share/[shareSlug]/page.tsx`
- Modify: `apps/web/src/components/articles/shared-article-view.tsx`
- Modify: `apps/web/src/lib/api/articles.ts`
- Test: `apps/web/src/components/articles/__tests__/shared-article-view.test.tsx`

**Step 1: Write failing route/render tests**

```ts
it("loads shared article from canonical share slug route", async () => {
  ...
});

it("redirects when slug is stale to canonical slug", async () => {
  ...
});
```

**Step 2: Run tests (expect fail)**

```bash
bun run test -- src/components/articles/__tests__/shared-article-view.test.tsx
```

**Step 3: Implement minimal route + API function**

- Add `fetchSharedArticleBySlug(shareSlug, token?)`
- In new route page:
  - parse `shareSlug`
  - fetch by slug resolver endpoint
  - redirect if stale slug
  - render `SharedArticleView`
- Preserve `robots` policy as current (`index: false`, `follow: false`)

**Step 4: Re-run tests and typecheck**

```bash
bun run test -- src/components/articles/__tests__/shared-article-view.test.tsx
bun run typecheck
```

Expected: PASS.

---

### Task 6: Switch share link generation UI to canonical URL (Red)

**Files:**
- Modify: `apps/web/src/components/articles/article-detail.tsx`
- Modify: `apps/web/src/lib/__tests__/article-share-api.test.ts`
- (If needed) Modify i18n messages under `apps/web/src/config/messages/*.json`

**Step 1: Write failing test for canonical URL usage**

```ts
it("stores and copies canonical_share_url after generation", async () => {
  ...
});
```

**Step 2: Run test (expect fail)**

```bash
bun run test -- src/lib/__tests__/article-share-api.test.ts
```

**Step 3: Implement minimal UI change**

- Prefer `canonical_share_url` from API
- Fallback to existing `share_url` only for backward compatibility
- Continue localStorage cache but store canonical URL

**Step 4: Re-run tests**

```bash
bun run test -- src/lib/__tests__/article-share-api.test.ts
```

Expected: PASS.

---

### Task 7: Legacy compatibility + redirect policy checks (Green)

**Files:**
- Modify: `apps/web/src/app/[locale]/share/[shareId]/page.tsx`
- Test: `apps/web/src/components/articles/__tests__/shared-article-view.test.tsx`

**Step 1: Add failing tests for legacy URL survival**

```ts
it("legacy shareId+token URL still renders content during migration", async () => {
  ...
});
```

**Step 2: Run test (expect fail or missing coverage)**

```bash
bun run test -- src/components/articles/__tests__/shared-article-view.test.tsx
```

**Step 3: Implement minimal compatibility behavior**

- Keep old route functional
- If canonical info available, optionally expose canonical metadata for crawlers
- Do not break token path during migration window

**Step 4: Re-run tests**

```bash
bun run test -- src/components/articles/__tests__/shared-article-view.test.tsx
```

Expected: PASS.

---

### Task 8: Full verification gate and rollout checklist

**Step 1: API checks**

From `apps/api`:
```bash
uv run pytest tests/test_article_share_links_api.py -v
mise run //apps/api:test
mise run //apps/api:typecheck
```

**Step 2: Web checks**

From `apps/web`:
```bash
bun run lint
bun run typecheck
bun run test
```

**Step 3: Smoke checklist**
- Existing old shared links still open.
- New generated links are canonical slug URLs.
- Stale slug 301/redirect resolves to latest canonical slug.
- Comment/empathy endpoints still work with token context.
- Shared pages remain non-indexable until SEO policy flip.

---

## Rollout Plan (Ops)

1. Deploy API schema + DB migration first.
2. Deploy web support for both canonical and legacy URLs.
3. Enable canonical link generation in article detail UI.
4. Monitor 404/5xx/redirect counts for 7 days.
5. Decide long-term deprecation date for legacy token URLs.

---

## Acceptance Criteria

- [ ] New share links are generated as canonical slug URLs.
- [ ] Old token links continue to work during migration.
- [ ] Slug change does not break old links (history-based redirect works).
- [ ] Contract/client generation is synced (`mise run gen:api`).
- [ ] API and web tests pass with lint/typecheck clean.
