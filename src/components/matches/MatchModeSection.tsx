
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Sword, Shield, Trophy, Clock, Users, Coins } from 'lucide-react';

interface Match {
  id: string;
  title: string;
  type: string;
  mode: string;
  entry_fee: number;
  prize: number;
  start_time: string;
  coins_per_kill: number;
  status: string;
  slots: number;
  slots_filled: number;
  first_prize?: number;
  second_prize?: number;
  third_prize?: number;
}

export const MatchModeSection = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMatches();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('matches-mode-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches'
        },
        () => {
          fetchMatches();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMatches = async () => {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .in('status', ['upcoming', 'in_progress'])
        .order('start_time', { ascending: true });

      if (error) throw error;
      setMatches(data || []);
    } catch (error) {
      console.error('Error fetching matches:', error);
      toast.error('Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  const battleRoyaleMatches = matches.filter(match => match.mode === 'battle_royale');
  const clashSquadMatches = matches.filter(match => match.mode === 'clash_squad');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderMatchCard = (match: Match) => (
    <Card key={match.id} className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-bold">{match.title}</CardTitle>
          <Badge className={getStatusColor(match.status)}>
            {match.status.replace('_', ' ')}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline">{match.type}</Badge>
          <Badge variant={match.mode === 'battle_royale' ? 'default' : 'secondary'}>
            {match.mode === 'battle_royale' ? 'Battle Royale' : 'Clash Squad'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-yellow-600" />
            <span>Entry: {match.entry_fee} coins</span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-green-600" />
            <span>Prize: {match.prize} coins</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-600" />
            <span>{match.slots_filled}/{match.slots} players</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-purple-600" />
            <span>{match.coins_per_kill} per kill</span>
          </div>
        </div>

        {match.start_time && (
          <div className="text-sm text-gray-600">
            <Clock className="h-4 w-4 inline mr-1" />
            Starts: {formatDate(match.start_time)}
          </div>
        )}

        <Button 
          onClick={() => navigate(`/match/${match.id}`)}
          className="w-full"
          variant={match.status === 'in_progress' ? 'default' : 'outline'}
        >
          {match.status === 'in_progress' ? 'Join Now' : 'View Details'}
        </Button>
      </CardContent>
    </Card>
  );

  if (loading) {
    return <div className="text-center py-8">Loading matches...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Gaming Modes</h1>
        <p className="text-muted-foreground mt-2">
          Choose your battle: Battle Royale or Clash Squad
        </p>
      </div>

      <Tabs defaultValue="battle_royale" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="battle_royale" className="flex items-center gap-2">
            <Sword className="w-4 h-4" />
            Battle Royale ({battleRoyaleMatches.length})
          </TabsTrigger>
          <TabsTrigger value="clash_squad" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Clash Squad ({clashSquadMatches.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="battle_royale" className="space-y-6 mt-6">
          <div className="bg-gradient-to-r from-red-50 to-orange-50 p-4 rounded-lg border border-red-200">
            <h3 className="font-semibold text-red-800 flex items-center gap-2">
              <Sword className="w-5 h-5" />
              Battle Royale Mode
            </h3>
            <p className="text-sm text-red-700 mt-1">
              Large-scale battles with 26-50 players. Survive to win big prizes!
            </p>
          </div>

          {battleRoyaleMatches.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Sword className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600">No Battle Royale matches</h3>
                <p className="text-gray-500">Check back later for new matches!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {battleRoyaleMatches.map(renderMatchCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="clash_squad" className="space-y-6 mt-6">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-800 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Clash Squad Mode
            </h3>
            <p className="text-sm text-blue-700 mt-1">
              Tactical team battles. Winner takes all - only 1st place gets rewarded!
            </p>
          </div>

          {clashSquadMatches.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600">No Clash Squad matches</h3>
                <p className="text-gray-500">Check back later for new matches!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clashSquadMatches.map(renderMatchCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
