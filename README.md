# Tich Labs SGBV Case Management — Rapid Agent Hackathon

**An autonomous agent that reasons, plans, and executes multi-step SGBV case management.** Built with **Gemini 2.5**, **Google Cloud Agent Builder**, and **MongoDB Atlas MCP** for the [Google Cloud Rapid Agent Hackathon](https://rapid-agent.devpost.com/) — MongoDB partner track.

[![Deploy to Firebase](https://github.com/Tich-Labs/tichlabs-rapid-agent/actions/workflows/deploy-firebase.yml/badge.svg)](https://github.com/Tich-Labs/tichlabs-rapid-agent/actions/workflows/deploy-firebase.yml)

**Live app**: https://sgbv-incidenttracker.web.app/
**Docs / Interactive guide**: https://sgbv-incidenttracker.web.app/docs/
**Agent card (A2A)**: https://sgbv-incidenttracker.web.app/docs/agent-card.json
**MCP server**: https://tichlabs-sgbv-mcp-xxxxx-uc.a.run.app/

---

## Origins

This project is the **multi-tenant SaaS evolution** of [yck-incident-tracker](https://github.com/Tich-Labs/yck-incident-tracker), the original single-tenant SGBV case management platform built for YCK in Kakamega & Vihiga counties, Kenya.

| Repo | Purpose | Stack | Tenant Model |
|------|---------|-------|-------------|
| [yck-incident-tracker](https://github.com/Tich-Labs/yck-incident-tracker) | Original single-org POC serving YCK | Supabase, Groq, Railway | Single-tenant |
| **tichlabs-rapid-agent** (this repo) | SaaS platform for any organization | Firebase, Gemini, Cloud Run | Multi-tenant |

The YCK project validated the core workflow (7-stage SGBV case management, AI referral matching, risk assessment, FHIR export). This repo generalizes that architecture — replacing Supabase with Firebase/Firestore, switching from Groq to Gemini 2.5, adding Google Cloud Agent Builder orchestration, and introducing MongoDB Atlas for case analytics.

---

## Beyond the Chatbot — A Real-World Agent

This agent doesn't just answer questions. It **reasons through complex SGBV incidents, plans multi-step responses, and executes tasks** under human oversight.

| Capability | What the Agent Does | Tool(s) Used |
|------------|-------------------|-------------|
| **Reason** | Analyzes incident details, threat factors, and vulnerability indicators | `assess_risk` (Gemini 2.5) |
| **Plan** | Maps a multi-step response: assess → match → document → persist → review | Agent Builder orchestration |
| **Execute** | Generates FHIR bundles, stores cases, searches history, aggregates trends | `generate_fhir_bundle`, `store_case_document`, `search_case_documents`, `aggregate_cases` |
| **Ground** | Uses indexed referral pathways, FHIR documentation, and trauma-informed protocols | Agent Builder data store |
| **Superpower** | MongoDB Atlas MCP — persistent case storage, full-text search, analytics aggregation | MongoDB partner MCP server |

### The Real-World Challenge

In Kakamega & Vihiga counties, Kenya, overstretched youth protection organizations handle hundreds of SGBV cases with limited resources. Caseworkers manually match survivors to services, assess risk by instinct, and lose institutional knowledge when staff turnover occurs.

This agent tackles that challenge by:
- **Automating the triage pipeline** — risk assessment → service matching → documentation in under 60 seconds
- **Preserving institutional memory** — every anonymized case is searchable, so new staff can learn from past patterns
- **Surfacing trends** — real-time aggregation reveals spikes by location, type, or time period so organizations can allocate resources proactively

---

## Status

✅ **Migration complete**: Firebase/Firestore is the active backend. CI/CD deploys on push to `main`.

| Layer | Status | Notes |
|-------|--------|-------|
| Firebase Auth provider | ✅ Done | Google Sign-In via `signInWithPopup` |
| Firestore database | ✅ Done | Named DB `sgbv-tracker`. Collections: users, incidents, referral_services (176 services: Nairobi 139, Kakamega 25, Vihiga 12), audit_log |
| MCP server | ✅ Done | Firebase Admin SDK for Firestore queries |
| Frontend pages | ✅ Done | 13 pages across public + staff interfaces |
| Build verification | ✅ Done | CI passes with Node 22 |
| Firebase deploy | ✅ Done | Auto-deploys via GitHub Actions on push to `main` |
| Cloud Run deploy | ✅ Done | MCP server deploys to Cloud Run |
| Font system | ✅ Done | Geist (sans), JetBrains Mono (mono), Noto Serif (serif) |
| Minimum text size | ✅ Done | `text-sm` (14px) minimum — no `text-xs` anywhere |

---

## Rapid Agent Hackathon — MongoDB Partner Track

This project competes in the **MongoDB partner track**. Our agent demonstrates meaningful MCP integration that gives it real superpowers:

- **Moves beyond chat** — plans and executes multi-step SGBV case management, not just Q&A
- **MongoDB MCP superpowers** — persistent case storage, full-text search across historical cases, and aggregation analytics that surface trends no single caseworker could spot
- **Powered by Gemini 2.5** — advanced reasoning for risk assessment, referral matching, and FHIR generation

### Partner MCP Integration: MongoDB

| Tool | Description |
|------|-------------|
| `store_case_document` | Persist rich case narratives with tags, risk scores, and metadata |
| `search_case_documents` | Full-text search across cases by description, location, or tags |
| `aggregate_cases` | Analytics grouped by incident type, location, severity, status, or month |

### Built With

- **Gemini 2.5** — primary LLM for reasoning and generation
- **Google Cloud Agent Builder** — agent orchestration, grounding, and deployment (`agent-builder.json`)
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
│   ├── scripts/           # Seed scripts (seed-services.ts, seed-nairobi-services.ts)
│   └── src/
│       ├── tools/         # match-services, assess-risk, generate-fhir, mongodb-tools
│       └── lib/           # LLM providers (Gemini, OpenAI, Groq), Firebase Admin, MongoDB clients
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
VITE_FIREBASE_PROJECT_ID=...           # sgbv-incidenttracker
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

# MCP Server
VITE_MCP_SERVER_URL=https://tichlabs-sgbv-mcp-xxxxx-uc.a.run.app/
VITE_MCP_API_KEY=your-mcp-api-key-here
```

### Environment Variables — MCP Server

```bash
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"sgbv-incidenttracker"}
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash
MONGODB_URI=mongodb+srv://...
MONGODB_DB_NAME=tichlabs_cases
MCP_API_KEY=...
MCP_TRANSPORT=http
PORT=3001
```

**Note**: Firestore uses a named database `sgbv-tracker` (not default). Both frontend and MCP server connect to this database.

### Run Locally

```bash
# Frontend
cd frontend && npm install && npm run dev

# MCP Server
cd mcp-server && npm install && npm run dev:http

# Seed referral services (requires FIREBASE_SERVICE_ACCOUNT_JSON)
npm run seed:nairobi    # Seed Nairobi services (139 entries)
npx tsx scripts/seed-services.ts   # Seed Kakamega & Vihiga (37 entries)
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

- [ ] **Demo video** — Record ~3 minute walkthrough (survivor flow → AI → FHIR → admin).
- [ ] **Devpost submission** — Complete submission form for both hackathons.
- [ ] **Fix audit log** — Replace `usePaginatedQuery` no-op stub; fix Firestore rules for audit log writes.
- [ ] **Wire up FHIR context** — Make "Generate FHIR" in AI Assistant use actual incident data.
- [ ] **Anonymous status lookup** — Let survivors check case status with their reference code.
- [ ] **Complete i18n** — Translate hardcoded English strings in About, Dashboard, AppLayout.
- [ ] **Multi-tenant support** — `orgs` table, org-aware auth and data isolation (TRACK3 Phase 1).
- [ ] **PDF export** — Implement jspdf-based report generation.
- [ ] **Clean dead code** — Remove unused Supabase SQL schema and Convex stubs.

---

## Hackathon Submission Checklist

| Requirement | Status | Notes |
|-------------|--------|-------|
| Hosted project URL | ✅ Done | https://sgbv-incidenttracker.web.app |
| Public open-source repo | ✅ Done | https://github.com/Tich-Labs/tichlabs-rapid-agent |
| Open-source license | ✅ Done | Apache 2.0 — [`LICENSE`](LICENSE) |
| ~3 minute demo video | ❌ Pending | Walkthrough of agent capabilities |
| Partner track selected | ✅ Done | MongoDB (Rapid Agent) / Healthcare (Agents Assemble) |
| Meaningful MCP integration | ✅ Done | 3 MongoDB tools + FHIR R4 bundle generation |
| Built with Gemini + Agent Builder | ✅ Done | `agent-builder.json` with Gemini 2.5 Flash, grounding, custom tools |
| Multi-step task execution | ✅ Done | 5-step workflow: assess → match → document → persist → review |
| Devpost submission form | ❌ Pending | Both hackathons |

## License

Apache 2.0 — See [LICENSE](LICENSE)
