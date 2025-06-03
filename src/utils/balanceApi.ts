
import { supabase } from "@/integrations/supabase/client";

export interface Balance {
  balance: number;
  realCoinsBalance: number;
}

export const getUserBalance = async (): Promise<Balance> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error("Not authenticated");
    }

    const { data, error } = await supabase
      .from('transactions')
      .select('amount, is_real_coins')
      .eq('user_id', session.user.id)
      .eq('status', 'completed');

    if (error) {
      console.error("Error fetching balance:", error);
      throw new Error(error.message);
    }

    const balances = data.reduce((acc, tx) => ({
      total: acc.total + (tx.amount || 0),
      realCoins: acc.realCoins + (tx.is_real_coins ? (tx.amount || 0) : 0)
    }), { total: 0, realCoins: 0 });

    return {
      balance: balances.total,
      realCoinsBalance: balances.realCoins
    };
  } catch (error: any) {
    console.error("Error fetching balance:", error);
    throw new Error(error.message || "Failed to fetch balance");
  }
};
