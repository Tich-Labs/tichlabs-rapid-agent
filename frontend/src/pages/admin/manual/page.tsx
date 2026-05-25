import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { cn } from "@/lib/utils.ts";
import { Authenticated, Unauthenticated, AuthLoading } from "@/components/auth-components";
import { useSupabaseQuery, useSupabaseQueryCamel } from "@/hooks/use-supabase-query";
import { supabaseQueries } from "@/hooks/use-supabase-query";
import {
  BookOpen,
  ShieldCheck,
  Users,
  ClipboardList,
  FileText,
  Workflow,
  ChevronRight,
  Heart,
  Monitor,
  Crown,
  Eye,
  Mail,
  Map,
  AlertTriangle,
  CheckCircle2,
  Info,
  ArrowRight,
  ArrowUpCircle,
  BarChart2,
  ChevronDown,
  Circle,
  CircleDot,
  ClipboardPlus,
  Clock,
  Database,
  UserCog,
  ExternalLink,
  FileDown,
  FileJson,
  Globe,
  HelpCircle,
  Layers,
  Lock,
  RefreshCw,
  Smartphone,
  Star,
  Sparkles,
  WifiOff,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type SectionId =
  | "overview"
  | "super-admin-setup"
  | "roles"
  | "users"
  | "incidents"
  | "reports"
  | "privacy"
  | "audit-log"
  | "emails"
  | "offline"
  | "architecture"
  | "roadmap"
  | "ai-assistant"
  | "support";

const SECTIONS: { id: SectionId; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview — Start Here", icon: Monitor },
  { id: "super-admin-setup", label: "Super Admin Setup", icon: Crown },
  { id: "roles", label: "Role Hierarchy", icon: Layers },
  { id: "users", label: "User Management", icon: Users },
  { id: "incidents", label: "Incident Workflow", icon: ClipboardList },
  { id: "reports", label: "Reports & Export", icon: BarChart2 },
  { id: "privacy", label: "Privacy & Safety", icon: ShieldCheck },
  { id: "audit-log", label: "Audit Log", icon: Eye },
  { id: "emails", label: "Email Notifications", icon: Mail },
  { id: "offline", label: "Offline Mode", icon: WifiOff },
  { id: "architecture", label: "Architecture", icon: Database },
  { id: "roadmap", label: "Roadmap", icon: Map },
  { id: "ai-assistant", label: "AI Assistant", icon: Sparkles },
  { id: "support", label: "Support", icon: HelpCircle },
];

// ─── Reusable primitives ──────────────────────────────────────────────────────

function SectionHeading({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-3 mb-6">
      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="h-4.5 w-4.5 text-primary" />
      </div>
      <div>
        <h2 className="text-lg font-bold leading-tight">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function InfoBox({ children, variant = "info" }: { children: React.ReactNode; variant?: "info" | "warn" | "success" }) {
  const styles = {
    info: "bg-blue-50 border-blue-200 text-blue-800",
    warn: "bg-amber-50 border-amber-200 text-amber-800",
    success: "bg-green-50 border-green-200 text-green-800",
  };
  const Icon = variant === "warn" ? AlertTriangle : variant === "success" ? CheckCircle2 : Info;
  return (
    <div className={cn("flex gap-2.5 px-4 py-3 rounded-xl border text-sm mb-4", styles[variant])}>
      <Icon className="h-4 w-4 flex-shrink-0 mt-0.5" />
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 mb-5">
      <div className="flex flex-col items-center gap-0">
        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
          {number}
        </div>
        <div className="w-px flex-1 bg-border mt-1.5 min-h-4" />
      </div>
      <div className="pb-4 flex-1 min-w-0">
        <p className="text-sm font-semibold mb-1">{title}</p>
        <div className="text-sm text-muted-foreground leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

function CodeChip({ children }: { children: React.ReactNode }) {
  return (
    <code className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono text-sm border border-border">
      {children}
    </code>
  );
}

function PermRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground w-32 flex-shrink-0">{label}</span>
      <div className="flex-1 text-sm leading-relaxed">{children}</div>
    </div>
  );
}

function Collapsible({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl mb-3 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/40 transition-colors text-left"
      >
        {title}
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="px-4 pb-4 pt-1 text-sm text-muted-foreground leading-relaxed">{children}</div>}
    </div>
  );
}

// ─── Section: Overview ────────────────────────────────────────────────────────

function SectionOverview() {
  const publicScreens = WALKTHROUGH_SCREENS.filter((s) => s.audience === "public");
  const adminScreens = WALKTHROUGH_SCREENS.filter((s) => s.audience === "admin");

  return (
    <div>
      <SectionHeading icon={Monitor} title="Overview — Start Here" subtitle="Guided tour and system overview" />

      {/* Start Here banner */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 border border-primary/20 mb-6">
        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
          <ArrowRight className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-primary">Start Here</p>
          <p className="text-sm text-muted-foreground">New to the platform? Walk through every screen below, then explore detailed sections in the sidebar.</p>
        </div>
      </div>

      {/* Demo Walkthrough integrated */}
      <p className="text-sm text-muted-foreground leading-relaxed mb-2">
        This walkthrough covers all pages in the Tich Labs Incident Tracker — both the public-facing
        screens accessible without sign-in, and the authenticated admin/staff pages. Use this
        as a reference when demoing the app to funders, partners, or new team members.
      </p>

      <InfoBox variant="info">
        Click the <strong>Open Page</strong> button on any card to navigate directly to that screen
        in a new tab. All public pages work without signing in.
      </InfoBox>

      {/* Mobile note */}
      <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl border border-border bg-muted/30 mb-6 mt-4">
        <Smartphone className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground leading-relaxed">
          <strong>Mobile-responsive:</strong> All pages adapt to phone and tablet screens.
          The landing page stacks vertically, the incident form uses a 2-column icon grid,
          and the dashboard uses a hamburger menu with bottom navigation.
        </p>
      </div>

      {/* Public Pages */}
      <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
        <Globe className="h-4 w-4 text-primary" />
        Public-Facing Pages
        <span className="text-sm text-muted-foreground font-normal">(no sign-in required)</span>
      </h3>

      <div className="space-y-4 mb-8">
        {publicScreens.map((screen, i) => {
          const Icon = screen.icon;
          return (
            <div key={i} className="rounded-xl border border-border overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 bg-primary/5 border-b border-border">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{screen.title}</p>
                  <p className="text-sm text-muted-foreground font-mono">{screen.path}</p>
                </div>
                <a
                  href={screen.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer"
                >
                  Open Page
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="px-4 py-3">
                <p className="text-sm text-muted-foreground leading-relaxed mb-2.5">{screen.description}</p>
                <ul className="space-y-1">
                  {screen.features.map((f, fi) => (
                    <li key={fi} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {/* Admin Pages */}
      <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
        <Lock className="h-4 w-4 text-primary" />
        Admin / Staff Pages
        <span className="text-sm text-muted-foreground font-normal">(requires sign-in)</span>
      </h3>

      <div className="space-y-4 mb-8">
        {adminScreens.map((screen, i) => {
          const Icon = screen.icon;
          return (
            <div key={i} className="rounded-xl border border-border overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 bg-orange-50 border-b border-border">
                <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-3.5 w-3.5 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{screen.title}</p>
                  <p className="text-sm text-muted-foreground font-mono">{screen.path}</p>
                </div>
                <a
                  href={screen.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-orange-600 text-white text-sm font-medium hover:bg-orange-700 transition-colors cursor-pointer"
                >
                  Open Page
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="px-4 py-3">
                <p className="text-sm text-muted-foreground leading-relaxed mb-2.5">{screen.description}</p>
                <ul className="space-y-1">
                  {screen.features.map((f, fi) => (
                    <li key={fi} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="rounded-xl border border-border bg-muted/30 p-4 mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Monitor className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Summary</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Pages", value: "13" },
            { label: "Public Pages", value: "5" },
            { label: "Admin Pages", value: "8" },
            { label: "Languages", value: "2 (EN/SW)" },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="text-lg font-bold text-foreground">{value}</p>
              <p className="text-sm text-muted-foreground uppercase tracking-wide">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionSuperAdminSetup() {
  return (
    <div>
      <SectionHeading
        icon={Crown}
        title="Super Admin Setup"
        subtitle="How to bootstrap the first Executive Director account"
      />

      <InfoBox variant="warn">
        <strong>First-time setup only.</strong> This process is only needed once — when the system
        is first deployed and there are no admins yet. After the first Executive Director is created,
        all future role assignments can be done within the app.
      </InfoBox>

      <h3 className="text-sm font-semibold mb-1">Access credentials</h3>
      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
        Tich Labs Tracker uses <strong>secure institutional sign-in</strong> — there are no username and
        password combinations stored in the system. Access is granted through one of:
      </p>

      <div className="rounded-xl border border-border overflow-hidden mb-6">
        {[
          { icon: "G", label: "Google account", desc: "e.g. yourname@gmail.com or your organisation's Google Workspace email" },
          { icon: "M", label: "Microsoft account", desc: "e.g. yourname@outlook.com or your organisation's Microsoft 365 email" },
          { icon: Mail, label: "Email OTP", desc: "Enter any email address — receive a one-time code to sign in" },
        ].map(({ icon, label, desc }, i) => (
          <div key={i} className="flex items-start gap-3 px-4 py-3 border-b border-border last:border-0">
            <div className="w-7 h-7 rounded-full bg-muted border border-border flex items-center justify-center flex-shrink-0 text-sm font-bold mt-0.5">
              {typeof icon === "string" ? icon : <Mail className="h-3 w-3" />}
            </div>
            <div>
              <p className="text-sm font-medium">{label}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <h3 className="text-sm font-semibold mb-4">Step-by-step: create first Executive Director</h3>

      <Step number={1} title="Sign in to the app">
        Open the Tich Labs Tracker app and click <strong>Sign In</strong>. Sign in using your Google,
        Microsoft, or email account. Your account will be created with a <CodeChip>pending</CodeChip> role.
      </Step>

      <Step number={2} title="Open the Hercules App Builder">
        The person who built this app (your technical administrator) needs to open the app in the
        Hercules platform and click on the <strong>Database</strong> tab in the left sidebar.
      </Step>

      <Step number={3} title="Find your user record">
        In the Database tab, select the <CodeChip>users</CodeChip> table. Find your entry — it will
        show your name/email and <CodeChip>role: "pending"</CodeChip>.
      </Step>

      <Step number={4} title="Update your role">
        Double-click the <CodeChip>role</CodeChip> cell and change it from{" "}
        <CodeChip>pending</CodeChip> to <CodeChip>executive_director</CodeChip>. Press Enter to save.
        Also confirm <CodeChip>isActive</CodeChip> is set to <CodeChip>true</CodeChip>.
      </Step>

      <Step number={5} title="Refresh the app">
        Go back to the Tich Labs Tracker app and refresh the page. You will now have full Executive
        Director access and can approve all future users from within the app.
      </Step>

      <InfoBox variant="success">
        After this one-time setup, you can promote other users to Executive Director or Program Lead
        directly from the <strong>Users</strong> page — no database access required.
      </InfoBox>

      <div className="rounded-xl border border-border bg-muted/30 p-4 mt-2">
        <div className="flex items-center gap-2 mb-3">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Security note</p>
        </div>
        <ul className="space-y-2">
          {[
            "Never share your sign-in credentials with anyone.",
            "Always sign out on shared or public devices.",
            "Only grant Executive Director role to trusted, senior staff.",
            "Review active users regularly and deactivate leavers promptly.",
          ].map((note, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />
              {note}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── Section: Roles ───────────────────────────────────────────────────────────

function SectionRoles() {
  const roles: {
    label: string;
    value: string;
    icon: React.ElementType;
    badgeClass: string;
    desc: string;
    permissions: string[];
  }[] = [
    {
      label: "Executive Director",
      value: "executive_director",
      icon: Crown,
      badgeClass: "bg-red-100 text-red-800 border-red-200",
      desc: "Full system access. Responsible for strategic oversight and system administration.",
      permissions: [
        "View all incidents",
        "Assign incidents to counselors",
        "Update any incident status",
        "Escalate incidents",
        "Add notes to incidents",
        "Manage all users (approve, change role, deactivate)",
        "Access full reports and data export",
        "Promote users to any role including Executive Director",
      ],
    },
    {
      label: "Program Lead",
      value: "program_lead",
      icon: Star,
      badgeClass: "bg-orange-100 text-orange-800 border-orange-200",
      desc: "Senior staff responsible for case oversight, team management, and donor reporting.",
      permissions: [
        "View all incidents",
        "Assign incidents to counselors",
        "Update incident status",
        "Escalate incidents",
        "Add notes to incidents",
        "Manage users (approve, change role, deactivate)",
        "Access full reports and data export",
        "Cannot promote users to Executive Director",
      ],
    },
    {
      label: "Counselor",
      value: "counselor",
      icon: Eye,
      badgeClass: "bg-purple-100 text-purple-800 border-purple-200",
      desc: "Frontline staff who conduct PFA (Psychosocial First Aid) and manage case progress.",
      permissions: [
        "View all incidents",
        "Update status of assigned incidents",
        "Add notes to any incident",
        "Cannot assign incidents to others",
        "Cannot manage users",
        "Cannot access reports",
      ],
    },
    {
      label: "Volunteer",
      value: "volunteer",
      icon: ClipboardPlus,
      badgeClass: "bg-blue-100 text-blue-800 border-blue-200",
      desc: "Community volunteers who identify and report incidents in the field.",
      permissions: [
        "Log new incidents",
        "View only their own submissions",
        "Cannot view other users' incidents",
        "Cannot manage users",
        "Cannot access reports",
      ],
    },
    {
      label: "Pending",
      value: "pending",
      icon: Clock,
      badgeClass: "bg-yellow-100 text-yellow-800 border-yellow-200",
      desc: "Newly registered users awaiting role assignment. No system access until approved.",
      permissions: [
        "Can sign in to the app",
        "Sees 'awaiting activation' screen",
        "Cannot view or submit incidents",
        "Cannot access any data",
      ],
    },
  ];

  return (
    <div>
      <SectionHeading icon={Layers} title="Role Hierarchy" subtitle="What each role can do" />

      <p className="text-sm text-muted-foreground leading-relaxed mb-5">
        Every user in the system has one of five roles. Roles are assigned by Program Leads or
        Executive Directors after a user signs up. The hierarchy from most to least privileged is:
      </p>

      <div className="space-y-3">
        {roles.map((role) => {
          const Icon = role.icon;
          return (
            <Collapsible key={role.value} title={role.label}>
              <div className="flex items-center gap-2 mb-3">
                <span className={cn("text-sm font-medium px-2 py-0.5 rounded-full border", role.badgeClass)}>
                  {role.label}
                </span>
              </div>
              <p className="mb-3">{role.desc}</p>
              <ul className="space-y-1.5">
                {role.permissions.map((perm, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    {perm.startsWith("Cannot") ? (
                      <span className="text-destructive/60 font-bold flex-shrink-0 mt-0.5">✗</span>
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                    )}
                    {perm}
                  </li>
                ))}
              </ul>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}

// ─── Section: User Management ─────────────────────────────────────────────────

function SectionUsers() {
  return (
    <div>
      <SectionHeading icon={UserCog} title="User Management" subtitle="Approving, assigning roles, and managing access" />

      <InfoBox variant="info">
        User management is only available to <strong>Program Leads</strong> and{" "}
        <strong>Executive Directors</strong>. Navigate to <strong>Users</strong> in the sidebar.
      </InfoBox>

      <h3 className="text-sm font-semibold mb-3 mt-4">Approving new users</h3>
      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
        When someone signs up, they are placed in <strong>Pending</strong> status. You will see a
        yellow banner at the top of the Users page showing how many users are awaiting approval.
      </p>

      <div className="rounded-xl border border-border overflow-hidden mb-5">
        <div className="px-4 py-2.5 bg-muted/40 border-b border-border text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          How to approve a pending user
        </div>
        {[
          { step: "1", action: "Go to Users page from the sidebar" },
          { step: "2", action: "Look for the yellow 'Awaiting role assignment' card at the top" },
          { step: "3", action: "Click 'Volunteer' or 'Counselor' for quick approval" },
          { step: "4", action: "For other roles, find the user below and use the role dropdown" },
        ].map(({ step, action }) => (
          <div key={step} className="flex items-center gap-3 px-4 py-2.5 border-b border-border last:border-0 text-sm">
            <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
              {step}
            </span>
            {action}
          </div>
        ))}
      </div>

      <h3 className="text-sm font-semibold mb-3">Changing a user's role</h3>
      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
        Find the user in the Users page and use the role dropdown on the right side of their row.
        Changes take effect immediately — the user will see updated access on their next page load.
      </p>

      <h3 className="text-sm font-semibold mb-3">Deactivating a user</h3>
      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
        Click the red <strong>deactivate</strong> icon on a user's row. A confirmation dialog will
        appear. Deactivated users cannot sign in but their incident history is preserved. Use this
        for staff who have left the organisation.
      </p>

      <InfoBox variant="warn">
        You cannot deactivate your own account. If you need to remove the last Executive Director,
        first promote another user to Executive Director.
      </InfoBox>
    </div>
  );
}

// ─── Section: Incident Workflow ───────────────────────────────────────────────

function SectionIncidents() {
  const statuses = [
    { label: "New", color: "bg-blue-100 text-blue-800 border-blue-200", desc: "Incident has been submitted but not yet reviewed or assigned." },
    { label: "Assigned", color: "bg-purple-100 text-purple-800 border-purple-200", desc: "A Program Lead has assigned the incident to a Counselor." },
    { label: "PFA In Progress", color: "bg-amber-100 text-amber-800 border-amber-200", desc: "The Counselor is actively conducting Psychosocial First Aid." },
    { label: "Under Review", color: "bg-orange-100 text-orange-800 border-orange-200", desc: "PFA is complete; senior staff are reviewing next steps." },
    { label: "Escalated", color: "bg-red-100 text-red-800 border-red-200", desc: "High-severity incident — immediate action required from senior leadership." },
    { label: "Resolved", color: "bg-green-100 text-green-800 border-green-200", desc: "Incident has been addressed and case is resolved." },
    { label: "Closed", color: "bg-muted text-muted-foreground border-border", desc: "Case is archived. No further action required." },
  ];

  return (
    <div>
      <SectionHeading icon={ClipboardList} title="Incident Workflow" subtitle="From submission to resolution" />

      <h3 className="text-sm font-semibold mb-3">Incident statuses</h3>
      <div className="rounded-xl border border-border overflow-hidden mb-6">
        {statuses.map(({ label, color, desc }) => (
          <div key={label} className="flex items-start gap-3 px-4 py-3 border-b border-border last:border-0">
            <span className={cn("text-sm font-medium px-2 py-0.5 rounded-full border flex-shrink-0 mt-0.5", color)}>
              {label}
            </span>
            <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      <h3 className="text-sm font-semibold mb-3">Assigning an incident</h3>
      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
        Only <strong>Program Leads</strong> and <strong>Executive Directors</strong> can assign
        incidents. Open the incident, scroll to the <em>Assignment</em> section, select a Counselor
        from the dropdown, and click Assign. The Counselor will receive an email notification.
      </p>

      <h3 className="text-sm font-semibold mb-3">Escalating an incident</h3>
      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
        Use escalation for incidents involving immediate danger, legal requirements, or cases
        exceeding the organisation's response capacity. Escalation:
      </p>
      <ul className="space-y-1.5 mb-5">
        {[
          "Sets the status to 'Escalated'",
          "Sends an email alert to all Program Leads and Executive Directors",
          "Marks the incident with a red alert indicator across all views",
        ].map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
            <ArrowRight className="h-3.5 w-3.5 text-destructive flex-shrink-0 mt-0.5" />
            {item}
          </li>
        ))}
      </ul>

      <h3 className="text-sm font-semibold mb-3">Adding notes</h3>
      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
        Counselors, Program Leads, and Executive Directors can add timestamped notes to any
        incident. Notes are appended in order and cannot be deleted — this creates a full audit
        trail of all actions taken.
      </p>

      <InfoBox variant="info">
        Incident forms can be submitted <strong>anonymously</strong> by the public via the{" "}
        <strong>/incidents/new</strong> page. No account is required. Reporters select from three
        types: <strong>Self</strong> (survivor), <strong>On Behalf of Survivor</strong> (relative/friend),
        or <strong>Volunteer</strong> (field worker with a unique Volunteer ID). Self and on-behalf
        reporters can build a private reference code (initials + birth month + birth year) to track
        their report. Volunteers enter their Volunteer ID (e.g. <code>MARY-KM-001</code>) to group all
        their submissions under their volunteer profile without needing an account.
      </InfoBox>
    </div>
  );
}

// ─── Section: Reports ─────────────────────────────────────────────────────────

function SectionReports() {
  return (
    <div>
      <SectionHeading icon={BarChart2} title="Reports & Export" subtitle="Generating and downloading anonymized data" />

      <InfoBox variant="info">
        Reports are only available to <strong>Program Leads</strong> and{" "}
        <strong>Executive Directors</strong>. Navigate to <strong>Reports</strong> in the sidebar.
      </InfoBox>

      <h3 className="text-sm font-semibold mb-3 mt-4">What the Reports page shows</h3>
      <div className="rounded-xl border border-border overflow-hidden mb-5">
        {[
          { label: "Date range filter", desc: "Select any from/to date range to scope your analysis" },
          { label: "Incidents by type", desc: "Bar chart showing breakdown across all 10 incident categories" },
          { label: "Status distribution", desc: "How many cases are new, in-progress, resolved, or closed" },
          { label: "Age group breakdown", desc: "Survivor age demographics — fully anonymized" },
          { label: "Gender breakdown", desc: "Survivor gender statistics — no names or IDs stored" },
          { label: "Monthly trend", desc: "Line chart of incident volume over time" },
        ].map(({ label, desc }) => (
          <PermRow key={label} label={label}>{desc}</PermRow>
        ))}
      </div>

      <h3 className="text-sm font-semibold mb-3">Exporting to CSV</h3>
      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
        Click the <strong>Export CSV</strong> button on the Reports page to download a spreadsheet
        of all incidents in the selected date range. The export:
      </p>
      <ul className="space-y-1.5 mb-5">
        {[
          "Contains no personally identifiable information (PII)",
          "Includes incident reference ID, type, location, age group, gender, status, and dates",
          "Can be opened in Microsoft Excel, Google Sheets, or LibreOffice Calc",
          "Is suitable for donor reports and internal reviews",
        ].map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
            <FileDown className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
            {item}
          </li>
        ))}
      </ul>

      <InfoBox variant="warn">
        Data exports should be handled in compliance with your organisation's data protection
        policy. Store exported files securely and do not share publicly.
      </InfoBox>
    </div>
  );
}

// ─── Section: Privacy & Safety ────────────────────────────────────────────────

function SectionPrivacy() {
  return (
    <div>
      <SectionHeading icon={ShieldCheck} title="Privacy & Safety" subtitle="Features protecting reporters and survivors" />

      <p className="text-sm text-muted-foreground leading-relaxed mb-5">
        Tich Labs Tracker is designed with survivor-centred safety principles. Multiple layers of
        protection ensure that sensitive data cannot be accidentally exposed — even if a device
        is left unattended.
      </p>

      <h3 className="text-sm font-semibold mb-3">Quick Exit button</h3>
      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
        A red <strong>Quick Exit</strong> button is always visible in the top-right corner of
        every page. When pressed it:
      </p>
      <ul className="space-y-1.5 mb-5">
        {[
          "Clears the current browser session immediately",
          "Redirects the browser to a safe external site (Google)",
          "Cannot be undone — the user must sign in again",
        ].map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
            <ArrowRight className="h-3.5 w-3.5 text-destructive flex-shrink-0 mt-0.5" />
            {item}
          </li>
        ))}
      </ul>

      <InfoBox variant="info">
        <strong>For field volunteers:</strong> Tell community members about the Quick Exit
        button during outreach. It is especially important for survivors sharing a device
        with their abuser.
      </InfoBox>

      <h3 className="text-sm font-semibold mb-3 mt-4">Safety consent screen</h3>
      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
        Before accessing the incident form, every user (including staff) sees a consent
        screen explaining:
      </p>
      <ul className="space-y-1.5 mb-5">
        {[
          "What data will be collected and why",
          "That reports can be fully anonymous",
          "That using a private/incognito window is recommended in shared environments",
          "That the Quick Exit button exists for emergencies",
        ].map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />
            {item}
          </li>
        ))}
      </ul>

      <h3 className="text-sm font-semibold mb-3">Anonymous reporting</h3>
      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
        The incident form is accessible at <CodeChip>/incidents/safety</CodeChip> without
        any sign-in. No account, name, or contact information is required. Every submission
        begins with the reporter selecting their role: <strong>Self</strong> (survivor),
        <strong> On Behalf of Survivor</strong> (relative/friend), or <strong>Volunteer</strong>
        (field worker with a unique Volunteer ID). Reporters may optionally provide an email
        for a confirmation message — but this is never mandatory.
      </p>
      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
        Self and on-behalf reporters can build a private reference code from their initials,
        birth month, and birth year (e.g. NT111974) so they can follow up without revealing
        their identity. Volunteers instead enter their unique Volunteer ID (e.g.{" "}
        <CodeChip>MARY-KM-001</CodeChip>), which associates all their reports with their
        volunteer profile — no account required.
      </p>

      <h3 className="text-sm font-semibold mb-3">Data minimisation</h3>
      <div className="rounded-xl border border-border overflow-hidden mb-5">
        {[
          { label: "No IP logging", desc: "The app does not store IP addresses of reporters" },
          { label: "No PII in exports", desc: "CSV exports contain anonymised aggregate data only" },
          { label: "Minimal survivor info", desc: "Only age group and gender are recorded — never names or ID numbers" },
          { label: "Role-scoped access", desc: "Volunteers can only see their own submissions" },
        ].map(({ label, desc }) => (
          <PermRow key={label} label={label}>{desc}</PermRow>
        ))}
      </div>

      <InfoBox variant="warn">
        <strong>Staff responsibility:</strong> Never share screenshots, exported data, or
        incident details via personal messaging apps (WhatsApp, Telegram). Use only the
        secure in-app channels for case discussion.
      </InfoBox>
    </div>
  );
}

// ─── Section: Audit Log ──────────────────────────────────────────────────────

function SectionAuditLog() {
  return (
    <div>
      <SectionHeading icon={Eye} title="Audit Log" subtitle="Tracking who did what and when" />

      <p className="text-sm text-muted-foreground leading-relaxed mb-5">
        Every significant action in the system is automatically recorded in a tamper-resistant
        audit log. This creates accountability, supports compliance, and helps investigate
        any irregularities.
      </p>

      <h3 className="text-sm font-semibold mb-3">What is logged</h3>
      <div className="rounded-xl border border-border overflow-hidden mb-5">
        {[
          { label: "Incident created", desc: "New report submitted — records reporter type (self, on_behalf, or volunteer) and volunteer ID if applicable" },
          { label: "Status changed", desc: "Any status transition (e.g. New → Assigned, PFA → Resolved)" },
          { label: "Incident assigned", desc: "Case assigned to a specific counselor" },
          { label: "Note added", desc: "Staff member added a note to an incident" },
        ].map(({ label, desc }) => (
          <PermRow key={label} label={label}>{desc}</PermRow>
        ))}
      </div>

      <h3 className="text-sm font-semibold mb-3">Accessing the audit log</h3>
      <div className="space-y-0">
        <Step number={1} title="Global audit log">
          Navigate to <strong>Audit Log</strong> in the sidebar. This shows all system activity
          in reverse chronological order. Use it for organisational oversight and compliance.
        </Step>
        <Step number={2} title="Per-incident timeline">
          Open any incident and scroll down to the <strong>Activity Timeline</strong> section.
          This shows only the actions related to that specific case.
        </Step>
      </div>

      <h3 className="text-sm font-semibold mb-3 mt-2">Each audit entry shows</h3>
      <div className="rounded-xl border border-border overflow-hidden mb-5">
        {[
          { label: "Action type", desc: "What happened (created, assigned, status changed, note added)" },
          { label: "Performer", desc: "Who did it — name and role" },
          { label: "Timestamp", desc: "Exact date and time the action was performed" },
          { label: "Changes", desc: "Previous and new values (e.g. status went from New to Assigned)" },
          { label: "Incident link", desc: "Direct link to the associated incident" },
        ].map(({ label, desc }) => (
          <PermRow key={label} label={label}>{desc}</PermRow>
        ))}
      </div>

      <InfoBox variant="info">
        Audit entries <strong>cannot be edited or deleted</strong> by anyone — including
        Executive Directors. This ensures the integrity of the accountability trail.
      </InfoBox>

      <InfoBox variant="warn">
        Only <strong>Program Leads</strong> and <strong>Executive Directors</strong> can
        view the global audit log. Counselors can see per-incident timelines for cases
        they are assigned to.
      </InfoBox>
    </div>
  );
}

// ─── Section: Email Notifications ────────────────────────────────────────────

function SectionEmails() {
  return (
    <div>
      <SectionHeading icon={Mail} title="Email Notifications" subtitle="Automated alerts for incidents" />

      <p className="text-sm text-muted-foreground leading-relaxed mb-5">
        The system sends automated email notifications at key moments in the incident
        lifecycle. These help ensure timely responses and keep senior staff informed.
      </p>

      <h3 className="text-sm font-semibold mb-3">When emails are sent</h3>
      <div className="rounded-xl border border-border overflow-hidden mb-5">
        {[
          { label: "New incident", desc: "All Program Leads and Executive Directors are notified when a new incident is submitted" },
          { label: "Assignment", desc: "The assigned Counselor receives a notification with incident details" },
          { label: "Escalation", desc: "All Program Leads and Executive Directors receive an urgent alert" },
          { label: "Confirmation", desc: "If an anonymous reporter provides an email, they receive a brief confirmation" },
        ].map(({ label, desc }) => (
          <PermRow key={label} label={label}>{desc}</PermRow>
        ))}
      </div>

      <h3 className="text-sm font-semibold mb-3">Email content rules</h3>
      <ul className="space-y-1.5 mb-5">
        {[
          "Emails never contain full incident details — just enough to prompt action",
          "No survivor PII (names, locations) is included in email bodies",
          "Emails contain a direct link to the incident within the secure app",
          "All emails are sent from the Hercules platform email system",
        ].map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />
            {item}
          </li>
        ))}
      </ul>

      <InfoBox variant="warn">
        If staff are not receiving emails, ask them to check their spam/junk folder. The
        technical administrator can verify email configuration in the Hercules platform
        settings.
      </InfoBox>
    </div>
  );
}

// ─── Section: Architecture ───────────────────────────────────────────────────

function SectionArchitecture() {
  return (
    <div>
      <SectionHeading icon={Database} title="System Architecture" subtitle="Technical overview for administrators" />

      <p className="text-sm text-muted-foreground leading-relaxed mb-5">
        This section provides a high-level understanding of how Tich Labs Tracker is built.
        You do not need to understand this for day-to-day use, but it helps when
        communicating with your technical administrator.
      </p>

      <h3 className="text-sm font-semibold mb-3">Technology stack</h3>
      <div className="rounded-xl border border-border overflow-hidden mb-5">
        {[
          { label: "Frontend", desc: "React web application — works in any modern browser (Chrome, Safari, Firefox, Edge)" },
          { label: "Backend", desc: "Hercules Backend (Convex) — real-time serverless functions" },
          { label: "Database", desc: "Hercules Database — document-based, real-time, fully managed" },
          { label: "Authentication", desc: "Hercules Auth — Google, Microsoft, or email OTP sign-in" },
          { label: "Email", desc: "Hercules Email — managed sending for notifications" },
          { label: "Hosting", desc: "Hercules Cloud — globally distributed, auto-scaling" },
          { label: "Offline", desc: "Progressive Web App (PWA) with service worker + local queue" },
        ].map(({ label, desc }) => (
          <PermRow key={label} label={label}>{desc}</PermRow>
        ))}
      </div>

      <h3 className="text-sm font-semibold mb-3">Data flow</h3>
      <div className="flex flex-col gap-0 text-sm mb-5">
        {[
          "User submits form in browser (or offline — saved to device)",
          "Data is sent to Hercules Backend via secure WebSocket connection",
          "Backend validates data and writes to Hercules Database",
          "Audit log entry is written automatically",
          "Email notifications are triggered via Hercules Email",
          "All connected clients update in real-time via reactive subscriptions",
        ].map((step, i) => (
          <div key={i} className="flex items-start gap-2 py-2 border-b border-border last:border-0">
            <span className="w-5 h-5 rounded-full bg-muted border border-border flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
              {i + 1}
            </span>
            <span className="text-muted-foreground text-sm leading-relaxed">{step}</span>
          </div>
        ))}
      </div>

      <h3 className="text-sm font-semibold mb-3">Database tables</h3>
      <div className="rounded-xl border border-border overflow-hidden mb-5">
        {[
          { label: "users", desc: "Staff accounts with roles, email, and status" },
          { label: "incidents", desc: "All reported incidents with category, status, location, and survivor demographics" },
          { label: "auditLog", desc: "Immutable record of all system actions" },
        ].map(({ label, desc }) => (
          <PermRow key={label} label={label}>
            <span><CodeChip>{label}</CodeChip> — {desc}</span>
          </PermRow>
        ))}
      </div>

      <h3 className="text-sm font-semibold mb-3">Security measures</h3>
      <ul className="space-y-1.5 mb-5">
        {[
          "All data in transit is encrypted with TLS 1.3",
          "Database access requires valid authentication tokens",
          "Role-based access control on every backend function",
          "No raw SQL or direct database access from the frontend",
          "Session tokens expire automatically after inactivity",
          "Quick Exit clears session data from the browser",
        ].map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
            <Lock className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
            {item}
          </li>
        ))}
      </ul>

      <InfoBox variant="info">
        The platform is fully managed — no server maintenance, patching, or backups are
        required from your team. Hercules Cloud handles all infrastructure automatically.
      </InfoBox>
    </div>
  );
}

// ─── Section: Offline Mode ────────────────────────────────────────────────────

function SectionOffline() {
  return (
    <div>
      <SectionHeading icon={WifiOff} title="Offline Mode" subtitle="Reporting incidents without an internet connection" />

      <p className="text-sm text-muted-foreground leading-relaxed mb-5">
        Tich Labs Tracker works without internet connectivity. Field workers can complete and submit
        incident forms while offline — reports are saved locally and automatically synced when
        a connection is restored.
      </p>

      <h3 className="text-sm font-semibold mb-3">How it works</h3>
      <div className="space-y-0">
        <Step number={1} title="Submit the form as normal">
          Fill in all required fields and press <strong>Save Offline</strong> (the button changes
          label automatically when offline). The report is saved to the device.
        </Step>
        <Step number={2} title="Reconnect to the internet">
          When the device goes back online, the app detects this automatically and shows a banner:
          "Back online — syncing X saved incidents."
        </Step>
        <Step number={3} title="Automatic sync">
          Reports are submitted to the server in the background. A success toast confirms how many
          were synced. The app prevents duplicate submissions even if the sync runs multiple times.
        </Step>
      </div>

      <h3 className="text-sm font-semibold mb-3 mt-2">Sync status indicators</h3>
      <div className="rounded-xl border border-border overflow-hidden mb-5">
        {[
          { label: "Amber bar at top", desc: "X incidents are queued and waiting to sync. Tap 'Sync now' to attempt manually." },
          { label: "Red bar at top", desc: "X incidents failed after 5 attempts and need support. Contact your technical admin." },
          { label: "'Offline' badge in form header", desc: "The device currently has no internet connection." },
        ].map(({ label, desc }) => (
          <PermRow key={label} label={label}>{desc}</PermRow>
        ))}
      </div>

      <InfoBox variant="warn">
        <strong>Dead-letter items</strong> — if an incident fails to sync after 5 attempts, it will
        not be retried automatically. Contact your technical administrator, who can recover the data
        from the device's local storage.
      </InfoBox>

      <h3 className="text-sm font-semibold mb-3">Installing as a mobile app (PWA)</h3>
      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
        For the best offline experience, install Tich Labs Tracker as a Progressive Web App (PWA) on your
        phone. This makes it available as an icon on your home screen, like a native app.
      </p>
      <ul className="space-y-1.5">
        {[
          "Android (Chrome): Tap the three-dot menu → 'Add to Home screen'",
          "iPhone (Safari): Tap the Share icon → 'Add to Home Screen'",
          "Desktop (Chrome): Click the install icon in the address bar",
        ].map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
            <ArrowUpCircle className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Section: Roadmap ────────────────────────────────────────────────────────

type RoadmapItem = {
  feature: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  dependencies: string;
  complexity: "Low" | "Medium" | "High";
  safetyNotes: string;
  status: "done" | "planned";
};

const ROADMAP_PHASES: {
  phase: number;
  title: string;
  timeline: string;
  items: RoadmapItem[];
}[] = [
  {
    phase: 1,
    title: "MVP Stabilization",
    timeline: "1-2 days",
    items: [
      { feature: "Fix label maps for new categories", priority: "Critical", dependencies: "None", complexity: "Low", safetyNotes: "Prevents confusion in reports", status: "done" },
      { feature: "Add anonymous status lookup page", priority: "High", dependencies: "None", complexity: "Medium", safetyNotes: "Let reporters check case status with their reference code", status: "planned" },
      { feature: "Formal audit_log table", priority: "High", dependencies: "Schema change", complexity: "Medium", safetyNotes: "Required for accountability", status: "done" },
      { feature: "Update email templates with new categories", priority: "Medium", dependencies: "None", complexity: "Low", safetyNotes: "Prevents misleading notifications", status: "done" },
    ],
  },
  {
    phase: 2,
    title: "Pilot Readiness",
    timeline: "3-5 days",
    items: [
      { feature: "Referral services database + admin CRUD", priority: "Critical", dependencies: "Schema design", complexity: "Medium", safetyNotes: "Must verify all listed services", status: "done" },
      { feature: "Multilingual support (English + Swahili)", priority: "High", dependencies: "i18next setup", complexity: "High", safetyNotes: "Critical for Kenyan context", status: "done" },
      { feature: "Push notifications (backend triggers)", priority: "Medium", dependencies: "Existing SW handler", complexity: "Medium", safetyNotes: "Don't push sensitive content", status: "planned" },
      { feature: "PDF report generation", priority: "Medium", dependencies: "jspdf", complexity: "Medium", safetyNotes: "Ensure anonymized", status: "planned" },
      { feature: "Community champion dashboard", priority: "Medium", dependencies: "Role enhancement", complexity: "Medium", safetyNotes: "Territory-based view", status: "planned" },
    ],
  },
  {
    phase: 3,
    title: "AI Referral Layer",
    timeline: "3-5 days",
    items: [
      { feature: "AI risk/severity scoring", priority: "Critical", dependencies: "Hercules AI Gateway", complexity: "High", safetyNotes: "Must have human review", status: "planned" },
      { feature: "AI-powered service matching", priority: "Critical", dependencies: "Services DB, AI Gateway", complexity: "High", safetyNotes: "Never auto-refer without human approval", status: "planned" },
      { feature: "Human oversight approval UI", priority: "Critical", dependencies: "AI scoring", complexity: "Medium", safetyNotes: "All AI suggestions require staff confirmation", status: "planned" },
      { feature: "Location-based recommendations", priority: "High", dependencies: "Services DB, geolocation", complexity: "Medium", safetyNotes: "Don't expose survivor location", status: "planned" },
      { feature: "AI confidence indicators", priority: "Medium", dependencies: "AI scoring", complexity: "Low", safetyNotes: "Helps staff trust/evaluate AI", status: "planned" },
    ],
  },
  {
    phase: 4,
    title: "Scale & Funding Readiness",
    timeline: "2-3 days",
    items: [
      { feature: "M&E indicator dashboard", priority: "High", dependencies: "Data model", complexity: "Medium", safetyNotes: "Aligns with donor KPIs", status: "planned" },
      { feature: "Multi-org/tenant support", priority: "Medium", dependencies: "Schema refactor", complexity: "High", safetyNotes: "Data isolation critical", status: "planned" },
      { feature: "API for external reporting systems", priority: "Low", dependencies: "HTTP actions", complexity: "Medium", safetyNotes: "Auth required", status: "planned" },
      { feature: "Advanced analytics (cohort, trend prediction)", priority: "Low", dependencies: "Enough data", complexity: "Medium", safetyNotes: "Anonymize all outputs", status: "planned" },
    ],
  },
];

function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    Critical: "bg-red-100 text-red-800 border-red-200",
    High: "bg-orange-100 text-orange-800 border-orange-200",
    Medium: "bg-blue-100 text-blue-800 border-blue-200",
    Low: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span className={cn("text-sm font-medium px-1.5 py-0.5 rounded border whitespace-nowrap", styles[priority] ?? styles.Low)}>
      {priority}
    </span>
  );
}

function ComplexityBadge({ complexity }: { complexity: string }) {
  const styles: Record<string, string> = {
    Low: "bg-green-100 text-green-800 border-green-200",
    Medium: "bg-amber-100 text-amber-800 border-amber-200",
    High: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span className={cn("text-sm font-medium px-1.5 py-0.5 rounded border whitespace-nowrap", styles[complexity] ?? styles.Medium)}>
      {complexity}
    </span>
  );
}

function SectionRoadmap() {
  return (
    <div>
      <SectionHeading icon={Map} title="Development Roadmap" subtitle="Phased implementation plan with safety considerations" />

      <p className="text-sm text-muted-foreground leading-relaxed mb-5">
        The platform is built in four incremental phases. Each phase delivers standalone value
        while building toward a comprehensive AI-powered referral system. Items marked with a
        green checkmark are already complete.
      </p>

      {ROADMAP_PHASES.map((phase) => {
        const doneCount = phase.items.filter((i) => i.status === "done").length;
        const totalCount = phase.items.length;
        return (
          <div key={phase.phase} className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                {phase.phase}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">Phase {phase.phase} — {phase.title}</p>
                <p className="text-sm text-muted-foreground">{phase.timeline} · {doneCount}/{totalCount} complete</p>
              </div>
              {doneCount === totalCount && (
                <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 text-sm">
                  Complete
                </Badge>
              )}
            </div>

            <div className="rounded-xl border border-border overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-[1fr_60px_90px_56px_1fr] gap-2 px-3 py-2 bg-muted/40 border-b border-border text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <span>Feature</span>
                <span>Priority</span>
                <span>Dependencies</span>
                <span>Effort</span>
                <span>Safety Notes</span>
              </div>
              {/* Rows */}
              {phase.items.map((item, i) => (
                <div
                  key={i}
                  className={cn(
                    "grid grid-cols-[1fr_60px_90px_56px_1fr] gap-2 px-3 py-2.5 border-b border-border last:border-0 items-center text-sm",
                    item.status === "done" && "bg-green-50/50"
                  )}
                >
                  <span className="flex items-center gap-1.5 min-w-0">
                    {item.status === "done" ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                    ) : (
                      <Circle className="h-3.5 w-3.5 text-muted-foreground/40 flex-shrink-0" />
                    )}
                    <span className={cn("truncate", item.status === "done" && "text-green-800 font-medium")}>
                      {item.feature}
                    </span>
                  </span>
                  <span><PriorityBadge priority={item.priority} /></span>
                  <span className="text-sm text-muted-foreground truncate">{item.dependencies}</span>
                  <span><ComplexityBadge complexity={item.complexity} /></span>
                  <span className="text-sm text-muted-foreground truncate">{item.safetyNotes}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <InfoBox variant="info">
        This roadmap is a living document. Priorities and timelines may shift based on field
        testing feedback, funder requirements, and community needs assessment.
      </InfoBox>
    </div>
  );
}

// ─── Section: Demo Walkthrough ───────────────────────────────────────────────

type WalkthroughScreen = {
  title: string;
  path: string;
  audience: "public" | "admin";
  description: string;
  features: string[];
  icon: React.ElementType;
};

const WALKTHROUGH_SCREENS: WalkthroughScreen[] = [
  {
    title: "Landing Page",
    path: "/en",
    audience: "public",
    icon: Globe,
    description:
      "Entry point for all users. Dark gradient hero with clear call-to-action. Navbar includes language switcher (EN/SW), 'Find Help' link, and 'Report Incident' button.",
    features: [
      "Tagline: 'Protect Survivors. Empower Responders.'",
      "Prominent 'Report an Incident' CTA button",
      "Core Features section: Structured Incident Logging + Offline-Capable PWA",
      "Persistent Quick Exit button (top-right, every page)",
      "Language switcher in navbar and footer",
      "Fully translated Swahili version at /sw",
    ],
  },
  {
    title: "Safety Gate",
    path: "/en/incidents/safety",
    audience: "public",
    icon: ShieldCheck,
    description:
      "Pre-entry consent screen shown before accessing the incident form. Ensures reporters are in a safe space.",
    features: [
      "Heart icon with 'Your Safety Matters' heading",
      "Privacy warning about sensitive content",
      "Consent checkbox: 'I understand and consent to continue'",
      "Continue button (disabled until checkbox ticked)",
      "Leave Site button (redirects to Google)",
      "Confidentiality assurance footer text",
    ],
  },
  {
    title: "Incident Report Form (5 Steps)",
    path: "/en/incidents/new",
    audience: "public",
    icon: ClipboardPlus,
    description:
      "Anonymous 5-step wizard for reporting incidents. Three reporter types. No account required. Works offline.",
    features: [
      "Step 1: Who is reporting? — Self (Survivor), On Behalf of Survivor, or Volunteer with unique ID",
      "Step 2: Incident type selection (10 large tap-friendly icon cards) + date/time",
      "Step 3: Location details and incident description",
      "Step 4: Survivor info (age group, gender — anonymized)",
      "Step 5: Review & submit — reference code builder (self/on behalf) or volunteer ID display",
      "Progress indicator showing current step (1/5, 2/5, etc.)",
      "Anonymity banner: 'This report is anonymous. No account needed.'",
      "Volunteer ID field (e.g. MARY-KM-001) shown only when Volunteer is selected",
      "Reference code builder (initials + birth month + birth year) for self/on-behalf reporters",
      "Language switcher in header",
      "Offline support: saves locally when no internet",
    ],
  },
  {
    title: "Submission Success",
    path: "/en/incidents/success",
    audience: "public",
    icon: CheckCircle2,
    description:
      "Confirmation page shown after a successful incident report submission.",
    features: [
      "Green checkmark icon confirming submission",
      "Confidentiality message",
      "Link back to home page",
    ],
  },
  {
    title: "Referral Services Directory",
    path: "/en/referral",
    audience: "public",
    icon: Globe,
    description:
      "Public directory of GBV referral services for Kakamega and Vihiga counties. Accessible without sign-in.",
    features: [
      "Emergency banner: 'Call 999 (police) or 1195 (GBV helpline)'",
      "Formal GBV referral pathway explanation",
      "County filter: All Counties, Kakamega, Vihiga",
      "Service type filter: Health Facilities, Police Stations, Rescue & Shelter, Counselling, Legal Services",
      "44 verified services with name, phone, address, description",
      "Fully bilingual (English/Swahili)",
    ],
  },
  {
    title: "Dashboard",
    path: "/en/dashboard",
    audience: "admin",
    icon: BarChart2,
    description:
      "Personalized staff dashboard with role badge, incident summary, and quick actions.",
    features: [
      "Greeting with user name and role badge (e.g. 'Executive Director')",
      "Summary cards: Total incidents, New, In Progress",
      "Incidents awaiting assignment — with category icons, location, timestamps",
      "Quick Actions panel: Review All Incidents, Manage Users, Audit Log",
      "Sidebar navigation to all admin pages",
      "Language switcher and sign-out at bottom of sidebar",
    ],
  },
  {
    title: "All Incidents",
    path: "/en/incidents",
    audience: "admin",
    icon: ClipboardList,
    description:
      "Filterable list of all incidents with status tabs and category icons.",
    features: [
      "Status tabs: All, New, Assigned, In Progress, Escalated, Resolved, Closed",
      "Each row: category icon, incident type, location, date, status badge",
      "Click any row to view full incident details",
      "Count indicator showing total number of incidents shown",
    ],
  },
  {
    title: "Reports & Analytics",
    path: "/en/reports",
    audience: "admin",
    icon: BarChart2,
    description:
      "Anonymized analytics dashboard with time-range filters and CSV export.",
    features: [
      "Time range filters: Last 7 days, This Month, 3 Months, 6 Months, This Year, Custom Range",
      "Summary cards: Total Incidents, Escalated, Resolved, In Progress",
      "Chart visualizations: incidents by type, status distribution, trends",
      "Export CSV button — fully anonymized, suitable for donor reports",
      "Date range displayed clearly at top",
    ],
  },
  {
    title: "Audit Log",
    path: "/en/audit",
    audience: "admin",
    icon: Eye,
    description:
      "Immutable record of all system activity. Shows who did what and when.",
    features: [
      "Reverse chronological list of all actions",
      "Action types: incident created, status changed, assigned, note added",
      "Performer name, role, and timestamp for each entry",
      "Direct link to associated incident",
      "Cannot be edited or deleted by anyone",
    ],
  },
  {
    title: "User Management",
    path: "/en/users",
    audience: "admin",
    icon: Users,
    description:
      "Manage staff roles, approve new users, and control system access.",
    features: [
      "Search by name or email",
      "Status tabs: All Users, Active, Inactive",
      "Role dropdown: Executive Director, Program Lead, Counselor, Volunteer, Pending",
      "Deactivate/reactivate toggle per user",
      "Role Permissions Guide (expandable)",
      "Badge showing total active users",
    ],
  },
  {
    title: "Manage Referral Services",
    path: "/en/admin/services",
    audience: "admin",
    icon: Database,
    description:
      "Full CRUD interface for managing the referral services directory.",
    features: [
      "Table: Service name, Category badge, County, Status (Active/Inactive)",
      "Edit and delete actions per row",
      "'+ Add Service' button with creation dialog",
      "Search by name, description, or phone",
      "Category filter dropdown",
      "44 services pre-loaded (Kakamega and Vihiga counties)",
    ],
  },
  {
    title: "Admin Manual",
    path: "/en/admin/manual",
    audience: "admin",
    icon: BookOpen,
    description:
      "In-app documentation with comprehensive guides for all system features.",
    features: [
      "Sidebar navigation with 14 sections",
      "System Overview with feature cards and workflow",
      "User Journey visualization",
      "Role Hierarchy with permissions breakdown",
      "Development Roadmap (4 phases with progress tracking)",
      "AI Assistant usage guide",
      "Troubleshooting FAQ section",
    ],
  },
  {
    title: "AI Assistant",
    path: "/en/admin/manual",
    audience: "admin",
    icon: Sparkles,
    description:
      "AI-powered floating assistant available on all admin pages. Uses Groq/Llama 3.3 70B (free tier) for intelligent referral matching, risk assessment, and FHIR bundle generation.",
    features: [
      "Floating bot button (bottom-right, every admin page)",
      "Find Services: AI matches incidents to referral services with scores and reasoning",
      "Assess Risk: severity scoring (0-100) with urgency, factors, recommended actions",
      "Generate FHIR: produces FHIR R4 transaction bundles for EHR interoperability",
      "MCP Connected badge in panel header",
      "No cost — uses Groq free tier, falls back to keyword matching if unavailable",
    ],
  },
];

function SectionDemoWalkthrough() {
  const publicScreens = WALKTHROUGH_SCREENS.filter((s) => s.audience === "public");
  const adminScreens = WALKTHROUGH_SCREENS.filter((s) => s.audience === "admin");

  return (
    <div>
      <SectionHeading
        icon={Monitor}
        title="Demo Walkthrough"
        subtitle="Complete guided tour of every screen in the application"
      />

      <p className="text-sm text-muted-foreground leading-relaxed mb-2">
        This walkthrough covers all pages in the Tich Labs Incident Tracker — both the public-facing
        screens accessible without sign-in, and the authenticated admin/staff pages. Use this
        as a reference when demoing the app to funders, partners, or new team members.
      </p>

      <InfoBox variant="info">
        Click the <strong>Open Page</strong> button on any card to navigate directly to that screen
        in a new tab. All public pages work without signing in.
      </InfoBox>

      {/* Mobile note */}
      <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl border border-border bg-muted/30 mb-6 mt-4">
        <Smartphone className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground leading-relaxed">
          <strong>Mobile-responsive:</strong> All pages adapt to phone and tablet screens.
          The landing page stacks vertically, the incident form uses a 2-column icon grid,
          and the dashboard uses a hamburger menu with bottom navigation.
        </p>
      </div>

      {/* Public Pages */}
      <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
        <Globe className="h-4 w-4 text-primary" />
        Public-Facing Pages
        <span className="text-sm text-muted-foreground font-normal">(no sign-in required)</span>
      </h3>

      <div className="space-y-4 mb-8">
        {publicScreens.map((screen, i) => {
          const Icon = screen.icon;
          return (
            <div key={i} className="rounded-xl border border-border overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 bg-primary/5 border-b border-border">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{screen.title}</p>
                  <p className="text-sm text-muted-foreground font-mono">{screen.path}</p>
                </div>
                <a
                  href={screen.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer"
                >
                  Open Page
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="px-4 py-3">
                <p className="text-sm text-muted-foreground leading-relaxed mb-2.5">{screen.description}</p>
                <ul className="space-y-1">
                  {screen.features.map((f, fi) => (
                    <li key={fi} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {/* Admin Pages */}
      <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
        <Lock className="h-4 w-4 text-primary" />
        Admin / Staff Pages
        <span className="text-sm text-muted-foreground font-normal">(requires sign-in)</span>
      </h3>

      <div className="space-y-4">
        {adminScreens.map((screen, i) => {
          const Icon = screen.icon;
          return (
            <div key={i} className="rounded-xl border border-border overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 bg-orange-50 border-b border-border">
                <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-3.5 w-3.5 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{screen.title}</p>
                  <p className="text-sm text-muted-foreground font-mono">{screen.path}</p>
                </div>
                <a
                  href={screen.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-orange-600 text-white text-sm font-medium hover:bg-orange-700 transition-colors cursor-pointer"
                >
                  Open Page
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="px-4 py-3">
                <p className="text-sm text-muted-foreground leading-relaxed mb-2.5">{screen.description}</p>
                <ul className="space-y-1">
                  {screen.features.map((f, fi) => (
                    <li key={fi} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Monitor className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Summary</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Pages", value: "13" },
            { label: "Public Pages", value: "5" },
            { label: "Admin Pages", value: "8" },
            { label: "Languages", value: "2 (EN/SW)" },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="text-lg font-bold text-foreground">{value}</p>
              <p className="text-sm text-muted-foreground uppercase tracking-wide">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Section: AI Assistant ────────────────────────────────────────────────────

function SectionSupport() {
  return (
    <div>
      <SectionHeading icon={HelpCircle} title="Support & Troubleshooting" subtitle="Common issues and how to resolve them" />

      <div className="space-y-3 mb-6">
        <Collapsible title="A new user signed up but I cannot see them in the Users page">
          Ensure your own role is Program Lead or Executive Director — only these roles can access
          the Users page. If your role is correct, try refreshing the page. If the user still does
          not appear, they may have signed in with a different email address than expected.
        </Collapsible>
        <Collapsible title="A user says they cannot log in after being deactivated">
          Reactivate them from the Users page by clicking the green reactivate icon on their row.
          Ask them to sign out completely and sign back in.
        </Collapsible>
        <Collapsible title="Offline incidents are stuck in the queue">
          Ensure the device has a stable internet connection. Tap the amber "Sync now" bar to
          retry manually. If items are in the red (failed) state, contact your technical
          administrator to recover the data.
        </Collapsible>
        <Collapsible title="The CSV export is empty">
          Check that the date range on the Reports page covers the period you need. The from/to
          dates are inclusive. If still empty, ensure there are incidents logged in that period
          by checking the Incidents page.
        </Collapsible>
        <Collapsible title="Email notifications are not being received">
          Check the spam/junk folder. Emails are sent from the Hercules platform. Ask your
          technical administrator to verify the email configuration in the Hercules backend
          settings.
        </Collapsible>
        <Collapsible title="I accidentally deactivated an Executive Director and am now locked out">
          Your technical administrator can directly update the user record in the Hercules
          Database tab — set <CodeChip>isActive</CodeChip> to <CodeChip>true</CodeChip> on the
          affected user.
        </Collapsible>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Database className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Technical Administrator</p>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          For issues that cannot be resolved within the app — including database changes,
          environment variables, email provider setup, or deployment — contact the person who
          built and manages this application in the Hercules platform.
        </p>
      </div>
    </div>
  );
}

// ─── Sidebar nav ──────────────────────────────────────────────────────────────

function ManualSidebar({
  active,
  onSelect,
}: {
  active: SectionId;
  onSelect: (id: SectionId) => void;
}) {
  return (
    <nav className="space-y-0.5">
      {SECTIONS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onSelect(id)}
          className={cn(
            "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left",
            active === id
              ? "bg-primary text-primary-foreground font-medium"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Icon className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">{label}</span>
          {active === id && <ChevronRight className="h-3.5 w-3.5 ml-auto opacity-70" />}
        </button>
      ))}
    </nav>
  );
}

// ─── Mobile section picker ────────────────────────────────────────────────────

function MobileSectionPicker({
  active,
  onSelect,
}: {
  active: SectionId;
  onSelect: (id: SectionId) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = SECTIONS.find((s) => s.id === active);
  const Icon = current?.icon ?? BookOpen;

  return (
    <div className="md:hidden border-b border-border">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium"
      >
        <Icon className="h-4 w-4 text-primary flex-shrink-0" />
        <span className="flex-1 text-left">{current?.label}</span>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="border-t border-border bg-muted/30">
          {SECTIONS.filter((s) => s.id !== active).map(({ id, label, icon: SIcon }) => (
            <button
              key={id}
              onClick={() => { onSelect(id); setOpen(false); }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-left border-b border-border last:border-0"
            >
              <SIcon className="h-4 w-4 flex-shrink-0" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Inner page ───────────────────────────────────────────────────────────────

function ManualInner() {
  const [active, setActive] = useState<SectionId>("overview");
  const userQuery = useSupabaseQueryCamel<any>(supabaseQueries.getCurrentUser);
  const user = userQuery.data;

  const isAdmin =
    user?.role === "program_lead" || user?.role === "executive_director";

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center gap-4">
        <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
          <Lock className="h-7 w-7 text-destructive" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Access Restricted</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            The Admin Manual is only accessible to Program Leads and Executive Directors.
          </p>
        </div>
      </div>
    );
  }

  const sectionContent: Record<SectionId, React.ReactNode> = {
    overview: <SectionOverview />,
    "super-admin-setup": <SectionSuperAdminSetup />,
    roles: <SectionRoles />,
    users: <SectionUsers />,
    incidents: <SectionIncidents />,
    reports: <SectionReports />,
    privacy: <SectionPrivacy />,
    "audit-log": <SectionAuditLog />,
    emails: <SectionEmails />,
    offline: <SectionOffline />,
    architecture: <SectionArchitecture />,
    roadmap: <SectionRoadmap />,
    "ai-assistant": <SectionAiAssistant />,
    support: <SectionSupport />,
  };

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="px-4 sm:px-6 pt-5 pb-4 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <BookOpen className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">Admin Manual</h1>
            <p className="text-sm text-muted-foreground">
              Youth Changers Kenya — Incident Tracker
            </p>
          </div>
          <Badge variant="secondary" className="ml-auto text-sm">
            v2.2
          </Badge>
        </div>
      </div>

      {/* Mobile section picker */}
      <MobileSectionPicker active={active} onSelect={setActive} />

      {/* Body */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Sidebar (desktop) */}
        <aside className="hidden md:flex flex-col w-52 flex-shrink-0 border-r border-border bg-muted/20 p-3 overflow-y-auto">
          <ManualSidebar active={active} onSelect={setActive} />
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
            {sectionContent[active]}
          </div>
        </main>
      </div>
    </div>
  );
}

// ─── Page wrapper ─────────────────────────────────────────────────────────────

export default function AdminManualPage() {
  return (
    <>
      <AuthLoading>
        <div className="p-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </AuthLoading>
      <Unauthenticated>
        <div className="flex items-center justify-center min-h-[60vh]">
          <SignInButton />
        </div>
      </Unauthenticated>
      <Authenticated>
        <ManualInner />
      </Authenticated>
    </>
  );
}
