# AGENTS.md - Web App Router Guidance

This document provides specific guidance for AI agents operating within the apps/web/src/app/ directory, focusing on Next.js App Router patterns. It supplements `apps/web/AGENTS.md` by detailing routing, layout, and error handling conventions.

## 1. App Router Structure

This directory utilizes Next.js App Router features for routing and data fetching. Key files and patterns include:

*   **`layout.tsx`**: Defines the UI shared across routes. The root `layout.tsx` wraps the entire application.
*   `apps/web/src/app/[locale]/page.tsx`: Renders the unique UI for a route segment.
*   `apps/web/src/app/[locale]/loading.tsx`: Provides an instant loading state for a route segment.
*   `apps/web/src/app/[locale]/error.tsx`: Defines an error boundary for a route segment, gracefully handling runtime errors.
*   not-found.tsx: Renders a 404 page when a route is not found.

## 2. Route Group Patterns

Route groups are used to organize routes without affecting the URL path. They are defined by enclosing a folder name in parentheses, e.g., `(auth)`.

*   **(auth)**: Contains authentication-related routes like `login`, `register`, `forgot-password`.
*   **(main)**: Contains core application routes.

## 3. Locale Routing Structure

The application supports internationalization (i18n) through locale-prefixed routes. The `[locale]` dynamic segment is crucial for this:

*   **`[locale]`**: This folder name is literally `[locale]` and acts as a dynamic segment for the active language. All routes within this segment will be prefixed with the locale (e.g., /en/dashboard, /ko/dashboard).

## 4. Further Guidance

For web application commands and general principles, refer to `apps/web/AGENTS.md`. For specific guidance on locale-prefixed routes, refer to `apps/web/src/app/[locale]/AGENTS.md`.

