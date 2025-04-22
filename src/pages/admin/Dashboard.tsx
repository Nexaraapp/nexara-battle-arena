
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trophy,
  Users,
  Wallet,
  ArrowLeft,
  Shield,
  AlertCircle,
  Edit,
  XCircle,
  Check,
  Trash,
  Plus,
  FileText,
  Settings,
  Coins,
  BarChart,
  ToggleLeft,
  ToggleRight,
  AlignJustify,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

// QR code image URL
const QR_CODE_URL = "/lovable-uploads/50e5f998-8ecf-493d-aded-3c24db032cf0.png";

// Types
type UserRole = 'user' | 'admin' | 'superadmin';

interface UserData {
  id: string;
  email: string;
  role: UserRole;
}

interface WithdrawalRequest {
  id: number;
  user_id: string;
  amount: number;
  created_at: string;
  status: string;
  user_email?: string;
  qr_url?: string;
}

interface TopUpRequest {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  created_at: string;
  user_email?: string;
  screenshot_url?: string;
  utr_number?: string;
}

interface MatchSettings {
  type: string;
  entry_fee: number;
  admin_profit_percentage: number;
  kill_reward: number;
  win_reward: number;
}

interface AppConfig {
  id: string;
  require_ad_before_withdrawal: boolean;
  use_auto_match_results: boolean;
  min_withdrawal_amount: number;
  coin_value_in_inr: number;
}

interface Match {
  id: string;
  type: string;
  entry_fee: number;
  prize: number;
  slots: number;
  slots_filled: number;
  room_id: string | null;
  room_password: string | null;
  status: string;
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
  min_withdrawals: number;
  max_withdrawals: number;
  coins: number;
  inr_value: number;
}

const AdminDashboard = () => {
  const { user, isAdmin, isSuperadmin } = useAuth();
  const [activeTab, setActiveTab] = useState("matches");
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    activeUsers: 0,
    activeMatches: 0,
    pendingWithdrawals: 0,
    totalRevenue: 0,
  });

  // State for different features
  const [matches, setMatches] = useState<Match[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [topUps, setTopUps] = useState<TopUpRequest[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [matchSettings, setMatchSettings] = useState<MatchSettings[]>([]);
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [withdrawalTiers, setWithdrawalTiers] = useState<WithdrawalTier[]>([]);

  // Dialog states
  const [showAddAdminDialog, setShowAddAdminDialog] = useState(false);
  const [showEditMatchSettingsDialog, setShowEditMatchSettingsDialog] = useState(false);
  const [showEditWithdrawalTierDialog, setShowEditWithdrawalTierDialog] = useState(false);
  const [showEditMatchDialog, setShowEditMatchDialog] = useState(false);
  const [showAssignCoinsDialog, setShowAssignCoinsDialog] = useState(false);
  const [showViewTopUpDialog, setShowViewTopUpDialog] = useState(false);

  // Form states
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminRole, setNewAdminRole] = useState<UserRole>("admin");
  const [selectedMatchSetting, setSelectedMatchSetting] = useState<MatchSettings | null>(null);
  const [selectedWithdrawalTier, setSelectedWithdrawalTier] = useState<WithdrawalTier | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [roomId, setRoomId] = useState("");
  const [roomPassword, setRoomPassword] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [coinsAmount, setCoinsAmount] = useState("");
  const [coinType, setCoinType] = useState("real");
  const [selectedTopUp, setSelectedTopUp] = useState<TopUpRequest | null>(null);

  // Load initial data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Load stats
      await fetchStats();
      
      // Load data for current tab
      await fetchTabData(activeTab);
      
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Get active users count
      const { count: usersCount, error: usersError } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact' });

      // Get active matches count
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .in('status', ['upcoming', 'active']);

      // Get pending withdrawals count
      const { count: withdrawalsCount, error: withdrawalsError } = await supabase
        .from('withdrawals')
        .select('*', { count: 'exact' })
        .eq('status', 'pending');

      // Get total revenue (from admin profit transactions)
      const { data: revenueData, error: revenueError } = await supabase
        .from('transactions')
        .select('amount')
        .eq('type', 'match_entry');

      const totalRevenue = revenueData ? revenueData.reduce((acc, transaction) => {
        return acc + (transaction.amount < 0 ? Math.abs(transaction.amount) * 0.4 : 0); // Assuming 40% platform fee
      }, 0) : 0;

      setStats({
        activeUsers: usersCount || 0,
        activeMatches: matchesData?.length || 0,
        pendingWithdrawals: withdrawalsCount || 0,
        totalRevenue,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchTabData = async (tab: string) => {
    switch (tab) {
      case 'matches':
        await Promise.all([
          fetchMatches(),
          fetchMatchSettings()
        ]);
        break;
      case 'withdrawals':
        await Promise.all([
          fetchWithdrawals(),
          fetchTopUps(),
          fetchAppConfig(),
          fetchWithdrawalTiers()
        ]);
        break;
      case 'users':
        await Promise.all([
          fetchUsers(),
          fetchSystemLogs()
        ]);
        break;
      default:
        break;
    }
  };

  // Tab change handler
  const handleTabChange = async (tab: string) => {
    setActiveTab(tab);
    await fetchTabData(tab);
  };

  // Fetch functions for each data type
  const fetchMatches = async () => {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setMatches(data || []);
    } catch (error) {
      console.error("Error fetching matches:", error);
      toast.error("Failed to fetch matches");
    }
  };

  const fetchWithdrawals = async () => {
    try {
      // Get withdrawals with user emails
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user emails
      if (data && data.length > 0) {
        const userIds = data.map(w => w.user_id);
        
        // Fetch from auth.users
        const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
        
        if (!userError) {
          // Map email to each withdrawal
          const withdrawalsWithEmail = data.map(withdrawal => {
            const user = userData.users.find(u => u.id === withdrawal.user_id);
            return {
              ...withdrawal,
              user_email: user?.email || 'Unknown User'
            };
          });
          
          setWithdrawals(withdrawalsWithEmail);
        } else {
          setWithdrawals(data);
          console.error("Error fetching user data:", userError);
        }
      } else {
        setWithdrawals([]);
      }
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
      toast.error("Failed to fetch withdrawals");
    }
  };

  const fetchTopUps = async () => {
    try {
      // Get transactions for top-ups (assuming 'topup' transaction type)
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('type', 'topup')
        .eq('status', 'pending')
        .order('date', { ascending: false });

      if (error) throw error;

      // Get user emails
      if (data && data.length > 0) {
        const userIds = data.map(t => t.user_id);
        
        // Fetch from auth.users
        const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
        
        if (!userError) {
          // Map email to each top-up
          const topUpsWithEmail = data.map(topup => {
            const user = userData.users.find(u => u.id === topup.user_id);
            return {
              ...topup,
              user_email: user?.email || 'Unknown User'
            };
          });
          
          setTopUps(topUpsWithEmail);
        } else {
          setTopUps(data);
          console.error("Error fetching user data:", userError);
        }
      } else {
        setTopUps([]);
      }
    } catch (error) {
      console.error("Error fetching top-ups:", error);
      toast.error("Failed to fetch top-ups");
    }
  };

  const fetchUsers = async () => {
    try {
      // Get users with roles
      const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
      const { data: roleData, error: roleError } = await supabase.from('user_roles').select('*');

      if (userError) throw userError;
      if (roleError) throw roleError;

      const usersWithRoles = userData.users.map(user => {
        const roleEntry = roleData?.find(r => r.user_id === user.id);
        return {
          id: user.id,
          email: user.email || 'No Email',
          role: roleEntry?.role as UserRole || 'user'
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    }
  };

  const fetchMatchSettings = async () => {
    try {
      // For now using mock data, but this would be a table in production
      const mockSettings: MatchSettings[] = [
        { 
          type: 'BattleRoyale', 
          entry_fee: 45,
          admin_profit_percentage: 45,
          kill_reward: 5,
          win_reward: 50
        },
        { 
          type: 'ClashSolo', 
          entry_fee: 25,
          admin_profit_percentage: 40,
          kill_reward: 0,
          win_reward: 30
        },
        { 
          type: 'ClashDuo', 
          entry_fee: 55,
          admin_profit_percentage: 40,
          kill_reward: 0,
          win_reward: 66
        }
      ];
      
      setMatchSettings(mockSettings);
    } catch (error) {
      console.error("Error fetching match settings:", error);
      toast.error("Failed to fetch match settings");
    }
  };

  const fetchAppConfig = async () => {
    try {
      // For now using mock data, but this would be a table in production
      const mockConfig: AppConfig = {
        id: '1',
        require_ad_before_withdrawal: true,
        use_auto_match_results: false,
        min_withdrawal_amount: 50,
        coin_value_in_inr: 1
      };
      
      setAppConfig(mockConfig);
    } catch (error) {
      console.error("Error fetching app config:", error);
      toast.error("Failed to fetch app configuration");
    }
  };

  const fetchWithdrawalTiers = async () => {
    try {
      // For now using mock data, but this would be a table in production
      const mockTiers: WithdrawalTier[] = [
        {
          id: '1',
          min_withdrawals: 0,
          max_withdrawals: 5,
          coins: 30,
          inr_value: 26
        },
        {
          id: '2',
          min_withdrawals: 6,
          max_withdrawals: 999999, // Infinity
          coins: 30,
          inr_value: 24
        }
      ];
      
      setWithdrawalTiers(mockTiers);
    } catch (error) {
      console.error("Error fetching withdrawal tiers:", error);
      toast.error("Failed to fetch withdrawal tiers");
    }
  };

  const fetchSystemLogs = async () => {
    try {
      // For now using mock data, but this would be a table in production
      const mockLogs: SystemLog[] = [
        {
          id: '1',
          admin_id: 'admin1',
          action: 'Match Settings Update',
          details: 'Updated Battle Royale entry fee from 40 to 45',
          created_at: new Date().toISOString(),
          admin_email: 'admin@nexara.test'
        },
        {
          id: '2',
          admin_id: 'admin1',
          action: 'Withdrawal Approved',
          details: 'Approved withdrawal of 100 coins for user123',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          admin_email: 'admin@nexara.test'
        },
        {
          id: '3',
          admin_id: 'admin2',
          action: 'Coins Assigned',
          details: 'Assigned 50 bonus coins to user456',
          created_at: new Date(Date.now() - 172800000).toISOString(),
          admin_email: 'superadmin@nexara.test'
        }
      ];
      
      setSystemLogs(mockLogs);
    } catch (error) {
      console.error("Error fetching system logs:", error);
      toast.error("Failed to fetch system logs");
    }
  };

  // Action handlers

  // Admin management
  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // 1. Create the user
      const { data: userData, error: signUpError } = await supabase.auth.admin.createUser({
        email: newAdminEmail,
        password: newAdminPassword,
        email_confirm: true
      });

      if (signUpError) throw signUpError;
      
      // 2. Assign role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userData.user.id,
          role: newAdminRole
        });

      if (roleError) throw roleError;
      
      // 3. Log the action
      logAdminAction('Admin Created', `Created new ${newAdminRole} account with email ${newAdminEmail}`);
      
      toast.success(`New ${newAdminRole} added successfully`);
      setShowAddAdminDialog(false);
      
      // 4. Reload users list
      fetchUsers();
      
      // Clear form
      setNewAdminEmail('');
      setNewAdminPassword('');
      setNewAdminRole('admin');
      
    } catch (error: any) {
      console.error("Error adding admin:", error);
      toast.error(error.message || "Failed to add admin");
    }
  };

  const handleRemoveAdmin = async (userId: string, email: string) => {
    try {
      // 1. Remove role
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (roleError) throw roleError;
      
      // 2. Log the action
      logAdminAction('Admin Removed', `Removed admin privileges from ${email}`);
      
      toast.success("Admin removed successfully");
      
      // 3. Reload users list
      fetchUsers();
      
    } catch (error: any) {
      console.error("Error removing admin:", error);
      toast.error(error.message || "Failed to remove admin");
    }
  };

  // Withdrawal management
  const handleApproveWithdrawal = async (withdrawal: WithdrawalRequest) => {
    try {
      // 1. Update withdrawal status
      const { error: withdrawalError } = await supabase
        .from('withdrawals')
        .update({ status: 'completed' })
        .eq('id', withdrawal.id);

      if (withdrawalError) throw withdrawalError;
      
      // 2. Create transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: withdrawal.user_id,
          type: 'withdrawal',
          amount: -withdrawal.amount,
          status: 'completed',
          notes: `Withdrawal approved by ${user?.id}`,
          admin_id: user?.id
        });

      if (transactionError) throw transactionError;
      
      // 3. Log the action
      logAdminAction('Withdrawal Approved', `Approved withdrawal of ${withdrawal.amount} coins for ${withdrawal.user_email}`);
      
      toast.success("Withdrawal approved successfully");
      fetchWithdrawals();
      fetchStats();
      
    } catch (error: any) {
      console.error("Error approving withdrawal:", error);
      toast.error(error.message || "Failed to approve withdrawal");
    }
  };

  const handleRejectWithdrawal = async (withdrawal: WithdrawalRequest) => {
    try {
      // 1. Update withdrawal status
      const { error: withdrawalError } = await supabase
        .from('withdrawals')
        .update({ status: 'rejected' })
        .eq('id', withdrawal.id);

      if (withdrawalError) throw withdrawalError;
      
      // 2. Log the action
      logAdminAction('Withdrawal Rejected', `Rejected withdrawal of ${withdrawal.amount} coins for ${withdrawal.user_email}`);
      
      toast.success("Withdrawal rejected successfully");
      fetchWithdrawals();
      fetchStats();
      
    } catch (error: any) {
      console.error("Error rejecting withdrawal:", error);
      toast.error(error.message || "Failed to reject withdrawal");
    }
  };

  // Top-up management
  const handleApproveTopUp = async (topUp: TopUpRequest) => {
    try {
      // 1. Update transaction status
      const { error: transactionError } = await supabase
        .from('transactions')
        .update({ 
          status: 'completed',
          admin_id: user?.id,
          notes: `Top-up approved by ${user?.id}`
        })
        .eq('id', topUp.id);

      if (transactionError) throw transactionError;
      
      // 2. Log the action
      logAdminAction('Top-up Approved', `Approved top-up of ${topUp.amount} coins for ${topUp.user_email}`);
      
      toast.success("Top-up approved successfully");
      fetchTopUps();
      
    } catch (error: any) {
      console.error("Error approving top-up:", error);
      toast.error(error.message || "Failed to approve top-up");
    }
  };

  const handleRejectTopUp = async (topUp: TopUpRequest) => {
    try {
      // 1. Update transaction status
      const { error: transactionError } = await supabase
        .from('transactions')
        .update({ 
          status: 'rejected',
          admin_id: user?.id,
          notes: `Top-up rejected by ${user?.id}`
        })
        .eq('id', topUp.id);

      if (transactionError) throw transactionError;
      
      // 2. Log the action
      logAdminAction('Top-up Rejected', `Rejected top-up of ${topUp.amount} coins for ${topUp.user_email}`);
      
      toast.success("Top-up rejected successfully");
      fetchTopUps();
      
    } catch (error: any) {
      console.error("Error rejecting top-up:", error);
      toast.error(error.message || "Failed to reject top-up");
    }
  };

  // Match settings management
  const handleEditMatchSettings = (setting: MatchSettings) => {
    setSelectedMatchSetting(setting);
    setShowEditMatchSettingsDialog(true);
  };

  const handleSaveMatchSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedMatchSetting) return;
    
    try {
      // Update match settings in state
      setMatchSettings(prevSettings => 
        prevSettings.map(setting => 
          setting.type === selectedMatchSetting.type ? selectedMatchSetting : setting
        )
      );
      
      // Log the action
      logAdminAction('Match Settings Updated', `Updated ${selectedMatchSetting.type} settings`);
      
      toast.success("Match settings updated successfully");
      setShowEditMatchSettingsDialog(false);
      
    } catch (error: any) {
      console.error("Error saving match settings:", error);
      toast.error(error.message || "Failed to save match settings");
    }
  };

  // Match room management
  const handleEditMatch = (match: Match) => {
    setSelectedMatch(match);
    setRoomId(match.room_id || '');
    setRoomPassword(match.room_password || '');
    setShowEditMatchDialog(true);
  };

  const handleSaveMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedMatch) return;
    
    try {
      // 1. Update match
      const { error } = await supabase
        .from('matches')
        .update({ 
          room_id: roomId,
          room_password: roomPassword
        })
        .eq('id', selectedMatch.id);

      if (error) throw error;
      
      // 2. Log the action
      logAdminAction('Match Updated', `Updated room details for ${selectedMatch.type} match`);
      
      toast.success("Match details updated successfully");
      setShowEditMatchDialog(false);
      
      // 3. Reload matches
      fetchMatches();
      
    } catch (error: any) {
      console.error("Error saving match:", error);
      toast.error(error.message || "Failed to save match");
    }
  };

  // Withdrawal tier management
  const handleEditWithdrawalTier = (tier: WithdrawalTier) => {
    setSelectedWithdrawalTier(tier);
    setShowEditWithdrawalTierDialog(true);
  };

  const handleSaveWithdrawalTier = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedWithdrawalTier) return;
    
    try {
      // Update withdrawal tiers in state
      setWithdrawalTiers(prevTiers => 
        prevTiers.map(tier => 
          tier.id === selectedWithdrawalTier.id ? selectedWithdrawalTier : tier
        )
      );
      
      // Log the action
      logAdminAction('Withdrawal Tier Updated', `Updated withdrawal tier for ${selectedWithdrawalTier.min_withdrawals}-${selectedWithdrawalTier.max_withdrawals} withdrawals`);
      
      toast.success("Withdrawal tier updated successfully");
      setShowEditWithdrawalTierDialog(false);
      
    } catch (error: any) {
      console.error("Error saving withdrawal tier:", error);
      toast.error(error.message || "Failed to save withdrawal tier");
    }
  };

  // App config management
  const handleToggleAppConfig = async (key: keyof AppConfig, value: boolean) => {
    if (!appConfig) return;
    
    try {
      // Update app config in state
      setAppConfig(prev => prev ? {
        ...prev,
        [key]: value
      } : null);
      
      // Log the action
      logAdminAction('App Config Updated', `Changed ${key} to ${value}`);
      
      toast.success("App configuration updated");
      
    } catch (error: any) {
      console.error("Error updating app config:", error);
      toast.error(error.message || "Failed to update app configuration");
    }
  };

  // Coin management
  const handleAssignCoins = () => {
    if (!searchQuery.trim()) {
      toast.error("Please search for a user first");
      return;
    }

    // Find user by email search
    const user = users.find(u => u.email.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (user) {
      setSelectedUser(user);
      setShowAssignCoinsDialog(true);
    } else {
      toast.error("User not found");
    }
  };

  const handleSaveAssignCoins = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser || !coinsAmount) return;
    
    try {
      const amount = parseInt(coinsAmount);
      
      // Create transaction
      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: selectedUser.id,
          type: coinType === 'bonus' ? 'admin_reward' : 'topup',
          amount,
          status: 'completed',
          admin_id: user?.id,
          notes: `${amount} ${coinType} coins assigned by admin`
        });

      if (error) throw error;
      
      // Log the action
      logAdminAction('Coins Assigned', `Assigned ${amount} ${coinType} coins to ${selectedUser.email}`);
      
      toast.success("Coins assigned successfully");
      setShowAssignCoinsDialog(false);
      
      // Clear form
      setCoinsAmount('');
      setCoinType('real');
      
    } catch (error: any) {
      console.error("Error assigning coins:", error);
      toast.error(error.message || "Failed to assign coins");
    }
  };

  // Top-up details
  const handleViewTopUp = (topUp: TopUpRequest) => {
    setSelectedTopUp(topUp);
    setShowViewTopUpDialog(true);
  };

  // Helper function to log admin actions
  const logAdminAction = (action: string, details: string) => {
    if (!user) return;
    
    // In a real implementation, this would save to a database
    const newLog: SystemLog = {
      id: Date.now().toString(),
      admin_id: user.id,
      action,
      details,
      created_at: new Date().toISOString(),
      admin_email: user.email
    };
    
    setSystemLogs(prev => [newLog, ...prev]);
    
    // In production, save to database
    // await supabase.from('system_logs').insert(newLog);
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon" className="border border-nexara-accent/20 rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-nexara-accent">Admin Dashboard</h1>
            <p className="text-gray-400">Manage tournaments, users, and payments</p>
          </div>
        </div>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card neon-border">
          <CardContent className="p-4">
            <div className="flex justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Users</p>
                <p className="text-3xl font-bold">{stats.activeUsers}</p>
              </div>
              <Users className="text-nexara-accent h-6 w-6" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card neon-border">
          <CardContent className="p-4">
            <div className="flex justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Matches</p>
                <p className="text-3xl font-bold">{stats.activeMatches}</p>
              </div>
              <Trophy className="text-nexara-highlight h-6 w-6" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card neon-border">
          <CardContent className="p-4">
            <div className="flex justify-between">
              <div>
                <p className="text-gray-400 text-sm">Pending Withdrawals</p>
                <p className="text-3xl font-bold">{stats.pendingWithdrawals}</p>
              </div>
              <Wallet className="text-nexara-warning h-6 w-6" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card neon-border">
          <CardContent className="p-4">
            <div className="flex justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Revenue</p>
                <p className="text-3xl font-bold">₹{stats.totalRevenue}</p>
              </div>
              <div className="text-nexara-info">₹</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Tabs */}
      <Tabs defaultValue="matches" value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="bg-muted mb-4 grid grid-cols-3">
          <TabsTrigger value="matches">Matches</TabsTrigger>
          <TabsTrigger value="withdrawals">Payments</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>
        
        {/* Matches Tab */}
        <TabsContent value="matches" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle>Recent Matches</CardTitle>
                <Button className="game-button">Create Match</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="grid grid-cols-6 bg-muted p-3 text-sm font-medium">
                  <div>Match</div>
                  <div className="text-center">Players</div>
                  <div className="text-center">Entry Fee</div>
                  <div className="text-center">Status</div>
                  <div className="text-center">Room ID</div>
                  <div className="text-center">Actions</div>
                </div>
                <div className="divide-y divide-gray-800">
                  {isLoading ? (
                    <div className="p-4 text-center text-gray-400">Loading matches...</div>
                  ) : matches.length === 0 ? (
                    <div className="p-4 text-center text-gray-400">No matches found</div>
                  ) : (
                    matches.map(match => (
                      <div key={match.id} className="grid grid-cols-6 p-3 text-sm">
                        <div className="font-medium">{match.type}</div>
                        <div className="text-center">{match.slots_filled}/{match.slots}</div>
                        <div className="text-center">{match.entry_fee} coins</div>
                        <div className="text-center">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            match.status === 'active' 
                              ? 'bg-green-900/40 text-green-400' 
                              : match.status === 'upcoming'
                                ? 'bg-blue-900/40 text-blue-400'
                                : match.status === 'completed'
                                  ? 'bg-gray-900/40 text-gray-400'
                                  : 'bg-red-900/40 text-red-400'
                          }`}>
                            {match.status}
                          </span>
                        </div>
                        <div className="text-center">
                          {match.room_id ? match.room_id : '-'}
                        </div>
                        <div className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => handleEditMatch(match)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Room Details
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Match Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {matchSettings.map((setting) => (
                    <div key={setting.type} className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">{setting.type}</h3>
                        <p className="text-sm text-gray-400">
                          Entry: {setting.entry_fee} coins | Profit: {setting.admin_profit_percentage}%
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-nexara-accent/20"
                        onClick={() => handleEditMatchSettings(setting)}
                      >
                        Edit Settings
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start bg-nexara-accent hover:bg-nexara-accent2">
                  <Trophy className="mr-2 h-4 w-4" />
                  Create New Tournament
                </Button>
                <Button variant="outline" className="w-full justify-start border-nexara-accent/20">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Send Global Notification
                </Button>
                <Button variant="outline" className="w-full justify-start border-nexara-accent/20">
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Match Report
                </Button>
                <Button variant="outline" className="w-full justify-start border-nexara-accent/20">
                  <Settings className="mr-2 h-4 w-4" />
                  Modify Game Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Withdrawals/Payments Tab */}
        <TabsContent value="withdrawals" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Withdrawals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <div className="grid grid-cols-5 bg-muted p-3 text-sm font-medium">
                    <div>User</div>
                    <div className="text-center">Coins</div>
                    <div className="text-center">Amount</div>
                    <div className="text-center">Requested</div>
                    <div className="text-center">Actions</div>
                  </div>
                  <div className="divide-y divide-gray-800">
                    {isLoading ? (
                      <div className="p-4 text-center text-gray-400">Loading withdrawals...</div>
                    ) : withdrawals.filter(w => w.status === 'pending').length === 0 ? (
                      <div className="p-4 text-center text-gray-400">No pending withdrawals</div>
                    ) : (
                      withdrawals
                        .filter(w => w.status === 'pending')
                        .map(withdrawal => (
                          <div key={withdrawal.id} className="grid grid-cols-5 p-3 text-sm">
                            <div className="font-medium truncate">{withdrawal.user_email || 'Unknown'}</div>
                            <div className="text-center">{withdrawal.amount}</div>
                            <div className="text-center">₹{withdrawal.amount}</div>
                            <div className="text-center">{new Date(withdrawal.created_at).toLocaleDateString()}</div>
                            <div className="text-center flex justify-center gap-2">
                              <Button 
                                size="sm" 
                                className="h-8 text-xs bg-green-600 hover:bg-green-700"
                                onClick={() => handleApproveWithdrawal(withdrawal)}
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Approve
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive" 
                                className="h-8 text-xs"
                                onClick={() => handleRejectWithdrawal(withdrawal)}
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Deny
                              </Button>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pending Top-ups</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <div className="grid grid-cols-5 bg-muted p-3 text-sm font-medium">
                    <div>User</div>
                    <div className="text-center">Coins</div>
                    <div className="text-center">Amount</div>
                    <div className="text-center">Date</div>
                    <div className="text-center">Actions</div>
                  </div>
                  <div className="divide-y divide-gray-800">
                    {isLoading ? (
                      <div className="p-4 text-center text-gray-400">Loading top-ups...</div>
                    ) : topUps.length === 0 ? (
                      <div className="p-4 text-center text-gray-400">No pending top-ups</div>
                    ) : (
                      topUps.map(topUp => (
                        <div key={topUp.id} className="grid grid-cols-5 p-3 text-sm">
                          <div className="font-medium truncate">{topUp.user_email || 'Unknown'}</div>
                          <div className="text-center">{topUp.amount}</div>
                          <div className="text-center">₹{topUp.amount}</div>
                          <div className="text-center">{new Date(topUp.created_at).toLocaleDateString()}</div>
                          <div className="text-center flex justify-center gap-2">
                            <Button 
                              size="sm" 
                              className="h-8 text-xs bg-nexara-accent hover:bg-nexara-accent2"
                              onClick={() => handleViewTopUp(topUp)}
                            >
                              View
                            </Button>
                            <Button 
                              size="sm" 
                              className="h-8 text-xs bg-green-600 hover:bg-green-700"
                              onClick={() => handleApproveTopUp(topUp)}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              className="h-8 text-xs"
                              onClick={() => handleRejectTopUp(topUp)}
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Deny
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Payment Settings</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Coin Value</h3>
                    <p className="text-sm text-gray-400">1 coin = ₹{appConfig?.coin_value_in_inr || 1}</p>
                  </div>
                  <Button variant="outline" size="sm" className="border-nexara-accent/20">
                    Edit
                  </Button>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Minimum Withdrawal</h3>
                    <p className="text-sm text-gray-400">{appConfig?.min_withdrawal_amount || 50} coins</p>
                  </div>
                  <Button variant="outline" size="sm" className="border-nexara-accent/20">
                    Edit
                  </Button>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Ad Required Before Withdrawal</h3>
                    <p className="text-sm text-gray-400">{appConfig?.require_ad_before_withdrawal ? 'Yes' : 'No'}</p>
                  </div>
                  <Switch 
                    checked={appConfig?.require_ad_before_withdrawal}
                    onCheckedChange={(checked) => handleToggleAppConfig('require_ad_before_withdrawal', checked)}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Auto Match Results (via OpenAI)</h3>
                    <p className="text-sm text-gray-400">{appConfig?.use_auto_match_results ? 'Enabled' : 'Disabled'}</p>
                  </div>
                  <Switch 
                    checked={appConfig?.use_auto_match_results}
                    onCheckedChange={(checked) => handleToggleAppConfig('use_auto_match_results', checked)}
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Withdrawal Tiers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {withdrawalTiers.map(tier => (
                    <div key={tier.id} className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">
                          {tier.min_withdrawals === 0 ? 'First ' : ''}
                          {tier.max_withdrawals < 999999 ? 
                            `${tier.min_withdrawals}-${tier.max_withdrawals} withdrawals` : 
                            `After ${tier.min_withdrawals} withdrawals`}
                        </h3>
                        <p className="text-sm text-gray-400">{tier.coins} coins = ₹{tier.inr_value}</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-nexara-accent/20"
                        onClick={() => handleEditWithdrawalTier(tier)}
                      >
                        Edit
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Payment QR Code</CardTitle>
                <Button className="game-button">Update QR Code</Button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center">
              <div className="border p-3 rounded-md bg-[#fbe191] mb-4">
                <img 
                  src={QR_CODE_URL} 
                  alt="Payment QR Code" 
                  className="w-[200px] h-auto"
                  onError={(e) => {
                    e.currentTarget.src = "https://placehold.co/200x200/fbe191/333333?text=QR+Code";
                  }}
                />
              </div>
              <p className="text-center text-sm text-gray-400">
                UPI ID: 9423704785@fam
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle>User Management</CardTitle>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input 
                        className="pl-8 bg-muted border-nexara-accent/20 w-[200px]" 
                        placeholder="Search by email"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <Button 
                      className="game-button" 
                      onClick={handleAssignCoins}
                    >
                      <Coins className="h-4 w-4 mr-2" />
                      Assign Coins
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <div className="grid grid-cols-4 bg-muted p-3 text-sm font-medium">
                    <div>Email</div>
                    <div className="text-center">Role</div>
                    <div className="text-center">ID</div>
                    <div className="text-center">Actions</div>
                  </div>
                  <div className="divide-y divide-gray-800">
                    {isLoading ? (
                      <div className="p-4 text-center text-gray-400">Loading users...</div>
                    ) : users.length === 0 ? (
                      <div className="p-4 text-center text-gray-400">No users found</div>
                    ) : (
                      users
                        .filter(u => !searchQuery || u.email.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map(user => (
                          <div key={user.id} className="grid grid-cols-4 p-3 text-sm">
                            <div className="font-medium truncate">{user.email}</div>
                            <div className="text-center">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                user.role === 'superadmin' 
                                  ? 'bg-purple-900/40 text-purple-400' 
                                  : user.role === 'admin'
                                    ? 'bg-blue-900/40 text-blue-400'
                                    : 'bg-green-900/40 text-green-400'
                              }`}>
                                {user.role}
                              </span>
                            </div>
                            <div className="text-center text-xs text-gray-400 truncate">{user.id}</div>
                            <div className="text-center flex justify-center gap-2">
                              {isSuperadmin() && user.role !== 'superadmin' && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-8 text-xs"
                                  onClick={() => handleRemoveAdmin(user.id, user.email)}
                                >
                                  {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                                </Button>
                              )}
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Admin Accounts</CardTitle>
                  {isSuperadmin() && (
                    <Button 
                      className="game-button" 
                      size="sm"
                      onClick={() => setShowAddAdminDialog(true)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Admin
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {users
                    .filter(u => u.role === 'superadmin' || u.role === 'admin')
                    .map(admin => (
                      <div key={admin.id} className="flex justify-between items-center p-3 bg-nexara-bg rounded-md">
                        <div>
                          <p className="font-medium">{admin.email}</p>
                          <p className="text-xs text-gray-400">
                            {admin.role === 'superadmin' ? 'Super Administrator' : 'Administrator'}
                          </p>
                        </div>
                        {isSuperadmin() && admin.role !== 'superadmin' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-400"
                            onClick={() => handleRemoveAdmin(admin.id, admin.email)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>System Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] rounded-md border">
                <div className="space-y-3 p-4">
                  {isLoading ? (
                    <div className="text-center text-gray-400">Loading logs...</div>
                  ) : systemLogs.length === 0 ? (
                    <div className="text-center text-gray-400">No system logs found</div>
                  ) : (
                    systemLogs.map(log => (
                      <div key={log.id} className="p-3 bg-muted rounded-md">
                        <div className="flex justify-between">
                          <p className="font-medium text-nexara-accent">{log.action}</p>
                          <p className="text-xs text-gray-400">{new Date(log.created_at).toLocaleString()}</p>
                        </div>
                        <p className="text-sm mt-1">{log.details}</p>
                        <p className="text-xs text-gray-500 mt-1">By: {log.admin_email}</p>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      
      {/* Add Admin Dialog */}
      <Dialog open={showAddAdminDialog} onOpenChange={setShowAddAdminDialog}>
        <DialogContent className="bg-nexara-bg">
          <DialogHeader>
            <DialogTitle>Add Admin</DialogTitle>
            <DialogDescription>
              Create a new admin or superadmin account.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddAdmin}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  className="bg-muted"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  className="bg-muted"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <div className="flex space-x-4">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="admin"
                      className="mr-2"
                      checked={newAdminRole === 'admin'}
                      onChange={() => setNewAdminRole('admin')}
                    />
                    <Label htmlFor="admin">Admin</Label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="superadmin"
                      className="mr-2"
                      checked={newAdminRole === 'superadmin'}
                      onChange={() => setNewAdminRole('superadmin')}
                    />
                    <Label htmlFor="superadmin">Superadmin</Label>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="game-button">Add Admin</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Match Settings Dialog */}
      <Dialog open={showEditMatchSettingsDialog} onOpenChange={setShowEditMatchSettingsDialog}>
        <DialogContent className="bg-nexara-bg">
          <DialogHeader>
            <DialogTitle>Edit Match Settings</DialogTitle>
            <DialogDescription>
              Update settings for {selectedMatchSetting?.type || 'match type'}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveMatchSettings}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="entryFee">Entry Fee (Coins)</Label>
                <Input
                  id="entryFee"
                  type="number"
                  className="bg-muted"
                  value={selectedMatchSetting?.entry_fee || 0}
                  onChange={(e) => setSelectedMatchSetting(prev => 
                    prev ? {...prev, entry_fee: parseInt(e.target.value)} : null
                  )}
                  required
                  min="1"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="adminProfit">Admin Profit Percentage</Label>
                <Input
                  id="adminProfit"
                  type="number"
                  className="bg-muted"
                  value={selectedMatchSetting?.admin_profit_percentage || 0}
                  onChange={(e) => setSelectedMatchSetting(prev => 
                    prev ? {...prev, admin_profit_percentage: parseInt(e.target.value)} : null
                  )}
                  required
                  min="0"
                  max="100"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="killReward">Kill Reward (Coins)</Label>
                <Input
                  id="killReward"
                  type="number"
                  className="bg-muted"
                  value={selectedMatchSetting?.kill_reward || 0}
                  onChange={(e) => setSelectedMatchSetting(prev => 
                    prev ? {...prev, kill_reward: parseInt(e.target.value)} : null
                  )}
                  required
                  min="0"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="winReward">Win Reward (Coins)</Label>
                <Input
                  id="winReward"
                  type="number"
                  className="bg-muted"
                  value={selectedMatchSetting?.win_reward || 0}
                  onChange={(e) => setSelectedMatchSetting(prev => 
                    prev ? {...prev, win_reward: parseInt(e.target.value)} : null
                  )}
                  required
                  min="0"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="game-button">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Withdrawal Tier Dialog */}
      <Dialog open={showEditWithdrawalTierDialog} onOpenChange={setShowEditWithdrawalTierDialog}>
        <DialogContent className="bg-nexara-bg">
          <DialogHeader>
            <DialogTitle>Edit Withdrawal Tier</DialogTitle>
            <DialogDescription>
              Update withdrawal tier settings.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveWithdrawalTier}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="minWithdrawals">Min Withdrawals</Label>
                  <Input
                    id="minWithdrawals"
                    type="number"
                    className="bg-muted"
                    value={selectedWithdrawalTier?.min_withdrawals || 0}
                    onChange={(e) => setSelectedWithdrawalTier(prev => 
                      prev ? {...prev, min_withdrawals: parseInt(e.target.value)} : null
                    )}
                    required
                    min="0"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="maxWithdrawals">Max Withdrawals</Label>
                  <Input
                    id="maxWithdrawals"
                    type="number"
                    className="bg-muted"
                    value={selectedWithdrawalTier?.max_withdrawals || 99999}
                    onChange={(e) => setSelectedWithdrawalTier(prev => 
                      prev ? {...prev, max_withdrawals: parseInt(e.target.value)} : null
                    )}
                    required
                    min="1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="coins">Coins Amount</Label>
                  <Input
                    id="coins"
                    type="number"
                    className="bg-muted"
                    value={selectedWithdrawalTier?.coins || 0}
                    onChange={(e) => setSelectedWithdrawalTier(prev => 
                      prev ? {...prev, coins: parseInt(e.target.value)} : null
                    )}
                    required
                    min="1"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="inrValue">INR Value</Label>
                  <Input
                    id="inrValue"
                    type="number"
                    className="bg-muted"
                    value={selectedWithdrawalTier?.inr_value || 0}
                    onChange={(e) => setSelectedWithdrawalTier(prev => 
                      prev ? {...prev, inr_value: parseInt(e.target.value)} : null
                    )}
                    required
                    min="1"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="game-button">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Match Dialog */}
      <Dialog open={showEditMatchDialog} onOpenChange={setShowEditMatchDialog}>
        <DialogContent className="bg-nexara-bg">
          <DialogHeader>
            <DialogTitle>Edit Match Room Details</DialogTitle>
            <DialogDescription>
              Update the room ID and password for this match.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveMatch}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="roomId">Room ID</Label>
                <Input
                  id="roomId"
                  className="bg-muted"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="roomPassword">Room Password</Label>
                <Input
                  id="roomPassword"
                  className="bg-muted"
                  value={roomPassword}
                  onChange={(e) => setRoomPassword(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="game-button">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Coins Dialog */}
      <Dialog open={showAssignCoinsDialog} onOpenChange={setShowAssignCoinsDialog}>
        <DialogContent className="bg-nexara-bg">
          <DialogHeader>
            <DialogTitle>Assign Coins</DialogTitle>
            <DialogDescription>
              Add coins to {selectedUser?.email || "user's"} account.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveAssignCoins}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="coinAmount">Coin Amount</Label>
                <Input
                  id="coinAmount"
                  type="number"
                  className="bg-muted"
                  value={coinsAmount}
                  onChange={(e) => setCoinsAmount(e.target.value)}
                  required
                  min="1"
                />
              </div>
              <div className="grid gap-2">
                <Label>Coin Type</Label>
                <div className="flex space-x-4">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="real"
                      className="mr-2"
                      checked={coinType === 'real'}
                      onChange={() => setCoinType('real')}
                    />
                    <Label htmlFor="real">Real Coins</Label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="bonus"
                      className="mr-2"
                      checked={coinType === 'bonus'}
                      onChange={() => setCoinType('bonus')}
                    />
                    <Label htmlFor="bonus">Bonus Coins</Label>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="game-button">Assign Coins</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Top-Up Dialog */}
      <Dialog open={showViewTopUpDialog} onOpenChange={setShowViewTopUpDialog}>
        <DialogContent className="bg-nexara-bg">
          <DialogHeader>
            <DialogTitle>Top-Up Details</DialogTitle>
            <DialogDescription>
              Review payment proof and details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>User</Label>
              <p className="bg-muted p-2 rounded">{selectedTopUp?.user_email || 'Unknown'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Amount</Label>
                <p className="bg-muted p-2 rounded">{selectedTopUp?.amount} coins (₹{selectedTopUp?.amount})</p>
              </div>
              <div className="grid gap-2">
                <Label>Date</Label>
                <p className="bg-muted p-2 rounded">
                  {selectedTopUp ? new Date(selectedTopUp.created_at).toLocaleString() : ''}
                </p>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>UTR Number</Label>
              <p className="bg-muted p-2 rounded">{selectedTopUp?.utr_number || 'Not provided'}</p>
            </div>
            <div className="grid gap-2">
              <Label>Payment Screenshot</Label>
              <div className="border rounded-md flex items-center justify-center min-h-[200px] bg-muted">
                {selectedTopUp?.screenshot_url ? (
                  <img 
                    src={selectedTopUp.screenshot_url} 
                    alt="Payment Screenshot" 
                    className="max-w-full max-h-[200px]"
                    onError={(e) => {
                      e.currentTarget.src = "https://placehold.co/400x200/muted/gray?text=No+Screenshot";
                    }}
                  />
                ) : (
                  <p className="text-gray-400">No screenshot provided</p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <Button 
              variant="destructive" 
              onClick={() => {
                if (selectedTopUp) {
                  handleRejectTopUp(selectedTopUp);
                  setShowViewTopUpDialog(false);
                }
              }}
            >
              Reject
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700" 
              onClick={() => {
                if (selectedTopUp) {
                  handleApproveTopUp(selectedTopUp);
                  setShowViewTopUpDialog(false);
                }
              }}
            >
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
