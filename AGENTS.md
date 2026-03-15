# AGENTS.md - Root Agent Guidance for NOD Monorepo

This document provides foundational guidance for AI agents operating within the NOD monorepo. It outlines the project's structure, available commands, and critical guardrails to ensure efficient safe development.

## 1. Project Overview

NOD is a Chrome extension and web app designed to transform web content into searchable knowledge. It's built as a monorepo containing several applications and shared packages.

## 2. Core Principles for Agents

When operating within this monorepo, agents MUST adhere to the following principles:

*   **Command-First**: Always prioritize using `mise` commands or per-app package.json scripts for development tasks.
*   **Contextual Awareness**: Understand the specific application or package context before executing commands.
*   **Deterministic Output**: Avoid introducing volatile data (e.g., timestamps) into generated content.
*   **Non-Destructive**: Prefer modifying existing files over creating new ones unless explicitly instructed.
*   **Security**: NEVER handle or expose sensitive information (API keys, credentials, secrets).
*   **Verification**: Always verify changes through linting, type-checking, and testing before claiming completion.

## 3. Global Commands (via `mise run`)

The `mise` tool orchestrates tasks across the monorepo. Use `mise run <task>` from the root.

| Command           | Description                                   |
| :---------------- | :-------------------------------------------- |
| `dev`             | Start all services (API, Web, Worker)         |
| `dev:web`         | Start API and Web services                    |
| `dev:mobile`      | Start API and Mobile services                 |
| `install`         | Install all dependencies                      |
| `format`          | Format all apps                               |
| `lint`            | Lint all apps                                 |
| `test`            | Test all apps                                 |
| `typecheck`       | Type check all apps                           |
| `db:migrate`      | Run database migrations                       |
| `gen:api`         | Generate OpenAPI schema and API clients       |
| `i18n:build`      | Build i18n files                              |
| `infra:up`        | Start local infrastructure (Docker Compose)   |
| `infra:down`      | Stop local infrastructure (Docker Compose)    |
| `tokens:build`    | Build design tokens                           |

## 4. Where to Look by Task

This monorepo is structured into `apps/` and `packages/`.

*   **Web Application**: `apps/web/`
    *   Routing/Pages: `apps/web/src/app`
    *   UI Components: `apps/web/src/components`
*   **API Services**: `apps/api/`
    *   Domain Logic: `apps/api/src/` (pattern for domain logic)
*   **Worker Services**: `apps/worker/`
*   **Chrome Extension**: `apps/extension/`
    *   Split Logic: `apps/extension/src/` (pattern for split logic)
*   **Mobile Application**: `apps/mobile/` (Flutter)
*   **Infrastructure**: `apps/infra/` (Terraform for GCP)
*   **Shared Libraries**: `packages/`

## 5. Git Hooks and Automated Checks

The repository enforces pre-commit and pre-push hooks via `mise`. These hooks run conditional checks based on staged or changed files.

*   **`commit-msg`**: Validates commit messages using `commitlint`.
*   **`pre-commit`**:
    *   Runs `lint` for `apps/api`, `apps/web`, `apps/worker`, `apps/mobile` if relevant files are staged.
    *   Runs `hadolint` for `Dockerfile` changes.
*   **`pre-push`**:
    *   Validates branch names.
    *   Runs `test` for `apps/api`, `apps/web`, `apps/worker`, `apps/mobile` if relevant files have changed compared to origin/main.

Agents MUST ensure their changes pass these checks.

## 6. Child `AGENTS.md` Files

This root `AGENTS.md` provides general guidance. More specific `AGENTS.md` files exist within subdirectories (e.g., `apps/web/AGENTS.md`, `apps/api/AGENTS.md`).

*   **Supplement, Not Duplicate**: Child `AGENTS.md` files extend and supplement the guidance provided here. They focus on local conventions, commands, and caveats specific to their context.
*   **Local Scope**: Always consult the nearest `AGENTS.md` file for the most relevant and granular instructions for your current task.

