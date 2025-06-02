
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import Index from "./pages/Index";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Matches from "./pages/Matches";
import MatchesListPage from "./pages/MatchesListPage";
import MatchDetailPage from "./pages/MatchDetailPage";
import Profile from "./pages/Profile";
import Wallet from "./pages/Wallet";
import WithdrawalPage from "./pages/WithdrawalPage";
import ReferralPage from "./pages/ReferralPage";
import AchievementsPage from "./pages/AchievementsPage";
import Notifications from "./pages/Notifications";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminMatchManagement from "./pages/admin/MatchManagement";
import WithdrawalManager from "./pages/admin/WithdrawalManager";
import NotFound from "./pages/NotFound";
import { RouteGuard } from "./components/guards/RouteGuard";
import { RulesPage } from "./components/rules/RulesPage";
import { MatchModeSection } from "./components/matches/MatchModeSection";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Index />} />
            <Route path="matches" element={<Matches />} />
            <Route path="matches-list" element={<MatchesListPage />} />
            <Route path="matches-mode" element={<MatchModeSection />} />
            <Route path="match/:matchId" element={<MatchDetailPage />} />
            <Route path="rules" element={<RulesPage />} />
            <Route 
              path="profile" 
              element={
                <RouteGuard>
                  <Profile />
                </RouteGuard>
              } 
            />
            <Route 
              path="wallet" 
              element={
                <RouteGuard>
                  <Wallet />
                </RouteGuard>
              } 
            />
            <Route 
              path="withdraw" 
              element={
                <RouteGuard>
                  <WithdrawalPage />
                </RouteGuard>
              } 
            />
            <Route 
              path="referral" 
              element={
                <RouteGuard>
                  <ReferralPage />
                </RouteGuard>
              } 
            />
            <Route 
              path="achievements" 
              element={
                <RouteGuard>
                  <AchievementsPage />
                </RouteGuard>
              } 
            />
            <Route 
              path="notifications" 
              element={
                <RouteGuard>
                  <Notifications />
                </RouteGuard>
              } 
            />
            <Route 
              path="admin" 
              element={
                <RouteGuard requireAdmin>
                  <AdminDashboard />
                </RouteGuard>
              } 
            />
            <Route 
              path="admin/matches" 
              element={
                <RouteGuard requireAdmin>
                  <AdminMatchManagement />
                </RouteGuard>
              } 
            />
            <Route 
              path="admin/withdrawals" 
              element={
                <RouteGuard requireAdmin>
                  <WithdrawalManager />
                </RouteGuard>
              } 
            />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
