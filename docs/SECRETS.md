# Environment Variables & Secrets Reference

Every variable and secret required across all environments.

---

## GitHub Secrets (Settings → Secrets and variables → Actions)

| Secret Name | Used By | Contains |
|-------------|---------|----------|
| `FIREBASE_SERVICE_ACCOUNT` | `deploy-firebase.yml`, `deploy-cloud-run.yml` | Full JSON content of `sgbv-incidenttracker-firebase-adminsdk-fbsvc-0e830c495d.json` |
| `VITE_FIREBASE_API_KEY` | `deploy-firebase.yml` | Firebase Web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | `deploy-firebase.yml` | `sgbv-incidenttracker.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `deploy-firebase.yml` | `sgbv-incidenttracker` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `deploy-firebase.yml` | `sgbv-incidenttracker.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `deploy-firebase.yml` | `740048302235` |
| `VITE_FIREBASE_APP_ID` | `deploy-firebase.yml` | `1:740048302235:web:9c1c553896489027d5d63e` |
| `VITE_MCP_SERVER_URL` | `deploy-firebase.yml`, `deploy-cloud-run.yml` | Cloud Run MCP URL (e.g. `https://tichlabs-sgbv-mcp-xxxxx-uc.a.run.app/mcp`) |
| `VITE_MCP_API_KEY` | `deploy-firebase.yml`, `deploy-cloud-run.yml` | MCP API key for frontend-to-MCP auth |
| `GEMINI_API_KEY` | `deploy-cloud-run.yml` | Gemini API key |
| `GEMINI_MODEL` | `deploy-cloud-run.yml` | `gemini-2.5-flash` (or other model) |
| `MONGODB_URI` | `deploy-cloud-run.yml` | MongoDB Atlas connection string |
| `MCP_API_KEY` | `deploy-cloud-run.yml` | Same as `VITE_MCP_API_KEY` — API key the frontend sends to MCP server |
| `GITHUB_TOKEN` | `deploy-firebase.yml` | Auto-provided by GitHub Actions |

> **Note**: `FIREBASE_SERVICE_ACCOUNT` does double duty — it's used for Firebase Hosting auth AND passed as the `FIREBASE_SERVICE_ACCOUNT_JSON` env var to the Cloud Run MCP container. One secret, two purposes.

---

## Frontend `.env.local` (local development)

| Variable | Example | Source |
|----------|---------|--------|
| `VITE_FIREBASE_API_KEY` | `AIzaSyDS...` | Firebase Console → Project Settings → Web App |
| `VITE_FIREBASE_AUTH_DOMAIN` | `sgbv-incidenttracker.firebaseapp.com` | Firebase Console |
| `VITE_FIREBASE_PROJECT_ID` | `sgbv-incidenttracker` | Firebase Console |
| `VITE_FIREBASE_STORAGE_BUCKET` | `sgbv-incidenttracker.firebasestorage.app` | Firebase Console |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `740048302235` | Firebase Console |
| `VITE_FIREBASE_APP_ID` | `1:740048302235:web:...` | Firebase Console |
| `VITE_MCP_SERVER_URL` | `https://tichlabs-sgbv-mcp-xxxxx-uc.a.run.app/mcp` | Cloud Run MCP service URL |
| `VITE_MCP_API_KEY` | `your-mcp-api-key-here` | Must match `MCP_API_KEY` on MCP server |
| `VITE_ORG_NAME` | `Youth Changers Kenya` | Optional — org display name |
| `VITE_ORG_LOCATION` | `Kakamega, Vihiga & Nairobi` | Optional — org location |

---

## MCP Server `.env` (local development in `mcp-server/`)

| Variable | Required | Description |
|----------|----------|-------------|
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Yes | Full service account JSON content (one-line string) |
| `GEMINI_API_KEY` | No | Gemini API key — falls back to keyword matching |
| `GEMINI_MODEL` | No | Default: `gemini-2.5-flash` |
| `OPENAI_API_KEY` | No | OpenAI fallback |
| `OPENAI_MODEL` | No | Default: `gpt-4o-mini` |
| `GROQ_API_KEY` | No | Groq fallback |
| `GROQ_MODEL` | No | Default: `llama-3.3-70b-versatile` |
| `OLLAMA_BASE_URL` | No | Local Ollama fallback |
| `OLLAMA_MODEL` | No | Default: `llama3.2` |
| `MONGODB_URI` | No | MongoDB Atlas connection string |
| `MONGODB_DB_NAME` | No | Default: `tichlabs_cases` |
| `MCP_TRANSPORT` | No | `http` for HTTP mode, omit for stdio |
| `MCP_API_KEY` | No | Required when `MCP_TRANSPORT=http` |
| `PORT` | No | Default: `3001` |

### How to run locally

```bash
cd mcp-server

# Copy and fill in .env from .env.example
cp .env.example .env
# Edit .env with real values

# HTTP mode (for frontend dev)
npm run dev:http

# Stdio mode (for Claude Desktop)
npm run dev
```

---

## CI/CD Pipeline — Where each variable flows

### `deploy-firebase.yml` (runs on push to main)

```
GitHub Secret                →    Build-time env var        →    Frontend bundle
─────────────────────────────────────────────────────────────────────────────────
VITE_FIREBASE_API_KEY        →    VITE_FIREBASE_API_KEY     →    firebase.ts
VITE_FIREBASE_AUTH_DOMAIN    →    VITE_FIREBASE_AUTH_DOMAIN →    firebase.ts
VITE_FIREBASE_PROJECT_ID     →    VITE_FIREBASE_PROJECT_ID  →    firebase.ts
VITE_FIREBASE_STORAGE_BUCKET →    VITE_FIREBASE_STORAGE_... →    firebase.ts
VITE_FIREBASE_MESSAGING_...  →    VITE_FIREBASE_MESSAGING_..→    firebase.ts
VITE_FIREBASE_APP_ID         →    VITE_FIREBASE_APP_ID      →    firebase.ts
VITE_MCP_SERVER_URL          →    VITE_MCP_SERVER_URL       →    mcp-client.ts
VITE_MCP_API_KEY             →    VITE_MCP_API_KEY          →    mcp-client.ts
(static)                     →    VITE_ORG_NAME             →    OrgBanner, About page
(static)                     →    VITE_ORG_LOCATION         →    OrgBanner, About page
FIREBASE_SERVICE_ACCOUNT     →    (deploy auth + rules deploy)
```

### `deploy-cloud-run.yml` (manual dispatch)

```
GitHub Secret                →    MCP container env var
─────────────────────────────────────────────────────────
FIREBASE_SERVICE_ACCOUNT     →    FIREBASE_SERVICE_ACCOUNT_JSON (via YAML file)
GEMINI_API_KEY               →    GEMINI_API_KEY
GEMINI_MODEL                 →    GEMINI_MODEL
MONGODB_URI                  →    MONGODB_URI
(none)                       →    MONGODB_DB_NAME = tichlabs_cases
(none)                       →    MCP_TRANSPORT = http
MCP_API_KEY                  →    MCP_API_KEY
```

---

## Where to get each value

| Value | Where to find it |
|-------|-----------------|
| Firebase service account JSON | Firebase Console → Project Settings → Service accounts → Generate new private key |
| Firebase Web config (6 values) | Firebase Console → Project Settings → General → Your apps → Web app → Firebase SDK snippet → Config |
| Gemini API key | [Google AI Studio](https://aistudio.google.com/apikey) |
| MongoDB URI | MongoDB Atlas → Clusters → Connect → Drivers → Connection string |
| MCP_API_KEY / VITE_MCP_API_KEY | Make up a random string (same value in both places) |
| Cloud Run MCP URL | After first Cloud Run deploy, from the deploy step output or `gcloud run services describe tichlabs-sgbv-mcp --format='value(status.url)'` |

---

## Quick check: are all secrets set in GitHub?

Go to repo **Settings → Secrets and variables → Actions → Secrets** and confirm these exist:

- `FIREBASE_SERVICE_ACCOUNT`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_MCP_SERVER_URL`
- `VITE_MCP_API_KEY`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `MONGODB_URI`
- `MCP_API_KEY`
