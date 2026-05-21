# Tich Labs Incident Tracker - Context Document

## Project Overview
**Tich Labs** - AI-powered SGBV support platform for Kakamega and Vihiga Counties, Kenya.

**Current Stage**: Operational PWA ready for pilot testing with community champions.

**Hackathon Pivot**: Moving from Gemini Live Agent Challenge to **Agents Assemble Healthcare AI Challenge** (deadline May 11, 2026 / July 2, 2026 - 8 weeks).

---

## A. Current System Audit

### What Exists (Complete)

| Feature | Status | Details |
|---------|--------|---------|
| Anonymous incident reporting | Complete | Multi-step form, no auth required, reference code system |
| Role-based access control | Complete | 5 roles (pending, volunteer, counselor, program_lead, executive_director) |
| Offline-first PWA | Complete | Service worker, localStorage queue, auto-sync, dead-letter handling |
| Quick Exit button | Complete | Persistent on all pages, clears session, redirects to Google |
| Safety consent screen | Complete | Consent checkbox before entering reporting flow |
| Trauma-informed UX | Complete | Calm language, anonymity notices, progressive disclosure |
| Email notifications | Complete | New incident, assignment, and escalation alerts via Hercules Email |
| Case management workflow | Complete | 7 statuses (new → closed), assignment, escalation, timestamped notes |
| Reporting and analytics | Complete | Charts (type, status, age, gender, monthly trend), CSV export |
| User management | Complete | Approve pending users, change roles, deactivate |
| Admin manual | Complete | In-app, 8 sections covering all operational workflows |
| Mobile-first design | Complete | Responsive layout, bottom nav, large tap targets |
| Survivor privacy protections | Complete | No PII in reports, anonymized exports, role-limited visibility |

### What Partially Exists

| Feature | Status | Gap |
|---------|--------|-----|
| Audit trail | Partial | Notes are timestamped and append-only, but no formal audit_log table tracking who did what and when |
| Push notifications | Partial | Service worker has push handler, but no backend trigger or subscription management |
| PDF export | Partial | Listed on landing page as a feature but not implemented |
| Community champion workflow | Partial | Volunteer role exists but lacks community-specific features (territory, follow-up) |

### What is Missing

| Feature | Impact | Priority |
|---------|--------|----------|
| AI-powered referral matching | Core funding requirement | High |
| Location-based service recommendations | Core funding requirement | High |
| Verified referral/services database | Core funding requirement | High |
| Multilingual/localization | Pilot readiness | Medium |
| Formal audit log table | Compliance/accountability | Medium |
| Monitoring and evaluation (M&E) | Donor reporting | Medium |
| Human oversight mechanisms (for AI) | Safety requirement | High (when AI added) |
| Push notification triggers from backend | Operational efficiency | Low |
| PDF report generation | Listed feature, not built | Low |

---

## B. Funding Readiness Gap Analysis

### Complete Requirements
- ✅ Anonymous reporting
- ✅ Offline-first functionality
- ✅ Role-based access control
- ✅ Survivor privacy protections
- ✅ Trauma-informed UX
- ✅ Quick exit/safety flows
- ✅ Consent management
- ✅ Secure case management (workflow, escalation, notes)
- ✅ Basic analytics and reporting

### Incomplete Requirements
- 🔶 Audit logs (exists as notes but no formal structured log)
- 🔶 Push notifications (infrastructure exists, not wired up)
- 🔶 Community champion workflows (volunteer role exists, needs expansion)
- 🔶 Monitoring and evaluation (basic charts exist, needs M&E framework)

### Missing Infrastructure
- ❌ Referral services database (table with verified organizations, locations, specializations)
- ❌ Geolocation/maps integration for location-based matching
- ❌ AI Gateway integration for LLM-powered matching
- ❌ i18n framework (i18next)
- ❌ Formal audit_log table with actor, action, timestamp, metadata

### Missing AI Components
- ❌ AI referral matching engine
- ❌ Risk/severity scoring
- ❌ Resource recommendation logic
- ❌ Human oversight/approval UI for AI recommendations
- ❌ AI confidence indicators

### Missing Operational Processes
- ❌ Service directory curation workflow
- ❌ AI recommendation review/approval flow
- ❌ M&E data collection and indicator tracking
- ❌ Multi-language content management

---

## C. Technical Architecture

### 9. Admin Manual Page
- **File**: `src/pages/admin/manual/page.tsx`
- **Content**: Comprehensive admin manual with sections on overview, super admin setup, roles, user management, incident workflow, reports, offline mode, and troubleshooting

### 10. Documentation Files
- **README.md**: Not found in basic search
- **Documentation**: Embedded in admin manual page

### 11. PWA Configuration
- **Service Worker**: `public/sw.js` - Offline capabilities and caching
- **Manifest**: `public/site.webmanifest` - PWA manifest file with icons and metadata
- **Install Prompt**: Component for PWA installation

### 12. Role-Based Access Control
- **Implementation**: Both frontend and backend
- **Roles**: volunteer, counselor, program_lead, executive_director, pending
- **Controls**: Access controls in routes, API endpoints, and UI components
- **Views**: Different views and capabilities based on user role

### 13. Privacy/Safety Features
- **QuickExit Component**: Persistent safety button that clears sessionStorage and redirects to safe website
- **SafetyGatePage**: Mandatory safety confirmation before accessing reporting form
- **Anonymous Reporting**: Capability built-in
- **Data Anonymization**: Strict anonymization in reports
- **Confidentiality**: Protections throughout the system

### 14. Analytics/Reporting Pages
- **File**: `src/pages/reports/page.tsx`
- **Features**: Reports and data export functionality
- **Dashboard**: Statistics for different user roles
- **Export**: CSV functionality for donor reporting
- **Views**: Aggregated data by incident type, status, age group, gender

### 15. App.tsx Routing Structure
- **Router**: React Router DOM
- **Public Routes**: homepage, auth callback, safety gate, new incident form, success page
- **Protected Routes**: dashboard, incidents, users, reports, admin manual
- **Layout**: Nested AppLayout for authenticated sections

### 16. Index.css Theming
- **Configuration**: Not found as separate file, theme configuration present in codebase
- **Framework**: Tailwind CSS with custom configurations
- **Variables**: Theme variables defined in the Tailwind config

### Key Files Reference
```
src/App.tsx [1-50]
public/sw.js [1-105]
convex/users.ts [1-144]
convex/emails.ts [1-188]
convex/schema.ts [1-97]
convex/incidents.ts [1-385]
src/pages/Index.tsx [1-50]
src/hooks/use-auth.ts [1-10]
src/pages/NotFound.tsx [1-20]
public/site.webmanifest [1-25]
src/pages/users/page.tsx [1-100]
src/components/ui/kbd.tsx [1-30]
src/components/ui/card.tsx [1-50]
src/components/ui/form.tsx [1-50]
src/components/ui/item.tsx [1-30]
src/components/ui/tabs.tsx [1-30]
src/pages/reports/page.tsx [1-100]
src/components/ui/alert.tsx [1-30]
src/components/ui/badge.tsx [1-50]
src/components/ui/chart.tsx [1-30]
src/components/ui/empty.tsx [1-30]
src/components/ui/field.tsx [1-30]
src/components/ui/input.tsx [1-50]
src/components/ui/label.tsx [1-30]
src/components/ui/sheet.tsx [1-30]
src/components/ui/table.tsx [1-30]
src/pages/auth/Callback.tsx [1-20]
src/components/ui/avatar.tsx [1-30]
src/components/ui/button.tsx [1-50]
src/components/ui/dialog.tsx [1-50]
src/components/ui/drawer.tsx [1-30]
src/components/ui/select.tsx [1-50]
src/components/ui/signin.tsx [1-30]
src/components/ui/slider.tsx [1-30]
src/components/ui/sonner.tsx [1-30]
src/components/ui/switch.tsx [1-30]
src/components/ui/toggle.tsx [1-30]
src/components/quick-exit.tsx [1-35]
src/components/ui/command.tsx [1-30]
src/components/ui/popover.tsx [1-30]
src/components/ui/sidebar.tsx [1-30]
src/components/ui/spinner.tsx [1-30]
src/components/ui/tooltip.tsx [1-30]
src/components/ui/calendar.tsx [1-30]
src/components/ui/carousel.tsx [1-30]
src/components/ui/checkbox.tsx [1-30]
src/components/ui/progress.tsx [1-30]
src/components/ui/skeleton.tsx [1-50]
src/components/ui/textarea.tsx [1-50]
src/components/ui/accordion.tsx [1-30]
src/components/ui/separator.tsx [1-30]
src/pages/admin/manual/page.tsx [1-903]
src/components/ui/breadcrumb.tsx [1-30]
src/components/ui/hover-card.tsx [1-30]
src/components/ui/pagination.tsx [1-30]
src/pages/app/dashboard/page.tsx [1-493]
src/pages/incidents/new/page.tsx [1-690]
src/components/install-prompt.tsx [1-50]
src/components/offline-banner.tsx [1-30]
src/components/ui/collapsible.tsx [1-30]
src/components/ui/error-state.tsx [1-30]
src/components/ui/input-group.tsx [1-30]
src/components/ui/radio-group.tsx [1-30]
src/components/ui/scroll-area.tsx [1-30]
src/components/ui/alert-dialog.tsx [1-50]
src/components/ui/aspect-ratio.tsx [1-30]
src/components/ui/button-group.tsx [1-30]
src/components/ui/context-menu.tsx [1-30]
src/components/ui/toggle-group.tsx [1-30]
src/components/ui/dropdown-menu.tsx [1-30]
src/pages/incidents/detail/page.tsx [1-598]
src/pages/incidents/success/page.tsx [1-30]
src/components/ui/navigation-menu.tsx [1-30]
src/hooks/use-offline-incident-queue.ts [1-196]
src/pages/app/_components/AppLayout.tsx [1-215]
src/pages/incidents/safety-gate/page.tsx [1-102]
```

---

## D. Roadmap

### Phase 1 — MVP Stabilization (1-2 days)

| Feature | Priority | Dependencies | Complexity | Safety Notes |
|---------|----------|--------------|------------|--------------|
| Fix label maps for new categories | Critical | None | Low | Prevents confusion in reports |
| Add anonymous status lookup page | High | None | Medium | Let reporters check case status with their reference code |
| Formal audit_log table | High | Schema change | Medium | Required for accountability |
| Update email templates with new categories | Medium | None | Low | Prevents misleading notifications |

### Phase 2 — Pilot Readiness (3-5 days)

| Feature | Priority | Dependencies | Complexity | Safety Notes |
|---------|----------|--------------|------------|--------------|
| Referral services database + admin CRUD | Critical | Schema design | Medium | Must verify all listed services |
| Multilingual support (English + Swahili) | High | i18next setup | High | Critical for Kenyan context |
| Push notifications (backend triggers) | Medium | Existing SW handler | Medium | Don't push sensitive content |
| PDF report generation | Medium | jspdf | Medium | Ensure anonymized |
| Community champion dashboard | Medium | Role enhancement | Medium | Territory-based view |

### Phase 3 — AI Referral Layer (3-5 days)

| Feature | Priority | Dependencies | Complexity | Safety Notes |
|---------|----------|--------------|------------|--------------|
| AI risk/severity scoring | Critical | Hercules AI Gateway | High | Must have human review |
| AI-powered service matching | Critical | Services DB, AI Gateway | High | Never auto-refer without human approval |
| Human oversight approval UI | Critical | AI scoring | Medium | All AI suggestions require staff confirmation |
| Location-based recommendations | High | Services DB, geolocation | Medium | Don't expose survivor location |
| AI confidence indicators | Medium | AI scoring | Low | Helps staff trust/evaluate AI |

### Phase 4 — Scale and Funding Readiness (2-3 days)

| Feature | Priority | Dependencies | Complexity | Safety Notes |
|---------|----------|--------------|------------|--------------|
| M&E indicator dashboard | High | Data model | Medium | Aligns with donor KPIs |
| Multi-org/tenant support | Medium | Schema refactor | High | Data isolation critical |
| API for external reporting systems | Low | HTTP actions | Medium | Auth required |
| Advanced analytics (cohort, trend prediction) | Low | Enough data | Medium | Anonymize all outputs |

---

## E. Admin Manual Review

### Currently Covered:
- Platform overview
- Super admin setup
- Role hierarchy with permissions
- User management workflows
- Incident workflow (statuses, assignment, escalation, notes)
- Reports and export
- Offline mode
- Troubleshooting/support

### Missing from Admin Manual:
- Project purpose / funding context
- Target users (beyond role descriptions)
- Current architecture overview
- Current development stage (MVP vs. production)
- Implemented vs. planned features
- Security/privacy technical overview
- AI system explanation (not yet built)
- Referral logic explanation (not yet built)
- Operational limitations and known issues
- Roadmap / future work
- Deployment instructions

---

## F. Hackathon Readiness Assessment (Agents Assemble / DevPost)

### Strongest Differentiators
1. **Offline-first**: Real incident reporting without internet — critical for field workers in low-connectivity Kenya
2. **Trauma-informed design**: Safety gate, Quick Exit, anonymity, consent — built into the architecture
3. **Full case management workflow**: Not just reporting — assignment, PFA, escalation, resolution
4. **Privacy by design**: No PII in exports, role-based visibility, anonymized analytics
5. **Real email notifications**: Automated alerts at every workflow stage
6. **PWA with native-like experience**: Installable, cached, push-ready

### AI Components Status
- **Currently Present**: None. Zero AI code exists in the codebase.
- **Missing for Demo**: AI-powered referral matching (the headline feature for Agents Assemble)

### What Should Be Demoed Live
1. Full anonymous reporting flow (safety gate → form → success)
2. Quick Exit button behavior
3. Offline submission + sync when reconnected
4. Staff workflow: assign counselor → update status → escalate
5. Reports dashboard with real data
6. **AI referral recommendation (if built) with human approval step**

### What Judges Will Likely Question
1. **"Where is the AI agent?"** — Must have a clear AI component
2. **"How does the referral matching work?"** — Need a working demo
3. **"What happens if AI gets it wrong?"** — Human oversight answer is strong
4. **"How do you protect survivor data?"** — Strong answer already (anonymization, RBAC, no PII exports)
5. **"Is this actually deployed/usable?"** — Yes, it's a working PWA

### Risks/Red Flags
- ⚠️ **No AI yet**: For "Agents Assemble" specifically, this is a critical gap. The hackathon is about AI agents
- ⚠️ **New categories not reflected everywhere**: Could show inconsistencies during demo
- ⚠️ **Email requires configuration**: Won't work in demo unless secrets are set

---

## G. Recommended Demo Narrative

> "We built a trauma-informed, offline-first incident reporting platform for youth protection workers in Kenya. The AI layer acts as a referral assistant — when a case is logged, it analyzes the incident type, severity, and location to recommend verified local services. But critically, no AI recommendation reaches a survivor without a trained counselor approving it first. The system prioritizes safety over speed."

---

## H. Recommended Next Actions

### Immediately (Today):
1. **Fix label maps and email templates** for new categories (prevents demo bugs)
2. **Export code from Hercules** (Business license → Download App Code + Export Database)

### Before Submission (Critical):
1. **Build AI referral matching** using Hercules AI Gateway + services database — **mandatory hackathon differentiator**
2. **Add anonymous status lookup page** so reporters can check their case

### For Polish:
1. **Add English/Swahili toggle** (demonstrates real-world readiness)
2. **Create services database** with verified health facilities, police stations, legal aid (from docs/GBV REFERRAL PATHWAY.docx)

---

## I. Technical Risks
1. **No AI infrastructure**: Zero AI code exists. This is the single biggest gap vs. the concept note
2. **Label maps in reports/dashboard not updated**: The new categories (child_exploitation, tech_enabled_abuse) are not reflected in `src/pages/reports/page.tsx` or `src/pages/app/dashboard/page.tsx` label maps
3. **Email template labels outdated**: `convex/emails.ts` still uses old category labels
4. **No services/resources table**: Required before any referral matching can work

---

## J. UX/Safety Risks
1. **No language toggle**: Users in multilingual contexts cannot switch languages
2. **No "safe browsing" mode**: Beyond Quick Exit, no disguised mode or panic key
3. **No follow-up mechanism for anonymous reporters**: They get a reference code but no way to check status

---

## K. FHIR Integration Context (Agents Assemble)

### Why Agents Assemble is the Right Choice:
1. **Healthcare Alignment** – Challenge focuses on FHIR-compliant healthcare systems and interoperability. Aligns with Kenya's MoH FHIR adoption for UHC (2024-2025)
2. **Realistic Timeline** – 8 weeks (until May 11 / July 2, 2026) vs. tight Gemini timeline
3. **Better for GBV Work** – Judges evaluate "Feasibility" and "Impact" on healthcare systems. Directly addresses Kenya's KES 46 billion annual SGBV cost
4. **Proper Testing & Validation** – Space to build properly and test with real user scenarios (critical for survivor data safety)
5. **No High Upfront Costs** – Uses open-source tools vs. Gemini's Google Cloud prepaid credit requirement

### FHIR Resources to Implement:
- `Patient` (survivor - anonymized)
- `Observation` (abuse type, incident details)
- `Location` (health facilities, services)
- `ServiceRequest` (referrals)
- `Consent` (survivor consent records)

### Kenya MoH Integration Points:
- National SGBV FHIR profiles
- Kenya Health Information Exchange (HIE)
- Kakamega & Vihiga county health facilities (from docs/GBV REFERRAL PATHWAY.docx)

---

## L. Documentation in /docs Folder

### AI Concept Paper.pdf
- Complete project overview
- Team structure (Project Lead, Technical Lead, M&E Lead, Program Officer)
- Technical approach: Matching and retrieval (not chatbot)
- Testing timeline: 6 months total
- Community involvement: Co-creators, validators, accountability partners

### GBV REFERRAL PATHWAY.docx
- Kakamega County facilities: Kakamega County Referral Hospital, Mumias Level 4, Butere, Malava, Matungu, Likuyani, Shinyalu, Igukhu
- Vihiga County facilities: Vihiga County Referral, Sabatia, Emuhaya, Hamisi, Coptic nursing home
- Police stations, rescue centers, psychosocial support, legal services
- National GBV helpline: 1195
- Legal aid: FIDA Kenya (0707554806), COVAW (0800 720 553)

### Survivors Journey.docx
- Immediate steps after reporting for: Sexual, Physical, Financial/Economic, Emotional/Psychological, Digital abuse
- Safety, health, evidence preservation guidance

### Types of Abuse.pdf
- Educational content on 5 abuse types: Sexual, Emotional, Physical, Financial, Digital
- "Know it. See it. Stop it." awareness material

---

## M. Migration from Hercules to Local Development

### Export Steps (Business License):
1. Log into hercules.app
2. **More → Export → Download App Code** (ZIP)
3. **More → Export → Export Database** (ZIP with SQL/JSON)

### Local Setup:
```bash
# Extract and install
unzip incident-report-code.zip -d tichlabs-rapid-agent
cd tichlabs-rapid-agent
npm install

# Set up PostgreSQL (import database export)
brew install postgresql
psql -U postgres -d tichlabs_incidents < database_export.sql

# Create .env.local
DATABASE_URL=postgresql://postgres@localhost:5432/tichlabs_incidents
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Replace Hercules Services:
| Hercules Service | Local Replacement |
|-----------------|------------------|
| Database | PostgreSQL (import SQL dump) |
| Auth | BetterAuth or NextAuth.js |
| Backend Functions | Express.js API routes |
| File Storage | Local `/uploads` folder |
| AI Integration | Direct API calls to OpenAI/Azure |
| Email | SendGrid, Resend, or Nodemailer |

---

## N. App Pages & Features

### PUBLIC-FACING PAGES
1. **Landing Page (/en)**
   The entry point for all users. Features a dark gradient hero with the tagline "Protect Survivors. Empower Responders." and a prominent "Report an Incident" call-to-action. The navbar includes language switcher (EN/SW), "Find Help" link, and "Report Incident" button. Below the fold: Core Features section highlighting Structured Incident Logging and Offline-Capable PWA. The persistent Quick Exit button appears top-right on every page.

2. **Swahili Landing Page (/sw)**
   Full Swahili translation of the landing page — "Linda Walionusurika. Wawezesha Wahudumu." — demonstrating the dual-language support. All navigation, features, and footer text are localized.

3. **Safety Gate (/en/incidents/safety)**
   A pre-entry consent screen before the incident form. Displays "Your Safety Matters" with a privacy warning, a consent checkbox, Continue/Leave options, and a confidentiality note.

4. **Incident Report Form (/en/incidents/new)**
   A 4-step wizard:
   - Step 1: Select incident type using large tap-friendly icon cards (Physical Harm, Sexual Harm, Emotional Abuse, Neglect, Bullying/Harassment, Domestic Violence, Child Exploitation, Missing Child, Tech-Enabled Abuse, Other), plus date/time pickers
   - Subsequent steps collect location, survivor details, and description
   - Header shows step progress indicator, language switcher, and the anonymity banner

5. **Submission Success (/en/incidents/success)**
   A confirmation screen after successful report submission with a checkmark icon and confidentiality assurance message.

6. **Referral Services Directory (/en/referral)**
   Lists GBV referral services for Kakamega and Vihiga counties. Features:
   - Emergency banner (call 999/1195)
   - Formal GBV referral pathway explanation
   - County and service type filters (Health Facilities, Police Stations, Rescue & Shelter, Counselling, Legal Services)

### ADMIN / STAFF PAGES (requires sign-in)
7. **Dashboard (/en/dashboard)**
   Personalized greeting with role badge (Executive Director). Shows:
   - Summary cards: Total (7), New (7), In Progress (0)
   - Incidents awaiting assignment with category icons, location, and timestamps
   - Quick Actions panel: Review All Incidents, Manage Users, Audit Log

8. **All Incidents (/en/incidents)**
   Filterable list with status tabs (All, New, Assigned, In Progress, Escalated, Resolved, Closed). Each row shows category icon, type, location, date, and status badge.

9. **Reports & Analytics (/en/reports)**
   Anonymized analytics with time-range filters (7 days, this month, 3/6 months, this year, custom range). Summary cards for Total, Escalated, Resolved, and In Progress counts. CSV export button.

10. **Audit Log (/en/audit)**
    Displays all system activity (incident creation, status changes, assignments). Currently empty — populates as staff interact with incidents.

11. **User Management (/en/users)**
    Search and filter users. Shows role (Exec. Director), email, join date. Role Permissions Guide dropdown. Tabs: All Users, Active, Inactive.

12. **Manage Referral Services (/en/admin/services)**
    Full CRUD table of 44 seeded services. Columns: Service name, Category badge, County, Status (Active/Inactive), Edit/Delete actions. Search bar and category filter. "+ Add Service" button.

13. **Admin Manual (/en/admin/manual)**
    In-app documentation with sidebar navigation (Overview, Super Admin Setup, Role Hierarchy, User Management, Incident Workflow, Reports & Export, Privacy & Safety, Audit Log, Email Notifications, Offline Mode, Architecture, Support). Shows system overview, feature cards, and typical workflow steps.

### MOBILE VIEWS
14-16. **Mobile Responsive**
    All pages adapt to mobile viewport (375px): the landing page stacks vertically, the incident form uses a 2-column icon grid with a sticky Continue button, and the dashboard uses a hamburger menu with the same sidebar navigation.

*Note: 13 distinct pages across 2 user types, plus mobile responsiveness and bilingual support (EN/SW). Referral services database (44 seeded entries) is now fully implemented with CRUD capabilities.*

---

**Last Updated**: May 7, 2026
**Project URL**: https://incident-report.onhercules.app/
**Hackathon**: https://agents-assemble.devpost.com/
