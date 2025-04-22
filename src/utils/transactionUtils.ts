import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

export const getUserTransactions = async (userId: string): Promise<Transaction[]> => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
      
    if (error) {
      console.error("Error fetching transactions:", error);
      return [];
    }
    
    return data as Transaction[];
  } catch (error) {
    console.error("Error in getUserTransactions:", error);
    return [];
  }
};

export const getTransactionById = async (transactionId: string): Promise<Transaction | null> => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();
      
    if (error) {
      return null;
    }
    
    return data as Transaction;
  } catch (error) {
    return null;
  }
};

// Add a transaction to the database
export const addTransaction = async (transaction: Omit<Transaction, 'id'>): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: transaction.user_id,
        type: transaction.type,
        amount: transaction.amount,
        status: transaction.status || 'completed',
        date: transaction.date || new Date().toISOString().split('T')[0],
        match_id: transaction.match_id,
        notes: transaction.notes,
        admin_id: transaction.admin_id,
        is_real_coins: transaction.is_real_coins !== undefined ? transaction.is_real_coins : true
      })
      .select('id')
      .single();
      
    if (error) {
      console.error("Error adding transaction:", error);
      return null;
    }
    
    return data.id;
  } catch (error) {
    console.error("Error in addTransaction:", error);
    return null;
  }
};

// Get user's wallet balance
export const getUserWalletBalance = async (userId: string): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('status', 'completed');
      
    if (error) {
      console.error("Error fetching wallet balance:", error);
      return 0;
    }
    
    return data.reduce((sum, tx) => sum + (tx.amount || 0), 0);
  } catch (error) {
    console.error("Error in getUserWalletBalance:", error);
    return 0;
  }
};

// Create a topup request
export const createTopUpRequest = async (
  userId: string, 
  amount: number, 
  method: string, 
  transactionId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        type: 'topup',
        amount: amount,
        status: 'pending',
        date: new Date().toISOString().split('T')[0],
        notes: `Top-up via ${method}. Transaction ID: ${transactionId}`
      });
      
    if (error) {
      console.error("Error creating top-up request:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in createTopUpRequest:", error);
    return false;
  }
};

// Create a withdrawal request
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
    
    // First check if the user has enough balance
    const balance = await getUserWalletBalance(userId);
    if (balance < amount) {
      toast.error("Insufficient balance");
      return false;
    }
    
    // Check if there's already a pending withdrawal
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
    
    // Create the withdrawal transaction
    const { error: withdrawalError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        type: 'withdrawal',
        amount: -amount, // Use negative amount for withdrawals
        status: 'pending',
        date: new Date().toISOString().split('T')[0],
        notes: `Withdrawal to ${paymentMethod}. ${payoutDetails}`
      });
      
    if (withdrawalError) {
      console.error("Error creating withdrawal:", withdrawalError);
      toast.error("Failed to create withdrawal request");
      return false;
    }
    
    // Add record to withdrawals table
    const { error: withdrawalsError } = await supabase
      .from('withdrawals')
      .insert({
        user_id: userId,
        amount: amount,
        status: 'pending',
        created_at: new Date().toISOString()
      });
      
    // This error is not critical, so we don't show it to the user
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

// Get user info - name, email for display
export const getUserInfo = async (userId: string): Promise<{ name?: string, email?: string }> => {
  try {
    // First try to get from auth
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (!userError && userData?.user) {
      return {
        name: userData.user.user_metadata?.name,
        email: userData.user.email
      };
    }
    
    // If that fails, check if we have a profile with this ID
    const { data: profileData, error: profileError } = await supabase
      .from('user_roles') // Using user_roles as a fallback - no profiles table
      .select('user_id')
      .eq('user_id', userId)
      .single();
      
    if (!profileError && profileData) {
      return {
        name: 'User ' + userId.substring(0, 6)
      };
    }
    
    return {};
  } catch (error) {
    console.error("Error in getUserInfo:", error);
    return {};
  }
};
