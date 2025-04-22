
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

export interface Match {
  id: string;
  type: string;
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
}
