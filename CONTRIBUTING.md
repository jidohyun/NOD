# Contributing to NOD

Thank you for your interest in contributing to NOD! This guide will help you get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Commit Convention](#commit-convention)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

NOD is a monorepo containing:

| App | Path | Description |
|-----|------|-------------|
| Web | `apps/web/` | Next.js web application |
| API | `apps/api/` | Python API server |
| Extension | `apps/extension/` | Chrome extension |
| Worker | `apps/worker/` | Background worker |
| Mobile | `apps/mobile/` | Flutter mobile app |

## Development Setup

### Prerequisites

- [mise](https://mise.jdx.dev/) (task runner)
- [Docker](https://www.docker.com/) (for local infrastructure)
- Node.js and Bun (managed via mise)
- Python 3.11+ (for API)

### Installation

```bash
# Clone the repository
git clone https://github.com/jidohyun/NOD.git
cd NOD

# Install dependencies
mise run install

# Start local infrastructure (PostgreSQL, Redis, etc.)
mise run infra:up

# Run database migrations
mise run db:migrate

# Start development servers
mise run dev
```

### Useful Commands

| Command | Description |
|---------|-------------|
| `mise run dev` | Start all services |
| `mise run dev:web` | Start API + Web only |
| `mise run lint` | Lint all apps |
| `mise run test` | Test all apps |
| `mise run typecheck` | Type check all apps |
| `mise run format` | Format all apps |
| `mise run gen:api` | Generate OpenAPI schema and clients |

## Making Changes

1. Fork the repository and create a branch from `main`.
2. Name your branch following the pattern: `feat/description`, `fix/description`, or `chore/description`.
3. Make your changes in the appropriate app or package directory.
4. Add or update tests as needed.
5. Ensure all checks pass:
   ```bash
   mise run lint
   mise run typecheck
   mise run test
   ```

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/). Commit messages are validated by `commitlint`.

### Format

```
<type>(<scope>): <subject>
```

### Types

`feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`

### Scopes

Use a **single** app name as scope: `web`, `api`, `extension`, `worker`, `mobile`, `infra`

### Rules

- Subject must be **lowercase**
- Only **one scope** per commit (no `fix(api,web):`)
- Keep the subject concise and descriptive

### Examples

```
feat(web): add dark mode toggle
fix(api): handle empty response in pdf extraction
chore(extension): bump manifest version to 1.3.2
docs: update contributing guidelines
```

## Pull Request Process

1. Update documentation if your change affects public APIs or user-facing behavior.
2. Ensure your PR passes all CI checks (lint, typecheck, tests).
3. Fill out the PR template completely.
4. Request a review — a maintainer will review your PR as soon as possible.
5. Once approved, a maintainer will merge your PR.

### PR Tips

- Keep PRs focused — one feature or fix per PR.
- Write a clear description of **what** changed and **why**.
- Include screenshots for UI changes.
- Link related issues using `Closes #123` or `Fixes #123`.

## Issue Guidelines

- Search existing issues before creating a new one.
- Use the provided issue templates (Bug Report or Feature Request).
- Include steps to reproduce for bug reports.
- Be specific about the expected vs actual behavior.

## Questions?

If you have questions that aren't covered here, feel free to [open a discussion](https://github.com/jidohyun/NOD/discussions) or reach out through [Issues](https://github.com/jidohyun/NOD/issues).

Thank you for helping make NOD better!
