
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Match } from '@/utils/matchTypes';
import { useAuth } from '@/hooks/useAuth';
import { DailyMatchGenerator } from './DailyMatchGenerator';
import { MatchEditor } from './MatchEditor';

export const MatchManagement = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchMatches();
    
    // Subscribe to match changes
    const matchChannel = supabase
      .channel('matches-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'matches' },
        () => fetchMatches()
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(matchChannel);
    };
  }, []);

  const fetchMatches = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .order('start_time', { ascending: true });
        
      if (error) {
        throw error;
      }
      
      setMatches(data || []);
    } catch (error) {
      console.error("Error fetching matches:", error);
      toast.error("Failed to load matches");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditMatch = (match: Match) => {
    setSelectedMatch(match);
    setIsEditorOpen(true);
  };

  const handleCreateMatch = () => {
    setSelectedMatch(null);
    setIsEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
  };

  const handleCancelMatch = async (matchId: string) => {
    if (!user) return;
    
    if (!window.confirm("Are you sure you want to cancel this match? All participants will be refunded.")) {
      return;
    }
    
    try {
      // Get match details first
      const { data: matchData, error: fetchError } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single();
        
      if (fetchError || !matchData) {
        console.error("Error fetching match:", fetchError);
        toast.error("Could not find match details");
        return;
      }
      
      // Update match status
      const { error: updateError } = await supabase
        .from('matches')
        .update({ status: 'cancelled' })
        .eq('id', matchId);
        
      if (updateError) {
        console.error("Error cancelling match:", updateError);
        toast.error("Failed to cancel match");
        return;
      }
      
      // Get all paid entries
      const { data: entries, error: entriesError } = await supabase
        .from('match_entries')
        .select('user_id')
        .eq('match_id', matchId)
        .eq('paid', true);
        
      if (entriesError) {
        console.error("Error fetching match entries:", entriesError);
        toast.error("Failed to process refunds");
        return;
      }
      
      // Refund all paid entries
      if (entries && entries.length > 0) {
        const refundTransactions = entries.map(entry => ({
          user_id: entry.user_id,
          amount: matchData.entry_fee, // Refund the entry fee
          type: 'refund',
          status: 'completed',
          match_id: matchId,
          date: new Date().toISOString().split('T')[0],
          notes: `Refund for cancelled match ${matchId}`
        }));
        
        const { error: refundError } = await supabase
          .from('transactions')
          .insert(refundTransactions);
          
        if (refundError) {
          console.error("Error processing refunds:", refundError);
          toast.error("Failed to process refunds");
          return;
        }
      }
      
      // Log the admin action
      await supabase
        .from('system_logs')
        .insert({
          admin_id: user.id,
          action: 'Match Cancelled',
          details: `Cancelled match ${matchId} and processed refunds for ${entries?.length || 0} participants`
        });
        
      toast.success("Match cancelled successfully");
      fetchMatches();
      
    } catch (error) {
      console.error("Error cancelling match:", error);
      toast.error("An unexpected error occurred");
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Match Management</CardTitle>
        <div className="flex gap-2">
          <DailyMatchGenerator />
          <Button onClick={handleCreateMatch}>
            <Plus className="mr-2 h-4 w-4" />
            New Match
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : matches.length > 0 ? (
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th className="px-4 py-3 text-left font-medium">Title</th>
                    <th className="px-4 py-3 text-left font-medium">Type</th>
                    <th className="px-4 py-3 text-left font-medium">Start Time</th>
                    <th className="px-4 py-3 text-center font-medium">Entry Fee</th>
                    <th className="px-4 py-3 text-center font-medium">Players</th>
                    <th className="px-4 py-3 text-center font-medium">Status</th>
                    <th className="px-4 py-3 text-center font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {matches.map((match) => (
                    <tr key={match.id} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-3">{match.title || match.type}</td>
                      <td className="px-4 py-3">{match.type}</td>
                      <td className="px-4 py-3">{formatDate(match.start_time)}</td>
                      <td className="px-4 py-3 text-center">{match.entry_fee} coins</td>
                      <td className="px-4 py-3 text-center">{match.slots_filled}/{match.slots}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-1 rounded text-xs ${
                          match.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                          match.status === 'active' ? 'bg-green-100 text-green-800' :
                          match.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {match.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditMatch(match)}>
                            Edit
                          </Button>
                          {match.status !== 'cancelled' && match.status !== 'completed' && (
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleCancelMatch(match.id)}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No matches found. Create a match or generate default matches.
          </div>
        )}
      </CardContent>
      
      <MatchEditor 
        match={selectedMatch} 
        isOpen={isEditorOpen} 
        onClose={handleCloseEditor} 
        onSave={fetchMatches}
      />
    </Card>
  );
};
