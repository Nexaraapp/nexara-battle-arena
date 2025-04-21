
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Filter, Trophy, Clock } from "lucide-react";
import { toast } from "sonner";

const Matches = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const matches = [
    {
      id: 1,
      type: "battle-royale",
      name: "Battle Royale #124",
      time: "17:30 Today",
      entryFee: 45,
      prizePool: 480,
      players: "48/48",
      status: "full"
    },
    {
      id: 2,
      type: "battle-royale",
      name: "Battle Royale #125",
      time: "19:00 Today",
      entryFee: 40,
      prizePool: 420,
      players: "32/48",
      status: "joinable"
    },
    {
      id: 3,
      type: "battle-royale",
      name: "Battle Royale #126",
      time: "21:00 Today",
      entryFee: 35,
      prizePool: 380,
      players: "12/48",
      status: "joinable"
    },
    {
      id: 4,
      type: "clash-squad",
      name: "Clash Squad Solo #87",
      time: "18:15 Today",
      entryFee: 25,
      prizePool: 45,
      players: "1/2",
      status: "joinable"
    },
    {
      id: 5,
      type: "clash-squad",
      name: "Clash Squad Solo #88",
      time: "19:30 Today",
      entryFee: 25,
      prizePool: 45,
      players: "0/2",
      status: "joinable"
    },
    {
      id: 6,
      type: "clash-squad",
      name: "Clash Squad Duo #42",
      time: "20:30 Today",
      entryFee: 55,
      prizePool: 90,
      players: "2/4",
      status: "joinable"
    },
  ];

  const filteredMatches = matches.filter(match => {
    // Filter by tab selection
    if (activeTab !== "all" && match.type !== activeTab) return false;
    
    // Filter by search query
    if (searchQuery && !match.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
    return true;
  });

  const handleJoinMatch = (matchId: number) => {
    // This would be connected to Supabase in a real implementation
    toast.success(`Joining match #${matchId}. Your entry fee will be deducted.`);
  };

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

      <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-muted mb-4 grid w-full grid-cols-3">
          <TabsTrigger value="all">All Matches</TabsTrigger>
          <TabsTrigger value="battle-royale">Battle Royale</TabsTrigger>
          <TabsTrigger value="clash-squad">Clash Squad</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="mt-0">
          {filteredMatches.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredMatches.map((match) => (
                <Card key={match.id} className="game-card overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex items-center">
                      <div 
                        className={`w-1 self-stretch ${
                          match.type === "battle-royale" 
                            ? "bg-nexara-accent" 
                            : "bg-nexara-highlight"
                        }`} 
                      />
                      <div className="p-4 flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-sm text-gray-400">
                            <Clock size={14} className="mr-1" />
                            {match.time}
                          </div>
                          <div className={`text-xs px-2 py-1 rounded ${
                            match.status === 'joinable' 
                              ? 'bg-green-900/40 text-green-400' 
                              : 'bg-gray-800/40 text-gray-400'
                          }`}>
                            {match.status === 'joinable' ? 'Joinable' : 'Full'}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <h3 className="text-lg font-bold">{match.name}</h3>
                          {match.type === "battle-royale" && (
                            <Trophy size={16} className="text-nexara-accent" />
                          )}
                        </div>
                        <div className="flex mt-2 text-sm">
                          <div className="pr-3 border-r border-nexara-accent/30">
                            <div className="text-gray-400">Entry</div>
                            <div className="font-semibold">{match.entryFee} coins</div>
                          </div>
                          <div className="px-3 border-r border-nexara-accent/30">
                            <div className="text-gray-400">Prize</div>
                            <div className="font-semibold">{match.prizePool} coins</div>
                          </div>
                          <div className="px-3">
                            <div className="text-gray-400">Players</div>
                            <div className="font-semibold">{match.players}</div>
                          </div>
                        </div>
                      </div>
                      <div className="h-full flex items-center justify-center p-4">
                        <Button 
                          className={`game-button h-10 px-3 ${
                            match.status !== 'joinable' ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          disabled={match.status !== 'joinable'}
                          onClick={() => match.status === 'joinable' && handleJoinMatch(match.id)}
                        >
                          Join
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="mx-auto bg-nexara-accent/10 rounded-full w-12 h-12 flex items-center justify-center mb-3">
                <Trophy className="text-nexara-accent h-6 w-6" />
              </div>
              <h3 className="text-lg font-medium">No matches found</h3>
              <p className="text-gray-400 mt-1">Try adjusting your filters or check back later.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Matches;
