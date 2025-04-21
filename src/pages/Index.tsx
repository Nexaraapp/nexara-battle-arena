
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Gamepad, Trophy, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const [activeTab, setActiveTab] = useState("battle-royale");
  
  const upcomingMatches = [
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
      type: "clash-squad",
      name: "Clash Squad Solo #87",
      time: "18:15 Today",
      entryFee: 25,
      prizePool: 45,
      players: "1/2",
      status: "joinable"
    },
    {
      id: 4,
      type: "clash-squad",
      name: "Clash Squad Duo #42",
      time: "20:30 Today",
      entryFee: 55,
      prizePool: 90,
      players: "2/4",
      status: "joinable"
    },
  ];

  const filteredMatches = upcomingMatches.filter(match => 
    activeTab === "all" || match.type.includes(activeTab)
  );

  return (
    <div className="space-y-8">
      {/* Hero Section */}
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

      {/* Stats Section */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-nexara-bg rounded-lg p-4 text-center neon-border">
          <div className="text-nexara-accent mb-2">
            <Trophy size={24} className="mx-auto" />
          </div>
          <div className="text-2xl font-bold">24</div>
          <div className="text-xs text-gray-400">Active Tournaments</div>
        </div>
        
        <div className="bg-nexara-bg rounded-lg p-4 text-center neon-border">
          <div className="text-nexara-highlight mb-2">
            <Gamepad size={24} className="mx-auto" />
          </div>
          <div className="text-2xl font-bold">127</div>
          <div className="text-xs text-gray-400">Players Online</div>
        </div>
        
        <div className="bg-nexara-bg rounded-lg p-4 text-center neon-border">
          <div className="text-nexara-warning mb-2">
            <Star size={24} className="mx-auto" />
          </div>
          <div className="text-2xl font-bold">₹12,450</div>
          <div className="text-xs text-gray-400">Prize Pool Today</div>
        </div>
        
        <div className="bg-nexara-bg rounded-lg p-4 text-center neon-border">
          <div className="text-nexara-info mb-2">
            <Gamepad size={24} className="mx-auto" />
          </div>
          <div className="text-2xl font-bold">2</div>
          <div className="text-xs text-gray-400">Games Available</div>
        </div>
      </section>

      {/* Upcoming Matches Section */}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMatches.map((match) => (
                <Card key={match.id} className="game-card overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex items-center">
                      <div className="p-4 flex-1">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-400">{match.time}</div>
                          <div className={`text-xs px-2 py-1 rounded ${
                            match.status === 'joinable' 
                              ? 'bg-green-900/40 text-green-400' 
                              : 'bg-gray-800/40 text-gray-400'
                          }`}>
                            {match.status === 'joinable' ? 'Joinable' : 'Full'}
                          </div>
                        </div>
                        <h3 className="text-lg font-bold mt-1">{match.name}</h3>
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
                          className="game-button h-10 px-3"
                          disabled={match.status !== 'joinable'}
                        >
                          Join
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </section>

      {/* CTA Section */}
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
