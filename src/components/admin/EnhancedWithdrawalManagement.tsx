
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Clock, User, Calendar, Flag, Eye, EyeOff } from 'lucide-react';
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
  upi_id?: string;
  preferred_time_slot?: string;
  admin_tags?: string[];
  is_suspicious?: boolean;
  public_notes?: string;
  private_notes?: string;
}

export const EnhancedWithdrawalManagement = () => {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [publicNotes, setPublicNotes] = useState<Record<string, string>>({});
  const [privateNotes, setPrivateNotes] = useState<Record<string, string>>({});
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showPrivateNotes, setShowPrivateNotes] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchWithdrawals();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('withdrawals-admin-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'withdrawals'
        },
        () => {
          fetchWithdrawals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

      const { data, error } = await supabase.rpc('approve_withdrawal_v2', {
        withdrawal_id: withdrawalId,
        admin_id: user.id,
        public_note: publicNotes[withdrawalId] || null,
        private_note: privateNotes[withdrawalId] || null
      });

      if (error) throw error;

      if (data) {
        toast.success('Withdrawal approved successfully');
        await fetchWithdrawals();
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

      const { data, error } = await supabase.rpc('reject_withdrawal_v2', {
        withdrawal_id: withdrawalId,
        admin_id: user.id,
        public_note: publicNotes[withdrawalId] || 'Request rejected by admin',
        private_note: privateNotes[withdrawalId] || null
      });

      if (error) throw error;

      if (data) {
        toast.success('Withdrawal rejected');
        await fetchWithdrawals();
      }
    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
      toast.error('Failed to reject withdrawal');
    } finally {
      setProcessing(null);
    }
  };

  const updateTags = async (withdrawalId: number, newTags: string[]) => {
    try {
      const { error } = await supabase
        .from('withdrawals')
        .update({ admin_tags: newTags })
        .eq('id', withdrawalId);

      if (error) throw error;
      
      await fetchWithdrawals();
      toast.success('Tags updated');
    } catch (error) {
      console.error('Error updating tags:', error);
      toast.error('Failed to update tags');
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

  const getSmartTags = (withdrawal: Withdrawal): string[] => {
    const tags = ['New'];
    
    // Add more intelligent tagging logic here
    if (withdrawal.amount > 1000) tags.push('High Amount');
    if (withdrawal.is_suspicious) tags.push('Suspicious');
    if (withdrawal.preferred_time_slot) tags.push('Time Specific');
    
    return tags;
  };

  const filteredWithdrawals = withdrawals.filter(withdrawal => 
    filterStatus === 'all' || withdrawal.status === filterStatus
  );

  if (loading) {
    return <div className="flex justify-center p-8">Loading withdrawals...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Enhanced Withdrawal Management</h2>
        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchWithdrawals} variant="outline">
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredWithdrawals.map((withdrawal) => (
          <Card key={withdrawal.id} className={withdrawal.is_suspicious ? 'border-red-200 bg-red-50' : ''}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">
                  Withdrawal #{withdrawal.id}
                </CardTitle>
                <div className="flex gap-2 items-center">
                  {getStatusBadge(withdrawal.status)}
                  {withdrawal.is_suspicious && (
                    <Badge variant="destructive">
                      <Flag className="w-3 h-3 mr-1" />
                      Suspicious
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-1 flex-wrap">
                {(withdrawal.admin_tags || getSmartTags(withdrawal)).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span>User: {withdrawal.user_id.slice(0, 8)}...</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>{formatDistanceToNow(new Date(withdrawal.created_at), { addSuffix: true })}</span>
                </div>
                {withdrawal.upi_id && (
                  <div className="text-sm">
                    <strong>UPI:</strong> {withdrawal.upi_id}
                  </div>
                )}
              </div>
              
              <div className="text-2xl font-bold text-center py-2 bg-muted rounded">
                {withdrawal.amount} Coins
              </div>

              {withdrawal.preferred_time_slot && (
                <div className="bg-blue-50 p-2 rounded text-sm">
                  <strong>Preferred Time:</strong> {withdrawal.preferred_time_slot}
                </div>
              )}

              {withdrawal.public_notes && (
                <div className="bg-green-50 p-3 rounded">
                  <p className="text-sm"><strong>Public Note:</strong> {withdrawal.public_notes}</p>
                </div>
              )}

              {withdrawal.private_notes && (
                <div className="bg-yellow-50 p-3 rounded">
                  <div className="flex justify-between items-center">
                    <p className="text-sm"><strong>Private Note:</strong></p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPrivateNotes(prev => ({
                        ...prev,
                        [withdrawal.id]: !prev[withdrawal.id]
                      }))}
                    >
                      {showPrivateNotes[withdrawal.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  {showPrivateNotes[withdrawal.id] && (
                    <p className="text-sm mt-1">{withdrawal.private_notes}</p>
                  )}
                </div>
              )}

              {withdrawal.status === 'pending' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium">Public Note (visible to user)</label>
                      <Textarea
                        placeholder="Add public note..."
                        value={publicNotes[withdrawal.id] || ''}
                        onChange={(e) => setPublicNotes(prev => ({
                          ...prev,
                          [withdrawal.id]: e.target.value
                        }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Private Note (admin only)</label>
                      <Textarea
                        placeholder="Add private note..."
                        value={privateNotes[withdrawal.id] || ''}
                        onChange={(e) => setPrivateNotes(prev => ({
                          ...prev,
                          [withdrawal.id]: e.target.value
                        }))}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  
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

        {filteredWithdrawals.length === 0 && (
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
