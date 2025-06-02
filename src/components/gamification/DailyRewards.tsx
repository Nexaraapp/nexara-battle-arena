
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Calendar, Gift, Flame, Clock } from "lucide-react";

interface DailyRewardData {
  canClaim: boolean;
  currentStreak: number;
  lastClaimedDate: string | null;
  nextReward: number;
  streakRewards: number[];
}

export const DailyRewards: React.FC = () => {
  const [rewardData, setRewardData] = useState<DailyRewardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const streakRewards = [10, 15, 20, 25, 30, 40, 50]; // Rewards for days 1-7
  const baseReward = 10;

  useEffect(() => {
    if (user) {
      checkDailyReward();
    }
  }, [user]);

  const checkDailyReward = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get last claimed reward
      const { data: lastReward } = await supabase
        .from('daily_rewards')
        .select('*')
        .eq('user_id', user.id)
        .order('claimed_at', { ascending: false })
        .limit(1)
        .single();

      let canClaim = true;
      let currentStreak = 0;
      let lastClaimedDate = null;

      if (lastReward) {
        const lastDate = new Date(lastReward.claimed_at).toISOString().split('T')[0];
        lastClaimedDate = lastDate;
        
        if (lastDate === today) {
          canClaim = false;
          currentStreak = lastReward.streak_count;
        } else {
          // Check if streak continues (claimed yesterday)
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          
          if (lastDate === yesterdayStr) {
            currentStreak = lastReward.streak_count;
          } else {
            currentStreak = 0; // Streak broken
          }
        }
      }

      const nextReward = getRewardForDay(currentStreak + 1);

      setRewardData({
        canClaim,
        currentStreak,
        lastClaimedDate,
        nextReward,
        streakRewards
      });
    } catch (error) {
      console.error('Error checking daily reward:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRewardForDay = (day: number): number => {
    if (day <= 7) {
      return streakRewards[day - 1];
    }
    // After day 7, give base reward + bonus
    return baseReward + Math.floor((day - 7) / 7) * 5;
  };

  const claimDailyReward = async () => {
    if (!user || !rewardData?.canClaim) return;

    setClaiming(true);
    try {
      const newStreak = rewardData.currentStreak + 1;
      const reward = rewardData.nextReward;

      // Add daily reward record
      const { error: rewardError } = await supabase
        .from('daily_rewards')
        .insert({
          user_id: user.id,
          streak_count: newStreak,
          reward_coins: reward
        });

      if (rewardError) throw rewardError;

      // Add transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'daily_reward',
          amount: reward,
          status: 'completed',
          notes: `Daily reward - Day ${newStreak} (${newStreak > 7 ? 'Streak bonus' : 'Base streak'})`
        });

      if (transactionError) throw transactionError;

      toast({
        title: "Daily Reward Claimed! 🎉",
        description: `You earned ${reward} coins! Current streak: ${newStreak} days`
      });

      // Refresh data
      await checkDailyReward();
    } catch (error: any) {
      console.error('Error claiming daily reward:', error);
      toast({
        title: "Error",
        description: "Failed to claim daily reward. Please try again.",
        variant: "destructive"
      });
    } finally {
      setClaiming(false);
    }
  };

  const getTimeUntilNextReward = (): string => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const diff = tomorrow.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-700 rounded w-1/2"></div>
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            <div className="h-10 bg-gray-700 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 border-purple-500/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-purple-400" />
            <CardTitle className="text-white">Daily Rewards</CardTitle>
          </div>
          {rewardData?.currentStreak > 0 && (
            <Badge className="bg-orange-500 text-white flex items-center gap-1">
              <Flame className="w-3 h-3" />
              {rewardData.currentStreak} day streak
            </Badge>
          )}
        </div>
        <CardDescription>
          {rewardData?.canClaim 
            ? "Your daily reward is ready to claim!"
            : "Come back tomorrow for your next reward"
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🎁</div>
            <div>
              <p className="font-semibold text-white">
                {rewardData?.canClaim ? 'Ready to Claim!' : 'Already Claimed Today'}
              </p>
              <p className="text-sm text-gray-400">
                {rewardData?.canClaim 
                  ? `${rewardData.nextReward} coins waiting`
                  : `Next reward in ${getTimeUntilNextReward()}`
                }
              </p>
            </div>
          </div>
          
          {rewardData?.canClaim ? (
            <Button 
              onClick={claimDailyReward}
              disabled={claiming}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            >
              {claiming ? 'Claiming...' : 'Claim'}
            </Button>
          ) : (
            <div className="flex items-center gap-1 text-gray-400">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{getTimeUntilNextReward()}</span>
            </div>
          )}
        </div>

        {/* Streak Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white">Streak Progress</span>
            <span className="text-sm text-gray-400">Day {(rewardData?.currentStreak || 0) + 1}</span>
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 7 }).map((_, index) => {
              const day = index + 1;
              const isCompleted = (rewardData?.currentStreak || 0) >= day;
              const isCurrent = (rewardData?.currentStreak || 0) + 1 === day;
              
              return (
                <div
                  key={day}
                  className={`p-2 rounded text-center text-xs transition-all ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isCurrent
                      ? 'bg-purple-500 text-white ring-2 ring-purple-400'
                      : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  <div className="text-lg mb-1">
                    {isCompleted ? '✓' : isCurrent ? '🎁' : '💰'}
                  </div>
                  <div>{streakRewards[index]}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Streak Info */}
        <div className="bg-purple-500/20 p-3 rounded-lg">
          <h4 className="font-semibold text-purple-300 mb-2">Streak Bonuses</h4>
          <ul className="text-sm text-purple-200 space-y-1">
            <li>• Login daily to maintain your streak</li>
            <li>• Higher streaks = bigger rewards</li>
            <li>• Weekly bonus: Complete 7 days for extra rewards</li>
            <li>• Missing a day resets your streak</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
