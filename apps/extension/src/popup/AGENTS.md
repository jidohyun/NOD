# AGENTS.md - Chrome Extension Popup Guidance

This document provides specific guidance for AI agents operating within the Chrome Extension's popup context. It supplements the root `AGENTS.md` and provides local conventions.

## 1. Core Principles

*   **Ephemeral UI**: The popup is a temporary UI that appears when the user clicks the extension icon. It should be lightweight, responsive, and close automatically when focus is lost.
*   **Communication with Background**: The popup communicates with the background service worker to fetch data, send commands, and update UI based on extension state. Direct communication with content scripts is generally discouraged; route through the background script.
*   **UI Conventions**: Adhere to standard UI/UX conventions for browser extensions. Keep the design clean, intuitive, and consistent with the overall application aesthetic.
*   **State Management**: The popup's state should primarily reflect the current state of the background script or the active tab. Avoid complex, independent state management within the popup itself.

## 2. Available Commands (via `npm run`)

The following commands are relevant for development within the popup:

| Command       | Description                                   |
| :------------ | :-------------------------------------------- |
| `dev`         | Starts development mode for all extension parts |
| `dev:main`    | Starts development mode for the main (background) script, which includes the popup's build process |
| `build:prod`  | Builds the extension for production           |
| `typecheck`   | Type checks the entire extension codebase     |

## 3. Where to Look

*   **Main Entry Point**: `apps/extension/src/popup/main.tsx`
*   **Root Component**: `apps/extension/src/popup/App.tsx`
*   **UI Components**: `apps/extension/src/popup/components/`
*   **Custom Hooks**: `apps/extension/src/popup/hooks/`
*   **Styling**: `apps/extension/src/popup/styles/globals.css`
*   **Shared Utilities/Types**: `apps/extension/src/lib/` and `apps/extension/src/types/`

## 4. Security Considerations

*   **No Sensitive Data Display**: Avoid displaying highly sensitive user data directly in the popup without proper obfuscation or user interaction.
*   **Input Validation**: Any user input within the popup should be validated before being sent to the background script or external services.
*   **XSS Prevention**: Ensure all dynamically rendered content is properly escaped to prevent XSS vulnerabilities.