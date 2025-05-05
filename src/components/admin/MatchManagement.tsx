
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Match } from '@/utils/match/matchTypes';
import { useAuth } from '@/hooks/useAuth';
import { MatchEditor } from './MatchEditor';
import { MatchTable } from './matches/MatchTable';
import { MatchActions } from './matches/MatchActions';
import { EmptyMatchState } from './matches/EmptyMatchState';
import { MatchLoadingState } from './matches/MatchLoadingState';

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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Match Management</CardTitle>
        <MatchActions onCreateMatch={handleCreateMatch} />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <MatchLoadingState />
        ) : matches.length > 0 ? (
          <MatchTable 
            matches={matches} 
            onEditMatch={handleEditMatch} 
            onCancelMatch={handleCancelMatch} 
          />
        ) : (
          <EmptyMatchState />
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
