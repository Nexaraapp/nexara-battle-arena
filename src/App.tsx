
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { RouteGuard } from "./components/guards/RouteGuard";
import MainLayout from "./components/layout/MainLayout";
import Index from "./pages/Index";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import AdminLogin from "./pages/auth/AdminLogin";
import Profile from "./pages/Profile";
import Wallet from "./pages/Wallet";
import WithdrawalPage from "./pages/WithdrawalPage";
import Notifications from "./pages/Notifications";
import ReferralPage from "./pages/ReferralPage";
import AchievementsPage from "./pages/AchievementsPage";
import Matches from "./pages/Matches";
import MatchesListPage from "./pages/MatchesListPage";
import MatchDetailPage from "./pages/MatchDetailPage";
import Rules from "./pages/Rules";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/Dashboard";
import SuperadminDashboard from "./pages/admin/SuperadminDashboard";
import TopUpRequests from "./pages/admin/TopUpRequests";
import WithdrawalManager from "./pages/admin/WithdrawalManager";
import MatchManagement from "./pages/admin/MatchManagement";
import ManualCoins from "./pages/admin/ManualCoins";
import UserManagement from "./pages/admin/UserManagement";
import WithdrawalLogs from "./pages/admin/WithdrawalLogs";
import RulesManagement from "./pages/admin/RulesManagement";
import Settings from "./pages/admin/Settings";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Routes>
          {/* Public routes without layout */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin-login" element={<AdminLogin />} />

          {/* Routes with main layout */}
          <Route path="/" element={<MainLayout />}>
            {/* Protected user routes */}
            <Route
              index
              element={
                <RouteGuard requireAuth>
                  <Index />
                </RouteGuard>
              }
            />
            <Route
              path="profile"
              element={
                <RouteGuard requireAuth>
                  <Profile />
                </RouteGuard>
              }
            />
            <Route
              path="wallet"
              element={
                <RouteGuard requireAuth>
                  <Wallet />
                </RouteGuard>
              }
            />
            <Route
              path="withdraw"
              element={
                <RouteGuard requireAuth>
                  <WithdrawalPage />
                </RouteGuard>
              }
            />
            <Route
              path="notifications"
              element={
                <RouteGuard requireAuth>
                  <Notifications />
                </RouteGuard>
              }
            />
            <Route
              path="referral"
              element={
                <RouteGuard requireAuth>
                  <ReferralPage />
                </RouteGuard>
              }
            />
            <Route
              path="achievements"
              element={
                <RouteGuard requireAuth>
                  <AchievementsPage />
                </RouteGuard>
              }
            />
            <Route
              path="matches"
              element={
                <RouteGuard requireAuth>
                  <Matches />
                </RouteGuard>
              }
            />
            <Route
              path="matches-list"
              element={
                <RouteGuard requireAuth>
                  <MatchesListPage />
                </RouteGuard>
              }
            />
            <Route
              path="match/:matchId"
              element={
                <RouteGuard requireAuth>
                  <MatchDetailPage />
                </RouteGuard>
              }
            />
            <Route
              path="rules"
              element={
                <RouteGuard requireAuth>
                  <Rules />
                </RouteGuard>
              }
            />

            {/* Admin routes */}
            <Route
              path="admin/dashboard"
              element={
                <RouteGuard requireAuth requireRole="admin">
                  <AdminDashboard />
                </RouteGuard>
              }
            />
            <Route
              path="admin/topup-requests"
              element={
                <RouteGuard requireAuth requireRole="admin">
                  <TopUpRequests />
                </RouteGuard>
              }
            />
            <Route
              path="admin/withdrawals"
              element={
                <RouteGuard requireAuth requireRole="admin">
                  <WithdrawalManager />
                </RouteGuard>
              }
            />
            <Route
              path="admin/matches"
              element={
                <RouteGuard requireAuth requireRole="admin">
                  <MatchManagement />
                </RouteGuard>
              }
            />
            <Route
              path="admin/users"
              element={
                <RouteGuard requireAuth requireRole="admin">
                  <UserManagement />
                </RouteGuard>
              }
            />
            <Route
              path="admin/settings"
              element={
                <RouteGuard requireAuth requireRole="admin">
                  <Settings />
                </RouteGuard>
              }
            />

            {/* Superadmin routes */}
            <Route
              path="superadmin/dashboard"
              element={
                <RouteGuard requireAuth requireRole="superadmin">
                  <SuperadminDashboard />
                </RouteGuard>
              }
            />
            <Route
              path="admin/user-management"
              element={
                <RouteGuard requireAuth requireRole="superadmin">
                  <UserManagement />
                </RouteGuard>
              }
            />
            <Route
              path="admin/withdrawal-logs"
              element={
                <RouteGuard requireAuth requireRole="superadmin">
                  <WithdrawalLogs />
                </RouteGuard>
              }
            />
            <Route
              path="admin/manual-coins"
              element={
                <RouteGuard requireAuth requireRole="superadmin">
                  <ManualCoins />
                </RouteGuard>
              }
            />
            <Route
              path="admin/rules-management"
              element={
                <RouteGuard requireAuth requireRole="superadmin">
                  <RulesManagement />
                </RouteGuard>
              }
            />

            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
