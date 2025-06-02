
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Clock, Filter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface WithdrawalHistory {
  id: number;
  amount: number;
  status: string;
  created_at: string;
  processed_at?: string;
  upi_id?: string;
  public_notes?: string;
  preferred_time_slot?: string;
}

export const WithdrawalHistory = () => {
  const { user } = useAuth();
  const [withdrawals, setWithdrawals] = useState<WithdrawalHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (user?.id) {
      fetchWithdrawals();
    }
  }, [user]);

  const fetchWithdrawals = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWithdrawals(data || []);
    } catch (error) {
      console.error('Error fetching withdrawal history:', error);
    } finally {
      setLoading(false);
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

  const filteredWithdrawals = withdrawals.filter(withdrawal => 
    statusFilter === 'all' || withdrawal.status === statusFilter
  );

  if (loading) {
    return <div className="text-center py-8">Loading withdrawal history...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Withdrawal History</h3>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredWithdrawals.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No withdrawal history found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredWithdrawals.map((withdrawal) => (
            <Card key={withdrawal.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium">{withdrawal.amount} coins</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(withdrawal.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  {getStatusBadge(withdrawal.status)}
                </div>
                
                {withdrawal.upi_id && (
                  <p className="text-sm text-muted-foreground">
                    <strong>UPI:</strong> {withdrawal.upi_id}
                  </p>
                )}
                
                {withdrawal.preferred_time_slot && (
                  <p className="text-sm text-muted-foreground">
                    <strong>Preferred Time:</strong> {withdrawal.preferred_time_slot}
                  </p>
                )}
                
                {withdrawal.public_notes && (
                  <div className="mt-2 p-2 bg-muted rounded text-sm">
                    <strong>Note:</strong> {withdrawal.public_notes}
                  </div>
                )}
                
                {withdrawal.processed_at && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Processed: {formatDistanceToNow(new Date(withdrawal.processed_at), { addSuffix: true })}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
