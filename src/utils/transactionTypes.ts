
export enum TransactionType {
  MATCH_ENTRY = 'match_entry',
  MATCH_PRIZE = 'match_prize',
  TOPUP = 'topup',
  WITHDRAWAL = 'withdrawal',
  ADMIN_REWARD = 'admin_reward',
  REFUND = 'refund'
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
  is_real_coins?: boolean; // Flag to differentiate between real and bonus coins
}

export interface WithdrawalRequest {
  id: string;
  user_id: string;
  amount: number;
  coins: number;
  status: string;
  created_at: string;
  processed_at?: string;
  processed_by?: string;
  qr_url?: string;
  payout_method: string;
  withdrawal_count: number; // Track the number of withdrawals for the user
}

export interface UserWalletInfo {
  realCoins: number;
  bonusCoins: number;
  totalCoins: number;
  totalWithdrawals: number;
  pendingWithdrawals: number;
}
