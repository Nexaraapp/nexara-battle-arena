
import { PlayFabClient } from "@/integrations/playfab/client";
import { toast } from "sonner";

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
