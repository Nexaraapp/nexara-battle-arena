import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Loader2, UserPlus, Users, Activity, Award } from 'lucide-react';
import { MatchManagement } from '@/components/admin/MatchManagement';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { logAdminAction } from '@/utils/adminUtils';

// Lazy load other admin components if needed
const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
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

  const handleManageUsers = () => {
    // For now, we'll show a toast until the User Management page is implemented
    // Future enhancement: navigate to a user management page
    toast.info("User management page is under construction");
    logAdminAction(user?.id || '', 'Accessed User Management', 'Attempted to access user management feature');
  };

  const handleManageMatches = () => {
    navigate('/admin/matches');
    logAdminAction(user?.id || '', 'Accessed Match Management', 'Navigated to match management page');
  };

  const handleReviewWithdrawals = async () => {
    // For now, we'll fetch and show withdrawal info in a toast
    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('status', 'pending')
        .limit(5);
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        toast.info(`${data.length} withdrawal requests pending review`);
      } else {
        toast.info("No pending withdrawals to review");
      }
      
      logAdminAction(user?.id || '', 'Checked Withdrawals', 'Viewed pending withdrawal requests');
    } catch (error) {
      console.error("Error checking withdrawals:", error);
      toast.error("Failed to fetch withdrawal information");
    }
  };

  const handleSystemSettings = async () => {
    try {
      // Fetch the current system settings
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .single();
        
      if (error) throw error;
      
      // Display settings info for now
      toast.info(`Current profit margin: ${data?.match_profit_margin || 40}%`);
      logAdminAction(user?.id || '', 'Checked System Settings', 'Viewed system configuration');
    } catch (error) {
      console.error("Error fetching system settings:", error);
      toast.error("Failed to load system settings");
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
              onClick={handleManageUsers}
            >
              <Users className="mr-2 h-4 w-4" /> Manage Users
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={handleManageMatches}
            >
              <Activity className="mr-2 h-4 w-4" /> Manage Matches
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={handleReviewWithdrawals}
            >
              <Award className="mr-2 h-4 w-4" /> Review Withdrawals
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={handleSystemSettings}
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
            <AdminActivityLog userId={user?.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Create a new component to display admin activity
const AdminActivityLog = ({ userId }: { userId?: string }) => {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    
    const fetchActivity = async () => {
      try {
        const { data, error } = await supabase
          .from('system_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);
          
        if (error) throw error;
        
        setActivities(data || []);
      } catch (error) {
        console.error("Error fetching admin activity:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchActivity();
  }, [userId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : activities.length > 0 ? (
        <div className="space-y-2">
          {activities.map((activity) => (
            <div key={activity.id} className="border-b pb-2 last:border-0">
              <p className="font-medium text-sm">{activity.action}</p>
              {activity.details && (
                <p className="text-xs text-muted-foreground">{activity.details}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {formatDate(activity.created_at)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No recent admin activity found
        </p>
      )}
    </div>
  );
};

export default Dashboard;
