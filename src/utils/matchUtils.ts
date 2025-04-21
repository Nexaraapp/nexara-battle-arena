
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { hasEnoughCoins, createTransaction } from "./transactionUtils";

/**
 * Match types
 */
export type MatchType = 'ClashSolo' | 'ClashDuo' | 'BattleRoyale';

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
  room_id?: string;
  room_password?: string;
  status: MatchStatus;
  created_by: string;
  created_at: string;
  start_time?: string;
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
    
    // 4. Check if user has enough coins
    const hasBalance = await hasEnoughCoins(userId, match.entry_fee);
    if (!hasBalance) {
      toast.error(`Insufficient balance. You need ${match.entry_fee} coins to join this match.`);
      return false;
    }
    
    // 5. Create transaction for match entry fee (negative amount)
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
    
    // 6. Add user to match participants
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
    
    // 7. Update match slots_filled
    const { error: updateError } = await supabase
      .from('matches')
      .update({ slots_filled: match.slots_filled + 1 })
      .eq('id', matchId);
    
    if (updateError) {
      console.error("Error updating match slots:", updateError);
      // Not critical, so we don't return false
    }
    
    // Success!
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
export const getUserMatches = async (userId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('match_entries')
      .select(`
        match_id,
        matches:match_id (*)
      `)
      .eq('user_id', userId);
    
    if (error) {
      console.error("Error fetching user matches:", error);
      return [];
    }
    
    return data || [];
    
  } catch (error) {
    console.error("Error getting user matches:", error);
    return [];
  }
};
