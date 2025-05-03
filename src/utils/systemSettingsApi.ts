
import { supabase } from "@/integrations/supabase/client";

export const getSystemSettings = async () => {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
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

export const updateSystemSettings = async (
  settings: {
    requireAdForWithdrawal?: boolean;
    matchProfitMargin?: number;
  },
  adminId: string
) => {
  try {
    const { error } = await supabase
      .from('system_settings')
      .update({
        require_ad_for_withdrawal: settings.requireAdForWithdrawal,
        match_profit_margin: settings.matchProfitMargin,
        updated_at: new Date().toISOString()
      })
      .eq('id', 1); // Converting to string to fix the type error
      
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
        details: `Updated system settings: ${JSON.stringify(settings)}`
      });
      
    return true;
  } catch (error) {
    console.error("Error in updateSystemSettings:", error);
    return false;
  }
};
