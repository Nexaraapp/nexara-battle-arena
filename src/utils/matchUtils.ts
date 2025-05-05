
// This file is now a wrapper for the new PlayFab match modules
// It's maintained for backward compatibility
import type { 
  Match, 
  MatchType, 
  MatchStatus,
  QueueStats 
} from './match/matchTypes';

import {
  getActiveMatches,
  getMatchById,
  getMatchesByStatus,
  getQueueStats,
  getAllQueueStats
} from './match/matchQueries';

import {
  getPlayFabMatchmakingStats,
  configureMatchmakingRules
} from './match/adminMatchOperations';

import {
  joinMatchQueue,
  cancelMatchmaking,
  checkMatchmakingStatus,
  submitMatchResults
} from './match/playerMatchOperations';

// Re-export everything for backward compatibility
export {
  // Types
  type Match,
  type MatchType,
  type MatchStatus,
  type QueueStats,
  
  // Queries
  getActiveMatches,
  getMatchById,
  getMatchesByStatus,
  getQueueStats,
  getAllQueueStats,
  
  // Admin operations
  getPlayFabMatchmakingStats,
  configureMatchmakingRules,
  
  // Player operations
  joinMatchQueue,
  cancelMatchmaking,
  checkMatchmakingStatus,
  submitMatchResults
};
