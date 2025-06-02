
import { supabase } from "@/integrations/supabase/client";

export interface WithdrawalSettings {
  id: string;
  start_time: string;
  end_time: string;
  estimated_processing_hours: number;
  is_active: boolean;
}

export const getWithdrawalSettings = async (): Promise<WithdrawalSettings | null> => {
  try {
    const { data, error } = await supabase
      .from('withdrawal_settings')
      .select('*')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching withdrawal settings:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getWithdrawalSettings:', error);
    return null;
  }
};

export const isWithdrawalTimeAllowed = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('is_withdrawal_time_allowed');
    
    if (error) {
      console.error('Error checking withdrawal time:', error);
      return false;
    }
    
    return data || false;
  } catch (error) {
    console.error('Error in isWithdrawalTimeAllowed:', error);
    return false;
  }
};

export const formatTimeForDisplay = (timeString: string): string => {
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};
