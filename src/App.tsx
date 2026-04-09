import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { PermissionRoute } from "@/components/auth/PermissionRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// Lazy-loaded pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const MFASettings = lazy(() => import("./pages/MFASettings"));
const UsersRoles = lazy(() => import("./pages/admin/UsersRoles"));
const UserDetail = lazy(() => import("./pages/admin/UserDetail"));
const AuditLogs = lazy(() => import("./pages/admin/AuditLogs"));
const ChangeRequestsPage = lazy(() => import("./pages/admin/ChangeRequests"));
const PermissionsPage = lazy(() => import("./pages/admin/PermissionsPage"));
const CyclesList = lazy(() => import("./pages/cycles/CyclesList"));
const CycleDetail = lazy(() => import("./pages/cycles/CycleDetail"));
const ObjectivesPage = lazy(() => import("./pages/objectives/ObjectivesPage"));
const ObjectiveDetail = lazy(() => import("./pages/objectives/ObjectiveDetail"));
const AlignmentView = lazy(() => import("./pages/alignment/AlignmentView"));
const WeeklyPPP = lazy(() => import("./pages/weekly/WeeklyPPP"));
const PulseSurvey = lazy(() => import("./pages/pulse/PulseSurvey"));
const KudosPage = lazy(() => import("./pages/kudos/KudosPage"));
const LeaderDashboard = lazy(() => import("./pages/leader/LeaderDashboard"));
const ReportsPage = lazy(() => import("./pages/reports/ReportsPage"));
const IntegrationsPage = lazy(() => import("./pages/settings/IntegrationsPage"));
const InitiativesList = lazy(() => import("./pages/initiatives/InitiativesList"));
const Profile = lazy(() => import("./pages/Profile"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      gcTime: 60 * 1000,
      retry: 1,
    },
  },
});

function PageLoader() {
  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <div className="text-muted-foreground">Carregando...</div>
    </div>
  );
}

const App = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4 p-8">
          <h1 className="text-2xl font-semibold text-foreground">Erro de configuração</h1>
          <p className="text-muted-foreground">
            Variáveis de ambiente não encontradas. Tente republicar o site.
          </p>
        </div>
      </div>
    );
  }

  return (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/settings/profile" element={<Profile />} />
                <Route path="/settings/2fa" element={<MFASettings />} />
                <Route path="/cycles" element={<CyclesList />} />
                <Route path="/cycles/:id" element={<CycleDetail />} />
                <Route path="/objectives" element={<ObjectivesPage />} />
                <Route path="/objectives/:id" element={<ObjectiveDetail />} />
                <Route path="/alignment" element={<AlignmentView />} />
                <Route path="/weekly" element={<WeeklyPPP />} />
                <Route path="/pulse" element={<PulseSurvey />} />
                <Route path="/kudos" element={<KudosPage />} />
                <Route path="/leader" element={<PermissionRoute permission="ppp.view_team"><LeaderDashboard /></PermissionRoute>} />
                <Route path="/reports" element={<PermissionRoute permission="reports.view"><ReportsPage /></PermissionRoute>} />
                <Route path="/settings/integrations" element={<IntegrationsPage />} />
                <Route path="/initiatives" element={<InitiativesList />} />
                <Route path="/admin/users" element={<AdminRoute><UsersRoles /></AdminRoute>} />
                <Route path="/admin/users/:id" element={<AdminRoute><UserDetail /></AdminRoute>} />
                <Route path="/admin/audit" element={<AdminRoute><AuditLogs /></AdminRoute>} />
                <Route path="/admin/change-requests" element={<AdminRoute><ChangeRequestsPage /></AdminRoute>} />
                <Route path="/admin/permissions" element={<AdminRoute><PermissionsPage /></AdminRoute>} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
  );
};

export default App;
