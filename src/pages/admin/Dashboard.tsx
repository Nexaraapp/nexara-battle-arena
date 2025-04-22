import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, User, UsersRound, ArrowRight, Coins,
  Wallet, Clock, Check, X, AlertCircle, CircleDollarSign,
  ShieldCheck, Trophy, Settings, Eye
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { getAllMatches, updateMatchRoomDetails, Match } from "@/utils/matchUtils";
import { setUserAsAdmin, getSystemSettings, updateSystemSettings } from "@/utils/transactionUtils";

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

const Dashboard = () => {
  // System logs
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);

  // Admin management
  const [adminEmail, setAdminEmail] = useState("");
  const [isSettingAdmin, setIsSettingAdmin] = useState(false);
  
  // User search
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
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

  // System settings
  const [requireAdForWithdrawal, setRequireAdForWithdrawal] = useState(false);
  const [matchProfitMargin, setMatchProfitMargin] = useState(40);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);

  // Active tab
  const [activeTab, setActiveTab] = useState("top-up");
  
  // Current admin ID
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

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
          requests.push(request);
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
          requests.push(request);
        }
      }
      
      setWithdrawalRequests(requests);
    } catch (error) {
      console.error("Error fetching withdrawal requests:", error);
    }
  };

  const fetchMatches = async () => {
    try {
      const matches = await getAllMatches();
      setMatches(matches);
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
  
  const handleSearchUser = async () => {
    if (!searchEmail.trim()) {
      toast.error("Please enter an email to search");
      return;
    }

    setIsSearching(true);
    setSearchResults([]);
    setSelectedUser(null);

    try {
      // Get all users 
      const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
      
      if (userError || !userData) {
        console.error("Error fetching users:", userError);
        throw new Error("Failed to search users");
      }
      
      // Filter users by email containing the search term
      const filteredUsers = userData.users.filter(user => 
        user.email && user.email.toLowerCase().includes(searchEmail.toLowerCase())
      );
      
      setSearchResults(filteredUsers.slice(0, 10).map(user => ({
        id: user.id,
        email: user.email
      })));
      
      if (filteredUsers.length === 0) {
        toast.error("No users found with that email");
      }
    } catch (error: any) {
      console.error("User search error:", error);
      toast.error(error.message || "Failed to search users");
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
                      <th className="py-2 px-4 text-left">Status</th>
                      <th className="py-2 px-4 text-left">Players</th>
                      <th className="py-2 px-4 text-left">Entry Fee</th>
                      <th className="py-2 px-4 text-left">Prize</th>
                      <th className="py-2 px-4 text-left">Profit %</th>
                      <th className="py-2 px-4 text-left">Room ID</th>
                      <th className="py-2 px-4 text-left">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matches.map((match) => {
                      // Calculate profit percentage
                      const totalFees = match.entry_fee * match.slots;
                      const profitPercent = Math.round(((totalFees - match.prize) / totalFees) * 100);
                      
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
                          <td className="py-2 px-4">{match.prize}</td>
                          <td className="py-2 px-4">
                            <span className={`${profitPercent < 40 ? 'text-red-500' : 'text-green-500'}`}>
                              {profitPercent}%
                            </span>
                          </td>
                          <td className="py-2 px-4">{match.room_id || 'Not set'}</td>
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
                      disabled={isSettingAdmin || !adminEmail}
                      className="w-full"
                    >
                      {isSettingAdmin ? 'Processing...' : 'Create Admin'}
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
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                          placeholder="Search users by email..."
                          className="pl-9"
                          value={searchEmail}
                          onChange={(e) => setSearchEmail(e.target.value)}
                        />
                      </div>
                      <Button 
                        onClick={handleSearchUser}
                        disabled={isSearching || !searchEmail}
                      >
                        {isSearching ? 'Searching...' : 'Search'}
                      </Button>
                    </div>
                    
                    {searchResults.length > 0 && (
                      <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
                        <Label>Search Results</Label>
                        {searchResults.map((user) => (
                          <div 
                            key={user.id} 
                            className={`flex items-center justify-between p-2 rounded-md cursor-pointer ${
                              selectedUser?.id === user.id ? 'bg-nexara-accent/30' : 'bg-muted hover:bg-nexara-accent/10'
                            }`}
                            onClick={() => selectUser(user)}
                          >
                            <div className="flex items-center">
                              <User className="mr-2 h-4 w-4 text-gray-400" />
                              <span>{user.email || 'No email'}</span>
                            </div>
                            {selectedUser?.id === user.id && (
                              <ArrowRight className="h-4 w-4 text-nexara-accent" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {selectedUser && (
                      <div className="mt-6 space-y-4 pt-4 border-t border-nexara-accent/20">
                        <Label>Assign Coins to {selectedUser.email || 'Selected User'}</Label>
                        
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="relative flex-1">
                              <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                              <Input
                                type="number"
                                placeholder="Number of coins"
                                className="pl-9"
                                value={coinsToAssign}
                                onChange={(e) => setCoinsToAssign(e.target.value)}
                              />
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Switch 
                              id="real-coins" 
                              checked={isRealCoins} 
                              onCheckedChange={setIsRealCoins} 
                            />
                            <Label htmlFor="real-coins">
                              {isRealCoins ? 'Real Coins (Withdrawable)' : 'Bonus Coins (Non-withdrawable)'}
                            </Label>
                          </div>
                          
                          <div>
                            <Label htmlFor="coins-note">Note</Label>
                            <Input
                              id="coins-note"
                              placeholder="Optional note for this transaction"
                              className="mt-1"
                              value={coinsNote}
                              onChange={(e) => setCoinsNote(e.target.value)}
                            />
                          </div>
                          
                          <Button 
                            onClick={handleAssignCoins}
                            disabled={isAssigningCoins || !coinsToAssign}
                            className="w-full"
                          >
                            {isAssigningCoins ? 'Processing...' : 'Send Coins'}
                          </Button>
                        </div>
                      </div>
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
                  <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="ad-withdrawal">Require Ad For Withdrawal</Label>
                          <p className="text-sm text-gray-400">Users must watch an ad before withdrawal</p>
                        </div>
                        <Switch 
                          id="ad-withdrawal" 
                          checked={requireAdForWithdrawal} 
                          onCheckedChange={setRequireAdForWithdrawal} 
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="profit-margin">Match Profit Margin %</Label>
                      <p className="text-sm text-gray-400 mb-2">Minimum profit percentage required for creating matches</p>
                      <Input
                        id="profit-margin"
                        type="number"
                        min="0"
                        max="100"
                        value={matchProfitMargin}
                        onChange={(e) => setMatchProfitMargin(parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleUpdateSettings}
                    disabled={isUpdatingSettings}
                    className="w-full"
                  >
                    {isUpdatingSettings ? 'Saving...' : 'Save Settings'}
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
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 px-4 text-left">Time</th>
                      <th className="py-2 px-4 text-left">Admin</th>
                      <th className="py-2 px-4 text-left">Action</th>
                      <th className="py-2 px-4 text-left">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {systemLogs.map((log) => (
                      <tr key={log.id} className="border-b hover:bg-nexara-accent/5">
                        <td className="py-2 px-4">{new Date(log.created_at).toLocaleString()}</td>
                        <td className="py-2 px-4">{log.admin_id === currentAdminId ? 'You' : log.admin_id}</td>
                        <td className="py-2 px-4">{log.action}</td>
                        <td className="py-2 px-4">{log.details || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {systemLogs.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">No system logs found</div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
