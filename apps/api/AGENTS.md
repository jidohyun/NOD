# AGENTS.md - API Service Guidance

This document provides guidance for AI agents operating within the `apps/api/` directory.

## 1. Context

The `apps/api/` directory contains the core API services for the NOD monorepo.

## 2. Local Commands

Use `mise run <task>` from the root of the monorepo.

## 3. Specific Guidance

- **Domain Logic**: `apps/api/src/articles/router.py`, `apps/api/src/auth/router.py`, `apps/api/src/subscriptions/router.py`

- **API Generation**: mise run gen:api
