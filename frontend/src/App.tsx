import { Suspense } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { Provider as DefaultProviders } from "./components/providers/default.tsx";
import LocaleWrapper from "./components/providers/locale-wrapper.tsx";
import { SAVED_OR_DEFAULT_LOCALE, setLocaleInPath } from "./i18n";
import "./i18n";
import AuthCallback from "./pages/auth/Callback.tsx";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import AppLayout from "./pages/app/_components/AppLayout.tsx";
import DashboardPage from "./pages/app/dashboard/page.tsx";
import NewIncidentPage from "./pages/incidents/new/page.tsx";
import IncidentSuccessPage from "./pages/incidents/success/page.tsx";
import IncidentsListPage from "./pages/incidents/page.tsx";
import IncidentDetailPage from "./pages/incidents/detail/page.tsx";
import SafetyGatePage from "./pages/incidents/safety-gate/page.tsx";
import UsersPage from "./pages/users/page.tsx";
import ReportsPage from "./pages/reports/page.tsx";
import AdminManualPage from "./pages/admin/manual/page.tsx";
import AuditLogPage from "./pages/audit/page.tsx";
import ReferralDirectoryPage from "./pages/referral/page.tsx";
import AdminServicesPage from "./pages/admin/services/page.tsx";
import { useServiceWorker } from "@/hooks/use-service-worker.ts";
import QuickExit from "@/components/quick-exit.tsx";
import { InstallPrompt } from "@/components/install-prompt.tsx";

const SurvivorLayout = () => (
  <>
    <QuickExit />
    <InstallPrompt />
    <Outlet />
  </>
);

export default function App() {
  useServiceWorker();

  return (
    <DefaultProviders>
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <Suspense fallback={<div></div>}>
          <Routes>
            {/* Root: redirect to saved/default locale */}
            <Route
              path="/"
              element={<Navigate to={setLocaleInPath(SAVED_OR_DEFAULT_LOCALE, "/")} replace />}
            />

            {/* Non-localized routes (auth) */}
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* All localized routes under /:lng */}
            <Route
              path="/:lng"
              element={
                <LocaleWrapper>
                  <Outlet />
                </LocaleWrapper>
              }
            >
              {/* Public routes (survivor-facing, with Quick Exit button) */}
              <Route element={<SurvivorLayout />}>
                <Route index element={<Index />} />
                <Route path="incidents/safety" element={<SafetyGatePage />} />
                <Route path="incidents/new" element={<NewIncidentPage />} />
                <Route path="incidents/success" element={<IncidentSuccessPage />} />
                <Route path="referral" element={<ReferralDirectoryPage />} />
              </Route>

              {/* Authenticated app shell */}
              <Route element={<AppLayout />}>
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="incidents" element={<IncidentsListPage />} />
                <Route path="incidents/:id" element={<IncidentDetailPage />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="audit" element={<AuditLogPage />} />
                <Route path="admin/manual" element={<AdminManualPage />} />
                <Route path="admin/services" element={<AdminServicesPage />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </DefaultProviders>
  );
}
