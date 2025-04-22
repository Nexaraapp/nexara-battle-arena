
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Define Match interface
export interface Match {
  id: string;
  type: string;
  entry_fee: number;
  prize: number;
  slots: number;
  slots_filled: number;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  created_at: string;
  created_by: string;
  room_id?: string;
  room_password?: string;
  start_time?: string;
}

// Define MatchType enum
export enum MatchType {
  BattleRoyale = 'BattleRoyale',
  ClashSolo = 'ClashSolo',
  ClashDuo = 'ClashDuo'
}

// Define MatchStatus enum
export enum MatchStatus {
  Upcoming = 'upcoming',
  Active = 'active',
  Completed = 'completed',
  Cancelled = 'cancelled'
}

/**
 * Get all matches
 */
export const getAllMatches = async (): Promise<Match[]> => {
  try {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error("Error fetching matches:", error);
      throw error;
    }
    
    // Ensure the returned data conforms to Match interface
    return data.map(match => ({
      ...match,
      status: match.status as Match['status']
    })) || [];
  } catch (error) {
    console.error("Error in getAllMatches:", error);
    return [];
  }
};

/**
 * Update match room details
 */
export const updateMatchRoomDetails = async (
  matchId: string,
  roomId: string,
  roomPassword: string,
  adminId: string
): Promise<boolean> => {
  try {
    // Update match room details
    const { error: updateError } = await supabase
      .from('matches')
      .update({
        room_id: roomId,
        room_password: roomPassword
      })
      .eq('id', matchId);
      
    if (updateError) {
      console.error("Error updating match room details:", updateError);
      throw updateError;
    }
    
    // Get match participants to send notifications
    const { data: participants, error: participantsError } = await supabase
      .from('match_entries')
      .select('user_id')
      .eq('match_id', matchId);
      
    if (participantsError) {
      console.error("Error fetching match participants:", participantsError);
      // Continue even if we can't fetch participants
    } else if (participants && participants.length > 0) {
      // Send notifications to all participants
      const notifications = participants.map(participant => ({
        user_id: participant.user_id,
        message: `Room details for your match have been updated. Room ID: ${roomId}, Password: ${roomPassword}`,
        read: false,
        created_at: new Date().toISOString()
      }));
      
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert(notifications);
        
      if (notificationError) {
        console.error("Error sending notifications:", notificationError);
        // Continue even if notifications fail
      }
    }
    
    // Log the action
    await supabase
      .from('system_logs')
      .insert({
        admin_id: adminId,
        action: 'Match Room Updated',
        details: `Updated room details for match ${matchId}: Room ID ${roomId}`
      });
      
    return true;
  } catch (error) {
    console.error("Error in updateMatchRoomDetails:", error);
    return false;
  }
};

/**
 * Get a specific match by ID
 */
export const getMatch = async (matchId: string): Promise<Match | null> => {
  try {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();
      
    if (error) {
      console.error("Error fetching match details:", error);
      return null;
    }
    
    // Ensure the returned data conforms to Match interface
    return {
      ...data,
      status: data.status as Match['status']
    };
  } catch (error) {
    console.error("Error in getMatch:", error);
    return null;
  }
};

/**
 * Get upcoming matches for the matches page
 */
export const getUpcomingMatches = async (): Promise<Match[]> => {
  try {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .in('status', ['upcoming', 'active'])
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error("Error fetching upcoming matches:", error);
      throw error;
    }
    
    // Ensure the returned data conforms to Match interface
    return data.map(match => ({
      ...match,
      status: match.status as Match['status']
    })) || [];
  } catch (error) {
    console.error("Error in getUpcomingMatches:", error);
    return [];
  }
};

/**
 * Join a match
 */
export const joinMatch = async (matchId: string, userId: string): Promise<boolean> => {
  try {
    // Get match details
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();
      
    if (matchError || !match) {
      console.error("Error fetching match:", matchError);
      toast.error("Match not found");
      return false;
    }
    
    // Check if match is joinable
    if (match.slots_filled >= match.slots) {
      toast.error("Match is already full");
      return false;
    }
    
    if (match.status !== 'upcoming') {
      toast.error("Match is not open for joining");
      return false;
    }
    
    // Check if user already joined
    const { data: existingEntry, error: existingError } = await supabase
      .from('match_entries')
      .select('*')
      .eq('match_id', matchId)
      .eq('user_id', userId);
      
    if (existingError) {
      console.error("Error checking existing entries:", existingError);
      toast.error("Error joining match");
      return false;
    }
    
    if (existingEntry && existingEntry.length > 0) {
      toast.error("You have already joined this match");
      return false;
    }
    
    // Start a transaction to join match and deduct entry fee
    // First, create a match entry
    const { error: entryError } = await supabase
      .from('match_entries')
      .insert({
        match_id: matchId,
        user_id: userId,
        slot_number: match.slots_filled + 1,
        paid: false
      });
      
    if (entryError) {
      console.error("Error creating match entry:", entryError);
      toast.error("Failed to join match");
      return false;
    }
    
    // Create a transaction for the entry fee
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        amount: -match.entry_fee,
        type: 'match_entry',
        match_id: matchId,
        status: 'completed',
        notes: `Entry fee for ${match.type} match`
      });
      
    if (transactionError) {
      console.error("Error creating transaction:", transactionError);
      // Rollback match entry if transaction fails
      await supabase
        .from('match_entries')
        .delete()
        .eq('match_id', matchId)
        .eq('user_id', userId);
        
      toast.error("Failed to process entry fee");
      return false;
    }
    
    // Update match slots_filled
    const { error: updateError } = await supabase
      .from('matches')
      .update({ slots_filled: match.slots_filled + 1 })
      .eq('id', matchId);
      
    if (updateError) {
      console.error("Error updating match slots:", updateError);
      // Note: We don't rollback here since the user has joined and paid
    }
    
    // Mark the entry as paid
    await supabase
      .from('match_entries')
      .update({ paid: true })
      .eq('match_id', matchId)
      .eq('user_id', userId);
    
    toast.success("Successfully joined the match!");
    return true;
  } catch (error) {
    console.error("Error in joinMatch:", error);
    toast.error("An unexpected error occurred");
    return false;
  }
};
