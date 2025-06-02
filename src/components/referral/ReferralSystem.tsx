
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Copy, Users, Gift, TrendingUp } from "lucide-react";

interface ReferralData {
  referralCode: string;
  totalReferrals: number;
  totalEarned: number;
  recentReferrals: Array<{
    id: string;
    created_at: string;
    status: string;
    referrer_reward: number;
  }>;
}

export const ReferralSystem: React.FC = () => {
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchReferralData();
    }
  }, [user]);

  const fetchReferralData = async () => {
    if (!user) return;

    try {
      // Get user profile with referral code
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('referral_code')
        .eq('user_id', user.id)
        .single();

      // Get referral stats
      const { data: referrals } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user.id);

      // Get total earnings from referrals
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', user.id)
        .eq('type', 'referral_bonus');

      const totalEarned = transactions?.reduce((sum, t) => sum + t.amount, 0) || 0;
      const totalReferrals = referrals?.length || 0;
      const recentReferrals = referrals?.slice(-5) || [];

      setReferralData({
        referralCode: profile?.referral_code || '',
        totalReferrals,
        totalEarned,
        recentReferrals
      });
    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = async () => {
    if (referralData?.referralCode) {
      await navigator.clipboard.writeText(referralData.referralCode);
      toast({
        title: "Copied! 📋",
        description: "Referral code copied to clipboard"
      });
    }
  };

  const shareReferral = async () => {
    const shareText = `Join me on Nexara BattleField and earn real money playing games! Use my referral code: ${referralData?.referralCode}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Nexara BattleField',
          text: shareText,
          url: window.location.origin
        });
      } catch (error) {
        // Fallback to clipboard
        await navigator.clipboard.writeText(shareText);
        toast({
          title: "Copied! 📋",
          description: "Referral message copied to clipboard"
        });
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      toast({
        title: "Copied! 📋",
        description: "Referral message copied to clipboard"
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-gray-800 h-32 rounded-lg"></div>
        <div className="animate-pulse bg-gray-800 h-48 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-white">Referral Program 🤝</h1>
        <p className="text-gray-400">Invite friends and earn together!</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{referralData?.totalReferrals}</p>
            <p className="text-sm text-gray-400">Friends Referred</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4 text-center">
            <Gift className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{referralData?.totalEarned}</p>
            <p className="text-sm text-gray-400">Coins Earned</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">25</p>
            <p className="text-sm text-gray-400">Coins per Referral</p>
          </CardContent>
        </Card>
      </div>

      {/* Referral Code Card */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Your Referral Code</CardTitle>
          <CardDescription>Share this code with friends to earn rewards</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={referralData?.referralCode || ''}
              readOnly
              className="bg-gray-700 border-gray-600 font-mono text-lg text-center"
            />
            <Button onClick={copyReferralCode} variant="outline" size="icon">
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button onClick={shareReferral} className="bg-blue-600 hover:bg-blue-700">
              Share with Friends
            </Button>
            <Button onClick={copyReferralCode} variant="outline">
              Copy Code
            </Button>
          </div>

          <div className="bg-blue-500/20 p-3 rounded-lg">
            <h4 className="font-semibold text-blue-300 mb-1">How it works:</h4>
            <ul className="text-sm text-blue-200 space-y-1">
              <li>• Share your code with friends</li>
              <li>• They sign up and enter your code</li>
              <li>• You both get 25 bonus coins instantly!</li>
              <li>• No limit on referrals</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Recent Referrals */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Recent Referrals</CardTitle>
          <CardDescription>Your latest successful referrals</CardDescription>
        </CardHeader>
        <CardContent>
          {referralData?.recentReferrals.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No referrals yet</p>
              <p className="text-sm text-gray-500">Start sharing your code to see referrals here!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {referralData?.recentReferrals.map((referral) => (
                <div key={referral.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                  <div>
                    <p className="text-white font-medium">Friend joined</p>
                    <p className="text-sm text-gray-400">
                      {new Date(referral.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={referral.status === 'completed' ? 'default' : 'secondary'}>
                      {referral.status}
                    </Badge>
                    <p className="text-sm text-green-400 mt-1">
                      +{referral.referrer_reward} coins
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
