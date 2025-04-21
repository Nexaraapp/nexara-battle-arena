
import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface RouteGuardProps {
  children: ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requireSuperadmin?: boolean;
}

/**
 * A component that guards routes based on authentication and role requirements
 */
export const RouteGuard: React.FC<RouteGuardProps> = ({
  children,
  requireAuth = true,
  requireAdmin = false,
  requireSuperadmin = false
}) => {
  const { isAuthenticated, isAdmin, isSuperadmin, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading) {
      // Check authentication first
      if (requireAuth && !isAuthenticated) {
        toast.error("Please login to access this page");
        navigate('/login', { state: { from: location.pathname } });
        return;
      }

      // Then check admin permissions
      if (requireAdmin && !isAdmin()) {
        toast.error("Access denied: Admin permissions required");
        navigate('/');
        return;
      }

      // Finally check superadmin permissions
      if (requireSuperadmin && !isSuperadmin()) {
        toast.error("Access denied: Superadmin permissions required");
        navigate('/');
        return;
      }
    }
  }, [loading, isAuthenticated, requireAuth, requireAdmin, requireSuperadmin, navigate, location, isAdmin, isSuperadmin]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-nexara-accent" />
      </div>
    );
  }

  // All checks passed, render children
  return <>{children}</>;
};
