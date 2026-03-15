# AGENTS.md - Extension Root Agent Guidance

This document provides foundational guidance for AI agents operating within the NOD Chrome Extension. It outlines the project's structure, available commands, and critical guardrails to ensure efficient and safe development.

## 1. Project Overview

The NOD Chrome Extension is built as part of the NOD monorepo. It integrates with the main NOD application to provide web content transformation into searchable knowledge.

## 2. Core Principles for Agents

When operating within this extension, agents MUST adhere to the following principles:

*   **Command-First**: Always prioritize using `mise` commands or `package.json` scripts for development tasks.
*   **Contextual Awareness**: Understand the specific application or package context before executing commands.
*   **Deterministic Output**: Avoid introducing volatile data (e.g., timestamps) into generated content.
*   **Non-Destructive**: Prefer modifying existing files over creating new ones unless explicitly instructed.
*   **Security**: NEVER handle or expose sensitive information (API keys, credentials, secrets).
*   **Verification**: Always verify changes through linting, type-checking, and testing before claiming completion.

## 3. Extension-Specific Commands (via `mise run` or `package.json`)

The `mise` tool orchestrates tasks across the monorepo. Use `mise run <task>` from the root, or `npm run <task>` from `apps/extension/`.

| Command           | Description                                   |
| :---------------- | :-------------------------------------------- |
| `dev`             | Start the extension development server        |
| `build`           | Build the extension for production            |
| `typecheck`       | Type check the extension codebase             |

Note: The global `lint` and `test` commands defined in the root mise.toml do not currently include the extension. To lint or test the extension, you must run `npm run <task>` directly from `apps/extension/`.

## 4. Where to Look by Task

This extension is structured into `src/` subdirectories.

*   **Background Service Worker**: `apps/extension/src/background/`
*   **Content Scripts**: `apps/extension/src/content/`
*   **Popup UI**: `apps/extension/src/popup/`
*   **Shared Libraries**:
    *   `apps/extension/src/lib/api.ts`
    *   `apps/extension/src/lib/auth.ts`
    *   `apps/extension/src/lib/errors.ts`
    *   `apps/extension/src/lib/constants.ts`
    *   `apps/extension/src/lib/config.ts`
    *   `apps/extension/src/types/api.ts`
    *   `apps/extension/src/types/article.ts`
*   **Message Boundaries**:
    *   `apps/extension/src/background/service-worker.ts`
    *   `apps/extension/src/lib/config.ts`

## 5. Child `AGENTS.md` Files

More specific `AGENTS.md` files exist within subdirectories (e.g., `apps/extension/src/background/AGENTS.md`). Always consult the nearest `AGENTS.md` file for the most relevant and granular instructions for your current task.
