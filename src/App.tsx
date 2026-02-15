import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AdminRoute } from "@/components/auth/AdminRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import MFASettings from "./pages/MFASettings";
import UsersRoles from "./pages/admin/UsersRoles";
import UserDetail from "./pages/admin/UserDetail";
import AuditLogs from "./pages/admin/AuditLogs";
import ChangeRequestsPage from "./pages/admin/ChangeRequests";
import CyclesList from "./pages/cycles/CyclesList";
import CycleDetail from "./pages/cycles/CycleDetail";
import ObjectiveDetail from "./pages/objectives/ObjectiveDetail";
import AlignmentView from "./pages/alignment/AlignmentView";
import WeeklyPPP from "./pages/weekly/WeeklyPPP";
import PulseSurvey from "./pages/pulse/PulseSurvey";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/settings/profile" element={<Profile />} />
            <Route path="/settings/2fa" element={<MFASettings />} />
            <Route path="/cycles" element={<CyclesList />} />
            <Route path="/cycles/:id" element={<CycleDetail />} />
            <Route path="/objectives/:id" element={<ObjectiveDetail />} />
            <Route path="/alignment" element={<AlignmentView />} />
            <Route path="/weekly" element={<WeeklyPPP />} />
            <Route path="/pulse" element={<PulseSurvey />} />
            <Route path="/admin/users" element={<AdminRoute><UsersRoles /></AdminRoute>} />
            <Route path="/admin/users/:id" element={<AdminRoute><UserDetail /></AdminRoute>} />
            <Route path="/admin/audit" element={<AdminRoute><AuditLogs /></AdminRoute>} />
            <Route path="/admin/change-requests" element={<AdminRoute><ChangeRequestsPage /></AdminRoute>} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
