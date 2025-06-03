
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Users, Plus, X } from 'lucide-react';

interface TeamMember {
  id: string;
  user_id: string;
  joined_at: string;
}

interface Team {
  id: string;
  name: string;
  created_by: string;
  members: TeamMember[];
}

interface TeamFormationProps {
  matchId: string;
  onTeamCreated?: (teamId: string) => void;
}

export const TeamFormation = ({ matchId, onTeamCreated }: TeamFormationProps) => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamName, setTeamName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTeams();
  }, [matchId]);

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          created_by,
          team_members (
            id,
            user_id,
            joined_at
          )
        `)
        .eq('match_id', matchId);

      if (error) throw error;
      
      // Map the data to match our Team interface
      const formattedTeams: Team[] = (data || []).map(team => ({
        id: team.id,
        name: team.name,
        created_by: team.created_by,
        members: team.team_members || []
      }));
      
      setTeams(formattedTeams);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const createTeam = async () => {
    if (!user?.id || !teamName.trim()) return;

    setLoading(true);
    try {
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: teamName,
          match_id: matchId,
          created_by: user.id
        })
        .select()
        .single();

      if (teamError) throw teamError;

      // Add creator as team member
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: team.id,
          user_id: user.id
        });

      if (memberError) throw memberError;

      toast.success('Team created successfully!');
      setTeamName('');
      fetchTeams();
      if (onTeamCreated) onTeamCreated(team.id);
    } catch (error) {
      console.error('Error creating team:', error);
      toast.error('Failed to create team');
    } finally {
      setLoading(false);
    }
  };

  const joinTeam = async (teamId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: user.id
        });

      if (error) throw error;

      toast.success('Joined team successfully!');
      fetchTeams();
    } catch (error) {
      console.error('Error joining team:', error);
      toast.error('Failed to join team');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Team Formation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Create Team Section */}
        <div className="space-y-3">
          <Label htmlFor="teamName">Create New Team</Label>
          <div className="flex gap-2">
            <Input
              id="teamName"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Enter team name"
              className="flex-1"
            />
            <Button onClick={createTeam} disabled={loading || !teamName.trim()}>
              <Plus className="w-4 h-4 mr-1" />
              Create
            </Button>
          </div>
        </div>

        {/* Available Teams */}
        <div className="space-y-3">
          <Label>Available Teams</Label>
          {teams.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">
              No teams created yet
            </div>
          ) : (
            <div className="space-y-2">
              {teams.map((team) => (
                <div key={team.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">{team.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {team.members.length} members
                      </p>
                    </div>
                    {!team.members.some(member => member.user_id === user?.id) ? (
                      <Button
                        size="sm"
                        onClick={() => joinTeam(team.id)}
                        disabled={team.members.length >= 2}
                      >
                        Join
                      </Button>
                    ) : (
                      <span className="text-green-600 text-sm">Joined</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
