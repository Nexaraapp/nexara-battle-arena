
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { UserRole, hasUserRole } from '@/utils/authUtils';

export const useAuth = () => {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  
  // Cache for role check results to avoid excessive DB queries
  const [isAdminCache, setIsAdminCache] = useState<boolean | null>(null);
  const [isSuperadminCache, setIsSuperadminCache] = useState<boolean | null>(null);

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log("Auth state changed:", event);
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        // Reset role caches on auth state change
        if (event === 'SIGNED_OUT') {
          setIsAdminCache(null);
          setIsSuperadminCache(null);
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Function to check if user is admin
  const isAdmin = useCallback(async () => {
    // Return cached result if available
    if (isAdminCache !== null) return isAdminCache;
    
    if (!user) return false;

    // Special case for dsouzaales06@gmail.com
    if (user.email === 'dsouzaales06@gmail.com') {
      setIsAdminCache(true);
      return true;
    }

    try {
      const result = await hasUserRole(user.id, UserRole.ADMIN) || 
                     await hasUserRole(user.id, UserRole.SUPERADMIN);
      setIsAdminCache(result);
      return result;
    } catch (error) {
      console.error('Error checking admin role:', error);
      return false;
    }
  }, [user, isAdminCache]);

  // Function to check if user is superadmin
  const isSuperadmin = useCallback(async () => {
    // Return cached result if available
    if (isSuperadminCache !== null) return isSuperadminCache;
    
    if (!user) return false;

    // Special case for dsouzaales06@gmail.com
    if (user.email === 'dsouzaales06@gmail.com') {
      setIsSuperadminCache(true);
      return true;
    }

    try {
      const result = await hasUserRole(user.id, UserRole.SUPERADMIN);
      setIsSuperadminCache(result);
      return result;
    } catch (error) {
      console.error('Error checking superadmin role:', error);
      return false;
    }
  }, [user, isSuperadminCache]);

  return {
    session,
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin,
    isSuperadmin
  };
};
