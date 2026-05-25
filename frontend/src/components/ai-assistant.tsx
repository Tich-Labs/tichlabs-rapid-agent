import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Label } from "@/components/ui/label.tsx";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet.tsx";
import {
  Sparkles,
  Heart,
  Shield,
  Brain,
  Scale,
  Home,
  AlertTriangle,
  FileJson,
  MapPin,
  Phone,
  CheckCircle2,
  Loader2,
  Bot,
  X,
  Search,
  AlertCircle,
  Database,
} from "lucide-react";
import { cn } from "@/lib/utils.ts";
import {
  matchServices,
  assessRisk,
  generateFhirBundle,
  storeCaseDocument,
  type MatchServicesResult,
  type AssessRiskResult,
  type ServiceMatch,
} from "@/lib/mcp-client";
import { getDocument } from "@/lib/firestore";

type ActionType = "match" | "assess" | "fhir" | null;

interface LogEntry {
  id: string;
  action: string;
  result: string;
  timestamp: Date;
}

const INCIDENT_TYPES = [
  { value: "physical_abuse", label: "Physical Abuse" },
  { value: "sexual_abuse", label: "Sexual Abuse" },
  { value: "emotional_abuse", label: "Emotional Abuse" },
  { value: "neglect", label: "Neglect" },
  { value: "bullying_harassment", label: "Bullying / Harassment" },
  { value: "domestic_violence", label: "Domestic Violence" },
  { value: "child_exploitation", label: "Child Exploitation" },
  { value: "missing_child", label: "Missing Child" },
  { value: "tech_enabled_abuse", label: "Tech-Enabled Abuse" },
  { value: "other", label: "Other" },
];

const CATEGORY_CONFIG: Record<string, { icon: React.ElementType; color: string }> = {
  health: { icon: Heart, color: "bg-red-100 text-red-700" },
  police: { icon: Shield, color: "bg-blue-100 text-blue-700" },
  shelter: { icon: Home, color: "bg-amber-100 text-amber-700" },
  psychosocial: { icon: Brain, color: "bg-purple-100 text-purple-700" },
  legal: { icon: Scale, color: "bg-green-100 text-green-700" },
};

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

function ServiceCard({ match }: { match: ServiceMatch }) {
  const catConfig = CATEGORY_CONFIG[match.category];
  return (
    <div className="rounded-lg border border-border p-3 space-y-2">
      <div className="flex items-start gap-2">
        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0", catConfig?.color ?? "bg-muted")}>
          {catConfig?.icon && <catConfig.icon className="h-3.5 w-3.5" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold truncate">{match.name}</p>
            <Badge variant="secondary" className="text-sm capitalize flex-shrink-0">{match.county}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{match.description}</p>
          <div className="flex items-center gap-3 mt-1">
            {match.phone && (
              <span className="flex items-center gap-1 text-sm text-primary">
                <Phone className="h-3 w-3" />
                {match.phone}
              </span>
            )}
            {match.address && (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {match.address}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={cn("text-sm font-bold px-1.5 py-0.5 rounded", getScoreBg(match.relevanceScore), getScoreColor(match.relevanceScore))}>
              {match.relevanceScore}% match
            </span>
            <span className="text-sm text-muted-foreground">{match.reasoning}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AssessRiskResultCard({ result }: { result: AssessRiskResult }) {
  const severityColor = {
    low: "bg-green-100 text-green-700",
    medium: "bg-amber-100 text-amber-700",
    high: "bg-orange-100 text-orange-700",
    critical: "bg-red-100 text-red-700",
  }[result.severity] ?? "bg-muted text-muted-foreground";

  const urgencyColor = {
    routine: "bg-blue-100 text-blue-700",
    urgent: "bg-amber-100 text-amber-700",
    emergency: "bg-red-100 text-red-700",
  }[result.urgency] ?? "bg-muted text-muted-foreground";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">Risk Score</p>
          <p className="text-2xl font-bold">{result.riskScore}/100</p>
        </div>
        <Badge className={cn("text-sm capitalize", severityColor)}>{result.severity}</Badge>
        <Badge className={cn("text-sm capitalize", urgencyColor)}>{result.urgency}</Badge>
      </div>
      {result.factors.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-muted-foreground mb-1">Risk Factors</p>
          <ul className="space-y-0.5">
            {result.factors.map((f, i) => (
              <li key={i} className="flex items-start gap-1.5 text-sm">
                <AlertTriangle className="h-3 w-3 text-amber-500 mt-0.5 flex-shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {result.recommendedActions.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-muted-foreground mb-1">Recommended Actions</p>
          <ul className="space-y-0.5">
            {result.recommendedActions.map((a, i) => (
              <li key={i} className="flex items-start gap-1.5 text-sm">
                <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function AiAssistant({ incidentId }: { incidentId?: string }) {
  const [activeAction, setActiveAction] = useState<ActionType>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [matchResult, setMatchResult] = useState<MatchServicesResult | null>(null);
  const [riskResult, setRiskResult] = useState<AssessRiskResult | null>(null);
  const [fhirResult, setFhirResult] = useState<Record<string, unknown> | null>(null);
  const [mongoSaved, setMongoSaved] = useState(false);

  const [matchForm, setMatchForm] = useState({
    incidentType: "",
    location: "",
    description: "",
    survivorAgeGroup: "",
    survivorGender: "",
  });

  const [riskForm, setRiskForm] = useState({
    incidentType: "",
    description: "",
    survivorAgeGroup: "",
    survivorGender: "",
    isEscalated: false,
  });

  const addLog = useCallback((action: string, result: string) => {
    setLogs((prev) => [
      { id: Date.now().toString(), action, result: result.slice(0, 200), timestamp: new Date() },
      ...prev,
    ]);
  }, []);

  const showMongo = useCallback(() => {
    setMongoSaved(true);
    setTimeout(() => setMongoSaved(false), 2000);
  }, []);

  const handleMatch = async () => {
    if (!matchForm.incidentType || !matchForm.location) return;
    setLoading(true);
    setError(null);
    setMatchResult(null);
    try {
      const result = await matchServices({
        incidentType: matchForm.incidentType,
        location: matchForm.location,
        description: matchForm.description || undefined,
        survivorAgeGroup: matchForm.survivorAgeGroup || undefined,
        survivorGender: matchForm.survivorGender || undefined,
        limit: 5,
      });
      setMatchResult(result);
      addLog("match_services", `Found ${result.count} services for ${matchForm.incidentType} in ${matchForm.location}`);

      if (incidentId) {
        storeCaseDocument({
          incidentId,
          type: "service_match",
          incidentType: matchForm.incidentType,
          description: matchForm.description || "",
          location: matchForm.location || "",
          matched_services: result.matches?.map((s: any) => s.serviceId) ?? [],
          match_count: result.count,
          matched_at: new Date().toISOString(),
          source: "ai_assistant_panel",
        }).then(() => { showMongo(); }).catch(() => {});
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to match services");
    } finally {
      setLoading(false);
    }
  };

  const handleAssess = async () => {
    if (!riskForm.incidentType || !riskForm.description) return;
    setLoading(true);
    setError(null);
    setRiskResult(null);
    try {
      const result = await assessRisk({
        incidentType: riskForm.incidentType,
        description: riskForm.description,
        survivorAgeGroup: riskForm.survivorAgeGroup || undefined,
        survivorGender: riskForm.survivorGender || undefined,
        isEscalated: riskForm.isEscalated || undefined,
      });
      setRiskResult(result);
      addLog("assess_risk", `Risk score: ${result.riskScore}/100, severity: ${result.severity}`);

      if (incidentId) {
        storeCaseDocument({
          incidentId,
          type: "risk_assessment",
          incidentType: riskForm.incidentType,
          description: riskForm.description,
          location: "",
          riskScore: result.riskScore,
          severity: result.severity,
          urgency: result.urgency,
          risk_factors: result.factors,
          recommended_actions: result.recommendedActions,
          assessed_at: new Date().toISOString(),
          source: "ai_assistant_panel",
        }).then(() => { showMongo(); }).catch(() => {});
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to assess risk");
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setActiveAction(null);
    setError(null);
    setMatchResult(null);
    setRiskResult(null);
    setFhirResult(null);
  };

  const actionCards = [
    {
      type: "match" as const,
      icon: Search,
      label: "Find Services",
      desc: "Match incident to referral services by type and location",
      color: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
    },
    {
      type: "assess" as const,
      icon: AlertTriangle,
      label: "Assess Risk",
      desc: "Score severity and get recommended actions",
      color: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
    },
    {
      type: "fhir" as const,
      icon: FileJson,
      label: "Generate FHIR",
      desc: "Create FHIR R4 bundle from incident data",
      color: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100",
    },
  ];

  return (
    <Sheet onOpenChange={(open) => { if (!open) resetAll(); }}>
      <SheetTrigger asChild>
        <button
          className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:scale-105 flex items-center justify-center cursor-pointer"
          aria-label="AI Assistant"
        >
          <Bot className="h-6 w-6" />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="px-4 pt-4 pb-2 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <SheetTitle className="text-sm">AI Assistant</SheetTitle>
            <Badge variant="secondary" className="text-sm ml-auto">MCP Connected</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Call MCP tools to find services, assess risk, or generate FHIR bundles
          </p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!activeAction && !error && (
            <>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Quick Actions</p>
                <div className="grid gap-2">
                  {actionCards.map((card) => (
                    <button
                      key={card.type}
                      onClick={() => setActiveAction(card.type)}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-xl border text-left transition-colors cursor-pointer",
                        card.color
                      )}
                    >
                      <card.icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold">{card.label}</p>
                        <p className="text-sm opacity-70">{card.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {logs.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">History</p>
                  <div className="space-y-1">
                    {logs.map((log) => (
                      <div key={log.id} className="flex items-start gap-2 p-2 rounded-lg bg-muted/50">
                        <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium">{log.action}</p>
                          <p className="text-sm text-muted-foreground">{log.result}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Match Services Form */}
          {activeAction === "match" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Find Services</p>
                <button onClick={() => setActiveAction(null)} className="text-sm text-primary hover:underline cursor-pointer">Back</button>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Incident Type</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={matchForm.incidentType}
                  onChange={(e) => setMatchForm({ ...matchForm, incidentType: e.target.value })}
                >
                  <option value="">Select type...</option>
                  {INCIDENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Location (County)</Label>
                <Input
                  placeholder="e.g. Kakamega, Vihiga"
                  value={matchForm.location}
                  onChange={(e) => setMatchForm({ ...matchForm, location: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Description (optional)</Label>
                <Textarea
                  placeholder="Describe the incident..."
                  value={matchForm.description}
                  onChange={(e) => setMatchForm({ ...matchForm, description: e.target.value })}
                  className="text-sm min-h-[60px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label className="text-sm">Age Group</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    value={matchForm.survivorAgeGroup}
                    onChange={(e) => setMatchForm({ ...matchForm, survivorAgeGroup: e.target.value })}
                  >
                    <option value="">Any</option>
                    <option value="under_10">Under 10</option>
                    <option value="10_14">10-14</option>
                    <option value="15_18">15-18</option>
                    <option value="18_plus">18+</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Gender</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    value={matchForm.survivorGender}
                    onChange={(e) => setMatchForm({ ...matchForm, survivorGender: e.target.value })}
                  >
                    <option value="">Any</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <Button
                onClick={handleMatch}
                disabled={loading || !matchForm.incidentType || !matchForm.location}
                className="w-full cursor-pointer"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                {loading ? "Searching..." : "Find Services"}
              </Button>

              {matchResult && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground">
                    Found {matchResult.count} service{matchResult.count !== 1 ? "s" : ""}
                  </p>
                  <div className="space-y-2">
                    {matchResult.matches.map((m) => (
                      <ServiceCard key={m.serviceId} match={m} />
                    ))}
                    {matchResult.count === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No matching services found. The referral database may not be seeded yet.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Assess Risk Form */}
          {activeAction === "assess" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Assess Risk</p>
                <button onClick={() => setActiveAction(null)} className="text-sm text-primary hover:underline cursor-pointer">Back</button>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Incident Type</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={riskForm.incidentType}
                  onChange={(e) => setRiskForm({ ...riskForm, incidentType: e.target.value })}
                >
                  <option value="">Select type...</option>
                  {INCIDENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Description</Label>
                <Textarea
                  placeholder="Describe the incident in detail..."
                  value={riskForm.description}
                  onChange={(e) => setRiskForm({ ...riskForm, description: e.target.value })}
                  className="text-sm min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label className="text-sm">Age Group</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    value={riskForm.survivorAgeGroup}
                    onChange={(e) => setRiskForm({ ...riskForm, survivorAgeGroup: e.target.value })}
                  >
                    <option value="">Any</option>
                    <option value="under_10">Under 10</option>
                    <option value="10_14">10-14</option>
                    <option value="15_18">15-18</option>
                    <option value="18_plus">18+</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Gender</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    value={riskForm.survivorGender}
                    onChange={(e) => setRiskForm({ ...riskForm, survivorGender: e.target.value })}
                  >
                    <option value="">Any</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={riskForm.isEscalated}
                  onChange={(e) => setRiskForm({ ...riskForm, isEscalated: e.target.checked })}
                  className="rounded border-input"
                />
                <span className="text-sm text-muted-foreground">Already escalated</span>
              </label>

              <Button
                onClick={handleAssess}
                disabled={loading || !riskForm.incidentType || !riskForm.description}
                className="w-full cursor-pointer"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
                {loading ? "Assessing..." : "Assess Risk"}
              </Button>

              {riskResult && <AssessRiskResultCard result={riskResult} />}
            </div>
          )}

          {/* FHIR Form */}
          {activeAction === "fhir" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Generate FHIR Bundle</p>
                <button onClick={() => setActiveAction(null)} className="text-sm text-primary hover:underline cursor-pointer">Back</button>
              </div>

              <p className="text-sm text-muted-foreground">
                Generates a FHIR R4 transaction bundle. Call from the incident detail page to include real incident data, or use the quick generate below.
              </p>

              <Button
                onClick={async () => {
                  setLoading(true);
                  setError(null);
                  setFhirResult(null);
                  try {
                    let incidentPayload: Record<string, unknown>;

                    if (incidentId) {
                      const doc = await getDocument<any>("incidents", incidentId);
                      if (doc) {
                        incidentPayload = {
                          incidentType: doc.incident_type ?? doc.incidentType,
                          incidentDate: doc.incident_date ?? doc.incidentDate,
                          location: doc.location,
                          description: doc.description ?? "",
                          survivorAgeGroup: doc.survivor_age_group ?? doc.survivorAgeGroup,
                          survivorGender: doc.survivor_gender ?? doc.survivorGender,
                          riskScore: doc.risk_score ?? doc.riskScore,
                          severity: doc.severity,
                        };
                      } else {
                        incidentPayload = {
                          incidentType: "physical_abuse",
                          incidentDate: new Date().toISOString().split("T")[0],
                          location: "Kakamega",
                          description: "Survivor requires shelter and medical attention",
                        };
                      }
                    } else {
                      incidentPayload = {
                        incidentType: "physical_abuse",
                        incidentDate: new Date().toISOString().split("T")[0],
                        location: "Kakamega",
                        description: "Survivor requires shelter and medical attention",
                      };
                    }

                    const result = await generateFhirBundle({
                      incidentId: incidentId || undefined,
                      incident: incidentPayload,
                      includeReferrals: true,
                    });
                    setFhirResult(result);
                    addLog("generate_fhir_bundle", "FHIR R4 bundle generated");

                    if (incidentId) {
                      storeCaseDocument({
                        incidentId,
                        type: "fhir_bundle",
                        incidentType: (incidentPayload.incidentType as string) || "unknown",
                        description: (incidentPayload.description as string) || "",
                        location: (incidentPayload.location as string) || "",
                        bundle_id: (result as any)?.bundle?.id,
                        resource_count: (result as any)?.bundle?.entry?.length,
                        generated_at: new Date().toISOString(),
                        source: "ai_assistant_panel",
                      }).then(() => { showMongo(); }).catch(() => {});
                    }
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Failed to generate FHIR bundle");
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="w-full cursor-pointer"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileJson className="h-4 w-4" />}
                {loading ? "Generating..." : incidentId ? "Generate FHIR Bundle" : "Generate Sample FHIR Bundle"}
              </Button>

              {fhirResult && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground">FHIR R4 Bundle</p>
                  <div className="bg-muted rounded-lg p-3 max-h-60 overflow-auto">
                    <pre className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap break-all">
                      {JSON.stringify(fhirResult, null, 2)}
                    </pre>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="text-sm w-full cursor-pointer"
                    onClick={() => {
                      const blob = new Blob([JSON.stringify(fhirResult, null, 2)], { type: "application/json" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "fhir-bundle.json";
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    <FileJson className="h-3 w-3 mr-1" />
                    Download FHIR Bundle
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* MongoDB saved confirmation */}
          {mongoSaved && (
            <div className="flex items-center gap-1.5 text-sm text-primary animate-in fade-in">
              <Database className="h-3 w-3" />
              <CheckCircle2 className="h-3 w-3" />
              Saved to MongoDB
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-destructive">Error</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="cursor-pointer">
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-border bg-muted/30 flex-shrink-0">
          <p className="text-sm text-muted-foreground text-center">
            Connected to Tich Labs MCP Server
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
