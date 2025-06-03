
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { defaultRules } from '@/utils/defaultRulesData';
import { toast } from 'sonner';

export const useDefaultRules = () => {
  useEffect(() => {
    const initializeRules = async () => {
      try {
        // Check if rules already exist
        const { data: existingRules, error: checkError } = await supabase
          .from('rules')
          .select('id')
          .limit(1);

        if (checkError) {
          console.error('Error checking rules:', checkError);
          return;
        }

        // If no rules exist, create default ones
        if (!existingRules || existingRules.length === 0) {
          console.log('No rules found, creating default rules...');
          
          const { error: insertError } = await supabase
            .from('rules')
            .insert(defaultRules);

          if (insertError) {
            console.error('Error creating default rules:', insertError);
            toast.error('Failed to initialize rules');
          } else {
            console.log('Default rules created successfully');
          }
        }
      } catch (error) {
        console.error('Error initializing rules:', error);
      }
    };

    initializeRules();
  }, []);
};
