
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Info, Settings, BarChart3, RefreshCw, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { getPlayFabMatchmakingStats } from '@/utils/match/adminMatchOperations';
import PlayFabClient from '@/integrations/playfab/client';
import { useState } from 'react';

export const MatchActions = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshMatchmakingStats = async () => {
    try {
      setIsRefreshing(true);
      
      // Refresh stats for all queues
      const queueTypes = ["one_vs_one", "four_vs_four", "battle_royale_26_50"];
      const results = await Promise.all(
        queueTypes.map(queue => PlayFabClient.getMatchmakingStats(queue))
      );
      
      const allSuccessful = results.every(r => r.success);
      
      if (allSuccessful) {
        toast.success("Matchmaking statistics refreshed");
      } else {
        toast.error("Some queue statistics could not be refreshed");
      }
      
      // Also get the overall matchmaking stats
      await getPlayFabMatchmakingStats();
    } catch (error) {
      console.error("Error refreshing matchmaking stats:", error);
      toast.error("Failed to refresh matchmaking statistics");
    } finally {
      setIsRefreshing(false);
    }
  };

  const openPlayFabDashboard = () => {
    window.open('https://developer.playfab.com/en-US/my-studios', '_blank');
  };
  
  const openMatchmakingConfig = () => {
    window.open('https://developer.playfab.com/en-US/toolsets/matchmaking-ruleset', '_blank');
  };
  
  const openPlayFabAnalytics = () => {
    window.open('https://developer.playfab.com/en-US/toolsets/analytics', '_blank');
  };

  return (
    <div className="flex gap-2">
      <Button 
        variant="outline" 
        onClick={refreshMatchmakingStats}
        disabled={isRefreshing}
      >
        <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        {isRefreshing ? 'Refreshing...' : 'Refresh Stats'}
      </Button>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            PlayFab <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>PlayFab Tools</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={openPlayFabDashboard}>
              <Info className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={openMatchmakingConfig}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Matchmaking Config</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={openPlayFabAnalytics}>
              <BarChart3 className="mr-2 h-4 w-4" />
              <span>Analytics</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
