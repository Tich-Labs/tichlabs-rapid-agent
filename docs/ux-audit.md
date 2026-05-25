# Referral Page — UX Audit & Redesign Proposal

**Page**: `frontend/src/pages/referral/page.tsx`
**Audience**: GBV survivors and their supporters — often distressed, on mobile, seeking urgent help
**Services**: 176 verified providers across Nairobi, Kakamega, Vihiga

---

## Part 1: UX Critique

### 1.1 Visual Hierarchy Failure

The page has **seven distinct elements** stacked vertically on mobile before a single service card appears:

1. Header (title + count badge + back arrow)
2. Emergency banner (red — highest visual salience)
3. Pathway banner (teal callout — second highest)
4. Sticky search bar + Filters button + disabled "Near me"
5. Gemini AI label (conditional)
6. Results count bar ("176 services · 14 free helplines")
7. Card grid

**Problem**: Each element has equal visual weight. The emergency banner and pathway banner fight for attention. The search input, filters, and results count all contribute to what feels like a **dashboard control panel** rather than a supportive experience. The user asks: "What do I do first?"

### 1.2 Filter Overload

- **Desktop**: 10 pills on two rows (County: 3 + Type: 7). Labels "County:" and "Type:" are database terminology, not human language.
- **Mobile bottom sheet**: 10 pills plus "All Counties"/"All Types" (12 buttons total). These redundant toggles add noise — clicking an active pill already deselects it.
- **Category pills** use cryptic abbreviations (Health, Police, Shelter, Counselling, Legal, Hotlines, Economic) that may not map to how someone in distress thinks about their needs.
- **Visual distinction**: Selected vs unselected pills differ only by filled bg — on a phone in bright sunlight, this is hard to distinguish.

### 1.3 Broken Trust: Disabled "Near Me"

A disabled button with "Coming soon — location-based search" on hover breaks trust. A person seeking shelter in an unfamiliar area sees a button that looks like it *should* work but doesn't. Either hide it entirely or ship a working version.

### 1.4 Institutional Tone

- **Header**: "GBV Referral Services" — clinical, institutional. A person experiencing violence doesn't search for "GBV referral." They search for "help near me," "safe place to stay," "someone to talk to."
- **Count badge**: "176" next to the title — what does this number mean to someone in crisis?
- **"Matched by Gemini 2.5"**: Developer-facing language. A survivor doesn't need to know the AI model version.
- **"Filter by county"**: Database column name as UI label.
- **"Filter by service type"**: Same problem.
- **Card category badges**: "Health" vs "Medical care," "Psychosocial" vs "Counselling and support," "Economic" vs "Livelihood support."

### 1.5 Mobile UX Weaknesses

- The sticky filter bar at `top-12` pushes content off-screen on small devices (iPhone SE = 320px height).
- The bottom sheet header "Filters" is generic.
- No quick-pick category buttons on mobile — user must open bottom sheet, scroll, pick, close.
- No "swipe to dismiss" on bottom sheet.
- Long service descriptions expand cards unevenly — no consistent card height in the grid.

### 1.6 Card Design Issues

- County name and category badge both appear — redundancy.
- Call button is good but the teal color for paid calls vs green for free is subtle.
- No visual differentiation between a police station and a counselling centre at a glance — rely on small colored pill to distinguish.
- `_aiMatch?.reasoning` shows raw AI output text — stiff, mechanical.

### 1.7 Missing Emotional Safety Cues

- No reassuring preamble like "You're not alone. These services are here to help."
- No safety reminder (the Quick Exit button is a separate global component, not contextualized here).
- No indication that browsing is anonymous / no login needed.
- The emergency banner could be more actionable — it just lists numbers, not what to expect when you call.

---

## Part 2: Redesigned UI Proposal

### 2.1 Core Principles

1. **Search-first, not filter-first** — Most people will type what they need rather than navigate taxonomy.
2. **One decision at a time** — Never show 10 filter chips simultaneously. Progressive disclosure.
3. **Human language, not database schema** — No "county," "type," "category" in labels.
4. **Reassurance baked in** — Every section answers an unspoken fear: "Is this safe? Is this private? Will I be judged?"
5. **Mobile thumb zone** — Primary actions (search, call) in the lower half of the screen.

### 2.2 New Visual Hierarchy

```
┌─────────────────────────────────────┐
│ FIND HELP    [back]        176 near you │  ← Softer, human title
├─────────────────────────────────────┤
│ 🔴 In immediate danger? Call 999    │  ← Emergency — highest priority
│    or GBV helpline 1195. Free, 24/7 │
├─────────────────────────────────────┤
│                                     │
│   ┌─────────────────────────────┐   │
│   │ 🔍 What kind of help        │   │  ← Primary action: SEARCH
│   │   do you need?              │   │     Full width, prominent
│   └─────────────────────────────┘   │
│                                     │
│   Quick picks:                       │  ← Secondary: 3-4 quick-tap
│   [🏥 Medical] [🏠 Shelter] [💜 Counselling] [📞 Hotlines]
│                                     │
│   ── or browse by area ──           │  ← Tertiary: county picker
│   [Nairobi] [Kakamega] [Vihiga]     │     Subtle, below quick picks
│                                     │
├─────────────────────────────────────┤
│  14 free helplines · 176 services   │  ← Low-key summary
│  available near you                 │
├─────────────────────────────────────┤
│  ┌───────┐ ┌───────┐ ┌───────┐     │
│  │ Card  │ │ Card  │ │ Card  │     │  ← Grid: primary content
│  │       │ │       │ │       │     │
│  └───────┘ └───────┘ └───────┘     │
└─────────────────────────────────────┘
```

### 2.3 Redesigned Components

#### Emergency banner (redesigned)
- Larger, more actionable
- Two prominent tappable buttons: "Call Police 999" and "Call GBV Helpline 1195"
- Subtext: "Free, 24/7, no questions asked"
- Collapsed by default with pulse animation to draw attention without overwhelming

#### Search (redesigned)
- Primary element on the page. Largest input.
- Placeholder: "What kind of help do you need?" — warm, open-ended
- Supporting text below: "For example: medical care, safe place to stay, counselling"
- Optional: voice input button (mic icon) for users who can't type safely
- AI loading: subtle shimmer on the input border instead of a spinner

#### Quick picks (new)
- Replaces the 7-category pill grid
- Shows 4 most common needs as large tappable cards with icon + label
- Categories not shown are accessible via search or a "More options" link
- Each pick has a color-coded left border (not a full pill) — subtle emotional coding

```
┌──────────────────────────┐  ┌──────────────────────────┐
│ 🏥  Medical care         │  │ 🏠  Safe shelter          │
│     Hospitals, clinics,  │  │     Emergency housing,    │
│     treatment            │  │     rescue centres        │
└──────────────────────────┘  └──────────────────────────┘
┌──────────────────────────┐  ┌──────────────────────────┐
│ 💜  Counselling          │  │ 📞  Hotlines              │
│     Emotional support,   │  │     Free crisis lines,    │
│     trauma care          │  │     24/7 support           │
└──────────────────────────┘  └──────────────────────────┘
         [+ More options]
```

#### County selector (redesigned)
- Simplified to 3 buttons, no label needed
- Default: "All areas" (shows all)
- Title could be "Near" with MapPin icon next to each option
- Removed from bottom sheet — always visible as a subtle row

#### "Near me" (redesigned)
- Remove the disabled ghost button.
- Add a subtle text link: 🔍 "Use my location to find services near me"
- If geolocation fails or is denied, the link disappears silently. No error state.

#### Service card (redesigned)
- Left color bar (4px) instead of category pill — faster visual scan, less noise
- Call button: larger, 48px minimum tap target
- County name: removed from card entirely (county filter already scoped results)
- Category: small muted text below org name, no badge
- AI relevance: replace "/100" score with human phrase:
  - 90-100: "Highly relevant"
  - 70-89: "Good match"
  - 50-69: "Related service"
  - <50: hidden
- Reasoning: hide by default, show on tap with "Why this recommendation?"

### 2.4 Microcopy Improvements

| Current | Proposed | Why |
|---------|----------|-----|
| "GBV Referral Services" | "Find Help" | Warmer, action-oriented |
| "Filter by county" | (removed) | Contextual: "Nairobi" vs "All areas" |
| "Filter by service type" | "I need..." | First-person, empowering |
| "Matched by Gemini 2.5" | "AI-assisted matches for your situation" | Human, not version number |
| "176 services" | "176 services near you" | Contextual, reassuring |
| "No services found" | "No matching services. Try a broader search or browse all." | Helpful, not dead-end |
| "Call 0700 000 001" | "Call now — 0700 000 001" | Urgency + information |
| "Free Call" | "Free · Available 24/7" | More information |

### 2.5 Interaction Flows

#### Flow 1: Distressed person seeking medical help
```
1. Opens page → sees "Find Help" + emergency banner
2. Emergency banner: "Not an emergency right now"
3. Search: Types "hurt" → AI matches → shows medical + counselling + police
4. FIRST card: Kakamega County Referral Hospital with "Highly relevant"
5. Taps "Call now" → phone dialer opens
```

#### Flow 2: Person looking for shelter
```
1. Opens page
2. Taps "Safe shelter" quick pick → filters to shelter services in all areas
3. Taps "Nairobi" county → filters further
4. Scrolls 3 cards → finds Kayole Safe Shelter
5. Reads description, taps "Call now"
```

#### Flow 3: Volunteer browsing all services
```
1. Opens page
2. Sees search + quick picks
3. Taps "More options" → reveals full category list (legal, police, economic)
4. Selects "Police" → sees police stations
5. Taps between counties to compare
```

### 2.6 Accessibility Improvements

- **Focus ring**: All interactive elements need visible `focus-visible:ring-2` with 3:1 contrast ratio.
- **Tap targets**: Call buttons minimum 48×48px (current: ~36px, too small).
- **Color independence**: Category colors have text labels alongside — never color-only distinction.
- **Screen reader**: Each card announces: "[Org name], [category], [county]. Call: [phone number]. [description]"
- **Reduced motion**: Respect `prefers-reduced-motion` — remove pulse animation on emergency banner.
- **Font scaling**: Support up to 200% browser zoom without breaking layout.

### 2.7 Emotional Design Considerations

| Design element | Emotional impact | Implementation |
|---------------|-----------------|----------------|
| Soft rounded corners (12px+) | Safety, warmth | All cards, inputs, buttons |
| Warm neutral bg (not stark white) | Comfort | Use `bg-warm-50` or `bg-stone-50` |
| Generous whitespace | Breathing room, calm | `py-6` between sections, `gap-5` in grids |
| Reassuring microcopy | "You're not alone" | Pinned banner below header, dismissible |
| No red except emergency | Red = danger, not UI | Only emergency banner uses destructive colors |
| Loading states | "Finding services near you..." | Warm, human, not technical |
| Error states | "Something went wrong. Please try again or call 1195 for immediate help." | Always provide fallback |

### 2.8 Suggested Component States

**Quick pick cards:**
- Default: subtle bg, hover ring
- Selected: left color bar, slightly elevated shadow, check icon
- Focus: visible outline ring

**County pills:**
- Default: muted bg, subtle border
- Selected: filled bg with text color change
- Hover: darken 5%

**Call button:**
- Default: colored bg (teal/green), white text
- Hover: darken 10%
- Focus: visible outline
- Active/pressed: darken 15%
- Loading: subtle pulse (user navigated away to phone app)

**Search input:**
- Default: subtle border, light bg
- Focus: primary color ring, wider
- Active AI search: subtle shimmer animation on border
- Voice input: mic icon, pulse animation when listening

---

## Part 3: React + Tailwind Implementation Guide

### 3.1 New Component: `QuickPickCard.tsx`

```tsx
// components/referral/QuickPickCard.tsx
interface QuickPickCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  color: string;
  selected: boolean;
  onClick: () => void;
}

export function QuickPickCard({ icon: Icon, label, description, color, selected, onClick }: QuickPickCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-start gap-3 p-4 rounded-xl border text-left transition-all cursor-pointer",
        selected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border bg-card hover:border-primary/20 hover:bg-muted/30"
      )}
    >
      <div className={cn("w-1 self-stretch rounded-full flex-shrink-0", color)} />
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-muted-foreground" />
          <span className="font-semibold text-sm">{label}</span>
          {selected && <Check className="h-4 w-4 text-primary ml-auto" />}
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
      </div>
    </button>
  );
}
```

### 3.2 Revised Page Structure

```tsx
// page.tsx — key sections only
return (
  <div className="min-h-screen bg-stone-50">
    {/* Warm reassurance banner */}
    <div className="bg-primary/5 px-4 py-3 text-center text-sm text-muted-foreground">
      <span className="font-medium">You are not alone.</span>{" "}
      These services are confidential and free to contact. No sign-in required.
    </div>

    {/* Emergency — collapsible, prominent */}
    <EmergencyBanner />

    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Search — primary hero */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">What kind of help do you need?</h2>
        <SearchInput />  {/* larger, with voice, with suggestion chips below */}
      </div>

      {/* Quick picks — 4 touch-friendly cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {QUICK_PICKS.map(pick => (
          <QuickPickCard key={pick.id} {...pick} />
        ))}
      </div>
      <button className="text-sm text-primary hover:underline mb-6">
        + More options (Legal, Police, Economic support)
      </button>

      {/* County — subtle row */}
      <div className="flex items-center gap-2 mb-6">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Showing services in</span>
        {COUNTIES.map(c => <CountyPill key={c} />)}
      </div>

      {/* Results */}
      <ServiceGrid />
    </div>
  </div>
);
```

### 3.3 Quick Picks Data

```tsx
const QUICK_PICKS = [
  {
    id: "health",
    icon: Stethoscope, // warmer than Heart
    label: "Medical care",
    description: "Hospitals, clinics, treatment",
    color: "bg-teal-500",
  },
  {
    id: "shelter",
    icon: Home,
    label: "Safe shelter",
    description: "Emergency housing, rescue centres",
    color: "bg-amber-500",
  },
  {
    id: "psychosocial",
    icon: Heart, // heart = counselling, warmer than Brain
    label: "Counselling",
    description: "Emotional support, trauma care",
    color: "bg-purple-500",
  },
  {
    id: "hotline",
    icon: Phone,
    label: "Hotlines",
    description: "Free crisis lines, 24/7 support",
    color: "bg-red-500",
  },
];
```

### 3.4 Category → Human Language Map

```tsx
const CATEGORY_HUMAN: Record<string, string> = {
  health: "Medical care",
  police: "Police & reporting",
  shelter: "Safe shelter",
  psychosocial: "Counselling & support",
  legal: "Legal help",
  hotline: "Crisis hotlines",
  economic_empowerment: "Livelihood support",
};
```

### 3.5 AI Match → Human Phrase

```tsx
function aiLabel(score: number): string {
  if (score >= 90) return "Best match for your situation";
  if (score >= 70) return "Good match";
  if (score >= 50) return "Related service";
  return "";
}
```

### 3.6 Desktop Breakpoint Adjustments

At `md:` breakpoint:
- Quick picks: 4 columns in a single row (not 2×2)
- Search: centered, narrower (max-w-xl)
- County selector: right-aligned below search
- Card grid: 3 columns
- "More options" link: inline with quick picks, not below

### 3.7 Removed Elements

| Element | Reason |
|---------|--------|
| "All Counties" pill | Default state already shows all — redundant toggle |
| "All Types" pill | Same — click active pill to deselect |
| "Near me" disabled button | Broken trust — hide until working |
| "County:" / "Type:" labels | Replaced with natural language "Showing services in" |
| "Filter by county/service type" headers | Redundant with contextual labels |
| "Matched by Gemini 2.5" | Replaced with "AI-assisted matches" |
| Category pill badges on cards | Replaced with color bar + small text |
| County name on service cards | Redundant with county filter |
| `/100` score on AI matches | Replaced with human phrase |
| "GBV Referral Services" header | Replaced with "Find Help" |
| Count badge next to title | Moved to results summary line |

### 3.8 New Elements Added

| Element | Purpose |
|---------|---------|
| "You are not alone" reassurance banner | Emotional safety cue |
| Voice search button (optional, future) | Accessibility for users who can't type safely |
| Quick pick cards (4 prominent, rest collapsed) | Reduce cognitive load |
| Search suggestion chips ("try: medical care, safe shelter...") | Guide first-time users |
| Color bar on cards instead of pills | Visual scan speed |
| "Why this recommendation?" expandable | Transparency without clutter |
| Human-readable AI match labels | Trust + clarity |
| "Showing services in [counties]" | Natural language |

---

## Part 4: Implementation Priority

| Priority | Change | Effort | Impact |
|----------|--------|--------|--------|
| P0 | Remove "All Counties"/"All Types" from bottom sheet | Small | High |
| P0 | Replace "Matched by Gemini 2.5" with "AI-assisted matches" | Small | Medium |
| P0 | Replace category pill on cards with color left bar | Medium | High |
| P1 | Add "You are not alone" reassurance banner | Small | High |
| P1 | Quick pick cards replacing full pill grid on mobile | Large | High |
| P1 | Human-readable category labels (database → human) | Small | Medium |
| P1 | AI match scores → human phrases | Small | Medium |
| P2 | Emergency banner with tappable phone buttons | Medium | Medium |
| P2 | Voice search input (mic icon, future) | Large | Low |
| P2 | "Why this recommendation?" expandable on cards | Medium | Low |
| P3 | Remove "Near me" disabled button entirely | Small | Low |
| P3 | `prefers-reduced-motion` support | Small | Low |
| P3 | Card consistent height via CSS grid `align-items: stretch` | Small | Medium |
