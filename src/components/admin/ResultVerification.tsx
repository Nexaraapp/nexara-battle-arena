
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Check, X } from 'lucide-react';

interface PendingResult {
  id: string;
  match_id: string;
  user_id: string;
  kills: number;
  placement: number;
  admin_notes?: string;
  created_at: string;
  matches?: {
    title: string;
    type: string;
  };
}

export const ResultVerification = () => {
  const { user } = useAuth();
  const [pendingResults, setPendingResults] = useState<PendingResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchPendingResults();
  }, []);

  const fetchPendingResults = async () => {
    try {
      const { data, error } = await supabase
        .from('match_results')
        .select(`
          *,
          matches (
            title,
            type
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingResults(data || []);
    } catch (error) {
      console.error('Error fetching pending results:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyResult = async (resultId: string, action: 'verify' | 'reject') => {
    if (!user?.id) return;

    setProcessingIds(prev => new Set(prev).add(resultId));
    
    try {
      const notes = adminNotes[resultId] || '';
      
      const { error } = await supabase
        .from('match_results')
        .update({
          status: action === 'verify' ? 'verified' : 'rejected',
          verified_by: user.id,
          verified_at: new Date().toISOString(),
          admin_notes: notes
        })
        .eq('id', resultId);

      if (error) throw error;

      // Create notification for user
      const result = pendingResults.find(r => r.id === resultId);
      if (result) {
        await supabase
          .from('notifications')
          .insert({
            user_id: result.user_id,
            message: `Your match result has been ${action === 'verify' ? 'verified' : 'rejected'}. ${notes ? 'Note: ' + notes : ''}`
          });
      }

      toast.success(`Result ${action === 'verify' ? 'verified' : 'rejected'} successfully`);
      fetchPendingResults();
    } catch (error) {
      console.error(`Error ${action}ing result:`, error);
      toast.error(`Failed to ${action} result`);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(resultId);
        return newSet;
      });
    }
  };

  if (loading) {
    return <div className="text-center">Loading pending results...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Result Verification</CardTitle>
      </CardHeader>
      <CardContent>
        {pendingResults.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No pending results to verify
          </div>
        ) : (
          <div className="space-y-4">
            {pendingResults.map((result) => (
              <div key={result.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{result.matches?.title || 'Unknown Match'}</h4>
                    <p className="text-sm text-muted-foreground">
                      Type: {result.matches?.type || 'Unknown'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Submitted: {new Date(result.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline">Pending</Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium">Kills</p>
                    <p className="text-lg">{result.kills}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Placement</p>
                    <p className="text-lg">#{result.placement}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">User ID</p>
                    <p className="text-sm text-muted-foreground">{result.user_id}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Admin Notes</label>
                  <Textarea
                    value={adminNotes[result.id] || ''}
                    onChange={(e) => setAdminNotes(prev => ({
                      ...prev,
                      [result.id]: e.target.value
                    }))}
                    placeholder="Add verification notes..."
                    rows={2}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleVerifyResult(result.id, 'verify')}
                    disabled={processingIds.has(result.id)}
                    className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
                  >
                    <Check className="w-4 h-4" />
                    Verify
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleVerifyResult(result.id, 'reject')}
                    disabled={processingIds.has(result.id)}
                    className="flex items-center gap-1"
                  >
                    <X className="w-4 h-4" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
