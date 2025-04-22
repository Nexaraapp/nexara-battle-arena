import { supabase } from "@/integrations/supabase/client";

// Define interface for user with email property
interface UserWithEmail {
  id: string;
  email?: string;
}

// Define coin packs for purchases
export const COIN_PACKS = [
  { id: 'basic', coins: 100, price: 99 },
  { id: 'standard', coins: 500, price: 499 },
  { id: 'premium', coins: 1000, price: 899 },
  { id: 'elite', coins: 2500, price: 1999 }
];

// Define withdrawal tiers
export const WITHDRAWAL_TIERS = [
  { amount: 100, minimumRealCoins: 50 },
  { amount: 200, minimumRealCoins: 100 },
  { amount: 500, minimumRealCoins: 250 },
  { amount: 1000, minimumRealCoins: 500 }
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
