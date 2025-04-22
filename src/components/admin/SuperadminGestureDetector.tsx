
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, User, Wallet, ArrowRight, Coins } from "lucide-react";

interface SearchUser {
  id: string;
  email: string | null;
}

export const SuperadminGestureDetector = () => {
  const [tapCount, setTapCount] = useState(0);
  const [showSuperadminModal, setShowSuperadminModal] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState("login");

  const [searchEmail, setSearchEmail] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
  const [coinsToAssign, setCoinsToAssign] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isAssigningCoins, setIsAssigningCoins] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (tapCount >= 7) {
      setShowSuperadminModal(true);
      setTapCount(0);
    } else if (tapCount > 0) {
      timeoutId = setTimeout(() => {
        setTapCount(0);
      }, 3000);
    }

    return () => {
      clearTimeout(timeoutId);
    };
  }, [tapCount]);

  const handleLogoClick = () => {
    setTapCount((prev) => prev + 1);
  };

  const handleSuperadminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      try {
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user?.id)
          .single();

        if (roleError) {
          console.error("Role check error:", roleError);
          toast.error("Failed to check user role, but login successful. Continuing as regular user.");
          setIsLoggingIn(false);
          setShowSuperadminModal(false);
          return;
        }

        if (roleData?.role === "superadmin") {
          toast.success("Superadmin login successful");
          setShowSuperadminModal(false);
          window.location.href = "/admin";
        } else {
          toast.error("Access denied: Not a superadmin.");
        }
      } catch (error) {
        console.error("Role check error:", error);
        toast.error("Failed to check user role, but login successful. Continuing as regular user.");
        setShowSuperadminModal(false);
      }
    } catch (error: any) {
      console.error("Superadmin login error:", error);
      toast.error(error.message || "Login failed. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSearchUser = async () => {
    if (!searchEmail.trim()) {
      toast.error("Please enter an email to search");
      return;
    }

    setIsSearching(true);
    setSearchResults([]);
    setSelectedUser(null);

    try {
      const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
      
      if (userError || !userData) {
        console.error("Error fetching users:", userError);
        throw new Error("Failed to search users");
      }
      
      // Filter users by email
      const filteredUsers: SearchUser[] = userData.users
        .filter(user => 
          typeof user.email === 'string' && 
          user.email.toLowerCase().includes(searchEmail.toLowerCase())
        )
        .map(user => ({
          id: user.id,
          email: user.email
        }));
      
      setSearchResults(filteredUsers.slice(0, 10));
      
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

  const selectUser = (user: SearchUser) => {
    if (user && user.id) {
      setSelectedUser(user);
    }
  };

  const handleAssignCoins = async () => {
    if (!selectedUser) {
      toast.error("Please select a user first");
      return;
    }

    const coins = parseInt(coinsToAssign);
    if (isNaN(coins) || coins <= 0) {
      toast.error("Please enter a valid number of coins");
      return;
    }

    setIsAssigningCoins(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: selectedUser.id,
          type: "admin_reward",
          amount: coins,
          status: "completed",
          date: new Date().toISOString().split('T')[0],
          admin_id: session?.user?.id || null,
          notes: `Assigned by admin/superadmin`,
          is_real_coins: true
        });

      if (error) {
        console.error("Transaction insert error:", error);
        throw new Error("Failed to record transaction");
      }

      toast.success(`Successfully assigned ${coins} coins to ${selectedUser.email || 'user'}`);
      setCoinsToAssign("");
      setSelectedUser(null);
    } catch (error: any) {
      console.error("Coin assignment error:", error);
      toast.error(error.message || "Failed to assign coins");
    } finally {
      setIsAssigningCoins(false);
    }
  };

  useEffect(() => {
    const logoElements = document.querySelectorAll("#app-logo");

    logoElements.forEach((element) => {
      element.addEventListener("click", handleLogoClick);
    });

    return () => {
      logoElements.forEach((element) => {
        element.removeEventListener("click", handleLogoClick);
      });
    };
  }, []);

  return (
    <Dialog open={showSuperadminModal} onOpenChange={setShowSuperadminModal}>
      <DialogContent className="bg-nexara-bg border-nexara-accent neon-border">
        <DialogHeader>
          <DialogTitle className="text-nexara-accent neon-text text-center">
            Superadmin Access
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="manage">Manage Users</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="space-y-4 pt-4">
            <form onSubmit={handleSuperadminLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="superadmin-email">Email</Label>
                <Input
                  id="superadmin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-muted border-nexara-accent/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="superadmin-password">Password</Label>
                <Input
                  id="superadmin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-muted border-nexara-accent/50"
                />
              </div>
              <Button
                type="submit"
                className="w-full game-button"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? "Authenticating..." : "Login as Superadmin"}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="manage" className="space-y-4 pt-4">
            <DialogDescription className="text-center mb-4">
              Search for users and manage their coins
            </DialogDescription>
            
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search users by email..."
                  className="pl-9 bg-muted border-nexara-accent/20"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                />
              </div>
              <Button 
                className="game-button" 
                onClick={handleSearchUser}
                disabled={isSearching}
              >
                {isSearching ? "Searching..." : "Search"}
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
                
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      type="number"
                      placeholder="Number of coins"
                      className="pl-9 bg-muted border-nexara-accent/20"
                      value={coinsToAssign}
                      onChange={(e) => setCoinsToAssign(e.target.value)}
                    />
                  </div>
                  <Button 
                    className="game-button" 
                    onClick={handleAssignCoins}
                    disabled={isAssigningCoins || !coinsToAssign}
                  >
                    {isAssigningCoins ? "Sending..." : "Send Coins"}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
