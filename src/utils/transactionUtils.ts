
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SearchUser } from "./adminUtils";

// Define coin pack interface
interface CoinPack {
  id: number;
  coins: number;
  price: number;
}

// Define withdrawal tier interface
interface WithdrawalTier {
  coins: number;
  firstFivePayoutInr: number;
  regularPayoutInr: number;
}

// Define the system settings interface
interface SystemSettings {
  requireAdForWithdrawal: boolean;
  matchProfitMargin: number;
}

// Define available coin packs
export const COIN_PACKS: CoinPack[] = [
  { id: 1, coins: 60, price: 100 },
  { id: 2, coins: 120, price: 200 },
  { id: 3, coins: 300, price: 500 },
  { id: 4, coins: 600, price: 1000 },
  { id: 5, coins: 1200, price: 2000 },
  { id: 6, coins: 3000, price: 5000 }
];

// Define withdrawal tiers
export const WITHDRAWAL_TIERS: WithdrawalTier[] = [
  { coins: 60, firstFivePayoutInr: 100, regularPayoutInr: 80 },
  { coins: 120, firstFivePayoutInr: 200, regularPayoutInr: 160 },
  { coins: 300, firstFivePayoutInr: 500, regularPayoutInr: 400 },
  { coins: 600, firstFivePayoutInr: 1000, regularPayoutInr: 800 }
];

/**
 * Check if user has enough real coins for withdrawal
 */
export const hasEnoughRealCoins = async (userId: string, amount: number): Promise<boolean> => {
  try {
    // Get user's transactions
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_real_coins', true)
      .eq('status', 'completed');
    
    if (error) {
      console.error("Error fetching transactions:", error);
      return false;
    }
    
    // Calculate real coins balance
    let realCoinsBalance = 0;
    
    if (data) {
      data.forEach(tx => {
        realCoinsBalance += (tx.amount || 0);
      });
    }
    
    return realCoinsBalance >= amount;
  } catch (error) {
    console.error("Error checking real coins:", error);
    return false;
  }
};

/**
 * Get user's withdrawal count
 */
export const getUserWithdrawalCount = async (userId: string): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('count')
      .eq('user_id', userId)
      .eq('type', 'withdrawal')
      .eq('status', 'completed');
    
    if (error) {
      console.error("Error counting withdrawals:", error);
      return 0;
    }
    
    return data?.[0]?.count || 0;
  } catch (error) {
    console.error("Error in getUserWithdrawalCount:", error);
    return 0;
  }
};

/**
 * Calculate withdrawal payout amount
 */
export const calculateWithdrawalPayout = (coins: number, isFirstFive: boolean): number => {
  const tier = WITHDRAWAL_TIERS.find(t => t.coins === coins);
  if (!tier) return 0;
  
  return isFirstFive ? tier.firstFivePayoutInr : tier.regularPayoutInr;
};

/**
 * Set a user as an admin
 */
export const setUserAsAdmin = async (email: string, superadminId: string): Promise<boolean> => {
  try {
    // Find the user by email
    const { data, error: userError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 100
    });
    
    if (userError) {
      throw new Error("Failed to search users");
    }
    
    // Find user by email
    const user = data.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      toast.error("No user found with that email");
      return false;
    }
    
    // Check if user is already an admin
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();
      
    if (existingRole) {
      toast.info("User is already an Admin");
      return true;
    }
    
    // Insert the admin role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: user.id,
        role: 'admin'
      });
      
    if (roleError) {
      throw new Error("Failed to assign admin role");
    }
    
    // Log the action
    await supabase
      .from('system_logs')
      .insert({
        admin_id: superadminId,
        action: 'Admin Created',
        details: `User ${email} was set as admin`
      });
    
    toast.success("Admin role assigned successfully!");
    return true;
  } catch (error: any) {
    console.error("Error in setUserAsAdmin:", error);
    toast.error(error.message || "Failed to set user as admin");
    return false;
  }
};

/**
 * Get system settings
 */
export const getSystemSettings = async (): Promise<SystemSettings> => {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
      
    if (error) {
      console.error("Error fetching system settings:", error);
      // Return default settings
      return {
        requireAdForWithdrawal: false,
        matchProfitMargin: 40
      };
    }
    
    return {
      requireAdForWithdrawal: data.require_ad_for_withdrawal,
      matchProfitMargin: data.match_profit_margin
    };
  } catch (error) {
    console.error("Error in getSystemSettings:", error);
    // Return default settings
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
  settings: SystemSettings,
  adminId: string
): Promise<boolean> => {
  try {
    // Get current settings ID
    const { data: currentSettings, error: fetchError } = await supabase
      .from('system_settings')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      // Only log as error if it's not a "not found" error
      console.error("Error fetching current settings:", fetchError);
      throw new Error("Failed to fetch current settings");
    }
    
    let result;
    
    if (currentSettings) {
      // Update existing settings
      result = await supabase
        .from('system_settings')
        .update({
          require_ad_for_withdrawal: settings.requireAdForWithdrawal,
          match_profit_margin: settings.matchProfitMargin,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentSettings.id);
    } else {
      // Create new settings
      result = await supabase
        .from('system_settings')
        .insert({
          require_ad_for_withdrawal: settings.requireAdForWithdrawal,
          match_profit_margin: settings.matchProfitMargin
        });
    }
    
    if (result.error) {
      throw new Error("Failed to update system settings");
    }
    
    // Log the action
    await supabase
      .from('system_logs')
      .insert({
        admin_id: adminId,
        action: 'Settings Updated',
        details: `System settings updated: Require Ad: ${settings.requireAdForWithdrawal}, Profit Margin: ${settings.matchProfitMargin}%`
      });
    
    return true;
  } catch (error: any) {
    console.error("Error in updateSystemSettings:", error);
    toast.error(error.message || "Failed to update system settings");
    return false;
  }
};

/**
 * Search for users by email pattern
 */
export const searchUsers = async (emailPattern: string): Promise<SearchUser[]> => {
  try {
    const { data, error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 100
    });
    
    if (error || !data.users) {
      throw new Error("Failed to search users");
    }
    
    // Filter users by email containing the search term
    const filteredUsers = data.users
      .filter(user => user.email && user.email.toLowerCase().includes(emailPattern.toLowerCase()))
      .map(user => ({
        id: user.id,
        email: user.email
      }))
      .slice(0, 10); // Limit results
    
    return filteredUsers;
  } catch (error: any) {
    console.error("Error in searchUsers:", error);
    throw error;
  }
};

// Export interfaces
export type { CoinPack, WithdrawalTier, SystemSettings };
