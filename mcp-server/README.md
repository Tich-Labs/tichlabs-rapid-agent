# Tich Labs Incident Tracker - MCP Server

Model Context Protocol (MCP) server for Tich Labs SGBV incident tracking system. Exposes tools for AI-powered referral matching, FHIR R4 resource generation, and risk assessment. Uses Firebase Firestore for data access.

## Tools

| Tool | Description |
|------|-------------|
| `match_services` | Match incidents to verified referral services using AI or keyword-based matching |
| `generate_fhir_bundle` | Generate FHIR R4 transaction bundles from incidents (Observation, Patient, Consent, Location, ServiceRequest) |
| `assess_risk` | Assess risk severity of incidents (0-100 score, severity level, urgency, factors, actions) |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Yes | Full JSON content of your Firebase service account key |
| `GEMINI_API_KEY` | No | Gemini API key for AI-powered matching (falls back to keyword) |
| `GEMINI_MODEL` | No | Gemini model (default: `gemini-2.5-flash`) |
| `MONGODB_URI` | No | MongoDB Atlas connection string for case storage/search |
| `MONGODB_DB_NAME` | No | MongoDB database name (default: `tichlabs_cases`) |
| `MCP_TRANSPORT` | No | Set to `http` for HTTP transport (default: stdio) |
| `MCP_API_KEY` | No | API key for HTTP transport authentication |
| `PORT` | No | Port for HTTP transport (default: `3001`) |

## Usage

### With Claude Desktop

```json
{
  "mcpServers": {
    "tichlabs-incident-tracker": {
      "command": "npx",
      "args": ["tsx", "/path/to/mcp-server/src/index.ts"],
      "env": {
        "FIREBASE_SERVICE_ACCOUNT_JSON": "{\"type\":\"service_account\",...}",
        "GEMINI_API_KEY": "your-key-here"
      }
    }
  }
}
```

### Direct (stdio)

```bash
cd mcp-server
FIREBASE_SERVICE_ACCOUNT_JSON='{...}' npx tsx src/index.ts
```

### HTTP (for cloud deployment)

```bash
cd mcp-server
MCP_TRANSPORT=http MCP_API_KEY=your-key FIREBASE_SERVICE_ACCOUNT_JSON='{...}' npx tsx src/index.ts
```

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
