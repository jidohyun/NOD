# AGENTS.md - Web i18n Library Guidance

This document provides specific guidance for AI agents operating within the `apps/web/src/lib/i18n/` directory. It focuses on internationalization routing helpers usage and where to update locale lists, supplementing `apps/web/AGENTS.md`.

## 1. Purpose

This directory contains utility functions and configurations related to internationalization (i18n), primarily for handling locale detection, routing, and message loading. It leverages `next-intl` for robust i18n support in Next.js.

## 2. Key Files and Functions

*   **config.ts**: Defines i18n configuration, including supported locales and default locale.
*   **routing.ts**: Contains `next-intl`'s `createLocalizedPathnamesNavigation` which provides `Link` and `redirect` functions that automatically handle locale prefixes.
*   **request.ts**: Handles locale detection and provides i18n utilities for server-side requests.

## 3. i18n Routing Helpers Usage

Agents should use the provided `Link` and `redirect` functions from routing.ts to ensure all internal navigation correctly incorporates the active locale.

```typescript
import { Link, redirect } from './routing';

// Example usage in a component
<Link href="/dashboard">Go to Dashboard</Link>

// Example usage in a server component or API route
redirect('/login');
```

## 4. Updating Locale Lists

To add or remove supported locales:

1.  **`config.ts` (or similar config file)**: Modify the `locales` array to include or remove locale codes (e.g., `['en', 'ko', 'ja']`).
2.  **Message Catalogs**: Ensure corresponding message catalog files (e.g., `en.json`, `ko.json`, `ja.json`) exist or are created under `src/config/messages/`.

## 5. Further Guidance

For web application commands and general principles, refer to `apps/web/AGENTS.md`. For detailed guidance on managing i18n message catalogs, refer to `apps/web/src/config/messages/AGENTS.md`.
