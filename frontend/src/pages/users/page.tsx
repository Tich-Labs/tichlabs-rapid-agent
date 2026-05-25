import { useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Input } from "@/components/ui/input.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { toast } from "sonner";
import { cn } from "@/lib/utils.ts";
import { formatDistanceToNow } from "date-fns";
import { useSupabaseQueryCamel, useSupabaseMutation, supabaseQueries, supabaseMutations, ConvexError } from "@/hooks/use-supabase-query";
import { Authenticated, Unauthenticated, AuthLoading } from "@/components/auth-components";
import {
  Users,
  UserCheck,
  UserX,
  ShieldCheck,
  Clock,
  Mail,
  Search,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Eye,
  Star,
  Crown,
  Info,
  AlertTriangle,
} from "lucide-react";
// ─── Types & config ───────────────────────────────────────────────────────────

type UserRole =
  | "volunteer"
  | "counselor"
  | "program_lead"
  | "executive_director"
  | "pending";

type UserRecord = {
  id: string;
  name?: string;
  email?: string;
  role: UserRole;
  isActive: boolean;
  created_at?: string;
};

const ROLE_CONFIG: Record<
  UserRole,
  { label: string; badgeClass: string; icon: React.ElementType; desc: string }
> = {
  pending: {
    label: "Pending",
    badgeClass: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock,
    desc: "Awaiting role assignment — no system access",
  },
  volunteer: {
    label: "Volunteer",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-200",
    icon: ClipboardList,
    desc: "Log incidents & view their own submissions",
  },
  counselor: {
    label: "Counselor",
    badgeClass: "bg-purple-100 text-purple-800 border-purple-200",
    icon: Eye,
    desc: "View all incidents, add notes, update status",
  },
  program_lead: {
    label: "Program Lead",
    badgeClass: "bg-orange-100 text-orange-800 border-orange-200",
    icon: Star,
    desc: "Assign incidents, manage users, access reports",
  },
  executive_director: {
    label: "Exec. Director",
    badgeClass: "bg-red-100 text-red-800 border-red-200",
    icon: Crown,
    desc: "Full system access — all features enabled",
  },
};

const ASSIGNABLE_ROLES: UserRole[] = [
  "volunteer",
  "counselor",
  "program_lead",
  "executive_director",
  "pending",
];

// ─── Role badge ───────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: UserRole }) {
  const cfg = ROLE_CONFIG[role] ?? { label: role, badgeClass: "" };
  return (
    <span
      className={cn(
        "text-sm font-medium px-2 py-0.5 rounded-full border",
        cfg.badgeClass
      )}
    >
      {cfg.label}
    </span>
  );
}

// ─── Role permissions reference ───────────────────────────────────────────────

function RolePermissionsGuide() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mx-4 my-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-sm text-muted-foreground hover:bg-muted/60 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Info className="h-3.5 w-3.5" />
          <span className="font-medium text-foreground text-sm">Role Permissions Guide</span>
        </div>
        {open ? (
          <ChevronUp className="h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" />
        )}
      </button>

      {open && (
        <div className="mt-2 rounded-xl border border-border bg-card overflow-hidden">
          {(
            [
              "volunteer",
              "counselor",
              "program_lead",
              "executive_director",
            ] as UserRole[]
          ).map((role) => {
            const cfg = ROLE_CONFIG[role];
            const Icon = cfg.icon;
            return (
              <div
                key={role}
                className="flex items-start gap-3 px-4 py-3 border-b border-border last:border-0"
              >
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border",
                    cfg.badgeClass
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{cfg.label}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{cfg.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Pending user card (quick approve) ───────────────────────────────────────

function PendingUserCard({
  user,
  onApprove,
}: {
  user: UserRecord;
  onApprove: (userId: string, role: UserRole) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

  const handleQuickApprove = async (role: UserRole) => {
    setBusy(true);
    await onApprove(user.id, role);
    setBusy(false);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-4 border-b border-yellow-100 last:border-0 bg-yellow-50/60">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-9 h-9 rounded-full bg-yellow-200 flex items-center justify-center flex-shrink-0 text-sm font-bold text-yellow-800">
          {user.name?.charAt(0)?.toUpperCase() ?? "?"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{user.name ?? "Unnamed User"}</p>
          {user.email && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground truncate">
              <Mail className="h-3 w-3 flex-shrink-0" />
              {user.email}
            </div>
          )}
          <p className="text-sm text-muted-foreground mt-0.5">
            Joined {user.created_at ? formatDistanceToNow(new Date(user.created_at), { addSuffix: true }) : "recently"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground hidden sm:block">Approve as:</span>
        <Button
          size="sm"
          variant="secondary"
          className="h-7 text-sm px-2.5"
          disabled={busy}
          onClick={() => void handleQuickApprove("volunteer")}
        >
          Volunteer
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="h-7 text-sm px-2.5"
          disabled={busy}
          onClick={() => void handleQuickApprove("counselor")}
        >
          Counselor
        </Button>
      </div>
    </div>
  );
}

// ─── Deactivation confirm dialog ──────────────────────────────────────────────

function DeactivateDialog({
  user,
  open,
  onClose,
  onConfirm,
}: {
  user: UserRecord | null;
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    setBusy(true);
    await onConfirm();
    setBusy(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            Deactivate User
          </DialogTitle>
          <DialogDescription>
            This will remove <strong>{user?.name ?? "this user"}</strong>'s access to the
            system. They will not be able to log in until reactivated. Their incident
            history will be preserved.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            onClick={() => void handleConfirm()}
            disabled={busy}
          >
            {busy ? "Deactivating..." : "Deactivate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Active user row ──────────────────────────────────────────────────────────

function UserRow({
  user,
  currentUserId,
  onDeactivateRequest,
}: {
  user: UserRecord;
  currentUserId: string | undefined;
  onDeactivateRequest: (user: UserRecord) => void;
}) {
  const [roleValue, setRoleValue] = useState<UserRole>(user.role);
  const [busy, setBusy] = useState(false);
  const updateRole = useSupabaseMutation(supabaseMutations.updateUserRole);
  const toggleActive = useSupabaseMutation(supabaseMutations.toggleUserActive);
  const isSelf = currentUserId === user.id;

  const handleRoleChange = async (newRole: string) => {
    const role = newRole as UserRole;
    setRoleValue(role);
    setBusy(true);
    try {
      await updateRole({ userId: user.id, role });
      toast.success(`Role updated to ${ROLE_CONFIG[role]?.label ?? role}`);
    } catch (err) {
      setRoleValue(user.role);
      if (err instanceof ConvexError) {
        toast.error((err.data as { message: string }).message);
      } else {
        toast.error("Failed to update role");
      }
    } finally {
      setBusy(false);
    }
  };

  const handleReactivate = async () => {
    setBusy(true);
    try {
      await toggleActive({ userId: user.id });
      toast.success("User reactivated");
    } catch (err) {
      if (err instanceof ConvexError) {
        toast.error((err.data as { message: string }).message);
      } else {
        toast.error("Failed to reactivate user");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-4 border-b border-border last:border-0 transition-colors hover:bg-muted/20",
        !user.isActive && "opacity-60"
      )}
    >
      {/* Avatar + info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className={cn(
            "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold",
            user.isActive
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}
        >
          {user.name?.charAt(0)?.toUpperCase() ?? "?"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold truncate">
              {user.name ?? "Unnamed User"}
            </span>
            {isSelf && <span className="text-sm text-muted-foreground">(you)</span>}
            {!user.isActive && (
              <span className="text-sm text-destructive font-medium">Inactive</span>
            )}
          </div>
          {user.email && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground truncate mt-0.5">
              <Mail className="h-3 w-3 flex-shrink-0" />
              {user.email}
            </div>
          )}
          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
            <Clock className="h-3 w-3 flex-shrink-0" />
            Joined {user.created_at ? formatDistanceToNow(new Date(user.created_at), { addSuffix: true }) : "recently"}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Select
          value={roleValue}
          onValueChange={(v) => void handleRoleChange(v)}
          disabled={busy || isSelf || !user.isActive}
        >
          <SelectTrigger className="h-8 text-sm w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ASSIGNABLE_ROLES.map((r) => (
              <SelectItem key={r} value={r} className="text-sm">
                {ROLE_CONFIG[r].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {user.isActive ? (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDeactivateRequest(user)}
            disabled={busy || isSelf}
            title="Deactivate user"
          >
            <UserX className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-green-600 hover:text-green-600 hover:bg-green-50"
            onClick={() => void handleReactivate()}
            disabled={busy}
            title="Reactivate user"
          >
            <UserCheck className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Filter types ─────────────────────────────────────────────────────────────

type FilterTab = "all" | "active" | "inactive";

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: "all", label: "All Users" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

// ─── Inner page ───────────────────────────────────────────────────────────────

function UsersInner() {
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [deactivateTarget, setDeactivateTarget] = useState<UserRecord | null>(null);

  const { data: users, isLoading: usersLoading } = useSupabaseQueryCamel(supabaseQueries.listUsers);
  const { data: currentUser } = useSupabaseQueryCamel(supabaseQueries.getCurrentUser);
  const updateRole = useSupabaseMutation(supabaseMutations.updateUserRole);
  const toggleActive = useSupabaseMutation(supabaseMutations.toggleUserActive);

  const pendingUsers = (users ?? []).filter((u) => u.role === "pending");
  const nonPendingUsers = (users ?? []).filter((u) => u.role !== "pending");

  const searchLower = search.trim().toLowerCase();
  const filteredUsers = nonPendingUsers.filter((u) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "active" && u.isActive) ||
      (filter === "inactive" && !u.isActive);
    const matchesSearch =
      !searchLower ||
      (u.name ?? "").toLowerCase().includes(searchLower) ||
      (u.email ?? "").toLowerCase().includes(searchLower);
    return matchesFilter && matchesSearch;
  });

  const activeCount = nonPendingUsers.filter((u) => u.isActive).length;

  const handleQuickApprove = async (userId: string, role: UserRole) => {
    try {
      await updateRole({ userId, role });
      toast.success(`User approved as ${ROLE_CONFIG[role].label}`);
    } catch (err) {
      if (err instanceof ConvexError) {
        toast.error((err.data as { message: string }).message);
      } else {
        toast.error("Failed to approve user");
      }
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!deactivateTarget) return;
    try {
      await toggleActive({ userId: deactivateTarget.id });
      toast.success(`${deactivateTarget.name ?? "User"} deactivated`);
    } catch (err) {
      if (err instanceof ConvexError) {
        toast.error((err.data as { message: string }).message);
      } else {
        toast.error("Failed to deactivate user");
      }
    }
    setDeactivateTarget(null);
  };

  return (
    <div className="pb-10 max-w-2xl mx-auto">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 border-b border-border">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl font-bold">User Management</h1>
            <p className="text-sm text-muted-foreground">
              Manage roles and access for all staff &amp; volunteers
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted text-sm font-medium flex-shrink-0">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{users?.length ?? 0} users</span>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      {/* Summary chips */}
      <div className="px-4 py-3 flex items-center gap-2 flex-wrap border-b border-border">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 border border-green-200 text-sm text-green-700">
          <ShieldCheck className="h-3 w-3" />
          {activeCount} active
        </div>
        {pendingUsers.length > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-50 border border-yellow-200 text-sm text-yellow-700">
            <Clock className="h-3 w-3" />
            {pendingUsers.length} pending approval
          </div>
        )}
      </div>

      {/* Role permissions guide */}
      <RolePermissionsGuide />

      {/* Pending approval section */}
      {pendingUsers.length > 0 && users !== undefined && (
        <div className="mx-4 mb-4">
          <Card className="border-yellow-200 overflow-hidden pt-0">
            <div className="px-4 py-3 bg-yellow-50 border-b border-yellow-100 flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-yellow-800">
                  {pendingUsers.length} user{pendingUsers.length > 1 ? "s" : ""} awaiting role assignment
                </p>
                <p className="text-sm text-yellow-700">
                  Assign a role to grant system access
                </p>
              </div>
              <Badge className="bg-yellow-200 text-yellow-800 border-0 text-sm">
                {pendingUsers.length}
              </Badge>
            </div>
            <div>
              {pendingUsers.map((u) => (
                <PendingUserCard
                  key={u.id}
                  user={u as UserRecord}
                  onApprove={(id, role) => handleQuickApprove(id, role)}
                />
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Filter tabs */}
      <div className="border-b border-border overflow-x-auto">
        <div className="flex px-4 py-2 gap-1 min-w-max">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                filter === tab.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* User list */}
      <div>
        {users === undefined ? (
          <div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-4 border-b border-border"
              >
                <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-8 w-36" />
              </div>
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
              <Users className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">No users found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {search
                ? `No results for "${search}"`
                : filter !== "all"
                ? "Try a different filter"
                : "No staff have signed up yet"}
            </p>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="mt-2 text-sm text-primary underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          filteredUsers.map((u) => (
            <UserRow
              key={u.id}
              user={u as UserRecord}
              currentUserId={currentUser?.id}
              onDeactivateRequest={setDeactivateTarget}
            />
          ))
        )}
      </div>

      {/* Deactivation confirmation */}
      <DeactivateDialog
        user={deactivateTarget}
        open={deactivateTarget !== null}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={handleConfirmDeactivate}
      />
    </div>
  );
}

// ─── Page wrapper ─────────────────────────────────────────────────────────────

export default function UsersPage() {
  return (
    <>
      <AuthLoading>
        <div className="p-6 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </AuthLoading>
      <Unauthenticated>
        <div className="flex items-center justify-center min-h-[60vh]">
          <SignInButton />
        </div>
      </Unauthenticated>
      <Authenticated>
        <UsersInner />
      </Authenticated>
    </>
  );
}
