
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';

export const MatchActions = () => {
  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={() => window.open('https://developer.playfab.com/en-US/my-studios', '_blank')}>
        <Info className="mr-2 h-4 w-4" />
        PlayFab Dashboard
      </Button>
    </div>
  );
};
