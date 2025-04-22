
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Define coin packs for top-ups
export const COIN_PACKS = [
  { id: 'pack1', coins: 100, price: 10 },
  { id: 'pack2', coins: 200, price: 20 },
  { id: 'pack3', coins: 500, price: 50 },
  { id: 'pack4', coins: 1000, price: 100 },
  { id: 'pack5', coins: 2000, price: 200 },
  { id: 'pack6', coins: 5000, price: 500 }
];

// Function to get system settings
export const getSystemSettings = async () => {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .order('created_at', { ascending: false })
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
      requireAdForWithdrawal: data.require_ad_for_withdrawal,
      matchProfitMargin: data.match_profit_margin
    };
  } catch (error) {
    console.error("Error in getSystemSettings:", error);
    return {
      requireAdForWithdrawal: false,
      matchProfitMargin: 40
    };
  }
};

// Function to update system settings
export const updateSystemSettings = async (
  settings: {
    requireAdForWithdrawal: boolean;
    matchProfitMargin: number;
  },
  adminId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('system_settings')
      .insert({
        require_ad_for_withdrawal: settings.requireAdForWithdrawal,
        match_profit_margin: settings.matchProfitMargin,
        updated_at: new Date().toISOString()
      });
      
    if (error) {
      console.error("Error updating system settings:", error);
      throw error;
    }
    
    // Log the action
    await supabase
      .from('system_logs')
      .insert({
        admin_id: adminId,
        action: 'System Settings Updated',
        details: `Updated system settings: Match profit margin: ${settings.matchProfitMargin}%, Ad for withdrawal: ${settings.requireAdForWithdrawal}`
      });
      
    return true;
  } catch (error) {
    console.error("Error in updateSystemSettings:", error);
    return false;
  }
};

// Function to check if user has enough real coins for withdrawal
export const hasEnoughRealCoins = async (userId: string, amount: number): Promise<boolean> => {
  try {
    // Get all transactions for the user
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
    data?.forEach(transaction => {
      realCoinsBalance += (transaction.amount || 0);
    });
    
    return realCoinsBalance >= amount;
  } catch (error) {
    console.error("Error checking real coins:", error);
    return false;
  }
};

// Function to set a user as admin
export const setUserAsAdmin = async (
  userEmail: string,
  adminId: string
): Promise<boolean> => {
  try {
    // Get user by email
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error("Error fetching users:", userError);
      toast.error("Failed to find user");
      return false;
    }
    
    const user = userData?.users?.find(u => u.email?.toLowerCase() === userEmail.toLowerCase());
    
    if (!user) {
      toast.error("User not found with that email");
      return false;
    }
    
    // Check if user already has a role
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();
      
    if (existingRole?.role === 'admin') {
      toast.error("User is already an admin");
      return false;
    }
    
    if (existingRole?.role === 'superadmin') {
      toast.error("User is already a superadmin");
      return false;
    }
    
    // Set user as admin
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: user.id,
        role: 'admin'
      });
      
    if (roleError) {
      console.error("Error setting user as admin:", roleError);
      toast.error("Failed to set user as admin");
      return false;
    }
    
    // Log the action
    await supabase
      .from('system_logs')
      .insert({
        admin_id: adminId,
        action: 'Admin Created',
        details: `Set user ${userEmail} as admin`
      });
      
    toast.success(`Successfully set ${userEmail} as admin`);
    return true;
  } catch (error) {
    console.error("Error in setUserAsAdmin:", error);
    toast.error("An unexpected error occurred");
    return false;
  }
};

// Function to get user withdrawal count
export const getUserWithdrawalCount = async (userId: string): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('withdrawals')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'completed');
      
    if (error) {
      console.error("Error fetching withdrawals:", error);
      return 0;
    }
    
    return data?.length || 0;
  } catch (error) {
    console.error("Error getting withdrawal count:", error);
    return 0;
  }
};

// Function to calculate withdrawal amount based on coin amount
export const calculateWithdrawalAmount = (coins: number): number => {
  return Math.floor(coins / 10);
};

// Function to calculate withdrawal payout based on user history
export const calculateWithdrawalPayout = (coins: number, isFirstFive: boolean): number => {
  // Get base amount
  const baseAmount = calculateWithdrawalAmount(coins);
  
  // For first 5 withdrawals, add 20% bonus
  return isFirstFive ? Math.floor(baseAmount * 1.2) : baseAmount;
};

// Define withdrawal tiers with minimum coins required and corresponding rupee amounts
export const WITHDRAWAL_TIERS = [
  { coins: 100, amount: 10, firstFivePayoutInr: 12, regularPayoutInr: 10 },
  { coins: 200, amount: 20, firstFivePayoutInr: 25, regularPayoutInr: 20 },
  { coins: 500, amount: 50, firstFivePayoutInr: 60, regularPayoutInr: 50 },
  { coins: 1000, amount: 100, firstFivePayoutInr: 120, regularPayoutInr: 100 },
  { coins: 2000, amount: 200, firstFivePayoutInr: 240, regularPayoutInr: 200 },
  { coins: 5000, amount: 500, firstFivePayoutInr: 600, regularPayoutInr: 500 }
];

// Get the next available withdrawal tier based on user's balance
export const getNextWithdrawalTier = (balance: number) => {
  const eligibleTiers = WITHDRAWAL_TIERS.filter(tier => tier.coins <= balance);
  return eligibleTiers.length > 0 ? eligibleTiers[eligibleTiers.length - 1] : null;
};
