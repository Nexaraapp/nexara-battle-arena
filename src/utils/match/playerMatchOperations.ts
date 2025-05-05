
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MatchStatus, MatchType } from "./matchTypes";

/**
 * Allow a player to join a match
 */
export const joinMatch = async (matchId: string, userId: string): Promise<boolean> => {
  try {
    // Check if the user has already joined this match
    const { data: existingEntry, error: checkError } = await supabase
      .from('match_entries')
      .select('*')
      .eq('match_id', matchId)
      .eq('user_id', userId)
      .maybeSingle();
      
    if (existingEntry) {
      toast.error("You have already joined this match");
      return false;
    }
    
    // Get match details
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();
      
    if (matchError || !match) {
      console.error("Error fetching match:", matchError);
      toast.error("Could not find match details");
      return false;
    }
    
    // Check if match is full
    if (match.slots_filled >= match.slots) {
      toast.error("This match is already full");
      return false;
    }
    
    // Find the next available slot number
    const { data: takenSlots, error: slotsError } = await supabase
      .from('match_entries')
      .select('slot_number')
      .eq('match_id', matchId)
      .order('slot_number', { ascending: true });
      
    if (slotsError) {
      console.error("Error fetching taken slots:", slotsError);
      return false;
    }
    
    const takenSlotNumbers = takenSlots.map(entry => entry.slot_number);
    let slotNumber = 1;
    while (takenSlotNumbers.includes(slotNumber)) {
      slotNumber++;
    }
    
    // Create a new entry
    const { error: insertError } = await supabase
      .from('match_entries')
      .insert({
        match_id: matchId,
        user_id: userId,
        paid: false,
        slot_number: slotNumber
      });
      
    if (insertError) {
      console.error("Error joining match:", insertError);
      toast.error("Failed to join match");
      return false;
    }
    
    // Record transaction for entry fee
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        amount: -match.entry_fee,
        type: 'match_entry',
        status: 'pending',
        match_id: matchId,
        date: new Date().toISOString().split('T')[0],
        notes: `Entry fee for ${match.type} match`
      });
      
    if (transactionError) {
      console.error("Error recording transaction:", transactionError);
      // Clean up the match entry since the transaction failed
      await supabase
        .from('match_entries')
        .delete()
        .eq('match_id', matchId)
        .eq('user_id', userId);
        
      toast.error("Failed to process entry fee");
      return false;
    }
    
    // Increment the slots filled
    const { error: updateError } = await supabase
      .from('matches')
      .update({
        slots_filled: match.slots_filled + 1
      })
      .eq('id', matchId);
      
    if (updateError) {
      console.error("Error updating match slots:", updateError);
      // Don't need to clean up since the user is still registered
    }
    
    toast.success("Successfully joined the match! Please check your notifications for match details.");
    return true;
  } catch (error) {
    console.error("Error in joinMatch:", error);
    toast.error("An unexpected error occurred");
    return false;
  }
};

/**
 * Check if a player has joined a match
 */
export const hasPlayerJoinedMatch = async (
  matchId: string,
  userId: string
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('match_entries')
      .select('*')
      .eq('match_id', matchId)
      .eq('user_id', userId)
      .maybeSingle();
      
    if (error) {
      console.error("Error checking match entry:", error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error("Error in hasPlayerJoinedMatch:", error);
    return false;
  }
};

/**
 * Get all matches a player has joined
 */
export const getPlayerMatches = async (userId: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('match_entries')
      .select('match_id')
      .eq('user_id', userId);
      
    if (error) {
      console.error("Error fetching player matches:", error);
      return [];
    }
    
    return data.map(entry => entry.match_id);
  } catch (error) {
    console.error("Error in getPlayerMatches:", error);
    return [];
  }
};

/**
 * PlayFab Integration - Join a matchmaking queue
 */
export const joinMatchQueue = async (
  queueType: MatchType,
  userId: string,
  entryFee: number
): Promise<{ success: boolean; ticketId?: string; message?: string }> => {
  try {
    console.log(`User ${userId} joining queue ${queueType} with entry fee: ${entryFee}`);
    // TODO: Implement PlayFab matchmaking request
    // This would use PlayFab's CreateMatchmakingTicket API
    
    // For now, return a mock successful response
    toast.success("Joined matchmaking queue");
    return {
      success: true,
      ticketId: `mock_ticket_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      message: "Joined matchmaking queue successfully"
    };
  } catch (error) {
    console.error("Error joining match queue:", error);
    toast.error("Failed to join matchmaking queue");
    return {
      success: false,
      message: "Failed to join matchmaking queue"
    };
  }
};

/**
 * PlayFab Integration - Cancel matchmaking request
 */
export const cancelMatchmaking = async (
  userId: string,
  ticketId: string
): Promise<boolean> => {
  try {
    console.log(`Cancelling matchmaking for user ${userId}, ticket ${ticketId}`);
    // TODO: Implement PlayFab cancel matchmaking
    // This would use PlayFab's CancelMatchmakingTicket API
    
    toast.success("Matchmaking cancelled");
    return true;
  } catch (error) {
    console.error("Error cancelling matchmaking:", error);
    toast.error("Failed to cancel matchmaking");
    return false;
  }
};

/**
 * PlayFab Integration - Check status of a matchmaking ticket
 */
export const checkMatchmakingStatus = async (
  userId: string,
  ticketId: string
): Promise<{ status: MatchStatus; matchId?: string }> => {
  try {
    console.log(`Checking status for ticket ${ticketId}`);
    // TODO: Implement PlayFab matchmaking status check
    // This would use PlayFab's GetMatchmakingTicket API
    
    // For testing, we'll simulate a match being found after some time
    const shouldFindMatch = Math.random() > 0.7;
    
    if (shouldFindMatch) {
      return {
        status: MatchStatus.InProgress,
        matchId: `match_${Date.now()}`
      };
    }
    
    return {
      status: MatchStatus.Matching
    };
  } catch (error) {
    console.error("Error checking matchmaking status:", error);
    return {
      status: MatchStatus.Cancelled
    };
  }
};

/**
 * PlayFab Integration - Submit match results
 */
export const submitMatchResults = async (
  matchId: string,
  userId: string,
  isWinner: boolean,
  score?: number
): Promise<boolean> => {
  try {
    console.log(`Submitting match results for ${matchId}, user ${userId}, winner: ${isWinner}`);
    // TODO: Implement PlayFab match result submission
    // This would use PlayFab's ReportMatchResult API
    
    toast.success("Match results submitted");
    return true;
  } catch (error) {
    console.error("Error submitting match results:", error);
    toast.error("Failed to submit match results");
    return false;
  }
};
