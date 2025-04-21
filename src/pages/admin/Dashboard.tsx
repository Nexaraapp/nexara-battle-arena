
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Users, Wallet, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const AdminDashboard = () => {
  // Mock data - would come from Supabase in a real implementation
  const stats = {
    activeUsers: 127,
    activeMatches: 8,
    pendingWithdrawals: 12,
    totalRevenue: 4500,
  };
  
  const recentMatches = [
    { id: 1, name: "Battle Royale #123", players: 48, entryFee: 45, profit: 972, status: "completed" },
    { id: 2, name: "Battle Royale #124", players: 48, entryFee: 45, profit: 972, status: "active" },
    { id: 3, name: "Clash Squad #86", players: 2, entryFee: 25, profit: 20, status: "completed" },
    { id: 4, name: "Clash Squad Duo #41", players: 4, entryFee: 55, profit: 88, status: "active" },
  ];
  
  const pendingWithdrawals = [
    { id: 1, user: "Player123", coins: 100, amount: "₹100", requested: "2023-04-20", status: "pending" },
    { id: 2, user: "GameMaster44", coins: 250, amount: "₹250", requested: "2023-04-19", status: "pending" },
    { id: 3, user: "Winner007", coins: 500, amount: "₹500", requested: "2023-04-18", status: "pending" },
  ];
  
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
      <Tabs defaultValue="matches">
        <TabsList className="bg-muted mb-4 grid grid-cols-3">
          <TabsTrigger value="matches">Matches</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
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
                <div className="grid grid-cols-5 bg-muted p-3 text-sm font-medium">
                  <div>Match</div>
                  <div className="text-center">Players</div>
                  <div className="text-center">Entry Fee</div>
                  <div className="text-center">Admin Profit</div>
                  <div className="text-center">Status</div>
                </div>
                <div className="divide-y divide-gray-800">
                  {recentMatches.map(match => (
                    <div key={match.id} className="grid grid-cols-5 p-3 text-sm">
                      <div className="font-medium">{match.name}</div>
                      <div className="text-center">{match.players}</div>
                      <div className="text-center">{match.entryFee} coins</div>
                      <div className="text-center">{match.profit} coins</div>
                      <div className="text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          match.status === 'active' 
                            ? 'bg-green-900/40 text-green-400' 
                            : 'bg-blue-900/40 text-blue-400'
                        }`}>
                          {match.status}
                        </span>
                      </div>
                    </div>
                  ))}
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
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">Battle Royale</h3>
                      <p className="text-sm text-gray-400">26-48 players | 45% admin profit</p>
                    </div>
                    <Button variant="outline" size="sm" className="border-nexara-accent/20">
                      Edit Settings
                    </Button>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">Clash Squad - Solo</h3>
                      <p className="text-sm text-gray-400">2 players | 40% admin profit</p>
                    </div>
                    <Button variant="outline" size="sm" className="border-nexara-accent/20">
                      Edit Settings
                    </Button>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">Clash Squad - Duo</h3>
                      <p className="text-sm text-gray-400">4 players | 40% admin profit</p>
                    </div>
                    <Button variant="outline" size="sm" className="border-nexara-accent/20">
                      Edit Settings
                    </Button>
                  </div>
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
                  Send Global Notification
                </Button>
                <Button variant="outline" className="w-full justify-start border-nexara-accent/20">
                  Generate Match Report
                </Button>
                <Button variant="outline" className="w-full justify-start border-nexara-accent/20">
                  Modify Game Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Withdrawals Tab */}
        <TabsContent value="withdrawals" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
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
                  {pendingWithdrawals.map(withdrawal => (
                    <div key={withdrawal.id} className="grid grid-cols-5 p-3 text-sm">
                      <div className="font-medium">{withdrawal.user}</div>
                      <div className="text-center">{withdrawal.coins}</div>
                      <div className="text-center">{withdrawal.amount}</div>
                      <div className="text-center">{new Date(withdrawal.requested).toLocaleDateString()}</div>
                      <div className="text-center flex justify-center gap-2">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 h-8 text-xs">Approve</Button>
                        <Button size="sm" variant="destructive" className="h-8 text-xs">Deny</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Payment Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">Coin Value</h3>
                  <p className="text-sm text-gray-400">1 coin = ₹1</p>
                </div>
                <Button variant="outline" size="sm" className="border-nexara-accent/20">
                  Edit
                </Button>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">Minimum Withdrawal</h3>
                  <p className="text-sm text-gray-400">50 coins</p>
                </div>
                <Button variant="outline" size="sm" className="border-nexara-accent/20">
                  Edit
                </Button>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">Withdrawal Processing Time</h3>
                  <p className="text-sm text-gray-400">12 hours</p>
                </div>
                <Button variant="outline" size="sm" className="border-nexara-accent/20">
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle>User Management</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="border-nexara-accent/20">Export Users</Button>
                  <Button className="game-button">Add Admin</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-400">
                <p>User management interface would be implemented here.</p>
                <p className="text-sm mt-2">
                  This would include user search, filtering, banning options, and role management.
                </p>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Admin Accounts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-nexara-bg rounded-md">
                    <div>
                      <p className="font-medium">superadmin@nexara.test</p>
                      <p className="text-xs text-gray-400">Super Administrator</p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-gray-400">Edit</Button>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-nexara-bg rounded-md">
                    <div>
                      <p className="font-medium">admin@nexara.test</p>
                      <p className="text-xs text-gray-400">Administrator</p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-gray-400">Edit</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>User Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <p>Total Users</p>
                  <p className="font-medium">1,245</p>
                </div>
                <div className="flex justify-between items-center">
                  <p>Active Today</p>
                  <p className="font-medium">127</p>
                </div>
                <div className="flex justify-between items-center">
                  <p>New This Week</p>
                  <p className="font-medium">38</p>
                </div>
                <div className="flex justify-between items-center">
                  <p>Average Coins per User</p>
                  <p className="font-medium">62</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
