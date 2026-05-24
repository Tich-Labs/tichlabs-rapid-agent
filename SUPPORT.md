# Support

## Documentation

- [README](README.md) — project overview and quick start
- [Interactive Guide](https://sgbv-incidenttracker.web.app/docs/) — full walkthrough with screenshots
- [CONTRIBUTING.md](CONTRIBUTING.md) — how to set up locally and contribute
- [SECURITY.md](SECURITY.md) — vulnerability reporting and security practices

## Getting Help

| Channel | Purpose |
|---------|---------|
| [GitHub Discussions](https://github.com/Tich-Labs/tichlabs-rapid-agent/discussions) | Questions, ideas, general discussion |
| [GitHub Issues](https://github.com/Tich-Labs/tichlabs-rapid-agent/issues) | Bug reports and feature requests |
| [Security Advisories](https://github.com/Tich-Labs/tichlabs-rapid-agent/security/advisories) | Private vulnerability reporting |

## Common Issues

### Build timing out locally

Run `NODE_OPTIONS="--max-old-space-size=4096" npm run build` to increase Node's memory limit.

### Firebase emulators not working

Make sure you have run `firebase init emulators` and the Firebase CLI is installed (`npm install -g firebase-tools`).

### MCP server returning 500 errors

Check that environment variables are set in `mcp-server/.env`:
- `GEMINI_API_KEY` — required for AI-powered tools
- `MONGODB_URI` — required for case storage and search
- Tools fall back to keyword matching if no LLM is configured.
