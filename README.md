# Tich Labs SGBV Case Management — Rapid Agent Hackathon

A trauma-informed, AI-powered SGBV incident management platform. Built with **Gemini 2.5 Flash**, **Google Cloud Agent Builder**, and **MongoDB MCP** for the [Google Cloud Rapid Agent Hackathon](https://rapid-agent.devpost.com/).

[![Deploy to Firebase](https://github.com/Tich-Labs/tichlabs-rapid-agent/actions/workflows/deploy-firebase.yml/badge.svg)](https://github.com/Tich-Labs/tichlabs-rapid-agent/actions/workflows/deploy-firebase.yml)

**Live app**: https://sgbv-incidenttracker.web.app/
**Docs / Interactive guide**: https://sgbv-incidenttracker.web.app/docs/
**Agent card (A2A)**: https://sgbv-incidenttracker.web.app/docs/agent-card.json
**MCP server**: https://tichlabs-sgbv-mcp-xxxxx-uc.a.run.app/

---

## Status

⚠️ **Active migration**: Supabase → Firebase/Firestore. Build verification in progress.

| Layer | Status | Notes |
|-------|--------|-------|
| Firebase Auth provider | Done | Replaces Supabase auth |
| Firestore compat layer | Done | `supabase.ts` now wraps Firestore |
| Frontend pages | Done | API surface preserved via compat |
| MCP server | Pending | Still uses Supabase — needs Firestore Admin SDK |
| Build verification | Pending | Vite build timing out locally — needs CI check |
| Firebase deploy | Pending | Needs Firebase config secrets in GitHub |

---

## Rapid Agent Hackathon — MongoDB Track

This project is submitted to the **MongoDB partner track**. Our agent:

- **Moves beyond chat** — performs multi-step SGBV case management
- **MongoDB MCP superpowers** — case storage, full-text search, analytics aggregation
- **Built with Gemini** — AI-powered matching, risk assessment, FHIR generation

### Partner MCP Integration: MongoDB

| Tool | Description |
|------|-------------|
| `store_case_document` | Persist rich case narratives with tags, risk scores, and metadata |
| `search_case_documents` | Full-text search across cases by description, location, or tags |
| `aggregate_cases` | Analytics grouped by incident type, location, severity, status, or month |

### Built With

- **Gemini 2.5 Flash** — primary LLM
- **Google Cloud Agent Builder** — agent orchestration (`agent-builder.json`)
- **Firebase** — Auth, Firestore DB, Hosting
- **MongoDB Atlas MCP** — document store, search, and analytics (hackathon partner)
- **FHIR R4** — interoperable healthcare data exchange

---

## Project Structure

```
├── frontend/              # Vite + React + TypeScript PWA
│   ├── src/
│   │   ├── pages/         # App pages (dashboard, incidents, referrals, reports)
│   │   ├── components/    # Reusable UI components + FirebaseAuthProvider
│   │   ├── lib/           # firebase.ts, firestore.ts, fhir utilities
│   │   ├── hooks/         # use-firestore-query, use-offline-incident-queue
│   │   └── locales/       # i18n (English, Swahili)
│   └── public/            # Static assets, service worker
├── mcp-server/            # MCP server (Node.js + TypeScript)
│   └── src/
│       ├── tools/         # match-services, assess-risk, generate-fhir, mongodb-tools
│       └── lib/           # LLM providers (Gemini, OpenAI, Groq), Supabase, MongoDB clients
├── docs/                  # Static documentation + agent card (A2A)
├── supabase/              # Schema, migrations, seed data (legacy — migrating to Firestore)
├── agent-builder.json     # Google Cloud Agent Builder configuration
├── firebase.json          # Firebase Hosting configuration
└── LICENSE                # Apache 2.0
```

---

## MCP Server Tools

| Tool | Description | AI-Powered |
|------|-------------|------------|
| `match_services` | Match incidents to referral services | Yes (Gemini) |
| `generate_fhir_bundle` | Generate FHIR R4 transaction Bundle | No |
| `assess_risk` | Risk assessment with score, severity, urgency | Yes (Gemini) |
| `store_case_document` | Store case narrative in MongoDB | No |
| `search_case_documents` | Full-text search across MongoDB cases | No |
| `aggregate_cases` | Analytics aggregation from MongoDB | No |

---

## Getting Started

### Prerequisites

- Node.js 22+
- Firebase project (Firestore + Auth + Hosting)
- MongoDB Atlas cluster
- Gemini API key

### Environment Variables — Frontend

```bash
# Firebase
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

# MCP Server
VITE_MCP_SERVER_URL=https://tichlabs-sgbv-mcp-xxxxx-uc.a.run.app/
VITE_MCP_API_KEY=your-mcp-api-key-here
```

### Environment Variables — MCP Server

```bash
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash
SUPABASE_URL=...          # still used by MCP server — pending migration
SUPABASE_ANON_KEY=...     # still used by MCP server — pending migration
MONGODB_URI=mongodb+srv://...
MONGODB_DB_NAME=tichlabs_cases
MCP_API_KEY=...
MCP_TRANSPORT=http
PORT=3001
```

### Run Locally

```bash
# Frontend
cd frontend && npm install && npm run dev

# MCP Server
cd mcp-server && npm install && npm run dev:http
```

---

## Deployment

### Firebase Hosting (Frontend)

Auto-deploys on push to `main`.

Required GitHub secrets:
- `FIREBASE_SERVICE_ACCOUNT`
- `VITE_FIREBASE_API_KEY` through `VITE_FIREBASE_APP_ID` (6 Firebase config vars)
- `VITE_MCP_SERVER_URL`
- `VITE_MCP_API_KEY`

### Cloud Run (MCP Server)

Auto-deploys on push to `main` (`deploy-cloud-run.yml`).

Required GitHub secrets:
- `GCP_SERVICE_ACCOUNT_KEY`
- `GEMINI_API_KEY`, `GEMINI_MODEL`
- `MONGODB_URI`
- `MCP_API_KEY`

---

## Pending Tasks

- [ ] **Frontend build verification** — Vite build timing out locally. Needs CI run with proper Node version (22.x).
- [ ] **MCP server migration** — `mcp-server/src/lib/supabase.ts` still queries Supabase. Needs Firebase Admin SDK + Firestore rewrite.
- [ ] **Firebase deploy** — Add all Firebase config secrets to GitHub, then re-run deploy workflow.
- [ ] **Firestore security rules** — Write `firestore.rules` with proper access controls.
- [ ] **Seed data** — Create Firestore seed script matching `supabase/seed.sql`.
- [ ] **Demo video** — Record ~3 minute walkthrough.
- [ ] **Devpost submission** — Complete submission form.

## License

Apache 2.0 — See [LICENSE](LICENSE)
