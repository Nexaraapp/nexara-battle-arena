
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { MatchType, QueueStats } from '@/utils/match/matchTypes';
import { getAllQueueStats, getPlayFabMatchmakingStats } from '@/utils/match';
import { MatchActions } from './matches/MatchActions';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, Users } from 'lucide-react';

export const MatchManagement = () => {
  const [queueStats, setQueueStats] = useState<QueueStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [overallStats, setOverallStats] = useState<any>(null);

  useEffect(() => {
    fetchMatchmakingStats();
  }, []);

  const fetchMatchmakingStats = async () => {
    setIsLoading(true);
    try {
      // Fetch PlayFab matchmaking queue statistics
      const stats = await getAllQueueStats();
      setQueueStats(stats);
      
      // Fetch overall statistics
      const overall = await getPlayFabMatchmakingStats();
      setOverallStats(overall);
    } catch (error) {
      console.error("Error fetching matchmaking stats:", error);
      toast.error("Failed to load matchmaking statistics");
    } finally {
      setIsLoading(false);
    }
  };

  const getQueueTypeLabel = (queueName: string): string => {
    switch (queueName) {
      case MatchType.OneVsOne:
        return '1v1 Match';
      case MatchType.FourVsFour:
        return '4v4 Team Match';
      case MatchType.BattleRoyale:
        return 'Battle Royale (26-50)';
      default:
        return queueName;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Matchmaking Management</CardTitle>
        <MatchActions />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-nexara-accent/10 rounded-lg p-4">
          <h3 className="font-semibold mb-2">PlayFab Integration</h3>
          <p className="text-sm text-gray-400 mb-4">
            Match generation has been replaced with real-time PlayFab matchmaking.
            Configure queue settings and rules through the PlayFab developer portal.
          </p>
          <Button 
            onClick={() => window.open('https://docs.microsoft.com/en-us/gaming/playfab/features/multiplayer/matchmaking/', '_blank')}
            variant="outline" 
            size="sm"
          >
            Learn More
          </Button>
        </div>
        
        <h3 className="font-semibold">Queue Statistics</h3>
        
        {isLoading ? (
          <div className="h-20 flex items-center justify-center">
            <p className="text-sm text-gray-400">Loading statistics...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {queueStats.map((queue) => (
              <Card key={queue.queueName} className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{getQueueTypeLabel(queue.queueName)}</h4>
                    <span className={`text-xs px-2 py-1 rounded ${
                      queue.isActive 
                        ? 'bg-green-900/40 text-green-400' 
                        : 'bg-gray-800/40 text-gray-400'
                    }`}>
                      {queue.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-gray-400" />
                      <span>{queue.playersInQueue} players</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ArrowUpDown className="h-3 w-3 text-gray-400" />
                      <span>~{queue.estimatedWaitTime}s wait</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
