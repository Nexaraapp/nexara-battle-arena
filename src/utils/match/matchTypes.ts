
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

// PlayFab Match type (used for matchmaking)
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

// Legacy Database Match type (for compatibility with existing database)
export interface DatabaseMatch {
  id: string;
  entry_fee: number;
  prize: number;
  slots: number;
  slots_filled: number;
  created_by: string;
  created_at: string;
  start_time?: string;
  status: string;
  type: string;
  title?: string;
  description?: string;
  mode?: string;
  room_id?: string;
  room_password?: string;
  first_prize?: number;
  second_prize?: number;
  third_prize?: number;
}

// PlayFab Queue Stats
export interface QueueStats {
  queueName: MatchType;
  playersInQueue: number;
  estimatedWaitTime: number;
  isActive: boolean;
}
