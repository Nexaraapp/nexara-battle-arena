
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Users, Plus, Trash2 } from 'lucide-react';

interface Team {
  id: string;
  name: string;
  created_by: string;
  members: TeamMember[];
}

interface TeamMember {
  id: string;
  user_id: string;
  joined_at: string;
}

interface TeamFormationProps {
  matchId: string;
  onTeamCreated?: (teamId: string) => void;
}

export const TeamFormation = ({ matchId, onTeamCreated }: TeamFormationProps) => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchUserTeams();
    }
  }, [user?.id, matchId]);

  const fetchUserTeams = async () => {
    if (!user?.id) return;

    try {
      const { data: teamsData, error } = await supabase
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
        .eq('match_id', matchId)
        .eq('created_by', user.id);

      if (error) throw error;
      setTeams(teamsData || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const createTeam = async () => {
    if (!user?.id || !newTeamName.trim()) return;

    setIsCreating(true);
    try {
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: newTeamName.trim(),
          match_id: matchId,
          created_by: user.id
        })
        .select()
        .single();

      if (teamError) throw teamError;

      // Add creator as first team member
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: teamData.id,
          user_id: user.id
        });

      if (memberError) throw memberError;

      toast.success('Team created successfully!');
      setNewTeamName('');
      setShowCreateForm(false);
      fetchUserTeams();
      
      if (onTeamCreated) {
        onTeamCreated(teamData.id);
      }
    } catch (error) {
      console.error('Error creating team:', error);
      toast.error('Failed to create team');
    } finally {
      setIsCreating(false);
    }
  };

  const deleteTeam = async (teamId: string) => {
    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (error) throw error;
      
      toast.success('Team deleted successfully');
      fetchUserTeams();
    } catch (error) {
      console.error('Error deleting team:', error);
      toast.error('Failed to delete team');
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
        {!showCreateForm ? (
          <Button
            onClick={() => setShowCreateForm(true)}
            className="w-full flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create New Team
          </Button>
        ) : (
          <div className="space-y-3">
            <div>
              <Label htmlFor="teamName">Team Name</Label>
              <Input
                id="teamName"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="Enter team name"
                maxLength={50}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={createTeam}
                disabled={isCreating || !newTeamName.trim()}
                className="flex-1"
              >
                {isCreating ? 'Creating...' : 'Create Team'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewTeamName('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {teams.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Your Teams</h4>
            {teams.map((team) => (
              <div
                key={team.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{team.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {team.members?.length || 1} member(s)
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteTeam(team.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
