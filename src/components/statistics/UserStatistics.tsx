
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Trophy, Target, Coins, TrendingUp } from 'lucide-react';

interface UserStats {
  total_matches: number;
  total_wins: number;
  total_kills: number;
  total_earnings: number;
  win_rate: number;
  average_kills: number;
  best_placement: number;
}

export const UserStatistics = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchUserStats();
    }
  }, [user?.id]);

  const fetchUserStats = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('user_statistics')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setStats(data);
    } catch (error) {
      console.error('Error fetching user statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center">Loading statistics...</div>;
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            No statistics available yet. Play some matches to see your stats!
          </div>
        </CardContent>
      </Card>
    );
  }

  const statItems = [
    {
      icon: Trophy,
      label: 'Total Matches',
      value: stats.total_matches,
      color: 'text-blue-500'
    },
    {
      icon: Target,
      label: 'Wins',
      value: stats.total_wins,
      color: 'text-green-500'
    },
    {
      icon: TrendingUp,
      label: 'Win Rate',
      value: `${stats.win_rate}%`,
      color: 'text-purple-500'
    },
    {
      icon: Target,
      label: 'Total Kills',
      value: stats.total_kills,
      color: 'text-red-500'
    },
    {
      icon: TrendingUp,
      label: 'Avg Kills',
      value: stats.average_kills.toFixed(1),
      color: 'text-orange-500'
    },
    {
      icon: Trophy,
      label: 'Best Placement',
      value: stats.best_placement || 'N/A',
      color: 'text-yellow-500'
    },
    {
      icon: Coins,
      label: 'Total Earnings',
      value: `${stats.total_earnings} coins`,
      color: 'text-emerald-500'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {statItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="text-center p-3 border rounded-lg">
                <Icon className={`w-6 h-6 mx-auto mb-2 ${item.color}`} />
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="text-lg font-semibold">{item.value}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
