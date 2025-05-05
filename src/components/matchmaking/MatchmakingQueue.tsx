
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Timer, Users } from 'lucide-react';
import { MatchType } from '@/utils/match/matchTypes';
import { joinMatchQueue } from '@/utils/match/playerMatchOperations';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface MatchmakingQueueProps {
  queueType: MatchType;
  title: string;
  players: number;
  entryFee: number;
  prize: number;
  estimatedWaitTime?: number;
  playersInQueue?: number;
}

export const MatchmakingQueue = ({
  queueType,
  title,
  players,
  entryFee,
  prize,
  estimatedWaitTime = 0,
  playersInQueue = 0
}: MatchmakingQueueProps) => {
  const [isJoining, setIsJoining] = useState(false);
  const { user } = useAuth();

  const handleJoinQueue = async () => {
    if (!user) {
      toast.error("Please login to join a match");
      return;
    }
    
    setIsJoining(true);
    try {
      await joinMatchQueue(queueType, user.id, entryFee);
      // In a real implementation, we would store the ticket ID and start polling
      // for match status
    } catch (error) {
      console.error("Error joining queue:", error);
      toast.error("Failed to join matchmaking queue");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <Card className="overflow-hidden border-2 border-nexara-accent/20 hover:border-nexara-accent/50 transition-all">
      <CardHeader className="bg-nexara-accent/10 pb-2">
        <CardTitle className="flex justify-between items-center">
          <span>{title}</span>
          <span className="text-sm font-normal bg-nexara-accent/20 px-2 py-1 rounded-md">
            {players} Players
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-400">Entry Fee</p>
            <p className="font-bold">{entryFee} coins</p>
          </div>
          <div>
            <p className="text-gray-400">Prize Pool</p>
            <p className="font-bold">{prize} coins</p>
          </div>
          <div className="flex items-center gap-2">
            <Timer size={14} />
            <span>~{estimatedWaitTime} sec wait</span>
          </div>
          <div className="flex items-center gap-2">
            <Users size={14} />
            <span>{playersInQueue} in queue</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-nexara-accent/5 pt-2">
        <Button 
          className="w-full bg-nexara-accent hover:bg-nexara-accent/90" 
          onClick={handleJoinQueue}
          disabled={isJoining}
        >
          {isJoining ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Finding Match...
            </>
          ) : (
            'Join Queue'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};
