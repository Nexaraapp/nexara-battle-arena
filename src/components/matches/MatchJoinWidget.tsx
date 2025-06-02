
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { getUserWalletBalance } from '@/utils/transactionApi';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Coins, Users, Trophy, Gamepad2 } from 'lucide-react';

interface Match {
  id: string;
  title: string;
  entry_fee: number;
  prize: number;
  slots: number;
  slots_filled: number;
  type: string;
  mode: string;
  status: string;
}

interface MatchJoinWidgetProps {
  match: Match;
  onJoinSuccess?: () => void;
}

export const MatchJoinWidget: React.FC<MatchJoinWidgetProps> = ({ match, onJoinSuccess }) => {
  const { user } = useAuth();
  const [ign, setIgn] = useState('');
  const [joining, setJoining] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);

  React.useEffect(() => {
    if (user?.id) {
      checkBalance();
    }
  }, [user]);

  const checkBalance = async () => {
    if (!user?.id) return;
    const userBalance = await getUserWalletBalance(user.id);
    setBalance(userBalance);
  };

  const handleJoinMatch = async () => {
    if (!user?.id || joining) return;

    if (!ign.trim()) {
      toast.error('Please enter your In-Game Name');
      return;
    }

    if (balance === null || balance < match.entry_fee) {
      toast.error('Insufficient balance to join this match');
      return;
    }

    setJoining(true);

    try {
      // Check if user already joined this match
      const { data: existingEntry, error: checkError } = await supabase
        .from('match_entries')
        .select('id')
        .eq('match_id', match.id)
        .eq('user_id', user.id)
        .single();

      if (existingEntry) {
        toast.error('You have already joined this match');
        return;
      }

      // Check if match is full
      if (match.slots_filled >= match.slots) {
        toast.error('Match is full');
        return;
      }

      // Create match entry with IGN
      const { error: entryError } = await supabase
        .from('match_entries')
        .insert({
          match_id: match.id,
          user_id: user.id,
          ign: ign.trim(),
          slot_number: match.slots_filled + 1,
          paid: true
        });

      if (entryError) throw entryError;

      // Deduct entry fee from wallet
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'match_entry',
          amount: -match.entry_fee,
          status: 'completed',
          match_id: match.id,
          notes: `Entry fee for ${match.title} - IGN: ${ign.trim()}`,
          is_real_coins: true
        });

      if (transactionError) throw transactionError;

      // Update match slots
      const { error: updateError } = await supabase
        .from('matches')
        .update({ slots_filled: match.slots_filled + 1 })
        .eq('id', match.id);

      if (updateError) throw updateError;

      toast.success(`Successfully joined ${match.title}!`);
      setIgn('');
      checkBalance();
      onJoinSuccess?.();
    } catch (error) {
      console.error('Error joining match:', error);
      toast.error('Failed to join match. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  const canJoin = match.status === 'upcoming' && match.slots_filled < match.slots;
  const hasBalance = balance !== null && balance >= match.entry_fee;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gamepad2 className="w-5 h-5" />
          Join Match
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-yellow-600" />
            <span>Entry: {match.entry_fee} coins</span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-green-600" />
            <span>Prize: {match.prize} coins</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span>{match.slots_filled}/{match.slots} players</span>
          </div>
          <div>
            <Badge variant={match.mode === 'battle_royale' ? 'default' : 'secondary'}>
              {match.mode === 'battle_royale' ? 'Battle Royale' : 'Clash Squad'}
            </Badge>
          </div>
        </div>

        {balance !== null && (
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm">
              <strong>Your Balance:</strong> {balance} coins
            </p>
            {!hasBalance && (
              <p className="text-xs text-red-600 mt-1">
                Insufficient balance. Need {match.entry_fee - balance} more coins.
              </p>
            )}
          </div>
        )}

        {canJoin ? (
          <div className="space-y-3">
            <div>
              <Label htmlFor="ign">In-Game Name (IGN)</Label>
              <Input
                id="ign"
                value={ign}
                onChange={(e) => setIgn(e.target.value)}
                placeholder="Enter your IGN"
                disabled={joining || !hasBalance}
              />
            </div>
            <Button
              onClick={handleJoinMatch}
              disabled={joining || !ign.trim() || !hasBalance}
              className="w-full"
            >
              {joining ? 'Joining...' : `Join Match (${match.entry_fee} coins)`}
            </Button>
          </div>
        ) : (
          <div className="text-center py-4">
            {match.status === 'in_progress' ? (
              <Badge variant="outline" className="text-green-600">
                Match In Progress
              </Badge>
            ) : match.slots_filled >= match.slots ? (
              <Badge variant="outline" className="text-red-600">
                Match Full
              </Badge>
            ) : (
              <Badge variant="outline">
                {match.status}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
