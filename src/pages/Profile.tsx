
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { User, Trophy, Star, Gamepad, LogOut, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Profile = () => {
  const navigate = useNavigate();
  
  // Mock user data - would come from Supabase in a real implementation
  const userData = {
    name: "Player123",
    email: "player@example.com",
    joinedDate: "April 10, 2023",
    stats: {
      matchesPlayed: 48,
      wins: 12,
      winRate: "25%",
      totalEarnings: 1240,
    },
    achievements: [
      { id: 1, name: "First Victory", description: "Won your first tournament", date: "2023-04-12" },
      { id: 2, name: "Streak Master", description: "Won 3 tournaments in a row", date: "2023-04-15" },
      { id: 3, name: "Big Spender", description: "Participated in 25 tournaments", date: "2023-04-18" },
    ],
    recentMatches: [
      { id: 1, name: "Battle Royale #118", result: "Winner", earnings: 120, date: "2023-04-19" },
      { id: 2, name: "Clash Squad #76", result: "2nd Place", earnings: 40, date: "2023-04-18" },
      { id: 3, name: "Battle Royale #117", result: "12th Place", earnings: 0, date: "2023-04-17" },
      { id: 4, name: "Clash Squad #74", result: "Winner", earnings: 50, date: "2023-04-16" },
    ]
  };

  const handleLogout = () => {
    // Would use Supabase Auth in a real implementation
    toast.success("Logged out successfully");
    navigate("/login");
  };
  
  return (
    <div className="space-y-6">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">My Profile</h1>
          <p className="text-gray-400">View stats and manage your account</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" className="border-nexara-accent/20">
            <Settings size={18} />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            className="border-nexara-accent/20 hover:bg-red-900/20 hover:text-red-400"
            onClick={handleLogout}
          >
            <LogOut size={18} />
          </Button>
        </div>
      </header>

      <Card className="neon-border">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-nexara-accent/20 flex items-center justify-center neon-border">
                <User size={48} className="text-nexara-accent" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-nexara-neon text-white text-xs rounded-full w-8 h-8 flex items-center justify-center">
                Lv. 8
              </div>
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-bold">{userData.name}</h2>
              <p className="text-gray-400">{userData.email}</p>
              <p className="text-sm text-gray-500 mt-1">Member since {userData.joinedDate}</p>
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                <div className="flex items-center gap-1 text-yellow-500">
                  <Trophy size={14} />
                  <span className="text-xs">{userData.stats.wins} Wins</span>
                </div>
                <div className="flex items-center gap-1 text-nexara-accent">
                  <Star size={14} />
                  <span className="text-xs">{userData.stats.winRate} Win Rate</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="stats">
        <TabsList className="grid w-full grid-cols-3 bg-muted">
          <TabsTrigger value="stats">Stats</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="history">Match History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="stats" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Overall Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Matches Played</p>
                  <p className="text-2xl font-medium">{userData.stats.matchesPlayed}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Tournament Wins</p>
                  <p className="text-2xl font-medium">{userData.stats.wins}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Win Rate</p>
                  <p className="text-2xl font-medium">{userData.stats.winRate}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Total Earnings</p>
                  <p className="text-2xl font-medium">{userData.stats.totalEarnings} coins</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Game Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Battle Royale</span>
                    <span>80% Win Rate</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full">
                    <div className="h-2 bg-nexara-accent rounded-full" style={{ width: "80%" }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Clash Squad</span>
                    <span>65% Win Rate</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full">
                    <div className="h-2 bg-nexara-highlight rounded-full" style={{ width: "65%" }}></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="achievements" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Your Achievements</CardTitle>
              <CardDescription>Accomplishments you've earned</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userData.achievements.map((achievement) => (
                  <div 
                    key={achievement.id}
                    className="flex items-center gap-4 border-b border-gray-800 pb-4 last:border-0 last:pb-0"
                  >
                    <div className="w-12 h-12 rounded-full bg-nexara-accent/20 flex items-center justify-center neon-border">
                      <Trophy className="text-nexara-accent h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{achievement.name}</h3>
                      <p className="text-sm text-gray-400">{achievement.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Unlocked on {new Date(achievement.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Recent Matches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userData.recentMatches.map((match) => (
                  <div 
                    key={match.id}
                    className="flex items-center justify-between border-b border-gray-800 pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center
                        ${match.result === 'Winner' ? 'bg-green-900/20' : 'bg-gray-800'}
                      `}>
                        <Gamepad className={`h-5 w-5 ${
                          match.result === 'Winner' ? 'text-green-500' : 'text-gray-400'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium">{match.name}</p>
                        <p className="text-sm text-gray-400">
                          {new Date(match.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${
                        match.result === 'Winner' ? 'text-green-500' : 'text-gray-300'
                      }`}>
                        {match.result}
                      </p>
                      <p className="text-sm text-gray-400">
                        {match.earnings > 0 ? `+${match.earnings} coins` : '-'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;
