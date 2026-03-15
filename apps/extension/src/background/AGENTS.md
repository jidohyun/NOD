# AGENTS.md - Chrome Extension Background Service Worker Guidance

This document provides specific guidance for AI agents operating within the Chrome Extension's background service worker context. It supplements the root `AGENTS.md` and provides local conventions.

## 1. Core Principles

*   **Service Worker Lifecycle**: Understand that the background script is a service worker with an event-driven lifecycle. It can be woken up by events and terminated when idle. Avoid long-running synchronous tasks.
*   **Message Routing**: The background script is the central hub for message passing between content scripts, popup, and external services. All messages should be routed and handled here.
*   **Authentication State**: Manage and persist the user's authentication state. This includes handling login/logout events and ensuring secure token storage (e.g., using `chrome.storage.local`).
*   **External Message Validation**: ALWAYS validate messages received from external sources (e.g., content scripts, web pages) as untrusted. Sanitize inputs to prevent XSS or other injection attacks.
*   **Resource Management**: Be mindful of memory and CPU usage, as service workers have strict limits. Implement caching strategies (e.g., `chrome.storage.local`) for frequently accessed data.

## 2. Available Commands (via `npm run`)

The following commands are relevant for development within the background service worker:

| Command       | Description                                   |
| :------------ | :-------------------------------------------- |
| `dev`         | Starts development mode for all extension parts |
| `build:prod`  | Builds the extension for production           |
| `typecheck`   | Type checks the entire extension codebase     |

## 3. Where to Look

*   `apps/extension/src/background/service-worker.ts`
*   `apps/extension/src/lib/`
*   `apps/extension/src/lib/`
*   `apps/extension/src/types/`


## 4. Security Considerations

*   **Input Sanitization**: Treat all data from content scripts or web pages as untrusted. Sanitize and validate thoroughly.


*   **Manifest Configuration**: The `manifest.json` is generated at build time by `apps/extension/vite.config.ts`. All permissions, content security policies (CSP), and other manifest-related configurations should be reviewed and modified in that file.
