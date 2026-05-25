# Tich Labs SGBV Case Management — Project Context

## Project Overview

**Tich Labs** — AI-powered autonomous agent for SGBV (Sexual and Gender-Based Violence) case management, serving youth protection organizations in Kenya.

**Current Stage**: Operational PWA with AI agent, preparing for hackathon submission and pilot deployment.

**Hackathons**: 
- **Google Cloud Rapid Agent Hackathon** (MongoDB partner track) — https://rapid-agent.devpost.com/
- **Agents Assemble Healthcare AI Challenge** — https://agents-assemble.devpost.com/ (deadline: July 2, 2026)

---

## A. Current System Audit (May 2026)

### ✅ Complete & Working

| Feature | Status | Details |
|---------|--------|---------|
| Anonymous incident reporting | ✅ | Multi-step wizard, 10 incident types, reference code system |
| Role-based access control | ✅ | 5 roles: pending, volunteer, counselor, program_lead, executive_director |
| Offline-first PWA | ✅ | Service worker, localStorage queue, auto-sync, dead-letter handling |
| Quick Exit button | ✅ | Persistent on all pages, clears sessionStorage, redirects to google.com |
| Safety consent screen | ✅ | Mandatory consent gate before reporting flow |
| Trauma-informed UX | ✅ | Calm language, progressive disclosure, anonymity notices |
| Case management workflow | ✅ | 7 statuses (new→assigned→in_progress→escalated→resolved→closed), assignment, escalation, notes |
| Reporting & analytics | ✅ | Recharts (type, status, age, gender, monthly trend), CSV export |
| User management | ✅ | Approve pending, change roles, deactivate users |
| Admin manual | ✅ | In-app, 8+ sections covering all workflows |
| Mobile-first responsive | ✅ | Responsive layout, hamburger sidebar, tap targets |
| Survivor privacy protections | ✅ | No PII in reports, anonymized exports, role-limited visibility |
| Bilingual support (EN/SW) | ✅ | i18next with URL-based locale routing (`/:lng/...`) |
| Referral services database | ✅ | 176 services in Firestore: Nairobi (139), Kakamega (25), Vihiga (12) — full CRUD admin via Manage Services page |
| Firestore database | ✅ | Primary DB: users, incidents, referral_services, audit_log. Named database `sgbv-tracker` (project `sgbv-incidenttracker`) |
| Firebase Auth | ✅ | Google Sign-In via signInWithPopup |
| Firebase Hosting deploy | ✅ | CI/CD via GitHub Actions |
| MCP Server (stdio + HTTP) | ✅ | 6 tools: match_services, assess_risk, generate_fhir_bundle, store/search/aggregate_case_documents |
| AI risk assessment | ✅ | Gemini 2.5 Flash via MCP `assess_risk` tool — auto-runs on incident creation |
| AI service matching | ✅ | Gemini 2.5 Flash via MCP `match_services` tool |
| FHIR R4 bundle generation | ✅ | MCP `generate_fhir_bundle` tool, full FHIR types |
| MongoDB Atlas integration | ✅ | 3 tools: store_case_document, search_case_documents, aggregate_cases |
| AI Assistant UI (floating) | ✅ | Manual MCP tool panel on incident detail |
| AI Recommendations UI | ✅ | Inline referral matches with approve/reject, FHIR export |
| Auto risk assessment hook | ✅ | Fire-and-forget after incident submission, writes results to Firestore |
| Agent Builder config | ✅ | `agent-builder.json` with Gemini 2.5, grounding, MCP servers |
| Cloud Run deployment | ✅ | MCP server + frontend Dockerfiles, deployment scripts |
| 55 shadcn/ui components | ✅ | Full component library (New York style) |
| Dark mode | ✅ | next-themes with system preference detection |
| PWA install prompt | ✅ | Android/Desktop + iOS Safari guide |
| Offline detection banner | ✅ | Green/amber status based on navigator.onLine |
| Locale switcher | ✅ | EN/SW dropdown with URL sync |
| GitHub Actions CI/CD | ✅ | Frontend build + Firebase deploy + MCP Cloud Run deploy |

### ⚠️ Partially Working / Known Issues

| Issue | Impact | Severity |
|-------|--------|----------|
| Audit log client writes blocked | Firestore rules prevent client-side `audit_log` inserts — logs may be silently lost | Medium |
| `usePaginatedQuery` is a no-op stub | Audit page won't load any data from Supabase/Convex | High |
| FHIR in AI Assistant uses hardcoded sample data | "Generate FHIR" button ignores current incident context | Medium |
| Push notification subscription not implemented | Service worker has handler but no frontend subscription flow | Low |
| No background sync for offline queue | Offline submissions only sync when app is open and online | Low |
| Only Google SSO | No email/password or other auth providers | Low |
| Some pages have hardcoded English | About, dashboard, AppLayout strings not in i18n JSON | Medium |
| Supabase SQL schema is dead code | `supabase/schema.sql` exists but app uses Firestore exclusively | Low |
| No server-side offline queue persistence | localStorage-only — clearing browser data loses queued incidents | Medium |

### ❌ Missing / Not Started

| Feature | Priority | Notes |
|---------|----------|-------|
| Anonymous status lookup page | High | Survivors with reference codes can't check their case status |
| Multi-tenant support (orgs table) | High | TRACK3 Phase 1 — currently single-tenant |
| Demo video (~3 min) | Critical | Required for both hackathons |
| Devpost submission form | Critical | Neither hackathon submitted yet |
| PDF export | Medium | Listed as feature, not implemented |
| Monitoring & evaluation dashboard | Medium | Donor reporting KPIs |
| Rate limiting on MCP server | Medium | No DDoS protection |
| Email template updates for new categories | Low | Old categories may appear in notifications |
| Redis cache layer | Low | Performance optimization |
| Community champion dashboard | Low | Territory-based volunteer view |

---

## B. Technical Architecture (Current)

| Layer | Technology | Status |
|---|---|---|
| Frontend Framework | React 19 + Vite 7 + TypeScript 5.9 | Active |
| Styling | Tailwind CSS v4 + shadcn/ui + motion | Active |
| Fonts | Geist (sans), JetBrains Mono (mono), Noto Serif (serif) | Active |
| State Management | @tanstack/react-query + React context | Active |
| Auth | Firebase Auth (Google SSO) | Active |
| Primary Database | Firebase Firestore | Active |
| Analytics/ML DB | MongoDB Atlas (via MCP server) | Optional |
| AI/LLM | Gemini 2.5 Flash / OpenAI / Groq / Ollama | Active |
| Agent Orchestration | Google Cloud Agent Builder | Configured |
| MCP Transport | STDIO + Streamable HTTP | Active |
| FHIR | FHIR R4 bundle generation + SHARP context | Active |
| Offline | Service worker + localStorage queue | Functional |
| PWA | Web manifest + install prompt + push-ready SW | Base complete |
| I18n | i18next (en, sw) — ~90 keys each across 4 namespaces | Partial coverage |
| Deployment | Firebase Hosting (frontend) + Cloud Run (MCP server) | Configured |
| CI/CD | GitHub Actions (deploy-firebase.yml, deploy-cloud-run.yml) | Active |

---

## C. MCP Server Tools

| Tool | AI-Powered | Handler | Description |
|------|-----------|---------|-------------|
| `match_services` | Yes (Gemini) | `tools/match-services.ts` | Match incidents to referral services by type, location, age, gender |
| `assess_risk` | Yes (Gemini) | `tools/assess-risk.ts` | Risk score (0-1), severity, urgency, risk factors, recommended actions |
| `generate_fhir_bundle` | No | `tools/generate-fhir.ts` | FHIR R4 transaction Bundle (Patient, Observation, ServiceRequest) |
| `store_case_document` | No | `tools/mongodb-tools.ts` | Store anonymized case in MongoDB with tags and metadata |
| `search_case_documents` | No | `tools/mongodb-tools.ts` | Full-text search across historical cases |
| `aggregate_cases` | No | `tools/mongodb-tools.ts` | Aggregation analytics (by type, location, severity, month) |

---

## D. App Routes

### Public (no auth)
| Route | Page | Description |
|-------|------|-------------|
| `/:lng` | Index | Landing page with hero, features, CTA |
| `/:lng/incidents/safety` | Safety Gate | Pre-report consent screen |
| `/:lng/incidents/new` | New Incident | 5-step multi-page reporting wizard |
| `/:lng/incidents/success` | Success | Post-submission confirmation + reference code |
| `/:lng/referral` | Referral Directory | Public service directory with county/type filters |
| `/auth/callback` | Auth Callback | Firebase OAuth redirect handler |

### Authenticated (staff)
| Route | Page | Description |
|-------|------|-------------|
| `/:lng/dashboard` | Dashboard | Role-specific dashboards with stats, quick actions |
| `/:lng/incidents` | Incidents List | Filterable list (status, reporter type) |
| `/:lng/incidents/:id` | Incident Detail | Full detail + workflow + AI panel + audit timeline |
| `/:lng/users` | User Management | Role assignment, approve/reject, search |
| `/:lng/reports` | Reports | Analytics charts, date presets, CSV export |
| `/:lng/audit` | Audit Log | System activity log (⚠ broken — pagination stub) |
| `/:lng/admin/manual` | Admin Manual | In-app documentation (8+ sections) |
| `/:lng/admin/services` | Services CRUD | Admin panel for referral services database |
| `/:lng/about` | About | Capabilities, tech stack, privacy |

---

## E. Current AI Capabilities

The AI agent executes a **5-step autonomous workflow**:

1. **Assess** — Analyzes incident details, threat factors, vulnerability indicators → risk score, severity, urgency
2. **Match** — Maps incident to verified referral services by type, location, age group, gender
3. **Document** — Generates FHIR R4 transaction bundles for healthcare interoperability
4. **Persist** — Stores anonymized cases in MongoDB for search and analytics
5. **Review** — Human oversight via approve/reject UI on AI recommendations

**Safety guardrails:**
- All AI recommendations require human approval before reaching survivors
- AI risk assessments include confidence indicators
- FHIR bundles are fully anonymized (no PII)
- Keyword-based fallback when LLM is unavailable

---

## F. Hackathon Submission Status

| Requirement | Rapid Agent (MongoDB) | Agents Assemble (FHIR) |
|-------------|----------------------|------------------------|
| Hosted project URL | ✅ sgbv-incidenttracker.web.app | ✅ Same |
| Public repo | ✅ github.com/Tich-Labs/tichlabs-rapid-agent | ✅ Same |
| Open-source license | ✅ Apache 2.0 | ✅ Same |
| Demo video (~3 min) | ❌ Pending | ❌ Pending |
| Partner track selected | ✅ MongoDB | ✅ (FHIR/healthcare) |
| MCP integration | ✅ 3 MongoDB tools | ✅ FHIR R4 bundles |
| Built with required tech | ✅ Gemini 2.5 + Agent Builder | ✅ Healthcare focus |
| Multi-step execution | ✅ 5-step workflow | ✅ Same |
| Devpost submission | ❌ Pending | ❌ Pending |

---

## G. What Remains — Priority Roadmap

### 🔴 Critical (before submission)
1. **Record demo video** — 3 min walkthrough: survivor reporting flow → AI risk assessment → service matching → FHIR export → admin workflow
2. **Complete Devpost submission** — both hackathons
3. **Fix audit log** — remove broken `usePaginatedQuery` stub, fix Firestore rules for audit_log writes, or implement proper pagination
4. **Wire up FHIR context** — make AI Assistant "Generate FHIR" use actual incident data, not hardcoded sample

### 🟡 High (post-submission, pre-pilot)
5. **Anonymous status lookup** — let survivors check case status with their reference code
6. **Multi-tenant support** — `orgs` table, org_id on all tables, org-aware auth (TRACK3 Phase 1)
7. **Complete i18n coverage** — translate hardcoded strings in About, Dashboard, AppLayout
8. **Fix offline queue persistence** — server-side backup for localStorage queue

### 🟢 Medium (pilot readiness)
9. **PDF export** — jspdf for incident/report PDF generation
10. **M&E dashboard** — donor-aligned KPIs, indicator tracking
11. **Rate limiting** — API-level protection on MCP server
12. **Push notification subscription flow** — wire up frontend to SW push handler
13. **Clean up dead code** — Supabase SQL schema, Convex stubs, `http-server.ts` legacy endpoints

### ⚪ Low (future)
14. Redis cache for referral service lookups
15. Community champion dashboard with territory-based views
16. Email/password auth (beyond Google SSO)
17. Multi-language expansion (Luhya, Luo)
18. Advanced analytics (cohort analysis, trend prediction)

---

## H. Known Technical Debt

1. **Supabase schema is dead code** — `supabase/schema.sql` and `supabase.ts` provider are Firestore wrappers. Either migrate fully or remove Supabase artifacts.
2. **Inconsistent field naming** — Firestore documents use camelCase exclusively (`isActive`). MCP server `getActiveServices()` queries `.where("isActive", "==", true)`. No more snake_case references.
3. **No database migrations** — No versioning system for Firestore schema changes.
4. **`usePaginatedQuery` is a no-op** — Imported from a Convex-styled abstraction that returns `{ results: [], status: "success" }` regardless of data.
5. **Audit log writes blocked** — `firestore.rules` says `allow write: if false` for audit_log, but frontend code tries `supabase.from('audit_log').insert(...)`.
6. **Forked i18n approach** — `common`, `landing`, `incidents`, `referral` namespaces exist, but pages like About, Dashboard, AppLayout use hardcoded English strings.
7. **Offline queue is localStorage-only** — No server-side persistence. Browser clear = data loss.

---

## I. File Map (Key Paths)

```
frontend/
├── src/
│   ├── App.tsx                          # Routes with locale prefixing
│   ├── index.css                        # Tailwind v4 theme (Geist, JetBrains Mono, Noto Serif)
│   ├── pages/
│   │   ├── Index.tsx                    # Landing page
│   │   ├── incidents/                   # Safety gate, new form, success, list, detail
│   │   ├── app/dashboard/page.tsx       # Role-specific dashboard
│   │   ├── app/_components/AppLayout.tsx # Sidebar, mobile nav, auth gate
│   │   ├── referral/page.tsx            # Public service directory
│   │   ├── reports/page.tsx             # Analytics + CSV
│   │   ├── users/page.tsx               # User management
│   │   ├── audit/page.tsx               # Audit log (⚠ broken)
│   │   ├── admin/manual/page.tsx        # Admin manual
│   │   ├── admin/services/              # Services CRUD
│   │   └── about/page.tsx               # About page
│   ├── components/
│   │   ├── ai-assistant.tsx             # Floating MCP tool panel
│   │   ├── ai-recommendations.tsx        # Inline referral recommendations
│   │   ├── quick-exit.tsx               # Safety escape button
│   │   ├── offline-banner.tsx           # Network status indicator
│   │   ├── install-prompt.tsx           # PWA install prompt
│   │   ├── locale-switcher.tsx          # EN/SW language toggle
│   │   └── ui/                          # 55 shadcn/ui components
│   ├── lib/
│   │   ├── firebase.ts                  # Firebase app init
│   │   ├── firestore.ts                 # Firestore CRUD helpers
│   │   ├── mcp-client.ts                # MCP JSON-RPC client (HTTP)
│   │   └── fhir-types.ts               # FHIR R4 TypeScript types
│   ├── hooks/
│   │   ├── use-firestore-query.ts       # React Query + Firestore
│   │   ├── use-offline-incident-queue.ts # Offline queue manager
│   │   ├── use-auto-risk-assessment.ts  # Auto AI risk assessment
│   │   └── use-service-worker.ts        # SW registration + update toast
│   └── locales/
│       ├── en/                          # English (common, landing, incidents, referral)
│       └── sw/                          # Swahili (common, landing, incidents, referral)
├── public/
│   ├── sw.js                            # Service worker (cache + push)
│   └── site.webmanifest                  # PWA manifest
└── index.html                           # Entry HTML + font loading

mcp-server/
├── src/
│   ├── index.ts                         # MCP server (stdio + HTTP)
│   ├── server.ts                        # HTTP entry point
│   ├── tools/
│   │   ├── match-services.ts            # AI service matching
│   │   ├── assess-risk.ts               # AI risk assessment
│   │   ├── generate-fhir.ts             # FHIR bundle generation
│   │   └── mongodb-tools.ts             # MongoDB CRUD + search + aggregate
│   ├── lib/
│   │   ├── llm.ts                        # Multi-provider LLM (Gemini→OpenAI→Groq→Ollama)
│   │   ├── mongodb.ts                   # MongoDB client
│   │   ├── firestore-admin.ts           # Firebase Admin SDK wrapper (named DB: sgbv-tracker)
│   │   └── fhir-sharp.ts               # SHARP FHIR integration
│   └── scripts/
│       ├── seed-services.ts             # Seed Kakamega & Vihiga services (37 entries)
│       └── seed-nairobi-services.ts     # Seed Nairobi services (139 entries)

docs/
├── system-prompt.md                     # AI system prompt
├── agent-card.json                      # A2A agent card
├── AI Concept Paper.pdf                 # Full project overview
├── GBV REFERRAL PATHWAY.docx            # Verified referral services (Kakamega/Vihiga)
├── Survivors Journey.docx               # Post-reporting guidance
└── Types of Abuse.pdf                   # Educational content

supabase/                                # ⚠ Dead code — Firestore is primary DB
└── schema.sql                           # Postgres schema (unused)

agent-builder.json                       # Google Cloud Agent Builder config
firebase.json                            # Firebase Hosting config
firestore.rules                          # Firestore security rules
firestore.indexes.json                   # Firestore composite indexes (isActive + name)
deploy-hackathon.sh                      # Cloud Run deployment script
```

---

**Last Updated**: May 25, 2026
**Live URL**: https://sgbv-incidenttracker.web.app/
**Repo**: https://github.com/Tich-Labs/tichlabs-rapid-agent

## J. Recent Changes (May 2026)

| Change | Impact |
|--------|--------|
| Referral page redesign — search-first, quick picks, human labels, collapsed emergency banner, removed AI jargon | Trauma-informed UX, 3-tap max to call |
| Service worker fix — cross-origin requests bypass SW cache | Google Auth sign-in now works |
| Firestore rules role fix — `admin`/`caseworker` → `program_lead`/`executive_director`/`counselor` | Blocking auth bug resolved |
| Named database `sgbv-tracker` applied to frontend, MCP server, and seed scripts | All three layers now connect correctly |
| Nairobi seed data — 139 services from NCCG GBV Service Directory | Referral directory now covers 3 counties (176 total) |
| Cloud Run MCP deploy — `FIREBASE_SERVICE_ACCOUNT_JSON` added to env vars | MCP server can now connect to Firestore in production |
| `getCurrentUser` demo user fallback removed — throws proper auth error | Security: no more hardcoded admin bypass |
