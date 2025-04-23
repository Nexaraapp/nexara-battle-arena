
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getUserWalletBalance } from "./transactionApi";

export const getUserWithdrawalCount = async (userId: string): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('withdrawals')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'completed');
    if (error) {
      console.error("Error getting withdrawal count:", error);
      return 0;
    }
    return data.length;
  } catch (error) {
    console.error("Error in getUserWithdrawalCount:", error);
    return 0;
  }
};

export const createWithdrawalRequest = async (
  userId: string, 
  amount: number, 
  paymentMethod: string, 
  payoutDetails: string
): Promise<boolean> => {
  try {
    if (amount <= 0) {
      toast.error("Withdrawal amount must be greater than 0");
      return false;
    }
    const balance = await getUserWalletBalance(userId);
    if (balance < amount) {
      toast.error("Insufficient balance");
      return false;
    }
    const { data: pendingWithdrawals, error: pendingError } = await supabase
      .from('transactions')
      .select('id')
      .eq('user_id', userId)
      .eq('type', 'withdrawal')
      .eq('status', 'pending');
    if (pendingError) {
      console.error("Error checking pending withdrawals:", pendingError);
      toast.error("Failed to process withdrawal");
      return false;
    }
    if (pendingWithdrawals && pendingWithdrawals.length > 0) {
      toast.error("You already have a pending withdrawal request");
      return false;
    }
    const { error: withdrawalError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        type: 'withdrawal',
        amount: -amount,
        status: 'pending',
        date: new Date().toISOString().split('T')[0],
        notes: `Withdrawal to ${paymentMethod}. ${payoutDetails}`
      });
    if (withdrawalError) {
      console.error("Error creating withdrawal:", withdrawalError);
      toast.error("Failed to create withdrawal request");
      return false;
    }
    const { error: withdrawalsError } = await supabase
      .from('withdrawals')
      .insert({
        user_id: userId,
        amount,
        status: 'pending',
        created_at: new Date().toISOString()
      });
    if (withdrawalsError && withdrawalsError.code !== 'PGRST116') {
      console.error("Error adding withdrawal record:", withdrawalsError);
    }
    toast.success("Withdrawal request submitted successfully");
    return true;
  } catch (error) {
    console.error("Error in createWithdrawalRequest:", error);
    toast.error("An unexpected error occurred");
    return false;
  }
};

export const calculateWithdrawalPayout = (coins: number, withdrawalCount: number): number => {
  // Withdrawal tiers can be imported here if used outside Wallet
  // For now this function is only logic
  if (coins === 100) {
    return withdrawalCount < 5 ? 100 : 95;
  } else if (coins === 250) {
    return withdrawalCount < 5 ? 250 : 240;
  } else if (coins === 500) {
    return withdrawalCount < 5 ? 500 : 490;
  } else if (coins === 1000) {
    return withdrawalCount < 5 ? 1000 : 960;
  }
  return coins;
};
