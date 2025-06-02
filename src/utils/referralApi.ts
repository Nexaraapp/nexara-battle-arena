
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const processReferralBonusOnPurchase = async (userId: string): Promise<boolean> => {
  try {
    console.log('Processing referral bonus for user:', userId);
    
    const { data, error } = await supabase.rpc('process_referral_bonus', {
      referred_user_id: userId
    });

    if (error) {
      console.error('Error processing referral bonus:', error);
      return false;
    }

    if (data) {
      console.log('Referral bonus processed successfully');
      toast.success('Referral bonus granted to you and your referrer!');
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error in processReferralBonusOnPurchase:', error);
    return false;
  }
};

export const getUserReferralStats = async (userId: string) => {
  try {
    const { data: referralData, error } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', userId);

    if (error) {
      console.error('Error fetching referral stats:', error);
      return { totalReferrals: 0, completedReferrals: 0, pendingReferrals: 0 };
    }

    const totalReferrals = referralData?.length || 0;
    const completedReferrals = referralData?.filter(r => r.status === 'completed').length || 0;
    const pendingReferrals = referralData?.filter(r => r.status === 'pending').length || 0;

    return {
      totalReferrals,
      completedReferrals,
      pendingReferrals
    };
  } catch (error) {
    console.error('Error in getUserReferralStats:', error);
    return { totalReferrals: 0, completedReferrals: 0, pendingReferrals: 0 };
  }
};
