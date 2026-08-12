# AGENTS.md - Web Locale-Prefixed Routes Guidance

This document provides specific guidance for AI agents operating within the `apps/web/src/app/[locale]/` directory. It focuses on the structure and conventions for locale-prefixed routes, supplementing `apps/web/src/app/AGENTS.md`.

## 1. Locale-Prefixed Route Structure

All routes within this directory are prefixed by the active locale (e.g., /en, /ko). This ensures proper internationalization for the entire web application.

## 2. Key Route Areas

*   **Authentication (`(auth)` route group)**:
    *   `apps/web/src/app/[locale]/login/`: User login page.
    *   register/page.tsx: User registration page.
    *   forgot-password/page.tsx: Password recovery page.
    *   reset-password/page.tsx: Password reset page.
    *   These routes are typically public and accessible without authentication.

*   **Protected Areas (`(main)` route group)**:
    *   `apps/web/src/app/[locale]/dashboard/`: The main user dashboard, requiring authentication.
    *   `apps/web/src/app/[locale]/settings/`: User settings and profile management, requiring authentication.
    *   `apps/web/src/app/[locale]/articles/`: Displays user-specific articles or content, requiring authentication.
    *   `onboarding/page.tsx`: Initial user onboarding flow after registration.

*   **Blog (`blog` directory)**:
    *   Contains the blog listing and individual blog post pages. Refer to `apps/web/src/app/[locale]/blog/AGENTS.md` for specific guidance.

## 3. Further Guidance

For general App Router patterns and conventions, refer to `apps/web/src/app/AGENTS.md`. For web application commands, refer to `apps/web/AGENTS.md`.


