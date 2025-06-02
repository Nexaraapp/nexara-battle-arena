
import { PlayFabClient } from "@/integrations/playfab/client";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Match, MatchType, MatchStatus, DatabaseMatch } from "./matchTypes";
import { handleError, createMatchError } from "../errorHandling";
import { logAdminAction } from "../adminUtils";

/**
 * View PlayFab matchmaking statistics
 */
export const getPlayFabMatchmakingStats = async (): Promise<any> => {
  try {
    console.log("Getting PlayFab matchmaking statistics");
    
    // Get stats for each queue
    const queueTypes = ["one_vs_one", "four_vs_four", "battle_royale_26_50"];
    let totalPlayersInQueues = 0;
    let totalWaitTime = 0;
    let activeQueues = 0;
    
    for (const queue of queueTypes) {
      // In a real implementation, this would call PlayFab API
      // For now, we'll return mock data
      const playerCount = Math.floor(Math.random() * 20);
      const waitTime = Math.floor(Math.random() * 60) + 30; // 30-90 seconds
      
      totalPlayersInQueues += playerCount;
      totalWaitTime += waitTime;
      activeQueues++;
    }
    
    const averageWaitTime = activeQueues > 0 ? Math.floor(totalWaitTime / activeQueues) : 0;
    
    return {
      activeQueues,
      totalPlayersInQueues,
      averageWaitTime
    };
  } catch (error) {
    console.error("Error getting matchmaking statistics:", error);
    toast.error("Failed to get matchmaking statistics");
    return {
      activeQueues: 0,
      totalPlayersInQueues: 0,
      averageWaitTime: 0
    };
  }
};

interface CreateMatchParams {
  title: string;
  description?: string;
  type: string;
  mode?: string;
  entry_fee: number;
  slots: number;
  first_prize?: number;
  second_prize?: number;
  third_prize?: number;
  coins_per_kill?: number;
  room_id?: string;
  room_password?: string;
  admin_id: string;
}

/**
 * Create a new match as an admin
 */
export const createMatch = async (params: CreateMatchParams): Promise<string | null> => {
  try {
    // Calculate prize based on entry fee and slots for now
    const calculatedPrize = params.entry_fee * params.slots;

    // Create the match in the database
    const { data, error } = await supabase
      .from('matches')
      .insert({
        title: params.title,
        description: params.description,
        type: params.type,
        mode: params.mode,
        entry_fee: params.entry_fee,
        prize: calculatedPrize,
        slots: params.slots,
        slots_filled: 0,
        first_prize: params.first_prize,
        second_prize: params.second_prize,
        third_prize: params.third_prize,
        coins_per_kill: params.coins_per_kill,
        room_id: params.room_id,
        room_password: params.room_password,
        status: 'upcoming',
        created_by: params.admin_id,
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) {
      throw createMatchError(
        "JOIN_FAILED",
        "Failed to create match",
        { error, params }
      );
    }

    // Log the admin action
    await logAdminAction(
      params.admin_id,
      "Created Match",
      `Created new ${params.type} match with ${params.slots} slots`
    );

    toast.success("Match created successfully");
    return data.id;
  } catch (error) {
    handleError(error, { params });
    return null;
  }
};

/**
 * Configure PlayFab matchmaking rules 
 */
export const configureMatchmakingRules = async (
  queueName: string,
  ruleConfig: any,
  adminId: string
): Promise<boolean> => {
  try {
    console.log(`Configuring rules for queue ${queueName}`);
    // In a real implementation, this would call PlayFab APIs to update queue settings
    
    toast.success("Queue configuration updated");
    return true;
  } catch (error) {
    console.error("Error configuring matchmaking rules:", error);
    toast.error("Failed to update queue configuration");
    return false;
  }
};
