
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import MatchDetailsEditor from './matches/MatchDetailsEditor';

interface MatchEditorButtonProps {
  matchId: string;
}

export function MatchEditorButton({ matchId }: MatchEditorButtonProps) {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsEditorOpen(true)}
        className="h-8 w-8 p-0"
      >
        <Edit className="h-4 w-4" />
        <span className="sr-only">Edit</span>
      </Button>
      
      {isEditorOpen && (
        <MatchDetailsEditor
          matchId={matchId}
          open={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
        />
      )}
    </>
  );
}
