# Changelog

## Unreleased — Phase 1

- Replaced the prior product with an independent `apps/nod` implementation: a Cloudflare Worker + D1 personal link library, vanilla public web app, and Manifest V3 extension.
- The active product saves URL, title, source, and saved time; users can list, search, open, and delete their own saved links after Google sign-in.
- Article-body collection and AI processing are intentionally excluded.
- Local Google login and extension connection, toolbar saving, duplicate handling, and library search were verified in Aside (Chromium). This is not a verification in a separate Google Chrome application.
- Remote deployment and DNS changes have not been performed.
