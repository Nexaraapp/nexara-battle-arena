
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Submit match results using Supabase instead of PlayFab
 */
export const submitMatchResults = async (
  matchId: string,
  userId: string,
  isWinner: boolean,
  score?: number
): Promise<boolean> => {
  try {
    console.log(`Submitting match results for ${matchId}, user ${userId}, winner: ${isWinner}`);
    
    // Update player stats in database
    const statistics = {
      Wins: isWinner ? 1 : 0,
      Matches: 1,
      Score: score || 0
    };
    
    // In a real implementation, you would store these stats in your database
    console.log("Match statistics:", statistics);
    
    // If player won, award them the prize
    if (isWinner) {
      // In a real implementation you'd look up the match's prize amount
      const defaultPrize = 20; 
      
      // Record winning transaction
      await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          amount: defaultPrize,
          type: 'match_prize',
          status: 'completed',
          match_id: matchId,
          date: new Date().toISOString().split('T')[0],
          notes: 'Match prize for winning'
        });
        
      toast.success(`Congratulations! You won ${defaultPrize} coins!`);
    }
    
    toast.success("Match results submitted");
    return true;
  } catch (error) {
    console.error("Error submitting match results:", error);
    toast.error("Failed to submit match results");
    return false;
  }
};
