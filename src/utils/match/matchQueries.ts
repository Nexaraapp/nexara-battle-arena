
import { Match, MatchType, MatchStatus, QueueStats, DatabaseMatch } from "./matchTypes";
import { convertToLegacyMatch } from "./matchTypeConversions";

// Fetch active matches using Supabase instead of PlayFab
export const getActiveMatches = async (): Promise<Match[]> => {
  console.log("Fetching active matches from database");
  try {
    // Mock implementation - in a real app, this would call Supabase API
    // For now, return some mock data
    const matches: Match[] = [
      {
        id: `match_${Date.now()}_1`,
        type: MatchType.OneVsOne,
        players: ["player1", "player2"],
        status: MatchStatus.InProgress,
        entry_fee: 10,
        prize: 18,
        created_at: new Date().toISOString()
      },
      {
        id: `match_${Date.now()}_2`,
        type: MatchType.FourVsFour,
        players: ["player1", "player2", "player3", "player4", "player5", "player6", "player7", "player8"],
        status: MatchStatus.Queued,
        entry_fee: 15,
        prize: 100,
        created_at: new Date().toISOString()
      }
    ];
    
    return matches;
  } catch (error) {
    console.error("Error fetching active matches:", error);
    return [];
  }
};

// Get match by ID
export const getMatchById = async (matchId: string): Promise<Match | null> => {
  console.log(`Fetching match details for ${matchId} from database`);
  try {
    // Mock implementation - in a real app, this would call Supabase API
    const match: Match = {
      id: matchId,
      type: MatchType.OneVsOne,
      players: ["player1", "player2"],
      status: MatchStatus.InProgress,
      entry_fee: 10,
      prize: 18,
      created_at: new Date().toISOString()
    };
    
    return match;
  } catch (error) {
    console.error(`Error fetching match ${matchId}:`, error);
    return null;
  }
};

// Get matches by status
export const getMatchesByStatus = async (
  status: MatchStatus | MatchStatus[]
): Promise<Match[]> => {
  console.log(`Fetching matches with status ${status} from database`);
  try {
    // Mock implementation - in a real app, this would call Supabase API
    const statuses = Array.isArray(status) ? status : [status];
    
    // Create mock data based on the requested statuses
    const matches: Match[] = [];
    
    statuses.forEach((s, index) => {
      matches.push({
        id: `match_${Date.now()}_${index}`,
        type: index % 2 === 0 ? MatchType.OneVsOne : MatchType.FourVsFour,
        players: ["player1", "player2"],
        status: s,
        entry_fee: 10,
        prize: 18,
        created_at: new Date().toISOString()
      });
    });
    
    return matches;
  } catch (error) {
    console.error(`Error fetching matches with status ${status}:`, error);
    return [];
  }
};

// Get matches by player
export const getMatchesByPlayer = async (playerId: string): Promise<Match[]> => {
  console.log(`Fetching matches for player ${playerId} from database`);
  try {
    // Mock implementation - in a real app, this would call Supabase API
    const matches: Match[] = [
      {
        id: `match_${Date.now()}_1`,
        type: MatchType.OneVsOne,
        players: [playerId, "opponent1"],
        status: MatchStatus.InProgress,
        entry_fee: 10,
        prize: 18,
        created_at: new Date().toISOString()
      },
      {
        id: `match_${Date.now()}_2`,
        type: MatchType.FourVsFour,
        players: [playerId, "player2", "player3", "player4", "player5", "player6", "player7", "player8"],
        status: MatchStatus.Queued,
        entry_fee: 15,
        prize: 100,
        created_at: new Date().toISOString()
      }
    ];
    
    return matches;
  } catch (error) {
    console.error(`Error fetching matches for player ${playerId}:`, error);
    return [];
  }
};

// Get queue stats for a specific queue
export const getQueueStats = async (queueName: MatchType): Promise<QueueStats> => {
  console.log(`Fetching stats for queue ${queueName} from database`);
  try {
    // Mock implementation - in a real app, this would call Supabase API
    const waitTime = Math.floor(Math.random() * 60) + 30; // 30-90 seconds
    const playersInQueue = Math.floor(Math.random() * 20); // 0-20 players
    
    return {
      queueName,
      playersInQueue,
      estimatedWaitTime: waitTime,
      isActive: true
    };
  } catch (error) {
    console.error(`Error fetching stats for queue ${queueName}:`, error);
    return {
      queueName,
      playersInQueue: 0,
      estimatedWaitTime: 0,
      isActive: false
    };
  }
};

// Get stats for all queues
export const getAllQueueStats = async (): Promise<QueueStats[]> => {
  console.log("Fetching stats for all queues from database");
  try {
    // Mock implementation - in a real app, this would call Supabase API
    const queueTypes = [MatchType.OneVsOne, MatchType.FourVsFour, MatchType.BattleRoyale];
    
    const stats: QueueStats[] = await Promise.all(
      queueTypes.map(async (type) => await getQueueStats(type))
    );
    
    return stats;
  } catch (error) {
    console.error("Error fetching stats for all queues:", error);
    return [
      {
        queueName: MatchType.OneVsOne,
        playersInQueue: 0,
        estimatedWaitTime: 0,
        isActive: false
      },
      {
        queueName: MatchType.FourVsFour,
        playersInQueue: 0,
        estimatedWaitTime: 0,
        isActive: false
      },
      {
        queueName: MatchType.BattleRoyale,
        playersInQueue: 0,
        estimatedWaitTime: 0,
        isActive: false
      }
    ];
  }
};

// Helper function to get matches in legacy format (for backward compatibility)
export const getLegacyMatches = async (): Promise<DatabaseMatch[]> => {
  const matches = await getActiveMatches();
  return matches.map(convertToLegacyMatch);
};
