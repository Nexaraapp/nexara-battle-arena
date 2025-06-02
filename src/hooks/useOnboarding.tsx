
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useOnboarding = () => {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      checkOnboardingStatus();
    } else if (!isAuthenticated) {
      setHasCompletedOnboarding(true); // Don't show onboarding for non-authenticated users
      setLoading(false);
    }
  }, [user, isAuthenticated]);

  const checkOnboardingStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('has_completed_onboarding')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // If no profile exists, user hasn't completed onboarding
        if (error.code === 'PGRST116') {
          setHasCompletedOnboarding(false);
        } else {
          console.error('Error checking onboarding status:', error);
          setHasCompletedOnboarding(true); // Default to completed to avoid blocking
        }
      } else {
        setHasCompletedOnboarding(data?.has_completed_onboarding || false);
      }
    } catch (error) {
      console.error('Error in checkOnboardingStatus:', error);
      setHasCompletedOnboarding(true); // Default to completed to avoid blocking
    } finally {
      setLoading(false);
    }
  };

  const markOnboardingComplete = () => {
    setHasCompletedOnboarding(true);
  };

  return {
    hasCompletedOnboarding,
    loading,
    markOnboardingComplete,
    refetch: checkOnboardingStatus
  };
};
