import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getUserWalletBalance } from "./transactionApi";
import { 
  handleError, 
  createTransactionError, 
  withRetry, 
  ErrorCodes 
} from "./errorHandling";

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
    // Validate amount
    if (amount <= 0) {
      throw createTransactionError(
        "INVALID_AMOUNT",
        "Withdrawal amount must be greater than 0",
        { userId, amount }
      );
    }

    // Check balance with retry for network issues
    const balance = await withRetry(
      async () => await getUserWalletBalance(userId),
      {
        maxAttempts: 3,
        delayMs: 1000,
        shouldRetry: (error) => error.code === ErrorCodes.API.NETWORK_ERROR
      }
    );

    if (balance < amount) {
      throw createTransactionError(
        "INSUFFICIENT_BALANCE",
        "Insufficient balance",
        { userId, balance, requestedAmount: amount }
      );
    }

    // Check for pending withdrawals
    const { data: pendingWithdrawals, error: pendingError } = await supabase
      .from('transactions')
      .select('id')
      .eq('user_id', userId)
      .eq('type', 'withdrawal')
      .eq('status', 'pending');

    if (pendingError) {
      throw createTransactionError(
        "FAILED_PROCESSING",
        "Failed to check pending withdrawals",
        { userId, error: pendingError }
      );
    }

    if (pendingWithdrawals && pendingWithdrawals.length > 0) {
      throw createTransactionError(
        "FAILED_PROCESSING",
        "You already have a pending withdrawal request",
        { userId, pendingCount: pendingWithdrawals.length }
      );
    }

    // Create withdrawal transaction
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
      throw createTransactionError(
        "FAILED_PROCESSING",
        "Failed to create withdrawal request",
        { userId, amount, error: withdrawalError }
      );
    }

    // Create withdrawal record
    const { error: withdrawalsError } = await supabase
      .from('withdrawals')
      .insert({
        user_id: userId,
        amount,
        status: 'pending',
        created_at: new Date().toISOString()
      });

    if (withdrawalsError && withdrawalsError.code !== 'PGRST116') {
      // Log this error but don't fail the transaction since it's a secondary record
      handleError(
        createTransactionError(
          "FAILED_PROCESSING",
          "Error adding withdrawal record",
          { userId, amount, error: withdrawalsError }
        )
      );
    }

    toast.success("Withdrawal request submitted successfully");
    return true;
  } catch (error) {
    handleError(error, { userId, amount, paymentMethod });
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
