
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Clock, User, Calendar, Image } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TopUpRequest {
  id: string;
  user_id: string;
  amount: number;
  payment_method?: string;
  screenshot_url?: string;
  status: string;
  created_at: string;
  processed_by?: string;
  processed_at?: string;
  admin_notes?: string;
}

export const TopUpRequestsManagement = () => {
  const [requests, setRequests] = useState<TopUpRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchRequests();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('topup-requests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'topup_requests'
        },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('topup_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching top-up requests:', error);
      toast.error('Failed to load top-up requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    setProcessing(`approve-${requestId}`);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const request = requests.find(r => r.id === requestId);
      if (!request) throw new Error('Request not found');

      // Create transaction for approved top-up
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: request.user_id,
          type: 'topup',
          amount: request.amount,
          status: 'completed',
          notes: `Top-up approved: ${adminNotes[requestId] || 'No notes'}`,
          admin_id: user.id,
          is_real_coins: true
        });

      if (transactionError) throw transactionError;

      // Update request status
      const { error: updateError } = await supabase
        .from('topup_requests')
        .update({
          status: 'approved',
          admin_notes: adminNotes[requestId],
          processed_by: user.id,
          processed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Create notification
      await supabase.from('notifications').insert({
        user_id: request.user_id,
        message: `Your top-up request of ${request.amount} coins has been approved!`
      });

      toast.success('Top-up request approved successfully');
      setAdminNotes(prev => ({ ...prev, [requestId]: '' }));
    } catch (error) {
      console.error('Error approving top-up request:', error);
      toast.error('Failed to approve top-up request');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setProcessing(`reject-${requestId}`);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const request = requests.find(r => r.id === requestId);
      if (!request) throw new Error('Request not found');

      // Update request status
      const { error } = await supabase
        .from('topup_requests')
        .update({
          status: 'rejected',
          admin_notes: adminNotes[requestId] || 'Request rejected',
          processed_by: user.id,
          processed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      // Create notification
      await supabase.from('notifications').insert({
        user_id: request.user_id,
        message: `Your top-up request has been rejected. Reason: ${adminNotes[requestId] || 'Please contact support for details'}`
      });

      toast.success('Top-up request rejected');
      setAdminNotes(prev => ({ ...prev, [requestId]: '' }));
    } catch (error) {
      console.error('Error rejecting top-up request:', error);
      toast.error('Failed to reject top-up request');
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
    return <div className="text-center py-8">Loading top-up requests...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Top-Up Requests</h2>
        <Badge variant="outline" className="text-blue-600">
          {requests.filter(r => r.status === 'pending').length} Pending
        </Badge>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">No top-up requests found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span className="font-medium">User ID: {request.user_id.substring(0, 8)}...</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  {getStatusBadge(request.status)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="font-bold text-lg">{request.amount} coins</p>
                  </div>
                  {request.payment_method && (
                    <div>
                      <p className="text-sm text-muted-foreground">Payment Method</p>
                      <p className="font-medium">{request.payment_method}</p>
                    </div>
                  )}
                  {request.screenshot_url && (
                    <div>
                      <p className="text-sm text-muted-foreground">Screenshot</p>
                      <a 
                        href={request.screenshot_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        <Image className="w-4 h-4" />
                        View Payment Proof
                      </a>
                    </div>
                  )}
                </div>

                {request.admin_notes && (
                  <div className="mb-4 p-3 bg-muted rounded">
                    <p className="text-sm font-medium">Admin Notes:</p>
                    <p className="text-sm">{request.admin_notes}</p>
                  </div>
                )}

                {request.status === 'pending' && (
                  <div className="space-y-3">
                    <Textarea
                      placeholder="Add admin notes (optional)"
                      value={adminNotes[request.id] || ''}
                      onChange={(e) => setAdminNotes(prev => ({ ...prev, [request.id]: e.target.value }))}
                      className="min-h-[80px]"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApprove(request.id)}
                        disabled={processing === `approve-${request.id}`}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {processing === `approve-${request.id}` ? 'Approving...' : 'Approve & Add Coins'}
                      </Button>
                      <Button
                        onClick={() => handleReject(request.id)}
                        disabled={processing === `reject-${request.id}`}
                        variant="destructive"
                      >
                        {processing === `reject-${request.id}` ? 'Rejecting...' : 'Reject'}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
