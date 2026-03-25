# Promo Code Subscription Entitlement Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a promo-code redemption capability that grants Pro subscription entitlement safely, so users can activate benefits without Paddle checkout while operators can issue and control campaigns.

**Architecture:** Keep Paddle as the paid-subscription source of truth, and add a separate promo entitlement layer (`user_promo_entitlements`) merged into effective access decisions in subscription service. Add operator-protected promo management APIs and user-facing redeem APIs, with immutable redemption and audit logs for abuse control and operational traceability.

**Tech Stack:** FastAPI + SQLAlchemy + Alembic (`apps/api`), Next.js App Router + React Query (`apps/web`), next-intl message catalogs, existing `settings.ADMIN_USER_IDS` admin gate.

---

## Scope and Non-Goals

### In Scope
- User can redeem a promo code from Billing page.
- Promo code can grant Pro entitlement for a fixed duration (`grant_days`).
- Effective plan/limits use best available entitlement between Paddle subscription and promo entitlement.
- Operator APIs for promo code create/list/disable and redemption/audit visibility.
- Abuse controls: code hashing, redemption limits, expiration, basic rate limiting hooks.
- Observability: structured logs and metrics for redemption outcomes.

### Out of Scope (MVP)
- Complex stacking/compounding rules across multiple simultaneous promo campaigns.
- Multi-plan promotional matrix beyond `pro` grant.
- Full operator UI dashboard (API-first implementation is sufficient for first release).

---

## Current State (Verified Touchpoints)

- API subscription lifecycle:
  - `apps/api/src/subscriptions/model.py`
  - `apps/api/src/subscriptions/service.py`
  - `apps/api/src/subscriptions/router.py`
  - `apps/api/src/subscriptions/schemas.py`
- Existing paid path is Paddle-based (`/checkout`, `/portal-url`, `/webhook`), and plan limits are read from `PLAN_LIMITS`.
- Admin/operator gate exists via `settings.ADMIN_USER_IDS` and `_is_admin(...)` logic in `service.py`.
- Billing UI path for user actions:
  - `apps/web/src/components/subscription/billing-content.tsx`
  - `apps/web/src/lib/api/subscriptions.ts`
  - `apps/web/src/app/[locale]/settings/billing/page.tsx`
  - i18n messages: `apps/web/src/config/messages/*.json` (`subscription` namespace)

---

## Domain Model Design

### New Tables

1) `promo_codes`
- `id` UUID PK
- `code_hash` string unique index (hash only; never store plaintext)
- `campaign_tag` string nullable index
- `grant_plan` string default `pro` (check constraint to MVP-supported values)
- `grant_days` int not null (positive)
- `max_redemptions` int nullable (`null` = unlimited campaign-wise)
- `redeemed_count` int default 0
- `per_user_limit` int default 1
- `expires_at` timestamptz nullable
- `is_active` bool default true
- `created_by` UUID nullable (operator user)
- `metadata` JSONB nullable
- `created_at` / `updated_at`

2) `promo_redemptions`
- `id` UUID PK
- `promo_code_id` FK (`promo_codes.id`, cascade restrict)
- `user_id` FK (`users.id`, cascade delete)
- `status` string (`success`, `rejected`, `revoked`) with check constraint
- `failure_reason` string nullable (invalid, expired, limit_reached, etc.)
- `request_ip` string nullable
- `request_user_agent` string nullable
- `idempotency_key` string nullable
- `redeemed_at` timestamptz not null
- unique constraint suggestions:
  - (`promo_code_id`, `user_id`, `status='success'`) logical uniqueness enforced in service
  - optional unique (`idempotency_key`, `user_id`) when key provided

3) `user_promo_entitlements`
- `id` UUID PK
- `user_id` FK (`users.id`, cascade delete) index
- `promo_redemption_id` FK (`promo_redemptions.id`) unique
- `plan` string (`pro`) with check constraint
- `starts_at` timestamptz not null
- `ends_at` timestamptz not null index
- `is_active` bool default true
- `created_at` / `updated_at`

4) `promo_audit_logs`
- `id` UUID PK
- `actor_user_id` UUID nullable
- `action` string (`code_created`, `code_disabled`, `redeem_success`, `redeem_rejected`, `entitlement_revoked`)
- `target_type` string (`promo_code`, `promo_redemption`, `user_entitlement`)
- `target_id` UUID nullable
- `payload` JSONB
- `created_at`

### Why Separate Entitlement Table?
- Keeps paid subscription state (`subscriptions`) clean and Paddle-sourced.
- Prevents accidental overwrite of paid billing dates and IDs.
- Enables deterministic merge strategy for effective access decisions.

---

## API Design

### User-Facing Endpoints

1) `POST /api/subscriptions/promo/redeem`
- Auth required (`CurrentUser`)
- Request:
```json
{ "code": "SPRING2026" }
```
- Success response:
```json
{
  "plan": "pro",
  "starts_at": "2026-03-24T12:00:00Z",
  "ends_at": "2026-04-23T12:00:00Z",
  "campaign_tag": "spring-launch",
  "message": "Promo applied"
}
```
- Error codes:
  - `400` invalid format
  - `404` invalid code (return generic failure to avoid enumeration)
  - `409` already redeemed / per-user limit reached
  - `410` expired code
  - `429` throttled

2) `GET /api/subscriptions/promo/current`
- Returns currently effective promo entitlement for current user (if any)
- Used by billing UI for explicit promo state rendering

### Operator Endpoints (Admin-only)

1) `POST /api/subscriptions/promo/admin/codes`
- Create one code or batch
- Request includes `grant_days`, `expires_at`, `max_redemptions`, `per_user_limit`, `campaign_tag`

2) `GET /api/subscriptions/promo/admin/codes`
- Filter by `campaign_tag`, `is_active`, `is_expired`, pagination

3) `POST /api/subscriptions/promo/admin/codes/{code_id}/disable`
- Sets `is_active=false` (soft disable)

4) `GET /api/subscriptions/promo/admin/redemptions`
- Audit/reporting endpoint for redemption outcomes

### AuthZ Policy
- Reuse `settings.ADMIN_USER_IDS` + helper guard (`require_admin`) in router/service boundary.

---

## Service Logic Design

### Effective Access Resolution

Update `get_usage_info(...)` and related plan access checks:
1. Read Paddle-backed subscription (`subscriptions`).
2. Read active promo entitlement (`user_promo_entitlements` where `is_active` and `ends_at > now`).
3. Resolve effective plan:
   - if either source grants `pro` and is active, effective plan is `pro`
   - status semantics:
     - `active` if at least one active source
     - otherwise fallback to existing subscription status behavior
4. Use effective plan for `PLAN_LIMITS` and `can_access_content_type(...)` decisions.

### Redeem Transaction Flow (`redeem_promo_code`)

Single DB transaction with row-level locking on target promo code:
1. Normalize/validate input code.
2. Hash input; lookup `promo_codes` by `code_hash`.
3. Validate active, expiration, global redemption limit.
4. Validate per-user redemption count.
5. Insert `promo_redemptions(status=success)`.
6. Insert `user_promo_entitlements` with `starts_at=now`, `ends_at=now+grant_days`.
7. Increment `promo_codes.redeemed_count`.
8. Insert `promo_audit_logs` record.
9. Commit and return entitlement payload.

Rejected attempts also log `promo_redemptions(status=rejected)` + audit log with reason.

---

## Web UX Plan (User Perspective)

### Billing Page Changes

Modify `apps/web/src/components/subscription/billing-content.tsx`:
- Add “Promo code” section card under billing controls.
- Input + Apply button + inline status banner.
- On success:
  - show entitlement expiration date
  - call `invalidate()` from `useInvalidateSubscription()` to refresh usage + plan
- On failure:
  - map backend error reason to localized user-safe messages.

### API Client Additions

Modify `apps/web/src/lib/api/subscriptions.ts`:
- Add `useRedeemPromoCode` mutation
- Add `useCurrentPromoEntitlement` query
- Keep query keys under `['subscription', ...]` umbrella for consistent invalidation.

### i18n Additions

Add keys in `apps/web/src/config/messages/en.json` and all locales:
- `subscription.promo.title`
- `subscription.promo.placeholder`
- `subscription.promo.apply`
- `subscription.promo.success`
- `subscription.promo.errorInvalid`
- `subscription.promo.errorExpired`
- `subscription.promo.errorLimit`
- `subscription.promo.errorGeneric`

---

## Abuse Prevention & Security Controls

1) Store hash only
- Never store plaintext promo code in DB. Hash with strong one-way hash (e.g., SHA-256 + server-side pepper).

2) Enumeration resistance
- Return generic not-found/invalid messaging externally where possible.

3) Throttling
- Per-user and per-IP redeem attempt limits (middleware or service-level guard).

4) Idempotency
- Accept optional idempotency key header or field to prevent duplicate successful grants on retries.

5) Auditability
- Log all admin mutations and redemption outcomes with actor and payload.

6) Data minimization
- Store truncated/anonymized request metadata if compliance requires.

---

## Implementation Tasks (TDD, Bite-Sized)

### Task 1: Add promo DB models + migration

**Files:**
- Create: `apps/api/alembic/versions/<revision>_add_promo_code_entitlement_tables.py`
- Modify: `apps/api/src/subscriptions/model.py`

**Steps:**
1. Write failing model tests for constraints/indexes in new `apps/api/tests/test_subscription_promotions.py`.
2. Run targeted test (expect fail).
3. Implement model classes and Alembic migration.
4. Run migration locally (`mise run db:migrate`).
5. Re-run targeted tests.

### Task 2: Add promo schemas + service core

**Files:**
- Modify: `apps/api/src/subscriptions/schemas.py`
- Modify: `apps/api/src/subscriptions/service.py`
- Test: `apps/api/tests/test_subscription_promotions.py`

**Steps:**
1. Add failing tests for redeem success/failure branches and effective plan resolution.
2. Implement service functions:
   - `redeem_promo_code(...)`
   - `get_current_promo_entitlement(...)`
   - `resolve_effective_plan(...)`
3. Integrate into `get_usage_info(...)`.
4. Run tests.

### Task 3: Add promo API routes (user + admin)

**Files:**
- Modify: `apps/api/src/subscriptions/router.py`
- Test: `apps/api/tests/test_subscription_promotions_api.py`

**Steps:**
1. Add failing API tests for user redeem and admin create/list/disable.
2. Implement routes and admin guard.
3. Validate response contracts.
4. Run API tests.

### Task 4: Add web API hooks + Billing promo UI

**Files:**
- Modify: `apps/web/src/lib/api/subscriptions.ts`
- Modify: `apps/web/src/components/subscription/billing-content.tsx`
- Test: `apps/web/src/components/subscription/__tests__/billing-content.test.tsx` (create if missing)

**Steps:**
1. Add failing UI test for promo redemption success/error states.
2. Add React Query hooks + mutation wiring.
3. Add promo input section in billing UI.
4. Re-run tests.

### Task 5: Add i18n strings for promo UX

**Files:**
- Modify: `apps/web/src/config/messages/en.json`
- Modify: other locale files (`ko`, `ja`, `es`, `pt-BR`, `zh-CN`, `de`, `fr`)

**Steps:**
1. Add missing translation keys for promo flows.
2. Run web typecheck/tests to ensure no missing key errors.

### Task 6: Observability + abuse metrics

**Files:**
- Modify: `apps/api/src/subscriptions/router.py`
- Modify: `apps/api/src/subscriptions/service.py`
- (optional) `apps/api/src/lib/metrics.py`

**Steps:**
1. Emit structured logs for redemption outcomes and admin actions.
2. Add counters (`promo_redeem_success_total`, `promo_redeem_failure_total`, `promo_admin_actions_total`).
3. Add tests for critical logging path where feasible.

---

## Test Plan

### API Unit/Integration
- Promo code validity matrix:
  - valid active code
  - invalid code
  - expired code
  - inactive code
  - max redemption reached
  - per-user limit reached
- Concurrency:
  - simultaneous redeem attempts on last available quota should result in only one success.
- Effective plan resolution:
  - basic + active promo => pro
  - canceled paid + active promo => pro
  - active paid + no promo => pro
  - no paid + expired promo => basic

### Web UI Tests
- Billing promo section renders.
- Successful redemption shows success state and triggers subscription invalidation.
- Failed redemption shows mapped error message.

### End-to-End Smoke
- Create promo code as admin -> redeem as user -> verify usage endpoint returns Pro limits.

---

## Rollout Strategy

1) Phase 0 (Dark launch)
- Ship DB + API behind feature flag (`PROMO_CODE_ENABLED=false` default).

2) Phase 1 (Internal)
- Enable for admin/test users only.
- Validate redemption logs, error rates, and metrics.

3) Phase 2 (Limited production)
- Enable for one controlled campaign.
- Monitor:
  - redeem success ratio
  - invalid/rejected ratio
  - support tickets related to billing confusion

4) Phase 3 (General availability)
- Open operator API usage broadly.
- Publish help-center copy update for promo redemption.

Rollback:
- Toggle feature flag off (UI hides redeem, API returns 503 or guarded response).
- Existing granted entitlements remain valid unless explicitly revoked by admin policy.

---

## Risks and Mitigations

1) **Plan conflict risk** (Paddle + promo both active)
- Mitigation: explicit effective-plan resolver and dedicated tests.

2) **Double-grant race condition**
- Mitigation: transaction + row-level lock + idempotency key.

3) **Code brute-force attacks**
- Mitigation: rate limiting, generic errors, logging + anomaly alerts.

4) **Operator mistakes (wrong campaign params)**
- Mitigation: audit logs + soft-disable endpoint + optional dry-run in admin create API.

5) **Localization gaps**
- Mitigation: add keys across all locale files in same PR and run typecheck.

---

## Final Validation Review (Plan Quality Gate)

### Edge Cases Covered
- Same user retries same code multiple times (idempotency + per-user-limit behavior defined).
- Two users redeeming the last available slot concurrently (row lock + single success expectation).
- Promo active while Paddle is canceled/past_due (effective-plan resolver precedence defined).
- Promo expired mid-session (usage reload and effective access recalculation on each usage fetch).
- Code disabled after issue but before redemption (active check in transaction flow).

### Metrics & Alerting Coverage
- Success/failure counters explicitly defined:
  - `promo_redeem_success_total`
  - `promo_redeem_failure_total`
  - `promo_admin_actions_total`
- Rollout monitoring KPIs defined:
  - redeem success ratio
  - invalid/rejected ratio
  - support ticket rate (billing confusion)

### Testing Coverage Review
- Unit/service tests: validation matrix + effective-plan resolver.
- API tests: user/admin endpoint contracts + authorization.
- Concurrency test: last-slot contention.
- UI tests: redemption success/failure states and cache invalidation.
- E2E smoke path: admin issue → user redeem → Pro limit visible via usage API.

### Rollout Risk Readiness
- Feature-flag dark launch path defined.
- Internal-only canary phase defined.
- Controlled campaign rollout phase defined.
- Rollback behavior defined without destructive data mutation.

### Implementation Readiness Verdict
- **Status: Ready for execution**
- **Blocking gaps: None identified for MVP scope**
- **Post-MVP candidates:** stacking rules, richer operator UI, campaign analytics dashboard.

---

## Verification Commands (Before Merge)

From repo root:

```bash
mise run typecheck
mise run test
```

API-focused:

```bash
cd apps/api
uv run pytest tests/test_subscription_promotions.py tests/test_subscription_promotions_api.py -v
```

Web-focused:

```bash
cd apps/web
bun run typecheck
bun run test
```

---

## Deliverables Checklist

- [ ] Alembic migration + models for promo domain
- [ ] Service-level redeem/effective-plan logic
- [ ] User promo redeem and promo state API endpoints
- [ ] Admin promo management endpoints
- [ ] Billing page promo UX
- [ ] i18n keys for promo UX across locales
- [ ] Tests for promo logic/API/UI
- [ ] Metrics and logs for redemption/admin operations
