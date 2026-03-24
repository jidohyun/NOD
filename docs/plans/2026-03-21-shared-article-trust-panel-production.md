# Shared Article Trust Panel Production Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade the shared summary page with a production-grade trust panel that shows the summarizer's identity (name + profile image) and the original article link.

**Architecture:** Keep runtime boundaries explicit. Add allowlisted sharer fields to the existing public share response in `apps/api/src/articles/*`, then render a trust panel in `apps/web/src/components/articles/shared-article-view.tsx`. Reuse existing route and hook patterns without adding generic manager abstractions.

**Tech Stack:** FastAPI + SQLAlchemy + Pydantic (`apps/api`), Next.js App Router + React Query + next-intl (`apps/web`), Vitest/Pytest.

---

## Product Decision Locked

- Trust panel includes:
  - Summarizer name (`sharer.name`)
  - Summarizer profile image (`sharer.image`)
  - Original article link (`url`)
- If name/image is missing, show safe fallback:
  - Name fallback: `NOD User`
  - Avatar fallback: deterministic placeholder (initial or default avatar)
- The panel must be visible near the top of the shared page, above or immediately after the title block.

---

### Task 1: Add failing API contract tests for trust panel fields

**Files:**
- Modify: `apps/api/tests/test_article_share_links_api.py`

**Step 1: Write failing tests**

Add tests that fail until public share payload includes sharer and source trust data:

```python
def test_get_shared_article_includes_public_sharer_profile(...):
    # expects payload["sharer"]["name"] and payload["sharer"]["image"]

def test_get_shared_article_includes_original_url_for_trust_panel(...):
    # expects payload["url"] to be present when article has URL
```

**Step 2: Run tests to verify failure**

Run (from `apps/api`):

```bash
uv run pytest tests/test_article_share_links_api.py -v
```

Expected: FAIL because schema/service do not expose `sharer` yet.

**Step 3: Keep assertions allowlist-oriented**

- Assert only public-safe fields are returned.
- Keep existing assertions that private content/user identifiers are excluded.

**Step 4: Re-run tests**

```bash
uv run pytest tests/test_article_share_links_api.py -v
```

Expected: still FAIL, now with explicit contract gap.

**Step 5: Commit**

```bash
git add apps/api/tests/test_article_share_links_api.py
git commit -m "test(api): define shared trust panel contract fields"
```

---

### Task 2: Implement API schema/service support for public sharer profile

**Files:**
- Modify: `apps/api/src/articles/model.py`
- Modify: `apps/api/src/articles/schemas.py`
- Modify: `apps/api/src/articles/service.py`
- Modify: `apps/api/src/articles/router.py` (only if response typing needs adjustment)
- Modify: `apps/api/tests/test_article_share_links_api.py`

**Step 1: Add minimal schema objects**

In `schemas.py`, add public nested schema:

```python
class SharedArticleSharerResponse(BaseModel):
    name: str | None = None
    image: str | None = None
```

Extend `SharedArticleSummaryResponse`:

```python
sharer: SharedArticleSharerResponse
```

**Step 2: Load owner relationship in service query**

- In `model.py`, add relationship from `ArticleShareLink` to `User` (public read-only usage).
- In `service.py`, eager load owner user for the share-link lookup.

**Step 3: Return allowlisted public profile fields**

- In `get_shared_article_by_token`, map only:
  - `sharer.name <- owner_user.name`
  - `sharer.image <- owner_user.image`
- Keep security boundary: no email, no internal IDs in response.

**Step 4: Run verification**

Run (from `apps/api`):

```bash
uv run pytest tests/test_article_share_links_api.py -v
uv run poe typecheck
uv run poe lint
```

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/api/src/articles/model.py apps/api/src/articles/schemas.py apps/api/src/articles/service.py apps/api/src/articles/router.py apps/api/tests/test_article_share_links_api.py
git commit -m "feat(api): expose public sharer profile in shared article payload"
```

---

### Task 3: Add failing web tests for trust panel rendering

**Files:**
- Modify: `apps/web/src/components/articles/__tests__/shared-article-view.test.tsx`

**Step 1: Write failing tests**

```ts
it("renders trust panel with sharer name and profile image", async () => {
  // expects sharer identity block
});

it("renders original article link in trust panel", async () => {
  // expects anchor to data.url
});

it("uses fallback when sharer profile is missing", async () => {
  // expects default name/avatar state
});
```

**Step 2: Run tests to verify failure**

Run (from `apps/web`):

```bash
bun run test -- src/components/articles/__tests__/shared-article-view.test.tsx
```

Expected: FAIL because trust panel UI is not rendered yet.

**Step 3: Preserve existing read-only and redirect tests**

- Keep existing coverage for title/summary/key points/concepts and login/signup redirect.

**Step 4: Re-run tests**

```bash
bun run test -- src/components/articles/__tests__/shared-article-view.test.tsx
```

Expected: still FAIL for new trust panel expectations.

**Step 5: Commit**

```bash
git add apps/web/src/components/articles/__tests__/shared-article-view.test.tsx
git commit -m "test(web): define trust panel behavior on shared article page"
```

---

### Task 4: Implement shared-page trust panel UI

**Files:**
- Modify: `apps/web/src/lib/api/articles.ts`
- Modify: `apps/web/src/components/articles/shared-article-view.tsx`
- Modify: `apps/web/src/config/messages/en.json`
- Modify: `apps/web/src/config/messages/ko.json`
- Modify: `apps/web/src/config/messages/ja.json`
- Modify: `apps/web/src/config/messages/es.json`
- Modify: `apps/web/src/config/messages/pt-BR.json`
- Modify: `apps/web/src/config/messages/zh-CN.json`
- Modify: `apps/web/src/config/messages/de.json`
- Modify: `apps/web/src/config/messages/fr.json`
- Modify: `apps/web/src/components/articles/__tests__/shared-article-view.test.tsx`

**Step 1: Extend web API type**

In `SharedArticleSummary` type, add:

```ts
sharer: {
  name: string | null;
  image: string | null;
};
```

**Step 2: Render trust panel in `SharedArticleView`**

- Add top trust block containing:
  - avatar image or fallback
  - label like "Summarized by"
  - sharer display name (or fallback)
  - original URL anchor when present
- Keep read-only summary content unchanged.

**Step 3: Add i18n keys in all locales**

Add keys (example names):
- `sharedTrustSummarizedBy`
- `sharedTrustFallbackName`
- `sharedTrustOriginalLink`

**Step 4: Run web verification**

Run (from `apps/web`):

```bash
bun run test -- src/components/articles/__tests__/shared-article-view.test.tsx
bun run typecheck
bun run lint
```

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/web/src/lib/api/articles.ts apps/web/src/components/articles/shared-article-view.tsx apps/web/src/config/messages/*.json apps/web/src/components/articles/__tests__/shared-article-view.test.tsx
git commit -m "feat(web): add shared article trust panel with sharer identity and source link"
```

---

### Task 5: Share preview and API contract sync

**Files:**
- Modify: `apps/web/src/app/[locale]/share/[shareId]/page.tsx` (if metadata generation is introduced)
- Generated: API contract/client artifacts (if router/schema changed)

**Step 1: Add failing metadata test or assertion strategy**

- Validate share route has production-ready metadata strategy for social preview where policy allows.

**Step 2: Implement minimal metadata improvement**

- Keep robots policy as product requires.
- Add deterministic metadata path for shared page previews (title/description/image fallback).

**Step 3: Sync generated API contracts**

Run (from repo root):

```bash
mise run gen:api
```

**Step 4: Full relevant verification**

Run:

```bash
mise run //apps/api:test
mise run //apps/api:typecheck
bun --cwd apps/web run test -- src/components/articles
bun --cwd apps/web run typecheck
```

Expected: all exit 0.

**Step 5: Commit**

```bash
git add -A
git commit -m "chore: finalize trust panel contract and shared page production readiness"
```

---

## Acceptance Criteria

- [ ] Shared page shows trust panel with summarizer name and profile image.
- [ ] Shared page shows original article link when available.
- [ ] Missing sharer profile gracefully falls back without broken UI.
- [ ] Public share API exposes only allowlisted sharer fields (`name`, `image`).
- [ ] Existing read-only summary rendering and auth redirect behavior remain intact.
- [ ] API/web tests, lint, and typecheck pass.

## Guardrails

- Follow `docs/SYSTEM_DESIGN.md`: no generic manager layers, keep logic in existing article/auth boundaries.
- Do not expose private user data in public response.
- Keep all user-facing copy in i18n message catalogs.
