# NOD Agent Notes

NOD Phase 1 lives only in `apps/nod`: a Cloudflare Worker + D1 link library, vanilla public HTML/CSS/JavaScript, and a Manifest V3 extension. It saves link metadata only; do not reintroduce body collection, AI features, legacy apps, or legacy infrastructure.

Read [AGENTS.md](AGENTS.md) for working rules and commands. Read [docs/decisions.md](docs/decisions.md) before changing product scope, and [docs/handoff.md](docs/handoff.md) before relying on a verification or deployment claim.

Keep HTML, CSS, and JavaScript separate. Styling work, UI frameworks, and needless UI abstractions are out of scope until the user makes a design decision. Never expose values from the ignored `apps/nod/.dev.vars` file.

Commit, push, deploy, DNS, and remote-resource changes require explicit approval from the user or repository owner. There is no standing approval for remote actions.
