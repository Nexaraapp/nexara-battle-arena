
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
  id?: string; // Changed from number to string to match Supabase UUID
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

/**
 * Update a user's role to superadmin
 */
export const setUserAsSuperadmin = async (email: string): Promise<boolean> => {
  try {
    // First, get the user by email
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError || !userData) {
      console.error("Error fetching users:", userError);
      throw userError;
    }
    
    // Find the user with the matching email
    const user = userData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      toast.error("User with this email not found");
      return false;
    }
    
    // Check if user already has a role
    const { data: existingRole, error: roleError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (existingRole) {
      // Update existing role
      const { error: updateError } = await supabase
        .from('user_roles')
        .update({ role: 'superadmin' })
        .eq('user_id', user.id);
      
      if (updateError) {
        console.error("Error updating user role:", updateError);
        throw updateError;
      }
    } else {
      // Create new role entry
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: 'superadmin'
        });
      
      if (insertError) {
        console.error("Error inserting user role:", insertError);
        throw insertError;
      }
    }
    
    toast.success(`User ${email} has been set as superadmin`);
    return true;
  } catch (error: any) {
    console.error("Failed to set user as superadmin:", error.message);
    toast.error("Failed to update user role");
    return false;
  }
};
