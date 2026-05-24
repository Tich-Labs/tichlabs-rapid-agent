import { z } from "zod";
import { getLLM, hasLLM, getLLMConfig } from "../lib/llm.js";
import { getActiveServices, type ReferralService } from "../lib/firestore-admin.js";

export const MatchServicesInput = z.object({
  incidentType: z.string().describe("Type of incident (e.g. physical_abuse, sexual_abuse, emotional_abuse, neglect, domestic_violence)"),
  location: z.string().describe("Location of the incident (county or area)"),
  description: z.string().optional().describe("Description of the incident for context"),
  survivorAgeGroup: z.string().optional().describe("Age group of survivor (e.g. under_10, 10_14, 15_18, 18_plus)"),
  survivorGender: z.string().optional().describe("Gender of survivor (male, female, other, prefer_not_to_say)"),
  limit: z.number().optional().default(5).describe("Maximum number of recommendations"),
});

export type MatchServicesInput = z.infer<typeof MatchServicesInput>;

function resolveServiceId(svc: ReferralService): string {
  return ((svc as unknown) as Record<string, unknown>).id as string ?? svc._id;
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

function normalizeLocation(location: string): string {
  const loc = location.toLowerCase();
  if (loc.includes("kakamega")) return "kakamega";
  if (loc.includes("vihiga")) return "vihiga";
  if (loc.includes("nairobi")) return "nairobi";
  return loc;
}

function getIncidentTypeKeywords(type: string): string[] {
  const map: { types: string[]; keywords: string[] }[] = [
    { types: ["physical_abuse", "domestic_violence"], keywords: ["physical", "assault", "violence", "beaten", "hurt", "injury"] },
    { types: ["sexual_abuse"], keywords: ["sexual", "rape", "assault", "abuse", "harassment", "GBV"] },
    { types: ["emotional_abuse", "bullying_harassment"], keywords: ["emotional", "psychological", "mental", "counseling", "trauma", "harassment"] },
    { types: ["neglect"], keywords: ["neglect", "abandonment", "basic needs", "shelter", "care"] },
    { types: ["child_exploitation", "missing_child"], keywords: ["child", "minor", "exploitation", "missing", "rescue"] },
    { types: ["tech_enabled_abuse"], keywords: ["technology", "digital", "online", "cyber", "social media"] },
  ];
  for (const entry of map) {
    if (entry.types.includes(type)) return entry.keywords;
  }
  return ["support", "help", "assistance"];
}

const INCIDENT_TYPE_CATEGORY_MAP: Record<string, string[]> = {
  physical_abuse: ["health", "police"],
  sexual_abuse: ["health", "police", "psychosocial"],
  emotional_abuse: ["psychosocial", "health"],
  neglect: ["shelter", "health", "psychosocial"],
  bullying_harassment: ["psychosocial", "legal"],
  domestic_violence: ["shelter", "health", "police", "psychosocial", "legal"],
  child_exploitation: ["police", "psychosocial", "legal", "shelter"],
  missing_child: ["police", "shelter"],
  tech_enabled_abuse: ["legal", "psychosocial", "police"],
  other: ["health", "psychosocial", "police", "legal"],
};

function keywordMatchScore(
  service: ReferralService,
  incidentType: string,
  location: string,
  description: string
): number {
  let score = 0;

  const serviceLoc = service.county.toLowerCase();
  const incidentLoc = normalizeLocation(location);

  if (serviceLoc === incidentLoc) score += 30;
  if (incidentLoc === "nairobi") score += 10;

  const recommendedCategories = INCIDENT_TYPE_CATEGORY_MAP[incidentType] ?? [];
  if (recommendedCategories.includes(service.category)) {
    score += 25;
  }

  const desc = description.toLowerCase();
  const keywords = getIncidentTypeKeywords(incidentType);
  for (const kw of keywords) {
    if (desc.includes(kw)) score += 3;
  }

  const svcDesc = (service.description ?? "").toLowerCase();
  for (const kw of keywords) {
    if (svcDesc.includes(kw)) score += 2;
  }

  const svcName = service.name.toLowerCase();
  for (const kw of keywords) {
    if (svcName.includes(kw)) score += 1;
  }

  return Math.min(score, 100);
}

function buildReasoning(service: ReferralService, score: number, incidentType: string): string {
  const parts: string[] = [];
  const recommended = INCIDENT_TYPE_CATEGORY_MAP[incidentType] ?? [];
  if (recommended.includes(service.category)) {
    parts.push(`Category "${service.category}" is recommended for "${incidentType}" incidents`);
  }
  if (service.description) {
    parts.push(`Offers: ${service.description}`);
  }
  return parts.join(". ") || `Matched based on service category and location relevance (score: ${score}/100)`;
}

export async function matchServices(input: MatchServicesInput): Promise<ServiceMatch[]> {
  const services = await getActiveServices();
  if (services.length === 0) return [];

  const { incidentType, location, description, limit } = input;

  const scored = services.map((svc) => {
    const relevanceScore = keywordMatchScore(svc, incidentType, location ?? "", description ?? "");
    const reasoning = buildReasoning(svc, relevanceScore, incidentType);

    return {
      serviceId: resolveServiceId(svc),
      name: svc.name,
      category: svc.category,
      county: svc.county,
      description: svc.description ?? "",
      phone: svc.phone,
      address: svc.address,
      relevanceScore,
      reasoning,
    };
  });

  scored.sort((a, b) => b.relevanceScore - a.relevanceScore);
  return scored.slice(0, limit ?? 5);
}

export async function matchServicesAI(input: MatchServicesInput): Promise<ServiceMatch[]> {
  const llm = getLLM();
  const llmConfig = getLLMConfig();
  if (!llm || !llmConfig) {
    return matchServices(input);
  }

  const services = await getActiveServices();
  if (services.length === 0) return [];

  const servicesContext = services
    .map((s) => `- ${s.name} (${s.category}, ${s.county}): ${s.description ?? ""}`)
    .join("\n");

  const prompt = `You are a GBV referral matching specialist for Tich Labs.

Incident Details:
- Type: ${input.incidentType}
- Location: ${input.location}
- Description: ${input.description ?? "Not provided"}
- Survivor Age Group: ${input.survivorAgeGroup ?? "Not specified"}
- Survivor Gender: ${input.survivorGender ?? "Not specified"}

Available Services in Database:
${servicesContext}

Task: Match the incident to the most appropriate services. Consider:
1. Incident type to service category match (health, police, shelter, psychosocial, legal)
2. Location proximity
3. Service description relevance

Return a JSON array of matches with: serviceId, name, category, county, description, relevanceScore (0-100), and reasoning. Max ${input.limit ?? 5} results.`;

  const response = await llm.chat.completions.create({
    model: llmConfig.model,
    messages: [
      { role: "system", content: "You are a GBV referral matching specialist. Return only valid JSON arrays." },
      { role: "user", content: prompt },
    ],
    response_format: llmConfig.provider === "ollama" ? undefined : { type: "json_object" },
    temperature: 0.3,
  });

  const text = response.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(text);

  if (Array.isArray(parsed)) return parsed as ServiceMatch[];
  if (parsed.matches && Array.isArray(parsed.matches)) return parsed.matches as ServiceMatch[];
  if (parsed.recommendations && Array.isArray(parsed.recommendations)) return parsed.recommendations as ServiceMatch[];

  return matchServices(input);
}

export async function matchServicesSmart(input: MatchServicesInput): Promise<ServiceMatch[]> {
  if (hasLLM()) {
    return matchServicesAI(input);
  }
  return matchServices(input);
}
