# Tich Labs SGBV Case Management — Rapid Agent Hackathon

A trauma-informed, AI-powered SGBV incident management platform. Built with **Gemini 2.5 Flash**, **Google Cloud Agent Builder**, and **MongoDB MCP** for the [Google Cloud Rapid Agent Hackathon](https://rapid-agent.devpost.com/).

[![Deploy to Firebase](https://github.com/Tich-Labs/tichlabs-rapid-agent/actions/workflows/deploy-firebase.yml/badge.svg)](https://github.com/Tich-Labs/tichlabs-rapid-agent/actions/workflows/deploy-firebase.yml)

**Live app**: https://sgbv-incidenttracker.web.app/
**Docs / Interactive guide**: https://sgbv-incidenttracker.web.app/docs/
**Agent card (A2A)**: https://sgbv-incidenttracker.web.app/docs/agent-card.json
**MCP server**: https://tichlabs-sgbv-mcp-xxxxx-uc.a.run.app/

---

## Rapid Agent Hackathon — MongoDB Track

This project is submitted to the **MongoDB partner track** of the Google Cloud Rapid Agent Hackathon. Our agent:

- **Moves beyond chat** — performs multi-step SGBV case management: triage → risk assessment → referral matching → FHIR documentation → case search
- **Multi-step missions** — plans and executes complex workflows with human-in-the-loop oversight
- **MongoDB MCP superpowers** — uses MongoDB Atlas for rich case document storage, full-text search, and analytics aggregation

### Partner MCP Integration: MongoDB

MongoDB Atlas powers three agent capabilities beyond our core Supabase relational store:

| Tool | Description |
|------|-------------|
| `store_case_document` | Persist rich case narratives with tags, risk scores, and metadata |
| `search_case_documents` | Full-text search across cases by description, location, or tags |
| `aggregate_cases` | Analytics grouped by incident type, location, severity, status, or month |

### Built With

- **Gemini 2.5 Flash** — primary LLM for AI-powered matching, risk assessment, and FHIR generation
- **Google Cloud Agent Builder** — agent orchestration and deployment (`agent-builder.json`)
- **MongoDB Atlas MCP** — document store, search, and analytics
- **Supabase** — relational database (incidents, services, users, audit log)
- **FHIR R4** — interoperable healthcare data exchange (SNOMED CT, HL7)

---

## How It Works

1. **Survivor reports** an incident anonymously via the PWA or a volunteer submits on their behalf
2. **Agent triages** — risk assessment scores severity (0–100) with urgency classification
3. **Agent matches** — finds the best local referral services (health, police, shelter, psychosocial, legal)
4. **Agent stores** — persists the case document in MongoDB for future search and analytics
5. **Agent generates** — creates a FHIR R4 transaction bundle for EHR submission
6. **Agent searches** — finds similar cases and surfaces trends via MongoDB aggregation

All identity data is anonymized. No PII is stored.

---

## Project Structure

```
├── frontend/              # Vite + React + TypeScript PWA
│   ├── src/
│   │   ├── pages/         # App pages (dashboard, incidents, referrals, reports)
│   │   ├── components/    # Reusable UI components
│   │   ├── lib/           # Supabase client, FHIR utilities
│   │   ├── hooks/         # React hooks (auth, queries, offline queue)
│   │   └── locales/       # i18n (English, Swahili)
│   └── public/            # Static assets, service worker
├── mcp-server/            # MCP server (Node.js + TypeScript)
│   └── src/
│       ├── tools/         # match-services, assess-risk, generate-fhir, mongodb-tools
│       └── lib/           # LLM providers (Gemini, OpenAI, Groq), Supabase, MongoDB clients
├── docs/                  # Static documentation + agent card (A2A)
├── supabase/              # Schema, migrations, seed data
├── agent-builder.json     # Google Cloud Agent Builder configuration
├── firebase.json          # Firebase Hosting configuration
└── LICENSE                # Apache 2.0
```

---

## MCP Server Tools

| Tool | Description | AI-Powered |
|------|-------------|------------|
| `match_services` | Match incidents to referral services by type, location, context | Yes (Gemini) |
| `generate_fhir_bundle` | Generate FHIR R4 transaction Bundle | No (deterministic) |
| `assess_risk` | Risk assessment with score, severity, urgency, actions | Yes (Gemini) |
| `store_case_document` | Store case narrative in MongoDB | No (deterministic) |
| `search_case_documents` | Full-text search across MongoDB cases | No (deterministic) |
| `aggregate_cases` | Analytics aggregation from MongoDB | No (deterministic) |

---

## Getting Started

### Prerequisites

- Node.js 22+
- Supabase project
- MongoDB Atlas cluster
- Gemini API key
- Firebase project (for hosting)

### Environment Variables

```bash
# LLM (required — Gemini for hackathon)
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net
MONGODB_DB_NAME=tichlabs_cases

# MCP Server
MCP_API_KEY=your-api-key
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

Automatically deploys on push to `main` via GitHub Actions.

Required GitHub secrets:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_MCP_SERVER_URL`
- `VITE_MCP_API_KEY`
- `FIREBASE_SERVICE_ACCOUNT`

### Cloud Run (MCP Server)

Deployed from `mcp-server/Dockerfile` via GitHub Actions (`deploy-cloud-run.yml`).

---

## License

Apache 2.0 — See [LICENSE](LICENSE)

---

## Submission Checklist

- [x] URL to hosted project → https://sgbv-incidenttracker.web.app/
- [x] URL to open-source code repository → https://github.com/Tich-Labs/tichlabs-rapid-agent
- [x] Open source license (Apache 2.0) visible in repo
- [x] MongoDB partner track selection
- [x] Gemini-powered agent with Google Cloud Agent Builder
- [x] MongoDB MCP server integration
- [ ] Demo video (~3 minutes)
- [ ] Completed Devpost submission form
