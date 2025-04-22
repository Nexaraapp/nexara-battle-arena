
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Search, User, Users, Coins, CheckCircle, XCircle, Loader, Circle, CircleArrowUp, CircleArrowDown } from "lucide-react";

interface AdminUser {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

interface WithdrawalRequest {
  id: number;
  user_id: string;
  amount: number;
  created_at: string;
  status: string;
  qr_url?: string;
  user_email?: string;
}

interface AppConfig {
  id: string;
  key: string;
  value: string | boolean | number;
  description?: string;
}

interface TopUpRequest {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  date: string;
  notes: string | null;
  type: string;
  match_id: string | null;
  admin_id: string | null;
  user_email?: string;
  created_at: string;
}

interface SystemLog {
  id: string;
  admin_id: string;
  action: string;
  details: string;
  created_at: string;
  admin_email?: string;
}

interface WithdrawalTier {
  id: string;
  max_count: number;
  rate: number;
  description: string;
}

interface MatchPricing {
  id: string;
  match_type: string;
  entry_fee: number;
  win_reward: number;
  kill_reward: number;
  created_at: string;
  updated_at: string;
}

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("users");
  
  // User Management
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [showNewAdminDialog, setShowNewAdminDialog] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminRole, setNewAdminRole] = useState<string>("admin");
  
  // Withdrawal Management
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [isLoadingWithdrawals, setIsLoadingWithdrawals] = useState(true);
  
  // Top-Up Requests
  const [topUpRequests, setTopUpRequests] = useState<TopUpRequest[]>([]);
  const [isLoadingTopUps, setIsLoadingTopUps] = useState(true);
  
  // App Settings
  const [appConfig, setAppConfig] = useState<AppConfig[]>([
    { id: '1', key: 'require_ad_before_withdrawal', value: false, description: 'Players must watch an ad before withdrawing' },
    { id: '2', key: 'auto_match_results', value: false, description: 'Use AI to determine match results automatically' },
  ]);
  
  // Match Pricing
  const [matchPricing, setMatchPricing] = useState<MatchPricing[]>([
    {
      id: '1',
      match_type: 'BattleRoyale',
      entry_fee: 40,
      win_reward: 200,
      kill_reward: 10,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '2',
      match_type: 'ClashSolo',
      entry_fee: 25,
      win_reward: 40,
      kill_reward: 5,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '3',
      match_type: 'ClashDuo',
      entry_fee: 55,
      win_reward: 100,
      kill_reward: 5,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]);
  
  // Withdrawal Tiers
  const [withdrawalTiers, setWithdrawalTiers] = useState<WithdrawalTier[]>([
    { id: '1', max_count: 5, rate: 26, description: 'First 5 withdrawals' },
    { id: '2', max_count: 999999, rate: 24, description: 'After 5 withdrawals' }
  ]);
  
  // System Logs
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  
  // Match Room Management
  const [showRoomDialog, setShowRoomDialog] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [roomId, setRoomId] = useState("");
  const [roomPassword, setRoomPassword] = useState("");
  
  // Assign Coins
  const [showAssignCoinsDialog, setShowAssignCoinsDialog] = useState(false);
  const [coinsUserId, setCoinsUserId] = useState("");
  const [coinsAmount, setCoinsAmount] = useState(0);
  const [coinsType, setCoinsType] = useState("real");
  const [coinsNote, setCoinsNote] = useState("");
  
  useEffect(() => {
    // Set up real-time listeners for data changes
    const usersChannel = supabase
      .channel('admin-users')
      .on('postgres_changes', 
        { event: '*', schema: 'auth', table: 'users' },
        () => fetchUsers()
      )
      .subscribe();
      
    const withdrawalsChannel = supabase
      .channel('admin-withdrawals')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'withdrawals' },
        () => fetchWithdrawals()
      )
      .subscribe();
      
    const transactionsChannel = supabase
      .channel('admin-transactions')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'transactions' },
        () => fetchTopUps()
      )
      .subscribe();
      
    const logsChannel = supabase
      .channel('admin-logs')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'system_logs' },
        () => fetchSystemLogs()
      )
      .subscribe();
    
    // Initial data fetch
    fetchUsers();
    fetchWithdrawals();
    fetchTopUps();
    fetchSystemLogs();
    
    return () => {
      // Clean up channels on unmount
      supabase.removeChannel(usersChannel);
      supabase.removeChannel(withdrawalsChannel);
      supabase.removeChannel(transactionsChannel);
      supabase.removeChannel(logsChannel);
    };
  }, []);
  
  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      // Get all user roles
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('*');
        
      if (roleError) {
        throw roleError;
      }
      
      // For each user role, get the user details
      const adminUsers: AdminUser[] = [];
      
      for (const role of roleData || []) {
        try {
          const { data: userData } = await supabase.auth.admin.getUserById(role.user_id);
          if (userData?.user) {
            adminUsers.push({
              id: userData.user.id,
              email: userData.user.email || 'No email',
              role: role.role,
              created_at: userData.user.created_at
            });
          }
        } catch (error) {
          console.error("Error fetching user details:", error);
        }
      }
      
      setUsers(adminUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setIsLoadingUsers(false);
    }
  };
  
  const fetchWithdrawals = async () => {
    setIsLoadingWithdrawals(true);
    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      // Fetch user email for each withdrawal
      const withdrawals: WithdrawalRequest[] = [];
      
      for (const withdrawal of data || []) {
        try {
          if (withdrawal.user_id) {
            const { data: userData } = await supabase.auth.admin.getUserById(withdrawal.user_id);
            withdrawals.push({
              ...withdrawal,
              user_email: userData?.user?.email || 'Unknown'
            });
          } else {
            withdrawals.push(withdrawal);
          }
        } catch (error) {
          console.error("Error fetching user details:", error);
          withdrawals.push(withdrawal);
        }
      }
      
      setWithdrawalRequests(withdrawals);
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
      toast.error("Failed to load withdrawal requests");
    } finally {
      setIsLoadingWithdrawals(false);
    }
  };
  
  const fetchTopUps = async () => {
    setIsLoadingTopUps(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .in('type', ['topup_request', 'withdrawal_request'])
        .order('date', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      // Fetch user email for each transaction
      const topUps: TopUpRequest[] = [];
      
      for (const tx of data || []) {
        try {
          const { data: userData } = await supabase.auth.admin.getUserById(tx.user_id);
          
          topUps.push({
            ...tx,
            user_email: userData?.user?.email || 'Unknown',
            created_at: tx.date // Use date as created_at since we need this field
          });
        } catch (error) {
          console.error("Error fetching user details:", error);
          
          // Add the transaction without email, ensuring created_at exists
          topUps.push({
            ...tx,
            created_at: tx.date
          });
        }
      }
      
      setTopUpRequests(topUps);
    } catch (error) {
      console.error("Error fetching top-ups:", error);
      toast.error("Failed to load top-up requests");
    } finally {
      setIsLoadingTopUps(false);
    }
  };
  
  const fetchSystemLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const { data, error } = await supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      // Get admin emails
      const logs: SystemLog[] = [];
      
      for (const log of data || []) {
        try {
          const { data: adminData } = await supabase.auth.admin.getUserById(log.admin_id);
          logs.push({
            ...log,
            admin_email: adminData?.user?.email || 'Unknown'
          });
        } catch (error) {
          console.error("Error fetching admin details:", error);
          logs.push(log);
        }
      }
      
      setSystemLogs(logs);
    } catch (error) {
      console.error("Error fetching system logs:", error);
      toast.error("Failed to load system logs");
    } finally {
      setIsLoadingLogs(false);
    }
  };
  
  const handleCreateAdmin = async () => {
    if (!newAdminEmail) {
      toast.error("Please enter an email address");
      return;
    }
    
    try {
      // In a real implementation, this would send an invite to the email
      // For now, we'll just show a success message
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("You must be logged in as a superadmin");
        return;
      }
      
      // Log the admin creation
      await supabase
        .from('system_logs')
        .insert({
          admin_id: session.user.id,
          action: 'Created Admin',
          details: `Created ${newAdminRole} with email ${newAdminEmail}`,
          created_at: new Date().toISOString()
        });
      
      toast.success(`Invitation sent to ${newAdminEmail} to become an ${newAdminRole}`);
      setShowNewAdminDialog(false);
      setNewAdminEmail("");
      
      // Refresh users list
      fetchUsers();
    } catch (error: any) {
      console.error("Error creating admin:", error);
      toast.error(error.message || "Failed to create admin");
    }
  };
  
  const handleWithdrawalAction = async (withdrawalId: number, action: 'approve' | 'reject') => {
    try {
      const withdrawal = withdrawalRequests.find(w => w.id === withdrawalId);
      
      if (!withdrawal) {
        toast.error("Withdrawal request not found");
        return;
      }
      
      // Update withdrawal status
      await supabase
        .from('withdrawals')
        .update({ status: action === 'approve' ? 'completed' : 'rejected' })
        .eq('id', withdrawalId);
      
      // Update the associated transaction if needed
      if (action === 'approve') {
        const { data: transactionData, error: txError } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', withdrawal.user_id)
          .eq('amount', -withdrawal.amount)
          .eq('type', 'withdrawal_request');
          
        if (!txError && transactionData?.length > 0) {
          await supabase
            .from('transactions')
            .update({ status: 'completed' })
            .eq('id', transactionData[0].id);
        }
      }
      
      // Log the action
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        await supabase
          .from('system_logs')
          .insert({
            admin_id: session.user.id,
            action: action === 'approve' ? 'Approved Withdrawal' : 'Rejected Withdrawal',
            details: `${action} withdrawal #${withdrawalId} for ${withdrawal.amount} coins by ${withdrawal.user_email || withdrawal.user_id}`,
            created_at: new Date().toISOString()
          });
      }
      
      toast.success(`Withdrawal ${action}d successfully`);
      
      // Refresh withdrawals list
      fetchWithdrawals();
    } catch (error: any) {
      console.error(`Error ${action}ing withdrawal:`, error);
      toast.error(error.message || `Failed to ${action} withdrawal`);
    }
  };
  
  const handleTopUpAction = async (topUpId: string, action: 'approve' | 'reject') => {
    try {
      const topUp = topUpRequests.find(t => t.id === topUpId);
      
      if (!topUp) {
        toast.error("Top-up request not found");
        return;
      }
      
      // Update transaction status
      await supabase
        .from('transactions')
        .update({ 
          status: action === 'approve' ? 'completed' : 'rejected',
          admin_id: (await supabase.auth.getSession()).data.session?.user.id
        })
        .eq('id', topUpId);
      
      // Log the action
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        await supabase
          .from('system_logs')
          .insert({
            admin_id: session.user.id,
            action: action === 'approve' ? 'Approved Top-up' : 'Rejected Top-up',
            details: `${action} top-up #${topUpId} for ${topUp.amount} coins by ${topUp.user_email || topUp.user_id}`,
            created_at: new Date().toISOString()
          });
      }
      
      toast.success(`Top-up ${action}d successfully`);
      
      // Refresh top-ups list
      fetchTopUps();
    } catch (error: any) {
      console.error(`Error ${action}ing top-up:`, error);
      toast.error(error.message || `Failed to ${action} top-up`);
    }
  };
  
  const handleToggleSetting = async (id: string, currentValue: boolean) => {
    const updatedConfig = appConfig.map(config => 
      config.id === id ? { ...config, value: !currentValue } : config
    );
    
    setAppConfig(updatedConfig);
    
    // In a real implementation, this would update the configuration in the database
    toast.success("Setting updated successfully");
    
    // Log the action
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const configItem = appConfig.find(c => c.id === id);
        
        if (configItem) {
          await supabase
            .from('system_logs')
            .insert({
              admin_id: session.user.id,
              action: 'Updated App Setting',
              details: `Changed ${configItem.key} from ${currentValue} to ${!currentValue}`,
              created_at: new Date().toISOString()
            });
        }
      }
    } catch (error) {
      console.error("Error logging setting change:", error);
    }
  };
  
  const handleUpdateMatchPricing = (id: string, field: keyof MatchPricing, value: number) => {
    const updatedPricing = matchPricing.map(pricing => 
      pricing.id === id ? { 
        ...pricing, 
        [field]: value,
        updated_at: new Date().toISOString()
      } : pricing
    );
    
    setMatchPricing(updatedPricing);
    
    // In a real implementation, this would update the pricing in the database
    toast.success(`Match pricing updated successfully`);
    
    // Log the action
    try {
      const { data: { session } } = supabase.auth.getSession();
      
      if (session) {
        const pricingItem = matchPricing.find(p => p.id === id);
        
        if (pricingItem) {
          supabase
            .from('system_logs')
            .insert({
              admin_id: session?.user?.id,
              action: 'Updated Match Pricing',
              details: `Changed ${pricingItem.match_type} ${field} to ${value}`,
              created_at: new Date().toISOString()
            });
        }
      }
    } catch (error) {
      console.error("Error logging pricing change:", error);
    }
  };
  
  const handleUpdateWithdrawalTier = (id: string, field: keyof WithdrawalTier, value: number) => {
    const updatedTiers = withdrawalTiers.map(tier => 
      tier.id === id ? { ...tier, [field]: value } : tier
    );
    
    setWithdrawalTiers(updatedTiers);
    
    // In a real implementation, this would update the tiers in the database
    toast.success("Withdrawal tier updated successfully");
    
    // Log the action
    try {
      const { data: { session } } = supabase.auth.getSession();
      
      if (session) {
        const tierItem = withdrawalTiers.find(t => t.id === id);
        
        if (tierItem) {
          supabase
            .from('system_logs')
            .insert({
              admin_id: session?.user?.id,
              action: 'Updated Withdrawal Tier',
              details: `Changed tier ${tierItem.description} ${field} to ${value}`,
              created_at: new Date().toISOString()
            });
        }
      }
    } catch (error) {
      console.error("Error logging tier change:", error);
    }
  };
  
  const handleUpdateRoomDetails = async () => {
    if (!selectedMatchId) {
      toast.error("No match selected");
      return;
    }
    
    try {
      // Update match room details
      await supabase
        .from('matches')
        .update({
          room_id: roomId || null,
          room_password: roomPassword || null
        })
        .eq('id', selectedMatchId);
      
      // Log the action
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        await supabase
          .from('system_logs')
          .insert({
            admin_id: session.user.id,
            action: 'Updated Match Room',
            details: `Set room ID and password for match ${selectedMatchId}`,
            created_at: new Date().toISOString()
          });
      }
      
      toast.success("Match room details updated successfully");
      setShowRoomDialog(false);
      
      // In a real implementation, this would also notify users who joined the match
    } catch (error: any) {
      console.error("Error updating room details:", error);
      toast.error(error.message || "Failed to update room details");
    }
  };
  
  const handleAssignCoins = async () => {
    if (!coinsUserId) {
      toast.error("Please enter a user ID");
      return;
    }
    
    if (coinsAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    try {
      // Create transaction for coin assignment
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("You must be logged in as a superadmin");
        return;
      }
      
      await supabase
        .from('transactions')
        .insert({
          user_id: coinsUserId,
          type: coinsType === 'bonus' ? 'admin_bonus' : 'admin_reward',
          amount: coinsAmount,
          status: 'completed',
          date: new Date().toISOString().split('T')[0],
          admin_id: session.user.id,
          notes: coinsNote || `Assigned by admin`
        });
      
      // Log the action
      await supabase
        .from('system_logs')
        .insert({
          admin_id: session.user.id,
          action: 'Assigned Coins',
          details: `Assigned ${coinsAmount} ${coinsType} coins to user ${coinsUserId}`,
          created_at: new Date().toISOString()
        });
      
      toast.success(`Successfully assigned ${coinsAmount} coins to user`);
      setShowAssignCoinsDialog(false);
      setCoinsUserId("");
      setCoinsAmount(0);
      setCoinsType("real");
      setCoinsNote("");
    } catch (error: any) {
      console.error("Error assigning coins:", error);
      toast.error(error.message || "Failed to assign coins");
    }
  };
  
  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-nexara-accent mb-2">Admin Dashboard</h1>
        <p className="text-gray-400">Manage users, matches, and app settings</p>
      </header>
      
      <Tabs defaultValue="users" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted mb-4 grid grid-cols-7 max-w-full overflow-auto">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
          <TabsTrigger value="top-ups">Top-ups</TabsTrigger>
          <TabsTrigger value="match-room">Match Rooms</TabsTrigger>
          <TabsTrigger value="settings">App Settings</TabsTrigger>
          <TabsTrigger value="match-pricing">Match Pricing</TabsTrigger>
          <TabsTrigger value="logs">System Logs</TabsTrigger>
        </TabsList>
        
        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Manage Users & Admins</CardTitle>
              <Button onClick={() => setShowNewAdminDialog(true)}>Add Admin</Button>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search users by email..."
                  className="pl-9"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                />
              </div>
              
              {isLoadingUsers ? (
                <div className="flex justify-center py-12">
                  <Loader className="h-8 w-8 animate-spin text-nexara-accent" />
                </div>
              ) : filteredUsers.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map(user => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.email}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs ${
                              user.role === 'superadmin' 
                                ? 'bg-nexara-accent/20 text-nexara-accent' 
                                : user.role === 'admin'
                                  ? 'bg-blue-900/20 text-blue-400'
                                  : 'bg-gray-800/40 text-gray-400'
                            }`}>
                              {user.role}
                            </span>
                          </TableCell>
                          <TableCell>
                            {new Date(user.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setCoinsUserId(user.id);
                                  setShowAssignCoinsDialog(true);
                                }}
                              >
                                <Coins className="h-4 w-4 mr-1" />
                                Coins
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <h3 className="text-lg font-medium">No users found</h3>
                  {userSearchQuery && (
                    <p className="text-gray-400">
                      No users match your search query
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Withdrawals Tab */}
        <TabsContent value="withdrawals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Withdrawal Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingWithdrawals ? (
                <div className="flex justify-center py-12">
                  <Loader className="h-8 w-8 animate-spin text-nexara-accent" />
                </div>
              ) : withdrawalRequests.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[180px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {withdrawalRequests.map(withdrawal => (
                        <TableRow key={withdrawal.id}>
                          <TableCell className="font-medium">{withdrawal.user_email}</TableCell>
                          <TableCell>{withdrawal.amount} coins</TableCell>
                          <TableCell>
                            {new Date(withdrawal.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs ${
                              withdrawal.status === 'completed' 
                                ? 'bg-green-900/20 text-green-400' 
                                : withdrawal.status === 'rejected'
                                  ? 'bg-red-900/20 text-red-400'
                                  : 'bg-yellow-900/20 text-yellow-400'
                            }`}>
                              {withdrawal.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            {withdrawal.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="bg-green-900/20 hover:bg-green-900/40 border-green-500/50"
                                  onClick={() => handleWithdrawalAction(withdrawal.id, 'approve')}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                                  Approve
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="bg-red-900/20 hover:bg-red-900/40 border-red-500/50"
                                  onClick={() => handleWithdrawalAction(withdrawal.id, 'reject')}
                                >
                                  <XCircle className="h-4 w-4 mr-1 text-red-500" />
                                  Reject
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Wallet className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <h3 className="text-lg font-medium">No withdrawal requests</h3>
                  <p className="text-gray-400">
                    When users request to withdraw coins, they will appear here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Withdrawal Tiers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 items-center font-medium text-sm text-gray-400">
                  <div>Tier</div>
                  <div>Max Count</div>
                  <div>Rate (₹ per 30 coins)</div>
                </div>
                {withdrawalTiers.map(tier => (
                  <div key={tier.id} className="grid grid-cols-3 gap-4 items-center">
                    <div className="font-medium">{tier.description}</div>
                    <div>
                      <Input 
                        type="number" 
                        value={tier.max_count} 
                        onChange={(e) => handleUpdateWithdrawalTier(tier.id, 'max_count', parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <Input 
                        type="number" 
                        value={tier.rate} 
                        onChange={(e) => handleUpdateWithdrawalTier(tier.id, 'rate', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Top-ups Tab */}
        <TabsContent value="top-ups" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top-up Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingTopUps ? (
                <div className="flex justify-center py-12">
                  <Loader className="h-8 w-8 animate-spin text-nexara-accent" />
                </div>
              ) : topUpRequests.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Note</TableHead>
                        <TableHead className="w-[180px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topUpRequests.map(request => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">{request.user_email}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              {request.type === 'topup_request' ? (
                                <CircleArrowUp className="mr-1 h-4 w-4 text-green-500" />
                              ) : (
                                <CircleArrowDown className="mr-1 h-4 w-4 text-red-500" />
                              )}
                              {request.type.replace('_request', '')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={request.amount > 0 ? "text-green-500" : "text-red-500"}>
                              {request.amount > 0 ? "+" : ""}{request.amount} coins
                            </span>
                          </TableCell>
                          <TableCell>
                            {new Date(request.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs ${
                              request.status === 'completed' 
                                ? 'bg-green-900/20 text-green-400' 
                                : request.status === 'rejected'
                                  ? 'bg-red-900/20 text-red-400'
                                  : 'bg-yellow-900/20 text-yellow-400'
                            }`}>
                              {request.status}
                            </span>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {request.notes}
                          </TableCell>
                          <TableCell>
                            {request.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="bg-green-900/20 hover:bg-green-900/40 border-green-500/50"
                                  onClick={() => handleTopUpAction(request.id, 'approve')}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                                  Approve
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="bg-red-900/20 hover:bg-red-900/40 border-red-500/50"
                                  onClick={() => handleTopUpAction(request.id, 'reject')}
                                >
                                  <XCircle className="h-4 w-4 mr-1 text-red-500" />
                                  Reject
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Coins className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <h3 className="text-lg font-medium">No top-up requests</h3>
                  <p className="text-gray-400">
                    When users request to add coins to their account, they will appear here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Match Room Tab */}
        <TabsContent value="match-room" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Update Match Room Details</CardTitle>
              <Button onClick={() => setShowRoomDialog(true)}>Set Room Details</Button>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 mb-4">
                Set room ID and password for upcoming matches so players can join the game.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* App Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>App Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {appConfig.map(config => (
                  <div key={config.id} className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{config.key.replace(/_/g, ' ')}</div>
                      <div className="text-sm text-gray-400">{config.description}</div>
                    </div>
                    <Button
                      variant={config.value ? "default" : "outline"}
                      onClick={() => handleToggleSetting(config.id, config.value as boolean)}
                    >
                      {config.value ? "Enabled" : "Disabled"}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Match Pricing Tab */}
        <TabsContent value="match-pricing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Match Pricing & Rewards</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {matchPricing.map(pricing => (
                  <div key={pricing.id} className="space-y-4 pb-4 border-b border-gray-800">
                    <div className="font-medium text-lg">
                      {pricing.match_type === 'BattleRoyale' && 'Battle Royale'}
                      {pricing.match_type === 'ClashSolo' && 'Clash Squad Solo'}
                      {pricing.match_type === 'ClashDuo' && 'Clash Squad Duo'}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Entry Fee (coins)</Label>
                        <Input 
                          type="number" 
                          value={pricing.entry_fee} 
                          onChange={(e) => handleUpdateMatchPricing(pricing.id, 'entry_fee', parseInt(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Win Reward (coins)</Label>
                        <Input 
                          type="number" 
                          value={pricing.win_reward} 
                          onChange={(e) => handleUpdateMatchPricing(pricing.id, 'win_reward', parseInt(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Kill Reward (coins)</Label>
                        <Input 
                          type="number" 
                          value={pricing.kill_reward} 
                          onChange={(e) => handleUpdateMatchPricing(pricing.id, 'kill_reward', parseInt(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* System Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Activity Logs</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingLogs ? (
                <div className="flex justify-center py-12">
                  <Loader className="h-8 w-8 animate-spin text-nexara-accent" />
                </div>
              ) : systemLogs.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Admin</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {systemLogs.map(log => (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium">{log.admin_email}</TableCell>
                          <TableCell>{log.action}</TableCell>
                          <TableCell className="max-w-[300px] truncate">{log.details}</TableCell>
                          <TableCell>
                            {new Date(log.created_at).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Circle className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <h3 className="text-lg font-medium">No logs found</h3>
                  <p className="text-gray-400">
                    System activity logs will appear here as admins take actions
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Add Admin Dialog */}
      <Dialog open={showNewAdminDialog} onOpenChange={setShowNewAdminDialog}>
        <DialogContent className="bg-nexara-bg border-nexara-accent">
          <DialogHeader>
            <DialogTitle>Add New Admin User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email Address</Label>
              <Input
                id="admin-email"
                placeholder="admin@example.com"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-role">Role</Label>
              <Select value={newAdminRole} onValueChange={(value) => setNewAdminRole(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="superadmin">Superadmin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewAdminDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateAdmin}>Create Admin</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Match Room Dialog */}
      <Dialog open={showRoomDialog} onOpenChange={setShowRoomDialog}>
        <DialogContent className="bg-nexara-bg border-nexara-accent">
          <DialogHeader>
            <DialogTitle>Set Match Room Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="match-id">Match ID</Label>
              <Select onValueChange={(value) => setSelectedMatchId(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select match" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="match-1">Battle Royale #125</SelectItem>
                  <SelectItem value="match-2">Clash Squad Solo #87</SelectItem>
                  <SelectItem value="match-3">Clash Squad Duo #42</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="room-id">Room ID</Label>
              <Input
                id="room-id"
                placeholder="Game room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="room-password">Room Password</Label>
              <Input
                id="room-password"
                placeholder="Room password"
                value={roomPassword}
                onChange={(e) => setRoomPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoomDialog(false)}>Cancel</Button>
            <Button onClick={handleUpdateRoomDetails}>Save Room Details</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Assign Coins Dialog */}
      <Dialog open={showAssignCoinsDialog} onOpenChange={setShowAssignCoinsDialog}>
        <DialogContent className="bg-nexara-bg border-nexara-accent">
          <DialogHeader>
            <DialogTitle>Assign Coins to User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user-id">User ID</Label>
              <Input
                id="user-id"
                placeholder="User ID"
                value={coinsUserId}
                onChange={(e) => setCoinsUserId(e.target.value)}
                disabled={!!coinsUserId}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coins-amount">Coins Amount</Label>
              <Input
                id="coins-amount"
                type="number"
                placeholder="Number of coins"
                value={coinsAmount || ''}
                onChange={(e) => setCoinsAmount(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coins-type">Coins Type</Label>
              <Select value={coinsType} onValueChange={(value) => setCoinsType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="real">Real Coins</SelectItem>
                  <SelectItem value="bonus">Bonus Coins</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="coins-note">Note (Optional)</Label>
              <Textarea
                id="coins-note"
                placeholder="Reason for assigning coins"
                value={coinsNote}
                onChange={(e) => setCoinsNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignCoinsDialog(false)}>Cancel</Button>
            <Button onClick={handleAssignCoins}>Assign Coins</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
