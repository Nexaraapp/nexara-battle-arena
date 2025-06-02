
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useOnboarding } from "@/hooks/useOnboarding";
import { getUserBalance } from "@/utils/balanceApi";
import { WelcomeOnboarding } from "@/components/onboarding/WelcomeOnboarding";
import { DailyRewards } from "@/components/gamification/DailyRewards";
import { Wallet, Trophy, Users, Star, TrendingUp, Gift, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface UserStats {
  totalMatches: number;
  totalWins: number;
  totalKills: number;
  currentStreak: number;
  level: number;
  xp: number;
  achievements: number;
}

export default function Index() {
  const { user, isAuthenticated } = useAuth();
  const { hasCompletedOnboarding, loading: onboardingLoading, markOnboardingComplete } = useOnboarding();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState<UserStats>({
    totalMatches: 0,
    totalWins: 0,
    totalKills: 0,
    currentStreak: 0,
    level: 1,
    xp: 0,
    achievements: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    if (isAuthenticated && hasCompletedOnboarding) {
      fetchUserData();
    } else if (!isAuthenticated) {
      setLoading(false);
    }
  }, [isAuthenticated, hasCompletedOnboarding]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      // Fetch balance
      const balanceData = await getUserBalance();
      setBalance(balanceData.balance);

      // Fetch user stats
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('total_matches, total_wins, total_kills, level, xp')
        .eq('user_id', user.id)
        .single();

      // Fetch achievements count
      const { data: achievements } = await supabase
        .from('user_achievements')
        .select('id')
        .eq('user_id', user.id);

      setUserStats({
        totalMatches: profile?.total_matches || 0,
        totalWins: profile?.total_wins || 0,
        totalKills: profile?.total_kills || 0,
        currentStreak: 0, // TODO: Calculate from match history
        level: profile?.level || 1,
        xp: profile?.xp || 0,
        achievements: achievements?.length || 0
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Show onboarding for authenticated users who haven't completed it
  if (isAuthenticated && !onboardingLoading && !hasCompletedOnboarding) {
    return <WelcomeOnboarding onComplete={markOnboardingComplete} />;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/assets/game-bg-pattern.png')] opacity-20"></div>
          <div className="relative container mx-auto px-4 py-20 text-center">
            <div className="space-y-6">
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-4">
                NEXARA
                <span className="block text-3xl md:text-4xl text-blue-400 font-normal">
                  BATTLEFIELD
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
                The Ultimate Competitive Gaming Arena Where Skill Meets Real Rewards
              </p>
              <div className="flex flex-wrap justify-center gap-4 mt-8">
                <Link to="/login">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8">
                    Start Gaming
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="lg" variant="outline" className="text-lg px-8">
                    Create Account
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Why Choose Nexara?
            </h2>
            <p className="text-gray-400 text-lg">
              Experience the future of competitive gaming
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur">
              <CardHeader>
                <Trophy className="w-12 h-12 text-yellow-500 mb-4" />
                <CardTitle className="text-white">Real Money Prizes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">
                  Win actual cash prizes in skill-based matches. Your gaming skills can earn you real money.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur">
              <CardHeader>
                <Zap className="w-12 h-12 text-blue-500 mb-4" />
                <CardTitle className="text-white">Fair Play Guaranteed</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">
                  All results are verified by admins. Anti-cheat measures ensure every match is fair and competitive.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur">
              <CardHeader>
                <Gift className="w-12 h-12 text-green-500 mb-4" />
                <CardTitle className="text-white">Instant Withdrawals</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">
                  Withdraw your winnings instantly to your UPI. No waiting periods, no hidden fees.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Dominate?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of gamers already earning real money
            </p>
            <Link to="/register">
              <Button size="lg" variant="outline" className="text-lg px-8 bg-white text-blue-600 hover:bg-gray-100">
                Join Nexara Now
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading || onboardingLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-800 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-800 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Welcome Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-white">
          Welcome back, Warrior! ⚔️
        </h1>
        <p className="text-gray-400">Ready to dominate the battlefield?</p>
      </div>

      {/* Daily Rewards */}
      <DailyRewards />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4 text-center">
            <Wallet className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{balance}</p>
            <p className="text-sm text-gray-400">Wallet Balance</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4 text-center">
            <Trophy className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{userStats.totalWins}</p>
            <p className="text-sm text-gray-400">Total Wins</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">Lv.{userStats.level}</p>
            <p className="text-sm text-gray-400">Player Level</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4 text-center">
            <Star className="w-6 h-6 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{userStats.achievements}</p>
            <p className="text-sm text-gray-400">Achievements</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-blue-500/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Join a Match
            </CardTitle>
            <CardDescription>
              Find opponents and start earning rewards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/matches">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Browse Matches
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/20 to-teal-500/20 border-green-500/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5" />
              Invite Friends
            </CardTitle>
            <CardDescription>
              Earn bonus coins for every friend you refer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/referral">
              <Button className="w-full bg-green-600 hover:bg-green-700">
                Share & Earn
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Your Performance</CardTitle>
          <CardDescription>Track your gaming progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center space-y-2">
              <p className="text-3xl font-bold text-white">{userStats.totalMatches}</p>
              <p className="text-sm text-gray-400">Total Matches</p>
            </div>
            <div className="text-center space-y-2">
              <p className="text-3xl font-bold text-white">{userStats.totalKills}</p>
              <p className="text-sm text-gray-400">Total Kills</p>
            </div>
            <div className="text-center space-y-2">
              <p className="text-3xl font-bold text-white">
                {userStats.totalMatches > 0 ? Math.round((userStats.totalWins / userStats.totalMatches) * 100) : 0}%
              </p>
              <p className="text-sm text-gray-400">Win Rate</p>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Level Progress</span>
              <span className="text-sm text-gray-400">{userStats.xp} XP</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                style={{ width: `${(userStats.xp % 1000) / 10}%` }}
              ></div>
            </div>
          </div>

          <div className="mt-4 flex justify-between">
            <Link to="/achievements">
              <Button variant="outline" size="sm">
                View Achievements
              </Button>
            </Link>
            <Link to="/profile">
              <Button variant="outline" size="sm">
                Edit Profile
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
