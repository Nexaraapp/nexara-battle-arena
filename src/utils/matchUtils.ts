
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Interface defining the match object structure
export interface Match {
  id: string;
  type: string;
  slots: number;
  status: string;
  entry_fee: number;
  prize: number;
  created_at: string;
  created_by: string;
  start_time: string;
  slots_filled: number;
  room_id: string | null;
  room_password: string | null;
  first_prize?: number;
  second_prize?: number;
  third_prize?: number;
  coins_per_kill?: number;
  mode?: string;
  room_type?: string;
}

// Interface for match creation payload
export interface CreateMatchPayload {
  type: string;
  slots: number;
  entry_fee: number;
  first_prize: number;
  second_prize: number;
  third_prize: number;
  start_time: string;
  coins_per_kill?: number;
  mode: string;
  room_type: string;
}

// Match type options
export const MATCH_TYPES = [
  { value: "battle_royale", label: "Battle Royale" },
  { value: "clash_squad", label: "Clash Squad" }
];

// Match mode options
export const MATCH_MODES = {
  battle_royale: [
    { value: "solo", label: "Solo" },
    { value: "duo", label: "Duo" },
    { value: "squad", label: "Squad (4 Players)" }
  ],
  clash_squad: [
    { value: "1v1", label: "1v1" },
    { value: "2v2", label: "2v2" },
    { value: "4v4", label: "4v4" }
  ]
};

// Room type options
export const ROOM_TYPES = [
  { value: "normal", label: "Normal" },
  { value: "sniper_only", label: "Sniper Only" },
  { value: "pistol_only", label: "Pistol Only" },
  { value: "melee_only", label: "Melee Only" },
  { value: "custom", label: "Custom Rules" }
];

// Get slot count based on match type and mode
export const getSlotCountForMode = (type: string, mode: string): number => {
  if (type === "battle_royale") {
    switch (mode) {
      case "solo": return 48;
      case "duo": return 48; // 24 teams
      case "squad": return 48; // 12 teams
      default: return 48;
    }
  } else if (type === "clash_squad") {
    switch (mode) {
      case "1v1": return 2;
      case "2v2": return 4;
      case "4v4": return 8;
      default: return 8;
    }
  }
  return 48;
};

// Function to create a new match
export const createMatch = async (data: CreateMatchPayload, adminId: string): Promise<string | null> => {
  try {
    // Calculate total prize based on individual prizes
    const totalPrize = data.first_prize + data.second_prize + data.third_prize;
    
    const { data: matchData, error } = await supabase
      .from('matches')
      .insert({
        type: data.type,
        slots: data.slots,
        entry_fee: data.entry_fee,
        prize: totalPrize,
        start_time: data.start_time,
        status: 'upcoming',
        created_by: adminId,
        first_prize: data.first_prize,
        second_prize: data.second_prize,
        third_prize: data.third_prize,
        coins_per_kill: data.coins_per_kill,
        mode: data.mode,
        room_type: data.room_type
      })
      .select('id')
      .single();
      
    if (error) {
      console.error("Error creating match:", error);
      toast.error("Failed to create match");
      return null;
    }
    
    // Log the action
    await supabase
      .from('system_logs')
      .insert({
        admin_id: adminId,
        action: 'Match Created',
        details: `Created a new ${data.type} match with entry fee ${data.entry_fee} coins`
      });
      
    toast.success("Match created successfully");
    return matchData.id;
  } catch (error) {
    console.error("Error in createMatch:", error);
    toast.error("An unexpected error occurred");
    return null;
  }
};

// Function to get all matches
export const getMatches = async (): Promise<Match[]> => {
  try {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error("Error fetching matches:", error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error("Error in getMatches:", error);
    return [];
  }
};

// Function to get upcoming matches
export const getUpcomingMatches = async (): Promise<Match[]> => {
  try {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('status', 'upcoming')
      .order('start_time', { ascending: true });
      
    if (error) {
      console.error("Error fetching upcoming matches:", error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error("Error in getUpcomingMatches:", error);
    return [];
  }
};

// Function to get ongoing matches
export const getOngoingMatches = async (): Promise<Match[]> => {
  try {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('status', 'ongoing')
      .order('start_time', { ascending: true });
      
    if (error) {
      console.error("Error fetching ongoing matches:", error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error("Error in getOngoingMatches:", error);
    return [];
  }
};

// Function to get completed matches
export const getCompletedMatches = async (): Promise<Match[]> => {
  try {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('status', 'completed')
      .order('start_time', { ascending: false })
      .limit(10);
      
    if (error) {
      console.error("Error fetching completed matches:", error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error("Error in getCompletedMatches:", error);
    return [];
  }
};

// Function to update match status
export const updateMatchStatus = async (
  matchId: string, 
  status: 'upcoming' | 'ongoing' | 'completed',
  adminId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('matches')
      .update({ status })
      .eq('id', matchId);
      
    if (error) {
      console.error("Error updating match status:", error);
      toast.error("Failed to update match status");
      return false;
    }
    
    // Log the action
    await supabase
      .from('system_logs')
      .insert({
        admin_id: adminId,
        action: 'Match Status Updated',
        details: `Updated match ${matchId} status to ${status}`
      });
      
    toast.success(`Match ${status === 'ongoing' ? 'started' : status === 'completed' ? 'completed' : 'updated'}`);
    return true;
  } catch (error) {
    console.error("Error in updateMatchStatus:", error);
    toast.error("An unexpected error occurred");
    return false;
  }
};

// Function to update room details
export const updateRoomDetails = async (
  matchId: string, 
  roomId: string, 
  roomPassword: string,
  adminId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('matches')
      .update({
        room_id: roomId,
        room_password: roomPassword
      })
      .eq('id', matchId);
      
    if (error) {
      console.error("Error updating room details:", error);
      toast.error("Failed to update room details");
      return false;
    }
    
    // Log the action
    await supabase
      .from('system_logs')
      .insert({
        admin_id: adminId,
        action: 'Room Details Updated',
        details: `Updated room details for match ${matchId}`
      });
      
    toast.success("Room details updated successfully");
    return true;
  } catch (error) {
    console.error("Error in updateRoomDetails:", error);
    toast.error("An unexpected error occurred");
    return false;
  }
};

// Function to join a match
export const joinMatch = async (
  matchId: string, 
  userId: string
): Promise<boolean> => {
  try {
    // Check if match exists and has space
    const { data: matchData, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();
      
    if (matchError || !matchData) {
      console.error("Error fetching match:", matchError);
      toast.error("Match not found");
      return false;
    }
    
    if (matchData.slots_filled >= matchData.slots) {
      toast.error("Match is full");
      return false;
    }
    
    if (matchData.status !== 'upcoming') {
      toast.error("Match is no longer accepting players");
      return false;
    }
    
    // Check if user has already joined
    const { data: existingEntry } = await supabase
      .from('match_entries')
      .select('*')
      .eq('match_id', matchId)
      .eq('user_id', userId)
      .maybeSingle();
      
    if (existingEntry) {
      toast.error("You have already joined this match");
      return false;
    }
    
    // Start transaction to join match
    const { data: userData, error: userError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed');
      
    if (userError) {
      console.error("Error fetching user transactions:", userError);
      toast.error("Failed to check balance");
      return false;
    }
    
    // Calculate user balance
    let balance = 0;
    userData?.forEach(transaction => {
      balance += (transaction.amount || 0);
    });
    
    if (balance < matchData.entry_fee) {
      toast.error("Insufficient funds to join this match");
      return false;
    }
    
    // Create match entry
    const { error: entryError } = await supabase
      .from('match_entries')
      .insert({
        match_id: matchId,
        user_id: userId,
        slot_number: matchData.slots_filled + 1
      });
      
    if (entryError) {
      console.error("Error creating match entry:", entryError);
      toast.error("Failed to join match");
      return false;
    }
    
    // Update match slots filled
    const { error: updateError } = await supabase
      .from('matches')
      .update({
        slots_filled: matchData.slots_filled + 1
      })
      .eq('id', matchId);
      
    if (updateError) {
      console.error("Error updating match:", updateError);
      // Rollback entry if update fails
      await supabase
        .from('match_entries')
        .delete()
        .eq('match_id', matchId)
        .eq('user_id', userId);
        
      toast.error("Failed to join match");
      return false;
    }
    
    // Create transaction for entry fee
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        amount: -matchData.entry_fee,
        type: 'match_entry',
        status: 'completed',
        match_id: matchId,
        notes: `Entry fee for ${matchData.type} match`
      });
      
    if (transactionError) {
      console.error("Error creating transaction:", transactionError);
      // Don't rollback previous operations, but log the error
      // The user has joined the match but we failed to record the transaction
    }
    
    // Create notification for match join
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        message: `You've successfully joined a ${matchData.type} match. The match will start at ${new Date(matchData.start_time).toLocaleTimeString()}.`
      });
      
    if (notificationError) {
      console.error("Error creating notification:", notificationError);
      // Non-critical error, continue
    }
    
    toast.success("Successfully joined match");
    return true;
  } catch (error) {
    console.error("Error in joinMatch:", error);
    toast.error("An unexpected error occurred");
    return false;
  }
};

// Function to get user's matches
export const getUserMatches = async (userId: string): Promise<any[]> => {
  try {
    // Get all match entries for the user
    const { data: entries, error: entriesError } = await supabase
      .from('match_entries')
      .select('match_id')
      .eq('user_id', userId);
      
    if (entriesError) {
      console.error("Error fetching user match entries:", entriesError);
      return [];
    }
    
    if (!entries?.length) {
      return [];
    }
    
    // Get match details for each entry
    const matchIds = entries.map(entry => entry.match_id);
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('*')
      .in('id', matchIds)
      .order('start_time', { ascending: false });
      
    if (matchesError) {
      console.error("Error fetching user matches:", matchesError);
      return [];
    }
    
    return matches || [];
  } catch (error) {
    console.error("Error in getUserMatches:", error);
    return [];
  }
};

// Function to format match data for display
export const formatMatchForDisplay = (match: Match) => {
  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isPast: date < new Date()
    };
  };
  
  const startTime = formatTime(match.start_time);
  
  // Get total prize calculation
  const totalPrize = match.prize;
  
  // Get individual prize information
  const firstPrize = match.first_prize || Math.floor(totalPrize * 0.6);
  const secondPrize = match.second_prize || Math.floor(totalPrize * 0.3);
  const thirdPrize = match.third_prize || Math.floor(totalPrize * 0.1);
  
  // Get coins per kill (for Battle Royale)
  const coinsPerKill = match.type === "battle_royale" ? (match.coins_per_kill || 0) : undefined;
  
  // Format match type for display
  const matchTypeLabel = match.type === "battle_royale" ? "Battle Royale" : "Clash Squad";
  
  // Format match mode for display
  let modeLabel = match.mode || "Standard";
  if (match.mode === "solo") modeLabel = "Solo";
  if (match.mode === "duo") modeLabel = "Duo";
  if (match.mode === "squad") modeLabel = "Squad";
  if (match.mode === "1v1") modeLabel = "1v1";
  if (match.mode === "2v2") modeLabel = "2v2";
  if (match.mode === "4v4") modeLabel = "4v4";
  
  // Format room type for display
  let roomTypeLabel = match.room_type || "Normal";
  if (match.room_type === "sniper_only") roomTypeLabel = "Sniper Only";
  if (match.room_type === "pistol_only") roomTypeLabel = "Pistol Only";
  if (match.room_type === "melee_only") roomTypeLabel = "Melee Only";
  if (match.room_type === "custom") roomTypeLabel = "Custom Rules";
  
  // Room details visibility (only if match is upcoming and within 5 minutes of start time)
  const now = new Date();
  const startTimeDate = new Date(match.start_time);
  const timeDiff = (startTimeDate.getTime() - now.getTime()) / 1000 / 60; // diff in minutes
  
  // Room details are visible if match is ongoing or starting in less than 5 minutes
  const showRoomDetails = match.status === 'ongoing' || (match.status === 'upcoming' && timeDiff <= 5);
  
  return {
    ...match,
    startTime,
    totalPrize,
    firstPrize,
    secondPrize,
    thirdPrize,
    coinsPerKill,
    matchTypeLabel,
    modeLabel,
    roomTypeLabel,
    showRoomDetails,
    openSlots: match.slots - match.slots_filled
  };
};

// Function to check if a match is starting soon
export const isMatchStartingSoon = (match: Match): boolean => {
  const now = new Date();
  const startTime = new Date(match.start_time);
  const timeDiff = (startTime.getTime() - now.getTime()) / 1000 / 60; // diff in minutes
  
  return timeDiff <= 15 && timeDiff > 0;
};
