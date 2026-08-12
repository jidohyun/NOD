# AGENTS.md - Chrome Extension Content Script Guidance

This document provides specific guidance for AI agents operating within the Chrome Extension's content script context. It supplements the root `AGENTS.md` and provides local conventions.

## 1. Core Principles

*   **DOM Interaction**: Content scripts operate within the context of the web page, allowing direct access to the DOM. Use this capability for extracting information or injecting UI elements.
*   **Isolation**: Content scripts run in an isolated world, meaning they cannot directly access JavaScript variables or functions from the page's own scripts, and vice-versa. Communication must happen via message passing.
*   **Message Passing**: Communicate with the background script using `chrome.runtime.sendMessage` and `chrome.runtime.onMessage`. Define clear message types and data structures.
*   **DOM Extraction Boundary**: Clearly define the boundary for extracting information from the DOM. Focus on relevant content and avoid over-extraction.
*   **Host/Path Heuristics**: Implement heuristics based on `window.location.hostname` and `window.location.pathname` to determine when and how to activate content script functionality on specific websites or pages.

## 2. Available Commands (via `npm run`)

The following commands are relevant for development within the content script:

| Command         | Description                                   |
| :-------------- | :-------------------------------------------- |
| `dev`           | Starts development mode for all extension parts |
| `build:prod`    | Builds the extension for production           |
| `typecheck`     | Type checks the entire extension codebase     |

## 3. Where to Look

*   `apps/extension/src/content/content-script.ts`
*   `apps/extension/src/content/extractor.ts`
*   `apps/extension/src/lib/`

## 4. Security Considerations

*   **Input Sanitization/XSS Risks**: Any content injected into the DOM from external sources (e.g., API responses) MUST be sanitized to prevent Cross-Site Scripting (XSS) vulnerabilities. Use DOMPurify or similar libraries.
*   **Privilege Separation**: Content scripts have elevated privileges on the web page. Exercise caution and only perform necessary actions.
*   **No Sensitive Data Handling**: Avoid handling sensitive user data directly within content scripts. Route such data through the background script for secure processing and storage.
