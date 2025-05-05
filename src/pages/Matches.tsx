
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, Loader } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AdDisplay from "@/components/ads/AdDisplay";
import { AdPlacement, shouldShowAdsToUser } from "@/utils/adUtils";
import { MatchmakingQueue } from "@/components/matchmaking/MatchmakingQueue";
import { MatchmakingStatus } from "@/components/matchmaking/MatchmakingStatus";
import { MatchType } from "@/utils/match/matchTypes";
import { getAllQueueStats } from "@/utils/match/matchQueries";

const Matches = () => {
  const [activeTab, setActiveTab] = useState("quick-match");
  const [searchQuery, setSearchQuery] = useState("");
  const [walletBalance, setWalletBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [queueStats, setQueueStats] = useState<any[]>([]);
  const [activeMatchmakingTicket, setActiveMatchmakingTicket] = useState<string | null>(null);

  const { user } = useAuth();
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  
  const showAds = shouldShowAdsToUser(isPremiumUser);

  useEffect(() => {
    if (user) {
      fetchWalletBalance(user.id);
      checkPremiumStatus(user.id);
    }
    
    fetchQueueStats();
  }, [user?.id]);
  
  const checkPremiumStatus = async (userId: string) => {
    try {
      // Check premium status in transactions
      const { data, error } = await supabase
        .from('transactions')
        .select('status')
        .eq('user_id', userId)
        .eq('type', 'premium_subscription')
        .eq('status', 'completed')
        .order('date', { ascending: false })
        .limit(1);
        
      setIsPremiumUser(data && data.length > 0);
    } catch (error) {
      console.error("Error checking premium status:", error);
      setIsPremiumUser(false);
    }
  };
  
  const fetchWalletBalance = async (userId: string) => {
    try {
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', userId)
        .eq('status', 'completed');
        
      if (error) {
        console.error("Error fetching wallet balance:", error);
        return;
      }
      
      const balance = transactions
        ? transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0)
        : 0;
        
      setWalletBalance(balance);
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };
  
  const fetchQueueStats = async () => {
    setIsLoading(true);
    try {
      const stats = await getAllQueueStats();
      setQueueStats(stats);
    } catch (error) {
      console.error("Error fetching queue stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMatchFound = (matchId: string) => {
    // In a real implementation, this would redirect to the game or show game details
    console.log(`Match found! ID: ${matchId}`);
    setActiveMatchmakingTicket(null);
  };

  const handleCancelMatchmaking = () => {
    setActiveMatchmakingTicket(null);
  };

  // This is a mock function that would generate a ticket ID in a real implementation
  const handleJoinQueue = (queueType: MatchType) => {
    if (!user) return;
    
    // In a real implementation, this would be returned from the PlayFab API
    const mockTicketId = `ticket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setActiveMatchmakingTicket(mockTicketId);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Matches</h1>
          <p className="text-gray-400">Join a match and compete for prizes</p>
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

      {showAds && (
        <AdDisplay 
          size="banner"
          placement={AdPlacement.HOME_BANNER}
          className="mb-4"
        />
      )}

      {user && (
        <div className="flex justify-end">
          <div className="bg-nexara-accent/10 px-4 py-2 rounded-md">
            <span className="text-sm text-gray-400 mr-2">Wallet Balance:</span>
            <span className="font-semibold">{walletBalance} coins</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Tabs defaultValue="quick-match" onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-muted mb-4 grid w-full grid-cols-3">
              <TabsTrigger value="quick-match">Quick Match</TabsTrigger>
              <TabsTrigger value="team-match">Team Match</TabsTrigger>
              <TabsTrigger value="battle-royale">Battle Royale</TabsTrigger>
            </TabsList>
            
            {activeMatchmakingTicket ? (
              <div className="max-w-md mx-auto">
                <MatchmakingStatus 
                  userId={user?.id || ''}
                  ticketId={activeMatchmakingTicket}
                  onMatchFound={handleMatchFound}
                  onCancel={handleCancelMatchmaking}
                />
              </div>
            ) : (
              <TabsContent value={activeTab} className="mt-0">
                {isLoading ? (
                  <div className="flex justify-center py-16">
                    <Loader className="h-8 w-8 animate-spin text-nexara-accent" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeTab === "quick-match" && (
                      <>
                        <MatchmakingQueue 
                          queueType={MatchType.OneVsOne}
                          title="Quick Match (1v1)"
                          players={2}
                          entryFee={10}
                          prize={18}
                          estimatedWaitTime={30}
                          playersInQueue={queueStats[0]?.playersInQueue || 0}
                        />
                        <MatchmakingQueue 
                          queueType={MatchType.OneVsOne}
                          title="Pro Match (1v1)"
                          players={2}
                          entryFee={20}
                          prize={36}
                          estimatedWaitTime={45}
                          playersInQueue={1}
                        />
                      </>
                    )}
                    
                    {activeTab === "team-match" && (
                      <>
                        <MatchmakingQueue 
                          queueType={MatchType.FourVsFour}
                          title="Team Match (4v4)"
                          players={8}
                          entryFee={15}
                          prize={100}
                          estimatedWaitTime={60}
                          playersInQueue={queueStats[1]?.playersInQueue || 0}
                        />
                        <MatchmakingQueue 
                          queueType={MatchType.FourVsFour}
                          title="Pro Team Match (4v4)"
                          players={8}
                          entryFee={25}
                          prize={180}
                          estimatedWaitTime={90}
                          playersInQueue={0}
                        />
                      </>
                    )}
                    
                    {activeTab === "battle-royale" && (
                      <>
                        <MatchmakingQueue 
                          queueType={MatchType.BattleRoyale}
                          title="Battle Royale"
                          players={30}
                          entryFee={5}
                          prize={120}
                          estimatedWaitTime={120}
                          playersInQueue={queueStats[2]?.playersInQueue || 0}
                        />
                        <MatchmakingQueue 
                          queueType={MatchType.BattleRoyale}
                          title="Pro Battle Royale"
                          players={50}
                          entryFee={10}
                          prize={450}
                          estimatedWaitTime={180}
                          playersInQueue={0}
                        />
                      </>
                    )}
                  </div>
                )}
              </TabsContent>
            )}
          </Tabs>
        </div>

        {showAds && (
          <div className="hidden lg:block">
            <AdDisplay 
              size="sidebar"
              placement={AdPlacement.MATCH_SIDEBAR}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Matches;
