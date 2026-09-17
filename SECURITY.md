# Security Policy

## Supported surface

The active NOD surface is `apps/nod`: its Cloudflare Worker + D1 application and Manifest V3 browser extension. No remote deployment is currently declared complete.

## Reporting a vulnerability

Please do **not** open a public issue for a security vulnerability. Report it through [GitHub Private Vulnerability Reporting](https://github.com/jidohyun/NOD/security/advisories/new) with:

- a clear description and affected surface;
- reproducible steps or a proof of concept;
- the potential impact; and
- suggested mitigation, if known.

Do not include production credentials, OAuth secrets, or private user data in a report.

## Contributor practices

- Never commit secrets, API keys, tokens, or credentials.
- Keep sensitive configuration in ignored environment files such as `apps/nod/.dev.vars`.
- Request explicit approval before remote deployment, DNS changes, or remote-resource changes.
- Handle user data with least privilege and validate untrusted input.
