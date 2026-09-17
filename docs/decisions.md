# NOD Decisions

| Date | Decision | Rationale |
|---|---|---|
| 2026-09-13 | Phase 1 is one-click extension link saving and a personal link library. | Store only URL, title, source, and saved time. Signed-in users can list, search, open, and delete their own links. Body collection, AI summaries, and claim/relation extraction are excluded. |
| 2026-09-13 | The implementation lives only in `apps/nod`. | It is a new Cloudflare Worker + D1 application with a vanilla public web app and a Manifest V3 extension. Legacy applications, dependencies, infrastructure, and data models are not part of Phase 1. |
| 2026-09-13 | Defer visual investment and keep the web UI simple. | Preserve separate HTML, CSS, and JavaScript. Do not add a UI framework or needless abstraction until a design decision requires it. |
| 2026-09-13 | Remote operations require explicit approval. | Deployment, DNS, remote Cloudflare changes, commits, and pushes are not implied by local work or verification. |
