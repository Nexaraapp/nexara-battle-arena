
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

type UserRole = 'user' | 'admin' | 'superadmin' | null;

interface AuthState {
  session: Session | null;
  user: User | null;
  role: UserRole;
  loading: boolean;
  error: Error | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    session: null,
    user: null,
    role: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setAuthState(prev => ({
          ...prev,
          session,
          user: session?.user ?? null,
        }));

        // If user is logged in, fetch their role
        if (session?.user) {
          // We use setTimeout(0) to prevent deadlocks with Supabase Auth
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          setAuthState(prev => ({
            ...prev,
            role: null,
            loading: false
          }));
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState(prev => ({
        ...prev,
        session,
        user: session?.user ?? null,
      }));

      // If user is logged in, fetch their role
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setAuthState(prev => ({
          ...prev,
          loading: false
        }));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error) {
        // If no role found, assume regular user
        if (error.code === 'PGRST116') {
          setAuthState(prev => ({
            ...prev,
            role: 'user',
            loading: false
          }));
        } else {
          throw error;
        }
      } else {
        setAuthState(prev => ({
          ...prev,
          role: data.role as UserRole,
          loading: false
        }));
      }
    } catch (err) {
      console.error('Error fetching user role:', err);
      setAuthState(prev => ({
        ...prev,
        error: err as Error,
        role: 'user', // Default to user role on error
        loading: false
      }));
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setAuthState({
        session: null,
        user: null,
        role: null,
        loading: false,
        error: null
      });
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const isSuperadmin = () => authState.role === 'superadmin';
  const isAdmin = () => authState.role === 'admin' || authState.role === 'superadmin';
  const isUser = () => authState.role === 'user' || isAdmin();

  return {
    ...authState,
    isAuthenticated: !!authState.user,
    isSuperadmin,
    isAdmin,
    isUser,
    signOut,
  };
};
