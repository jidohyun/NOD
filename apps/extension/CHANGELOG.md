# Changelog

All notable changes to the browser extension are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.3.0] - 2026-03-25

### Added

- Friendly premium-content gating messages in the popup for unsupported plans.
- Documentation-site extraction detection to improve article parsing quality.
- Extraction failure logging from extension requests for analytics and debugging.

### Fixed

- Prevented token refresh failures from terminating extension authentication sessions.

### Changed

- Expanded extension agent guidance for root/background/content/popup runtime boundaries.

## [1.2.0] - 2026-03-03

### Added

- Silent token refresh flow for the extension service worker (`alarms`-based scheduling + retry).
- Refresh token persistence in extension auth storage.
- Extension auth bridge now forwards `refreshToken` and `expiresIn` metadata from web login.
- API endpoint for extension token refresh proxy (`/api/auth/extension-refresh`).

### Changed

- Added Supabase env variables for extension refresh integration in API env template.

## [0.1.0] - 2026-02-20

### Added

- Initial production-ready extension foundation (MV3 popup, service worker, content script).
- Production packaging and GitHub release workflow support.

[Unreleased]: https://github.com/jidohyun/NOD/compare/extension-v1.3.0...HEAD
[1.3.0]: https://github.com/jidohyun/NOD/compare/extension-v1.2.0...extension-v1.3.0
[1.2.0]: https://github.com/jidohyun/NOD/compare/extension-v1.1.0...extension-v1.2.0
[1.1.0]: https://github.com/jidohyun/NOD/releases/tag/extension-v1.1.0
[0.1.0]: https://github.com/jidohyun/NOD/releases/tag/extension-v0.1.0
