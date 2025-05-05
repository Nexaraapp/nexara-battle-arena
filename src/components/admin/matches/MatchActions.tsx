
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { DailyMatchGenerator } from '../DailyMatchGenerator';

interface MatchActionsProps {
  onCreateMatch: () => void;
}

export const MatchActions = ({ onCreateMatch }: MatchActionsProps) => {
  return (
    <div className="flex gap-2">
      <DailyMatchGenerator />
      <Button onClick={onCreateMatch}>
        <Plus className="mr-2 h-4 w-4" />
        New Match
      </Button>
    </div>
  );
};
