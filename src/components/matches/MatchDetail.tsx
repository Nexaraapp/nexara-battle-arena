
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Loader2, Trophy, Clock, Users, Coins, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface Match {
  id: string;
  title: string;
  description?: string;
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
  room_id?: string;
  room_password?: string;
}

export const MatchDetail = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (matchId) {
      fetchMatchDetails();
      
      // Set up real-time subscription for this specific match
      const channel = supabase
        .channel(`match-${matchId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'matches',
            filter: `id=eq.${matchId}`
          },
          () => {
            fetchMatchDetails();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [matchId]);

  const fetchMatchDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single();

      if (error) throw error;
      setMatch(data);
    } catch (error) {
      console.error('Error fetching match details:', error);
      toast.error('Failed to load match details');
    } finally {
      setLoading(false);
    }
  };

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

  const canShowRoomDetails = match?.status === 'in_progress' && match?.room_id && match?.room_password;

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
        <Button onClick={() => navigate('/matches')} className="mt-4">
          Back to Matches
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/matches')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Matches
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-bold">{match.title}</CardTitle>
              {match.description && (
                <p className="text-gray-600 mt-2">{match.description}</p>
              )}
            </div>
            <Badge className={getStatusColor(match.status)}>
              {match.status.replace('_', ' ')}
            </Badge>
          </div>
          <div className="flex gap-2 mt-4">
            <Badge variant="outline">{match.type}</Badge>
            {match.mode && <Badge variant="outline">{match.mode}</Badge>}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Match Details</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Coins className="h-4 w-4 text-yellow-600" />
                    Entry Fee
                  </span>
                  <span className="font-medium">{match.entry_fee} coins</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-green-600" />
                    Total Prize Pool
                  </span>
                  <span className="font-medium">{match.prize} coins</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    Players
                  </span>
                  <span className="font-medium">{match.slots_filled}/{match.slots}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-purple-600" />
                    Coins per Kill
                  </span>
                  <span className="font-medium">{match.coins_per_kill} coins</span>
                </div>
                {match.start_time && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-600" />
                      Start Time
                    </span>
                    <span className="font-medium">{formatDate(match.start_time)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Position Rewards</h3>
              <div className="space-y-3">
                {match.first_prize && (
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <span className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-yellow-600" />
                      1st Place
                    </span>
                    <span className="font-bold text-yellow-700">{match.first_prize} coins</span>
                  </div>
                )}
                {match.second_prize && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <span className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-gray-600" />
                      2nd Place
                    </span>
                    <span className="font-bold text-gray-700">{match.second_prize} coins</span>
                  </div>
                )}
                {match.third_prize && (
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <span className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-orange-600" />
                      3rd Place
                    </span>
                    <span className="font-bold text-orange-700">{match.third_prize} coins</span>
                  </div>
                )}
                {!match.first_prize && !match.second_prize && !match.third_prize && (
                  <p className="text-gray-500 text-center py-4">Winner takes all prize pool</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Room Information</h3>
            {canShowRoomDetails ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                <p className="text-green-800 font-medium">Match is live! Join using the details below:</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Room ID:</span>
                    <code className="bg-white px-2 py-1 rounded border text-sm">{match.room_id}</code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Password:</span>
                    <div className="flex items-center gap-2">
                      <code className="bg-white px-2 py-1 rounded border text-sm">
                        {showPassword ? match.room_password : '••••••••'}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800">
                  Room details will be shared before the match starts.
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <Button 
              className="flex-1"
              disabled={match.status !== 'upcoming'}
            >
              {match.status === 'upcoming' ? 'Join Match' : 'Match Started'}
            </Button>
            <Button variant="outline" onClick={() => navigate('/matches')}>
              Back to Matches
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
