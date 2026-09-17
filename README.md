# NOD

NOD is a personal link library. Its Manifest V3 browser extension saves the current page, and the web app lets each signed-in user browse, search, open, and delete saved links.

Phase 1 stores only the URL, title, source, and saved time. It does **not** collect article bodies or run AI analysis.

## Active implementation

The only active app is [`apps/nod`](apps/nod):

- Cloudflare Worker with D1 for the API and user data
- public vanilla HTML, CSS, and JavaScript for the web app
- a Manifest V3 extension in `apps/nod/extension`

Keep HTML (structure), CSS (style), and JavaScript (behavior) separate. Do not add a UI framework or abstraction for this intentionally small interface; styling investment is deferred until a design decision is made.

## Local development
Requires Bun and Node.js 22 or newer.

Run all commands from `apps/nod`:

```bash
bun install --frozen-lockfile
bun run db:local
bun run dev
```

The local app is served at `http://localhost:8787`.

Useful checks:

```bash
bun run check # JavaScript syntax checks
bun run build # Wrangler deployment dry-run; does not deploy remotely
```

Google OAuth configuration belongs in the ignored `apps/nod/.dev.vars`. Do not read, commit, or document credential values. Each separate local environment needs its own authorized configuration.

## Load the extension locally

In a Chromium-based browser, enable Developer mode on the extensions page and load `apps/nod/extension` as an unpacked extension. Set the service URL in the extension options to `http://localhost:8787` for local use.

## Project state

See [decisions](docs/decisions.md) for the product contract and [handoff](docs/handoff.md) for verified behavior and known limits. Remote deployment and DNS are not complete.

Commit, push, and deploy actions require explicit approval from the user or repository owner; local changes and successful checks do not imply that approval.

## License

[MIT](LICENSE)
