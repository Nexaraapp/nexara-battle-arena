
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Check, X, RefreshCw, AlertTriangle, Clock } from 'lucide-react';

interface WithdrawalRequest {
  id: number;
  user_id: string;
  amount: number;
  status: string;
  created_at: string;
  upi_id?: string;
  qr_url?: string;
  preferred_time_slot?: string;
  public_notes?: string;
  private_notes?: string;
  auto_tags: string[];
  admin_tags: string[];
}

export const EnhancedWithdrawalManagement = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());
  const [adminNotes, setAdminNotes] = useState<Record<number, string>>({});
  const [privateNotes, setPrivateNotes] = useState<Record<number, string>>({});

  useEffect(() => {
    fetchWithdrawalRequests();
    
    // Set up real-time subscription for new withdrawal requests
    const channel = supabase
      .channel('withdrawal-requests')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'withdrawals'
        },
        (payload) => {
          console.log('New withdrawal request:', payload);
          toast.success('New withdrawal request received!');
          fetchWithdrawalRequests();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'withdrawals'
        },
        () => {
          fetchWithdrawalRequests();
        }
      )
      .subscribe();

    // Refresh every 10 seconds as backup
    const interval = setInterval(fetchWithdrawalRequests, 10000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const fetchWithdrawalRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Fetched withdrawal requests:', data);
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching withdrawal requests:', error);
      toast.error('Failed to load withdrawal requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveWithdrawal = async (requestId: number) => {
    if (!user?.id) return;

    setProcessingIds(prev => new Set(prev).add(requestId));
    
    try {
      const publicNote = adminNotes[requestId] || '';
      const privateNote = privateNotes[requestId] || '';

      const { data, error } = await supabase.rpc('approve_withdrawal_v2', {
        withdrawal_id: requestId,
        admin_id: user.id,
        public_note: publicNote || null,
        private_note: privateNote || null
      });

      if (error) throw error;

      toast.success('Withdrawal approved successfully');
      fetchWithdrawalRequests();
    } catch (error) {
      console.error('Error approving withdrawal:', error);
      toast.error('Failed to approve withdrawal');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleRejectWithdrawal = async (requestId: number) => {
    if (!user?.id) return;

    setProcessingIds(prev => new Set(prev).add(requestId));
    
    try {
      const publicNote = adminNotes[requestId] || 'Request rejected';
      const privateNote = privateNotes[requestId] || '';

      const { data, error } = await supabase.rpc('reject_withdrawal_v2', {
        withdrawal_id: requestId,
        admin_id: user.id,
        public_note: publicNote,
        private_note: privateNote || null
      });

      if (error) throw error;

      toast.success('Withdrawal rejected');
      fetchWithdrawalRequests();
    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
      toast.error('Failed to reject withdrawal');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading withdrawal requests...</div>
        </CardContent>
      </Card>
    );
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const processedRequests = requests.filter(r => r.status !== 'pending');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Withdrawal Management
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-yellow-600">
              {pendingRequests.length} Pending
            </Badge>
            <Button 
              onClick={fetchWithdrawalRequests}
              variant="outline" 
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No pending withdrawal requests
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">Request #{request.id}</h4>
                      <p className="text-sm text-muted-foreground">
                        Amount: ₹{request.amount} | User: {request.user_id.substring(0, 8)}...
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {formatDate(request.created_at)}
                      </p>
                    </div>
                    <Badge className={getStatusColor(request.status)}>
                      {request.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>UPI ID:</strong> {request.upi_id || 'Not provided'}</p>
                      {request.qr_url && (
                        <p><strong>QR URL:</strong> 
                          <a href={request.qr_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 ml-1">
                            View QR
                          </a>
                        </p>
                      )}
                    </div>
                    <div>
                      {request.preferred_time_slot && (
                        <p><strong>Preferred Time:</strong> {request.preferred_time_slot}</p>
                      )}
                      {request.auto_tags.length > 0 && (
                        <div>
                          <strong>Auto Tags:</strong>
                          <div className="flex gap-1 mt-1">
                            {request.auto_tags.map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="text-sm font-medium">Public Note (visible to user)</label>
                      <Textarea
                        value={adminNotes[request.id] || ''}
                        onChange={(e) => setAdminNotes(prev => ({
                          ...prev,
                          [request.id]: e.target.value
                        }))}
                        placeholder="Add public note..."
                        rows={2}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Private Note (admin only)</label>
                      <Textarea
                        value={privateNotes[request.id] || ''}
                        onChange={(e) => setPrivateNotes(prev => ({
                          ...prev,
                          [request.id]: e.target.value
                        }))}
                        placeholder="Add private note..."
                        rows={2}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleApproveWithdrawal(request.id)}
                      disabled={processingIds.has(request.id)}
                      className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
                    >
                      <Check className="w-4 h-4" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleRejectWithdrawal(request.id)}
                      disabled={processingIds.has(request.id)}
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

      {processedRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Processed Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {processedRequests.slice(0, 10).map((request) => (
                <div key={request.id} className="flex justify-between items-center p-2 border rounded">
                  <span className="text-sm">
                    #{request.id} - ₹{request.amount} - {formatDate(request.created_at)}
                  </span>
                  <Badge className={getStatusColor(request.status)}>
                    {request.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
