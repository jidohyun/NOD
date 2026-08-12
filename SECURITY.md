# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest  | Yes       |

## Reporting a Vulnerability

If you discover a security vulnerability in NOD, please report it responsibly.

**Please do NOT open a public GitHub issue for security vulnerabilities.**

Instead, please report them via [GitHub Private Vulnerability Reporting](https://github.com/jidohyun/NOD/security/advisories/new).

### What to include

- A description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Suggested fix (if any)

### Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 1 week
- **Fix & Disclosure**: We aim to resolve critical issues within 30 days

### Scope

The following are in scope:

- NOD web application (`nod-archive.com`)
- NOD Chrome extension
- NOD API endpoints

### Out of Scope

- Third-party services and dependencies (please report to their maintainers)
- Issues that require physical access to a user's device
- Social engineering attacks

## Security Best Practices for Contributors

- Never commit secrets, API keys, or credentials
- Use environment variables for sensitive configuration
- Validate and sanitize all user inputs
- Follow the principle of least privilege

Thank you for helping keep NOD and its users safe!
