# Architecture

This document describes only the high-level architecture of NOD.
Its goal is not to explain implementation details, but to make the system boundaries and ownership model easy to understand.

## Reading Guide

- This document covers only facts that are unlikely to change often.
- It intentionally omits screen inventories, route inventories, API endpoint lists, and component internals.
- The code map is designed to answer both "Where is X done?" and "What does the thing I am looking at do?"
- The groups in the code map follow the actual directory layout. At the root, runtime apps live under `apps/` and shared packages live under `packages/`.

## Bird's Eye View

This repository is a polyglot monorepo managed with mise for tool versions.

- `apps/web`: Next.js web app (Bun, TypeScript)
- `apps/api`: FastAPI backend API (Python, SQLAlchemy, asyncpg)
- `apps/worker`: FastAPI async worker for background jobs (Python, Cloud Tasks, PubSub)
- `apps/extension`: Chrome extension with Manifest V3 (Vite, TypeScript)
- `apps/mobile`: Flutter mobile app (Dart, Riverpod)
- `apps/infra`: Terraform infrastructure definitions (GCP)
- `packages/design-tokens`: shared design tokens across web, extension, and mobile
- `packages/i18n`: shared internationalization source strings (ARB format)
- `packages/graph-physics`: graph physics simulation library (TypeScript)

The most important structural fact is that each runtime app is fully independent.
There is no shared domain package that multiple apps import directly.
The center of sharing is "design primitives and i18n strings," not "all business logic."

## System Boundaries

### Runtime boundary

Each app owns its own runtime.

- `apps/web` owns the Next.js entry, SSR/SEO concerns, Supabase auth, i18n routing, and Sentry initialization.
- `apps/api` owns the FastAPI application, database models via SQLAlchemy, Alembic migrations, and domain-specific routers.
- `apps/worker` owns async job execution triggered by Cloud Tasks and PubSub, including article analysis and embedding generation.
- `apps/extension` owns the Manifest V3 contract and the popup/background/content-script split.
- `apps/mobile` owns the Flutter entry, Riverpod state management, and native platform integrations.
- `apps/infra` owns the Terraform definitions for GCP resources including Cloud Run, Cloud SQL, Cloud Tasks, PubSub, and CDN.

The main invariant is that these runtime-specific details are not pushed into shared packages.

### Shared package boundary

`packages/design-tokens` is the boundary for shared visual design.

- token definitions: `src/tokens.ts`
- build scripts: CSS output, ForUI theme generation, OKLCH-to-P3 conversion

`packages/i18n` is the boundary for shared translation strings.

- source strings in ARB format: `src/ko.arb`, `src/en.arb`, `src/ja.arb`
- build script generates platform-specific output

These packages do not own app routing, auth policy, or business logic.

### API boundary

Each runtime keeps its own backend access layer.

- `apps/web/src/lib/api-client.ts` and `apps/web/src/lib/api/*`
- `apps/extension/src/lib/api.ts`
- `apps/mobile/lib/core/network/`

There is no single global API client shared by every runtime.
Instead, each runtime keeps its own client aligned with its auth model and failure handling.

### Extension boundary

The extension does not directly import web-app modules.
Instead, `manifest.json` and Chrome messaging form the boundary.

- popup: `src/popup/main.tsx`, `src/popup/App.tsx`
- background: `src/background/service-worker.ts`
- content script: `src/content/content-script.ts`
- auth: `src/lib/auth.ts`
- API client: `src/lib/api.ts`

Because of this boundary, the extension remains an independently deployable unit.

### Backend boundary

The API and worker are separate Python services that share a database.

- `apps/api` handles synchronous HTTP requests, auth, CRUD, and subscriptions.
- `apps/worker` handles async jobs dispatched via Cloud Tasks, including article analysis and embedding generation.
- Both use SQLAlchemy with asyncpg against the same Cloud SQL PostgreSQL instance.
- The API dispatches work to the worker via `apps/api/src/lib/worker_client.ts`.

## Architecture Invariants

- Runtime isolation matters more than direct app-to-app reuse.
- Shared design tokens live in `packages/design-tokens`, but app-specific state, routing, and network policy stay in each app.
- TanStack Query is the default server-state layer for `apps/web`. The extension uses its own query client.
- The API follows a domain-module pattern: each domain (`articles`, `auth`, `subscriptions`, `users`, `payments`, `toss_payments`, `extraction_failures`) has its own `model.py`, `router.py`, `schemas.py`, and `service.py`.
- Shared backend utilities live in `apps/api/src/lib/` and `apps/worker/src/lib/`.
- Error observability is initialized near each runtime entry. Web, API, extension, and mobile each have their own Sentry setup.
- Extension data flow is messaging-centered. Popup and content talk to the backend through the background service worker.
- Infrastructure is defined declaratively in Terraform. Changes to GCP resources go through `apps/infra`.

## Code Map

### `packages/design-tokens`

`packages/design-tokens` is the shared design token foundation.

- tokens: `src/tokens.ts`
- CSS build: `scripts/build-css.ts`
- ForUI theme: `scripts/build-forui-theme.ts`

What is it?

- It defines color, spacing, and typography tokens consumed by web, extension, and mobile.

Where should you look?

- "Where are the shared design values defined?" -> `src/tokens.ts`
- "How do tokens get to CSS?" -> `scripts/build-css.ts`
- "How do tokens get to Flutter?" -> `scripts/build-forui-theme.ts`

### `packages/i18n`

`packages/i18n` is the shared internationalization source.

- source strings: `src/ko.arb`, `src/en.arb`, `src/ja.arb`
- build script: `scripts/build.ts`

What is it?

- It holds the canonical translation strings in ARB format and builds platform-specific output.

Where should you look?

- "Where are the source translation strings?" -> `src/*.arb`
- "How do translations reach the web app?" -> web uses `next-intl` with its own message JSON files in `apps/web/src/config/messages/`

### `apps/web`

`apps/web` is the Next.js web application.

- app entry: `src/app/layout.tsx`
- locale layout: `src/app/[locale]/layout.tsx`
- providers: `src/app/providers.tsx`
- query client: `src/lib/get-query-client.ts`
- API client: `src/lib/api-client.ts`
- API modules: `src/lib/api/*`
- auth: `src/lib/auth/auth-client.ts`, `src/lib/auth/token.ts`
- Supabase: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`
- state atoms: `src/stores/theme-atoms.ts`, `src/stores/user-atoms.ts`
- hooks: `src/hooks/*`
- i18n messages: `src/config/messages/{locale}.json`
- analytics: `src/lib/analytics.ts`
- payments: `src/lib/paddle.ts`, `src/lib/api/toss-payments.ts`

What is it?

- It owns the Next.js runtime, SSR/SEO, i18n routing, Supabase auth, subscription/payment flows, and the web API layer.

Where should you look?

- "Where does the provider chain start?" -> `providers.tsx`, `layout.tsx`
- "Where are backend calls defined?" -> `src/lib/api/*`, `src/lib/api-client.ts`
- "Where is auth managed?" -> `src/lib/auth/`, `src/lib/supabase/`
- "Where are i18n messages?" -> `src/config/messages/`
- "Where is client state?" -> `src/stores/` (Jotai atoms)

### `apps/api`

`apps/api` is the FastAPI backend.

- app entry: `src/main.py`
- domain modules:
  - `src/articles/` (model, router, schemas, service)
  - `src/auth/` (router)
  - `src/users/` (model, router)
  - `src/subscriptions/` (model, router, schemas, service, paddle_utils, paddle_verify)
  - `src/payments/` (router, schemas, service)
  - `src/toss_payments/` (client, router, schemas, scheduler)
  - `src/extraction_failures/` (model, router, schemas, service)
- shared lib:
  - `src/lib/config.py` (settings)
  - `src/lib/database.py` (async engine, session)
  - `src/lib/auth.py` (Supabase JWT verification)
  - `src/lib/dependencies.py` (FastAPI dependency injection)
  - `src/lib/ai_service.py` (AI/LLM integration)
  - `src/lib/content_classifier.py` (URL/content classification)
  - `src/lib/worker_client.py` (Cloud Tasks dispatch)
  - `src/lib/sentry.py`, `src/lib/telemetry.py`, `src/lib/logging.py` (observability)
  - `src/lib/rate_limit.py`, `src/lib/alerts.py`, `src/lib/metrics.py`
- migrations: `alembic/`

What is it?

- It owns the HTTP API, database models, business logic, and integrations with external services (Supabase, Paddle, TossPayments, AI providers).

Where should you look?

- "Where is the API entrypoint?" -> `src/main.py`
- "Where is a domain's logic?" -> `src/{domain}/service.py`
- "Where are database models?" -> `src/{domain}/model.py`
- "Where is auth verification?" -> `src/lib/auth.py`
- "Where are migrations?" -> `alembic/versions/`

### `apps/worker`

`apps/worker` is the async job processor.

- app entry: `src/main.py`
- jobs: `src/jobs/analyze_article.py`, `src/jobs/generate_embedding.py`
- routers: `src/routers/health.py`, `src/routers/tasks.py`
- shared lib: `src/lib/config.py`, `src/lib/database.py`, `src/lib/retry.py`

What is it?

- It processes async tasks dispatched by the API via Cloud Tasks. It runs article analysis (AI-powered) and embedding generation (vector search).

Where should you look?

- "Where does a job run?" -> `src/jobs/`
- "How does the API dispatch work?" -> `apps/api/src/lib/worker_client.py` sends to Cloud Tasks, worker receives at `src/routers/tasks.py`

### `apps/extension`

`apps/extension` is the Chrome extension (Manifest V3).

- manifest: `public/manifest.json` (via Vite build)
- popup entry: `src/popup/main.tsx`, `src/popup/App.tsx`
- background: `src/background/service-worker.ts`
- content script: `src/content/content-script.ts`, `src/content/extractor.ts`
- auth: `src/lib/auth.ts` (token management, refresh alarm)
- API client: `src/lib/api.ts`
- config: `src/lib/config.ts`, `src/lib/constants.ts`
- types: `src/types/api.ts`, `src/types/article.ts`

What is it?

- It captures web content from browser tabs, communicates with the API via the background service worker, and manages auth tokens synced from the web app.

Where should you look?

- "Where does the popup start?" -> `src/popup/main.tsx`
- "Where does background handle messages?" -> `src/background/service-worker.ts`
- "Where does content extraction happen?" -> `src/content/extractor.ts`
- "How is auth managed?" -> `src/lib/auth.ts`
- "How does the extension talk to the API?" -> `src/lib/api.ts`

### `apps/mobile`

`apps/mobile` is the Flutter mobile app.

- entry: `lib/main.dart`
- core: `lib/core/network/`, `lib/core/router/`, `lib/core/theme/`
- features: `lib/features/articles/`
- i18n: `lib/i18n/messages/`, `lib/i18n/generated/`

What is it?

- It provides a native mobile experience with Riverpod state management, ForUI for theming, and Firebase for crash reporting.

Where should you look?

- "Where is the app entry?" -> `lib/main.dart`
- "Where is networking?" -> `lib/core/network/`
- "Where is routing?" -> `lib/core/router/`
- "Where is the design theme?" -> `lib/core/theme/`

### `apps/infra`

`apps/infra` defines GCP infrastructure as Terraform.

- compute: `compute.tf` (Cloud Run services)
- database: `database.tf` (Cloud SQL)
- networking: `network.tf`, `cdn.tf`
- async: `cloudtasks.tf`, `pubsub.tf`, `jobs.tf`
- storage: `storage.tf`, `artifact.tf`
- security: `security.tf`, `iam.tf`, `wif.tf`
- config: `provider.tf`, `variables.tf`, `locals.tf`, `versions.tf`

What is it?

- It defines the entire GCP infrastructure declaratively: Cloud Run for API/worker, Cloud SQL for PostgreSQL, Cloud Tasks for async dispatch, PubSub for events, and CDN for static assets.

## Where Is X?

| Concern                      | Owner             | Where to look                                                        | Names to search                                     |
| ---------------------------- | ----------------- | -------------------------------------------------------------------- | --------------------------------------------------- |
| Shared design tokens         | `packages/design-tokens` | `src/tokens.ts`                                                | `tokens`                                            |
| Shared i18n source           | `packages/i18n`   | `src/*.arb`                                                          | ARB keys                                            |
| Web app entry                | `apps/web`        | `src/app/layout.tsx`                                                 | `RootLayout`                                        |
| Web auth                     | `apps/web`        | `src/lib/auth/`, `src/lib/supabase/`                                 | `auth-client`, `supabase`                           |
| Web API calls                | `apps/web`        | `src/lib/api/*`, `src/lib/api-client.ts`                             | `useQuery`, `useMutation`                           |
| Web i18n messages            | `apps/web`        | `src/config/messages/{locale}.json`                                  | `next-intl`, `useTranslations`                      |
| Web client state             | `apps/web`        | `src/stores/*`                                                       | `atom`, `useAtom`                                   |
| API entrypoint               | `apps/api`        | `src/main.py`                                                        | `app`, `FastAPI`                                    |
| API domain logic             | `apps/api`        | `src/{domain}/service.py`                                            | domain function names                               |
| API database models          | `apps/api`        | `src/{domain}/model.py`                                              | `Base`, `SQLAlchemy`                                |
| API auth verification        | `apps/api`        | `src/lib/auth.py`                                                    | `get_current_user`                                  |
| API migrations               | `apps/api`        | `alembic/versions/`                                                  | migration revision IDs                              |
| Worker jobs                  | `apps/worker`     | `src/jobs/`                                                          | `analyze_article`, `generate_embedding`             |
| Worker dispatch              | `apps/api`        | `src/lib/worker_client.py`                                           | `create_task`                                       |
| Extension popup              | `apps/extension`  | `src/popup/`                                                         | `App`, `main`                                       |
| Extension background         | `apps/extension`  | `src/background/service-worker.ts`                                   | `onMessage`, `onInstalled`                          |
| Extension content extraction | `apps/extension`  | `src/content/extractor.ts`                                           | `extract`                                           |
| Extension auth               | `apps/extension`  | `src/lib/auth.ts`                                                    | `getToken`, `setToken`, `refreshAccessToken`        |
| Mobile entry                 | `apps/mobile`     | `lib/main.dart`                                                      | `main`, `runApp`                                    |
| Mobile features              | `apps/mobile`     | `lib/features/`                                                      | feature-specific widgets                            |
| GCP infrastructure           | `apps/infra`      | `*.tf`                                                               | `google_cloud_run_v2_service`, `google_sql_database_instance` |
| Observability                | each runtime      | near entry points                                                    | `Sentry`, `structlog`, `opentelemetry`              |
| Payments (global)            | `apps/web` + `apps/api` | `web: src/lib/paddle.ts`<br>`api: src/subscriptions/`          | `Paddle`, `paddle_verify`                           |
| Payments (Korea)             | `apps/web` + `apps/api` | `web: src/lib/api/toss-payments.ts`<br>`api: src/toss_payments/` | `TossPayments`, `billing`                        |

## What This Document Deliberately Omits

- Which business rules each page implements
- Which props each component takes
- Request/response details for each API endpoint
- Internal state-transition details inside hooks
- Individual Terraform resource configurations
- Database schema details and migration contents

Those details change more often, so they are better kept close to the code or in narrower documents.

## When To Update This Document

- When a workspace is added or removed
- When dependency direction between apps changes
- When a new shared package is added to `packages/`
- When the API domain module pattern changes
- When the extension entry structure or messaging boundary changes
- When infrastructure topology changes significantly
