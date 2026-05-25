import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { cn } from "@/lib/utils.ts";
import { exportFHIRBundle } from "@/lib/fhir.ts";
import {
  Sparkles,
  Heart,
  Shield,
  Home,
  Brain,
  Scale,
  Phone,
  MapPin,
  CheckCircle2,
  XCircle,
  Download,
  FileJson,
  AlertTriangle,
  Info,
} from "lucide-react";

interface ServiceMatch {
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

const CATEGORY_CONFIG: Record<string, { icon: React.ElementType; color: string }> = {
  health: { icon: Heart, color: "bg-red-100 text-red-700" },
  police: { icon: Shield, color: "bg-blue-100 text-blue-700" },
  shelter: { icon: Home, color: "bg-amber-100 text-amber-700" },
  psychosocial: { icon: Brain, color: "bg-purple-100 text-purple-700" },
  legal: { icon: Scale, color: "bg-green-100 text-green-700" },
};

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

function matchServices(
  incidentType: string,
  location: string,
  description: string,
  services: Record<string, unknown>[]
): ServiceMatch[] {
  const scored = services
    .filter((s) => s.isActive !== false)
    .map((svc) => {
      let score = 0;

      const svcCounty = String(svc.county ?? "").toLowerCase();
      const loc = location.toLowerCase();
      const isKakamega = loc.includes("kakamega") || loc.includes("kakam") || loc.includes("kikam");
      const isVihiga = loc.includes("vihiga");

      if (svcCounty === "kakamega" && isKakamega) score += 50;
      else if (svcCounty === "vihiga" && isVihiga) score += 50;
      else if (svcCounty === "kakamega" && isVihiga) score -= 30;
      else if (svcCounty === "vihiga" && isKakamega) score -= 30;
      else if (loc.includes("nairobi")) score += 10;

      const recommendedCategories = INCIDENT_TYPE_CATEGORY_MAP[incidentType] ?? [];
      if (recommendedCategories.includes(String(svc.category))) score += 25;
      if (svc.category === "health" && ["physical_abuse", "sexual_abuse"].includes(incidentType)) score += 5;
      if (svc.category === "psychosocial" && ["emotional_abuse", "sexual_abuse"].includes(incidentType)) score += 5;
      if (svc.category === "shelter" && ["domestic_violence", "neglect"].includes(incidentType)) score += 5;

      const svcDesc = String(svc.description ?? "").toLowerCase();
      const desc = description.toLowerCase();

      if (desc.includes("rape") && svcDesc.includes("sexual")) score += 10;
      if (desc.includes("child") && svcDesc.includes("child")) score += 10;
      if (desc.includes("beat") && svcDesc.includes("injury")) score += 5;

      score = Math.min(score, 100);

      return {
        serviceId: String(svc._id ?? svc.id ?? ""),
        name: String(svc.name ?? ""),
        category: String(svc.category ?? ""),
        county: String(svc.county ?? ""),
        description: String(svc.description ?? ""),
        phone: String(svc.phone ?? ""),
        address: String(svc.address ?? ""),
        relevanceScore: score,
        reasoning: recommendedCategories.includes(String(svc.category))
          ? `Category "${svc.category}" is recommended for ${incidentType.replace(/_/g, " ")}`
          : "Available service in your area",
      };
    });

  scored.sort((a, b) => b.relevanceScore - a.relevanceScore);
  return scored.slice(0, 5);
}

interface AIRecommendationsProps {
  incident: Record<string, unknown>;
  services: Record<string, unknown>[];
  userRole: string;
}

function getScoreColor(score: number): string {
  if (score >= 60) return "text-green-600";
  if (score >= 30) return "text-amber-600";
  return "text-muted-foreground";
}

function getScoreBg(score: number): string {
  if (score >= 60) return "bg-green-100";
  if (score >= 30) return "bg-amber-100";
  return "bg-muted";
}

export default function AIRecommendations({ incident, services, userRole }: AIRecommendationsProps) {
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());
  const [rejectedIds, setRejectedIds] = useState<Set<string>>(new Set());
  const [showFHIR, setShowFHIR] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const matches = useMemo(() => {
    return matchServices(
      String(incident.incidentType ?? ""),
      String(incident.location ?? ""),
      String(incident.description ?? ""),
      services
    );
  }, [incident, services]);

  const handleApprove = (id: string) => {
    setApprovedIds((prev) => new Set(prev).add(id));
    setRejectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleReject = (id: string) => {
    setRejectedIds((prev) => new Set(prev).add(id));
    setApprovedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const approvedServices = matches.filter((m) => approvedIds.has(m.serviceId));
  const fhirJson = useMemo(() => {
    if (approvedServices.length === 0) return "";
    return exportFHIRBundle(incident, approvedServices as unknown as Record<string, unknown>[]);
  }, [approvedServices, incident]);

  const canReview = ["counselor", "program_lead", "executive_director"].includes(userRole);

  if (matches.length === 0) return null;

  const visibleMatches = showAll ? matches : matches.slice(0, 3);

  return (
    <div className="w-full px-4 mb-5">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          AI Referral Recommendations
        </h2>
        <Badge variant="secondary" className="text-sm ml-auto">
          {matches.length} matches
        </Badge>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="divide-y divide-border">
          {visibleMatches.map((match) => {
            const catConfig = CATEGORY_CONFIG[match.category];
            const CatIcon = catConfig?.icon ?? Info;
            const isApproved = approvedIds.has(match.serviceId);
            const isRejected = rejectedIds.has(match.serviceId);

            return (
              <div
                key={match.serviceId}
                className={cn(
                  "p-4 transition-colors",
                  isApproved && "bg-green-50/50",
                  isRejected && "opacity-50"
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                      catConfig?.color ?? "bg-muted"
                    )}
                  >
                    {CatIcon && <CatIcon className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate">{match.name}</p>
                      <Badge variant="secondary" className="text-sm capitalize flex-shrink-0">
                        {match.county}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                      {match.description}
                    </p>

                    <div className="flex items-center gap-3 mt-1.5">
                      {match.phone && (
                        <a
                          href={`tel:${match.phone.replace(/\s/g, "")}`}
                          className="flex items-center gap-1 text-sm text-primary font-medium hover:underline"
                        >
                          <Phone className="h-3 w-3" />
                          {match.phone}
                        </a>
                      )}
                      {match.address && (
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {match.address}
                        </span>
                      )}
                    </div>

                    {/* Match score */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className={cn("text-sm font-bold px-1.5 py-0.5 rounded", getScoreBg(match.relevanceScore), getScoreColor(match.relevanceScore))}>
                        {match.relevanceScore}% match
                      </div>
                      <p className="text-sm text-muted-foreground">{match.reasoning}</p>
                    </div>

                    {/* Approval actions */}
                    {canReview && !isRejected && (
                      <div className="flex items-center gap-2 mt-2">
                        {!isApproved ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-sm gap-1 text-green-600 hover:text-green-700 hover:bg-green-50 cursor-pointer"
                            onClick={() => handleApprove(match.serviceId)}
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Approve Referral
                          </Button>
                        ) : (
                          <Badge variant="secondary" className="text-sm bg-green-100 text-green-700">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Approved
                          </Badge>
                        )}
                        {!isApproved && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-sm gap-1 text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                            onClick={() => handleReject(match.serviceId)}
                          >
                            <XCircle className="h-3 w-3" />
                            Skip
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Show more / less */}
        {matches.length > 3 && (
          <div className="px-4 py-2 border-t border-border">
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-sm text-primary font-medium hover:underline cursor-pointer"
            >
              {showAll ? "Show fewer" : `Show ${matches.length - 3} more matches`}
            </button>
          </div>
        )}

        {/* FHIR Export */}
        {approvedServices.length > 0 && (
          <div className="border-t border-border p-4 bg-muted/30">
            <button
              onClick={() => setShowFHIR(!showFHIR)}
              className="flex items-center gap-2 text-sm font-medium text-primary mb-2 cursor-pointer"
            >
              <FileJson className="h-3.5 w-3.5" />
              {showFHIR ? "Hide" : "View"} FHIR R4 Bundle ({approvedServices.length} approved referrals)
            </button>

            {showFHIR && (
              <div className="space-y-2">
                <div className="bg-background rounded-lg border border-border p-3 max-h-60 overflow-auto">
                  <pre className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap break-all">
                    {fhirJson}
                  </pre>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  className="text-sm cursor-pointer"
                  onClick={() => {
                    const blob = new Blob([fhirJson], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `fhir-bundle-${String(incident._id ?? incident.id ?? "").slice(-8)}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download FHIR Bundle
                </Button>
              </div>
            )}
          </div>
        )}


      </div>
    </div>
  );
}
