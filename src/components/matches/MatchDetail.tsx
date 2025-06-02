
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Trophy, Users, Clock, Coins, Calendar, MapPin } from 'lucide-react';
import { MatchJoinWidget } from './MatchJoinWidget';

interface Match {
  id: string;
  title: string;
  description?: string;
  type: string;
  mode: string;
  entry_fee: number;
  prize: number;
  start_time?: string;
  coins_per_kill: number;
  status: string;
  slots: number;
  slots_filled: number;
  first_prize?: number;
  second_prize?: number;
  third_prize?: number;
  room_id?: string;
  room_password?: string;
  room_type?: string;
}

export const MatchDetail = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (matchId) {
      fetchMatch();
      
      // Set up real-time subscription for this specific match
      const channel = supabase
        .channel(`match-${matchId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'matches',
            filter: `id=eq.${matchId}`
          },
          () => {
            fetchMatch();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [matchId]);

  const fetchMatch = async () => {
    if (!matchId) return;

    try {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single();

      if (error) throw error;
      setMatch(data);
    } catch (error) {
      console.error('Error fetching match:', error);
      toast.error('Failed to load match details');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSuccess = () => {
    fetchMatch(); // Refresh match data after successful join
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-600">Match not found</h2>
        <p className="text-gray-500 mt-2">The match you're looking for doesn't exist.</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{match.title}</CardTitle>
              {match.description && (
                <p className="text-muted-foreground mt-2">{match.description}</p>
              )}
            </div>
            <Badge className={getStatusColor(match.status)}>
              {match.status.replace('_', ' ')}
            </Badge>
          </div>
          <div className="flex gap-2 mt-4">
            <Badge variant="outline">{match.type}</Badge>
            <Badge variant={match.mode === 'battle_royale' ? 'default' : 'secondary'}>
              {match.mode === 'battle_royale' ? 'Battle Royale' : 'Clash Squad'}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Match Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-yellow-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Entry Fee</p>
                  <p className="font-medium">{match.entry_fee} coins</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Prize</p>
                  <p className="font-medium">{match.prize} coins</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Players</p>
                  <p className="font-medium">{match.slots_filled}/{match.slots}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Per Kill</p>
                  <p className="font-medium">{match.coins_per_kill} coins</p>
                </div>
              </div>
              
              {match.start_time && (
                <div className="col-span-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-orange-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Start Time</p>
                    <p className="font-medium">{formatDate(match.start_time)}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Prize Distribution */}
          {(match.first_prize || match.second_prize || match.third_prize) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Prize Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {match.first_prize && (
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <span className="font-medium text-yellow-800">🥇 1st Place</span>
                    <span className="font-bold text-yellow-800">{match.first_prize} coins</span>
                  </div>
                )}
                {match.second_prize && (
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <span className="font-medium text-gray-800">🥈 2nd Place</span>
                    <span className="font-bold text-gray-800">{match.second_prize} coins</span>
                  </div>
                )}
                {match.third_prize && (
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <span className="font-medium text-orange-800">🥉 3rd Place</span>
                    <span className="font-bold text-orange-800">{match.third_prize} coins</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Room Details */}
          {match.room_id && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Room Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Room ID</p>
                    <p className="font-mono font-medium">{match.room_id}</p>
                  </div>
                  {match.room_password && (
                    <div>
                      <p className="text-sm text-muted-foreground">Password</p>
                      <p className="font-mono font-medium">{match.room_password}</p>
                    </div>
                  )}
                  {match.room_type && (
                    <div>
                      <p className="text-sm text-muted-foreground">Room Type</p>
                      <p className="font-medium">{match.room_type}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <MatchJoinWidget match={match} onJoinSuccess={handleJoinSuccess} />
        </div>
      </div>
    </div>
  );
};
