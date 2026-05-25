import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card.tsx";
import {
  ShieldCheck,
  Brain,
  Database,
  WifiOff,
  Lock,
  Sparkles,
  Zap,
  Flame,
  FileHeart,
  Building2,
  MapPin,
} from "lucide-react";

const ORG_NAME = import.meta.env.VITE_ORG_NAME ?? "Youth Changers Kenya";
const ORG_LOCATION = import.meta.env.VITE_ORG_LOCATION ?? "Kakamega & Vihiga";

const capabilities = [
  {
    icon: ShieldCheck,
    title: "Trauma-informed reporting",
    body: "Five-step guided form with consent gate, anonymized data collection, and no PII ever stored.",
  },
  {
    icon: Brain,
    title: "AI-powered triage",
    body: "Gemini 2.5 assesses risk, matches verified services, and generates FHIR health records in one step.",
  },
  {
    icon: Database,
    title: "Institutional memory",
    body: "Every case is stored, searchable, and anonymized in MongoDB Atlas — knowledge that survives staff turnover.",
  },
  {
    icon: WifiOff,
    title: "Built for the field",
    body: "Offline-first PWA. Incidents queue without connectivity and sync automatically when the connection returns.",
  },
];

const techStack = [
  { icon: Sparkles, label: "Gemini 2.5" },
  { icon: Zap, label: "Google Cloud Agent Builder" },
  { icon: Database, label: "MongoDB Atlas" },
  { icon: Flame, label: "Firebase" },
  { icon: FileHeart, label: "FHIR R4" },
];

export default function AboutPage() {
  const { t } = useTranslation("common");

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* ─── Hero intro card ─── */}
      <Card className="border-l-4 border-l-primary">
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold text-foreground mb-1">
            {t("about.title", "About")}
          </h1>
          <p className="text-sm text-muted-foreground mb-4">
            {t("about.subtitle", "Case management for SGBV response organizations")}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The Incident Tracker gives your team a structured, trauma-informed
            workflow for logging, triaging, and following up on SGBV incidents
            — without collecting survivor names or identifying details.
            Survivors or volunteers log a case in under two minutes. The AI
            agent handles triage: assessing risk, matching verified local
            services, and generating a health record your team can act on
            immediately.
          </p>
        </CardContent>
      </Card>

      {/* ─── Capabilities grid ─── */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Capabilities</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {capabilities.map((c) => (
            <Card key={c.title}>
              <CardContent className="p-5 flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <c.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm text-foreground mb-1">{c.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{c.body}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* ─── Privacy commitment ─── */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 flex gap-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Lock className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-sm text-foreground mb-1">Privacy by design</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            No survivor names, ID numbers, or contact details are ever
            collected. Reference codes replace identifiers. All exports
            anonymize case data automatically. Your organization owns its
            data — it is never shared across tenants.
          </p>
        </div>
      </div>

      {/* ─── Powered by ─── */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Powered by</h2>
        <div className="flex flex-wrap gap-2">
          {techStack.map((t) => (
            <span
              key={t.label}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 text-primary px-3 py-1 text-sm"
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </span>
          ))}
        </div>
      </div>

      {/* ─── Current deployment ─── */}
      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
            {t("about.deployment", "Current deployment")}
          </h3>
          <div className="flex items-center gap-2 text-sm text-foreground mb-2">
            <Building2 className="h-4 w-4 text-primary/60" />
            <span className="font-medium">{ORG_NAME}</span>
            <span className="text-muted-foreground">·</span>
            <MapPin className="h-3.5 w-3.5 text-primary/50" />
            <span>{ORG_LOCATION}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">Pilot phase</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("about.builtBy", "Built by Tich Labs")}{" "}
            <a
              href="https://tichlabs.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              tichlabs.com
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
