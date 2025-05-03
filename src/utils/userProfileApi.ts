
import { supabase } from "@/integrations/supabase/client";

export interface UserProfile {
  id: string;
  username?: string;
  avatar_url?: string;
  game_id?: string;
  social_links?: {
    instagram?: string;
    twitter?: string;
    discord?: string;
  };
  created_at: string;
  updated_at: string;
}

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error("Error in getUserProfile:", error);
    return null;
  }
};

export const updateUserProfile = async (
  userId: string,
  profile: {
    username?: string;
    avatar_url?: string;
    game_id?: string;
    social_links?: {
      instagram?: string;
      twitter?: string;
      discord?: string;
    };
  }
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({
        ...profile,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
      
    if (error) {
      console.error("Error updating user profile:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in updateUserProfile:", error);
    return false;
  }
};

export const createUserProfile = async (
  userId: string,
  profile: {
    username?: string;
    avatar_url?: string;
    game_id?: string;
  }
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .insert({
        id: userId,
        username: profile.username,
        avatar_url: profile.avatar_url,
        game_id: profile.game_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
    if (error) {
      console.error("Error creating user profile:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in createUserProfile:", error);
    return false;
  }
};

export const getUserStats = async (userId: string) => {
  try {
    // Get match entries
    const { data: matchEntries, error: matchError } = await supabase
      .from('match_entries')
      .select('match_id')
      .eq('user_id', userId);
      
    if (matchError) {
      console.error("Error fetching match entries:", matchError);
      return null;
    }
    
    // Get transactions
    const { data: transactions, error: transactionError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId);
      
    if (transactionError) {
      console.error("Error fetching transactions:", transactionError);
      return null;
    }
    
    // Calculate statistics
    const matchesJoined = matchEntries?.length || 0;
    
    const winnings = transactions
      ?.filter(t => t.type === 'match_prize' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0) || 0;
      
    const withdrawals = transactions
      ?.filter(t => t.type === 'withdrawal' && t.status === 'completed')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;
      
    const topups = transactions
      ?.filter(t => t.type === 'topup' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0) || 0;
    
    return {
      matchesJoined,
      winnings,
      withdrawals,
      topups
    };
  } catch (error) {
    console.error("Error in getUserStats:", error);
    return null;
  }
};
