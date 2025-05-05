
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
import { configureMatchmakingRules, getPlayFabMatchmakingStats } from '@/utils/match/adminMatchOperations';

export const MatchActions = () => {
  const refreshMatchmakingStats = async () => {
    try {
      await getPlayFabMatchmakingStats();
      toast.success("Matchmaking statistics refreshed");
    } catch (error) {
      console.error("Error refreshing matchmaking stats:", error);
      toast.error("Failed to refresh matchmaking statistics");
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
      <Button variant="outline" onClick={refreshMatchmakingStats}>
        <RefreshCw className="mr-2 h-4 w-4" />
        Refresh Stats
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
