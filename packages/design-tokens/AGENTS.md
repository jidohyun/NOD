# packages/design-tokens/AGENTS.md - Design Tokens Package Guidance

This document provides specific guidance for AI agents working within the `packages/design-tokens` package. It supplements the root `AGENTS.md` by detailing local conventions, commands, and key file locations.

## 1. Where to Look

*   **Package Configuration**: `package.json`
*   **Mise Configuration**: `mise.toml`
*   **Source Tokens**: `src/tokens.ts`
*   **Build Scripts**: `scripts/`
*   **Generated CSS**: dist/css/
*   **Generated Flutter Theme**: dist/flutter/

## 2. Commands (via `mise run` from `packages/design-tokens/`)

| Command           | Description                                   |
| :---------------- | :-------------------------------------------- |
| `build`           | Build design tokens for web and mobile        |
| `build:css`       | Build CSS tokens for web only                 |
| `build:flutter`   | Build Flutter theme for mobile only           |
| `dev`             | Watch tokens.ts for changes and rebuild       |
| `install`         | Install dependencies with `bun`               |
| `test`            | Run design-tokens tests with `vitest`         |
| `lint`            | Run biome linter                              |
| `format`          | Run biome formatter                           |
| `typecheck`       | Run TypeScript type check                     |