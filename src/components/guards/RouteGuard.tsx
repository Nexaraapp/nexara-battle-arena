
import { ReactNode, useEffect, useState } from 'react';
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
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (loading) return;

        // Check authentication first
        if (requireAuth && !isAuthenticated) {
          toast.error("Please login to access this page");
          navigate('/login', { state: { from: location.pathname } });
          return;
        }

        // Then check admin permissions
        if (requireAdmin && !(await isAdmin())) {
          toast.error("Access denied: Admin permissions required");
          navigate('/');
          return;
        }

        // Finally check superadmin permissions
        if (requireSuperadmin && !(await isSuperadmin())) {
          toast.error("Access denied: Superadmin permissions required");
          navigate('/');
          return;
        }
      } catch (error) {
        console.error("Error in RouteGuard:", error);
        toast.error("An error occurred while checking permissions");
        navigate('/login');
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [loading, isAuthenticated, requireAuth, requireAdmin, requireSuperadmin, navigate, location, isAdmin, isSuperadmin]);

  // Show loading state while checking authentication
  if (loading || isChecking) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-nexara-accent" />
      </div>
    );
  }

  // All checks passed, render children
  return <>{children}</>;
};
