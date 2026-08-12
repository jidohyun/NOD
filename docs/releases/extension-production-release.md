# Extension Production Release Guide

This guide covers production packaging and GitHub release publication for the browser extension.

## Scope

- Build a production extension bundle from `apps/extension`.
- Package it as a zip artifact ready for Chrome Web Store upload.
- Publish a GitHub Release with the packaged zip attached.

Chrome Web Store publication is still a manual final step.

## Versioning Rule

- Source of truth: `apps/extension/package.json` `version`.
- Manifest version is generated from `package.json` version during build.
- Release tag format: `extension-vX.Y.Z`.

## Local Release Prep

From repository root:

```bash
bun run --cwd apps/extension release:prep
```

This runs:

1. Type check (`bun run typecheck`)
2. Manifest localization generation (`bun run build:manifest-i18n`, included inside `build:prod`)
3. Production build (`bun run build:prod`)
4. Zip packaging (`bun run package:prod`)

Artifact output:

- `apps/extension/dist/release/nod-extension-v<version>.zip`

## GitHub Workflow

Workflow file:

- `.github/workflows/release-extension.yml`

Triggers:

- Push tag `extension-v*` (recommended for official release)
- Manual `workflow_dispatch`

What it does:

1. Install deps with Bun
2. Run extension typecheck
3. Build production bundle
4. Package zip
5. Upload artifact
6. Create GitHub Release and attach zip

## Version Bump Commands

Use the extension package scripts to bump version before release:

```bash
# Patch release (1.1.0 -> 1.1.1)
bun run --cwd apps/extension version:patch

# Minor release (1.1.0 -> 1.2.0)
bun run --cwd apps/extension version:minor

# Major release (1.1.0 -> 2.0.0)
bun run --cwd apps/extension version:major

# Print the release tag for current version
bun run --cwd apps/extension release:tag
```

## Official Release Procedure

1. Bump extension version with one of the version scripts above.
2. Run local prep command and verify output zip.
3. Commit version/changelog updates.
4. Create and push tag:

```bash
git tag -a extension-vX.Y.Z -m "Extension vX.Y.Z"
git push origin extension-vX.Y.Z
```

5. Confirm workflow completion and GitHub release asset.
6. Update the Chrome Web Store localized listing copy before publish:
   - Korean source of truth: `apps/extension/store-listing/ko.md`
   - Confirm the dashboard Korean detailed description matches the markdown exactly.
7. Upload generated zip to Chrome Web Store dashboard.

## Manual Run Notes

For `workflow_dispatch`:

- Set `release_tag` (for example `extension-v1.0.0`).
- Keep `create_github_release=true` for normal release flow.

If the tag does not exist, the workflow creates and pushes it at the selected commit.

## Verification Checklist

- `apps/extension/package.json` version matches target release.
- `apps/extension/dist/.generated/_locales/en/messages.json` exists before packaging.
- `apps/extension/dist/.generated/_locales/ko/messages.json` exists before packaging.
- `apps/extension/dist/.generated/_locales/ja/messages.json` exists before packaging.
- `apps/extension/dist/prod/manifest.json` version matches package version.
- `apps/extension/dist/prod/manifest.json` contains `default_locale`.
- `apps/extension/dist/prod/manifest.json` uses `__MSG_` references for `name` and `description`.
- `apps/extension/dist/prod/_locales/` exists in the packaged build output.
- Zip exists under `apps/extension/dist/release/`.
- Korean dashboard copy matches `apps/extension/store-listing/ko.md`.
- GitHub Actions `Release Extension` run is green.
- GitHub Release includes zip asset.
