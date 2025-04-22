
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { hasEnoughCoins, createTransaction, getSystemSettings } from "./transactionUtils";

/**
 * Match types
 */
export type MatchType = 'BattleRoyale' | 'ClashSolo' | 'ClashDuo';

/**
 * Match status
 */
export type MatchStatus = 'upcoming' | 'active' | 'completed' | 'cancelled';

/**
 * Match interface
 */
export interface Match {
  id: string;
  type: MatchType;
  entry_fee: number;
  prize: number;
  slots: number;
  slots_filled: number;
  room_id?: string | null;
  room_password?: string | null;
  status: MatchStatus;
  created_by: string;
  created_at: string;
  start_time?: string | null;
}

/**
 * Match participant
 */
export interface MatchParticipant {
  id: string;
  user_id: string;
  match_id: string;
  slot_number: number;
  paid: boolean;
  created_at: string;
  user_email?: string;
  kills?: number;
  position?: number;
}

/**
 * Join a match after checking wallet balance
 */
export const joinMatch = async (matchId: string, userId: string): Promise<boolean> => {
  try {
    // 1. Get match details
    const { data: matchData, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();
    
    if (matchError || !matchData) {
      console.error("Error fetching match:", matchError);
      toast.error("Could not find match details");
      return false;
    }
    
    const match = matchData as Match;
    
    // 2. Check if match is joinable
    if (match.status !== 'upcoming' && match.status !== 'active') {
      toast.error("This match is no longer accepting participants");
      return false;
    }
    
    // 3. Check if there are available slots
    if (match.slots_filled >= match.slots) {
      toast.error("This match is full");
      return false;
    }
    
    // 4. Check if user has already joined this match
    const { count, error: countError } = await supabase
      .from('match_entries')
      .select('*', { count: 'exact', head: true })
      .eq('match_id', matchId)
      .eq('user_id', userId);
      
    if (countError) {
      console.error("Error checking if user already joined:", countError);
      toast.error("Unable to join match at this time");
      return false;
    }
    
    if (count && count > 0) {
      toast.error("You have already joined this match");
      return false;
    }
    
    // 5. Check if user has enough coins
    const hasBalance = await hasEnoughCoins(userId, match.entry_fee);
    if (!hasBalance) {
      toast.error(`Insufficient balance. You need ${match.entry_fee} coins to join this match.`);
      return false;
    }
    
    // 6. Create transaction for match entry fee
    const transaction = await createTransaction({
      user_id: userId,
      type: 'match_entry',
      amount: -match.entry_fee,
      status: 'completed',
      match_id: matchId,
      notes: `Entry fee for ${match.type} match`
    });
    
    if (!transaction) {
      toast.error("Failed to process payment for match entry");
      return false;
    }
    
    // 7. Add user to match participants
    const { error: entryError } = await supabase
      .from('match_entries')
      .insert({
        user_id: userId,
        match_id: matchId,
        slot_number: match.slots_filled + 1,
        paid: true,
        created_at: new Date().toISOString()
      });
    
    if (entryError) {
      console.error("Error adding user to match:", entryError);
      toast.error("Failed to join match");
      return false;
    }
    
    // 8. Update match slots_filled
    const { error: updateError } = await supabase
      .from('matches')
      .update({ slots_filled: match.slots_filled + 1 })
      .eq('id', matchId);
    
    if (updateError) {
      console.error("Error updating match slots:", updateError);
      // Not critical, so we don't return false
    }
    
    toast.success("You have successfully joined the match!");
    return true;
    
  } catch (error: any) {
    console.error("Error joining match:", error);
    toast.error("Failed to join match due to an unexpected error");
    return false;
  }
};

/**
 * Get all matches a user has joined
 */
export const getUserMatches = async (userId: string): Promise<Match[]> => {
  try {
    const { data, error } = await supabase
      .from('match_entries')
      .select(`
        matches:match_id (*)
      `)
      .eq('user_id', userId);
    
    if (error) {
      console.error("Error fetching user matches:", error);
      return [];
    }
    
    return (data?.map(entry => entry.matches) as Match[]).filter(Boolean) || [];
    
  } catch (error) {
    console.error("Error getting user matches:", error);
    return [];
  }
};

/**
 * Update match room details (admin only)
 */
export const updateMatchRoomDetails = async (
  matchId: string,
  roomId: string | null,
  roomPassword: string | null,
  adminId: string
): Promise<boolean> => {
  try {
    // Update match room details
    const { error } = await supabase
      .from('matches')
      .update({ 
        room_id: roomId,
        room_password: roomPassword,
        status: roomId ? 'active' : 'upcoming'
      })
      .eq('id', matchId);
    
    if (error) {
      console.error("Error updating match room details:", error);
      return false;
    }
    
    // Create admin log
    try {
      await supabase
        .from('system_logs')
        .insert({
          admin_id: adminId,
          action: 'Match Room Updated',
          details: `Updated room details for match ${matchId}`
        });
    } catch (logError) {
      console.error("Error logging admin action:", logError);
      // Not critical, so we continue
    }
    
    // Notify users who joined this match
    const { data: participants } = await supabase
      .from('match_entries')
      .select('user_id')
      .eq('match_id', matchId);
      
    if (participants && participants.length > 0) {
      // Create notifications for participants
      const notifications = participants.map(p => ({
        user_id: p.user_id,
        title: 'Match Room Updated',
        message: `Room details for your match have been updated. Check the matches page.`,
        type: 'match_update',
        read: false,
        created_at: new Date().toISOString()
      }));
      
      // Insert notifications if we have a notifications table
      try {
        await supabase.from('notifications').insert(notifications);
      } catch (error) {
        console.log("Notifications table may not exist:", error);
        // Not critical for core functionality, so we continue
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error updating match room details:", error);
    return false;
  }
};

/**
 * Get match participants with user info
 */
export const getMatchParticipants = async (matchId: string): Promise<MatchParticipant[]> => {
  try {
    // Get match entries
    const { data, error } = await supabase
      .from('match_entries')
      .select('*')
      .eq('match_id', matchId);
    
    if (error) {
      console.error("Error fetching match participants:", error);
      return [];
    }
    
    // For each participant, get user email
    // In a real app with many participants, this should be done in a batch
    const participants: MatchParticipant[] = [];
    
    for (const entry of data || []) {
      // Get user email (in a production app, this would use a profiles table)
      try {
        const { data: userData } = await supabase.auth.admin.getUserById(entry.user_id);
        
        if (userData?.user) {
          participants.push({
            ...entry,
            user_email: userData.user.email || 'Unknown'
          });
        } else {
          participants.push(entry as MatchParticipant);
        }
      } catch (userError) {
        console.error("Error getting user info:", userError);
        participants.push(entry as MatchParticipant);
      }
    }
    
    return participants;
  } catch (error) {
    console.error("Error getting match participants:", error);
    return [];
  }
};

/**
 * Create a new match
 */
export const createMatch = async (
  matchType: MatchType,
  entryFee: number,
  prize: number,
  slots: number,
  adminId: string
): Promise<Match | null> => {
  try {
    // Check profit margin against settings
    const settings = await getSystemSettings();
    const totalFees = entryFee * slots;
    const profitPercent = ((totalFees - prize) / totalFees) * 100;
    
    if (profitPercent < settings.matchProfitMargin) {
      toast.error(`Match profit margin too low. Must be at least ${settings.matchProfitMargin}%`);
      return null;
    }
    
    const { data, error } = await supabase
      .from('matches')
      .insert({
        type: matchType,
        entry_fee: entryFee,
        prize: prize,
        slots: slots,
        slots_filled: 0,
        status: 'upcoming',
        created_by: adminId,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error creating match:", error);
      return null;
    }
    
    // Log admin action
    await supabase
      .from('system_logs')
      .insert({
        admin_id: adminId,
        action: 'Match Created',
        details: `Created new ${matchType} match with ${slots} slots and ${entryFee} entry fee`
      });
      
    toast.success(`New ${matchType} match created successfully`);
    return data as Match;
  } catch (error) {
    console.error("Error creating match:", error);
    toast.error("Failed to create match");
    return null;
  }
};

/**
 * Award prize to match winners
 */
export const awardMatchPrizes = async (
  matchId: string,
  participants: { userId: string, position: number, kills: number }[],
  adminId: string
): Promise<boolean> => {
  try {
    // Fetch match details
    const { data: matchData, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();
      
    if (matchError || !matchData) {
      console.error("Error fetching match:", matchError);
      toast.error("Could not find match details");
      return false;
    }
    
    const match = matchData as Match;
    
    // Calculate prize distribution based on match type
    let transactions = [];
    
    if (match.type === 'BattleRoyale') {
      // Battle Royale: Position-based + kill rewards
      const KILL_REWARD = 5; // 5 coins per kill
      const POSITIONS_PRIZE = {
        1: 0.5, // First place gets 50% of prize
        2: 0.3, // Second place gets 30% of prize
        3: 0.2  // Third place gets 20% of prize
      };
      
      for (const p of participants) {
        let prizeAmount = 0;
        
        // Position prize
        if (p.position <= 3) {
          prizeAmount += match.prize * POSITIONS_PRIZE[p.position as keyof typeof POSITIONS_PRIZE];
        }
        
        // Kill rewards (only in Battle Royale)
        if (p.kills > 0) {
          prizeAmount += p.kills * KILL_REWARD;
        }
        
        // Only add transaction if there's a prize
        if (prizeAmount > 0) {
          transactions.push({
            user_id: p.userId,
            type: 'match_win' as const,
            amount: prizeAmount,
            status: 'completed' as const,
            match_id: matchId,
            notes: `Prize for ${match.type} match. Position: ${p.position}, Kills: ${p.kills}`
          });
        }
      }
    } else {
      // Clash Squad: Winner takes all, no kill rewards
      const winner = participants.find(p => p.position === 1);
      if (winner) {
        transactions.push({
          user_id: winner.userId,
          type: 'match_win' as const,
          amount: match.prize,
          status: 'completed' as const,
          match_id: matchId,
          notes: `Prize for winning ${match.type} match`
        });
      }
    }
    
    // Insert all prize transactions
    for (const tx of transactions) {
      const { error } = await supabase
        .from('transactions')
        .insert(tx);
        
      if (error) {
        console.error("Error adding prize transaction:", error);
        // Continue with other prizes even if one fails
      }
    }
    
    // Mark match as completed
    const { error: updateError } = await supabase
      .from('matches')
      .update({ status: 'completed' })
      .eq('id', matchId);
    
    if (updateError) {
      console.error("Error updating match status:", updateError);
      // Not critical, so we don't return false
    }
    
    // Log admin action
    await supabase
      .from('system_logs')
      .insert({
        admin_id: adminId,
        action: 'Match Prizes Awarded',
        details: `Awarded prizes for match ${matchId}`
      });
    
    toast.success("Match prizes awarded successfully");
    return true;
    
  } catch (error) {
    console.error("Error awarding match prizes:", error);
    toast.error("Failed to award match prizes");
    return false;
  }
};

/**
 * Get upcoming and active matches (for user view)
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
    
    return data as Match[] || [];
  } catch (error) {
    console.error("Error getting upcoming matches:", error);
    return [];
  }
};

/**
 * Get all matches (for admin view)
 */
export const getAllMatches = async (): Promise<Match[]> => {
  try {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error("Error fetching all matches:", error);
      throw error;
    }
    
    return data as Match[] || [];
  } catch (error) {
    console.error("Error getting all matches:", error);
    return [];
  }
};
