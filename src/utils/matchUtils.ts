
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
    
    return data || [];
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
    
    return data;
  } catch (error) {
    console.error("Error in getMatch:", error);
    return null;
  }
};

// Re-export any types
export type { Match };
