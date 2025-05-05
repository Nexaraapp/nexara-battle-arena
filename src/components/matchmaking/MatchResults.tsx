
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { submitMatchResults } from '@/utils/match/playerMatchOperations';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface MatchResultsProps {
  matchId: string;
  userId: string;
  onComplete?: () => void;
}

export const MatchResults = ({
  matchId,
  userId,
  onComplete
}: MatchResultsProps) => {
  const [isWinner, setIsWinner] = useState(false);
  const [score, setScore] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitResults = async () => {
    setIsSubmitting(true);
    try {
      const success = await submitMatchResults(matchId, userId, isWinner, score);
      
      if (success) {
        toast.success("Match results submitted successfully");
        if (onComplete) onComplete();
      } else {
        toast.error("Failed to submit match results");
      }
    } catch (error) {
      console.error("Error submitting match results:", error);
      toast.error("Failed to submit match results");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-2 border-nexara-accent">
      <CardHeader>
        <CardTitle className="text-center">Match Results</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium">Your score:</label>
          <Input
            type="number"
            min="0"
            value={score}
            onChange={(e) => setScore(parseInt(e.target.value) || 0)}
            placeholder="Enter your score"
          />
        </div>
        
        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium">Match result:</label>
          <div className="flex gap-2">
            <Button
              variant={isWinner ? "default" : "outline"}
              className={isWinner ? "bg-green-600 hover:bg-green-700" : ""}
              onClick={() => setIsWinner(true)}
            >
              I Won
            </Button>
            <Button
              variant={!isWinner ? "default" : "outline"}
              className={!isWinner ? "bg-red-600 hover:bg-red-700" : ""}
              onClick={() => setIsWinner(false)}
            >
              I Lost
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col">
        <Button
          className="w-full"
          disabled={isSubmitting}
          onClick={handleSubmitResults}
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
        <p className="text-xs text-gray-400 mt-2 text-center">
          Please report your results honestly. Dishonest reporting may lead to account suspension.
        </p>
      </CardFooter>
    </Card>
  );
};
