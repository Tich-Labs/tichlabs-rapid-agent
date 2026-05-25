import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { motion } from "motion/react";
import { cn } from "@/lib/utils.ts";
import { formatDistanceToNow } from "date-fns";
import { useSupabaseQuery, useSupabaseQueryCamel } from "@/hooks/use-supabase-query";
import { supabaseQueries } from "@/hooks/use-supabase-query";
import {
  ClipboardPlus,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  ShieldAlert,
  ListFilter,
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
  Smartphone,
  ScrollText,
} from "lucide-react";
import { useMongodbAggregates } from "@/hooks/use-mongodb-aggregates";
// ─── Shared config ────────────────────────────────────────────────────────────
const ROLE_LABELS: Record<string, string> = {
  volunteer: "Volunteer",
  counselor: "Counselor",
  program_lead: "Program Lead",
  executive_director: "Executive Director",
  pending: "Pending Activation",
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  new: { label: "New", className: "bg-blue-100 text-blue-800 border-blue-200" },
  assigned: { label: "Assigned", className: "bg-purple-100 text-purple-800 border-purple-200" },
  pfa_in_progress: { label: "PFA In Progress", className: "bg-amber-100 text-amber-800 border-amber-200" },
  under_review: { label: "Under Review", className: "bg-orange-100 text-orange-800 border-orange-200" },
  escalated: { label: "Escalated", className: "bg-red-100 text-red-800 border-red-200" },
  resolved: { label: "Resolved", className: "bg-green-100 text-green-800 border-green-200" },
  closed: { label: "Closed", className: "bg-muted text-muted-foreground border-border" },
};

const TYPE_LABELS: Record<string, string> = {
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

const TYPE_ICONS: Record<string, React.ElementType> = {
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

type RecentIncident = {
  id: string;
  incidentType: string;
  location: string;
  status: string;
  isEscalated: boolean;
  createdAt: string;
};

// ─── Shared components ────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon: Icon,
  colorClass,
  delay = 0,
}: {
  label: string;
  value: number | undefined;
  icon: React.ElementType;
  colorClass: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, ease: "easeOut", duration: 0.35 }}
    >
      <Card>
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {label}
            </span>
            <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", colorClass)}>
              <Icon className="h-3.5 w-3.5" />
            </div>
          </div>
          {value === undefined ? (
            <Skeleton className="h-8 w-12" />
          ) : (
            <div className="text-3xl font-bold">{value}</div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function IncidentRow({ incident, onClick }: { incident: RecentIncident; onClick: () => void }) {
  const status = STATUS_CONFIG[incident.status] ?? { label: incident.status, className: "" };
  const Icon = TYPE_ICONS[incident.incidentType] ?? FileQuestion;
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left border-b border-border last:border-0"
    >
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-sm font-medium truncate">
            {TYPE_LABELS[incident.incidentType] ?? incident.incidentType}
          </span>
          {incident.isEscalated && (
            <AlertTriangle className="h-3 w-3 text-destructive flex-shrink-0" />
          )}
        </div>
        <div className="text-sm text-muted-foreground truncate">
          {incident.location}{incident.createdAt ? ` · ${formatDistanceToNow(new Date(incident.createdAt), { addSuffix: true })}` : ''}
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className={cn("text-sm px-2 py-0.5 rounded-full border font-medium", status.className)}>
          {status.label}
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </button>
  );
}

// ─── Pending user screen ──────────────────────────────────────────────────────
function PendingDashboard({ name }: { name?: string }) {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center gap-5">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-20 h-20 rounded-full bg-yellow-50 border-2 border-yellow-200 flex items-center justify-center"
      >
        <Clock className="h-9 w-9 text-yellow-500" />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.35 }}
        className="space-y-2 max-w-sm"
      >
        <h1 className="text-xl font-bold">
          Welcome, {name?.split(" ")[0] ?? "there"}
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Your account is awaiting role assignment by a Program Lead or Executive Director.
          You will receive access once your role has been assigned.
        </p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.35 }}
        className="w-full max-w-sm space-y-2"
      >
        <div className="rounded-xl border border-border bg-card p-4 text-left space-y-3">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            What happens next
          </p>
          {[
            { icon: UserCheck, text: "A Program Lead will assign your role" },
            { icon: CheckCircle2, text: "You'll gain access to the incident tracker" },
            { icon: ClipboardPlus, text: "You can begin logging and reviewing incidents" },
          ].map(({ icon: Icon, text }, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="h-3.5 w-3.5 text-primary" />
              </div>
              <p className="text-sm text-foreground">{text}</p>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground text-center pt-1">
          Contact your Program Lead if you have been waiting more than 24 hours.
        </p>
      </motion.div>
    </div>
  );
}

// ─── Volunteer dashboard ──────────────────────────────────────────────────────
function VolunteerDashboard({ name }: { name?: string }) {
  const navigate = useNavigate();
  const stats = useSupabaseQueryCamel<{ total: number; new: number; inProgress: number; escalated: number; resolved: number }>(supabaseQueries.getDashboardStats);
  const incidents = useSupabaseQueryCamel<any[]>(supabaseQueries.listIncidents);
  const { data: mongoData, status: mongoStatus } = useMongodbAggregates();

  const s = stats.data ?? { total: 0, new: 0, inProgress: 0, escalated: 0, resolved: 0 };
  const mongoTotal = mongoStatus === "success"
    ? mongoData?.byType?.reduce((sum, b) => sum + b.count, 0) ?? s.total
    : s.total;
  const mongoActive = mongoStatus === "success";
  const recent = incidents.data ?? [];

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Welcome back,</p>
            <h1 className="text-2xl font-bold">{name?.split(" ")[0] ?? "Volunteer"}</h1>
            <Badge variant="secondary" className="mt-1.5 text-sm">Volunteer</Badge>
          </div>
          <Button size="sm" onClick={() => navigate("/incidents/new")} className="flex-shrink-0 mt-1">
            <ClipboardPlus className="h-4 w-4 mr-1.5" />
            Log Incident
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 grid grid-cols-2 gap-3">
        <StatCard label="Total" value={mongoTotal} icon={TrendingUp} colorClass="bg-primary/10 text-primary" delay={0} />
        <StatCard label="In Progress" value={s.inProgress} icon={Clock} colorClass="bg-amber-50 text-amber-600" delay={0.05} />
        <StatCard label="Resolved" value={s.resolved} icon={CheckCircle2} colorClass="bg-green-50 text-green-600" delay={0.1} />
        <StatCard label="New" value={s.new} icon={ListFilter} colorClass="bg-blue-50 text-blue-600" delay={0.15} />
      </div>
      <div className="px-4 flex items-center gap-1.5 mt-1">
        <span className={cn("w-1.5 h-1.5 rounded-full", mongoActive ? "bg-green-500" : "bg-muted-foreground/40")} />
        <span className="text-sm text-muted-foreground">
          {mongoActive ? "Live analytics · MongoDB Atlas" : "Analytics · Firestore"}
        </span>
      </div>

      {/* Quick action */}
      <div className="px-4 mt-6">
        <button
          onClick={() => navigate("/incidents/new")}
          className="w-full flex items-center gap-4 p-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
        >
          <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center">
            <ClipboardPlus className="h-5 w-5" />
          </div>
          <div className="text-left">
            <div className="font-semibold text-sm">Log New Incident</div>
            <div className="text-sm text-primary-foreground/70">Report an incident securely</div>
          </div>
          <ChevronRight className="h-4 w-4 ml-auto opacity-70" />
        </button>
      </div>

      {/* My incidents */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">All Incidents</h2>
          <button onClick={() => navigate("/incidents")} className="text-sm text-primary font-medium">
            View all
          </button>
        </div>
        <Card className="overflow-hidden p-0">
          {stats.isLoading ? (
            <div className="divide-y divide-border">
              {[1, 2, 3].map((i) => (
                <div key={i} className="px-4 py-3 flex gap-3">
                  <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div className="py-10 text-center">
              <CheckCircle2 className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No incidents logged yet</p>
              <Button variant="secondary" size="sm" className="mt-3" onClick={() => navigate("/incidents/new")}>
                Log First Incident
              </Button>
            </div>
          ) : (
            recent.slice(0, 5).map((inc) => (
              <IncidentRow
                key={inc.id}
                incident={inc as RecentIncident}
                onClick={() => navigate(`/incidents/${inc.id}`)}
              />
            ))
          )}
        </Card>
      </div>
    </div>
  );
}

// ─── Staff dashboard (counselor / program_lead / exec_director) ───────────────
function StaffDashboard({ name, role }: { name?: string; role: string }) {
  const navigate = useNavigate();
  const stats = useSupabaseQueryCamel<{ total: number; new: number; inProgress: number; escalated: number; resolved: number }>(supabaseQueries.getDashboardStats);
  const escalated = useSupabaseQueryCamel<any[]>(supabaseQueries.getEscalatedIncidents);
  const newIncidents = useSupabaseQueryCamel<any[]>(supabaseQueries.getNewIncidents);
  const { data: mongoData, status: mongoStatus } = useMongodbAggregates();

  const mongoTotal = mongoStatus === "success"
    ? mongoData?.byType?.reduce((sum, b) => sum + b.count, 0) ?? stats.data?.total ?? 0
    : stats.data?.total ?? 0;
  const mongoActive = mongoStatus === "success";

  const canManage = ["program_lead", "executive_director"].includes(role);

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Good day,</p>
            <h1 className="text-2xl font-bold">{name?.split(" ")[0] ?? "Staff"}</h1>
            <Badge variant="secondary" className="mt-1.5 text-sm capitalize">
              {ROLE_LABELS[role] ?? role}
            </Badge>
          </div>
          <Button size="sm" onClick={() => navigate("/incidents")} className="flex-shrink-0 mt-1">
            <ListFilter className="h-4 w-4 mr-1.5" />
            All Incidents
          </Button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="px-4 grid grid-cols-2 gap-3">
        <StatCard label="Total" value={mongoTotal} icon={TrendingUp} colorClass="bg-primary/10 text-primary" delay={0} />
        <StatCard label="New" value={stats.data?.new} icon={Clock} colorClass="bg-blue-50 text-blue-600" delay={0.05} />
        <StatCard label="In Progress" value={stats.data?.inProgress} icon={ListFilter} colorClass="bg-amber-50 text-amber-600" delay={0.1} />
        <StatCard
          label="Escalated"
          value={stats.data?.escalated}
          icon={ShieldAlert}
          colorClass={stats.data?.escalated ? "bg-red-50 text-red-600" : "bg-muted text-muted-foreground"}
          delay={0.15}
        />
      </div>
      <div className="px-4 flex items-center gap-1.5 mt-1">
        <span className={cn("w-1.5 h-1.5 rounded-full", mongoActive ? "bg-green-500" : "bg-muted-foreground/40")} />
        <span className="text-sm text-muted-foreground">
          {mongoActive ? "Live analytics · MongoDB Atlas" : "Analytics · Firestore"}
        </span>
      </div>

      {/* Escalated alerts */}
      {escalated.data && escalated.data.length > 0 && (
        <div className="px-4 mt-6">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="h-4 w-4 text-destructive" />
            <h2 className="text-sm font-semibold text-destructive uppercase tracking-wide">Escalated — Action Required</h2>
          </div>
          <Card className="overflow-hidden p-0 border-red-200">
            {escalated.isLoading ? (
              <div className="px-4 py-3 space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              escalated.data.map((inc: any) => (
                <IncidentRow
                  key={inc.id}
                  incident={inc as RecentIncident}
                  onClick={() => navigate(`/incidents/${inc.id}`)}
                />
              ))
            )}
          </Card>
        </div>
      )}

      {/* New incidents needing attention */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            New — Awaiting Assignment
          </h2>
          <button onClick={() => navigate("/incidents?status=new")} className="text-sm text-primary font-medium">
            View all
          </button>
        </div>
        <Card className="overflow-hidden p-0">
          {newIncidents.isLoading ? (
            <div className="divide-y divide-border">
              {[1, 2, 3].map((i) => (
                <div key={i} className="px-4 py-3 flex gap-3">
                  <Skeleton className="w-8 h-8 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : !newIncidents.data || newIncidents.data.length === 0 ? (
            <div className="py-8 text-center">
              <CheckCircle2 className="h-7 w-7 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">All caught up — no new incidents</p>
            </div>
          ) : (
            newIncidents.data.slice(0, 5).map((inc: any) => (
              <IncidentRow
                key={inc.id}
                incident={inc as RecentIncident}
                onClick={() => navigate(`/incidents/${inc.id}`)}
              />
            ))
          )}
        </Card>
      </div>

      {/* Quick actions for senior staff */}
      {canManage && (
        <div className="px-4 mt-6">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => navigate("/incidents")}
              className="flex items-center gap-4 p-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center">
                <ListFilter className="h-5 w-5" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-sm">Review All Incidents</div>
                <div className="text-sm text-primary-foreground/70">Assign, escalate, or resolve</div>
              </div>
              <ChevronRight className="h-4 w-4 ml-auto opacity-70" />
            </button>
            <button
              onClick={() => navigate("/users")}
              className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/30 hover:bg-muted/30 transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-sm">Manage Users</div>
                <div className="text-sm text-muted-foreground">Approve & assign roles</div>
              </div>
              <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
            </button>
            <button
              onClick={() => navigate("/audit")}
              className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/30 hover:bg-muted/30 transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <ScrollText className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-sm">Audit Log</div>
                <div className="text-sm text-muted-foreground">View all system activity</div>
              </div>
              <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Root export ──────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const userQuery = useSupabaseQueryCamel<any>(supabaseQueries.getCurrentUser);
  const user = userQuery.data;

  if (userQuery.isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!user || user.role === "pending") {
    return <PendingDashboard name={user?.name} />;
  }

  if (user.role === "volunteer") {
    return <VolunteerDashboard name={user.name} />;
  }

  return <StaffDashboard name={user.name} role={user.role} />;
}
