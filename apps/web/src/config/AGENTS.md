# AGENTS.md - Web Configuration Guidance

This document provides specific guidance for AI agents operating within the apps/web/src/config/ directory. It focuses on application-wide configurations, constants, and i18n message catalogs, supplementing `apps/web/AGENTS.md`.

## 1. Purpose

The apps/web/src/config/ directory centralizes various application settings, environment variables, and static data. This ensures consistency and ease of management across the web application.

## 2. Key Files and Directories

*   index.ts: Main configuration entry point, often re-exporting values from other config files.
*   **`env.ts`**: Handles environment variable validation and loading using @t3-oss/env-nextjs.
*   constants.ts: Defines application-wide constants (e.g., magic numbers, fixed strings, API endpoints).
*   **`messages/`**: Contains internationalization message catalogs. Refer to apps/web/src/config/messages/AGENTS.md for specific guidance on translations.

## 3. Internationalization Message Catalogs

The `messages/` subdirectory is critical for supporting multiple languages. Agents MUST adhere to the following principles:

*   **No Hardcoded Strings**: All user-facing strings displayed in the UI MUST be sourced from the i18n message catalogs. Hardcoding strings directly in components or pages is forbidden.
*   **Adding Translations**: To add new translations or update existing ones, modify the relevant JSON files within src/config/messages/.

## 4. Further Guidance

For web application commands and general principles, refer to `apps/web/AGENTS.md`. For detailed guidance on managing i18n message catalogs, refer to `apps/web/src/config/messages/AGENTS.md`.


