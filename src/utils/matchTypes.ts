// Define match types and constants
export enum MatchType {
  BattleRoyale = 'BattleRoyale',
  ClashSolo = 'ClashSolo',
  ClashDuo = 'ClashDuo',
  ClashSquad = 'ClashSquad'
}

export enum RoomMode {
  Solo = 'Solo',
  Duo = 'Duo',
  Squad = 'Squad'
}

export enum RoomType {
  Normal = 'Normal',
  Sniper = 'Sniper',
  Pistol = 'Pistol',
  Melee = 'Melee',
  Custom = 'Custom'
}

// Check if this file exists and add the missing properties to the Match interface
export interface Match {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  status: string;
  entry_fee: number;
  max_participants: number;
  current_participants: number;
  game_id: string;
  created_at: string;
  updated_at: string;
  mode?: string;
  first_prize?: number;
  second_prize?: number;
  third_prize?: number;
}
