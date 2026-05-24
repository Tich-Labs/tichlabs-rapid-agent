# Contributing to Tich Labs SGBV Case Management

Thank you for contributing. This project handles sensitive survivor data — please read this guide before opening a PR.

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). By participating, you agree to uphold it.

## Security

**Never include real credentials, PII, or survivor data in code, commits, or logs.** Use environment variables (`.env.local`) for secrets and anonymized test data for development.

If you find a security vulnerability, do **not** open a public issue. See [SECURITY.md](SECURITY.md) for reporting instructions.

## Getting Started

### Prerequisites

- Node.js 22+
- Firebase project (Firestore + Auth)
- MongoDB Atlas cluster
- Gemini API key

### Setup

```bash
git clone https://github.com/Tich-Labs/tichlabs-rapid-agent.git
cd tichlabs-rapid-agent/frontend
npm install
cp .env.example .env.local
# Fill in your Firebase and MCP server config
npm run dev
```

For the MCP server:

```bash
cd mcp-server
npm install
cp .env.example .env
# Fill in Gemini API key, MongoDB URI, etc.
npm run dev:http
```

## Development Workflow

1. **Fork the repo** and create a branch from `main`
2. **Make your changes** — follow existing patterns and conventions
3. **Write/update tests** if applicable
4. **Run lint and build** — `npm run lint && npm run build` in `frontend/`
5. **Test on mobile** — this is a PWA used in the field by caseworkers
6. **Open a PR** using the pull request template

## Code Style

- **TypeScript** with strict mode
- **React** functional components with hooks
- **Tailwind CSS** for styling (no custom CSS unless necessary)
- **shadcn/ui** components for UI consistency
- **i18n** for all user-facing strings (English and Swahili)
- No PII in variable names, comments, or test data

## Branch Naming

```
feat/description    — new features
fix/description     — bug fixes
docs/description    — documentation
refactor/description — code restructuring
ci/description      — CI/CD changes
```

## Commit Messages

Use present tense, imperative mood:

```
feat: add MongoDB search aggregation for case trends
fix: resolve PWA install prompt on iOS Safari
docs: update Firebase deploy instructions
```

## Review Process

1. All PRs require at least one review before merge
2. CI must pass (lint, typecheck, build)
3. No secrets or PII in the diff
4. PWA and offline behaviour verified for data-sync changes
5. Trauma-informed language reviewed for user-facing copy changes

## Questions?

Open a [GitHub Discussion](https://github.com/Tich-Labs/tichlabs-rapid-agent/discussions) for general questions. Open an issue for bugs or feature requests using the templates provided.
