
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Users, Trophy, Wallet, AlertTriangle } from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  activeMatches: number;
  pendingWithdrawals: number;
  totalTransactionVolume: number;
  pendingResults: number;
  suspiciousWithdrawals: number;
}

export const AdminDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeMatches: 0,
    pendingWithdrawals: 0,
    totalTransactionVolume: 0,
    pendingResults: 0,
    suspiciousWithdrawals: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Fetch total users count
      const { count: usersCount } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch active matches
      const { count: activeMatchesCount } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .in('status', ['upcoming', 'in_progress']);

      // Fetch pending withdrawals
      const { count: pendingWithdrawalsCount } = await supabase
        .from('withdrawals')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Fetch total transaction volume
      const { data: transactionData } = await supabase
        .from('transactions')
        .select('amount')
        .eq('status', 'completed');

      const totalVolume = transactionData?.reduce((sum, tx) => sum + Math.abs(tx.amount), 0) || 0;

      // Fetch pending results
      const { count: pendingResultsCount } = await supabase
        .from('match_results')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Fetch suspicious withdrawals
      const { count: suspiciousCount } = await supabase
        .from('withdrawals')
        .select('*', { count: 'exact', head: true })
        .eq('is_suspicious', true);

      setStats({
        totalUsers: usersCount || 0,
        activeMatches: activeMatchesCount || 0,
        pendingWithdrawals: pendingWithdrawalsCount || 0,
        totalTransactionVolume: totalVolume,
        pendingResults: pendingResultsCount || 0,
        suspiciousWithdrawals: suspiciousCount || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-blue-500'
    },
    {
      title: 'Active Matches',
      value: stats.activeMatches,
      icon: Trophy,
      color: 'text-green-500'
    },
    {
      title: 'Pending Withdrawals',
      value: stats.pendingWithdrawals,
      icon: Wallet,
      color: 'text-orange-500'
    },
    {
      title: 'Transaction Volume',
      value: `${stats.totalTransactionVolume} coins`,
      icon: Wallet,
      color: 'text-purple-500'
    },
    {
      title: 'Pending Results',
      value: stats.pendingResults,
      icon: Trophy,
      color: 'text-yellow-500'
    },
    {
      title: 'Suspicious Activity',
      value: stats.suspiciousWithdrawals,
      icon: AlertTriangle,
      color: 'text-red-500'
    }
  ];

  if (loading) {
    return <div className="text-center">Loading dashboard statistics...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statCards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <Icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
