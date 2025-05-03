
import { supabase } from "@/integrations/supabase/client";
import { Match } from "./matchTypes";

/**
 * Fetch all upcoming matches
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
      return [];
    }
    
    return data as Match[];
  } catch (error) {
    console.error("Error in getUpcomingMatches:", error);
    return [];
  }
};

/**
 * Get match details by ID
 */
export const getMatchById = async (matchId: string): Promise<Match | null> => {
  try {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();
      
    if (error) {
      console.error("Error fetching match:", error);
      return null;
    }
    
    return data as Match;
  } catch (error) {
    console.error("Error in getMatchById:", error);
    return null;
  }
};

/**
 * Get all matches by status
 */
export const getMatchesByStatus = async (status: string | string[]): Promise<Match[]> => {
  try {
    const statusArray = Array.isArray(status) ? status : [status];
    
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .in('status', statusArray)
      .order('start_time', { ascending: true });
      
    if (error) {
      console.error("Error fetching matches by status:", error);
      return [];
    }
    
    return data as Match[];
  } catch (error) {
    console.error("Error in getMatchesByStatus:", error);
    return [];
  }
};
