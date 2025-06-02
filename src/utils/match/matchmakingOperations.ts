
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MatchStatus, MatchType } from "./matchTypes";

/**
 * Join a matchmaking queue using Supabase instead of PlayFab
 */
export const joinMatchQueue = async (
  queueType: MatchType,
  userId: string,
  entryFee: number
): Promise<{ success: boolean; ticketId?: string; message?: string }> => {
  try {
    console.log(`User ${userId} joining queue ${queueType} with entry fee: ${entryFee}`);
    
    // Deduct entry fee first (consider adding a "pending" transaction)
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        amount: -entryFee,
        type: 'match_entry',
        status: 'pending',
        date: new Date().toISOString().split('T')[0],
        notes: `Entry fee for ${queueType} matchmaking`
      });
    
    if (transactionError) {
      console.error("Error recording transaction:", transactionError);
      toast.error("Failed to process entry fee");
      return { 
        success: false,
        message: "Failed to process entry fee" 
      };
    }
    
    // Mock matchmaking implementation since PlayFab is removed
    const ticketId = `ticket_${Date.now()}_${userId}`;
    
    toast.success("Joined matchmaking queue");
    return {
      success: true,
      ticketId: ticketId,
      message: "Joined matchmaking queue successfully"
    };
  } catch (error) {
    console.error("Error joining match queue:", error);
    toast.error("Failed to join matchmaking queue");
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error"
    };
  }
};

/**
 * Cancel matchmaking request using Supabase instead of PlayFab
 */
export const cancelMatchmaking = async (
  userId: string,
  ticketId: string
): Promise<boolean> => {
  try {
    console.log(`Cancelling matchmaking for user ${userId}, ticket ${ticketId}`);
    
    // Mock cancellation since PlayFab is removed
    // Refund entry fee when cancelling
    const defaultEntryFee = 10; 
    
    await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        amount: defaultEntryFee,
        type: 'refund',
        status: 'completed',
        date: new Date().toISOString().split('T')[0],
        notes: 'Refund for cancelled matchmaking'
      });
    
    toast.success("Matchmaking cancelled");
    return true;
  } catch (error) {
    console.error("Error cancelling matchmaking:", error);
    toast.error("Failed to cancel matchmaking");
    return false;
  }
};

/**
 * Check status of a matchmaking ticket using Supabase instead of PlayFab
 */
export const checkMatchmakingStatus = async (
  userId: string,
  ticketId: string
): Promise<{ status: MatchStatus; matchId?: string }> => {
  try {
    console.log(`Checking status for ticket ${ticketId}`);
    
    // Mock status check since PlayFab is removed
    // In a real implementation, you would check your database for match status
    
    // For demo purposes, randomly return different statuses
    const statuses = [MatchStatus.Matching, MatchStatus.InProgress, MatchStatus.Cancelled];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    if (randomStatus === MatchStatus.InProgress) {
      // Update transaction status from pending to completed
      await supabase
        .from('transactions')
        .update({ status: 'completed' })
        .eq('user_id', userId)
        .eq('status', 'pending')
        .eq('type', 'match_entry')
        .is('match_id', null);
        
      return {
        status: MatchStatus.InProgress,
        matchId: `match_${Date.now()}`
      };
    }
    
    return { status: randomStatus };
  } catch (error) {
    console.error("Error checking matchmaking status:", error);
    return {
      status: MatchStatus.Cancelled
    };
  }
};

/**
 * Update match with manual room ID and password using Supabase instead of PlayFab
 */
export const updateMatchWithRoomInfo = async (
  matchId: string,
  roomId: string,
  roomPassword: string
): Promise<boolean> => {
  try {
    console.log(`Updating match ${matchId} with room ID: ${roomId}`);
    
    // Update the match in our database
    const { error: dbError } = await supabase
      .from('matches')
      .update({
        room_id: roomId,
        room_password: roomPassword
      })
      .eq('id', matchId);
      
    if (dbError) {
      console.error("Error updating database with room info:", dbError);
      toast.error("Failed to update match with room information");
      return false;
    } else {
      toast.success("Match room information updated successfully");
    }
    
    return true;
  } catch (error) {
    console.error("Error updating match with room info:", error);
    toast.error("Failed to update match with room information");
    return false;
  }
};

/**
 * Get room information for a match using Supabase instead of PlayFab
 */
export const getMatchRoomInfo = async (
  matchId: string
): Promise<{ roomId?: string; roomPassword?: string; success: boolean }> => {
  try {
    console.log(`Getting room info for match ${matchId}`);
    
    // Get from our database
    const { data, error } = await supabase
      .from('matches')
      .select('room_id, room_password')
      .eq('id', matchId)
      .single();
      
    if (data && data.room_id && data.room_password) {
      return {
        roomId: data.room_id,
        roomPassword: data.room_password,
        success: true
      };
    }
    
    if (error) {
      console.error("Error getting match details:", error);
    }
    
    return { success: false };
  } catch (error) {
    console.error("Error getting match room info:", error);
    return { success: false };
  }
};
