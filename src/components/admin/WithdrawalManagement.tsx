
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Clock, User, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Withdrawal {
  id: number;
  user_id: string;
  amount: number;
  status: string;
  created_at: string;
  admin_note?: string;
  processed_by?: string;
  processed_at?: string;
}

export const WithdrawalManagement = () => {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWithdrawals(data || []);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      toast.error('Failed to load withdrawals');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (withdrawalId: number) => {
    setProcessing(`approve-${withdrawalId}`);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('approve_withdrawal', {
        withdrawal_id: withdrawalId,
        admin_id: user.id,
        admin_note: adminNotes[withdrawalId] || null
      });

      if (error) throw error;

      if (data) {
        toast.success('Withdrawal approved successfully');
        await fetchWithdrawals();
        
        // Add notification to user
        const withdrawal = withdrawals.find(w => w.id === withdrawalId);
        if (withdrawal) {
          await supabase.from('notifications').insert({
            user_id: withdrawal.user_id,
            message: `Your withdrawal of ${withdrawal.amount} coins has been approved and processed.`
          });
        }
      } else {
        toast.error('Failed to approve withdrawal. Check user balance.');
      }
    } catch (error) {
      console.error('Error approving withdrawal:', error);
      toast.error('Failed to approve withdrawal');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (withdrawalId: number) => {
    setProcessing(`reject-${withdrawalId}`);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('reject_withdrawal', {
        withdrawal_id: withdrawalId,
        admin_id: user.id,
        admin_note: adminNotes[withdrawalId] || 'Request rejected by admin'
      });

      if (error) throw error;

      if (data) {
        toast.success('Withdrawal rejected');
        await fetchWithdrawals();
        
        // Add notification to user
        const withdrawal = withdrawals.find(w => w.id === withdrawalId);
        if (withdrawal) {
          await supabase.from('notifications').insert({
            user_id: withdrawal.user_id,
            message: `Your withdrawal request has been rejected. Reason: ${adminNotes[withdrawalId] || 'No specific reason provided'}`
          });
        }
      }
    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
      toast.error('Failed to reject withdrawal');
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-green-600"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-600"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading withdrawals...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Withdrawal Management</h2>
        <Button onClick={fetchWithdrawals} variant="outline">
          Refresh
        </Button>
      </div>

      <div className="grid gap-4">
        {withdrawals.map((withdrawal) => (
          <Card key={withdrawal.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">
                  Withdrawal #{withdrawal.id}
                </CardTitle>
                {getStatusBadge(withdrawal.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">User: {withdrawal.user_id.slice(0, 8)}...</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    {formatDistanceToNow(new Date(withdrawal.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
              
              <div className="text-2xl font-bold text-center py-2">
                {withdrawal.amount} Coins
              </div>

              {withdrawal.admin_note && (
                <div className="bg-muted p-3 rounded">
                  <p className="text-sm"><strong>Admin Note:</strong> {withdrawal.admin_note}</p>
                </div>
              )}

              {withdrawal.status === 'pending' && (
                <div className="space-y-3">
                  <Textarea
                    placeholder="Add admin note (optional)"
                    value={adminNotes[withdrawal.id] || ''}
                    onChange={(e) => setAdminNotes(prev => ({
                      ...prev,
                      [withdrawal.id]: e.target.value
                    }))}
                  />
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleApprove(withdrawal.id)}
                      disabled={processing === `approve-${withdrawal.id}`}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {processing === `approve-${withdrawal.id}` ? 'Processing...' : 'Approve'}
                    </Button>
                    <Button
                      onClick={() => handleReject(withdrawal.id)}
                      disabled={processing === `reject-${withdrawal.id}`}
                      variant="destructive"
                      className="flex-1"
                    >
                      {processing === `reject-${withdrawal.id}` ? 'Processing...' : 'Reject'}
                    </Button>
                  </div>
                </div>
              )}

              {withdrawal.processed_at && (
                <div className="text-sm text-muted-foreground">
                  Processed: {formatDistanceToNow(new Date(withdrawal.processed_at), { addSuffix: true })}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {withdrawals.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No withdrawal requests found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
