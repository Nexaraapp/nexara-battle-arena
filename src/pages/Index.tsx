
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Gamepad, Trophy, Star, ArrowRight, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DatabaseMatch, joinMatch } from "@/utils/matchUtils";

const Index = () => {
  const [activeTab, setActiveTab] = useState("battle-royale");
  const [matches, setMatches] = useState<DatabaseMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    activeTournaments: 0,
    playersOnline: 0,
    prizePool: 0,
    gamesAvailable: 2
  });
  const [userId, setUserId] = useState<string | null>(null);
  
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        setUserId(data.session.user.id);
      }
    };
    
    checkAuth();
    fetchMatches();
    fetchStats();
    
    const channel = supabase
      .channel('public:matches')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'matches' },
        () => {
          fetchMatches();
          fetchStats();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  const fetchMatches = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .in('status', ['upcoming', 'active'])
        .order('created_at', { ascending: false })
        .limit(4);
        
      if (error) {
        console.error("Error fetching matches:", error);
        toast.error("Failed to load matches");
        setMatches([]);
      } else {
        setMatches(data as DatabaseMatch[] || []);
      }
    } catch (error) {
      console.error("Error in fetchMatches:", error);
      setMatches([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchStats = async () => {
    try {
      const { count: activeTournaments, error: tournamentsError } = await supabase
        .from('matches')
        .select('id', { count: 'exact' })
        .in('status', ['upcoming', 'active']);
        
      const { data: prizeData, error: prizeError } = await supabase
        .from('matches')
        .select('prize')
        .in('status', ['upcoming', 'active']);
      
      const { count: recentlyActive, error: activeError } = await supabase
        .from('match_entries')
        .select('user_id', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString());
      
      if (!tournamentsError && !prizeError && !activeError) {
        const totalPrizePool = (prizeData || []).reduce((sum, match) => sum + (match.prize || 0), 0);
        
        setStats({
          activeTournaments: activeTournaments || 0,
          playersOnline: recentlyActive || 0,
          prizePool: totalPrizePool,
          gamesAvailable: 2
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };
  
  const handleJoinMatch = async (matchId: string) => {
    if (!userId) {
      toast.error("Please log in to join a match");
      return;
    }
    
    const success = await joinMatch(matchId, userId);
    if (success) {
      fetchMatches();
    }
  };
  
  const filteredMatches = matches.filter(match => 
    activeTab === "all" || match.type.toLowerCase().includes(activeTab)
  );

  return (
    <div className="space-y-8">
      <section className="relative rounded-xl overflow-hidden bg-hero-pattern bg-cover bg-center h-56 flex items-center justify-center neon-border animate-pulse-neon">
        <div className="absolute inset-0 bg-nexara-bg/40 backdrop-blur-sm"></div>
        <div className="relative z-10 text-center px-4">
          <h1 className="text-3xl font-bold neon-text mb-2">
            Nexara Battle<span className="text-nexara-accent">Field</span>
          </h1>
          <p className="text-gray-300 mb-4">Compete, win, dominate. Join tournaments now!</p>
          <Button asChild className="game-button">
            <Link to="/matches">Join a Match</Link>
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-nexara-bg rounded-lg p-4 text-center neon-border">
          <div className="text-nexara-accent mb-2">
            <Trophy size={24} className="mx-auto" />
          </div>
          <div className="text-2xl font-bold">{stats.activeTournaments}</div>
          <div className="text-xs text-gray-400">Active Tournaments</div>
        </div>
        
        <div className="bg-nexara-bg rounded-lg p-4 text-center neon-border">
          <div className="text-nexara-highlight mb-2">
            <Gamepad size={24} className="mx-auto" />
          </div>
          <div className="text-2xl font-bold">{stats.playersOnline}</div>
          <div className="text-xs text-gray-400">Players Online</div>
        </div>
        
        <div className="bg-nexara-bg rounded-lg p-4 text-center neon-border">
          <div className="text-nexara-warning mb-2">
            <Star size={24} className="mx-auto" />
          </div>
          <div className="text-2xl font-bold">₹{stats.prizePool}</div>
          <div className="text-xs text-gray-400">Prize Pool Today</div>
        </div>
        
        <div className="bg-nexara-bg rounded-lg p-4 text-center neon-border">
          <div className="text-nexara-info mb-2">
            <Gamepad size={24} className="mx-auto" />
          </div>
          <div className="text-2xl font-bold">{stats.gamesAvailable}</div>
          <div className="text-xs text-gray-400">Games Available</div>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Upcoming Matches</h2>
          <Link 
            to="/matches"
            className="text-nexara-accent flex items-center text-sm hover:underline"
          >
            View All <ArrowRight size={14} className="ml-1" />
          </Link>
        </div>

        <Tabs defaultValue="battle-royale" onValueChange={setActiveTab}>
          <TabsList className="bg-muted mb-4 grid grid-cols-3">
            <TabsTrigger value="battle-royale">Battle Royale</TabsTrigger>
            <TabsTrigger value="clash-squad">Clash Squad</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-0">
            {isLoading ? (
              <div className="flex justify-center py-16">
                <Loader className="h-8 w-8 animate-spin text-nexara-accent" />
              </div>
            ) : filteredMatches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredMatches.map((match) => {
                  const isJoinable = match.slots_filled < match.slots && match.status === 'upcoming';
                  
                  return (
                    <Card key={match.id} className="game-card overflow-hidden">
                      <CardContent className="p-0">
                        <div className="flex items-center">
                          <div className="p-4 flex-1">
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-gray-400">
                                {match.start_time ? new Date(match.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Time TBD'}
                              </div>
                              <div className={`text-xs px-2 py-1 rounded ${
                                isJoinable
                                  ? 'bg-green-900/40 text-green-400' 
                                  : 'bg-gray-800/40 text-gray-400'
                              }`}>
                                {isJoinable ? 'Joinable' : 'Full'}
                              </div>
                            </div>
                            <h3 className="text-lg font-bold mt-1">
                              {match.type === 'BattleRoyale' && `Battle Royale`}
                              {match.type === 'ClashSolo' && `Clash Squad Solo`}
                              {match.type === 'ClashDuo' && `Clash Squad Duo`}
                            </h3>
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
                              disabled={!isJoinable}
                              onClick={() => isJoinable && handleJoinMatch(match.id)}
                            >
                              Join
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="overflow-hidden">
                <CardContent className="p-8 text-center">
                  <Trophy className="h-12 w-12 text-nexara-accent mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-bold">No matches available</h3>
                  <p className="text-gray-400 mt-2">
                    There are no upcoming matches in this category yet.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </section>

      <section className="bg-nexara-accent/10 rounded-xl p-6 text-center neon-border">
        <h2 className="text-xl font-bold mb-2">New Player? Get 10 Free Coins!</h2>
        <p className="text-gray-300 mb-4">Sign up now and receive 10 coins to join your first match!</p>
        <div className="flex gap-4 justify-center">
          <Button asChild variant="outline" className="border-nexara-accent hover:bg-nexara-accent/20">
            <Link to="/login">Login</Link>
          </Button>
          <Button asChild className="game-button">
            <Link to="/register">Register Now</Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
