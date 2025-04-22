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
  is_real_coins?: boolean;
}

// User interface for handling user data
export interface User {
  id: string;
  email?: string | null;
  // Add other user properties as needed
}

// Coin Pack Structure
export interface CoinPack {
  id: number;
  coins: number;
  price: number;
  description?: string;
}

// Withdrawal Tier Structure
export interface WithdrawalTier {
  coins: number;
  firstFivePayoutInr: number;
  regularPayoutInr: number;
}

// Standard top-up packs
export const COIN_PACKS: CoinPack[] = [
  { id: 1, coins: 20, price: 20, description: "Starter Pack" },
  { id: 2, coins: 30, price: 35, description: "Basic Pack" },
  { id: 3, coins: 50, price: 60, description: "Standard Pack" },
  { id: 4, coins: 85, price: 80, description: "Value Pack" },
  { id: 5, coins: 110, price: 100, description: "Premium Pack" }
];

// Standard withdrawal tiers
export const WITHDRAWAL_TIERS: WithdrawalTier[] = [
  { coins: 30, firstFivePayoutInr: 26, regularPayoutInr: 24 },
  { coins: 60, firstFivePayoutInr: 52, regularPayoutInr: 48 },
  { coins: 90, firstFivePayoutInr: 78, regularPayoutInr: 72 },
  { coins: 120, firstFivePayoutInr: 104, regularPayoutInr: 96 }
];

/**
 * Create a new transaction in the database
 */
export const createTransaction = async (transaction: Omit<Transaction, 'date' | 'id'>): Promise<Transaction | null> => {
  try {
    // Set defaults
    const newTransaction = {
      ...transaction,
      date: new Date().toISOString().split('T')[0],
      is_real_coins: transaction.type === 'topup' || transaction.is_real_coins === true
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
export const getUserWalletBalance = async (userId: string): Promise<{ total: number, realCoins: number }> => {
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
    
    // Calculate total balance and real coins balance
    let realCoins = 0;
    let totalBalance = 0;
    
    data.forEach(tx => {
      totalBalance += tx.amount;
      
      // Count real coins (from top-ups)
      if (tx.is_real_coins) {
        realCoins += tx.amount;
      }
    });
    
    return { total: totalBalance, realCoins };
  } catch (error: any) {
    console.error("Failed to get wallet balance:", error.message);
    return { total: 0, realCoins: 0 }; // Default to 0 if there's an error
  }
};

/**
 * Check if user has sufficient balance to spend
 */
export const hasEnoughCoins = async (userId: string, amount: number): Promise<boolean> => {
  const { total } = await getUserWalletBalance(userId);
  return total >= amount;
};

/**
 * Check if user has sufficient real coins to withdraw
 */
export const hasEnoughRealCoins = async (userId: string, amount: number): Promise<boolean> => {
  const { realCoins } = await getUserWalletBalance(userId);
  return realCoins >= amount;
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
 * Get the number of withdrawals a user has made
 */
export const getUserWithdrawalCount = async (userId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('type', 'withdrawal')
      .eq('status', 'completed');
    
    if (error) {
      console.error("Error fetching withdrawal count:", error);
      throw error;
    }
    
    return count || 0;
  } catch (error: any) {
    console.error("Failed to get withdrawal count:", error.message);
    return 0;
  }
};

/**
 * Calculate withdrawal payout amount based on user history
 */
export const calculateWithdrawalPayout = async (userId: string, coinAmount: number): Promise<number> => {
  try {
    const withdrawalCount = await getUserWithdrawalCount(userId);
    const tier = WITHDRAWAL_TIERS.find(t => t.coins === coinAmount);
    
    if (!tier) {
      throw new Error("Invalid withdrawal amount");
    }
    
    // First 5 withdrawals get higher payout
    if (withdrawalCount < 5) {
      return tier.firstFivePayoutInr;
    } else {
      return tier.regularPayoutInr;
    }
  } catch (error: any) {
    console.error("Failed to calculate withdrawal payout:", error.message);
    throw error;
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
    const user = userData.users.find(u => {
      if (typeof u.email === 'string') {
        return u.email.toLowerCase() === email.toLowerCase();
      }
      return false;
    });
    
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
    
    // Log this admin action
    await supabase
      .from('system_logs')
      .insert({
        admin_id: user.id,
        action: 'User Role Updated',
        details: `User ${email} has been set as superadmin`
      });
      
    toast.success(`User ${email} has been set as superadmin`);
    return true;
  } catch (error: any) {
    console.error("Failed to set user as superadmin:", error.message);
    toast.error("Failed to update user role");
    return false;
  }
};

/**
 * Set a user as admin
 */
export const setUserAsAdmin = async (email: string, superadminId: string): Promise<boolean> => {
  try {
    // First, get the user by email
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError || !userData) {
      console.error("Error fetching users:", userError);
      throw userError;
    }
    
    // Find the user with the matching email
    const user = userData.users.find(u => {
      if (typeof u.email === 'string') {
        return u.email.toLowerCase() === email.toLowerCase();
      }
      return false;
    });
    
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
        .update({ role: 'admin' })
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
          role: 'admin'
        });
      
      if (insertError) {
        console.error("Error inserting user role:", insertError);
        throw insertError;
      }
    }
    
    // Log this admin action
    await supabase
      .from('system_logs')
      .insert({
        admin_id: superadminId,
        action: 'User Role Updated',
        details: `User ${email} has been set as admin`
      });
      
    toast.success(`User ${email} has been set as admin`);
    return true;
  } catch (error: any) {
    console.error("Failed to set user as admin:", error.message);
    toast.error("Failed to update user role");
    return false;
  }
};

/**
 * Get system settings or return defaults
 */
export const getSystemSettings = async (): Promise<{
  requireAdForWithdrawal: boolean,
  matchProfitMargin: number
}> => {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .single();
    
    if (error) {
      if (error.code !== 'PGRST116') { // Not found error
        console.error("Error fetching system settings:", error);
      }
      // Return defaults if not found or other error
      return { 
        requireAdForWithdrawal: false,
        matchProfitMargin: 40
      };
    }
    
    return {
      requireAdForWithdrawal: data.require_ad_for_withdrawal || false,
      matchProfitMargin: data.match_profit_margin || 40
    };
  } catch (error) {
    console.error("Failed to get system settings:", error);
    return { 
      requireAdForWithdrawal: false,
      matchProfitMargin: 40
    };
  }
};

/**
 * Update system settings
 */
export const updateSystemSettings = async (
  settings: {
    requireAdForWithdrawal?: boolean,
    matchProfitMargin?: number
  },
  adminId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('system_settings')
      .upsert({
        id: 1, // Use a singleton pattern with ID 1
        require_ad_for_withdrawal: settings.requireAdForWithdrawal,
        match_profit_margin: settings.matchProfitMargin
      });
    
    if (error) {
      console.error("Error updating system settings:", error);
      throw error;
    }
    
    // Log this admin action
    await supabase
      .from('system_logs')
      .insert({
        admin_id: adminId,
        action: 'System Settings Updated',
        details: `Updated system settings: ${JSON.stringify(settings)}`
      });
      
    toast.success("System settings updated successfully");
    return true;
  } catch (error) {
    console.error("Failed to update system settings:", error);
    toast.error("Failed to update system settings");
    return false;
  }
};
