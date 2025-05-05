
import { Match, MatchStatus, MatchType, DatabaseMatch } from "./matchTypes";

/**
 * Convert PlayFab Match to legacy DatabaseMatch format
 * This ensures backward compatibility with components that expect the old format
 */
export function convertToLegacyMatch(match: Match): DatabaseMatch {
  return {
    id: match.id,
    entry_fee: match.entry_fee,
    prize: match.prize,
    slots: match.players.length > 0 ? match.players.length * 2 : 10, // Estimate total slots based on players
    slots_filled: match.players.length,
    created_by: match.players[0] || "system",
    created_at: match.created_at,
    start_time: match.status === MatchStatus.InProgress ? new Date().toISOString() : undefined,
    status: mapStatusToLegacy(match.status),
    type: mapTypeToLegacy(match.type),
    title: `${mapTypeToLegacy(match.type)} Match`,
    description: `${mapTypeToLegacy(match.type)} match created at ${new Date(match.created_at).toLocaleString()}`,
    mode: "default",
    room_id: `room_${match.id}`,
    first_prize: match.prize * 0.6, // 60% of prize pool
    second_prize: match.prize * 0.3, // 30% of prize pool
    third_prize: match.prize * 0.1, // 10% of prize pool
  };
}

/**
 * Convert legacy DatabaseMatch to PlayFab Match format
 */
export function convertToPlayFabMatch(dbMatch: DatabaseMatch): Match {
  return {
    id: dbMatch.id,
    type: mapLegacyToType(dbMatch.type),
    players: [], // Cannot determine players from legacy format
    status: mapLegacyToStatus(dbMatch.status),
    entry_fee: dbMatch.entry_fee,
    prize: dbMatch.prize,
    created_at: dbMatch.created_at,
    completed_at: dbMatch.status === "completed" ? new Date().toISOString() : undefined,
    winner_id: undefined // Cannot determine winner from legacy format
  };
}

/**
 * Map PlayFab match status to legacy status
 */
export function mapStatusToLegacy(status: MatchStatus): string {
  switch (status) {
    case MatchStatus.Queued:
      return "upcoming";
    case MatchStatus.Matching:
      return "upcoming";
    case MatchStatus.InProgress:
      return "active";
    case MatchStatus.Completed:
      return "completed";
    case MatchStatus.Cancelled:
      return "cancelled";
    case MatchStatus.TimedOut:
      return "cancelled";
    default:
      return "upcoming";
  }
}

/**
 * Map legacy status to PlayFab match status
 */
export function mapLegacyToStatus(legacyStatus: string): MatchStatus {
  switch (legacyStatus.toLowerCase()) {
    case "upcoming":
      return MatchStatus.Queued;
    case "active":
      return MatchStatus.InProgress;
    case "completed":
      return MatchStatus.Completed;
    case "cancelled":
      return MatchStatus.Cancelled;
    default:
      return MatchStatus.Queued;
  }
}

/**
 * Map PlayFab match type to legacy type
 */
export function mapTypeToLegacy(type: MatchType): string {
  switch (type) {
    case MatchType.OneVsOne:
      return "1v1";
    case MatchType.FourVsFour:
      return "4v4";
    case MatchType.BattleRoyale:
      return "battle-royale";
    default:
      return "custom";
  }
}

/**
 * Map legacy type to PlayFab match type
 */
export function mapLegacyToType(legacyType: string): MatchType {
  switch (legacyType.toLowerCase()) {
    case "1v1":
    case "one_vs_one":
      return MatchType.OneVsOne;
    case "4v4":
    case "four_vs_four":
      return MatchType.FourVsFour;
    case "battle-royale":
    case "battle_royale":
      return MatchType.BattleRoyale;
    default:
      return MatchType.OneVsOne;
  }
}
