
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logAdminAction } from '@/utils/adminUtils';

export const DailyMatchGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { user } = useAuth();

  const generateMatches = async () => {
    if (!user) {
      toast.error("You must be logged in to generate matches");
      return;
    }

    setIsGenerating(true);
    try {
      // Call our Supabase edge function for generating matches
      const { data, error } = await supabase.functions.invoke('generateDailyMatches', {
        method: 'POST',
        body: { requested_by: user.id }
      });
      
      if (error) {
        console.error("Error generating matches:", error);
        toast.error("Failed to generate daily matches. Please check the edge function logs.");
        return;
      }
      
      if (data?.count === 0) {
        toast.info("All default matches are already created for today");
      } else {
        toast.success(`Successfully created ${data?.count || 'multiple'} matches`);
        
        // Log the admin action
        await logAdminAction(
          user.id,
          'Generated Daily Matches',
          `Created ${data?.count} matches automatically`
        );
      }
    } catch (error: any) {
      console.error("Error in match generation:", error);
      toast.error("An error occurred during match generation. Please check server logs.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button 
      onClick={generateMatches} 
      disabled={isGenerating}
      className="bg-nexara-accent hover:bg-nexara-accent/90"
    >
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        'Generate Daily Matches'
      )}
    </Button>
  );
};
