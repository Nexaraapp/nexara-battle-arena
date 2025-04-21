
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Transaction types
export type TransactionType = 
  | "topup" 
  | "withdrawal" 
  | "match_entry" 
  | "match_win" 
  | "ad_reward" 
  | "admin_reward" 
  | "login_reward";

// Transaction status
export type TransactionStatus = "pending" | "completed" | "rejected";

// Transaction interface
export interface Transaction {
  id?: number;
  user_id: string;
  type: TransactionType;
  amount: number;
  date?: string;
  status: TransactionStatus;
  admin_id?: string | null;
  match_id?: string | null;
  notes?: string | null;
}

/**
 * Create a new transaction in the database
 */
export const createTransaction = async (transaction: Omit<Transaction, 'date' | 'id'>): Promise<Transaction | null> => {
  try {
    // Set defaults
    const newTransaction = {
      ...transaction,
      date: new Date().toISOString().split('T')[0]
    };
    
    const { data, error } = await supabase
      .from('transactions')
      .insert(newTransaction)
      .select()
      .single();
    
    if (error) {
      console.error("Error creating transaction:", error);
      throw error;
    }
    
    return data as Transaction;
  } catch (error: any) {
    console.error("Failed to create transaction:", error.message);
    toast.error("Transaction failed to record");
    return null;
  }
};

/**
 * Get user's wallet balance from transaction history
 */
export const getUserWalletBalance = async (userId: string): Promise<number> => {
  try {
    // Get all completed transactions for the user
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed');
    
    if (error) {
      console.error("Error fetching wallet balance:", error);
      throw error;
    }
    
    // Calculate balance
    const balance = data.reduce((total, tx) => total + tx.amount, 0);
    return balance;
  } catch (error: any) {
    console.error("Failed to get wallet balance:", error.message);
    return 0; // Default to 0 if there's an error
  }
};

/**
 * Check if user has sufficient balance to spend
 */
export const hasEnoughCoins = async (userId: string, amount: number): Promise<boolean> => {
  const balance = await getUserWalletBalance(userId);
  return balance >= amount;
};

/**
 * Get all transactions for a user
 */
export const getUserTransactions = async (userId: string): Promise<Transaction[]> => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    
    if (error) {
      console.error("Error fetching transactions:", error);
      throw error;
    }
    
    return data as Transaction[];
  } catch (error: any) {
    console.error("Failed to get user transactions:", error.message);
    return [];
  }
};
