# Internal Promo Code Issuer Service Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** `apps/web` 내부 Admin 화면에서 운영자가 프로모션 코드를 발급/조회/비활성화할 수 있게 하고, 기존 `apps/api` admin promo 계약을 그대로 재사용한다.

**Architecture:** API 계약은 고정(`POST/GET /promo/admin/codes`, `POST /promo/admin/codes/{id}/disable`)하고 Web 쪽에만 관리자 전용 UI를 추가한다. 접근 제어는 Web(라우트 보호 + 서버단 admin 체크)와 API(`_require_admin`)를 동시에 사용해 이중 방어한다.

**Tech Stack:** Next.js App Router (`apps/web`), React Query, next-intl, FastAPI (`apps/api`) existing promo endpoints, Supabase SSR auth, `ADMIN_USER_IDS` allowlist.

---

## Scope and Constraints

### In Scope
- Admin 전용 promo-code issuer 페이지 추가 (`/[locale]/admin/promo-codes`)
- 발급/조회/비활성화 UI + 기존 endpoint 연동
- Web admin 접근 차단(비관리자 404 또는 redirect), API admin gate 유지
- 운영자가 바로 실행 가능한 테스트/검증 루틴 포함

### Out of Scope
- 새로운 백오피스 서비스 분리
- promo endpoint path/response contract 변경
- promo code plaintext 영구 저장

### Important Constraint Notes
- `PromoCodeResponse`에는 plaintext `code`가 없다. 따라서 리스트에서 기존 코드 “재복사”는 불가능하다.
- disable reason 입력은 현재 API payload에 정의되어 있지 않다. MVP에서는 확인 모달만 구현하고, reason은 후속 API 확장으로 분리한다.

---

## Verified Touchpoints (Current Code)

- API admin promo routes and gate:
  - `apps/api/src/subscriptions/router.py`
- API promo domain/service:
  - `apps/api/src/subscriptions/service.py`
  - `apps/api/src/subscriptions/schemas.py`
- Existing Web subscription hooks:
  - `apps/web/src/lib/api/subscriptions.ts`
- Existing auth/protected-route mechanism:
  - `apps/web/src/proxy.ts`
  - `apps/web/src/lib/supabase/server.ts`
- Existing dashboard/settings entry points and nav:
  - `apps/web/src/components/dashboard/dashboard-sidebar.tsx`
  - `apps/web/src/components/settings/settings-profile.tsx`
  - `apps/web/src/app/[locale]/settings/page.tsx`

---

## Execution Strategy (Safe Order)

1. API regression contract lock first (admin list/disable behavior 포함)
2. Web admin guard foundations (env parsing + admin check helper + route protection)
3. API hook layer 확장
4. Admin page UI skeleton -> list -> create -> disable 순으로 점진 구현
5. i18n + navigation entry
6. tests/typecheck/build verification

---

### Task 1: Lock promo admin API contracts with missing tests

**Files:**
- Modify: `apps/api/tests/test_subscription_promotions_api.py`

**Step 1: Write failing tests for list/disable admin flows**

```python
def test_admin_list_requires_admin(...):
    response = promo_client.get("/api/subscriptions/promo/admin/codes")
    assert response.status_code == 403

def test_admin_disable_returns_404_for_missing_code(...):
    ...
    response = client.post(f"/api/subscriptions/promo/admin/codes/{uuid.uuid4()}/disable")
    assert response.status_code == 404
```

**Step 2: Run targeted API test to verify fail first**

Run: `cd apps/api && uv run pytest tests/test_subscription_promotions_api.py -k "admin" -v`

Expected: 새 테스트 기준 FAIL

**Step 3: Make minimal test fixture/monkeypatch adjustments if needed**

```python
monkeypatch.setattr(router.service, "list_promo_codes", _fake_list)
monkeypatch.setattr(router.service, "disable_promo_code", _fake_disable)
```

**Step 4: Re-run targeted test to green**

Run: `cd apps/api && uv run pytest tests/test_subscription_promotions_api.py -k "admin" -v`

Expected: PASS

**Step 5: Commit checkpoint**

```bash
git add apps/api/tests/test_subscription_promotions_api.py
git commit -m "test: lock promo admin list and disable API contracts"
```

---

### Task 2: Build Web admin guard foundations

**Files:**
- Create: `apps/web/src/lib/auth/admin.ts`
- Modify: `apps/web/src/config/env.ts`
- Modify: `apps/web/src/proxy.ts`

**Step 1: Add server-side admin id parser/helper**

```ts
export function getAdminUserIds(): Set<string> {
  const raw = process.env.ADMIN_USER_IDS ?? "";
  return new Set(raw.split(",").map((v) => v.trim()).filter(Boolean));
}

export function isAdminUserId(userId: string): boolean {
  return getAdminUserIds().has(userId);
}
```

**Step 2: Add `/admin` to protected route list in proxy**

```ts
const protectedPaths = ["/articles", "/dashboard", "/settings", "/extension-auth", "/onboarding", "/admin"];
```

**Step 3: Add env validation field (server-only) for admin list**

```ts
server: {
  ...,
  ADMIN_USER_IDS: z.string().optional().default(""),
},
runtimeEnv: {
  ...,
  ADMIN_USER_IDS: process.env.ADMIN_USER_IDS,
}
```

**Step 4: Verify web type safety**

Run: `cd apps/web && bun run typecheck`

Expected: PASS

**Step 5: Commit checkpoint**

```bash
git add apps/web/src/lib/auth/admin.ts apps/web/src/config/env.ts apps/web/src/proxy.ts
git commit -m "feat: add web admin route guard foundation"
```

---

### Task 3: Extend Web API hooks for admin promo endpoints

**Files:**
- Modify: `apps/web/src/lib/api/subscriptions.ts`

**Step 1: Add admin request/response types**

```ts
export interface AdminPromoCodeItem {
  id: string;
  campaign_tag: string | null;
  grant_plan: string;
  grant_days: number;
  max_redemptions: number | null;
  redeemed_count: number;
  per_user_limit: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}
```

**Step 2: Add hooks**

```ts
export function useAdminCreatePromoCode() { ... }
export function useAdminListPromoCodes(params?: { campaign_tag?: string; is_active?: boolean }) { ... }
export function useAdminDisablePromoCode() { ... }
```

**Step 3: Keep query key convention under subscription umbrella**

```ts
queryKey: ["subscription", "promo", "admin", "codes", params]
```

**Step 4: Run typecheck**

Run: `cd apps/web && bun run typecheck`

Expected: PASS

**Step 5: Commit checkpoint**

```bash
git add apps/web/src/lib/api/subscriptions.ts
git commit -m "feat: add web admin promo api hooks"
```

---

### Task 4: Add admin promo page route with server-side admin check

**Files:**
- Create: `apps/web/src/app/[locale]/admin/promo-codes/page.tsx`
- Create: `apps/web/src/components/admin/promo-codes/admin-promo-codes-page.tsx`

**Step 1: Create server page route and enforce admin check**

```tsx
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user || !isAdminUserId(user.id)) notFound();
return <AdminPromoCodesPage />;
```

**Step 2: Create client page skeleton (filters + table + actions placeholders)**

```tsx
export function AdminPromoCodesPage() {
  return <div>{/* issue form + list + disable flow */}</div>;
}
```

**Step 3: Add base loading/empty/error states using existing UI primitives**

```tsx
if (isLoading) return <Skeleton ... />
if (error) return <Alert ... />
```

**Step 4: Run typecheck**

Run: `cd apps/web && bun run typecheck`

Expected: PASS

**Step 5: Commit checkpoint**

```bash
git add apps/web/src/app/[locale]/admin/promo-codes/page.tsx apps/web/src/components/admin/promo-codes/admin-promo-codes-page.tsx
git commit -m "feat: add admin promo page route with server-side admin guard"
```

---

### Task 5: Implement create/list/disable interactions and UX rules

**Files:**
- Modify: `apps/web/src/components/admin/promo-codes/admin-promo-codes-page.tsx`

**Step 1: Implement issue form fields exactly per source plan**

```tsx
// code, grant_days, expires_at, max_redemptions, per_user_limit, campaign_tag
```

**Step 2: Wire create mutation + optimistic UX + list refresh**

```tsx
await createPromo.mutateAsync(payload);
await refetchPromoList();
```

**Step 3: Implement list filters for `campaign_tag`, `is_active`**

```tsx
useAdminListPromoCodes({ campaign_tag: campaignTag || undefined, is_active: activeFilter })
```

**Step 4: Implement disable flow (confirm modal) and error mapping**

```tsx
if (status === 404) setError(t("adminPromo.errors.notFound"));
```

**Step 5: Implement copy action with security constraint**

```tsx
// list row plaintext code unavailable by API design
// copy only newly issued code from form value right after successful create
navigator.clipboard.writeText(lastIssuedCode)
```

**Step 6: Re-run web typecheck + unit tests**

Run: `cd apps/web && bun run typecheck && bun run test`

Expected: PASS (or 기존 실패가 있으면 해당 실패 목록 기록)

**Step 7: Commit checkpoint**

```bash
git add apps/web/src/components/admin/promo-codes/admin-promo-codes-page.tsx
git commit -m "feat: implement admin promo create list disable interactions"
```

---

### Task 6: Add localized copy for admin promo UI

**Files:**
- Modify: `apps/web/src/config/messages/en.json`
- Modify: `apps/web/src/config/messages/ko.json`
- Modify: `apps/web/src/config/messages/ja.json`
- Modify: `apps/web/src/config/messages/es.json`
- Modify: `apps/web/src/config/messages/pt-BR.json`
- Modify: `apps/web/src/config/messages/zh-CN.json`
- Modify: `apps/web/src/config/messages/de.json`
- Modify: `apps/web/src/config/messages/fr.json`

**Step 1: Add `subscription.adminPromo.*` namespace keys**

```json
"adminPromo": {
  "title": "Promo Code Issuer",
  "filters": { "campaign": "Campaign", "status": "Status" },
  "actions": { "issue": "Issue code", "disable": "Disable" },
  "errors": { "duplicate": "Code already exists", "notFound": "Code not found" }
}
```

**Step 2: Keep no hardcoded user-facing string rule**

```tsx
const t = useTranslations("subscription");
t("adminPromo.title");
```

**Step 3: Run typecheck/tests**

Run: `cd apps/web && bun run typecheck && bun run test`

Expected: PASS

**Step 4: Commit checkpoint**

```bash
git add apps/web/src/config/messages/*.json
git commit -m "feat: add i18n catalog for admin promo issuer UI"
```

---

### Task 7: Add internal entry point without broad exposure

**Files:**
- Modify: `apps/web/src/app/[locale]/settings/page.tsx`
- Modify: `apps/web/src/components/settings/settings-profile.tsx`

**Step 1: Pass server-computed `showAdminPromoEntry` prop**

```tsx
const showAdminPromoEntry = !!user && isAdminUserId(user.id);
return <SettingsProfile showAdminPromoEntry={showAdminPromoEntry} />;
```

**Step 2: Render admin-only quick link tile in settings profile**

```tsx
{showAdminPromoEntry ? <Link href="/admin/promo-codes">...</Link> : null}
```

**Step 3: Verify non-admin users do not get menu entry**

Run: `cd apps/web && bun run test`

Expected: admin-only conditional rendering assertions pass

**Step 4: Commit checkpoint**

```bash
git add apps/web/src/app/[locale]/settings/page.tsx apps/web/src/components/settings/settings-profile.tsx
git commit -m "feat: add admin-only entry point to promo issuer from settings"
```

---

### Task 8: Add/extend tests for new UI flow

**Files:**
- Create: `apps/web/src/components/admin/promo-codes/__tests__/admin-promo-codes-page.test.tsx`
- Modify: `apps/web/src/components/subscription/__tests__/billing-content.test.tsx` (if shared promo helpers extracted)

**Step 1: Write tests for render and guard assumptions**

```tsx
it("renders issue form and list")
it("maps 409 to duplicate error")
it("maps 404 on disable")
it("refreshes list after create/disable")
```

**Step 2: Run targeted tests first**

Run: `cd apps/web && bun run test src/components/admin/promo-codes/__tests__/admin-promo-codes-page.test.tsx`

Expected: PASS

**Step 3: Run full web checks**

Run: `cd apps/web && bun run typecheck && bun run test && bun run build`

Expected: all pass

**Step 4: Commit checkpoint**

```bash
git add apps/web/src/components/admin/promo-codes/__tests__/admin-promo-codes-page.test.tsx
git commit -m "test: cover admin promo issuer UI flows"
```

---

## Final Verification Gate (Before PR)

From repo root:

```bash
mise run typecheck
mise run test
```

App-specific smoke:

```bash
cd apps/api && uv run pytest tests/test_subscription_promotions_api.py -v
cd apps/web && bun run typecheck && bun run test && bun run build
```

Expected:
- API admin promo contracts pass
- Web admin page builds with no type errors
- Non-admin cannot access `/[locale]/admin/promo-codes`

---

## Definition of Done

- 운영자가 Web에서 promo code 발급/조회/비활성화 가능
- 비관리자는 Web/API 모두에서 admin action 차단
- 기존 사용자 billing/redeem 흐름 무중단
- 테스트/타입체크/빌드 통과
- 운영 가이드에 admin 진입 경로와 주요 에러(403/404/409) 대응이 반영됨

---

Plan complete and saved to `docs/plans/2026-03-25-internal-promo-code-issuer-implementation-plan.md`. Two execution options:

1. Subagent-Driven (this session) - I dispatch a fresh subagent per task and verify each step immediately.
2. Parallel Session (separate) - Start a dedicated execution session with `superpowers:executing-plans` for staged implementation.
