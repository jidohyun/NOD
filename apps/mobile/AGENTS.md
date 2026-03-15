# apps/mobile/AGENTS.md - Mobile Application Guidance

This document provides specific guidance for AI agents working within the `apps/mobile` Flutter application. It supplements the root `AGENTS.md` by detailing local conventions, commands, and key file locations.

## 1. Purpose / Scope
- Develop and maintain the Flutter mobile application.
- Integrate with the API services.
- Ensure consistent UI/UX across mobile platforms.

## 2. Commands (via `mise run` from `apps/mobile/`)

| Command    | Description                                   |
| :--------- | :-------------------------------------------- |
| `dev`      | Run the mobile application                    |
| `build`    | Build the mobile application                  |
| `install`  | Install Flutter dependencies                  |
| `lint`     | Analyze mobile app for issues                 |
| `format`   | Format mobile app code                        |
| `test`     | Run all tests                                 |
| `gen:l10n` | Generate localization files                   |
| `gen:api`  | Generate API client from OpenAPI spec         |

## 3. Where to Look
- **Main Application Entry**: `lib/main.dart`
- **Project Configuration**: `pubspec.yaml`
- **Tests**: `test/`
- **Analysis Options**: `analysis_options.yaml`

## 4. Gotchas
- Ensure Flutter SDK is correctly configured in your environment.
- API client generation (`gen:api`) requires an OpenAPI specification.
