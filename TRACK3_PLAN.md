# Track 3: Google Cloud Marketplace & Gemini Enterprise — Development Plan

> **Goal**: Refactor the existing SGBV case management system from a single-org tool (YCK) into a scalable, multi-tenant SaaS platform ready for listing on Google Cloud Marketplace and Gemini Enterprise.

## Current status

This branch currently includes:

- Rebranded the app to **Tich Labs SGBV Case Management** and updated UI copy, meta tags, and Swahili/English localization.
- Documented the branch changes and deployment approach in `README.md`.
- Added deployment artifacts for Cloud Run and Firebase.
- Added demo workflow seed data in `supabase/seed-workflow.sql`.
- Added `TRACK3_PLAN.md` as the branch planning and status document.

---

---

## Phase 0 — Foundation & Codebase Rebrand (Days 1–2)

**Already in progress on `google-hackathon-2026` branch.**

- [x] Rebrand app name from "YCK Incident Tracker" → "Tich Labs SGBV Case Management"
- [x] Update UI meta tags, manifests, i18n strings to remove YCK-specific references
- [x] Switch color scheme from YCK crimson → Tich Labs magenta
- [ ] Update `docs/system-prompt.md` — replace YCK-specific language, add multi-org context
- [ ] Update `docs/agent-card.json` — rename agent, update URLs, remove YCK-specific tags
- [ ] Rename MCP server package from `yck-mcp-server` → `tichlabs-mcp-server` in `package.json`
- [ ] Update MCP server `index.ts` server name from `yck-incident-tracker`
- [ ] Update `scripts/context.md` project context document
- [ ] Update `deploy-hackathon.sh` to reference Tich Labs branding

---

## Phase 1 — Multi-Tenancy Database (Days 3–6)

### 1a. Org schema & migration

- [ ] Create `orgs` table in `supabase/schema.sql`:

```sql
CREATE TABLE orgs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  settings JSONB DEFAULT '{}',
  branding JSONB DEFAULT '{}',  -- logo_url, primary_color, county_scope[]
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

- [ ] Add `org_id` FK column to every data table:
  - `users.org_id` (NOT NULL)
  - `incidents.org_id` (NOT NULL)
  - `referral_services.org_id` (NOT NULL)
  - `audit_log.org_id` (derived from incident)
  - `ai_recommendations.org_id` (derived from incident)
- [ ] Drop `county` CHECK constraint on `referral_services` — move county scope to `orgs.branding.county_scope` 
- [ ] Create migration script (`supabase/migration-v2-multi-tenant.sql`) for existing data
- [ ] Seed a default org for existing YCK data

### 1b. RLS policies (org-scoped)

- [ ] Create `set_current_org_id()` helper function in SQL
- [ ] Create `get_current_org_id()` helper function
- [ ] Rewrite RLS policies on `users` — filter by `org_id`
- [ ] Rewrite RLS policies on `incidents` — filter by `org_id`
- [ ] Rewrite RLS policies on `referral_services` — filter by `org_id`
- [ ] Rewrite RLS policies on `audit_log` — filter by `org_id`
- [ ] Rewrite RLS policies on `ai_recommendations` — filter by `org_id`
- [ ] Update indexes to include `org_id` (composite indexes for common queries)

### 1c. Auth layer

- [ ] Update `frontend/src/lib/supabase.ts` — set `app.current_org_id` on login
- [ ] Add org-switching UI for superadmin users
- [ ] Create user invitation flow (invite link → create user in org)
- [ ] Update JWT claims to include `org_id` and `org_role`

### 1d. Frontend org context

- [ ] Create React context `OrgProvider` — provides current org, branding, feature flags
- [ ] Update `AppLayout.tsx` sidebar to show org name and branding
- [ ] Update landing page (`Index.tsx`) to show org-specific branding
- [ ] Update locale switcher to respect org-level locale settings
- [ ] Update `AppLayout.tsx` sidebar:
  - [ ] Show org logo/name at top
  - [ ] Org switcher dropdown for cross-org admins
- [ ] Update `Index.tsx` landing page for org-aware hero/CTA

---

## Phase 2 — Gemini Enterprise Integration (Days 7–9)

### 2a. Gemini provider in LLM layer

- [ ] Add `GEMINI_API_KEY` env var detection in `mcp-server/src/lib/llm.ts`
- [ ] Add `GEMINI_MODEL` env var (default: `gemini-2.0-flash` or appropriate)
- [ ] Configure Gemini's OpenAI-compatible endpoint (`https://generativelanguage.googleapis.com/v1beta/openai/`)
- [ ] Test `match_services` with Gemini provider
- [ ] Test `assess_risk` with Gemini provider
- [ ] Test `generate_fhir` with Gemini provider

### 2b. Vertex AI integration

- [ ] Add Vertex AI provider option (for GCP customers)
- [ ] `VERTEX_PROJECT_ID`, `VERTEX_LOCATION`, `VERTEX_MODEL` env vars
- [ ] Use Google Cloud ADC (Application Default Credentials) for auth
- [ ] Support for Gemini models via Vertex AI endpoint

### 2c. Gemini Enterprise readiness

- [ ] Update A2A agent card to list Gemini as supported provider
- [ ] Document Gemini setup in README (API key, quota, region config)
- [ ] Add Vercel AI SDK or Google Gen AI SDK as optional dependency
- [ ] Verify FHIR bundle generation works with Gemini's structured output

---

## Phase 3 — Google Cloud Infrastructure (Days 10–12)

### 3a. Production Cloud Run setup

- [ ] Finalize frontend `Dockerfile` (already scaffolded)
- [ ] Finalize MCP server `Dockerfile` (already scaffolded)
- [ ] Create `cloudbuild.yaml` for Cloud Build CI/CD
- [ ] Set up Artifact Registry for container images
- [ ] Configure Cloud Run service (min/max instances, CPU, memory)
- [ ] Set up Cloud Run IAM (allUnauthenticated for frontend, MCP needs auth)
- [ ] Configure Secret Manager for env vars (Supabase, API keys)
- [ ] Set up custom domain mapping
- [ ] Configure Cloud CDN for static assets

### 3b. Google Cloud Marketplace preparation

- [ ] Create product listing skeleton (`marketplace/` directory)
- [ ] Write product description, pricing model, category tags
- [ ] Create architecture diagram (GCP-native: Cloud Run + Supabase + Gemini)
- [ ] Document integration architecture (Cloud Run → Supabase → MCP Server → Gemini)
- [ ] Create deployment guide (one-click via Cloud Run + Cloud Build)

### 3c. Security & compliance

- [ ] Review RLS policies for multi-tenant isolation
- [ ] Add rate limiting per org
- [ ] Add audit logging for cross-org actions
- [ ] Review IAM roles (principle of least privilege)
- [ ] Document data isolation guarantees for marketplace listing

---

## Phase 4 — Optimization & Production Hardening (Days 13–15)

(Overlaps with Track 2 — Optimize Existing Agents)

### 4a. Workflow reasoning hardening

- [ ] Add inline workflow stage descriptions (already done in uncommitted changes)
- [ ] Add PFA tooltip on incident detail page (already done)
- [ ] Review system prompt (`docs/system-prompt.md`) for multi-org correctness
- [ ] Add test incidents for every workflow edge case (already seeded via `seed-workflow.sql`)
- [ ] Add e2e test for every workflow transition

### 4b. Multi-region service coverage

- [ ] Remove Kakamega/Vihiga-only CHECK constraint on `referral_services`
- [ ] Add import tool for orgs to bulk-add their local service directories
- [ ] Make county/region filtering org-configurable
- [ ] Seed data: add service templates for new orgs

### 4c. Performance & reliability

- [ ] Add query pagination for large orgs (1000+ incidents)
- [ ] Add Redis cache layer (Memorystore) for referral service lookups
- [ ] Tune Cloud Run concurrency settings
- [ ] Add database connection pooling (pgBouncer via Supabase)
- [ ] Load test with simulated multi-tenant traffic

---

## Phase 5 — Submission & Listing (Days 16–18)

### 5a. Google for Startups submission

- [ ] Create demo video (3 mins: survivor flow + AI matching + admin workflow)
- [ ] Write submission narrative: "From YCK field worker tool to multi-tenant SaaS on GCP"
- [ ] Highlight Gemini integration (provider abstraction → Gemini Enterprise)
- [ ] Highlight FHIR interoperability (Google Cloud Healthcare API readiness)
- [ ] Submit to Track 3

### 5b. Marketplace listing prep

- [ ] Finalize marketplace product listing
- [ ] Create pricing tiers (free org / paid org / enterprise)
- [ ] Document onboarding flow for new orgs
- [ ] Create support documentation for marketplace customers

---

## Quick Reference: File Map

| File | Phase | What to change |
|------|-------|----------------|
| `supabase/schema.sql` | P1 | Add `orgs` table, `org_id` to all tables, new RLS policies |
| `supabase/migration-v2-multi-tenant.sql` | P1 | Migration script for existing data |
| `mcp-server/src/lib/llm.ts` | P2 | Add Gemini & Vertex AI providers |
| `mcp-server/src/index.ts` | P0 | Rename server, update FHIR scopes context |
| `mcp-server/package.json` | P0 | Rename package |
| `docs/agent-card.json` | P0 | Rename agent, update URLs, remove YCK tags |
| `docs/system-prompt.md` | P0/P4 | Replace YCK refs, add multi-org context |
| `frontend/src/lib/supabase.ts` | P1c | Org-aware auth context |
| `frontend/src/pages/app/_components/AppLayout.tsx` | P1d | Org branding, org switcher |
| `frontend/src/pages/Index.tsx` | P1d | Org-aware landing page |
| `frontend/Dockerfile` | P3a | Finalize for Cloud Run |
| `deploy-hackathon.sh` | P3a | Update for Tich Labs branding, Cloud Run config |
| `.github/workflows/ci.yml` | P3c | Add security scanning |
| `README.md` | All | Already updated for Track 3 |

---

## Success Criteria

- [ ] **Multi-tenant**: 2+ orgs can use the same Supabase project with zero data leakage
- [ ] **Gemini Enterprise**: AI matching/risk/FHIR works with Gemini as provider
- [ ] **Cloud Run**: Frontend + MCP server deploy with `gcloud run deploy`
- [ ] **Marketplace-ready**: Listing artifacts complete, deploy guide documented
- [ ] **Optimized**: Workflow reasoning hardened, edge cases covered, system prompt refined
