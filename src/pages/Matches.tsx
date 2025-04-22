import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Filter, Trophy, Clock, Loader } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Match, joinMatch } from "@/utils/matchUtils";

const Matches = () => {
  // Update state definition
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [walletBalance, setWalletBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  // Update user session retrieval
  const [user, setUser] = useState<{ id: string } | null>(null);

  useEffect(() => {
    // Check if user is authenticated and get wallet balance
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        fetchWalletBalance(session.user.id);
      }
      fetchMatches();
    };
    
    checkAuth();
    
    // Set up real-time listener for matches
    const matchesChannel = supabase
      .channel('matches-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'matches' },
        () => {
          fetchMatches();
        }
      )
      .subscribe();
      
    // Set up real-time listener for transactions (to update balance)
    const transactionsChannel = supabase
      .channel('wallet-changes')
      .on('postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'transactions',
        },
        (payload) => {
          if (user && payload.new.user_id === user.id) {
            fetchWalletBalance(user.id);
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(matchesChannel);
      supabase.removeChannel(transactionsChannel);
    };
  }, [user?.id]);
  
  const fetchWalletBalance = async (userId: string) => {
    try {
      // Get all transactions for this user
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', userId)
        .eq('status', 'completed');
        
      if (error) {
        console.error("Error fetching wallet balance:", error);
        return;
      }
      
      // Calculate balance from transactions
      const balance = transactions
        ? transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0)
        : 0;
        
      setWalletBalance(balance);
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };
  
  const fetchMatches = async () => {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .in('status', ['upcoming', 'active'])
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error("Error fetching matches:", error);
        toast.error("Failed to load matches");
      } else {
        // Type assertion to ensure Match type
        setMatches(data as Match[] || []);
      }
    } catch (error) {
      console.error("Error in fetchMatches:", error);
    }
  };

  const handleJoinMatch = async (matchId: string, entryFee: number) => {
    if (!user) {
      toast.error("Please log in to join a match");
      return;
    }
    
    // Check if user has enough coins
    if (walletBalance < entryFee) {
      toast.error(`Insufficient balance. You need ${entryFee} coins to join this match.`);
      return;
    }
    
    const success = await joinMatch(matchId, user.id);
    if (success) {
      fetchMatches(); // Refresh matches after joining
      fetchWalletBalance(user.id); // Refresh wallet balance
    }
  };
  
  const filteredMatches = matches.filter(match => {
    // Filter by tab selection
    if (activeTab !== "all") {
      if (activeTab === "battle-royale" && match.type !== "BattleRoyale") return false;
      if (activeTab === "clash-squad" && !match.type.startsWith("Clash")) return false;
    }
    
    // Filter by search query (search in match type)
    if (searchQuery && !match.type.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Matches</h1>
          <p className="text-gray-400">Join a tournament and compete for prizes</p>
        </div>
        
        <div className="flex w-full md:w-auto gap-2">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search matches..."
              className="pl-9 bg-muted border-nexara-accent/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" className="border-nexara-accent/20">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {user && (
        <div className="flex justify-end">
          <div className="bg-nexara-accent/10 px-4 py-2 rounded-md">
            <span className="text-sm text-gray-400 mr-2">Wallet Balance:</span>
            <span className="font-semibold">{walletBalance} coins</span>
          </div>
        </div>
      )}

      <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-muted mb-4 grid w-full grid-cols-3">
          <TabsTrigger value="all">All Matches</TabsTrigger>
          <TabsTrigger value="battle-royale">Battle Royale</TabsTrigger>
          <TabsTrigger value="clash-squad">Clash Squad</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="mt-0">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader className="h-8 w-8 animate-spin text-nexara-accent" />
            </div>
          ) : filteredMatches.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredMatches.map((match) => {
                const isJoinable = match.slots_filled < match.slots && match.status === 'upcoming';
                
                return (
                  <Card key={match.id} className="game-card overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex items-center">
                        <div 
                          className={`w-1 self-stretch ${
                            match.type === "BattleRoyale" 
                              ? "bg-nexara-accent" 
                              : "bg-nexara-highlight"
                          }`} 
                        />
                        <div className="p-4 flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-sm text-gray-400">
                              <Clock size={14} className="mr-1" />
                              {match.start_time 
                                ? new Date(match.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : 'Time TBD'
                              }
                            </div>
                            <div className={`text-xs px-2 py-1 rounded ${
                              isJoinable
                                ? 'bg-green-900/40 text-green-400' 
                                : 'bg-gray-800/40 text-gray-400'
                            }`}>
                              {isJoinable ? 'Joinable' : 'Full'}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <h3 className="text-lg font-bold">
                              {match.type === 'BattleRoyale' && 'Battle Royale'}
                              {match.type === 'ClashSolo' && 'Clash Squad Solo'}
                              {match.type === 'ClashDuo' && 'Clash Squad Duo'}
                            </h3>
                            {match.type === "BattleRoyale" && (
                              <Trophy size={16} className="text-nexara-accent" />
                            )}
                          </div>
                          <div className="flex mt-2 text-sm">
                            <div className="pr-3 border-r border-nexara-accent/30">
                              <div className="text-gray-400">Entry</div>
                              <div className="font-semibold">{match.entry_fee} coins</div>
                            </div>
                            <div className="px-3 border-r border-nexara-accent/30">
                              <div className="text-gray-400">Prize</div>
                              <div className="font-semibold">{match.prize} coins</div>
                            </div>
                            <div className="px-3">
                              <div className="text-gray-400">Players</div>
                              <div className="font-semibold">{match.slots_filled}/{match.slots}</div>
                            </div>
                          </div>
                        </div>
                        <div className="h-full flex items-center justify-center p-4">
                          <Button 
                            className="game-button h-10 px-3"
                            disabled={!isJoinable || match.entry_fee > walletBalance}
                            onClick={() => isJoinable && handleJoinMatch(match.id, match.entry_fee)}
                          >
                            {match.entry_fee > walletBalance ? 'Insufficient coins' : 'Join'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="mx-auto bg-nexara-accent/10 rounded-full w-12 h-12 flex items-center justify-center mb-3">
                <Trophy className="text-nexara-accent h-6 w-6" />
              </div>
              <h3 className="text-lg font-medium">No matches found</h3>
              <p className="text-gray-400 mt-1">
                {searchQuery 
                  ? "Try adjusting your search filters." 
                  : "No upcoming matches are available at the moment. Check back soon!"}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Matches;
