# packages/i18n/AGENTS.md - Internationalization Package Guidance

This document provides specific guidance for AI agents working within the `packages/i18n` package. It supplements the root `AGENTS.md` by detailing local conventions, commands, and key file locations.

## 1. Where to Look

*   **Package Configuration**: `package.json`
*   **Mise Configuration**: `mise.toml`
*   **Source Translations**: `src/` (where `.arb` files live)
*   **Generated Output**: Output files are generated under dist/ after running build commands.

## 2. Commands (via `mise run` from `packages/i18n/`)

| Command           | Description                                   |
| :---------------- | :-------------------------------------------- |
| `build`           | Build i18n files for web and mobile           |
| `build:web`       | Build i18n for web only                       |
| `build:mobile`    | Build i18n for mobile only                    |
| `install`         | Install dependencies with `bun`               |
| `lint`            | Run biome linter                              |
| `format`          | Run biome formatter                           |
| `typecheck`       | Run TypeScript type check                     |