# Tich Labs Incident Tracker - MCP Server

Model Context Protocol (MCP) server for Tich Labs SGBV incident tracking system. Exposes tools for AI-powered referral matching, FHIR R4 resource generation, and risk assessment.

## Tools

| Tool | Description |
|------|-------------|
| `match_services` | Match incidents to verified referral services using AI (OpenAI) or keyword-based matching |
| `generate_fhir_bundle` | Generate FHIR R4 transaction bundles from incidents (Observation, Patient, Consent, Location, ServiceRequest) |
| `assess_risk` | Assess risk severity of incidents (0-100 score, severity level, urgency, factors, actions) |

## Usage

### With Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "tichlabs-incident-tracker": {
      "command": "npx",
      "args": ["tsx", "/path/to/mcp-server/src/index.ts"],
      "env": {
        "VITE_SUPABASE_URL": "https://your-project.supabase.co",
        "VITE_SUPABASE_ANON_KEY": "your-anon-key",
        "OPENAI_API_KEY": "sk-your-key-here"
      }
    }
  }
}
```

### With MCP Inspector

```bash
cd mcp-server
VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=... npx @modelcontextprotocol/inspector tsx src/index.ts
```

### Direct (stdio)

```bash
cd mcp-server
VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=... npx tsx src/index.ts
```

## Environment Variables

- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anon/public key
- `OPENAI_API_KEY` - (Optional) OpenAI API key for AI-powered matching

Without OpenAI key, all tools use keyword-based matching as fallback.

## Examples

### match_services

```json
{
  "incidentType": "domestic_violence",
  "location": "Kakamega",
  "description": "Survivor was beaten by partner, needs shelter and medical attention",
  "survivorAgeGroup": "18_plus",
  "survivorGender": "female",
  "limit": 5
}
```

### generate_fhir_bundle

```json
{
  "incident": {
    "_id": "j973961gev1c4m1md8zfa0n1fs81v18z",
    "incidentType": "physical_abuse",
    "incidentDate": "2026-02-25",
    "location": "Kakamega",
    "description": "Survivor was beaten",
    "survivorAgeGroup": "18_plus",
    "survivorGender": "female"
  },
  "matchedServiceIds": ["svc-1", "svc-2"],
  "includeReferrals": true
}
```

### assess_risk

```json
{
  "incidentType": "sexual_abuse",
  "description": "Survivor was attacked at knifepoint",
  "survivorAgeGroup": "15_18",
  "survivorGender": "female",
  "isEscalated": true
}
```
