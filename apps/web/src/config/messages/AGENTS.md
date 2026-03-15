# AGENTS.md - Web i18n Message Catalogs Guidance

This document provides specific guidance for AI agents operating within the `apps/web/src/config/messages/` directory. It focuses on message key conventions and how to add translations, supplementing `apps/web/src/config/AGENTS.md`.

## 1. Purpose

This directory contains JSON files that serve as message catalogs for internationalization (i18n). Each file corresponds to a specific locale (e.g., `en.json`, `ko.json`) and holds key-value pairs for all user-facing strings in that language.

## 2. Message Key Conventions

*   **Structure**: Message keys should follow a hierarchical, dot-separated convention (e.g., `common.buttons.submit`, `homepage.hero.title`).
*   **Readability**: Keys should be descriptive and reflect the content or context of the message.
*   **Consistency**: Maintain consistent naming conventions across all message files.

## 3. Adding New Translations

To add a new translation or update an existing one:

1.  **Identify the Key**: Determine the appropriate hierarchical key for the message. If it's a new message, create a new key.
2.  **Locate Files**: Navigate to the relevant locale JSON files (e.g., `en.json`, `ko.json`).
3.  **Add/Update Entry**: Add the new key-value pair or update the value for an existing key in each locale file.
    ```json
    {
      "common": {
        "buttons": {
          "submit": "Submit"
        }
      },
      "homepage": {
        "hero": {
          "title": "Welcome to NOD"
        }
      }
    }
    ```
4.  **No Hardcoded Strings**: Agents MUST ensure that all user-facing strings are sourced from these message catalogs. Direct hardcoding of strings in components or pages is strictly forbidden.

## 4. Further Guidance

For general configuration guidance, refer to `apps/web/src/config/AGENTS.md`. For i18n routing helpers usage and locale list updates, refer to `apps/web/src/lib/i18n/AGENTS.md`.
