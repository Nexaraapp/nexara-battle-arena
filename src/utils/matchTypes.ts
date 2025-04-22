
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

// Define the comprehensive Match interface that combines both DB schema properties
export interface Match {
  id: string;
  
  // Properties from the dashboard usage
  type?: string;
  slots?: number;
  slots_filled?: number;
  entry_fee: number;
  prize?: number;
  room_id?: string;
  room_password?: string;
  created_by?: string;
  created_at: string;
  start_time: string;
  status: string;
  mode?: string;
  
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
