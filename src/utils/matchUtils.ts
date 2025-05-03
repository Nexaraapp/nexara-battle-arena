
import { supabase } from "@/integrations/supabase/client";
import { Match, MatchType, MatchStatus } from "./matchTypes";
import { toast } from "sonner";

export type { Match } from "./matchTypes";
export { MatchType, MatchStatus } from "./matchTypes";

export const updateMatchRoomDetails = async (
  matchId: string,
  roomId: string,
  roomPassword: string,
  adminId: string
): Promise<boolean> => {
  try {
    // Update the match with room details
    const { error: updateError } = await supabase
      .from('matches')
      .update({
        room_id: roomId,
        room_password: roomPassword
      })
      .eq('id', matchId);
      
    if (updateError) {
      console.error("Error updating match room details:", updateError);
      return false;
    }
    
    // Log the admin action
    await supabase
      .from('system_logs')
      .insert({
        admin_id: adminId,
        action: 'Match Room Updated',
        details: `Updated room details for match ${matchId}`
      });
    
    // Fetch participants to notify them
    const { data: participants, error: fetchError } = await supabase
      .from('match_entries')
      .select('user_id')
      .eq('match_id', matchId)
      .eq('paid', true);
      
    if (!fetchError && participants && participants.length > 0) {
      // Prepare notifications
      const notifications = participants.map((participant) => ({
        user_id: participant.user_id,
        message: 'The room details for your upcoming match have been updated. Check the match page for details.'
      }));
      
      // Insert notifications
      await supabase
        .from('notifications')
        .insert(notifications);
    }
    
    return true;
  } catch (error) {
    console.error("Error in updateMatchRoomDetails:", error);
    return false;
  }
};

export const createMatch = async (
  matchData: {
    type: string;
    entry_fee: number;
    prize: number;
    slots: number;
    start_time: string | null;
    room_id: string | null;
    room_password: string | null;
    mode?: string;
    room_type?: string;
    coins_per_kill?: number;
    first_prize?: number;
    second_prize?: number;
    third_prize?: number;
  },
  adminId: string
): Promise<Match | null> => {
  try {
    // Add the admin as the creator
    const newMatch = {
      ...matchData,
      created_by: adminId,
      status: 'upcoming',
      slots_filled: 0
    };
    
    // Insert the match
    const { data, error } = await supabase
      .from('matches')
      .insert(newMatch)
      .select('*')
      .single();
      
    if (error) {
      console.error("Error creating match:", error);
      toast.error("Failed to create match: " + error.message);
      return null;
    }
    
    // Log the admin action
    await supabase
      .from('system_logs')
      .insert({
        admin_id: adminId,
        action: 'Match Created',
        details: `Created a new ${matchData.type} match with ${matchData.slots} slots and ${matchData.entry_fee} entry fee`
      });
      
    return data as Match;
  } catch (error: any) {
    console.error("Error in createMatch:", error);
    toast.error("An unexpected error occurred: " + error.message);
    return null;
  }
};

export const cancelMatch = async (
  matchId: string,
  adminId: string
): Promise<boolean> => {
  try {
    // Get match details first
    const { data: matchData, error: fetchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();
      
    if (fetchError || !matchData) {
      console.error("Error fetching match:", fetchError);
      return false;
    }
    
    // We need to manually implement the match cancellation since RPC is not available
    // First update match status
    const { error: updateError } = await supabase
      .from('matches')
      .update({ status: 'cancelled' })
      .eq('id', matchId);
      
    if (updateError) {
      console.error("Error cancelling match:", updateError);
      return false;
    }
    
    // Get all paid entries
    const { data: entries, error: entriesError } = await supabase
      .from('match_entries')
      .select('user_id')
      .eq('match_id', matchId)
      .eq('paid', true);
      
    if (entriesError) {
      console.error("Error fetching match entries:", entriesError);
      return false;
    }
    
    // Refund all paid entries
    if (entries && entries.length > 0) {
      const refundTransactions = entries.map(entry => ({
        user_id: entry.user_id,
        amount: matchData.entry_fee, // Refund the entry fee
        type: 'refund',
        status: 'completed',
        match_id: matchId,
        date: new Date().toISOString().split('T')[0],
        notes: `Refund for cancelled match ${matchId}`
      }));
      
      const { error: refundError } = await supabase
        .from('transactions')
        .insert(refundTransactions);
        
      if (refundError) {
        console.error("Error processing refunds:", refundError);
        return false;
      }
    }
    
    // Log the admin action
    await supabase
      .from('system_logs')
      .insert({
        admin_id: adminId,
        action: 'Match Cancelled',
        details: `Cancelled match ${matchId} and processed refunds for ${entries?.length || 0} participants`
      });
    
    return true;
  } catch (error) {
    console.error("Error in cancelMatch:", error);
    return false;
  }
};

export const completeMatch = async (
  matchId: string,
  adminId: string
): Promise<boolean> => {
  try {
    // Update the match status to completed
    const { error: updateError } = await supabase
      .from('matches')
      .update({
        status: 'completed'
      })
      .eq('id', matchId);
      
    if (updateError) {
      console.error("Error completing match:", updateError);
      return false;
    }
    
    // Log the admin action
    await supabase
      .from('system_logs')
      .insert({
        admin_id: adminId,
        action: 'Match Completed',
        details: `Marked match ${matchId} as completed`
      });
    
    return true;
  } catch (error) {
    console.error("Error in completeMatch:", error);
    return false;
  }
};

// Add joinMatch function for other pages that need it
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

// Add getUpcomingMatches for other pages that need it
export const getUpcomingMatches = async (): Promise<Match[]> => {
  try {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .in('status', ['upcoming', 'active'])
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error("Error fetching upcoming matches:", error);
      return [];
    }
    
    return data as Match[];
  } catch (error) {
    console.error("Error in getUpcomingMatches:", error);
    return [];
  }
};
