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
| `dev:extension`   | Start the extension development server        |
| `build:extension` | Build the extension for production            |
| `lint:extension`  | Lint the extension codebase                   |
| `test:extension`  | Run tests for the extension                   |
| `typecheck:extension` | Type check the extension codebase           |

## 4. Where to Look by Task

This extension is structured into `src/` subdirectories.

*   **Background Service Worker**: `apps/extension/src/background/`
*   **Content Scripts**: `apps/extension/src/content/`
*   **Popup UI**: `apps/extension/src/popup/`
*   **Shared Libraries**:
    *   `apps/extension/src/types/`
    *   `apps/extension/src/lib/`
*   **Message Boundaries**:
    *   `apps/extension/src/background/service-worker.ts`
    *   `apps/extension/src/lib/`

## 5. Child `AGENTS.md` Files

More specific `AGENTS.md` files exist within subdirectories (e.g., `apps/extension/src/background/AGENTS.md`). Always consult the nearest `AGENTS.md` file for the most relevant and granular instructions for your current task.
