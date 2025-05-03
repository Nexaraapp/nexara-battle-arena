
// This file is now a wrapper for the new refactored match modules
// It's maintained for backward compatibility
import { 
  Match, 
  MatchType, 
  MatchStatus,
  RoomMode,
  RoomType 
} from './match/matchTypes';

import {
  getUpcomingMatches,
  getMatchById,
  getMatchesByStatus
} from './match/matchQueries';

import {
  updateMatchRoomDetails,
  createMatch,
  cancelMatch,
  completeMatch
} from './match/adminMatchOperations';

import {
  joinMatch,
  hasPlayerJoinedMatch,
  getPlayerMatches
} from './match/playerMatchOperations';

// Re-export everything for backward compatibility
export {
  // Types
  Match,
  MatchType,
  MatchStatus,
  RoomMode,
  RoomType,
  
  // Queries
  getUpcomingMatches,
  getMatchById,
  getMatchesByStatus,
  
  // Admin operations
  updateMatchRoomDetails,
  createMatch,
  cancelMatch,
  completeMatch,
  
  // Player operations
  joinMatch,
  hasPlayerJoinedMatch,
  getPlayerMatches
};
