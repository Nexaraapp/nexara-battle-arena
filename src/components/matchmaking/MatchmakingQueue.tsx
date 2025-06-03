
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Trophy, Clock, Coins } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getUserWalletBalance } from '@/utils/transactionApi';
import { toast } from 'sonner';
import { joinMatchmakingQueue } from '@/utils/match/matchmakingOperations';
import { MatchType } from '@/utils/match/matchTypes';

interface MatchmakingQueueProps {
  queueType: MatchType;
  title: string;
  players: number;
  entryFee: number;
  prize: number;
  estimatedWaitTime: number;
  playersInQueue: number;
  onJoinQueue: (ticketId: string) => void;
}

export const MatchmakingQueue: React.FC<MatchmakingQueueProps> = ({
  queueType,
  title,
  players,
  entryFee,
  prize,
  estimatedWaitTime,
  playersInQueue,
  onJoinQueue
}) => {
  const { user } = useAuth();
  const [isJoining, setIsJoining] = useState(false);

  const handleJoinQueue = async () => {
    if (!user?.id) {
      toast.error('Please login to join matchmaking');
      return;
    }

    setIsJoining(true);
    try {
      // Check user balance
      const balance = await getUserWalletBalance(user.id);
      if (balance < entryFee) {
        toast.error('Insufficient balance to join this match');
        return;
      }

      // Join queue immediately without any skill-based delays
      const ticketId = await joinMatchmakingQueue(user.id, queueType, {
        entryFee,
        prize
      });

      onJoinQueue(ticketId);
      toast.success('Joined matchmaking queue!');
      
    } catch (error) {
      console.error('Error joining queue:', error);
      toast.error('Failed to join queue. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-xs">
            {queueType}
          </Badge>
          <Badge 
            variant={playersInQueue > 0 ? "default" : "secondary"} 
            className="text-xs"
          >
            {playersInQueue} in queue
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span>{players} players</span>
          </div>
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-yellow-600" />
            <span>{entryFee} coins</span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-green-600" />
            <span>{prize} prize</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-600" />
            <span>~{estimatedWaitTime}s</span>
          </div>
        </div>

        <Button
          onClick={handleJoinQueue}
          disabled={isJoining || !user}
          className="w-full"
        >
          {isJoining ? 'Joining...' : `Join Queue (${entryFee} coins)`}
        </Button>
      </CardContent>
    </Card>
  );
};
