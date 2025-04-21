
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Matches from "./pages/Matches";
import Wallet from "./pages/Wallet";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import AdminDashboard from "./pages/admin/Dashboard";
import { CreateSuperadminUtility } from "./scripts/createSuperadmin";
import { SuperadminGestureDetector } from "./components/admin/SuperadminGestureDetector";
import { RouteGuard } from "./components/guards/RouteGuard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SuperadminGestureDetector />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Admin Routes */}
          <Route path="/admin" element={
            <RouteGuard requireAuth requireAdmin>
              <MainLayout>
                <AdminDashboard />
              </MainLayout>
            </RouteGuard>
          } />
          
          {/* Standard User Routes */}
          <Route path="/" element={
            <RouteGuard requireAuth>
              <MainLayout>
                <Index />
              </MainLayout>
            </RouteGuard>
          } />
          <Route path="/matches" element={
            <RouteGuard requireAuth>
              <MainLayout>
                <Matches />
              </MainLayout>
            </RouteGuard>
          } />
          <Route path="/wallet" element={
            <RouteGuard requireAuth>
              <MainLayout>
                <Wallet />
              </MainLayout>
            </RouteGuard>
          } />
          <Route path="/profile" element={
            <RouteGuard requireAuth>
              <MainLayout>
                <Profile />
              </MainLayout>
            </RouteGuard>
          } />
          <Route path="/notifications" element={
            <RouteGuard requireAuth>
              <MainLayout>
                <Notifications />
              </MainLayout>
            </RouteGuard>
          } />
          
          {/* Temporary Superadmin Creator Utility */}
          <Route path="/create-superadmin" element={<CreateSuperadminUtility />} />
          
          {/* 404 Page */}
          <Route path="*" element={<MainLayout><NotFound /></MainLayout>} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
