
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/useAuth";
import MainLayout from "@/components/layout/MainLayout";
import { RouteGuard } from "@/components/guards/RouteGuard";

// Pages
import Index from "@/pages/Index";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import Matches from "@/pages/Matches";
import Wallet from "@/pages/Wallet";
import Profile from "@/pages/Profile";
import Notifications from "@/pages/Notifications";
import NotFound from "@/pages/NotFound";
import Dashboard from "@/pages/admin/Dashboard";
import MatchManagement from "@/pages/admin/MatchManagement";
import ReferralPage from "@/pages/ReferralPage";
import AchievementsPage from "@/pages/AchievementsPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected Routes */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<Index />} />
              <Route 
                path="/matches" 
                element={
                  <RouteGuard requireAuth>
                    <Matches />
                  </RouteGuard>
                } 
              />
              <Route 
                path="/wallet" 
                element={
                  <RouteGuard requireAuth>
                    <Wallet />
                  </RouteGuard>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <RouteGuard requireAuth>
                    <Profile />
                  </RouteGuard>
                } 
              />
              <Route 
                path="/notifications" 
                element={
                  <RouteGuard requireAuth>
                    <Notifications />
                  </RouteGuard>
                } 
              />
              <Route 
                path="/referral" 
                element={
                  <RouteGuard requireAuth>
                    <ReferralPage />
                  </RouteGuard>
                } 
              />
              <Route 
                path="/achievements" 
                element={
                  <RouteGuard requireAuth>
                    <AchievementsPage />
                  </RouteGuard>
                } 
              />
              
              {/* Admin Routes */}
              <Route 
                path="/admin/dashboard" 
                element={
                  <RouteGuard requireAuth requireAdmin>
                    <Dashboard />
                  </RouteGuard>
                } 
              />
              <Route 
                path="/admin/matches" 
                element={
                  <RouteGuard requireAuth requireAdmin>
                    <MatchManagement />
                  </RouteGuard>
                } 
              />
            </Route>
            
            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
