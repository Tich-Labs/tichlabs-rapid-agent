# Referral Page — Implementation Execution Guide

This document is prescriptive. Every section produces exact engineering decisions.
Hand this to a React/Tailwind engineer.

---

## PART 1 — EXACT REMOVALS

### REMOVE entirely:

| Item | Rationale | Implementation |
|------|-----------|---------------|
| "All Counties" pill (mobile bottom sheet, line 425-435) | Default state = all. Extra button = 1 more thing to parse. | Delete lines 425-435 from `page.tsx` |
| "All Types" pill (mobile bottom sheet, line 455-465) | Same rationale. Click active pill to deselect. | Delete lines 455-465 from `page.tsx` |
| "County:" label text (desktop, line 295) | Database column name leaked into UI. | Replace with nothing — the pills ARE the county selector. Context makes them self-evident. |
| "Type:" label text (desktop, line 311) | Same — database nomenclature. | Delete `span` entirely. Remove the `|` divider on line 310. |
| Disabled "Near me" button (mobile line 251-257, desktop 285-292) | Broken promise. A button that exists but doesn't work damages trust more than not existing at all. | Delete both instances entirely. Replace with nothing. Will be re-added only when functional. |
| Gemini label (mobile line 262-266, desktop 331-336) | "Matched by Gemini 2.5" is developer-facing. Users don't care about AI model versions. | Delete both instances. The AI match quality will be communicated implicitly through result ordering + a small "Best match" badge on top results. |
| `_aiMatch?.reasoning` paragraph from ServiceCard (line 74-76) | Raw AI output shown to crisis users. Mechanical, impersonal, unnecessary. | Delete lines 74-76. Reasoning stays in the data but never renders on cards. |
| Pathway banner (lines 202-220) | The formal GBV referral pathway (medical → police → counselling → prosecution → reintegration) is important context but NOT what someone in crisis needs before seeing help options. This is admin documentation. | Delete entire pathway banner block. Move content to the About page or admin manual. |
| "Near me" disabled ghost button on desktop filter row (lines 285-292) | Already covered — duplicate instance. | Delete. |

### COLLAPSE into progressive disclosure:

| Item | Rationale | Implementation |
|------|-----------|---------------|
| Emergency banner | Currently always visible. Right: high priority but shouldn't dominate the screen for non-emergency users. Wrong: occupies prime real estate above-the-fold. | Collapse to a single tappable row: "🚨 I need emergency help · Police 999 · GBV 1195". Tap expands to full banner. `useState` toggle, `collapsed` by default with a subtle pulse animation on first load only. |
| Full category list | 7 pills is too many. Exposes internal taxonomy. | Surface 4 as "Quick picks" cards (see Part 4). Remaining 3 hidden behind "More options". |
| AI relevance scores | `/100` score is for A/B testing, not for survivors. | Hide by default. Show only when user taps a "Why this recommendation?" link. |

### MOVE lower in hierarchy:

| Item | Rationale | Implementation |
|------|-----------|---------------|
| County selector pills | Currently inline with search bar at equal visual weight. Should be secondary — most users search by need first, location second. | Move below search + quick picks. Small text: "Showing services in [counties]". Subtle, not a filter row. |
| Results count ("176 services · 14 free helplines") | Currently prominent text above cards. Right: useful. Wrong: reads as dashboard stat. | Move to a single muted line below search area, smaller font, calmer tone. |

### BECOME contextual only:

| Item | Rationale | Implementation |
|------|-----------|---------------|
| Filter count badge on mobile Filters button | Currently always shows `{filterCount}`. Useful only when filters ARE active. | Show badge ONLY when `filterCount > 0`. Currently already does this — keep. |
| Language switcher | Useful but not during crisis browsing. | Already `hidden sm:inline-flex` — keep. No change. |

---

## PART 2 — FINAL PAGE HIERARCHY

### MOBILE (375px)

```
┌──────────────────────────────┐
│ ← Find Help         EN | SW  │  sticky header, h-12
├──────────────────────────────┤
│ 🚨 Emergency? Police 999 |   │  collapsed 1-row, tap expands
│    GBV helpline 1195         │  sticky, bg-destructive/10
├──────────────────────────────┤
│ 🔍 What kind of help         │  SEARCH — full width, largest input on page
│    do you need?              │  placeholder text visible
│    ─────────────────────     │  voice mic icon (right, future)
│                              │
│ ┌──────────┐ ┌──────────┐   │  QUICK PICKS — 2x2 grid
│ │ Medical  │ │ Shelter  │   │  tappable cards, color left bar
│ └──────────┘ └──────────┘   │
│ ┌──────────┐ ┌──────────┐   │
│ │Counselling│ │ Hotlines │   │
│ └──────────┘ └──────────┘   │
│                              │
│ + Legal, police, livelihood  │  text link, expands to show remaining 3
│                              │
│ Showing services in:         │  COUNTY — subtle row, no label needed
│ [Nairobi] [Kakamega] [Vihiga]│  small pills, not primary
│                              │
│ ──────────────────────────── │
│ 176 services · 14 free       │  muted results summary
│ ──────────────────────────── │
│                              │
│ ┌────────────────────────┐   │
│ │ ▎County Hospital       │   │  CARD — color left bar
│ │ ▎Medical care          │   │  org name bold, category small
│ │ ▎Treatment, HIV PEP... │   │  description 2-line clamp
│ │ ▎[    CALL 0700...    ]│   │  button full width, 48px min
│ └────────────────────────┘   │
│ ┌────────────────────────┐   │
│ │ ▎Safe Shelter          │   │
│ │ ...                    │   │
│ └────────────────────────┘   │
│ ...                          │
└──────────────────────────────┘
```

- **Sticky**: header (top-0), emergency banner (top-12). Everything else scrolls.
- **Spacing**: `gap-4` between sections. `px-4` page padding.
- **Max-width**: none on mobile — full bleed cards.

### TABLET (md: 768px+)

```
┌──────────────────────────────────────┐
│ ← Find Help                  EN | SW │
├──────────────────────────────────────┤
│ 🚨 Emergency? Police 999 | ...       │
├──────────────────────────────────────┤
│   🔍 What kind of help do you need?  │  search centered, max-w-xl
│                                      │
│ ┌─────────┐┌─────────┐┌─────────┐┌──│  quick picks: 4 columns
│ │ Medical ││ Shelter ││Counsell.││Hot│
│ └─────────┘└─────────┘└─────────┘└──│
│                                      │
│ + Legal, police, economic support    │  inline link
│                                      │
│ Showing services in:                 │
│ [Nairobi] [Kakamega] [Vihiga]        │
│                                      │
│ ── 176 services · 14 free helplines ─│
│                                      │
│ ┌──────────┐ ┌──────────┐ ┌────────┐ │  card grid: 3 columns
│ │ Card     │ │ Card     │ │ Card   │ │
│ └──────────┘ └──────────┘ └────────┘ │
└──────────────────────────────────────┘
```

- **Spacing**: `max-w-4xl mx-auto px-6`. `gap-5` between sections.
- **Quick picks**: 4×1 row. Larger cards than mobile.
- **Card grid**: 3 columns. Cards equal height via `grid` + `h-full`.

### DESKTOP (lg: 1024px+)

Same as tablet with wider max-width (`max-w-5xl`). County pills move to right side of search row for horizontal efficiency. Quick picks: 4×1 row with generous padding.

---

## PART 3 — SEARCH-FIRST REBUILD

### Exact placeholder text:

**Current**: "Describe the kind of help needed..."
**New**: "What kind of help do you need?"

WHY: "What kind" = open, non-clinical. "You" = first person, human. Shorter = less cognitive load.

### Search suggestion chips (new):

Below the search input, show 3-4 example search chips that disappear once the user types:

```
Try:  "I need a safe place to stay"    "I was hurt"    "Someone to talk to"
```

These are ghost text buttons. Tapping one populates the search input and triggers the MCP search directly. They exist only when `searchQuery.length === 0`.

Implementation:
```tsx
const SUGGESTIONS = [
  "I need a safe place to stay",
  "I need medical attention",
  "Someone to talk to",
  "I want to report an incident",
];

// Render only when searchQuery === "" && !aiActive
{!searchQuery && !aiActive && (
  <div className="flex flex-wrap gap-2 mt-3">
    {SUGGESTIONS.map(s => (
      <button
        key={s}
        onClick={() => handleSearch(s)}
        className="px-3 py-1.5 rounded-full text-sm border border-border bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
      >
        {s}
      </button>
    ))}
  </div>
)}
```

### Search ranking:

MCP search already returns scored results. Display in score-descending order. The top 3 results get a "Best match" label (not a number). Results 4-10 show without scores.

### AI invisibility:

The AI label is REMOVED entirely. The fact that matching uses AI is a technical detail. Users don't need to know. The quality of results speaks for itself. If we must disclose (transparency), add a single line at page bottom: "Suggestions are AI-assisted. Always confirm details before visiting."

### Loading state:

Current: spinner icon in search input (line 235-237).
Keep the spinner in the input. ADD a skeleton shimmer on the card grid DURING AI search — replace current cards with 6 skeleton placeholders. This makes the transition feel like "searching" rather than "waiting."

### No-results state:

```tsx
<div className="text-center py-16">
  <SearchX className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
  <p className="text-base font-medium">No matching services found</p>
  <p className="text-sm text-muted-foreground mt-1 mb-4">
    Try describing your situation differently, or browse all services below
  </p>
  <Button variant="outline" onClick={clearSearch}>Browse all services</Button>
</div>
```

### Mobile keyboard behavior:

`inputMode="text"` (not "search" — avoids "Search" button on iOS keyboard, keeps it conversational). `autoComplete="off"`. `enterKeyHint="search"` to show search action.

### Filter behavior relative to search:

**Decision**: Filters are secondary. Search is primary. When the user types ≥ 3 characters, the MCP search activates. Filters (county, category) STILL APPLY as context (`selectedCategory` and `selectedCounty` are already passed to `matchServices()`). The MCP search scopes within current filters — this is correct behavior. Keep it.

---

## PART 4 — QUICK PICKS REBUILD

### EXACT language mapping (database → human):

| Database | Human | Icon | Color bar |
|----------|-------|------|-----------|
| `health` | Medical care | `Stethoscope` | `bg-teal-500` |
| `shelter` | Safe shelter | `Home` | `bg-amber-500` |
| `psychosocial` | Counselling | `Heart` | `bg-purple-500` |
| `hotline` | Hotlines | `PhoneCall` | `bg-red-500` |
| `police` | Police | `Shield` | `bg-blue-500` |
| `legal` | Legal help | `Scale` | `bg-indigo-500` |
| `economic_empowerment` | Livelihood support | `Briefcase` | `bg-green-500` |

### Which 4 are visible: Medical care, Safe shelter, Counselling, Hotlines

**Why these 4**: These cover the most urgent needs. Someone in crisis needs medical attention, a safe place, emotional support, or a crisis line. Police + legal + economic are secondary (you report after you're safe).

### "More options" behavior:

Text link: "+ Also show: Police, Legal help, Livelihood support". Tapping it expands the quick pick grid from 2×2 to show ALL 7 as cards. The link text changes to "− Show fewer". State: `useState<boolean>(false)`.

### Selected/unselected states for quick picks:

```tsx
// Selected state (active filter)
className={cn(
  "rounded-xl border-2 p-3 transition-all cursor-pointer text-left",
  selected
    ? "border-primary bg-primary/5 shadow-sm"
    : "border-border bg-card hover:border-primary/30"
)}
```

The color bars are ALWAYS visible (even when unselected) — they're category identifiers, not selection state. Selection state is communicated through border + shadow.

### Exact child component: `QuickPickCard`

```tsx
function QuickPickCard({ icon: Icon, label, subtitle, colorBar, selected, onClick }) {
  return (
    <button onClick={onClick} className={cn(
      "flex items-start gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer w-full text-left",
      selected
        ? "border-primary bg-primary/5 shadow-sm"
        : "border-border bg-card hover:border-primary/30 hover:bg-muted/20"
    )}>
      <div className={cn("w-1.5 self-stretch rounded-full flex-shrink-0", colorBar)} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-muted-foreground" />
          <span className="font-semibold text-base">{label}</span>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
    </button>
  );
}
```

### Grid layout:

```tsx
<div className="grid grid-cols-2 gap-3">
  {visiblePicks.map(pick => <QuickPickCard key={pick.id} {...pick} />)}
</div>
```

---

## PART 5 — COUNTY / LOCATION STRATEGY

### Final recommendation: County selector EXISTS but is DEMOTED.

**Rationale against removing entirely**: 176 services across 3 counties. Without location scoping, a Kakamega user sees Nairobi hospitals. That's worse than having a filter.

**Rationale against auto-detection**: Geolocation fails. Users deny location access. Nairobi users travel to Kakamega. IP geolocation is wrong 40% of the time. Don't build UX that silently breaks.

**Rationale against post-search only**: User types "safe shelter" → gets 15 results across 3 counties → "Nairobi Safe Shelter" appears last alphabetically because Kakamega comes first. Bad.

### Implementation:

County is a **soft filter** — always visible below search + quick picks, always shows 3 pills, no "all" pill, no label. The pills toggle on/off (click active = deselect = show all).

**Mobile**:
```tsx
<div className="flex items-center gap-2 mt-3">
  <MapPin className="h-4 w-4 text-muted-foreground/60 flex-shrink-0" />
  {COUNTIES.map(c => (
    <button
      key={c}
      onClick={() => setSelectedCounty(selectedCounty === c ? null : c)}
      className={cn(
        "px-3 py-1 rounded-full text-sm transition-colors cursor-pointer capitalize",
        selectedCounty === c
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
      )}
    >
      {c}
    </button>
  ))}
</div>
```

**Desktop**: Same row, right-aligned next to search, same styling.

**When a county IS selected**: Results header changes to "Showing services in Nairobi" and the selected pill becomes visually distinct. When NO county is selected, the pills are all muted, header reads "Showing services in all areas."

---

## PART 6 — SERVICE CARD REBUILD

### Information order (top to bottom):

1. **Color left bar** (4px, full height) — fastest visual category scan
2. **Organization name** — `font-bold`, no truncation, wraps to 2 lines max
3. **Category** — small muted text below name. NOT a badge. NOT a pill. Just text: "Medical care"
4. **Description** — `text-sm text-muted-foreground`, `line-clamp-2`
5. **CALL button** — last element, full width mobile, prominent

### What NEVER appears on a card:

- County name (county filter already scoped)
- `/100` AI relevance score
- AI reasoning text
- Address (not useful for mobile-first — phone is primary action)
- "Services offered:" prefix text
- Location pin icon
- Secondary phone numbers

### CTA hierarchy:

| CTA | Priority | Mobile | Desktop |
|-----|----------|--------|---------|
| Call button | Primary — SOLO action | Full width, 48px+ tap target, colored bg | Right-aligned, `sm:w-auto` |
| "Why recommended?" | Secondary — hidden | Expandable on tap below description | Same |
| "Free Call" vs "Call [number]" | Informational | Green bg for free, teal for paid | Same |

### Card height:

All cards in a row must be equal height. Use CSS grid `align-items: stretch` (default in CSS Grid). The button anchors to the bottom via `mt-auto` inside a `flex flex-col h-full` container.

```tsx
<div className="flex flex-col h-full rounded-xl border border-border bg-card overflow-hidden">
  <div className="flex-1 p-4">
    {/* name, category, description */}
  </div>
  <div className="px-4 pb-4">
    <a href={`tel:${phone}`} className="block w-full ...">Call {phone}</a>
  </div>
</div>
```

### Trust indicators:

- **Verified badge**: Add `source` field from seed data ("NCCG GBV Service Directory, November 2023" / "Tich Labs Verified — GBV Referral Pathway"). Show as a small muted text at card bottom: "Verified by NCCG Directory · Nov 2023"
- **Free call highlight**: Green "Free · Available 24/7" badge next to the call button for toll-free numbers.

### Emergency differentiation:

If a service is a hotline (category = "hotline"), apply a subtle red left border instead of the category color. This visually distinguishes "call right now" services from "visit in person" services.

### React component (updated):

```tsx
export function ServiceCard({ service, categoryCfg }: ServiceCardProps) {
  const phone = service.phone;
  const free = phone ? isFreeCall(phone) : false;
  const colors = categoryCfg?.color ?? categoryColor(service.category);
  const isHotline = service.category === "hotline";
  const borderColor = isHotline ? "bg-red-500" : `bg-${colors.bar}-500`;

  return (
    <div className="flex flex-col h-full rounded-xl border border-border bg-card hover:border-primary/20 transition-colors overflow-hidden">
      <div className="flex gap-0 h-full">
        <div className={cn("w-1.5 flex-shrink-0", isHotline ? "bg-red-500" : colors.bar)} />
        <div className="flex-1 flex flex-col p-4 pl-3">
          <h3 className="font-bold text-base leading-snug mb-0.5">{service.name}</h3>
          <p className="text-sm text-muted-foreground">
            {CATEGORY_HUMAN[service.category] ?? service.category}
          </p>
          {service.description && (
            <p className="text-sm text-muted-foreground/80 mt-2 leading-relaxed line-clamp-2">
              {service.description}
            </p>
          )}
          <div className="mt-auto pt-3">
            {phone && (
              <a
                href={`tel:${phone.replace(/\s/g, "")}`}
                className={cn(
                  "flex items-center justify-center gap-1.5 w-full px-4 py-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer",
                  free
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                <Phone className="h-4 w-4" />
                {free ? "Free · 24/7" : `Call ${phone}`}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## PART 7 — EMERGENCY UX REBUILD

### Decision: Collapsed by default, tappable to expand, sticky, always accessible.

**Should emergency remain top priority?** Yes. Someone being actively harmed needs to see help options in <1 second.

**How to avoid panic-inducing UI?** Current: full-width red banner with exclamation icon. This IS appropriate for "actively dangerous" — but should collapse once the user acknowledges it. The key insight: **this is for people in immediate danger, not everyone.** Most users are browsing, not fleeing. Let them dismiss it.

**Mobile**: Sticky below header. One row: `"🚨 Emergency? Call 999 (police) or 1195 (GBV helpline)"` — tappable. Tapping expands to show: "These numbers are free, available 24/7. You will not be asked for your name. Stay safe." The banner uses `bg-destructive/10` — just enough red to be noticeable, not alarming.

**Desktop**: Same behavior. Not collapsed — the emergency line is always visible as a single row since there's more horizontal space.

### Exact copy:

**Collapsed state** (mobile):
```
🚨 Emergency?  Police 999  ·  GBV Helpline 1195
```

**Expanded state** (mobile):
```
🚨 In immediate danger?

Call 999 (police) or 1195 (GBV helpline)
Free · 24/7 · Confidential · No questions asked

If you cannot speak: text a trusted person, or visit the nearest police station or hospital.
```

**Collapsed state** (desktop — same but one line):
```
🚨 Emergency? Call Police 999 or GBV Helpline 1195 — Free, 24/7, confidential
```

### Interaction:

```tsx
const [emergencyExpanded, setEmergencyExpanded] = useState(false); // default: false

// Mobile: single row, tap to expand
<button
  onClick={() => setEmergencyExpanded(!emergencyExpanded)}
  className="w-full flex items-center gap-2 px-4 py-2.5 bg-destructive/10 border-b border-destructive/20 text-sm text-destructive cursor-pointer"
>
  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
  <span className="flex-1 text-left">
    Emergency? Police 999 · GBV Helpline 1195
  </span>
  {emergencyExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
</button>

// Expanded content
{emergencyExpanded && (
  <div className="px-4 py-3 bg-destructive/5 border-b border-destructive/20 text-sm text-destructive">
    <p className="font-semibold mb-1">In immediate danger?</p>
    <p>Call <strong>999</strong> (police) or <strong>1195</strong> (GBV helpline).</p>
    <p className="mt-1 text-destructive/70">Free · 24/7 · Confidential · No questions asked</p>
    <p className="mt-2 text-destructive/70 text-sm">If you cannot speak: text a trusted person, or visit the nearest police station or hospital.</p>
  </div>
)}
```

### Accessibility:

- `role="alert"` on the collapsed button for screen readers to announce it
- `aria-expanded={emergencyExpanded}` on the button
- Phone numbers are tappable `<a href="tel:999">` links — not just text
- Respect `prefers-reduced-motion`: disable pulse animation if user prefers reduced motion

---

## PART 8 — TRAUMA-INFORMED MICROCOPY

### Page title
**Current**: "GBV Referral Services"  
**New**: "Find Help"

WHY: "GBV" is jargon. "Referral Services" is institutional. A person in distress searches for "help," "support," "safe place" — not "GBV referral."

### Search placeholder
**Current**: "Describe the kind of help needed..."  
**New**: "What kind of help do you need?"

### Search suggestions
```
Try:  "I need a safe place to stay"
      "I need medical attention"
      "Someone to talk to"
      "I want to report an incident"
```

### No results
```
Title: Nothing matched your search
Body: Try describing your situation differently, or browse all 176 services below
Button: Browse all services
```

### Loading
**Current**: silent spinner in input  
**New**: "Finding services that match your needs..." + card skeleton shimmer

### Results header (no filters)
**Current**: "176 services · 14 free helplines"  
**New**: "176 services near you · 14 free, 24/7 helplines"

### Results header (county + category selected)
**Current**: "53 services in Health · Nairobi"  
**New**: "53 medical services in Nairobi"

### Results header (county only)
**Current**: "139 services · Nairobi"  
**New**: "139 services in Nairobi"

### Card CTA — free calls
**Current**: "Free Call" (green button)  
**New**: "Free · 24/7" (green button)

### Card CTA — paid calls
**Current**: "Call 0700 000 001"  
**New**: "Call 0700 000 001"

### Card category — human labels
**Current**: "health" / "psychosocial" / "economic_empowerment" (as badges/pills)  
**New**: "Medical care" / "Counselling & support" / "Livelihood support" (as small text)

### Reassurance copy (new — pinned below emergency banner)
```
"You are not alone. These services are here to help. No sign-in required. Everything is anonymous."
```

This is a single muted line of text, dismissible (× button), shown only once per session (localStorage flag). Not a banner, not a notification — just text.

### Emergency language
See Part 7 above.

### Empty quick pick selection (search not used, no filters active)
When the page first loads with zero filters:
```
176 services across Nairobi, Kakamega, and Vihiga
Tap a category above or search to find what you need
```

### Category → Human map (for results display)
```tsx
const CATEGORY_LABEL: Record<string, string> = {
  health: "Medical care",
  police: "Police & reporting",
  shelter: "Safe shelter",
  psychosocial: "Counselling & support",
  legal: "Legal help",
  hotline: "Crisis hotline",
  economic_empowerment: "Livelihood support",
};
```

---

## PART 9 — IMPLEMENTATION PLAN

### P0 (must fix now — blocking emotional safety)

| # | Change | Impact | Complexity | File |
|---|--------|--------|-----------|------|
| 1 | Remove "All Counties"/"All Types" from bottom sheet | Filter noise reduction | 5 min | `page.tsx` lines 422-435, 452-465 |
| 2 | Remove "Matched by Gemini 2.5" label everywhere | Remove leaked tech jargon | 2 min | `page.tsx` lines 261-266, 331-336 |
| 3 | Remove AI reasoning from ServiceCard | Don't show LLM output to survivors | 1 min | `ServiceCard.tsx` lines 74-76 |
| 4 | Replace category pills on cards with left color bar | 10x faster visual scanning | 30 min | `ServiceCard.tsx` full rewrite |
| 5 | Collapse emergency banner to single row | Reclaims above-fold space, still accessible | 15 min | `page.tsx` lines 190-199 |
| 6 | Add "You are not alone" reassurance line | Emotional safety | 5 min | `page.tsx` after emergency banner |
| 7 | Replace all category labels with human language | Stops sounding like a database | 15 min | `page.tsx` + `ServiceCard.tsx` |

### P1 (significant UX improvement)

| # | Change | Impact | Complexity | File |
|---|--------|--------|-----------|------|
| 8 | Remove pathway banner entirely | Remove admin content from crisis page | 2 min | `page.tsx` lines 202-220 |
| 9 | Remove "Near me" disabled button everywhere | Remove broken promise | 2 min | `page.tsx` lines 251-257, 285-292 |
| 10 | Add search suggestion chips below input | Guide first-time users | 20 min | `page.tsx` new component |
| 11 | Replace 7-pill grid with 4 quick pick cards + "More" | 40% less visual noise | 1 hr | New `QuickPickCard.tsx` |
| 12 | Demote county pills — no labels, subtle styling | Stop competing with search | 15 min | `page.tsx` county section |
| 13 | Add "Verified by [source]" line to cards | Trust signal | 15 min | `ServiceCard.tsx` + seed data |
| 14 | Improve empty/no-results copy | Dead-end → helpful redirect | 5 min | `page.tsx` empty state |

### P2 (nice to have)

| # | Change | Impact | Complexity |
|---|--------|--------|-----------|
| 15 | Voice search button (mic icon, future) | Accessibility for unsafe typing | 4 hr (needs Web Speech API) |
| 16 | AI "Why this match?" expandable on top 3 results | Transparency without clutter | 1 hr |
| 17 | `prefers-reduced-motion` support | Accessibility | 30 min |
| 18 | Pin reassurance line per-session (localStorage) | Not annoying on repeat visits | 15 min |
| 19 | Auto-capitalize county names in seed data | Consistency in card display | 5 min in seed scripts |
| 20 | Card equal height via CSS grid `h-full` on each card | Visual consistency | 5 min |

---

## PART 10 — FINAL TARGET EXPERIENCE

### What the page should feel like:

A warm, calm, private space. Like a social worker's office — not a government website. The page says: "We've organized the help. You just need to tell us what you need."

### How a distressed user moves through it:

1. Opens page → sees title "Find Help" + reassurance "You are not alone. No sign-in required."
2. Sees emergency line: "Emergency? Police 999 · GBV Helpline 1195" — accessible but not dominant
3. Primary action: large search input asking "What kind of help do you need?"
4. Scans 4 clear choices: Medical care, Safe shelter, Counselling, Hotlines — each with a descriptive subtitle
5. Taps one → sees filtered results immediately, organized by relevance
6. First card: clear name, clear category, clear description in 2 lines, BIG green "Call" button
7. Taps Call → phone dialer opens → help is reached

From page open to phone call: **3 interactions maximum** (open → tap quick pick → tap call).

### What emotional friction disappears:

- No more deciding what "GBV Referral" means
- No more parsing "Filter by county" as an instruction
- No more scanning 10 filter chips before seeing any results
- No more seeing AI model names while in crisis
- No more disabled buttons suggesting features that don't exist
- No more database field names leaking into the UI
- No more dense institutional text blocks

### Interaction philosophy:

1. **Search first, browse second** — The page is not a directory. It's a concierge.
2. **One action per screen** — At any scroll position, only one thing demands attention.
3. **Never show broken promises** — If a feature doesn't work, it doesn't exist.
4. **Assume mobile, enhance for desktop** — Every decision starts at 375px.
5. **Phone call is the success metric** — Every card optimizes for the tel: link. Everything else is secondary.
6. **Privacy is not a feature — it's the baseline** — "Anonymous" and "no sign-in" are stated once, then assumed.
7. **AI is invisible infrastructure** — Like the database, the API, the hosting. It works. It doesn't need a label.
