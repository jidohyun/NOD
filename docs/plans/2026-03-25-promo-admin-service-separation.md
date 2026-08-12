# Promo Admin Service Separation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Separate promo admin operations into a dedicated admin service so user redemption logic and operator management logic are clearly isolated.

**Architecture:** Keep current endpoints and response contracts unchanged, but extract admin-only promo operations from `subscriptions/service.py` into a new dedicated module. Maintain admin authorization in router boundary, then route admin endpoints to the new service module. This minimizes risk while improving ownership and maintainability.

**Tech Stack:** FastAPI, SQLAlchemy AsyncSession, Pydantic schemas, Pytest, existing monorepo `mise` tasks.

---

## Problem and Scope

### Current Pain
- `apps/api/src/subscriptions/service.py` currently mixes:
  - user-facing promo redemption flow
  - admin promo code lifecycle operations (`create/list/disable`)
- This makes ownership unclear and increases regression risk when touching either side.

### In Scope
- Extract promo admin business logic into a dedicated module.
- Keep API paths unchanged:
  - `POST /promo/admin/codes`
  - `GET /promo/admin/codes`
  - `POST /promo/admin/codes/{promo_code_id}/disable`
- Preserve existing behavior and tests.

### Out of Scope
- New admin UI.
- Permission model change (`ADMIN_USER_IDS` remains).
- Promo redemption business rule changes.

---

## Approaches

### Approach A: Keep one service file, only rename regions
- **Pros:** smallest diff.
- **Cons:** no real boundary; maintainability issue remains.

### Approach B (Recommended): New `promo_admin_service.py` module
- **Pros:** clear boundary with minimal API churn; low migration risk.
- **Cons:** one additional module import path to manage.

### Approach C: Full admin subpackage split (`admin/router.py`, `admin/service.py`, schemas)
- **Pros:** strongest domain isolation.
- **Cons:** larger refactor surface; not needed yet (YAGNI for this phase).

**Recommendation:** Approach B.

---

## Target Design

### Module Boundaries

1) `apps/api/src/subscriptions/service.py`
- Keep user-facing logic only:
  - usage/effective plan resolution
  - promo redeem/current entitlement
  - failure logging and audit for user redeem path

2) `apps/api/src/subscriptions/promo_admin_service.py` (new)
- Move admin-only logic here:
  - `create_promo_code(...)`
  - `list_promo_codes(...)`
  - `disable_promo_code(...)`
- Keep return types as existing schemas (`PromoCodeResponse`).

3) `apps/api/src/subscriptions/router.py`
- Keep `_require_admin(...)` at API boundary.
- Replace `service.<admin_fn>` calls with `promo_admin_service.<admin_fn>`.

### Contract Stability Rules
- No endpoint path changes.
- No schema field changes.
- No status code behavior changes.

---

## Task-by-Task Execution (Oracle-adjusted safe sequence)

### Task 1: Baseline contract lock (green start)

**Files:**
- Verify/Modify: `apps/api/tests/test_subscription_promotions_api.py`
- Verify: `apps/api/tests/test_subscription_promotions.py`

**Step 1: Confirm current admin contract tests exist and pass**
- Keep these explicit assertions in API tests:
  - non-admin create returns 403
  - admin create returns success payload
  - duplicate create returns 409

**Step 2: Run baseline targeted tests (must be green)**

```bash
cd apps/api && uv run pytest tests/test_subscription_promotions_api.py tests/test_subscription_promotions.py -v
```

Expected: all pass.

**Step 3: Commit checkpoint**

```bash
git add apps/api/tests/test_subscription_promotions_api.py apps/api/tests/test_subscription_promotions.py
git commit -m "test: lock promo admin and promo domain baseline contracts"
```

---

### Task 2: Introduce shim admin module first (keep intermediate state green)

**Files:**
- Create: `apps/api/src/subscriptions/promo_admin_service.py`

**Step 1: Add facade functions that delegate to existing service functions**
- Add:
  - `create_promo_code(...)`
  - `list_promo_codes(...)`
  - `disable_promo_code(...)`
- Initial implementation delegates to `service.*` functions so behavior is unchanged.

**Step 2: Run targeted tests immediately**

```bash
cd apps/api && uv run pytest tests/test_subscription_promotions_api.py -v
```

Expected: all pass.

**Step 3: Commit checkpoint**

```bash
git add apps/api/src/subscriptions/promo_admin_service.py
git commit -m "refactor: add promo admin service shim module"
```

---

### Task 3: Rewire router and test monkeypatch targets

**Files:**
- Modify: `apps/api/src/subscriptions/router.py`
- Modify: `apps/api/tests/test_subscription_promotions_api.py`

**Step 1: Update router imports and admin endpoint call sites only**

```python
from src.subscriptions import promo_admin_service, service
```

- `POST /promo/admin/codes` -> `promo_admin_service.create_promo_code`
- `GET /promo/admin/codes` -> `promo_admin_service.list_promo_codes`
- `POST /promo/admin/codes/{promo_code_id}/disable` -> `promo_admin_service.disable_promo_code`

**Step 2: Keep `_require_admin` unchanged at router boundary**
- No auth model change in this refactor.

**Step 3: Update test monkeypatch paths**
- Admin endpoint tests must patch `router.promo_admin_service.*` instead of `router.service.*`.
- Redeem/current tests can still patch `router.service.*`.

**Step 4: Run targeted tests**

```bash
cd apps/api && uv run pytest tests/test_subscription_promotions_api.py -v
```

Expected: all pass.

**Step 5: Commit checkpoint**

```bash
git add apps/api/src/subscriptions/router.py apps/api/tests/test_subscription_promotions_api.py
git commit -m "refactor: route promo admin endpoints through promo admin service"
```

---

### Task 4: Move real implementation and resolve helper sharing explicitly

**Files:**
- Modify: `apps/api/src/subscriptions/promo_admin_service.py`
- Modify: `apps/api/src/subscriptions/service.py`
- Optional Create: `apps/api/src/subscriptions/promo_common.py`
- Create/Modify: `apps/api/tests/test_subscription_promo_admin_service.py`

**Step 1: Move implementations from `service.py` to `promo_admin_service.py`**
- Move exact behavior for:
  - `create_promo_code`
  - `list_promo_codes`
  - `disable_promo_code`

**Step 2: Choose one helper strategy (must be explicit)**
- Preferred: extract shared promo helpers into `promo_common.py` (leaf module) and import from both services.
- Acceptable short-term: keep temporary wrappers in `service.py` while migration completes.

**Step 3: Prevent circular imports**
- Enforce one-way dependency:
  - `router -> service/promo_admin_service`
  - `service/promo_admin_service -> promo_common`
  - never `service <-> promo_admin_service` two-way imports.

**Step 4: Preserve router error mapping contracts**
- Keep exact `ValueError` reason strings:
  - `"promo_code_already_exists"`
  - `"promo_code_not_found"`

**Step 5: Add admin service unit tests only after module exists**
- Avoid creating intentionally broken commits.

**Step 6: Run targeted tests**

```bash
cd apps/api && uv run pytest tests/test_subscription_promo_admin_service.py tests/test_subscription_promotions_api.py tests/test_subscription_promotions.py -v
```

Expected: all pass.

**Step 7: Commit checkpoint**

```bash
git add apps/api/src/subscriptions apps/api/tests/test_subscription_promo_admin_service.py
git commit -m "refactor: move promo admin logic into dedicated service implementation"
```

---

### Task 5: Full verification and cleanup

**Files:**
- Verify: `apps/api/src/subscriptions/{service.py,promo_admin_service.py,router.py}`
- Verify: related tests and plan doc

**Step 1: Repo reference check before removing temporary wrappers**

```bash
grep -R "service.create_promo_code\|service.list_promo_codes\|service.disable_promo_code" apps/api/src apps/api/tests
```

Expected: no remaining required call sites except intentional compatibility wrappers.

**Step 2: API and monorepo verification**

```bash
cd /Users/jidohyun/Desktop/Backup/NOD
mise run typecheck
mise run test
```

Expected:
- typecheck exit code 0
- test exit code 0

**Step 3: Final commit checkpoint**

```bash
git add apps/api/src/subscriptions apps/api/tests docs/plans/2026-03-25-promo-admin-service-separation.md
git commit -m "chore: complete promo admin service separation with oracle-aligned safeguards"
```

---

## Risk Checklist (Oracle-validated)

- Import cycle between `service.py` and `promo_admin_service.py`.
- Hidden shared-helper dependency (`_normalize_user_id`, `_hash_promo_code`, `_write_promo_audit_log`).
- API tests silently patching wrong module after router rewiring.
- Router status mapping regression if `ValueError` reason strings change.
- Mid-refactor broken state when move happens before shim/rewire.

Mitigations:
- Use shim-first sequence so intermediate commits stay green.
- Keep one-way dependency graph with optional `promo_common.py` leaf module.
- Update monkeypatch targets deliberately (`router.promo_admin_service.*` for admin routes).
- Preserve exact reason strings used by router HTTP mapping.
- Run focused tests after every task plus full `mise` verification at the end.

---

## Definition of Done

- Admin promo operations live in dedicated service module.
- User promo logic remains in user-facing `service.py`.
- Admin endpoints behavior unchanged (status codes, payload shape).
- Existing promo tests pass, plus new admin service unit tests pass.
- `mise run typecheck` and `mise run test` pass.

---

Plan complete and saved to `docs/plans/2026-03-25-promo-admin-service-separation.md`. Two execution options:

1. Subagent-Driven (this session) - I dispatch a fresh subagent per task and verify each step immediately.
2. Parallel Session (separate) - Start a dedicated execution session with `superpowers:executing-plans` for staged implementation.
