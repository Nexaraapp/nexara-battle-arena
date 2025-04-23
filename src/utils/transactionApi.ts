
import { supabase } from "@/integrations/supabase/client";
import { Transaction } from "./transactionTypes";
import { toast } from "sonner";

export const hasEnoughRealCoins = async (userId: string, amount: number): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .eq('is_real_coins', true);
    if (error) {
      console.error("Error checking real coins balance:", error);
      return false;
    }
    const balance = data.reduce((sum, tx) => sum + (tx.amount || 0), 0);
    return balance >= amount;
  } catch (error) {
    console.error("Error in hasEnoughRealCoins:", error);
    return false;
  }
};

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
        amount,
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
