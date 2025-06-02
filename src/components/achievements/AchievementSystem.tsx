
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Trophy, Star, Target, Users, Zap } from "lucide-react";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: string;
  requirement_value: number;
  reward_coins: number;
  earned_at?: string;
  progress?: number;
}

export const AchievementSystem: React.FC = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userStats, setUserStats] = useState({
    total_kills: 0,
    total_wins: 0,
    total_matches: 0,
    referral_count: 0
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchAchievements();
      fetchUserStats();
    }
  }, [user]);

  const fetchAchievements = async () => {
    if (!user) return;

    try {
      // Get all achievements
      const { data: allAchievements } = await supabase
        .from('achievements')
        .select('*')
        .order('requirement_value');

      // Get user's earned achievements
      const { data: userAchievements } = await supabase
        .from('user_achievements')
        .select('achievement_id, earned_at')
        .eq('user_id', user.id);

      const earnedIds = new Set(userAchievements?.map(ua => ua.achievement_id) || []);
      const earnedMap = new Map(userAchievements?.map(ua => [ua.achievement_id, ua.earned_at]) || []);

      const enrichedAchievements = allAchievements?.map(achievement => ({
        ...achievement,
        earned_at: earnedMap.get(achievement.id),
        progress: calculateProgress(achievement, userStats)
      })) || [];

      setAchievements(enrichedAchievements);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    }
  };

  const fetchUserStats = async () => {
    if (!user) return;

    try {
      // Get user profile stats
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('total_kills, total_wins, total_matches')
        .eq('user_id', user.id)
        .single();

      // Get referral count
      const { data: referrals } = await supabase
        .from('referrals')
        .select('id')
        .eq('referrer_id', user.id)
        .eq('status', 'completed');

      const stats = {
        total_kills: profile?.total_kills || 0,
        total_wins: profile?.total_wins || 0,
        total_matches: profile?.total_matches || 0,
        referral_count: referrals?.length || 0
      };

      setUserStats(stats);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user stats:', error);
      setLoading(false);
    }
  };

  const calculateProgress = (achievement: Achievement, stats: any): number => {
    let current = 0;
    
    switch (achievement.type) {
      case 'kill':
        current = stats.total_kills;
        break;
      case 'match':
        current = stats.total_wins;
        break;
      case 'referral':
        current = stats.referral_count;
        break;
      default:
        current = 0;
    }

    return Math.min((current / achievement.requirement_value) * 100, 100);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'kill':
        return <Target className="w-5 h-5" />;
      case 'match':
        return <Trophy className="w-5 h-5" />;
      case 'referral':
        return <Users className="w-5 h-5" />;
      case 'streak':
        return <Zap className="w-5 h-5" />;
      default:
        return <Star className="w-5 h-5" />;
    }
  };

  const earnedAchievements = achievements.filter(a => a.earned_at);
  const pendingAchievements = achievements.filter(a => !a.earned_at);

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-800 h-24 rounded-lg"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-white">Achievements 🏆</h1>
        <p className="text-gray-400">
          {earnedAchievements.length} of {achievements.length} achievements unlocked
        </p>
        <Progress 
          value={(earnedAchievements.length / achievements.length) * 100} 
          className="w-full max-w-md mx-auto"
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-3 text-center">
            <Target className="w-6 h-6 text-red-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-white">{userStats.total_kills}</p>
            <p className="text-xs text-gray-400">Total Kills</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-3 text-center">
            <Trophy className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-white">{userStats.total_wins}</p>
            <p className="text-xs text-gray-400">Wins</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-3 text-center">
            <Users className="w-6 h-6 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-white">{userStats.referral_count}</p>
            <p className="text-xs text-gray-400">Referrals</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-3 text-center">
            <Star className="w-6 h-6 text-purple-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-white">{earnedAchievements.length}</p>
            <p className="text-xs text-gray-400">Achievements</p>
          </CardContent>
        </Card>
      </div>

      {/* Achievements Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-800">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="earned">Earned ({earnedAchievements.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingAchievements.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3">
          {achievements.map((achievement) => (
            <AchievementCard key={achievement.id} achievement={achievement} />
          ))}
        </TabsContent>

        <TabsContent value="earned" className="space-y-3">
          {earnedAchievements.length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No achievements earned yet</p>
              <p className="text-sm text-gray-500">Start playing to unlock your first achievement!</p>
            </div>
          ) : (
            earnedAchievements.map((achievement) => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-3">
          {pendingAchievements.map((achievement) => (
            <AchievementCard key={achievement.id} achievement={achievement} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

const AchievementCard: React.FC<{ achievement: Achievement }> = ({ achievement }) => {
  const isEarned = !!achievement.earned_at;
  const progress = achievement.progress || 0;

  return (
    <Card className={`${isEarned ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/50' : 'bg-gray-800 border-gray-700'}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className={`text-3xl ${isEarned ? 'grayscale-0' : 'grayscale opacity-50'}`}>
            {achievement.icon}
          </div>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className={`font-semibold ${isEarned ? 'text-yellow-300' : 'text-white'}`}>
                {achievement.name}
              </h3>
              {isEarned && <Badge className="bg-yellow-500 text-black">Earned</Badge>}
            </div>
            
            <p className="text-sm text-gray-400">{achievement.description}</p>
            
            {!isEarned && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Progress</span>
                  <span className="text-gray-400">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-green-400">+{achievement.reward_coins} coins</span>
              {isEarned && (
                <span className="text-xs text-gray-500">
                  Earned {new Date(achievement.earned_at!).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
