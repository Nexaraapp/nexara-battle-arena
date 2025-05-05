
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Clock, X } from 'lucide-react';
import { MatchStatus } from '@/utils/match/matchTypes';
import { cancelMatchmaking, checkMatchmakingStatus } from '@/utils/match/playerMatchOperations';
import { toast } from 'sonner';

interface MatchmakingStatusProps {
  userId: string;
  ticketId: string;
  onMatchFound?: (matchId: string) => void;
  onCancel?: () => void;
}

export const MatchmakingStatus = ({
  userId,
  ticketId,
  onMatchFound,
  onCancel
}: MatchmakingStatusProps) => {
  const [status, setStatus] = useState<MatchStatus>(MatchStatus.Queued);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    const statusChecker = setInterval(async () => {
      try {
        const result = await checkMatchmakingStatus(userId, ticketId);
        setStatus(result.status);
        
        if (result.status === MatchStatus.InProgress && result.matchId) {
          if (onMatchFound) onMatchFound(result.matchId);
          clearInterval(statusChecker);
          clearInterval(timer);
        } else if (
          result.status === MatchStatus.Cancelled || 
          result.status === MatchStatus.TimedOut
        ) {
          if (onCancel) onCancel();
          clearInterval(statusChecker);
          clearInterval(timer);
          
          if (result.status === MatchStatus.TimedOut) {
            toast.error("Matchmaking timed out. Please try again.");
          }
        }
      } catch (error) {
        console.error("Error checking match status:", error);
      }
    }, 5000);
    
    return () => {
      clearInterval(timer);
      clearInterval(statusChecker);
    };
  }, [userId, ticketId, onMatchFound, onCancel]);

  const handleCancel = async () => {
    setIsLoading(true);
    try {
      await cancelMatchmaking(userId, ticketId);
      if (onCancel) onCancel();
    } catch (error) {
      console.error("Error cancelling matchmaking:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="border-2 border-nexara-accent">
      <CardHeader className="pb-2">
        <CardTitle className="text-center">Finding Match</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <div className="flex justify-center py-6">
          <Loader2 className="h-16 w-16 animate-spin text-nexara-accent" />
        </div>
        
        <div className="flex items-center justify-center gap-2">
          <Clock className="h-4 w-4" />
          <span>{formatTime(elapsedTime)}</span>
        </div>
        
        <p className="text-sm text-gray-400">
          Looking for players with similar skill...
        </p>
        
        <Button 
          variant="outline" 
          onClick={handleCancel}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Cancelling...
            </>
          ) : (
            <>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
