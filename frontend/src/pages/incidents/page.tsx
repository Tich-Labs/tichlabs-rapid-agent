import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { cn } from "@/lib/utils.ts";
import { Authenticated, Unauthenticated, AuthLoading } from "@/components/auth-components";
import { useSupabaseQueryCamel } from "@/hooks/use-supabase-query";
import { supabaseQueries } from "@/hooks/use-supabase-query";
import { formatDistanceToNow } from "date-fns";
import {
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  User,
  Users,
  UserCheck,
  Siren,
  HeartCrack,
  Home,
  MessageCircleWarning,
  Pill,
  Building,
  Hammer,
  Search,
  FileQuestion,
  ShieldX,
  ShieldAlert,
  Smartphone,
} from "lucide-react";
const REPORTER_TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  self: { label: "Survivor", icon: User, className: "bg-blue-100 text-blue-700 border-blue-200" },
  on_behalf: { label: "For Someone", icon: Users, className: "bg-purple-100 text-purple-700 border-purple-200" },
  volunteer: { label: "Volunteer", icon: UserCheck, className: "bg-amber-100 text-amber-700 border-amber-200" },
};

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  new: { label: "New", className: "bg-blue-100 text-blue-800 border-blue-200" },
  assigned: { label: "Assigned", className: "bg-purple-100 text-purple-800 border-purple-200" },
  pfa_in_progress: { label: "PFA In Progress", className: "bg-amber-100 text-amber-800 border-amber-200" },
  under_review: { label: "Under Review", className: "bg-orange-100 text-orange-800 border-orange-200" },
  escalated: { label: "Escalated", className: "bg-red-100 text-red-800 border-red-200" },
  resolved: { label: "Resolved", className: "bg-green-100 text-green-800 border-green-200" },
  closed: { label: "Closed", className: "bg-muted text-muted-foreground border-border" },
};

const INCIDENT_TYPE_LABELS: Record<string, string> = {
  physical_abuse: "Physical Abuse",
  sexual_abuse: "Sexual Abuse",
  emotional_abuse: "Emotional Abuse",
  neglect: "Neglect",
  bullying_harassment: "Bullying / Harassment",
  substance_abuse: "Substance Abuse",
  domestic_violence: "Domestic Violence",
  child_labor: "Child Labor",
  child_exploitation: "Child Exploitation",
  missing_child: "Missing Child",
  tech_enabled_abuse: "Tech-Enabled Abuse",
  other: "Other",
};

const INCIDENT_ICONS: Record<string, React.ElementType> = {
  physical_abuse: Siren,
  sexual_abuse: ShieldX,
  emotional_abuse: HeartCrack,
  neglect: Home,
  bullying_harassment: MessageCircleWarning,
  substance_abuse: Pill,
  domestic_violence: Building,
  child_labor: Hammer,
  child_exploitation: ShieldAlert,
  missing_child: Search,
  tech_enabled_abuse: Smartphone,
  other: FileQuestion,
};

type StatusFilter =
  | "all"
  | "new"
  | "assigned"
  | "pfa_in_progress"
  | "under_review"
  | "escalated"
  | "resolved"
  | "closed";

type ReporterFilter = "all" | "self" | "on_behalf" | "volunteer";

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "assigned", label: "Assigned" },
  { value: "pfa_in_progress", label: "In Progress" },
  { value: "escalated", label: "Escalated" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

type IncidentItem = {
  id: string;
  incidentType: string;
  location: string;
  status: string;
  isEscalated: boolean;
  incidentDate: string;
  createdAt: string;
  reporterType?: string;
  volunteerId?: string;
  ai_status?: string;
  severity?: string;
};

function IncidentRow({ incident }: { incident: IncidentItem }) {
  const navigate = useNavigate();
  const config = STATUS_CONFIG[incident.status] ?? { label: incident.status, className: "" };
  const Icon = INCIDENT_ICONS[incident.incidentType] ?? FileQuestion;

  return (
    <button
      onClick={() => navigate(`/incidents/${incident.id}`)}
      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors text-left border-b border-border last:border-0"
    >
      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-sm font-semibold text-foreground truncate">
            {INCIDENT_TYPE_LABELS[incident.incidentType] ?? incident.incidentType}
          </span>
          {incident.reporterType && incident.reporterType in REPORTER_TYPE_CONFIG && (
            <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-sm border", REPORTER_TYPE_CONFIG[incident.reporterType].className)}>
              {REPORTER_TYPE_CONFIG[incident.reporterType].label}
            </span>
          )}
          {incident.isEscalated && (
            <AlertTriangle className="h-3.5 w-3.5 text-destructive flex-shrink-0" />
          )}
          {incident.ai_status === "pending" && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-sm border bg-amber-100 text-amber-700 border-amber-200 flex-shrink-0">
              AI assessing…
            </span>
          )}
          {incident.ai_status === "assessed" && incident.severity && (
            <span className={cn(
              "text-[10px] font-medium px-1.5 py-0.5 rounded-sm border flex-shrink-0",
              incident.severity === "critical" && "bg-red-100 text-red-700 border-red-200",
              incident.severity === "high" && "bg-orange-100 text-orange-700 border-orange-200",
              incident.severity === "medium" && "bg-amber-100 text-amber-700 border-amber-200",
              incident.severity === "low" && "bg-green-100 text-green-700 border-green-200",
            )}>
              {incident.severity}
            </span>
          )}
          {incident.ai_status === "failed" && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-sm border bg-muted text-muted-foreground border-border flex-shrink-0">
              Unassessed
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="truncate">{incident.location}</span>
          <span>·</span>
          <span className="whitespace-nowrap">{incident.incidentDate}</span>
          <span>·</span>
          <span className="whitespace-nowrap">
            {formatDistanceToNow(new Date(incident.createdAt), { addSuffix: true })}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span
          className={cn(
            "text-xs font-medium px-2 py-0.5 rounded-full border",
            config.className
          )}
        >
          {config.label}
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </button>
  );
}

const REPORTER_FILTER_TABS: { value: ReporterFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "self", label: "Survivor" },
  { value: "on_behalf", label: "For Someone" },
  { value: "volunteer", label: "Volunteer" },
];

function IncidentListInner() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [reporterFilter, setReporterFilter] = useState<ReporterFilter>("all");

  const { data: results, status } = useSupabaseQueryCamel(supabaseQueries.listIncidents);

  const { data: user } = useSupabaseQueryCamel(supabaseQueries.listUsers);

  const filtered = (results || []).filter((incident: any) => {
    if (statusFilter !== "all" && incident.status !== statusFilter) return false;
    if (reporterFilter !== "all" && incident.reporterType !== reporterFilter) return false;
    return true;
  });

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 border-b border-border">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">Incidents</h1>
            <p className="text-sm text-muted-foreground">
              {user?.role === "volunteer"
                ? "Your submitted reports"
                : "All logged incidents"}
            </p>
          </div>
          {user?.role && user.role !== "pending" && results && (
            <Badge variant="secondary" className="text-xs capitalize">
              {filtered.length} shown
            </Badge>
          )}
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="border-b border-border overflow-x-auto">
        <div className="flex px-4 py-2 gap-1 min-w-max">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors",
                statusFilter === tab.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reporter type filter tabs */}
      <div className="border-b border-border overflow-x-auto">
        <div className="flex px-4 py-2 gap-1 min-w-max">
          {REPORTER_FILTER_TABS.map((tab) => {
            const Icon = tab.value === "all" ? null : REPORTER_TYPE_CONFIG[tab.value]?.icon;
            return (
              <button
                key={tab.value}
                onClick={() => setReporterFilter(tab.value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1",
                  reporterFilter === tab.value
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {Icon && <Icon className="h-3.5 w-3.5" />}
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      <div>
        {status === "pending" ? (
          <div>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
                <Skeleton className="w-9 h-9 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>
        ) : !results || results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
              <ShieldCheck className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">No incidents found</p>
            <p className="text-xs text-muted-foreground mt-1">
              {statusFilter !== "all" ? "Try a different status filter" : "No incidents have been logged yet"}
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <p className="text-sm font-medium text-muted-foreground">No incidents match the selected filters</p>
          </div>
        ) : (
          <>
            {filtered.map((incident: any) => (
              <IncidentRow key={incident.id} incident={incident as IncidentItem} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

export default function IncidentsListPage() {
  return (
    <>
      <AuthLoading>
        <div className="p-6 space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      </AuthLoading>
      <Unauthenticated>
        <div className="flex items-center justify-center min-h-[60vh]">
          <SignInButton />
        </div>
      </Unauthenticated>
      <Authenticated>
        <IncidentListInner />
      </Authenticated>
    </>
  );
}
