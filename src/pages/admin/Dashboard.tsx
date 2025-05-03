
import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Loader2, UserPlus, Users, Activity, Award } from 'lucide-react';
import { MatchManagement } from '@/components/admin/MatchManagement';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Lazy load other admin components if needed
const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeMatches: 0,
    totalMatches: 0,
    pendingWithdrawals: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAdminStats();
    }
  }, [user]);

  const fetchAdminStats = async () => {
    setIsLoading(true);
    try {
      // Fetch total users
      const { count: userCount } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true });
      
      // Fetch match statistics
      const { data: matches } = await supabase
        .from('matches')
        .select('id, status');
      
      const activeMatches = matches?.filter(match => 
        match.status === 'upcoming' || match.status === 'active'
      ).length || 0;
      
      // Fetch pending withdrawals
      const { count: pendingWithdrawals } = await supabase
        .from('withdrawals')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      setStats({
        totalUsers: userCount || 0,
        activeMatches,
        totalMatches: matches?.length || 0,
        pendingWithdrawals: pendingWithdrawals || 0
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      toast.error("Failed to load admin statistics");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-400">Manage all aspects of the platform</p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.totalUsers}
            </div>
            <p className="text-xs text-muted-foreground">
              Registered users on the platform
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Matches</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.activeMatches}
            </div>
            <p className="text-xs text-muted-foreground">
              Upcoming and active matches
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Matches</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.totalMatches}
            </div>
            <p className="text-xs text-muted-foreground">
              All time matches created
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Withdrawals</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.pendingWithdrawals}
            </div>
            <p className="text-xs text-muted-foreground">
              Withdrawals awaiting approval
            </p>
          </CardContent>
        </Card>
      </div>

      <Suspense fallback={
        <div className="h-96 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }>
        <MatchManagement />
      </Suspense>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              variant="outline" 
              className="w-full justify-start" 
              onClick={() => toast.info("User management feature coming soon!")}
            >
              <Users className="mr-2 h-4 w-4" /> Manage Users
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => toast.info("Withdrawal management feature coming soon!")}
            >
              <Award className="mr-2 h-4 w-4" /> Review Withdrawals
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => toast.info("System settings feature coming soon!")}
            >
              <Activity className="mr-2 h-4 w-4" /> System Settings
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Admin Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Recent admin activity will appear here
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
