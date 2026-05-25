# Pre-Submission Audit — Google Cloud Rapid Agent Hackathon

**Date**: May 25, 2026 (updated May 25, 2026)  
**Hackathon**: [Google Cloud Rapid Agent Hackathon](https://rapid-agent.devpost.com/)  
**Partner Track**: MongoDB  
**Deadline**: June 11, 2026

---

## 1. Firebase Deploy Status

**Workflow**: `.github/workflows/deploy-firebase.yml`
- Trigger: push to `main` + manual dispatch
- Node version: 22

**Secrets referenced**:

| Secret | Used for |
|--------|----------|
| `VITE_FIREBASE_API_KEY` | Build-time env |
| `VITE_FIREBASE_AUTH_DOMAIN` | Build-time env |
| `VITE_FIREBASE_PROJECT_ID` | Build-time env |
| `VITE_FIREBASE_STORAGE_BUCKET` | Build-time env |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Build-time env |
| `VITE_FIREBASE_APP_ID` | Build-time env |
| `VITE_MCP_SERVER_URL` | Build-time env |
| `VITE_MCP_API_KEY` | Build-time env |
| `FIREBASE_SERVICE_ACCOUNT` | Deploy auth + Firestore rules deploy |
| `GITHUB_TOKEN` | Repo access |

**Hosting config** (`firebase.json`):
- Public directory: `frontend/dist`
- SPA rewrites: all routes → `/index.html`
- Asset caching: 1 year immutable on `assets/**`
- CI copies `docs/` → `frontend/dist/docs` (served at `/docs/`)

**Build verification**: `npm run build` → `vite build` outputs to `frontend/dist/`. Matches `firebase.json`.

---

## 2. Cloud Run Deploy Status

**Workflow**: `.github/workflows/deploy-cloud-run.yml`
- Trigger: manual dispatch only (`workflow_dispatch`)
- Region: `us-central1`
- MCP service name: `tichlabs-sgbv-mcp`
- Frontend service name: `tichlabs-sgbv-frontend`

**Secrets referenced**:

| Secret | Used for |
|--------|----------|
| `FIREBASE_SERVICE_ACCOUNT` | GCP authentication |
| `VITE_MCP_SERVER_URL` | Frontend Docker build arg |
| `VITE_MCP_API_KEY` | Frontend Docker build arg |
| `GEMINI_API_KEY` | MCP container env |
| `GEMINI_MODEL` | MCP container env |
| `MONGODB_URI` | MCP container env |
| `MCP_API_KEY` | MCP container env |

### MCP Server URL audit

| Source | URL | Status |
|--------|-----|--------|
| `agent-card.json` | `tichlabs-sgbv-mcp-xxxxx-uc.a.run.app` | Placeholder |
| `frontend/.env.example` | `tichlabs-sgbv-mcp-740048302235.us-central1.run.app/mcp` | Real |
| `agent-builder.json` | `tichlabs-sgbv-mcp-740048302235.us-central1.run.app/mcp` | Real |
| `frontend/.env.local` | `tichlabs-sgbv-mcp-xxxxx-uc.a.run.app/` | Placeholder |

---

## 3. MCP Server Readiness

**Transports**: stdio (default) and http (`MCP_TRANSPORT=http`)

**`firestore-admin.ts`**: Exists, imports Firebase Admin SDK, connects to named database `sgbv-tracker`.

**`.env.example`**: No Supabase vars. `FIREBASE_SERVICE_ACCOUNT_JSON` present. LLM providers: Gemini, OpenAI, Groq, Ollama.

**Registered tools (6)**:

| Tool | AI-Powered | Handler |
|------|-----------|---------|
| `match_services` | Yes (Gemini) | `matchServicesSmart()` |
| `generate_fhir_bundle` | No | `generateFHIRBundle()` |
| `assess_risk` | Yes (Gemini) | `assessRiskSmart()` |
| `store_case_document` | No | `storeCaseDocument()` |
| `search_case_documents` | No | `searchCaseDocuments()` |
| `aggregate_cases` | No | `aggregateCases()` |

**Endpoints**:
- `GET /health` → `{"status":"ok","server":"tichlabs-mcp-server"}`
- `GET /debug` → services count, LLM config, MongoDB status, env vars
- `POST /mcp` → MCP Streamable HTTP

---

## 4. Firestore Rules — Role Mismatch (BLOCKING)

The `firestore.rules` helper functions check for roles `admin` and `caseworker`:

```
function isStaff() { return userRole() in ['admin', 'caseworker']; }
function isAdmin() { return userRole() == 'admin'; }
```

The codebase uses these actual roles: `program_lead`, `executive_director`, `counselor`, `volunteer`, `pending`. **None of them match.**

### Impact by collection

| Collection | Intended access | Actual result |
|-----------|----------------|---------------|
| `incidents` | Staff can read/update | Denied for all authenticated users |
| `users` | Admin manages, self-reads own | Admins can't manage; self-read may fail |
| `referral_services` | Public read, admin write | Public read works; admin write denied |
| `audit_log` | Admin read | Denied |

### Effective result

- Survivors can still report incidents (public create on `incidents`)
- Survivors can still browse services (public read on `referral_services`)
- **No staff member can view or manage incidents**
- **No admin can manage users or services**
- **No one can view audit logs**

---

## 5. Frontend Build

**`frontend/package.json`**:
- No `engines` field for Node version
- Build: `vite build` (CI uses `npm run build`)
- `@supabase/supabase-js` + `@supabase/auth-helpers-react` still in `dependencies` — dead weight

**`vite.config.ts`**:
- `chunkSizeWarningLimit: 1000`
- `base`: `process.env.VITE_BASE_URL || '/'`
- No memory limits, no build timeouts

**Supabase references**:
- `useSupabaseQuery`/`useSupabaseMutation`: 61 imports across 9 files. All delegate to Firestore — misleading naming, not actual Supabase.
- Hardcoded Supabase URLs/keys in `src/`: **zero matches**
- Dead file: `src/lib/supabase.ts` (102 lines) — Firestore wrapper, unused

**Duplicate file**: `src/pages/admin/services/AdminServicesInner.tsx` alongside `page.tsx`

---

## 6. Seed Scripts

| Check | Status |
|-------|--------|
| `mcp-server/scripts/seed-nairobi-services.ts` | Exists — 139 Nairobi services |
| `mcp-server/scripts/seed-services.ts` | Exists — 37 Kakamega + Vihiga services |
| npm script `seed:nairobi` in `mcp-server/package.json` | Yes |
| Both use `FIREBASE_SERVICE_ACCOUNT_JSON` | Yes |
| Both use `sgbv-tracker` named database | Yes |
| Total seeded services in Firestore | 176 (Nairobi 139, Kakamega 25, Vihiga 12) |

---

## 7. Agent Builder Config

**File**: `agent-builder.json`

- Model: `gemini-2.5-flash`, temperature 0.3
- MCP servers: `tichlabs-mcp` (6 tools) + `mongodb-atlas` (external)
- MongoDB MCP URL: `https://mcp.mongodb.com` — external service, not our server
- Partner track: `mongodb`
- System instruction: full 5-step workflow, trauma-informed protocols
- Grounding: references `docs/` data store — no specific files enumerated
- MCP server URL: real (`tichlabs-sgbv-mcp-740048302235.us-central1.run.app/mcp`)
- Frontend URL: real (`sgbv-incidenttracker.web.app`)

---

## 8. About Page

| Check | Status |
|-------|--------|
| `src/pages/about/page.tsx` exists | Yes |
| Route `/en/about` registered | Yes |
| Sidebar nav item `nav.about` | Yes — all roles |
| EN + SW translations present | Yes |

---

## 9. Org Banner

| Check | Status |
|-------|--------|
| `src/components/OrgBanner.tsx` exists | Yes |
| Imported in `AppLayout.tsx` | Yes |
| `VITE_ORG_NAME` in `.env.example` | Yes |
| `VITE_ORG_LOCATION` in `.env.example` | Yes |
| `.env.local` has these vars | No — falls back to hardcoded defaults |
| Hardcoded "Demo org" badge | Yes |

---

## 10. Open Items

| # | Item | Blocking? |
|---|------|-----------|
| 1 | Firestore rules use `admin`/`caseworker` — code uses `program_lead`/`executive_director`/`counselor` | **Fixed** |
| 2 | Cloud Run MCP deploy missing `FIREBASE_SERVICE_ACCOUNT_JSON` env var — server won't start | **Fixed** |
| 3 | Service worker intercepts cross-origin requests (Google Auth) breaking sign-in | **Fixed** |
| 4 | `agent-card.json` MCP URL is placeholder (`xxxxx`) | No |
| 5 | `firestore.indexes.json` not deployed — composite index `isActive` + `name` not active | No |
| 6 | `@supabase/supabase-js` + auth-helpers still in `frontend/package.json` | No |
| 7 | `frontend/src/lib/supabase.ts` — 102 lines of dead code | No |
| 8 | `AdminServicesInner.tsx` duplicate component | No |
| 9 | `VITE_ORG_LOCATION` says "Kakamega & Vihiga" — missing Nairobi | No |
| 10 | `.env.local` missing org name/location vars | No |
| 11 | "Demo org" badge hardcoded in OrgBanner | No |
| 12 | `engines` field missing in `frontend/package.json` | No |
| 13 | `VITE_ORG_NAME`/`VITE_ORG_LOCATION` hardcoded in CI workflow | No |
| 14 | `getCurrentUser` returns demo admin when not authenticated | **Fixed** |
| 15 | `mcp-server/src/lib/firestore-admin.ts` — `is_active` → `isActive` field mismatch | **Fixed** |

**0 blocking items — all critical issues resolved.**

---

## Quick-Fix Guide

### Fix 1: Firestore rules role mismatch

Replace the helper functions in `firestore.rules`:

```
function isStaff() {
  return userRole() in ['program_lead', 'executive_director', 'counselor'];
}
function isAdmin() {
  return userRole() in ['program_lead', 'executive_director'];
}
```

Then: `firebase deploy --only firestore:rules`

### Fix 2: Cloud Run MCP env var

Add to `deploy-cloud-run.yml` line 123, in the `--set-env-vars` block:

```
FIREBASE_SERVICE_ACCOUNT_JSON=${{ secrets.FIREBASE_SERVICE_ACCOUNT_JSON }}
```

Ensure the secret is set in GitHub with the full JSON content of the service account key.
