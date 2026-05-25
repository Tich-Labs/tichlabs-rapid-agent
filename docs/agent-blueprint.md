# Agent Builder Integration — Implementation Blueprint

## What We Are Building

A **conversational caseworker assistant** powered by Gemini. Instead of navigating forms and dropdowns, a caseworker describes a situation in plain language and the agent reasons through it — assessing risk, matching services, documenting, and guiding — all in a chat interface alongside the existing PWA.

---

## Architecture Overview

```
Caseworker types message
         │
         ▼
   ┌─────────────────┐
   │   Chat UI        │  WhatsApp-style interface, single text input
   │   (React)        │  Embedded in authenticated AppLayout
   └────────┬────────┘
            │
            ▼
   ┌─────────────────┐
   │ Agent Orchestrator│  Sends user message + conversation history
   │ (Gemini 2.5)     │  to Gemini. Gemini decides which MCP tools
   │ in-browser        │  to call, in what order, with what params.
   └────────┬────────┘
            │
     ┌──────┴──────┬──────────┬──────────┐
     ▼             ▼          ▼          ▼
┌─────────┐ ┌─────────┐ ┌────────┐ ┌───────────┐
│assess   │ │match    │ │generate│ │store/search│
│_risk    │ │_services│ │_fhir   │ │_aggregate  │
└─────────┘ └─────────┘ └────────┘ └───────────┘
     │             │          │          │
     └─────────────┴──────────┴──────────┘
                    │
                    ▼
           Structured response
           (risk score + service cards + FHIR + actions)
                    │
                    ▼
           Chat bubbles render results
           Caseworker approves or refines
```

### Where Agent Builder fits

The `agent-builder.json` deploys the SAME orchestrator logic to Google Cloud Agent Builder, making it accessible via a managed API endpoint. This means:
- **In-app**: The chat UI calls the orchestrator directly (browser-side Gemini calls)
- **Cloud**: Agent Builder hosts the same agent for external API access, A2A protocol, and enterprise integration
- **Both use the same MCP server, same tools, same system prompt**

---

## User Impact — Before vs After

### Scenario: A volunteer in rural Vihiga receives a report

**Today (PWA forms):**
```
1. Volunteer opens app → navigates to "Log Incident"
2. Fills 5-step wizard: incident type, description, location, age group, gender
3. Submits → system auto-runs risk assessment
4. Navigates to incident detail → clicks "Find Services"
5. Opens floating AI assistant → selects "Match Services" tab
6. Has to re-enter incident type, location, description
7. Clicks "Find Services" → waits → reads results
8. Manually notes which services to recommend
9. Returns to incident → adds notes manually

Time: 8-12 minutes. Training required: 1-2 hours.
Volunteer must know: incident types, workflow stages, navigation, tool tabs.
```

**After (Agent chat):**
```
1. Volunteer types: "A 14-year-old girl from Hamisi says her uncle
   has been touching her. She's scared to go home. What do I do?"
2. Agent reads the message → plans: assess risk, match services,
   generate FHIR, store case
3. Agent responds:
   ┌─────────────────────────────────────────────┐
   │ 🔍 I've assessed this situation.             │
   │                                              │
   │ Risk Score: 72/100 · High Severity · Urgent  │
   │ Factors: child survivor, family perpetrator, │
   │ unsafe home environment                      │
   │                                              │
   │ Recommended actions:                         │
   │ • Immediate police report (mandatory — child)│
   │ • Medical exam at Vihiga County Hospital     │
   │ • Emergency safe shelter placement           │
   │                                              │
   │ ⚠️ This involves a minor. Mandatory reporting│
   │ to the Children's Officer is required.       │
   └─────────────────────────────────────────────┘
   ┌─────────────────────────────────────────────┐
   │ 📍 Matched 5 services near Hamisi, Vihiga:   │
   │                                              │
   │ ▎Vihiga County Referral Hospital · Free 24/7 │
   │   Clinical management, HIV PEP, forensic     │
   │   [Call 0710 000 009]                        │
   │                                              │
   │ ▎Hamisi Police Station                       │
   │   Record case, P3 form, investigations       │
   │   [Call 0710 000 030]                        │
   │                                              │
   │ ▎Vihiga Safe Space · Free 24/7               │
   │   Drop-in center and temporary shelter       │
   │   [Call 0710 000 020]                        │
   └─────────────────────────────────────────────┘
   ┌─────────────────────────────────────────────┐
   │ 📋 FHIR bundle generated for EHR submission  │
   │ 📁 Case stored in MongoDB for future ref     │
   │                                              │
   │ Would you like me to show similar cases      │
   │ from Vihiga to see what actions helped?      │
   └─────────────────────────────────────────────┘

4. Volunteer: "Yes, show similar cases"
5. Agent: searches MongoDB, returns patterns

Time: 30-60 seconds. Training required: zero.
Volunteer only needs: ability to describe a situation in Swahili.
```

---

## How This Improves Service Delivery

### 1. Speed — from 12 minutes to 30 seconds

| Metric | Forms (today) | Agent chat |
|--------|--------------|------------|
| Time to risk assessment | 3-5 min | 5 sec |
| Time to service match | 5-7 min | 10 sec |
| Time to documentation | 2-3 min | Auto |
| Total cycle | 8-12 min | 30-60 sec |

A single caseworker can handle **20x more cases** in the same time.

### 2. Accessibility — removes training barrier

| Requirement | Forms | Agent chat |
|-------------|-------|------------|
| Must know incident classification | Yes | No — agent maps natural language |
| Must know 7-stage workflow | Yes | No — agent orchestrates automatically |
| Must know which tool to use when | Yes | No — agent decides |
| Must understand FHIR | Yes | No — agent handles it |
| Must navigate UI | Yes | Single text input |

Rural volunteers with **minimal digital literacy** can provide expert-level support. This is the single biggest service delivery unlock.

### 3. Coverage — Swahili + Sheng support

A caseworker types in Swahili: *"Mtoto wa miaka 14 amebakwa na jirani. Anahitaji msaada."*

The agent:
1. Understands the message in Swahili
2. Maps "amebakwa" → incident type `sexual_abuse`
3. Maps "miaka 14" → age group `10_14`
4. Matches services in the relevant county
5. Responds in Swahili with Swahili service descriptions

Today's PWA has UI translations but cannot process unstructured language. The agent bridges the gap between how people speak and how the system works.

### 4. Consistency — every case gets expert-level attention

A trained counselor might assess risk differently than a new volunteer. The agent applies the **same reasoning framework** to every case:
- Always checks for child protection triggers
- Always considers perpetrator relationship
- Always evaluates home environment safety
- Always applies trauma-informed language

This eliminates variance in care quality across caseworkers.

---

## How This Improves Trauma-Informed Response

### 1. The agent acts as a real-time trauma-informed coach

When a caseworker describes a situation, the agent doesn't just run tools — it provides guidance:

```
User: "She keeps saying it was her fault."

Agent: "This is very common among survivors. When speaking with her:
       • Avoid any language that suggests blame
       • Say: 'What happened is not your fault. The person who hurt you is responsible.'
       • Let her control the pace — don't push for details
       • If she becomes distressed, pause and ask: 'Would you like to take a break?'

       These approaches are grounded in WHO Psychological First Aid guidelines."
```

This is **grounding** — the agent cites actual protocols, giving caseworkers confidence that they're following best practices.

### 2. Dynamic tool selection reduces re-traumatization

The agent decides which tools to call based on context. For neglect cases, it skips police matching. For domestic violence, it prioritizes shelter over legal. This means:
- Survivors aren't asked to repeat their story for each tool
- The agent handles the full pipeline without the caseworker clicking through tabs
- Fewer form fields = less cognitive load = less stress for the survivor

### 3. Anonymous-first by design

The agent's system prompt enforces privacy:
- Never requests PII (names, addresses, ID numbers)
- Works with anonymized fields only
- Reminds caseworkers: "The Tich Labs system is designed for anonymous reporting. Do not record the survivor's name."

### 4. Safety guardrails built in

The agent recognizes danger signals and escalates appropriately:

```
User: "Her husband has a weapon and knows where she's hiding."

Agent: "⚠️ This is a life-threatening situation. Immediate actions:
       1. Call 999 (police) right now
       2. Call 1195 (GBV helpline) for emergency shelter coordination
       3. Do NOT attempt to confront the perpetrator
       4. If the survivor is with you, move to a safe public location

       After ensuring immediate safety, I'll help with medical and shelter services."
```

---

## Implementation Details

### File: `frontend/src/lib/agent-orchestrator.ts`

This is the core — it sends messages to Gemini and receives structured instructions:

```ts
interface AgentAction {
  tool: "assess_risk" | "match_services" | "generate_fhir_bundle" | "store_case_document" | "search_case_documents" | "respond";
  params: Record<string, unknown>;
}

async function processMessage(message: string, history: Message[]): Promise<AgentResponse> {
  // 1. Send to Gemini with system prompt + tool definitions
  // 2. Gemini returns a plan: "I need to call assess_risk first, then match_services"
  // 3. Execute each tool in sequence
  // 4. Collect results
  // 5. Send results back to Gemini for final formatting
  // 6. Return formatted response with embedded actions
}
```

### File: `frontend/src/components/agent/AgentChat.tsx`

Single text input, chat bubbles, tool execution indicators. No tabs, no dropdowns, no manual tool selection.

```tsx
function AgentChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  async function send() {
    // Add user message
    // Call orchestrator
    // Show "thinking" indicator
    // Render tool execution steps as they happen
    // Render final response
  }

  return (
    <div className="flex flex-col h-full">
      <MessageList messages={messages} isThinking={isThinking} />
      <ChatInput value={input} onChange={setInput} onSend={send} />
    </div>
  );
}
```

### File: `frontend/src/pages/agent/page.tsx`

Full-page chat at `/:lng/agent` in the authenticated layout.

### File: `agent-builder.json` (update)

Add data store references for grounding:

```json
"grounding": {
  "sources": [
    {
      "type": "data_store",
      "description": "GBV referral pathways — NCCG Directory Nov 2023, Kakamega/Vihiga verified services",
      "files": ["docs/GBV REFERRAL PATHWAY.docx"]
    },
    {
      "type": "data_store",
      "description": "WHO Psychological First Aid guidelines, Kenyan SGBV Act provisions",
      "files": ["docs/AI Concept Paper.pdf"]
    }
  ]
}
```

---

## What Changes and What Stays

| Component | Change |
|-----------|--------|
| MCP server (6 tools) | No change — already working |
| `mcp-client.ts` | No change |
| Firestore (176 services) | No change |
| `ai-assistant.tsx` (floating sheet) | **Replaced** — chat interface replaces manual forms |
| Incident reporting wizard | No change — structured form still needed for anonymous survivors |
| Dashboard, reports, users | No change |
| New: `/agent` route | Added to sidebar as "AI Assistant" |
| New: `agent-orchestrator.ts` | Gemini-powered tool selection |
| New: `AgentChat.tsx` | Chat UI component |
| `agent-builder.json` | Updated with data store references |

### The PWA is NOT replaced

The existing incident reporting wizard, dashboard, referral directory, and admin pages stay exactly as they are. The agent chat is a NEW entry point alongside them — not a replacement. Caseworkers choose:
- **Structured form** for simple cases where they know the workflow
- **Agent chat** for complex cases where they need reasoning, guidance, or don't know what to do next

---

## Deployment Path

### Phase 1 — In-app (what we build now)

Gemini calls happen browser-side (or via a thin proxy through the MCP server). No Agent Builder deployment needed for the in-app experience. The chat UI calls Gemini directly using the same API key the MCP server uses.

### Phase 2 — Cloud Agent Builder (for hackathon compliance)

Deploy `agent-builder.json` to Google Cloud Agent Builder. This creates a managed endpoint that:
- External systems can call via A2A protocol
- Provides enterprise auth and monitoring
- Handles grounding via data stores
- Can be embedded as a chat widget on other websites

The in-app chat UI can optionally route through the Agent Builder endpoint instead of calling Gemini directly — this is a configuration change, not a code change.

### Phase 3 — Production

Both paths co-exist:
- In-app chat for authenticated caseworkers (direct Gemini calls, faster)
- Agent Builder endpoint for external API access, A2A, and embedding

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Time from case report to service recommendation | < 60 seconds |
| Caseworker training time | Zero (describe situation in natural language) |
| Language coverage | English + Swahili with Sheng understanding |
| Tool execution accuracy | Gemini correctly selects appropriate tools 90%+ |
| Trauma-informed language compliance | Agent responses pass review for blame-free, supportive language |
| Hackathon compliance | Agent uses MCP tools + MongoDB partner integration + multi-step execution |
