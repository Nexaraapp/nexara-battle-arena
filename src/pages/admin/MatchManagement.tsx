
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Search, Plus } from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MatchEditorButton } from '@/components/admin/MatchEditorButton';

export default function MatchManagementPage() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      fetchMatches();
    }
  }, [user]);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setMatches(data || []);
    } catch (error) {
      console.error("Error fetching matches:", error);
      toast.error("Failed to load matches");
    } finally {
      setLoading(false);
    }
  };

  const filteredMatches = matches.filter(match => 
    match.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    match.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    match.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
    match.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Match Management</h1>
          <p className="text-gray-400">Manage match details including room information</p>
        </div>
        <Button onClick={fetchMatches}>
          <Loader2 className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : 'hidden'}`} />
          Refresh
        </Button>
      </header>
      
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search matches..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Room Info</TableHead>
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMatches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No matches found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredMatches.map((match) => (
                  <TableRow key={match.id}>
                    <TableCell className="font-mono text-xs">
                      {match.id.substring(0, 8)}...
                    </TableCell>
                    <TableCell className="font-medium">
                      {match.title || `Match #${match.id.substring(0, 6)}`}
                    </TableCell>
                    <TableCell>
                      {match.type === 'one_vs_one' ? '1v1' : 
                       match.type === 'four_vs_four' ? '4v4' : 
                       'Battle Royale'}
                    </TableCell>
                    <TableCell>
                      <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        match.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                        match.status === 'active' ? 'bg-green-100 text-green-800' :
                        match.status === 'completed' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {match.status}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(match.created_at)}</TableCell>
                    <TableCell className="text-right">
                      {match.room_id ? (
                        <span className="text-xs">
                          ID: {match.room_id} / PW: {match.room_password || 'None'}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">Not set</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <MatchEditorButton matchId={match.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
