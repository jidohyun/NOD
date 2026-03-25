# AGENTS.md - API Service Guidance

This document provides guidance for AI agents operating within the `apps/api/` directory.

## 1. Context

The `apps/api/` directory contains the core API services for the NOD monorepo.

## 2. Local Commands

Use `mise run <task>` from the root of the monorepo.

## 3. Specific Guidance

- **Domain Logic**: `apps/api/src/articles/router.py`, `apps/api/src/auth/router.py`, `apps/api/src/subscriptions/router.py`

- **API Generation**: mise run gen:api

## 4. Database Schema Discipline (Required)

- Before verifying any API change that depends on DB schema (`SELECT/INSERT/UPDATE` on new/changed tables or columns), apply migrations first.
- Preferred command from repo root: `mise run db:migrate`
- API-local equivalent: `cd apps/api && uv run alembic upgrade head`
- If you see errors like `UndefinedTableError` or `relation ... does not exist`, do **not** patch runtime code first. Treat it as migration drift, run migrations, then re-test the same request.
- Only after migration is confirmed applied should you debug application logic.
