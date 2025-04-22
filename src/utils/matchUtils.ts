
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
  mode?: string; // Solo, Duo, Squad
  room_type?: string; // Normal, Sniper, Pistol-only, etc.
  coins_per_kill?: number; // For Battle Royale
  first_prize?: number; // For winners
  second_prize?: number;
  third_prize?: number;
}

// Define MatchType enum
export enum MatchType {
  BattleRoyale = 'Battle Royale',
  ClashSolo = 'Clash Solo',
  ClashDuo = 'Clash Duo',
  ClashSquad = 'Clash Squad'
}

// Define MatchStatus enum
export enum MatchStatus {
  Upcoming = 'upcoming',
  Active = 'active',
  Completed = 'completed',
  Cancelled = 'cancelled'
}

// Define RoomType enum
export enum RoomType {
  Normal = 'Normal',
  Sniper = 'Sniper Only',
  Pistol = 'Pistol Only',
  Melee = 'Melee Only',
  Custom = 'Custom Rules'
}

// Define RoomMode enum
export enum RoomMode {
  Solo = 'Solo',
  Duo = 'Duo',
  Squad = 'Squad'
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
 * Create a new match
 */
export const createMatch = async (matchData: Partial<Match>, adminId: string): Promise<Match | null> => {
  try {
    const { data, error } = await supabase
      .from('matches')
      .insert({
        type: matchData.type,
        entry_fee: matchData.entry_fee,
        prize: matchData.prize,
        slots: matchData.slots,
        slots_filled: 0,
        status: 'upcoming',
        created_by: adminId,
        start_time: matchData.start_time,
        room_id: matchData.room_id,
        room_password: matchData.room_password,
        mode: matchData.mode,
        room_type: matchData.room_type,
        coins_per_kill: matchData.coins_per_kill,
        first_prize: matchData.first_prize,
        second_prize: matchData.second_prize,
        third_prize: matchData.third_prize
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating match:", error);
      throw error;
    }

    // Log the action
    await supabase
      .from('system_logs')
      .insert({
        admin_id: adminId,
        action: 'Match Created',
        details: `Created ${matchData.type} match with ${matchData.slots} slots`
      });

    return data as Match;
  } catch (error) {
    console.error("Error in createMatch:", error);
    return null;
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
        read: false
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

/**
 * Check if a user has access to room details
 */
export const checkRoomAccessibility = async (
  matchId: string, 
  userId: string
): Promise<{ hasAccess: boolean; match: Match | null }> => {
  try {
    // Get match details
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();
      
    if (matchError || !match) {
      console.error("Error fetching match:", matchError);
      return { hasAccess: false, match: null };
    }
    
    // Check if the match start time is within 5 minutes
    const startTime = new Date(match.start_time || '');
    const now = new Date();
    const timeDiff = startTime.getTime() - now.getTime();
    const fiveMinutesInMs = 5 * 60 * 1000;
    
    if (timeDiff > fiveMinutesInMs) {
      return { hasAccess: false, match: match as Match };
    }
    
    // Check if the user has paid for the match
    const { data: entry, error: entryError } = await supabase
      .from('match_entries')
      .select('paid')
      .eq('match_id', matchId)
      .eq('user_id', userId)
      .single();
      
    if (entryError || !entry || !entry.paid) {
      return { hasAccess: false, match: match as Match };
    }
    
    return { hasAccess: true, match: match as Match };
  } catch (error) {
    console.error("Error in checkRoomAccessibility:", error);
    return { hasAccess: false, match: null };
  }
};

/**
 * Cancel a match (admin only)
 */
export const cancelMatch = async (matchId: string, adminId: string): Promise<boolean> => {
  try {
    // Update match status to cancelled
    const { error: updateError } = await supabase
      .from('matches')
      .update({ status: 'cancelled' })
      .eq('id', matchId);
      
    if (updateError) {
      console.error("Error cancelling match:", updateError);
      throw updateError;
    }
    
    // Get match participants to send notifications and refund
    const { data: entries, error: entriesError } = await supabase
      .from('match_entries')
      .select('user_id')
      .eq('match_id', matchId)
      .eq('paid', true);
      
    if (entriesError) {
      console.error("Error fetching match entries:", entriesError);
      // Continue even if we can't fetch entries
    } else if (entries && entries.length > 0) {
      // Get match details for refund amount
      const { data: match } = await supabase
        .from('matches')
        .select('entry_fee')
        .eq('id', matchId)
        .single();
      
      if (match) {
        // Process refunds for all participants
        const transactions = entries.map(entry => ({
          user_id: entry.user_id,
          amount: match.entry_fee,
          type: 'match_refund',
          match_id: matchId,
          status: 'completed',
          notes: `Refund for cancelled match`
        }));
        
        const { error: transactionError } = await supabase
          .from('transactions')
          .insert(transactions);
          
        if (transactionError) {
          console.error("Error processing refunds:", transactionError);
        }
        
        // Send notifications to all participants
        const notifications = entries.map(entry => ({
          user_id: entry.user_id,
          message: `A match you joined has been cancelled. Your entry fee has been refunded.`,
          read: false
        }));
        
        await supabase
          .from('notifications')
          .insert(notifications);
      }
    }
    
    // Log the action
    await supabase
      .from('system_logs')
      .insert({
        admin_id: adminId,
        action: 'Match Cancelled',
        details: `Cancelled match ${matchId}`
      });
      
    return true;
  } catch (error) {
    console.error("Error in cancelMatch:", error);
    return false;
  }
};

/**
 * Complete a match (admin only)
 */
export const completeMatch = async (matchId: string, adminId: string): Promise<boolean> => {
  try {
    // Update match status to completed
    const { error: updateError } = await supabase
      .from('matches')
      .update({ status: 'completed' })
      .eq('id', matchId);
      
    if (updateError) {
      console.error("Error completing match:", updateError);
      throw updateError;
    }
    
    // Log the action
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

// Function to distribute rewards (admin only)
export const distributeRewards = async (
  matchId: string, 
  winners: { userId: string; position: number; kills?: number }[],
  adminId: string
): Promise<boolean> => {
  try {
    // Get match details
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();
      
    if (matchError || !match) {
      console.error("Error fetching match:", matchError);
      return false;
    }
    
    // Process rewards for each winner
    for (const winner of winners) {
      let reward = 0;
      let rewardDetails = '';
      
      // Calculate position-based rewards
      if (winner.position === 1 && match.first_prize) {
        reward += match.first_prize;
        rewardDetails = `1st place (${match.first_prize} coins)`;
      } else if (winner.position === 2 && match.second_prize) {
        reward += match.second_prize;
        rewardDetails = `2nd place (${match.second_prize} coins)`;
      } else if (winner.position === 3 && match.third_prize) {
        reward += match.third_prize;
        rewardDetails = `3rd place (${match.third_prize} coins)`;
      }
      
      // Add kill rewards for Battle Royale
      if (match.type === MatchType.BattleRoyale && winner.kills && match.coins_per_kill) {
        const killReward = winner.kills * match.coins_per_kill;
        reward += killReward;
        rewardDetails += rewardDetails ? ` + ${winner.kills} kills (${killReward} coins)` : `${winner.kills} kills (${killReward} coins)`;
      }
      
      if (reward > 0) {
        // Create transaction for the reward
        const { error: transactionError } = await supabase
          .from('transactions')
          .insert({
            user_id: winner.userId,
            amount: reward,
            type: 'match_reward',
            match_id: matchId,
            status: 'completed',
            notes: `Reward for ${match.type} match: ${rewardDetails}`
          });
          
        if (transactionError) {
          console.error("Error creating reward transaction:", transactionError);
          continue;  // Continue with other winners even if one fails
        }
        
        // Send notification to the winner
        await supabase
          .from('notifications')
          .insert({
            user_id: winner.userId,
            message: `You've received ${reward} coins as reward for your performance in a match! ${rewardDetails}`,
            read: false
          });
      }
    }
    
    // Log the action
    await supabase
      .from('system_logs')
      .insert({
        admin_id: adminId,
        action: 'Match Rewards Distributed',
        details: `Distributed rewards for match ${matchId} to ${winners.length} players`
      });
      
    return true;
  } catch (error) {
    console.error("Error in distributeRewards:", error);
    return false;
  }
};
