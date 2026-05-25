import { Outlet, useNavigate, useLocation, useParams } from "react-router-dom";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Button } from "@/components/ui/button.tsx";
import { useAuth } from "@/components/providers/supabase";
import { Authenticated, Unauthenticated, AuthLoading } from "@/components/auth-components";
import { cn } from "@/lib/utils.ts";
import { OfflineBanner } from "@/components/offline-banner.tsx";
import { InstallPrompt } from "@/components/install-prompt.tsx";
import { useOfflineIncidentQueue } from "@/hooks/use-offline-incident-queue.ts";
import AiAssistant from "@/components/ai-assistant";
import OrgBanner from "@/components/OrgBanner";
import { useSupabaseQueryCamel, supabaseQueries } from "@/hooks/use-supabase-query";
import { useTranslation } from "react-i18next";
import LocaleSwitcher from "@/components/locale-switcher.tsx";
import {
  LayoutDashboard,
  ClipboardPlus,
  ListFilter,
  Users,
  LogOut,
  Menu,
  ShieldCheck,
  BarChart2,
  BookOpen,
  ScrollText,
  Heart,
  Settings,
  Info,
} from "lucide-react";
import { useState } from "react";

type NavItem = {
  path: string;
  labelKey: string;
  icon: typeof LayoutDashboard;
  roles: string[];
};

const navItems: NavItem[] = [
  { path: "dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard, roles: ["volunteer", "counselor", "program_lead", "executive_director", "pending"] },
  { path: "incidents/new", labelKey: "nav.logIncident", icon: ClipboardPlus, roles: ["volunteer"] },
  { path: "incidents", labelKey: "nav.myIncidents", icon: ListFilter, roles: ["volunteer"] },
  { path: "incidents", labelKey: "nav.allIncidents", icon: ListFilter, roles: ["counselor", "program_lead", "executive_director"] },
  { path: "referral", labelKey: "nav.findHelp", icon: Heart, roles: ["volunteer"] },
  { path: "reports", labelKey: "nav.reports", icon: BarChart2, roles: ["program_lead", "executive_director"] },
  { path: "audit", labelKey: "nav.auditLog", icon: ScrollText, roles: ["program_lead", "executive_director"] },
  { path: "users", labelKey: "nav.users", icon: Users, roles: ["program_lead", "executive_director"] },
  { path: "admin/services", labelKey: "nav.manageServices", icon: Settings, roles: ["program_lead", "executive_director"] },
  { path: "admin/manual", labelKey: "nav.adminManual", icon: BookOpen, roles: ["program_lead", "executive_director"] },
  { path: "about", labelKey: "nav.about", icon: Info, roles: ["volunteer", "counselor", "program_lead", "executive_director", "pending"] },
];

function AppLayoutInner() {
  const { removeUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { lng } = useParams<{ lng: string }>();
  const { t } = useTranslation("common");
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: user } = useSupabaseQueryCamel(supabaseQueries.getCurrentUser);
  const { queueCount, deadCount, syncQueue } = useOfflineIncidentQueue();

  const visibleNav = navItems.filter((item) =>
    item.roles.includes(user?.role ?? "executive_director")
  );

  const handleNav = (path: string) => {
    navigate(`/${lng}/${path}`);
    setMobileOpen(false);
  };

  const isActive = (path: string) => {
    const fullPath = `/${lng}/${path}`;
    return location.pathname === fullPath;
  };

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center gap-1 w-full">
            <img src="/tichlabs.logo.jpeg" alt="Tich Labs" className="h-8 w-auto object-contain" />
            <div className="text-center">
              <div className="text-sm font-bold text-sidebar-foreground leading-tight">
                {t("app.name")}
              </div>
              <div className="text-sm text-sidebar-foreground/70">{t("app.subtitle")}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleNav.map((item) => (
          <button
            key={`${item.path}-${item.labelKey}`}
            onClick={() => handleNav(item.path)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-[15px] font-medium transition-colors text-left cursor-pointer",
              isActive(item.path)
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            )}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {t(item.labelKey)}
          </button>
        ))}
      </nav>

      {/* Language + User footer */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="mb-2">
          <LocaleSwitcher className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent" />
        </div>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-sidebar-accent/50 mb-2">
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-primary-foreground">
              {user?.name?.charAt(0)?.toUpperCase() ?? "A"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-sidebar-foreground truncate">
              {user?.name ?? "Admin"}
            </div>
            <div className="text-sm text-sidebar-foreground/70 capitalize">
              {user?.role?.replace("_", " ") ?? "Executive Director"}
            </div>
          </div>
        </div>
        <button
          onClick={() => removeUser()}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          {t("nav.signOut")}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 bg-sidebar border-r border-sidebar-border flex-col flex-shrink-0">
        <NavContent />
      </aside>

      {/* Mobile overlay sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-sidebar flex flex-col">
            <NavContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Offline banner */}
        <OfflineBanner />

        {/* Pending sync notice */}
        {queueCount > 0 && (
          <button
            onClick={() => void syncQueue()}
            className="flex items-center justify-between gap-2 px-4 py-2 bg-amber-50 border-b border-amber-200 text-sm text-amber-800 hover:bg-amber-100 transition-colors cursor-pointer"
          >
            <span>{t("sync.pendingSync", { count: queueCount })}</span>
            <span className="font-semibold underline">{t("sync.syncNow")}</span>
          </button>
        )}

        {/* Dead-letter queue warning */}
        {deadCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-destructive/10 border-b border-destructive/20 text-sm text-destructive">
            <span>{t("sync.failedSync", { count: deadCount })}</span>
          </div>
        )}

        {/* Org banner — shows active tenant context */}
        <OrgBanner />

        {/* Mobile topbar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-background flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 cursor-pointer"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <img src="/tichlabs.logo.jpeg" alt="Tich Labs" className="h-6 w-auto object-contain" />
            <span className="font-semibold text-sm">{t("app.name")}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      {/* PWA install prompt */}
      <InstallPrompt />

      {/* AI Assistant floating button */}
      <AiAssistant />
    </div>
  );
}

export default function AppLayout() {
  const { t } = useTranslation("common");

  return (
    <>
      <AuthLoading>
        <div className="min-h-screen flex items-center justify-center">
          <Skeleton className="h-16 w-64" />
        </div>
      </AuthLoading>
      <Unauthenticated>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <ShieldCheck className="h-12 w-12 text-primary mx-auto" />
            <h2 className="text-xl font-bold">{t("auth.signInToAccess")}</h2>
            <SignInButton />
          </div>
        </div>
      </Unauthenticated>
      <Authenticated>
        <AppLayoutInner />
      </Authenticated>
    </>
  );
}
