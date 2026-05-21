const MCP_SERVER_URL = import.meta.env.VITE_MCP_SERVER_URL ?? "";
const MCP_API_KEY = import.meta.env.VITE_MCP_API_KEY ?? "";

interface McpResponse<T> {
  result?: T;
  error?: { code: number; message: string };
}

async function mcpCall<T>(method: string, params: Record<string, unknown>): Promise<T> {
  if (!MCP_SERVER_URL || !MCP_API_KEY) {
    throw new Error("MCP not configured — set VITE_MCP_SERVER_URL and VITE_MCP_API_KEY");
  }
  const res = await fetch(MCP_SERVER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": MCP_API_KEY,
      Accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method,
      params,
    }),
  });

  const text = await res.text();
  const dataLine = text.split("\n").find((l) => l.startsWith("data: "));
  if (!dataLine) throw new Error("No data in MCP response");

  const parsed: McpResponse<T> = JSON.parse(dataLine.slice(6));
  if (parsed.error) throw new Error(parsed.error.message);
  return parsed.result!;
}

export interface ServiceMatch {
  serviceId: string;
  name: string;
  category: string;
  county: string;
  description: string;
  phone?: string;
  address?: string;
  relevanceScore: number;
  reasoning: string;
}

export interface MatchServicesResult {
  count: number;
  matches: ServiceMatch[];
}

export interface AssessRiskResult {
  riskScore: number;
  severity: string;
  urgency: string;
  factors: string[];
  recommendedActions: string[];
}

export async function matchServices(params: {
  incidentType: string;
  location: string;
  description?: string;
  survivorAgeGroup?: string;
  survivorGender?: string;
  limit?: number;
}): Promise<MatchServicesResult> {
  const raw = await mcpCall<{ content: { text: string }[] }>("tools/call", {
    name: "match_services",
    arguments: params,
  });
  return JSON.parse(raw.content[0].text);
}

export async function assessRisk(params: {
  incidentType: string;
  description: string;
  survivorAgeGroup?: string;
  survivorGender?: string;
  isEscalated?: boolean;
}): Promise<AssessRiskResult> {
  const raw = await mcpCall<{ content: { text: string }[] }>("tools/call", {
    name: "assess_risk",
    arguments: params,
  });
  return JSON.parse(raw.content[0].text);
}

export async function generateFhirBundle(params: {
  incidentId?: string;
  incident?: Record<string, unknown>;
  includeReferrals?: boolean;
  matchedServiceIds?: string[];
  fhirServerUrl?: string;
  fhirToken?: string;
  patientId?: string;
}): Promise<Record<string, unknown>> {
  const raw = await mcpCall<{ content: { text: string }[] }>("tools/call", {
    name: "generate_fhir_bundle",
    arguments: params,
  });
  return JSON.parse(raw.content[0].text);
}
