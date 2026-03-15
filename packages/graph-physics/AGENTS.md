# packages/graph-physics/AGENTS.md - Graph Physics Package Guidance

This document provides specific guidance for AI agents working within the `packages/graph-physics` package. It supplements the root `AGENTS.md` by detailing local conventions, commands, and key file locations.

## 1. Where to Look

*   **Package Configuration**: `package.json`
*   **Main Source File**: `src/index.ts`
*   **Physics Presets**: `src/presets.ts`
*   **Test Configuration**: `vitest.config.ts`
*   **Tests**: `src/__tests__/` (based on common Vitest patterns, though not explicitly listed in README)
*   **README**: `README.md`

## 2. Commands (via `bun run` from `packages/graph-physics/`)

| Command           | Description                                   |
| :---------------- | :-------------------------------------------- |
| `test`            | Run all tests with `vitest`                   |
| `typecheck`       | Run TypeScript type check                     |