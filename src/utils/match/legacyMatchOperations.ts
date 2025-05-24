import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  handleError, 
  createMatchError, 
  createTransactionError, 
  withRetry 
} from "../errorHandling";

/**
 * Allow a player to join a match (legacy function for backward compatibility)
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
      
    if (checkError) {
      throw createMatchError(
        "JOIN_FAILED",
        "Failed to check existing match entry",
        { matchId, userId, error: checkError }
      );
    }
      
    if (existingEntry) {
      throw createMatchError(
        "JOIN_FAILED",
        "You have already joined this match",
        { matchId, userId }
      );
    }
    
    // Get match details with retry for network issues
    const { data: match, error: matchError } = await withRetry(async () => 
      await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single()
    );
      
    if (matchError || !match) {
      throw createMatchError(
        "JOIN_FAILED",
        "Could not find match details",
        { matchId, error: matchError }
      );
    }
    
    // Check if match is full
    if (match.slots_filled >= match.slots) {
      throw createMatchError(
        "FULL_CAPACITY",
        "This match is already full",
        { matchId, slots: match.slots, slotsFilled: match.slots_filled }
      );
    }
    
    // Find the next available slot number
    const { data: takenSlots, error: slotsError } = await supabase
      .from('match_entries')
      .select('slot_number')
      .eq('match_id', matchId)
      .order('slot_number', { ascending: true });
      
    if (slotsError) {
      throw createMatchError(
        "JOIN_FAILED",
        "Failed to check available slots",
        { matchId, error: slotsError }
      );
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
      throw createMatchError(
        "JOIN_FAILED",
        "Failed to join match",
        { matchId, userId, slotNumber, error: insertError }
      );
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
      // Clean up the match entry since the transaction failed
      await supabase
        .from('match_entries')
        .delete()
        .eq('match_id', matchId)
        .eq('user_id', userId);
        
      throw createTransactionError(
        "FAILED_PROCESSING",
        "Failed to process entry fee",
        { matchId, userId, entryFee: match.entry_fee, error: transactionError }
      );
    }
    
    // Increment the slots filled
    const { error: updateError } = await supabase
      .from('matches')
      .update({
        slots_filled: match.slots_filled + 1
      })
      .eq('id', matchId);
      
    if (updateError) {
      handleError(
        createMatchError(
          "JOIN_FAILED",
          "Failed to update match slots",
          { matchId, newSlotsFilled: match.slots_filled + 1, error: updateError }
        )
      );
      // Don't throw here since the user is still registered
    }
    
    toast.success("Successfully joined the match! Please check your notifications for match details.");
    return true;
  } catch (error) {
    handleError(error, { matchId, userId });
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
