
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface RouteGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireRole?: 'admin' | 'superadmin';
}

export const RouteGuard: React.FC<RouteGuardProps> = ({
  children,
  requireAuth = false,
  requireRole
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [roleLoading, setRoleLoading] = useState(false);
  const [hasRequiredRole, setHasRequiredRole] = useState(false);

  useEffect(() => {
    const checkRole = async () => {
      if (!requireRole || !user) {
        setHasRequiredRole(true);
        return;
      }

      setRoleLoading(true);
      try {
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (!roles || roles.length === 0) {
          setHasRequiredRole(false);
          return;
        }

        const userRoles = roles.map(r => r.role);
        
        if (requireRole === 'superadmin') {
          setHasRequiredRole(userRoles.includes('superadmin'));
        } else if (requireRole === 'admin') {
          setHasRequiredRole(userRoles.includes('admin') || userRoles.includes('superadmin'));
        } else {
          setHasRequiredRole(true);
        }
      } catch (error) {
        console.error('Error checking user role:', error);
        setHasRequiredRole(false);
      } finally {
        setRoleLoading(false);
      }
    };

    if (isAuthenticated && requireRole) {
      checkRole();
    } else if (!requireRole) {
      setHasRequiredRole(true);
    }
  }, [user, requireRole, isAuthenticated]);

  if (isLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireRole && (!isAuthenticated || !hasRequiredRole)) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
