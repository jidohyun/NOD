# AGENTS.md - Web Application Guidance

This document provides specific guidance for AI agents operating within the `apps/web/` directory of the NOD monorepo. It supplements the root `AGENTS.md` by detailing web-specific technologies, commands, and architectural patterns.

## 1. Web Stack Overview

The web application is built with:
*   **Framework**: Next.js 16 (App Router)
*   **Runtime/Package Manager**: Bun
*   **Linter/Formatter**: Biome
*   **Testing**: Vitest
*   **UI**: Tailwind CSS, Radix UI
*   **Data Fetching**: React Query (via Orval-generated hooks)

## 2. Local Commands

Agents MUST prioritize using `mise` commands or `package.json` scripts for development tasks within `apps/web/`.

| Command (via `bun run` or `mise run web:<task>`) | Description                                   |
| :----------------------------------------------- | :-------------------------------------------- |
| `dev`                                            | Start the Next.js development server          |
| `build`                                          | Build the Next.js production application      |
| `start`                                          | Start the Next.js production server           |
| `lint`                                           | Lint web application files with Biome         |
| `format`                                         | Format web application files with Biome       |
| `check`                                          | Check and format web application files with Biome |
| `typecheck`                                      | Type check web application files with TypeScript |
| `test`                                           | Run web application tests with Vitest         |
| `test:watch`                                     | Run web application tests in watch mode       |
| `gen:api`                                        | Generate API client hooks using Orval         |

## 3. Key Directories

*   **`src/app`**: Contains all App Router pages, layouts, and routing logic.
*   **`src/components`**: Houses reusable React components, including UI primitives and complex modules.
*   **`src/lib`**: Utility functions, helpers, and third-party integrations.
*   **`src/config`**: Application-wide configurations, constants, and i18n message catalogs.

## 4. Internationalization (i18n)

*   **Implementation**: `src/lib/i18n` contains routing helpers and i18n setup.
*   **Message Catalogs**: Translation files are located under `src/config/messages`. Agents MUST use these for all user-facing strings.

## 5. Core Principles (Web-Specific)

*   **Client/Server Components**: Understand the distinction and appropriate usage of React Server Components (RSC) and Client Components.
*   **Data Fetching**: Prefer Orval-generated React Query hooks for client-side data fetching. Avoid direct RSC async data fetching for API integration.
*   **Memoization**: React Compiler is enabled. Manual `useMemo`, `useCallback`, `React.memo` should only be used when profiling identifies a bottleneck.

## 6. Further Guidance

For general monorepo principles (Command-First, Deterministic Output, etc.), refer to the root `AGENTS.md`. For specific directory guidance, consult the `AGENTS.md` file in the respective subdirectory.