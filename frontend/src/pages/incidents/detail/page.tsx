import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip.tsx";
import { toast } from "sonner";
import { cn } from "@/lib/utils.ts";
import { format } from "date-fns";
import {
  ChevronLeft,
  AlertTriangle,
  Info,
  User,
  Users,
  MapPin,
  Calendar,
  Clock,
  UserCheck,
  MessageSquarePlus,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  ArrowRightCircle,
  FilePlus,
  ArrowRightLeft,
  UserPlus,
  StickyNote,
  ScrollText,
  Brain,
  AlertOctagon,
} from "lucide-react";
import AIRecommendations from "@/components/ai-recommendations.tsx";
import { useSupabaseQuery, useSupabaseQueryCamel, useSupabaseMutation, supabaseQueries, supabaseMutations } from "@/hooks/use-supabase-query";
import { supabase } from "@/lib/supabase";
import { snakeToCamel } from "@/lib/supabase-utils";
import { Authenticated, Unauthenticated, AuthLoading } from "@/components/auth-components";
const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  new: { label: "New", className: "bg-blue-100 text-blue-800 border-blue-200" },
  assigned: { label: "Assigned", className: "bg-purple-100 text-purple-800 border-purple-200" },
  pfa_in_progress: { label: "PFA In Progress", className: "bg-amber-100 text-amber-800 border-amber-200" },
  under_review: { label: "Under Review", className: "bg-orange-100 text-orange-800 border-orange-200" },
  escalated: { label: "Escalated", className: "bg-red-100 text-red-800 border-red-200" },
  resolved: { label: "Resolved", className: "bg-green-100 text-green-800 border-green-200" },
  closed: { label: "Closed", className: "bg-muted text-muted-foreground border-border" },
};

const REPORTER_TYPE_LABELS: Record<string, string> = {
  self: "Survivor",
  on_behalf: "For Someone",
  volunteer: "Volunteer",
};

const REPORTER_TYPE_ICONS: Record<string, React.ElementType> = {
  self: User,
  on_behalf: Users,
  volunteer: UserCheck,
};

const INCIDENT_TYPE_LABELS: Record<string, string> = {
  physical_abuse: "Physical Abuse",
  sexual_abuse: "Sexual Abuse / Exploitation",
  emotional_abuse: "Emotional / Psychological Abuse",
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

function DetailRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border last:border-0">
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground break-words">{value}</p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-4 pt-6 mb-5">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        {title}
      </h2>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4">{children}</div>
      </div>
    </div>
  );
}

type WorkflowStatus =
  | "new"
  | "assigned"
  | "pfa_in_progress"
  | "under_review"
  | "escalated"
  | "resolved"
  | "closed";

const WORKFLOW_STEPS: { status: WorkflowStatus; label: string }[] = [
  { status: "new", label: "Logged" },
  { status: "assigned", label: "Assigned" },
  { status: "pfa_in_progress", label: "PFA" },
  { status: "under_review", label: "Review" },
  { status: "resolved", label: "Resolved" },
  { status: "closed", label: "Closed" },
];

const STATUS_STEP_INDEX: Record<string, number> = {
  new: 0,
  assigned: 1,
  pfa_in_progress: 2,
  under_review: 3,
  escalated: 3, // escalated sits at review level
  resolved: 4,
  closed: 5,
};

const WORKFLOW_STAGE_DESCRIPTIONS: Record<WorkflowStatus, string> = {
  new: "The incident is logged and waiting for assignment.",
  assigned: "A counselor has been assigned and the case is ready for initial support.",
  pfa_in_progress: "Psychosocial First Aid is in progress — provide immediate emotional support and safety planning.",
  under_review: "The case is with senior staff for review.",
  escalated: "This incident has been escalated for urgent attention.",
  resolved: "The incident has been resolved. Close when follow-up is complete.",
  closed: "The case is closed and archived.",
};

function WorkflowProgress({ status, isEscalated }: { status: string; isEscalated: boolean }) {
  const currentStep = STATUS_STEP_INDEX[status] ?? 0;
  return (
    <div className="mb-5 overflow-x-auto">
      <div className="w-full rounded-xl border border-border bg-card p-4">
        {isEscalated && (
          <div className="flex items-center gap-1.5 mb-3 px-2 py-1.5 rounded-lg bg-red-50 border border-red-200">
            <AlertTriangle className="h-3.5 w-3.5 text-red-600 flex-shrink-0" />
            <span className="text-xs font-semibold text-red-700">Escalated — Senior review required</span>
          </div>
        )}
        <div className="flex items-center gap-0">
          {WORKFLOW_STEPS.map((step, i) => {
            const done = i < currentStep;
            const active = i === currentStep;
            return (
              <div key={step.status} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-colors",
                      done
                        ? "bg-primary text-primary-foreground"
                        : active
                        ? isEscalated
                          ? "bg-red-600 text-white ring-2 ring-red-200"
                          : "bg-primary/20 text-primary ring-2 ring-primary/30"
                        : "bg-muted text-muted-foreground/50"
                    )}
                  >
                    {done ? <CheckCircle2 className="h-3 w-3" /> : i + 1}
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-medium whitespace-nowrap",
                      active ? "text-foreground" : done ? "text-primary" : "text-muted-foreground/50"
                    )}
                  >
                    {active && step.status === "pfa_in_progress"
                      ? "PFA (Psychosocial First Aid)"
                      : active && step.status === "under_review" && isEscalated
                      ? "Escalated"
                      : step.label}
                  </span>
                </div>
                {i < WORKFLOW_STEPS.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-0.5 mx-0.5 mb-4 transition-colors",
                      i < currentStep ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-4 rounded-xl border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
          {WORKFLOW_STAGE_DESCRIPTIONS[status as WorkflowStatus]}
        </div>
      </div>
    </div>
  );
}

type UserRole = "volunteer" | "counselor" | "program_lead" | "executive_director" | "pending";

// --- Audit Trail Timeline ---
const AUDIT_ACTION_CONFIG: Record<string, { label: string; icon: React.ElementType; colorClass: string }> = {
  created: { label: "Created", icon: FilePlus, colorClass: "bg-blue-100 text-blue-700" },
  status_changed: { label: "Status Changed", icon: ArrowRightLeft, colorClass: "bg-amber-100 text-amber-700" },
  assigned: { label: "Assigned", icon: UserPlus, colorClass: "bg-purple-100 text-purple-700" },
  escalated: { label: "Escalated", icon: ShieldAlert, colorClass: "bg-red-100 text-red-700" },
  note_added: { label: "Note Added", icon: StickyNote, colorClass: "bg-slate-100 text-slate-700" },
  resolved: { label: "Resolved", icon: CheckCircle2, colorClass: "bg-green-100 text-green-700" },
  closed: { label: "Closed", icon: XCircle, colorClass: "bg-muted text-muted-foreground" },
};

const AUDIT_STATUS_LABELS: Record<string, string> = {
  new: "New",
  assigned: "Assigned",
  pfa_in_progress: "PFA In Progress",
  under_review: "Under Review",
  escalated: "Escalated",
  resolved: "Resolved",
  closed: "Closed",
};

function AuditTimeline({ incidentId, userRole }: { incidentId: string; userRole: UserRole }) {
  // Only staff can view audit trail
  const canView = ["counselor", "program_lead", "executive_director"].includes(userRole);
  const { data: auditEntries } = useSupabaseQuery(
    async () => {
      const { data } = await supabase
        .from('audit_log')
        .select('*')
        .eq('incident_id', incidentId)
        .order('created_at', { ascending: false });
      return data ?? [];
    }
  );

  if (!canView || !auditEntries || auditEntries.length === 0) return null;

  return (
    <div className="px-4 mb-5">
      <div className="flex items-center gap-2 mb-3">
        <ScrollText className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Activity Timeline
        </h2>
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="divide-y divide-border">
          {auditEntries.map((entry) => {
            const config = AUDIT_ACTION_CONFIG[entry.action] ?? AUDIT_ACTION_CONFIG.status_changed;
            const Icon = config.icon;
            return (
              <div key={entry.id} className="flex items-start gap-3 px-4 py-3">
                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5", config.colorClass)}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">{entry.performedByName}</span>
                    {entry.action === "created" && " submitted this incident"}
                    {entry.action === "assigned" && ` assigned to ${entry.newValue ?? "counselor"}`}
                    {entry.action === "status_changed" && (
                      <span className="text-muted-foreground">
                        {" "}changed status: {AUDIT_STATUS_LABELS[entry.previousValue ?? ""] ?? entry.previousValue} → {AUDIT_STATUS_LABELS[entry.newValue ?? ""] ?? entry.newValue}
                      </span>
                    )}
                    {entry.action === "escalated" && <span className="text-destructive font-medium"> escalated</span>}
                    {entry.action === "note_added" && <span className="text-muted-foreground"> added a note</span>}
                    {entry.action === "resolved" && <span className="text-green-700"> resolved</span>}
                    {entry.action === "closed" && <span className="text-muted-foreground"> closed</span>}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(new Date(entry.timestamp), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function WorkflowPanel({
  incidentId,
  currentStatus,
  userRole,
  currentAssigneeId,
}: {
  incidentId: string;
  currentStatus: WorkflowStatus;
  userRole: UserRole;
  currentAssigneeId: string | undefined;
}) {
  const [note, setNote] = useState("");
  const [selectedUser, setSelectedUser] = useState<string>("none");
  const [busy, setBusy] = useState(false);

  const updateStatus = useSupabaseMutation(
    async ({ incidentId, status, notes }: { incidentId: string; status: string; notes?: string }) => {
      const { data, error } = await supabase
        .from('incidents')
        .update({ status, notes, updated_at: new Date().toISOString() })
        .eq('id', incidentId)
        .select()
        .single();
      if (error) throw error;
      await supabase.from('audit_log').insert({
        incident_id: incidentId,
        action: 'status_changed',
        new_value: status,
        notes: notes || null,
      });
      return data;
    }
  );

  const assignIncident = useSupabaseMutation(
    async ({ incidentId, assignedTo }: { incidentId: string; assignedTo: string }) => {
      const { data, error } = await supabase
        .from('incidents')
        .update({ assigned_to: assignedTo, status: 'assigned', updated_at: new Date().toISOString() })
        .eq('id', incidentId)
        .select()
        .single();
      if (error) throw error;
      await supabase.from('audit_log').insert({
        incident_id: incidentId,
        action: 'assigned',
        new_value: assignedTo,
      });
      return data;
    }
  );

  const addNote = useSupabaseMutation(
    async ({ incidentId, note }: { incidentId: string; note: string }) => {
      const { data, error } = await supabase
        .from('incidents')
        .update({ notes: note, updated_at: new Date().toISOString() })
        .eq('id', incidentId)
        .select()
        .single();
      if (error) throw error;
      await supabase.from('audit_log').insert({
        incident_id: incidentId,
        action: 'note_added',
        new_value: note,
      });
      return data;
    }
  );

  // Only program_lead/exec_dir can see all users for assignment
  const canAssign = ["program_lead", "executive_director"].includes(userRole);
  const { data: users } = useSupabaseQuery(
    async () => {
      const { data } = await supabase.from('users').select('*').order('name');
      return data ?? [];
    }
  );

  const counselors = users?.filter(
    (u) => ["counselor", "program_lead", "executive_director"].includes(u.role) && u.isActive
  ) ?? [];

  const doStatus = async (status: WorkflowStatus, extraNote?: string) => {
    setBusy(true);
    try {
      await updateStatus.mutateAsync({
        incidentId,
        status,
        notes: extraNote || note || undefined,
      });
      setNote("");
      toast.success(`Status updated to: ${STATUS_CONFIG[status]?.label ?? status}`);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setBusy(false);
    }
  };

  const doAssign = async () => {
    if (!selectedUser || selectedUser === "none") {
      toast.error("Please select a counselor");
      return;
    }
    setBusy(true);
    try {
      await assignIncident.mutateAsync({
        incidentId,
        assignedTo: selectedUser as string,
      });
      setSelectedUser("none");
      toast.success("Incident assigned successfully");
    } catch {
      toast.error("Failed to assign incident");
    } finally {
      setBusy(false);
    }
  };

  const doAddNote = async () => {
    if (!note.trim()) { toast.error("Please enter a note"); return; }
    setBusy(true);
    try {
      await addNote.mutateAsync({ incidentId, note: note.trim() });
      setNote("");
      toast.success("Note added");
    } catch {
      toast.error("Failed to add note");
    } finally {
      setBusy(false);
    }
  };

  if (userRole === "volunteer") return null;

  return (
    <div className="w-full px-4 pt-6 mb-5">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        Workflow Actions
      </h2>

      <div className="space-y-3">
        {/* Counselor: status progression */}
        {userRole === "counselor" && currentStatus === "assigned" && (
          <button
            onClick={() => doStatus("pfa_in_progress")}
            disabled={busy}
            className="w-full flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-accent/30 transition-all text-left"
          >
            <ArrowRightCircle className="h-5 w-5 text-primary flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold">Start PFA</p>
              <p className="text-xs text-muted-foreground">Begin Psychosocial First Aid and safety planning</p>
            </div>
          </button>
        )}

        {userRole === "counselor" && currentStatus === "pfa_in_progress" && (
          <button
            onClick={() => doStatus("under_review")}
            disabled={busy}
            className="w-full flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-accent/30 transition-all text-left"
          >
            <ArrowRightCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold">Submit for Review</p>
              <p className="text-xs text-muted-foreground">Request senior staff review</p>
            </div>
          </button>
        )}

        {/* Program lead / exec director actions */}
        {canAssign && (
          <>
            {/* Assign to counselor */}
            {["new", "assigned"].includes(currentStatus) && (
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-semibold">
                    {currentAssigneeId ? "Reassign Incident" : "Assign to Counselor"}
                  </p>
                </div>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select a counselor..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select a counselor</SelectItem>
                    {counselors.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name ?? c.email ?? c.id} ({c.role?.replace("_", " ")})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={doAssign}
                  disabled={busy || selectedUser === "none"}
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Assign Counselor
                </Button>
              </div>
            )}

            {/* Escalate */}
            {!["escalated", "resolved", "closed"].includes(currentStatus) && (
              <button
                onClick={() => doStatus("escalated")}
                disabled={busy}
                className="w-full flex items-center gap-3 p-4 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 transition-all text-left"
              >
                <ShieldAlert className="h-5 w-5 text-red-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-800">Escalate Incident</p>
                  <p className="text-xs text-red-600">Mark as urgent — notifies senior staff</p>
                </div>
              </button>
            )}

            {/* Resolve */}
            {['escalated', 'under_review'].includes(currentStatus) && (
              <button
                onClick={() => doStatus("resolved")}
                disabled={busy}
                className="w-full flex items-center gap-3 p-4 rounded-xl border border-green-200 bg-green-50 hover:bg-green-100 transition-all text-left"
              >
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-800">Mark as Resolved</p>
                  <p className="text-xs text-green-600">Case has been addressed</p>
                </div>
              </button>
            )}

            {/* Close */}
            {currentStatus === "resolved" && (
              <button
                onClick={() => doStatus("closed")}
                disabled={busy}
                className="w-full flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-all text-left"
              >
                <XCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold">Close Case</p>
                  <p className="text-xs text-muted-foreground">Archive this incident</p>
                </div>
              </button>
            )}
          </>
        )}

        {/* Add note (all staff) */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <MessageSquarePlus className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-semibold">Add Note</p>
          </div>
          <Textarea
            placeholder="Add an observation, action taken, or case update..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="resize-none text-sm"
          />
          <Button
            size="sm"
            variant="secondary"
            className="w-full"
            onClick={doAddNote}
            disabled={busy || !note.trim()}
          >
            <MessageSquarePlus className="h-4 w-4 mr-2" />
            Save Note
          </Button>
        </div>
      </div>
    </div>
  );
}

const SEVERITY_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  low: { label: "Low", color: "text-green-700", bg: "bg-green-100", border: "border-green-200" },
  medium: { label: "Medium", color: "text-amber-700", bg: "bg-amber-100", border: "border-amber-200" },
  high: { label: "High", color: "text-orange-700", bg: "bg-orange-100", border: "border-orange-200" },
  critical: { label: "Critical", color: "text-red-700", bg: "bg-red-100", border: "border-red-200" },
};

const URGENCY_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  routine: { label: "Routine", color: "text-blue-700", bg: "bg-blue-100", border: "border-blue-200" },
  urgent: { label: "Urgent", color: "text-amber-700", bg: "bg-amber-100", border: "border-amber-200" },
  emergency: { label: "Emergency", color: "text-red-700", bg: "bg-red-100", border: "border-red-200" },
};

function RiskAssessmentCard({ incident }: { incident: Record<string, any> }) {
  const riskScore = incident.risk_score as number | undefined ?? 0;
  const severity = incident.severity as string | undefined ?? "low";
  const urgency = incident.urgency as string | undefined ?? "routine";
  const riskFactors = (incident.risk_factors as string[]) ?? [];
  const recommendedActions = (incident.recommended_actions as string[]) ?? [];
  const assessedAt = incident.ai_assessed_at as string | undefined;

  const sev = SEVERITY_CONFIG[severity] ?? SEVERITY_CONFIG.low;
  const urg = URGENCY_CONFIG[urgency] ?? URGENCY_CONFIG.routine;

  const barColor =
    riskScore >= 75 ? "bg-red-500" :
    riskScore >= 50 ? "bg-orange-500" :
    riskScore >= 25 ? "bg-amber-500" :
    "bg-green-500";

  return (
    <div className="mx-4 mb-4 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Risk Assessment</h3>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1.5">Risk Score</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", barColor)}
                style={{ width: `${Math.min(riskScore, 100)}%` }}
              />
            </div>
            <span className="text-lg font-bold text-foreground tabular-nums">{riskScore}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Severity</p>
            <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full border", sev.color, sev.bg, sev.border)}>
              {sev.label}
            </span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Urgency</p>
            <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full border", urg.color, urg.bg, urg.border)}>
              {urg.label}
            </span>
          </div>
        </div>
      </div>

      {riskFactors.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-muted-foreground mb-1.5">Risk Factors</p>
          <ul className="space-y-1">
            {riskFactors.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <AlertOctagon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {recommendedActions.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-muted-foreground mb-1.5">Recommended Actions</p>
          <ol className="space-y-1 list-decimal list-inside">
            {recommendedActions.map((a, i) => (
              <li key={i} className="text-sm text-foreground">{a}</li>
            ))}
          </ol>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground mt-3">
        Assessed by Gemini 2.5 via Tich Labs MCP
        {assessedAt && <span> · {format(new Date(assessedAt), "MMM d, yyyy 'at' h:mm a")}</span>}
      </p>
    </div>
  );
}

function IncidentDetailInner({ incidentId }: { incidentId: string }) {
  const navigate = useNavigate();
  const { data: incident } = useSupabaseQueryCamel(
    async () => {
      const { data } = await supabase.from('incidents').select('*').eq('id', incidentId).single();
      return data;
    }
  );
  const { data: user } = useSupabaseQueryCamel(supabaseQueries.getCurrentUser);
  const { data: services } = useSupabaseQueryCamel(
    async () => {
      const { data } = await supabase.from('referral_services').select('*').order('name');
      return data ?? [];
    }
  );

  if (incident === undefined || user === undefined) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (incident === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center gap-3">
        <AlertTriangle className="h-10 w-10 text-muted-foreground/40" />
        <p className="font-semibold">Incident not found</p>
        <Button variant="secondary" size="sm" onClick={() => navigate("/incidents")}>
          Back to List
        </Button>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[incident.status] ?? { label: incident.status, className: "" };
  const refId = incidentId.slice(-8).toUpperCase();
  const typeLabel = INCIDENT_TYPE_LABELS[incident.incidentType] ?? incident.incidentType;
  const userRole = (user?.role ?? "volunteer") as UserRole;

  return (
    <div className="pb-8 px-4 sm:px-6 lg:px-8 w-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 flex-shrink-0"
          onClick={() => navigate("/incidents")}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold truncate">{typeLabel}</h1>
          <p className="text-xs text-muted-foreground">Ref #{refId}</p>
        </div>
        <span
          className={cn(
            "text-xs font-medium px-2 py-0.5 rounded-full border flex-shrink-0",
            statusConfig.className
          )}
        >
          {statusConfig.label}
        </span>
      </div>

      {/* Workflow progress */}
      <div className="mt-4">
        <WorkflowProgress status={incident.status} isEscalated={incident.isEscalated} />
      </div>

      {/* Case summary */}
      <div className="mt-4 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Case summary</p>
            <p className="mt-2 text-sm font-medium text-foreground">Key incident details and next step guidance.</p>
          </div>
          <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full border", statusConfig.className)}>
            {statusConfig.label}
          </span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-background p-3">
            <p className="text-xs text-muted-foreground">Assigned</p>
            <p className="text-sm font-medium text-foreground">{incident.assigneeName ?? "Unassigned"}</p>
          </div>
          <div className="rounded-xl border border-border bg-background p-3">
            <p className="text-xs text-muted-foreground">Logged</p>
            <p className="text-sm font-medium text-foreground">{format(new Date(incident.createdAt), "MMM d, yyyy")}</p>
          </div>
          <div className="rounded-xl border border-border bg-background p-3">
            <p className="text-xs text-muted-foreground">Location</p>
            <p className="text-sm font-medium text-foreground">{incident.location}</p>
          </div>
          <div className="rounded-xl border border-border bg-background p-3">
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">Next step</p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="inline-flex items-center justify-center rounded-full bg-muted/80 p-1 text-muted-foreground hover:bg-muted">
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" align="center">
                  Psychosocial First Aid is immediate survivor support, safety planning, and needs assessment.
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-sm font-medium text-foreground">{WORKFLOW_STAGE_DESCRIPTIONS[incident.status as WorkflowStatus]}</p>
          </div>
        </div>
      </div>

      {/* Escalated banner */}
      {incident.isEscalated && (
        <div className="mx-4 mb-4 flex items-center gap-3 p-3 rounded-xl bg-red-50 border border-red-200">
          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-800">Escalated</p>
            {incident.escalatedAt && (
              <p className="text-xs text-red-600">
                {format(new Date(incident.escalatedAt), "MMM d, yyyy 'at' h:mm a")}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Risk assessment card */}
      {(incident as any).ai_status === "assessed" && <RiskAssessmentCard incident={incident as any} />}
      {(incident as any).ai_status === "pending" && (
        <div className="mx-4 mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-3">
            <Brain className="h-5 w-5 text-amber-600 animate-pulse" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Gemini 2.5 is assessing this incident…</p>
              <p className="text-xs text-amber-600">Risk analysis results will appear here shortly.</p>
            </div>
          </div>
        </div>
      )}
      {(incident as any).ai_status === "failed" && (
        <div className="mx-4 mb-4 rounded-xl border border-muted bg-muted/30 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Automated assessment unavailable</p>
              <p className="text-xs text-muted-foreground">Use the AI Assistant panel to assess manually.</p>
            </div>
          </div>
        </div>
      )}

      {/* Two-column layout: content (left) + workflow sidebar (right) */}
      <div className="lg:grid lg:grid-cols-[minmax(0,1.6fr)_360px] lg:gap-8 lg:items-start w-full">
        {/* Left column — incident data */}
        <div className="w-full min-w-0 overflow-hidden">
          <Section title="Incident Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailRow icon={Calendar} label="Date" value={incident.incidentDate} />
              {incident.incidentTime && (
                <DetailRow icon={Clock} label="Time" value={incident.incidentTime} />
              )}
              <DetailRow icon={MapPin} label="Location" value={incident.location} />
              <DetailRow
                icon={User}
                label="Survivor"
                value={`${incident.survivorAgeGroup.replace("_", " ")} · ${incident.survivorGender.replace("_", " ")}`}
              />
            {incident.reporterType && (
              <DetailRow
                icon={REPORTER_TYPE_ICONS[incident.reporterType] ?? User}
                label="Reporter"
                value={REPORTER_TYPE_LABELS[incident.reporterType] ?? incident.reporterType}
              />
            )}
            {incident.volunteerId && (
              <DetailRow icon={UserCheck} label="Volunteer ID" value={incident.volunteerId} />
            )}
            <DetailRow icon={User} label="Submitted By" value={incident.submitterName} />
            {incident.assigneeName && (
              <DetailRow icon={UserCheck} label="Assigned To" value={incident.assigneeName} />
            )}
            </div>
          </Section>

          {/* Description */}
          <div className="px-4 mb-5">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Description
            </h2>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {incident.description}
              </p>
            </div>
          </div>

          {/* Notes */}
          {incident.notes && (
            <div className="px-4 mb-5">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Case Notes
              </h2>
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {incident.notes}
                </p>
              </div>
            </div>
          )}

          {/* Resolved info */}
          {incident.resolvedAt && (
            <div className="px-4 mb-5">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                <p className="text-xs text-green-700 font-medium">
                  Resolved on {format(new Date(incident.resolvedAt), "MMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="px-4 pb-4">
            <p className="text-xs text-muted-foreground">
              Logged {format(new Date(incident.createdAt), "MMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
        </div>

        {/* Right column — workflow sidebar (desktop) */}
        <div className="hidden lg:block lg:w-[360px] lg:min-w-0">
          <div className="w-full">
            {user && user.role !== "pending" && (
              <WorkflowPanel
                incidentId={incidentId}
                currentStatus={incident.status as WorkflowStatus}
                userRole={userRole}
                currentAssigneeId={incident.assignedTo as string | undefined}
              />
            )}
          </div>
        </div>
      </div>

      {/* Desktop: AI recommendations and timeline in main content flow */}
      {services && services.length > 0 && (
        <AIRecommendations
          incident={incident}
          services={services}
          userRole={userRole}
        />
      )}

      <AuditTimeline incidentId={incidentId} userRole={userRole} />

      {/* Mobile: workflow items stacked below */}
      <div className="lg:hidden">
        {user && user.role !== "pending" && (
          <WorkflowPanel
            incidentId={incidentId}
            currentStatus={incident.status as WorkflowStatus}
            userRole={userRole}
            currentAssigneeId={incident.assignedTo as string | undefined}
          />
        )}

        {services && services.length > 0 && (
          <AIRecommendations
            incident={incident}
            services={services}
            userRole={userRole}
          />
        )}

        <AuditTimeline incidentId={incidentId} userRole={userRole} />
      </div>
    </div>
  );
}

export default function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <>
      <AuthLoading>
        <div className="p-4 space-y-4">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </AuthLoading>
      <Unauthenticated>
        <div className="flex items-center justify-center min-h-[60vh]">
          <SignInButton />
        </div>
      </Unauthenticated>
      <Authenticated>
        {id ? (
          <IncidentDetailInner incidentId={id as string} />
        ) : (
          <div className="flex items-center justify-center min-h-[60vh]">
            <Badge variant="destructive">Invalid incident ID</Badge>
          </div>
        )}
      </Authenticated>
    </>
  );
}
