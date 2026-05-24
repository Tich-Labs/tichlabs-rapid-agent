import { assessRisk, type AssessRiskResult } from "@/lib/mcp-client";
import { setDocument } from "@/lib/firestore";

export async function runAutoRiskAssessment(
  incidentId: string,
  payload: {
    incidentType: string;
    description: string;
    location: string;
    survivorAgeGroup?: string;
    survivorGender?: string;
  }
): Promise<void> {
  try {
    const result = await withTimeout(
      assessRisk({
        incidentType: payload.incidentType,
        description: payload.description,
        survivorAgeGroup: payload.survivorAgeGroup,
        survivorGender: payload.survivorGender,
        isEscalated: false,
      }),
      15_000
    );

    await setDocument("incidents", incidentId, {
      risk_score: result.riskScore,
      severity: normalizeSeverity(result.severity),
      urgency: normalizeUrgency(result.urgency),
      risk_factors: result.factors,
      recommended_actions: result.recommendedActions,
      ai_assessed_at: new Date().toISOString(),
      ai_status: "assessed",
    });
  } catch (err) {
    console.error("[autoRiskAssessment] MCP call failed:", err);
    try {
      await setDocument("incidents", incidentId, {
        ai_status: "failed",
      });
    } catch (patchErr) {
      console.error("[autoRiskAssessment] Failed to patch ai_status:", patchErr);
    }
  }
}

function normalizeSeverity(severity: string): "low" | "medium" | "high" | "critical" {
  const s = severity.toLowerCase();
  if (s.includes("critical")) return "critical";
  if (s.includes("high")) return "high";
  if (s.includes("medium") || s.includes("moderate")) return "medium";
  return "low";
}

function normalizeUrgency(urgency: string): "routine" | "urgent" | "emergency" {
  const u = urgency.toLowerCase();
  if (u.includes("emergency") || u.includes("immediate")) return "emergency";
  if (u.includes("urgent") || u.includes("high")) return "urgent";
  return "routine";
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("MCP timeout")), ms);
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
}
