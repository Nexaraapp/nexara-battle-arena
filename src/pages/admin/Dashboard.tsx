import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { 
  Calendar, 
  Users, 
  Settings, 
  Wallet, 
  ListTodo, 
  Eye, 
  Search, 
  User,
  CircleDollarSign, 
  Trophy,
  UsersRound,
  Trash2, 
  Check,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { searchUsers, checkUserIsAdmin, checkUserIsSuperAdmin } from "@/utils/adminUtils";
import { Match, MatchType, RoomMode, RoomType } from "@/utils/matchTypes";
import { Transaction } from "@/utils/transactionTypes";
import { getSystemSettings, updateSystemSettings } from "@/utils/systemSettingsApi";
import { getUserInfo } from "@/utils/userApi";
import { updateMatchRoomDetails, createMatch, cancelMatch, completeMatch } from "@/utils/matchUtils";
import { setUserAsAdmin } from "@/utils/adminHelpers";

// Define type for UserSearchResult
interface UserSearchResult {
  id: string;
  email: string;
}

// Define SystemLog type
interface SystemLog {
  id: string;
  admin_id: string;
  action: string;
  details?: string;
  created_at: string;
}

// Define TopUp request type
interface TopUpRequest {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  status: string;
  date: string;
  notes?: string;
  user_email?: string;
}

// Define Withdrawal request type
interface WithdrawalRequest {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  status: string;
  date: string;
  notes?: string;
  user_email?: string;
  payout_amount?: number;
}

// Schema for match creation form
const matchCreationSchema = z.object({
  type: z.string({
    required_error: "Please select a match type",
  }),
  mode: z.string({
    required_error: "Please select a room mode",
  }),
  roomType: z.string({
    required_error: "Please select a room type",
  }),
  slots: z.number({
    required_error: "Please enter the number of slots",
  }).min(2, "Minimum 2 slots required").max(100, "Maximum 100 slots"),
  entryFee: z.number({
    required_error: "Please enter the entry fee",
  }).min(10, "Minimum 10 coins required"),
  firstPrize: z.number({
    required_error: "Please enter the first prize",
  }).min(0, "Cannot be negative"),
  secondPrize: z.number().min(0, "Cannot be negative").optional(),
  thirdPrize: z.number().min(0, "Cannot be negative").optional(),
  coinsPerKill: z.number().min(0, "Cannot be negative").optional(),
  startTime: z.string().optional(),
  roomId: z.string().optional(),
  roomPassword: z.string().optional(),
});

const Dashboard = () => {
  // System logs
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);

  // Admin management
  const [adminEmail, setAdminEmail] = useState("");
  const [isSettingAdmin, setIsSettingAdmin] = useState(false);
  
  // User search
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [coinsToAssign, setCoinsToAssign] = useState("");
  const [isRealCoins, setIsRealCoins] = useState(true);
  const [coinsNote, setCoinsNote] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isAssigningCoins, setIsAssigningCoins] = useState(false);

  // Top-up and withdrawal management
  const [topUpRequests, setTopUpRequests] = useState<TopUpRequest[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
  
  // Matches management
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [roomId, setRoomId] = useState("");
  const [roomPassword, setRoomPassword] = useState("");
  const [isUpdatingRoom, setIsUpdatingRoom] = useState(false);
  const [isMatchActionInProgress, setIsMatchActionInProgress] = useState(false);

  // Match creation
  const [isCreatingMatch, setIsCreatingMatch] = useState(false);
  const [createMatchDialogOpen, setCreateMatchDialogOpen] = useState(false);

  // System settings
  const [requireAdForWithdrawal, setRequireAdForWithdrawal] = useState(false);
  const [matchProfitMargin, setMatchProfitMargin] = useState(40);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);

  // Active tab
  const [activeTab, setActiveTab] = useState("top-up");
  
  // Current admin ID
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Match creation form
  const matchCreationForm = useForm<z.infer<typeof matchCreationSchema>>({
    resolver: zodResolver(matchCreationSchema),
    defaultValues: {
      type: MatchType.BattleRoyale,
      mode: RoomMode.Solo,
      roomType: RoomType.Normal,
      slots: 24,
      entryFee: 50,
      firstPrize: 500,
      secondPrize: 300,
      thirdPrize: 200,
      coinsPerKill: 10,
    },
  });
  
  const fetchSystemLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching system logs:", error);
        toast.error("Failed to load system logs");
      } else {
        setSystemLogs(data as SystemLog[] || []);
      }
    } catch (error) {
      console.error("Error in fetchSystemLogs:", error);
    }
  };

  const fetchTopUpRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('type', 'topup')
        .eq('status', 'pending')
        .order('date', { ascending: false });

      if (error) {
        console.error("Error fetching top-up requests:", error);
        return;
      }

      // Get user emails for each request
      const requests: TopUpRequest[] = [];
      
      for (const request of data || []) {
        try {
          const { data: userData } = await supabase.auth.admin.getUserById(request.user_id);
          requests.push({
            ...request,
            user_email: userData?.user?.email || 'Unknown'
          });
        } catch (error) {
          console.error("Error fetching user data:", error);
          requests.push({...request, user_email: 'Unknown'});
        }
      }
      
      setTopUpRequests(requests);
    } catch (error) {
      console.error("Error fetching top-up requests:", error);
    }
  };

  const fetchWithdrawalRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('type', 'withdrawal')
        .eq('status', 'pending')
        .order('date', { ascending: false });

      if (error) {
        console.error("Error fetching withdrawal requests:", error);
        return;
      }

      // Get user emails and calculate payout for each request
      const requests: WithdrawalRequest[] = [];
      
      for (const request of data || []) {
        try {
          const { data: userData } = await supabase.auth.admin.getUserById(request.user_id);
          
          // Calculate payout amount (extract from notes or use default calculation)
          let payoutAmount = 0;
          if (request.notes) {
            const match = request.notes.match(/₹(\d+)/);
            if (match && match[1]) {
              payoutAmount = parseInt(match[1]);
            }
          }
          
          requests.push({
            ...request,
            user_email: userData?.user?.email || 'Unknown',
            payout_amount: payoutAmount
          });
        } catch (error) {
          console.error("Error fetching user data:", error);
          requests.push({...request, user_email: 'Unknown'});
        }
      }
      
      setWithdrawalRequests(requests);
    } catch (error) {
      console.error("Error fetching withdrawal requests:", error);
    }
  };

  const fetchMatches = async () => {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error("Error fetching matches:", error);
        return;
      }
      
      setMatches(data as Match[] || []);
    } catch (error) {
      console.error("Error fetching matches:", error);
    }
  };
  
  const fetchSystemSettings = async () => {
    try {
      const settings = await getSystemSettings();
      setRequireAdForWithdrawal(settings.requireAdForWithdrawal);
      setMatchProfitMargin(settings.matchProfitMargin);
    } catch (error) {
      console.error("Error fetching system settings:", error);
    }
  };

  const checkAdminRole = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      setCurrentAdminId(session.user.id);
      
      // Check if superadmin
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .single();
        
      setIsSuperAdmin(roleData?.role === 'superadmin');
      
    } catch (error) {
      console.error("Error checking admin role:", error);
    }
  };

  useEffect(() => {
    checkAdminRole();
    fetchSystemLogs();
    fetchTopUpRequests();
    fetchWithdrawalRequests();
    fetchMatches();
    fetchSystemSettings();
    
    // Set up real-time listeners
    const transactionsChannel = supabase
      .channel('admin-transaction-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'transactions' },
        () => {
          fetchTopUpRequests();
          fetchWithdrawalRequests();
        }
      )
      .subscribe();
      
    const matchesChannel = supabase
      .channel('admin-match-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'matches' },
        () => {
          fetchMatches();
        }
      )
      .subscribe();
      
    const logsChannel = supabase
      .channel('admin-log-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'system_logs' },
        () => {
          fetchSystemLogs();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(transactionsChannel);
      supabase.removeChannel(matchesChannel);
      supabase.removeChannel(logsChannel);
    };
  }, []);
  
  const handleUserSearch = async () => {
    if (!searchEmail.trim()) {
      toast.error("Please enter an email to search");
      return;
    }

    setIsSearching(true);
    setSelectedUser(null);

    try {
      // Use the searchUsers utility function from adminUtils
      const results = await searchUsers(searchEmail);
      // Cast the results to match our expected type
      setSearchResults(results as UserSearchResult[]);
      
      if (results.length === 0) {
        toast.error("No users found with that email");
      }
    } catch (error: any) {
      console.error("Error searching users:", error);
      toast.error(error.message || "Failed to search for users");
    } finally {
      setIsSearching(false);
    }
  };

  const selectUser = (user: any) => {
    if (user && user.id) {
      setSelectedUser(user);
    }
  };

  const handleAssignCoins = async () => {
    if (!selectedUser) {
      toast.error("Please select a user first");
      return;
    }
    
    if (!currentAdminId) {
      toast.error("Admin session not found");
      return;
    }

    const coins = parseInt(coinsToAssign);
    if (isNaN(coins) || coins <= 0) {
      toast.error("Please enter a valid number of coins");
      return;
    }

    setIsAssigningCoins(true);

    try {
      // Create transaction for coin assignment
      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: selectedUser.id,
          type: "admin_reward",
          amount: coins,
          status: "completed",
          date: new Date().toISOString().split('T')[0],
          admin_id: currentAdminId,
          notes: coinsNote || `Assigned by admin`,
          is_real_coins: isRealCoins
        });

      if (error) {
        console.error("Transaction insert error:", error);
        throw new Error("Failed to record transaction");
      }
      
      // Log admin action
      await supabase
        .from('system_logs')
        .insert({
          admin_id: currentAdminId,
          action: 'Coins Assigned',
          details: `Assigned ${coins} ${isRealCoins ? 'real' : 'bonus'} coins to ${selectedUser.email || 'user'}`
        });

      toast.success(`Successfully assigned ${coins} coins to ${selectedUser.email || 'user'}`);
      setCoinsToAssign("");
      setCoinsNote("");
      setSelectedUser(null);
    } catch (error: any) {
      console.error("Coin assignment error:", error);
      toast.error(error.message || "Failed to assign coins");
    } finally {
      setIsAssigningCoins(false);
    }
  };
  
  const handleMakeAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!adminEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }
    
    if (!currentAdminId) {
      toast.error("Admin session not found");
      return;
    }
    
    if (!isSuperAdmin) {
      toast.error("Only superadmins can create admins");
      return;
    }
    
    setIsSettingAdmin(true);
    
    try {
      const success = await setUserAsAdmin(adminEmail, currentAdminId);
      if (success) {
        setAdminEmail("");
      }
    } catch (error) {
      console.error("Error setting admin:", error);
      toast.error("Failed to set user as admin");
    } finally {
      setIsSettingAdmin(false);
    }
  };
  
  const handleUpdateRoomDetails = async () => {
    if (!selectedMatch) {
      toast.error("Please select a match first");
      return;
    }
    
    if (!currentAdminId) {
      toast.error("Admin session not found");
      return;
    }
    
    if (!roomId.trim()) {
      toast.error("Please enter a room ID");
      return;
    }
    
    if (!roomPassword.trim()) {
      toast.error("Please enter a room password");
      return;
    }
    
    setIsUpdatingRoom(true);
    
    try {
      const success = await updateMatchRoomDetails(
        selectedMatch.id,
        roomId,
        roomPassword,
        currentAdminId || ''
      );
      
      if (success) {
        toast.success("Room details updated successfully");
        fetchMatches();
        setRoomId("");
        setRoomPassword("");
        setSelectedMatch(null);
      }
    } catch (error) {
      console.error("Error updating room details:", error);
      toast.error("Failed to update room details");
    } finally {
      setIsUpdatingRoom(false);
    }
  };

  const handleUpdateSettings = async () => {
    if (!currentAdminId) {
      toast.error("Admin session not found");
      return;
    }
    
    if (!isSuperAdmin) {
      toast.error("Only superadmins can update system settings");
      return;
    }
    
    setIsUpdatingSettings(true);
    
    try {
      const success = await updateSystemSettings({
        requireAdForWithdrawal,
        matchProfitMargin
      }, currentAdminId);
      
      if (success) {
        toast.success("System settings updated successfully");
      }
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error("Failed to update system settings");
    } finally {
      setIsUpdatingSettings(false);
    }
  };
  
  const handleTopUpAction = async (requestId: string, approve: boolean) => {
    if (!currentAdminId) {
      toast.error("Admin session not found");
      return;
    }
    
    setProcessingRequestId(requestId);
    
    try {
      // Find the request
      const request = topUpRequests.find(req => req.id === requestId);
      if (!request) {
        toast.error("Request not found");
        return;
      }
      
      // Update the transaction status
      const { error: updateError } = await supabase
        .from('transactions')
        .update({ 
          status: approve ? 'completed' : 'rejected',
          admin_id: currentAdminId
        })
        .eq('id', requestId);
        
      if (updateError) {
        console.error("Error updating transaction:", updateError);
        throw new Error("Failed to update transaction");
      }
      
      // Log the action
      await supabase
        .from('system_logs')
        .insert({
          admin_id: currentAdminId,
          action: approve ? 'Top-up Approved' : 'Top-up Rejected',
          details: `${approve ? 'Approved' : 'Rejected'} top-up request #${requestId} for ${request.user_email || request.user_id}`
        });
        
      toast.success(`Top-up request ${approve ? 'approved' : 'rejected'} successfully`);
      fetchTopUpRequests();
    } catch (error) {
      console.error("Error processing top-up request:", error);
      toast.error("Failed to process top-up request");
    } finally {
      setProcessingRequestId(null);
    }
  };
  
  const handleWithdrawalAction = async (requestId: string, approve: boolean) => {
    if (!currentAdminId) {
      toast.error("Admin session not found");
      return;
    }
    
    setProcessingRequestId(requestId);
    
    try {
      // Find the request
      const request = withdrawalRequests.find(req => req.id === requestId);
      if (!request) {
        toast.error("Request not found");
        return;
      }
      
      // Update the transaction status
      const { error: updateError } = await supabase
        .from('transactions')
        .update({ 
          status: approve ? 'completed' : 'rejected',
          admin_id: currentAdminId
        })
        .eq('id', requestId);
        
      if (updateError) {
        console.error("Error updating transaction:", updateError);
        throw new Error("Failed to update transaction");
      }
      
      // Update the withdrawal status in the withdrawals table
      const { error: withdrawalError } = await supabase
        .from('withdrawals')
        .update({ 
          status: approve ? 'completed' : 'rejected'
        })
        .eq('user_id', request.user_id);
        
      if (withdrawalError && withdrawalError.code !== 'PGRST116') {
        // Only log as error if it's not a "not found" error
        console.error("Error updating withdrawal record:", withdrawalError);
      }
      
      // Log the action
      await supabase
        .from('system_logs')
        .insert({
          admin_id: currentAdminId,
          action: approve ? 'Withdrawal Approved' : 'Withdrawal Rejected',
          details: `${approve ? 'Approved' : 'Rejected'} withdrawal request #${requestId} for ${request.user_email || request.user_id}`
        });
        
      toast.success(`Withdrawal request ${approve ? 'approved' : 'rejected'} successfully`);
      fetchWithdrawalRequests();
    } catch (error) {
      console.error("Error processing withdrawal request:", error);
      toast.error("Failed to process withdrawal request");
    } finally {
      setProcessingRequestId(null);
    }
  };

  const onCreateMatchSubmit = async (data: z.infer<typeof matchCreationSchema>) => {
    if (!currentAdminId) {
      toast.error("Admin session not found");
      return;
    }

    setIsCreatingMatch(true);

    try {
      // Calculate the total prize pool (first + second + third prizes)
      let prizePool = data.firstPrize;
      if (data.secondPrize) prizePool += data.secondPrize;
      if (data.thirdPrize) prizePool += data.thirdPrize;

      // Battle Royale needs coins per kill
      if (data.type === MatchType.BattleRoyale && !data.coinsPerKill) {
        toast.error("Battle Royale matches require coins per kill");
        return;
      }

      // Create the match
      const newMatchData = {
        type: data.type,
        entry_fee: data.entryFee,
        prize: prizePool,
        slots: data.slots,
        start_time: data.startTime || null,
        room_id: data.roomId || null,
        room_password: data.roomPassword || null,
        mode: data.mode,
        room_type: data.roomType,
        coins_per_kill: data.coinsPerKill || 0,
        first_prize: data.firstPrize,
        second_prize: data.secondPrize || 0,
        third_prize: data.thirdPrize || 0
      };

      const newMatch = await createMatch(newMatchData, currentAdminId);
      
      if (newMatch) {
        toast.success(`Successfully created ${data.type} match`);
        fetchMatches();
        setCreateMatchDialogOpen(false);
        matchCreationForm.reset();
      } else {
        toast.error("Failed to create match");
      }
    } catch (error) {
      console.error("Error creating match:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsCreatingMatch(false);
    }
  };

  const handleCancelMatch = async (matchId: string) => {
    if (!currentAdminId) {
      toast.error("Admin session not found");
      return;
    }

    if (window.confirm("Are you sure you want to cancel this match? All participants will be refunded.")) {
      setIsMatchActionInProgress(true);

      try {
        const success = await cancelMatch(matchId, currentAdminId);
        if (success) {
          toast.success("Match cancelled successfully");
          fetchMatches();
        } else {
          toast.error("Failed to cancel match");
        }
      } catch (error) {
        console.error("Error cancelling match:", error);
        toast.error("An unexpected error occurred");
      } finally {
        setIsMatchActionInProgress(false);
      }
    }
  };

  const handleCompleteMatch = async (matchId: string) => {
    if (!currentAdminId) {
      toast.error("Admin session not found");
      return;
    }

    if (window.confirm("Are you sure you want to mark this match as completed?")) {
      setIsMatchActionInProgress(true);

      try {
        const success = await completeMatch(matchId, currentAdminId);
        if (success) {
          toast.success("Match marked as completed");
          fetchMatches();
        } else {
          toast.error("Failed to complete match");
        }
      } catch (error) {
        console.error("Error completing match:", error);
        toast.error("An unexpected error occurred");
      } finally {
        setIsMatchActionInProgress(false);
      }
    }
  };

  // Helper function to determine proper slot range based on match type
  const getSlotRangeForType = (type: string) => {
    switch (type) {
      case MatchType.BattleRoyale:
        return { min: 24, max: 48, default: 24 };
      case MatchType.ClashSolo:
        return { min: 2, max: 2, default: 2 };
      case MatchType.ClashDuo:
        return { min: 4, max: 4, default: 4 };
      case MatchType.ClashSquad:
        return { min: 8, max: 8, default: 8 };
      default:
        return { min: 2, max: 48, default: 24 };
    }
  };

  // Update form values when match type changes
  const handleMatchTypeChange = (type: string) => {
    const slotRange = getSlotRangeForType(type);
    matchCreationForm.setValue("slots", slotRange.default);
    
    // Set appropriate mode based on match type
    if (type === MatchType.ClashSolo) {
      matchCreationForm.setValue("mode", RoomMode.Solo);
    } else if (type === MatchType.ClashDuo) {
      matchCreationForm.setValue("mode", RoomMode.Duo);
    } else if (type === MatchType.ClashSquad) {
      matchCreationForm.setValue("mode", RoomMode.Squad);
    }
    
    // Show/hide coins per kill based on match type
    if (type === MatchType.BattleRoyale) {
      matchCreationForm.setValue("coinsPerKill", 10);
    } else {
      matchCreationForm.setValue("coinsPerKill", 0);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="top-up">
            <Wallet className="h-4 w-4 mr-2" />
            Top-up Requests
          </TabsTrigger>
          <TabsTrigger value="withdrawals">
            <CircleDollarSign className="h-4 w-4 mr-2" />
            Withdrawal Requests
          </TabsTrigger>
          <TabsTrigger value="matches">
            <Trophy className="h-4 w-4 mr-2" />
            Matches
          </TabsTrigger>
          {isSuperAdmin && (
            <>
              <TabsTrigger value="users">
                <UsersRound className="h-4 w-4 mr-2" />
                User Management
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="h-4 w-4 mr-2" />
                System Settings
              </TabsTrigger>
            </>
          )}
          <TabsTrigger value="logs">
            <Eye className="h-4 w-4 mr-2" />
            System Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="top-up" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Top-up Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {topUpRequests.length > 0 ? (
                <div className="space-y-4">
                  {topUpRequests.map((request) => (
                    <Card key={request.id} className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="flex flex-col sm:flex-row">
                          <div className="p-4 bg-green-900/10 sm:w-1/4">
                            <div className="text-sm text-gray-400">User</div>
                            <div className="font-semibold">{request.user_email || 'Unknown'}</div>
                            <div className="mt-2 text-sm text-gray-400">Amount</div>
                            <div className="font-semibold text-green-500">{request.amount} coins</div>
                            <div className="mt-2 text-sm text-gray-400">Date</div>
                            <div className="font-semibold">{new Date(request.date).toLocaleDateString()}</div>
                          </div>
                          <div className="p-4 flex-1">
                            <div className="text-sm text-gray-400 mb-1">Details</div>
                            <div>{request.notes || 'No details provided'}</div>
                            <div className="flex mt-4 gap-2 justify-end">
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => handleTopUpAction(request.id, false)}
                                disabled={processingRequestId === request.id}
                              >
                                {processingRequestId === request.id ? 'Processing...' : 'Reject'}
                              </Button>
                              <Button 
                                variant="default" 
                                size="sm"
                                onClick={() => handleTopUpAction(request.id, true)}
                                disabled={processingRequestId === request.id}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                {processingRequestId === request.id ? 'Processing...' : 'Approve'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">No pending top-up requests</div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdrawals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Withdrawal Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {withdrawalRequests.length > 0 ? (
                <div className="space-y-4">
                  {withdrawalRequests.map((request) => (
                    <Card key={request.id} className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="flex flex-col sm:flex-row">
                          <div className="p-4 bg-red-900/10 sm:w-1/4">
                            <div className="text-sm text-gray-400">User</div>
                            <div className="font-semibold">{request.user_email || 'Unknown'}</div>
                            <div className="mt-2 text-sm text-gray-400">Amount</div>
                            <div className="font-semibold text-red-500">{Math.abs(request.amount)} coins</div>
                            <div className="mt-2 text-sm text-gray-400">Payout</div>
                            <div className="font-semibold">₹{request.payout_amount}</div>
                            <div className="mt-2 text-sm text-gray-400">Date</div>
                            <div className="font-semibold">{new Date(request.date).toLocaleDateString()}</div>
                          </div>
                          <div className="p-4 flex-1">
                            <div className="text-sm text-gray-400 mb-1">Details</div>
                            <div>{request.notes || 'No details provided'}</div>
                            <div className="flex mt-4 gap-2 justify-end">
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => handleWithdrawalAction(request.id, false)}
                                disabled={processingRequestId === request.id}
                              >
                                {processingRequestId === request.id ? 'Processing...' : 'Reject'}
                              </Button>
                              <Button 
                                variant="default" 
                                size="sm"
                                onClick={() => handleWithdrawalAction(request.id, true)}
                                disabled={processingRequestId === request.id}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                {processingRequestId === request.id ? 'Processing...' : 'Approve & Mark Paid'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">No pending withdrawal requests</div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="matches" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Match Management</h2>
            <Dialog open={createMatchDialogOpen} onOpenChange={setCreateMatchDialogOpen}>
              <DialogTrigger asChild>
                <Button>Create New Match</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Create Match</DialogTitle>
                </DialogHeader>
                <Form {...matchCreationForm}>
                  <form onSubmit={matchCreationForm.handleSubmit(onCreateMatchSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={matchCreationForm.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Match Type</FormLabel>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value);
                                handleMatchTypeChange(value);
                              }}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select match type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value={MatchType.BattleRoyale}>Battle Royale</SelectItem>
                                <SelectItem value={MatchType.ClashSolo}>Clash Solo</SelectItem>
                                <SelectItem value={MatchType.ClashDuo}>Clash Duo</SelectItem>
                                <SelectItem value={MatchType.ClashSquad}>Clash Squad</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={matchCreationForm.control}
                        name="mode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Room Mode</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              disabled={matchCreationForm.watch("type") === MatchType.ClashSolo ||
                                      matchCreationForm.watch("type") === MatchType.ClashDuo ||
                                      matchCreationForm.watch("type") === MatchType.ClashSquad}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select room mode" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value={RoomMode.Solo}>Solo</SelectItem>
                                <SelectItem value={RoomMode.Duo}>Duo</SelectItem>
                                <SelectItem value={RoomMode.Squad}>Squad</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={matchCreationForm.control}
                        name="roomType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Room Type</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select room type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value={RoomType.Normal}>Normal</SelectItem>
                                <SelectItem value={RoomType.Sniper}>Sniper Only</SelectItem>
                                <SelectItem value={RoomType.Pistol}>Pistol Only</SelectItem>
                                <SelectItem value={RoomType.Melee}>Melee Only</SelectItem>
                                <SelectItem value={RoomType.Custom}>Custom Rules</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={matchCreationForm.control}
                        name="slots"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Number of Players</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={e => field.onChange(parseInt(e.target.value))}
                                min={getSlotRangeForType(matchCreationForm.watch("type")).min}
                                max={getSlotRangeForType(matchCreationForm.watch("type")).max}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={matchCreationForm.control}
                        name="entryFee"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Entry Fee (Coins)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={e => field.onChange(parseInt(e.target.value))}
                                min={10}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {matchCreationForm.watch("type") === MatchType.BattleRoyale && (
                        <FormField
                          control={matchCreationForm.control}
                          name="coinsPerKill"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Coins per Kill</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={e => field.onChange(parseInt(e.target.value))}
                                  min={0}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={matchCreationForm.control}
                        name="firstPrize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>1st Prize (Coins)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={e => field.onChange(parseInt(e.target.value))}
                                min={0}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={matchCreationForm.control}
                        name="secondPrize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>2nd Prize (Coins)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                                min={0}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={matchCreationForm.control}
                        name="thirdPrize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>3rd Prize (Coins)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                                min={0}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={matchCreationForm.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Match Start Time</FormLabel>
                          <FormControl>
                            <Input
                              type="datetime-local"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={matchCreationForm.control}
                        name="roomId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Room ID (Optional)</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={matchCreationForm.control}
                        name="roomPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Room Password (Optional)</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="bg-yellow-900/20 p-3 rounded-md flex items-center">
                      <AlertCircle className="h-4 w-4 text-yellow-500 mr-2 flex-shrink-0" />
                      <p className="text-sm text-yellow-500">
                        You can set or update room details later. Room details will only be visible to participants 5 minutes before the match starts.
                      </p>
                    </div>

                    <Button type="submit" className="w-full" disabled={isCreatingMatch}>
                      {isCreatingMatch ? 'Creating...' : 'Create Match'}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Match Room Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Select Match</Label>
                  <Select 
                    value={selectedMatch?.id || ''} 
                    onValueChange={(value) => {
                      const match = matches.find(m => m.id === value);
                      setSelectedMatch(match || null);
                      if (match) {
                        setRoomId(match.room_id || '');
                        setRoomPassword(match.room_password || '');
                      }
                    }}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a match" />
                    </SelectTrigger>
                    <SelectContent>
                      {matches.filter(m => m.status !== 'completed' && m.status !== 'cancelled').map((match) => (
                        <SelectItem key={match.id} value={match.id}>
                          {match.type} - {match.slots_filled}/{match.slots} players - {match.status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedMatch && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="room-id">Room ID</Label>
                        <Input
                          id="room-id"
                          value={roomId}
                          onChange={(e) => setRoomId(e.target.value)}
                          placeholder="Enter room ID"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="room-password">Room Password</Label>
                        <Input
                          id="room-password"
                          value={roomPassword}
                          onChange={(e) => setRoomPassword(e.target.value)}
                          placeholder="Enter room password"
                          className="mt-1"
                        />
                      </div>
                    </div>
                    
                    <Button
                      className="w-full"
                      onClick={handleUpdateRoomDetails}
                      disabled={isUpdatingRoom}
                    >
                      {isUpdatingRoom ? 'Updating...' : 'Update Room Details'}
                    </Button>
                    
                    <div className="bg-yellow-900/20 p-3 rounded-md flex items-center">
                      <AlertCircle className="h-4 w-4 text-yellow-500 mr-2 flex-shrink-0" />
                      <p className="text-sm text-yellow-500">
                        Updating room details will notify all participants who have joined the match.
                      </p>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleCancelMatch(selectedMatch.id)}
                        disabled={isMatchActionInProgress || selectedMatch.status === 'cancelled' || selectedMatch.status === 'completed'}
                        className="flex-1"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Cancel Match
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleCompleteMatch(selectedMatch.id)}
                        disabled={isMatchActionInProgress || selectedMatch.status === 'cancelled' || selectedMatch.status === 'completed'}
                        className="flex-1"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Mark Complete
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>All Matches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 px-4 text-left">Type</th>
                      <th className="py-2 px-4 text-left">Mode</th>
                      <th className="py-2 px-4 text-left">Status</th>
                      <th className="py-2 px-4 text-left">Players</th>
                      <th className="py-2 px-4 text-left">Entry Fee</th>
                      <th className="py-2 px-4 text-left">Prize</th>
                      <th className="py-2 px-4 text-left">Room ID</th>
                      <th className="py-2 px-4 text-left">Start Time</th>
                      <th className="py-2 px-4 text-left">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matches.map((match) => {
                      return (
                        <tr key={match.id} className="border-b hover:bg-nexara-accent/5 cursor-pointer"
                            onClick={() => {
                              setSelectedMatch(match);
                              setRoomId(match.room_id || '');
                              setRoomPassword(match.room_password || '');
                              
                              // Scroll to the top of the matches tab
                              document.querySelector('[data-value="matches"]')?.scrollIntoView({
                                behavior: 'smooth',
                                block: 'start'
                              });
                            }}
                        >
                          <td className="py-2 px-4">{match.type}</td>
                          <td className="py-2 px-4">{match.mode || 'N/A'}</td>
                          <td className="py-2 px-4">
                            <span className={`px-2 py-1 rounded text-xs ${
                              match.status === 'upcoming' ? 'bg-blue-900/20 text-blue-400' :
                              match.status === 'active' ? 'bg-green-900/20 text-green-400' :
                              match.status === 'completed' ? 'bg-gray-500/20 text-gray-400' :
                              'bg-red-900/20 text-red-400'
                            }`}>
                              {match.status}
                            </span>
                          </td>
                          <td className="py-2 px-4">{match.slots_filled}/{match.slots}</td>
                          <td className="py-2 px-4">{match.entry_fee}</td>
                          <td className="py-2 px-4">
                            {match.prize}
                            {match.first_prize && (
                              <span className="ml-1 text-xs text-gray-500">
                                ({match.first_prize}/{match.second_prize || 0}/{match.third_prize || 0})
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-4">
                            {match.room_id ? (
                              <Badge variant="outline" className="bg-green-900/10 text-green-500 border-green-500">
                                Set
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-900/10 text-red-500 border-red-500">
                                Not Set
                              </Badge>
                            )}
                          </td>
                          <td className="py-2 px-4">
                            {match.start_time ? (
                              new Date(match.start_time).toLocaleString()
                            ) : (
                              <span className="text-gray-400">Not set</span>
                            )}
                          </td>
                          <td className="py-2 px-4">{new Date(match.created_at).toLocaleDateString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {isSuperAdmin && (
          <TabsContent value="users" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Create Admin</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleMakeAdmin} className="space-y-4">
                    <div>
                      <Label htmlFor="admin-email">Email</Label>
                      <Input
                        id="admin-email"
                        type="email"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="Enter user email"
                        className="mt-1"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      disabled={isSettingAdmin}
                      className="w-full"
                    >
                      {isSettingAdmin ? 'Processing...' : 'Make Admin'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Assign Coins to User</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Label htmlFor="search-email">User Email</Label>
                        <div className="flex mt-1">
                          <Input
                            id="search-email"
                            value={searchEmail}
                            onChange={(e) => setSearchEmail(e.target.value)}
                            placeholder="Enter email to search"
                            className="rounded-r-none"
                          />
                          <Button 
                            className="rounded-l-none"
                            onClick={handleUserSearch}
                            disabled={isSearching}
                          >
                            {isSearching ? 'Searching...' : <Search className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {searchResults.length > 0 && (
                      <div className="border rounded-md overflow-hidden">
                        <div className="bg-muted px-4 py-2 text-sm font-medium">
                          Search Results
                        </div>
                        <div className="divide-y">
                          {searchResults.map((user) => (
                            <div
                              key={user.id}
                              className={`px-4 py-2 cursor-pointer hover:bg-muted/50 flex items-center justify-between ${
                                selectedUser?.id === user.id ? 'bg-primary/10' : ''
                              }`}
                              onClick={() => selectUser(user)}
                            >
                              <div className="flex items-center">
                                <User className="h-4 w-4 mr-2 text-gray-500" />
                                <span>{user.email}</span>
                              </div>
                              {selectedUser?.id === user.id && (
                                <Check className="h-4 w-4 text-green-500" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {selectedUser && (
                      <>
                        <div>
                          <Label htmlFor="coins-amount">Coins Amount</Label>
                          <Input
                            id="coins-amount"
                            value={coinsToAssign}
                            onChange={(e) => setCoinsToAssign(e.target.value)}
                            placeholder="Enter coins amount"
                            type="number"
                            min="1"
                            className="mt-1"
                          />
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="coin-type"
                            checked={isRealCoins}
                            onCheckedChange={setIsRealCoins}
                          />
                          <Label htmlFor="coin-type">Real coins (vs. bonus coins)</Label>
                        </div>
                        
                        <div>
                          <Label htmlFor="coins-note">Note (optional)</Label>
                          <Textarea
                            id="coins-note"
                            value={coinsNote}
                            onChange={(e) => setCoinsNote(e.target.value)}
                            placeholder="Enter a note about this assignment"
                            className="mt-1"
                          />
                        </div>
                        
                        <Button
                          className="w-full"
                          onClick={handleAssignCoins}
                          disabled={isAssigningCoins}
                        >
                          {isAssigningCoins ? 'Assigning...' : 'Assign Coins'}
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
        
        {isSuperAdmin && (
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="match-profit-margin">Match Profit Margin (%)</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id="match-profit-margin"
                        type="number"
                        min="0"
                        max="100"
                        value={matchProfitMargin}
                        onChange={(e) => setMatchProfitMargin(parseInt(e.target.value))}
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">
                        Default is 40%. This is used when creating new matches.
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="require-ad"
                        checked={requireAdForWithdrawal}
                        onCheckedChange={setRequireAdForWithdrawal}
                      />
                      <Label htmlFor="require-ad">Require ad view for withdrawal</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      If enabled, users will need to watch an ad before withdrawing funds.
                    </p>
                  </div>
                  
                  <Button
                    onClick={handleUpdateSettings}
                    disabled={isUpdatingSettings}
                  >
                    {isUpdatingSettings ? 'Updating...' : 'Save Settings'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
        
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {systemLogs.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="py-2 px-4 text-left">Date</th>
                          <th className="py-2 px-4 text-left">Admin</th>
                          <th className="py-2 px-4 text-left">Action</th>
                          <th className="py-2 px-4 text-left">Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {systemLogs.map((log) => (
                          <tr key={log.id} className="border-b">
                            <td className="py-2 px-4">{new Date(log.created_at).toLocaleString()}</td>
                            <td className="py-2 px-4">{log.admin_id}</td>
                            <td className="py-2 px-4">{log.action}</td>
                            <td className="py-2 px-4">{log.details || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-2">No system logs found</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
