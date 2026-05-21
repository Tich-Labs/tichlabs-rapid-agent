# Security Policy

## Sensitive Data Notice

This application processes sensitive Sexual and Gender-Based Violence (SGBV) survivor data. Security is paramount. All contributors and deployers must handle this data with the highest level of care.

## Supported Versions

| Version | Supported |
|---------|-----------|
| main    | ✅        |

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Please report vulnerabilities privately via GitHub's [Security Advisories](https://github.com/Tich-Labs/tichlabs-rapid-agent/security/advisories/new) or by emailing the maintainers directly.

Include:
- A description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will acknowledge receipt within 48 hours and aim to release a fix within 7 days for critical issues.

## Security Practices

- **No PII in logs** — survivor data is anonymized at collection
- **Row Level Security** — Supabase RLS policies enforce data access per user role
- **Secrets management** — all credentials stored in environment variables, never committed
- **Audit log** — all data access and modifications are logged
- **HTTPS only** — the app must be served over HTTPS in production
- **Offline queue encryption** — offline submissions should be considered for encryption at rest

## Known Security Assumptions

- The Supabase anon key is safe to expose in the frontend (it is row-level-security protected)
- The app trusts the authenticated Supabase session for authorization decisions
- AI recommendations require human staff approval before being acted upon
