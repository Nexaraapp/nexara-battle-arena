
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface EnhancedResultSubmissionProps {
  matchId: string;
  matchType: string;
  onSubmitSuccess?: () => void;
}

export const EnhancedResultSubmission = ({
  matchId,
  matchType,
  onSubmitSuccess
}: EnhancedResultSubmissionProps) => {
  const { user } = useAuth();
  const [kills, setKills] = useState<number>(0);
  const [placement, setPlacement] = useState<number>(1);
  const [teamName, setTeamName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user?.id) return;

    setIsSubmitting(true);
    try {
      // Submit result to match_results table
      const { error: resultError } = await supabase
        .from('match_results')
        .insert({
          match_id: matchId,
          user_id: user.id,
          kills,
          placement,
          admin_notes: notes,
          status: 'pending'
        });

      if (resultError) throw resultError;

      // Update match_entries with detailed info
      const { error: entryError } = await supabase
        .from('match_entries')
        .update({
          kills,
          placement,
          team_name: teamName || null,
          result_status: 'pending',
          submitted_at: new Date().toISOString()
        })
        .eq('match_id', matchId)
        .eq('user_id', user.id);

      if (entryError) throw entryError;

      // Create notification for admin
      await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          message: `Result submitted for match ${matchId}. Kills: ${kills}, Placement: ${placement}`,
        });

      toast.success('Results submitted successfully! Awaiting admin verification.');
      if (onSubmitSuccess) onSubmitSuccess();
    } catch (error) {
      console.error('Error submitting results:', error);
      toast.error('Failed to submit results. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Submit Match Results</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="kills">Kills</Label>
          <Input
            id="kills"
            type="number"
            min="0"
            value={kills}
            onChange={(e) => setKills(parseInt(e.target.value) || 0)}
            placeholder="Number of kills"
          />
        </div>

        <div>
          <Label htmlFor="placement">Final Placement</Label>
          <Input
            id="placement"
            type="number"
            min="1"
            value={placement}
            onChange={(e) => setPlacement(parseInt(e.target.value) || 1)}
            placeholder="Your final position"
          />
        </div>

        {matchType.includes('duo') && (
          <div>
            <Label htmlFor="teamName">Team Name</Label>
            <Input
              id="teamName"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Enter your team name"
            />
          </div>
        )}

        <div>
          <Label htmlFor="notes">Additional Notes (Optional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional information about the match"
            rows={3}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Results'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};
