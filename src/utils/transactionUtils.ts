
import { supabase } from "@/integrations/supabase/client";

// Define interface for user with email property
interface UserWithEmail {
  id: string;
  email?: string;
}

// Define interface for SystemSettings
interface SystemSettings {
  requireAdForWithdrawal: boolean;
  matchProfitMargin: number;
}

// Define coin packs for purchases
export const COIN_PACKS = [
  { id: 'basic', coins: 100, price: 99 },
  { id: 'standard', coins: 500, price: 499 },
  { id: 'premium', coins: 1000, price: 899 },
  { id: 'elite', coins: 2500, price: 1999 }
];

// Define withdrawal tiers with all required properties
export const WITHDRAWAL_TIERS = [
  { amount: 100, minimumRealCoins: 50, coins: 100, firstFivePayoutInr: 100, regularPayoutInr: 90 },
  { amount: 200, minimumRealCoins: 100, coins: 200, firstFivePayoutInr: 200, regularPayoutInr: 180 },
  { amount: 500, minimumRealCoins: 250, coins: 500, firstFivePayoutInr: 500, regularPayoutInr: 450 },
  { amount: 1000, minimumRealCoins: 500, coins: 1000, firstFivePayoutInr: 1000, regularPayoutInr: 900 }
];

// Check if a user has enough real coins for withdrawal
export const hasEnoughRealCoins = async (userId: string, requiredAmount: number): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('is_real_coins', true)
      .eq('status', 'completed');
      
    if (error) {
      console.error("Error checking real coins:", error);
      return false;
    }
    
    const realCoins = data?.reduce((total, tx) => total + tx.amount, 0) || 0;
    return realCoins >= requiredAmount;
  } catch (error) {
    console.error("Error in hasEnoughRealCoins:", error);
    return false;
  }
};

// Get user's withdrawal count for limits
export const getUserWithdrawalCount = async (userId: string): Promise<number> => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { count, error } = await supabase
      .from('withdrawals')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .in('status', ['pending', 'completed']);
      
    if (error) {
      console.error("Error getting withdrawal count:", error);
      return 0;
    }
    
    return count || 0;
  } catch (error) {
    console.error("Error in getUserWithdrawalCount:", error);
    return 0;
  }
};

// Calculate withdrawal payout after platform fee
export const calculateWithdrawalPayout = (amount: number): number => {
  // Platform takes 10% fee
  const fee = Math.ceil(amount * 0.1);
  return amount - fee;
};

// Function to get all transactions
export const getAllTransactions = async () => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });
      
    if (error) {
      console.error("Error fetching transactions:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Error in getAllTransactions:", error);
    return [];
  }
};

// Function to get transactions by user ID
export const getTransactionsByUserId = async (userId: string) => {
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
    
    return data || [];
  } catch (error) {
    console.error("Error in getTransactionsByUserId:", error);
    return [];
  }
};

// Function to get a transaction by ID
export const getTransactionById = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      console.error("Error fetching transaction:", error);
      return null;
    }
    
    return data || null;
  } catch (error) {
    console.error("Error in getTransactionById:", error);
    return null;
  }
};

// Get withdrawal by ID function - with email fix
export const getWithdrawalById = async (id: string): Promise<any | null> => {
  try {
    const { data, error } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      console.error("Error fetching withdrawal:", error);
      return null;
    }
    
    if (data) {
      // Get user details
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
        data.user_id
      );
      
      if (!userError && userData?.user) {
        return {
          ...data,
          user: {
            id: userData.user.id,
            email: userData.user.email
          }
        };
      }
      
      return data;
    }
    
    return null;
  } catch (error) {
    console.error("Error in getWithdrawalById:", error);
    return null;
  }
};

// Get system settings
export const getSystemSettings = async (): Promise<SystemSettings> => {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();
      
    if (error) {
      console.error("Error fetching system settings:", error);
      return {
        requireAdForWithdrawal: false,
        matchProfitMargin: 40
      };
    }
    
    return {
      requireAdForWithdrawal: data?.require_ad_for_withdrawal || false,
      matchProfitMargin: data?.match_profit_margin || 40
    };
  } catch (error) {
    console.error("Error in getSystemSettings:", error);
    return {
      requireAdForWithdrawal: false,
      matchProfitMargin: 40
    };
  }
};

// Update system settings
export const updateSystemSettings = async (settings: SystemSettings, adminId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('system_settings')
      .update({
        require_ad_for_withdrawal: settings.requireAdForWithdrawal,
        match_profit_margin: settings.matchProfitMargin,
        updated_at: new Date().toISOString()
      })
      .eq('id', '1'); // Assuming there's only one settings record
      
    if (error) {
      console.error("Error updating system settings:", error);
      return false;
    }
    
    // Log the action
    await supabase
      .from('system_logs')
      .insert({
        admin_id: adminId,
        action: 'System Settings Updated',
        details: `Updated system settings: Match Profit Margin: ${settings.matchProfitMargin}, Require Ad For Withdrawal: ${settings.requireAdForWithdrawal}`
      });
      
    return true;
  } catch (error) {
    console.error("Error in updateSystemSettings:", error);
    return false;
  }
};

// Function to set a user as an admin
export const setUserAsAdmin = async (email: string, adminId: string): Promise<boolean> => {
  try {
    // First, find the user by email
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error("Error listing users:", userError);
      throw new Error("Failed to find users");
    }
    
    const user = users?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      throw new Error(`No user found with email ${email}`);
    }
    
    // Set user role as admin
    const { error } = await supabase
      .from('user_roles')
      .insert({
        user_id: user.id,
        role: 'admin'
      });
      
    if (error && error.code !== '23505') { // Ignore duplicate key violations
      console.error("Error setting user as admin:", error);
      throw new Error("Failed to set user role");
    }
    
    // Log the action
    await supabase
      .from('system_logs')
      .insert({
        admin_id: adminId,
        action: 'Admin Created',
        details: `Set user ${email} as admin`
      });
      
    return true;
  } catch (error: any) {
    console.error("Error in setUserAsAdmin:", error);
    throw error;
  }
};

