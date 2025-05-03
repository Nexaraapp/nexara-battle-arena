
// Define types for match-related operations
export enum MatchType {
  BattleRoyale = "battle_royale",
  ClashSolo = "clash_solo",
  ClashDuo = "clash_duo",
  ClashSquad = "clash_squad"
}

export enum RoomMode {
  Solo = "solo",
  Duo = "duo",
  Squad = "squad"
}

export enum RoomType {
  Normal = "normal",
  Sniper = "sniper_only",
  Pistol = "pistol_only",
  Melee = "melee_only",
  Custom = "custom"
}

export enum MatchStatus {
  Upcoming = "upcoming",
  Active = "active",
  Completed = "completed",
  Cancelled = "cancelled"
}

export interface Match {
  id: string;
  type: string;
  mode?: string;
  room_type?: string;
  entry_fee: number;
  prize: number;
  slots: number;
  slots_filled: number;
  created_at: string;
  created_by: string;
  start_time: string | null;
  room_id?: string | null;
  room_password?: string | null;
  status: string;
  first_prize?: number | null;
  second_prize?: number | null;
  third_prize?: number | null;
  coins_per_kill?: number | null;
  title?: string | null;
  description?: string | null;
}
