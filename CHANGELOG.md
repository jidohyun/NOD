# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Added dedicated discussion summarization support for Reddit threads, including a new `discussion` content type and discussion-aware analysis prompts that preserve the thread's core question, insider takeaways, disagreements, and evidence signals.
- Added discussion metadata panels to article detail and shared article views so discussion-specific structure stays visible after save.

### Changed

- Markdown copy/export now includes discussion metadata sections for discussion content instead of dropping the extra structure outside the UI.
- Shared article badges, OG labels, and content-type surfaces now recognize discussion content alongside existing article types.

### Fixed

- Improved Reddit thread detection in the extension save flow so async extraction can handle Reddit canonical, shortlink, and share-link entry points more reliably.
- Stabilized a promo entitlement test that had started failing after April 1, 2026 due to wall-clock time assumptions in the fixture.

## [1.3.1] - 2026-03-25

### Fixed

- Restored production authentication for legacy Supabase HS256 access tokens that do not include `kid`, which had caused blanket 401 responses after JWT hardening.
- Replaced unsafe claims-only fallback with explicit HS256 signature verification using `SUPABASE_JWT_SECRET`.
- Added regression coverage for HS256 signature success/failure and missing-secret rejection paths in API auth tests.

## [1.3.0] - 2026-03-25

### Added

- Internal promo code issuer flow for admin users, including issue/list/disable actions in the web app.
- Promo subscription entitlement schema and API test coverage for promo admin contracts.
- Stronger Supabase JWT validation in API auth path (JWKS signature validation, claim checks, and key/algorithm safeguards).

### Changed

- Billing/help/admin promo surfaces now render with improved dark-mode contrast for cards, inputs, and controls.
- Admin access checks are now consistently enforced in both web route guards and API admin endpoints.
- Added explicit schema-discipline guardrails to agent documentation for migration-first runtime validation.

### Fixed

- Resolved runtime `UndefinedTableError` failures on promo endpoints by applying pending promo-code migrations.
- Improved promo action error mapping and messaging consistency for duplicate/not-found conditions.

## [1.0.0] - 2026-02-20

First official production release for the web product.

### Added

- Production-ready web dashboard for saving, browsing, and analyzing content.
- AI-assisted summary workflow with semantic search and markdown export.
- Pricing and billing management flow for paid subscriptions.
- Knowledge graph view for concept exploration.
- Localized UI support for English, Korean, and Japanese.

### Changed

- Improved content list and detail UX with richer metadata and filters.
- Updated landing and marketing pages for SEO and onboarding clarity.

### Fixed

- Stabilized dashboard and article UI integration issues in recent web releases.
- Resolved payment-domain and deployment-related web issues before launch.

[Unreleased]: https://github.com/jidohyun/NOD/compare/web-v1.3.1...HEAD
[1.3.1]: https://github.com/jidohyun/NOD/compare/web-v1.3.0...web-v1.3.1
[1.3.0]: https://github.com/jidohyun/NOD/compare/web-v1.0.0...web-v1.3.0
[1.0.0]: https://github.com/jidohyun/NOD/releases/tag/web-v1.0.0
