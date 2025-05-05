
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MatchStatus, MatchType } from "./matchTypes";
import PlayFabClient from "@/integrations/playfab/client";

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
    
    // Join PlayFab matchmaking queue
    const playerAttributes = {
      skill: 100, // Example attribute, could be based on player stats
      userId: userId
    };
    
    const result = await PlayFabClient.joinMatchmakingQueue(queueType, playerAttributes);
    
    if (!result.success) {
      // Refund the entry fee if matchmaking failed
      await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          amount: entryFee,
          type: 'refund',
          status: 'completed',
          date: new Date().toISOString().split('T')[0],
          notes: `Refund for failed ${queueType} matchmaking`
        });
      
      toast.error(`Failed to join matchmaking: ${result.error}`);
      return { 
        success: false,
        message: result.error || "Unknown error joining matchmaking" 
      };
    }
    
    toast.success("Joined matchmaking queue");
    return {
      success: true,
      ticketId: result.data?.TicketId,
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
 * PlayFab Integration - Cancel matchmaking request
 */
export const cancelMatchmaking = async (
  userId: string,
  ticketId: string
): Promise<boolean> => {
  try {
    console.log(`Cancelling matchmaking for user ${userId}, ticket ${ticketId}`);
    
    const result = await PlayFabClient.cancelMatchmaking(ticketId);
    
    if (result.success) {
      // Refund entry fee when cancelling
      // Note: This is a policy decision - you might choose not to refund
      // if cancelled after a certain time threshold
      
      // In this demo we'll refund the full amount
      // In a real implementation you'd look up the correct entry fee
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
    } else {
      toast.error(`Failed to cancel matchmaking: ${result.error}`);
      return false;
    }
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
    
    const result = await PlayFabClient.checkMatchmakingStatus(ticketId);
    
    if (!result.success) {
      console.error("Error checking matchmaking status:", result.error);
      return { status: MatchStatus.Cancelled };
    }
    
    // Map PlayFab status to our MatchStatus enum
    const ticketStatus = result.data?.Status;
    
    switch (ticketStatus) {
      case "Matched":
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
          matchId: result.data?.MatchId
        };
        
      case "Canceled":
        return { status: MatchStatus.Cancelled };
        
      case "TimedOut":
        // Refund entry fee for timed out matches
        const defaultEntryFee = 10; // In a real impl, look up the correct fee
        
        await supabase
          .from('transactions')
          .insert({
            user_id: userId,
            amount: defaultEntryFee,
            type: 'refund',
            status: 'completed',
            date: new Date().toISOString().split('T')[0],
            notes: 'Refund for timed out matchmaking'
          });
          
        return { status: MatchStatus.TimedOut };
        
      default:
        return { status: MatchStatus.Matching };
    }
  } catch (error) {
    console.error("Error checking matchmaking status:", error);
    return {
      status: MatchStatus.Cancelled
    };
  }
};
