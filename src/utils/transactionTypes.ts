
export enum TransactionType {
  MATCH_ENTRY = 'match_entry',
  MATCH_PRIZE = 'match_prize',
  TOPUP = 'topup',
  WITHDRAWAL = 'withdrawal',
  ADMIN_REWARD = 'admin_reward'
}

export interface Transaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  status: string;
  date: string;
  match_id?: string;
  notes?: string;
  admin_id?: string;
  is_real_coins?: boolean;
}
