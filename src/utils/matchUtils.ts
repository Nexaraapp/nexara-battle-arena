
import { supabase } from "@/integrations/supabase/client";
import { createNotification } from "./notificationUtils";
import { toast } from "sonner";

export enum MatchType {
  CLASH_SQUAD_SOLO = "Clash Squad Solo",
  CLASH_SQUAD_DUO = "Clash Squad Duo",
  BATTLE_ROYALE = "Battle Royale"
}

export enum MatchStatus {
  UPCOMING = "upcoming",
  ACTIVE = "active",
  COMPLETED = "completed",
  CANCELLED = "cancelled"
}

export interface Match {
  id: string;
  created_at: string;
  created_by: string;
  entry_fee: number;
  prize: number;
  room_id: string | null;
  room_password: string | null;
  slots: number;
  slots_filled: number;
  start_time: string | null;
  status: string;
  type: string;
}

export const getUpcomingMatches = async (): Promise<Match[]> => {
  try {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('status', 'upcoming')
      .order('start_time', { ascending: true });
    
    if (error) {
      console.error("Error fetching matches:", error);
      throw error;
    }
    
    return data as Match[];
  } catch (error) {
    console.error("Error in getUpcomingMatches:", error);
    throw error;
  }
};

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
    
    return data as Match[];
  } catch (error) {
    console.error("Error in getAllMatches:", error);
    throw error;
  }
};

export const joinMatch = async (matchId: string, userId: string): Promise<boolean> => {
  try {
    // Get the match details
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
    
    // Check if the match is full
    if (match.slots_filled >= match.slots) {
      toast.error("Match is already full");
      return false;
    }
    
    // Check if the user has already joined the match
    const { data: existingEntry, error: existingEntryError } = await supabase
      .from('match_entries')
      .select('*')
      .eq('match_id', matchId)
      .eq('user_id', userId)
      .single();
      
    if (existingEntry) {
      toast.error("You have already joined this match");
      return false;
    }
    
    // Create a new match entry
    const { error: entryError } = await supabase
      .from('match_entries')
      .insert({
        match_id: matchId,
        user_id: userId,
        slot_number: match.slots_filled + 1,
        paid: true // Assume payment is handled elsewhere
      });
      
    if (entryError) {
      console.error("Error creating match entry:", entryError);
      toast.error("Failed to join match");
      return false;
    }
    
    // Update the match to increment slots_filled
    const { error: updateError } = await supabase
      .from('matches')
      .update({ slots_filled: match.slots_filled + 1 })
      .eq('id', matchId);
      
    if (updateError) {
      console.error("Error updating match:", updateError);
      toast.error("Failed to update match");
      return false;
    }
    
    toast.success("Successfully joined the match!");
    return true;
  } catch (error) {
    console.error("Error in joinMatch:", error);
    toast.error("Failed to join match");
    return false;
  }
};

export const updateMatchRoomDetails = async (
  matchId: string, 
  roomId: string, 
  roomPassword: string,
  adminId?: string
): Promise<boolean> => {
  try {
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();
      
    if (matchError || !match) {
      console.error("Error fetching match:", matchError);
      return false;
    }
    
    // Update match with room details
    const { error: updateError } = await supabase
      .from('matches')
      .update({
        room_id: roomId,
        room_password: roomPassword,
        status: 'active'
      })
      .eq('id', matchId);
      
    if (updateError) {
      console.error("Error updating match:", updateError);
      return false;
    }
    
    // Get all participants
    const { data: entries, error: entriesError } = await supabase
      .from('match_entries')
      .select('user_id')
      .eq('match_id', matchId);
      
    if (entriesError) {
      console.error("Error fetching match entries:", entriesError);
      return false;
    }
    
    // Notify all participants
    const message = `Room details for match are ready! Room ID: ${roomId}, Password: ${roomPassword}`;
    
    if (entries && entries.length > 0) {
      const notifications = entries.map(entry => 
        createNotification(entry.user_id, message)
      );
      
      await Promise.all(notifications);
    }
    
    // Log admin action if admin ID is provided
    if (adminId) {
      await supabase
        .from('system_logs')
        .insert({
          admin_id: adminId,
          action: 'Match Room Updated',
          details: `Updated room details for match ID: ${matchId}`
        });
    }
    
    return true;
  } catch (error) {
    console.error("Error in updateMatchRoomDetails:", error);
    return false;
  }
};

export const createMatch = async (
  type: MatchType,
  entryFee: number,
  prize: number,
  slots: number,
  startTime: string,
  createdBy: string
): Promise<Match | null> => {
  try {
    const { data, error } = await supabase
      .from('matches')
      .insert({
        type,
        entry_fee: entryFee,
        prize,
        slots,
        start_time: startTime,
        created_by: createdBy,
        status: MatchStatus.UPCOMING
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
        admin_id: createdBy,
        action: 'Match Created',
        details: `Created ${type} match with ${slots} slots and ${entryFee} entry fee`
      });
      
    return data as Match;
  } catch (error) {
    console.error("Error in createMatch:", error);
    return null;
  }
};
