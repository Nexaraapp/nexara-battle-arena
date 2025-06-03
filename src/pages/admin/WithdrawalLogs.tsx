
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign } from 'lucide-react';

const WithdrawalLogs = () => {
  const { data: withdrawals, isLoading } = useQuery({
    queryKey: ['all-withdrawals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      approved: 'default',
      rejected: 'destructive'
    } as const;
    
    return <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>{status}</Badge>;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-6 h-6" />
            All Withdrawal Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading withdrawals...</p>
          ) : (
            <div className="space-y-4">
              {withdrawals?.map((withdrawal) => (
                <div key={withdrawal.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">₹{withdrawal.amount}</p>
                      <p className="text-sm text-muted-foreground">
                        User ID: {withdrawal.user_id}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(withdrawal.created_at).toLocaleString()}
                      </p>
                      {withdrawal.upi_id && (
                        <p className="text-sm">UPI: {withdrawal.upi_id}</p>
                      )}
                      {withdrawal.public_notes && (
                        <p className="text-sm mt-2">{withdrawal.public_notes}</p>
                      )}
                    </div>
                    <div className="text-right">
                      {getStatusBadge(withdrawal.status)}
                      {withdrawal.processed_at && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Processed: {new Date(withdrawal.processed_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WithdrawalLogs;
