import { z } from "zod";
import { getLLM, hasLLM, getLLMConfig } from "../lib/llm.js";

export const AssessRiskInput = z.object({
  incidentType: z.string().describe("Type of incident"),
  description: z.string().describe("Description of the incident"),
  survivorAgeGroup: z.string().optional().describe("Age group of survivor"),
  survivorGender: z.string().optional().describe("Gender of survivor"),
  isEscalated: z.boolean().optional().describe("Whether the incident has been escalated"),
});

export type AssessRiskInput = z.infer<typeof AssessRiskInput>;

export interface RiskAssessment {
  riskScore: number;
  severity: "low" | "medium" | "high" | "critical";
  urgency: "routine" | "urgent" | "emergency";
  factors: string[];
  recommendedActions: string[];
}

const SEVERITY_WEIGHTS: Record<string, number> = {
  sexual_abuse: 40,
  physical_abuse: 30,
  domestic_violence: 35,
  child_exploitation: 45,
  missing_child: 45,
  tech_enabled_abuse: 20,
  emotional_abuse: 15,
  bullying_harassment: 10,
  neglect: 25,
  child_labor: 30,
  substance_abuse: 15,
  other: 10,
};

function keywordRiskScore(description: string): number {
  const highRiskWords = [
    "kill", "murder", "death", "die", "weapon", "knife", "gun", "bleed",
    "unconscious", "hospital", "emergency", "critical", "severe", "broken",
    "fracture", "burn", "strangle", "suffocate", "rape", "sexual assault",
    "bleeding", "pregnant",
  ];
  const mediumRiskWords = [
    "threat", "fear", "afraid", "pain", "injury", "hit", "beat", "slap",
    "punch", "kick", "abuse", "force", "harass", "stalk", "follow",
    "homeless", "nowhere", "escape", "unsafe", "danger",
  ];

  let score = 0;
  const desc = description.toLowerCase();

  for (const word of highRiskWords) {
    if (desc.includes(word)) score += 5;
  }
  for (const word of mediumRiskWords) {
    if (desc.includes(word)) score += 2;
  }

  return Math.min(score, 40);
}

function getSeverity(score: number): RiskAssessment["severity"] {
  if (score >= 80) return "critical";
  if (score >= 55) return "high";
  if (score >= 30) return "medium";
  return "low";
}

function getUrgency(score: number): RiskAssessment["urgency"] {
  if (score >= 70) return "emergency";
  if (score >= 40) return "urgent";
  return "routine";
}

function getFactors(
  incidentType: string,
  description: string,
  survivorAgeGroup: string | undefined
): string[] {
  const factors: string[] = [];
  const desc = description.toLowerCase();

  if (SEVERITY_WEIGHTS[incidentType] && SEVERITY_WEIGHTS[incidentType] >= 30) {
    factors.push(`Incident type "${incidentType}" has high baseline severity`);
  }
  if (survivorAgeGroup === "under_10" || survivorAgeGroup === "10_14" || survivorAgeGroup === "15_18") {
    factors.push("Survivor is a minor — increased vulnerability");
  }
  if (desc.includes("pregnant")) factors.push("Survivor may be pregnant — requires immediate medical attention");
  if (desc.includes("weapon") || desc.includes("knife") || desc.includes("gun")) factors.push("Weapon involved — increased physical risk");
  if (desc.includes("bleed") || desc.includes("bleeding") || desc.includes("unconscious")) factors.push("Medical emergency signs present");
  if (desc.includes("child") || desc.includes("children") || desc.includes("kids")) factors.push("Children may be involved or present");

  return factors;
}

function getRecommendedActions(severity: RiskAssessment["severity"], incidentType: string): string[] {
  const actions: string[] = [];

  switch (severity) {
    case "critical":
      actions.push("IMMEDIATE: Contact emergency services (999/112)");
      actions.push("URGENT: Escalate to senior staff immediately");
      actions.push("Ensure survivor is in a safe location");
      break;
    case "high":
      actions.push("Escalate to program lead within 24 hours");
      actions.push("Contact relevant service providers immediately");
      break;
    case "medium":
      actions.push("Assign to counselor within 48 hours");
      actions.push("Schedule PFA session");
      break;
    case "low":
      actions.push("Log and monitor — routine follow-up");
      break;
  }

  const typeActions: Record<string, string[]> = {
    sexual_abuse: ["Refer for medical examination (HIV PEP within 72 hours)", "Refer to psychosocial counseling"],
    physical_abuse: ["Document injuries (photos if consented)", "Refer for medical treatment"],
    domestic_violence: ["Safety planning required", "Refer to shelter if needed"],
    child_exploitation: ["Mandatory reporting to children's officer", "Refer to child protection services"],
    missing_child: ["File police report immediately", "Alert community networks"],
  };

  const matched = typeActions[incidentType];
  if (matched) actions.push(...matched);

  return actions;
}

export async function assessRisk(input: AssessRiskInput): Promise<RiskAssessment> {
  const typeScore = SEVERITY_WEIGHTS[input.incidentType] ?? 10;
  const descScore = keywordRiskScore(input.description ?? "");
  const escalationBonus = input.isEscalated ? 15 : 0;

  const totalScore = Math.min(typeScore + descScore + escalationBonus, 100);

  const severity = getSeverity(totalScore);
  const urgency = getUrgency(totalScore);
  const factors = getFactors(input.incidentType, input.description ?? "", input.survivorAgeGroup);
  const recommendedActions = getRecommendedActions(severity, input.incidentType);

  return {
    riskScore: totalScore,
    severity,
    urgency,
    factors,
    recommendedActions,
  };
}

export async function assessRiskAI(input: AssessRiskInput): Promise<RiskAssessment> {
  const llm = getLLM();
  const llmConfig = getLLMConfig();
  if (!llm || !llmConfig) {
    return assessRisk(input);
  }

  const prompt = `You are a GBV risk assessment specialist. Assess the following incident:

Incident Type: ${input.incidentType}
Description: ${input.description}
Survivor Age Group: ${input.survivorAgeGroup ?? "Not specified"}
Survivor Gender: ${input.survivorGender ?? "Not specified"}
Escalated: ${input.isEscalated ? "Yes" : "No"}

Return a JSON object with:
- riskScore (0-100)
- severity ("low", "medium", "high", "critical")
- urgency ("routine", "urgent", "emergency")
- factors (array of strings explaining risk factors)
- recommendedActions (array of strings with actionable steps)`;

  const response = await llm.chat.completions.create({
    model: llmConfig.model,
    messages: [
      { role: "system", content: "You are a GBV risk assessment specialist. Return only valid JSON." },
      { role: "user", content: prompt },
    ],
    response_format: llmConfig.provider === "ollama" ? undefined : { type: "json_object" },
    temperature: 0.3,
  });

  const text = response.choices[0]?.message?.content ?? "{}";
  return JSON.parse(text) as RiskAssessment;
}

export async function assessRiskSmart(input: AssessRiskInput): Promise<RiskAssessment> {
  if (hasLLM()) {
    return assessRiskAI(input);
  }
  return assessRisk(input);
}
