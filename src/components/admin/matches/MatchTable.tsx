
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Match } from '@/utils/match';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';

interface MatchTableProps {
  matches: Match[];
  onEditMatch: (match: Match) => void;
  onCancelMatch: (matchId: string) => void;
}

export const MatchTable = ({ matches, onEditMatch, onCancelMatch }: MatchTableProps) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="rounded-md border">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Start Time</TableHead>
              <TableHead className="text-center">Entry Fee</TableHead>
              <TableHead className="text-center">Players</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {matches.map((match) => (
              <TableRow key={match.id} className="hover:bg-muted/50">
                <TableCell>{match.title || match.type}</TableCell>
                <TableCell>{match.type}</TableCell>
                <TableCell>{formatDate(match.start_time)}</TableCell>
                <TableCell className="text-center">{match.entry_fee} coins</TableCell>
                <TableCell className="text-center">{match.slots_filled}/{match.slots}</TableCell>
                <TableCell className="text-center">
                  <span className={`inline-block px-2 py-1 rounded text-xs ${
                    match.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                    match.status === 'active' ? 'bg-green-100 text-green-800' :
                    match.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {match.status.toUpperCase()}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex justify-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => onEditMatch(match)}>
                      Edit
                    </Button>
                    {match.status !== 'cancelled' && match.status !== 'completed' && (
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => onCancelMatch(match.id)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
