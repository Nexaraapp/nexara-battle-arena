
// Define match types and constants
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

// Define the comprehensive Match interface that combines both DB schema properties
export interface Match {
  id: string;
  
  // Properties from the dashboard usage
  type: string;
  slots: number;
  slots_filled: number;
  entry_fee: number;
  prize: number;
  room_id?: string;
  room_password?: string;
  created_by?: string;
  created_at: string;
  start_time: string;
  status: string;
  mode?: string;
  room_type?: string;
  
  // Properties from the API schema
  title?: string;
  description?: string;
  end_time?: string;
  max_participants?: number;
  current_participants?: number;
  game_id?: string;
  updated_at?: string;
  first_prize?: number;
  second_prize?: number;
  third_prize?: number;
  coins_per_kill?: number;
}
