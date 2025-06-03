
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Copy, Share2, Gift, Users } from 'lucide-react';

interface ReferralData {
  referral_code: string;
  total_referrals: number;
  successful_referrals: number;
  total_rewards: number;
  pending_rewards: number;
}

export const ReferralSystem = () => {
  const { user } = useAuth();
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchReferralData();
    }
  }, [user?.id]);

  const fetchReferralData = async () => {
    if (!user?.id) return;

    try {
      // Get user's referral code
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('referral_code')
        .eq('user_id', user.id)
        .single();

      if (!profileData?.referral_code) {
        // Generate referral code if doesn't exist
        const { data: newCode } = await supabase.rpc('generate_referral_code');
        
        await supabase
          .from('user_profiles')
          .update({ referral_code: newCode })
          .eq('user_id', user.id);

        profileData.referral_code = newCode;
      }

      // Get referral statistics
      const { data: referrals } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user.id);

      const totalReferrals = referrals?.length || 0;
      const successfulReferrals = referrals?.filter(r => r.status === 'completed').length || 0;
      const totalRewards = referrals?.reduce((sum, r) => sum + (r.referrer_reward || 0), 0) || 0;
      const pendingRewards = referrals?.filter(r => r.status === 'pending').length || 0;

      setReferralData({
        referral_code: profileData.referral_code,
        total_referrals: totalReferrals,
        successful_referrals: successfulReferrals,
        total_rewards: totalRewards,
        pending_rewards: pendingRewards
      });
    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = () => {
    if (referralData?.referral_code) {
      navigator.clipboard.writeText(referralData.referral_code);
      toast.success('Referral code copied to clipboard!');
    }
  };

  const shareReferral = () => {
    if (referralData?.referral_code) {
      const shareText = `Join Nexara BattleField using my referral code: ${referralData.referral_code} and get bonus coins!`;
      
      if (navigator.share) {
        navigator.share({
          title: 'Join Nexara BattleField',
          text: shareText,
        });
      } else {
        navigator.clipboard.writeText(shareText);
        toast.success('Referral message copied to clipboard!');
      }
    }
  };

  if (loading) {
    return <div className="text-center">Loading referral data...</div>;
  }

  if (!referralData) {
    return <div className="text-center text-muted-foreground">Unable to load referral data</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Your Referral Code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              value={referralData.referral_code}
              readOnly
              className="font-mono text-lg text-center"
            />
            <Button onClick={copyReferralCode} size="sm" variant="outline">
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          
          <Button onClick={shareReferral} className="w-full">
            <Share2 className="w-4 h-4 mr-2" />
            Share Referral Link
          </Button>

          <div className="text-sm text-muted-foreground text-center">
            Share your code with friends and earn 25 coins for each successful referral!
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">{referralData.total_referrals}</div>
            <div className="text-sm text-muted-foreground">Total Referrals</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <Gift className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">{referralData.successful_referrals}</div>
            <div className="text-sm text-muted-foreground">Successful</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-emerald-500">
              {referralData.total_rewards}
            </div>
            <div className="text-sm text-muted-foreground">Coins Earned</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-orange-500">
              {referralData.pending_rewards}
            </div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How Referrals Work</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="min-w-fit">1</Badge>
            <p className="text-sm">Share your referral code with friends</p>
          </div>
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="min-w-fit">2</Badge>
            <p className="text-sm">They sign up using your code</p>
          </div>
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="min-w-fit">3</Badge>
            <p className="text-sm">Both you and your friend get 25 bonus coins</p>
          </div>
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="min-w-fit">4</Badge>
            <p className="text-sm">Earn more as they play matches!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
