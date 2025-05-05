
import { Match, MatchType, MatchStatus, QueueStats } from "./matchTypes";

// Temporary placeholder to return empty data
// This will be replaced with PlayFab API calls
export const getActiveMatches = async (): Promise<Match[]> => {
  console.log("Placeholder for PlayFab matchmaking query - getActiveMatches");
  return [];
};

export const getMatchById = async (matchId: string): Promise<Match | null> => {
  console.log(`Placeholder for PlayFab matchmaking query - getMatchById(${matchId})`);
  return null;
};

export const getMatchesByStatus = async (status: MatchStatus | MatchStatus[]): Promise<Match[]> => {
  console.log(`Placeholder for PlayFab matchmaking query - getMatchesByStatus(${status})`);
  return [];
};

export const getMatchesByPlayer = async (playerId: string): Promise<Match[]> => {
  console.log(`Placeholder for PlayFab matchmaking query - getMatchesByPlayer(${playerId})`);
  return [];
};

export const getQueueStats = async (queueName: MatchType): Promise<QueueStats> => {
  console.log(`Placeholder for PlayFab matchmaking query - getQueueStats(${queueName})`);
  return {
    queueName,
    playersInQueue: 0,
    estimatedWaitTime: 0,
    isActive: true
  };
};

export const getAllQueueStats = async (): Promise<QueueStats[]> => {
  console.log("Placeholder for PlayFab matchmaking query - getAllQueueStats");
  return [
    {
      queueName: MatchType.OneVsOne,
      playersInQueue: 0,
      estimatedWaitTime: 0,
      isActive: true
    },
    {
      queueName: MatchType.FourVsFour,
      playersInQueue: 0,
      estimatedWaitTime: 0,
      isActive: true
    },
    {
      queueName: MatchType.BattleRoyale,
      playersInQueue: 0,
      estimatedWaitTime: 0, 
      isActive: true
    }
  ];
};
