import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty.tsx";
import { cn } from "@/lib/utils.ts";
import { format } from "date-fns";
import { usePaginatedQuery } from "@/hooks/use-supabase-query";
import { Authenticated, Unauthenticated, AuthLoading } from "@/components/auth-components";
import {
  ScrollText,
  FilePlus,
  ArrowRightLeft,
  UserPlus,
  ShieldAlert,
  StickyNote,
  CheckCircle2,
  XCircle,
  ChevronLeft,
} from "lucide-react";

// --- Action config ---
const ACTION_CONFIG: Record<string, { label: string; icon: React.ElementType; colorClass: string }> = {
  created: { label: "Created", icon: FilePlus, colorClass: "bg-blue-100 text-blue-700" },
  status_changed: { label: "Status Changed", icon: ArrowRightLeft, colorClass: "bg-amber-100 text-amber-700" },
  assigned: { label: "Assigned", icon: UserPlus, colorClass: "bg-purple-100 text-purple-700" },
  escalated: { label: "Escalated", icon: ShieldAlert, colorClass: "bg-red-100 text-red-700" },
  note_added: { label: "Note Added", icon: StickyNote, colorClass: "bg-slate-100 text-slate-700" },
  resolved: { label: "Resolved", icon: CheckCircle2, colorClass: "bg-green-100 text-green-700" },
  closed: { label: "Closed", icon: XCircle, colorClass: "bg-muted text-muted-foreground" },
};

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  assigned: "Assigned",
  pfa_in_progress: "PFA In Progress",
  under_review: "Under Review",
  escalated: "Escalated",
  resolved: "Resolved",
  closed: "Closed",
};

function AuditLogList() {
  const navigate = useNavigate();
  const { data: results, loading, error, fetchNextPage, hasMore, isFetchingNextPage } = usePaginatedQuery({
    collectionName: "audit_logs",
    pageSize: 30,
    orderByField: "createdAt",
    orderDirection: "desc",
  });

  const status = loading ? "LoadingFirstPage" : hasMore ? "CanLoadMore" : "Exhausted";

  if (error) {
    return (
      <div className="px-4">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon"><ScrollText /></EmptyMedia>
            <EmptyTitle>Failed to load audit log</EmptyTitle>
            <EmptyDescription>{error.message}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  if (status === "LoadingFirstPage") {
    return (
      <div className="space-y-3 px-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon"><ScrollText /></EmptyMedia>
          <EmptyTitle>No activity yet</EmptyTitle>
          <EmptyDescription>Audit entries will appear here as incidents are created, updated, and resolved.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="px-4 pb-8">
      <Card className="overflow-hidden p-0">
        <div className="divide-y divide-border">
          {results.map((entry) => {
            const config = ACTION_CONFIG[entry.action] ?? ACTION_CONFIG.status_changed;
            const Icon = config.icon;
            const refId = entry.incidentId.slice(-8).toUpperCase();

            return (
              <button
                key={entry._id}
                onClick={() => navigate(`/incidents/${entry.incidentId}`)}
                className="w-full flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left cursor-pointer"
              >
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5", config.colorClass)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <Badge variant="secondary" className="text-sm">{config.label}</Badge>
                    <span className="text-sm text-muted-foreground font-mono">#{refId}</span>
                  </div>
                  <p className="text-sm text-foreground truncate">
                    <span className="font-medium">{entry.performedByName}</span>
                    {entry.action === "assigned" && entry.newValue && (
                      <span className="text-muted-foreground"> assigned to {entry.newValue}</span>
                    )}
                    {entry.action === "status_changed" && entry.previousValue && entry.newValue && (
                      <span className="text-muted-foreground">
                        {" "}changed status: {STATUS_LABELS[entry.previousValue] ?? entry.previousValue} → {STATUS_LABELS[entry.newValue] ?? entry.newValue}
                      </span>
                    )}
                    {entry.action === "escalated" && (
                      <span className="text-destructive font-medium"> escalated this incident</span>
                    )}
                    {entry.action === "note_added" && entry.newValue && (
                      <span className="text-muted-foreground"> added a note: "{entry.newValue}"</span>
                    )}
                    {entry.action === "created" && (
                      <span className="text-muted-foreground"> submitted a new incident</span>
                    )}
                    {entry.action === "resolved" && (
                      <span className="text-green-700"> resolved this incident</span>
                    )}
                    {entry.action === "closed" && (
                      <span className="text-muted-foreground"> closed this incident</span>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {format(new Date(entry.timestamp), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {status === "CanLoadMore" && (
        <div className="flex justify-center mt-4">
          <Button variant="secondary" size="sm" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
            {isFetchingNextPage ? "Loading..." : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}

export default function AuditLogPage() {
  const navigate = useNavigate();

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate("/dashboard")}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2 flex-1">
          <ScrollText className="h-5 w-5 text-primary" />
          <div>
            <h1 className="text-base font-bold leading-tight">Audit Log</h1>
            <p className="text-sm text-muted-foreground">All system activity</p>
          </div>
        </div>
      </div>

      <div className="pt-4">
        <Authenticated>
          <AuditLogList />
        </Authenticated>
        <Unauthenticated>
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
            <p className="text-sm text-muted-foreground text-center">Sign in to view the audit log.</p>
            <SignInButton />
          </div>
        </Unauthenticated>
        <AuthLoading>
          <div className="space-y-3 px-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        </AuthLoading>
      </div>
    </div>
  );
}
