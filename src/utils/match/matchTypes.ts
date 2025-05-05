
// Define types for PlayFab match-related operations
export enum MatchType {
  OneVsOne = "one_vs_one",
  FourVsFour = "four_vs_four",
  BattleRoyale = "battle_royale_26_50"
}

export enum MatchStatus {
  Queued = "queued",
  Matching = "matching",
  InProgress = "in_progress",
  Completed = "completed",
  Cancelled = "cancelled",
  TimedOut = "timed_out"
}

export interface Match {
  id: string;
  type: MatchType;
  players: string[];
  status: MatchStatus;
  entry_fee: number;
  prize: number;
  created_at: string;
  completed_at?: string;
  winner_id?: string;
}

// PlayFab Queue Stats
export interface QueueStats {
  queueName: string;
  playersInQueue: number;
  estimatedWaitTime: number;
  isActive: boolean;
}
