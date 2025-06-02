
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { getUserWalletBalance } from '@/utils/transactionApi';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Clock, AlertCircle, Upload } from 'lucide-react';
import { getWithdrawalSettings, isWithdrawalTimeAllowed, formatTimeForDisplay } from '@/utils/withdrawalTimeApi';

export const WithdrawalRequestForm = () => {
  const { user } = useAuth();
  const [amount, setAmount] = useState<number>(0);
  const [upiId, setUpiId] = useState('');
  const [preferredTimeSlot, setPreferredTimeSlot] = useState('');
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [timeAllowed, setTimeAllowed] = useState(false);
  const [withdrawalSettings, setWithdrawalSettings] = useState<any>(null);

  useEffect(() => {
    if (user?.id) {
      fetchBalance();
      checkWithdrawalTime();
      fetchWithdrawalSettings();
    }
  }, [user]);

  const fetchBalance = async () => {
    if (!user?.id) return;
    const userBalance = await getUserWalletBalance(user.id);
    setBalance(userBalance);
  };

  const checkWithdrawalTime = async () => {
    const allowed = await isWithdrawalTimeAllowed();
    setTimeAllowed(allowed);
  };

  const fetchWithdrawalSettings = async () => {
    const settings = await getWithdrawalSettings();
    setWithdrawalSettings(settings);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || loading) return;

    if (!timeAllowed) {
      toast.error('Withdrawals can only be submitted between 6 PM and 10 PM');
      return;
    }

    if (amount <= 0) {
      toast.error('Please enter a valid withdrawal amount');
      return;
    }

    if (amount > balance) {
      toast.error('Insufficient balance');
      return;
    }

    if (!upiId.trim()) {
      toast.error('Please enter your UPI ID');
      return;
    }

    setLoading(true);

    try {
      // Check for existing pending withdrawals
      const { data: pendingWithdrawals, error: pendingError } = await supabase
        .from('withdrawals')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'pending');

      if (pendingError) throw pendingError;

      if (pendingWithdrawals && pendingWithdrawals.length > 0) {
        toast.error('You already have a pending withdrawal request');
        return;
      }

      // Create withdrawal request
      const { error: withdrawalError } = await supabase
        .from('withdrawals')
        .insert({
          user_id: user.id,
          amount,
          upi_id: upiId,
          preferred_time_slot: preferredTimeSlot || null,
          status: 'pending',
          admin_tags: ['New']
        });

      if (withdrawalError) throw withdrawalError;

      // Create pending transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'withdrawal',
          amount: -amount,
          status: 'pending',
          notes: `Withdrawal request to UPI: ${upiId}`,
          is_real_coins: true
        });

      if (transactionError) throw transactionError;

      toast.success('Withdrawal request submitted successfully');
      setAmount(0);
      setUpiId('');
      setPreferredTimeSlot('');
      fetchBalance();
    } catch (error) {
      console.error('Error submitting withdrawal:', error);
      toast.error('Failed to submit withdrawal request');
    } finally {
      setLoading(false);
    }
  };

  const timeSlots = [
    '6:00 PM - 7:00 PM',
    '7:00 PM - 8:00 PM',
    '8:00 PM - 9:00 PM',
    '9:00 PM - 10:00 PM'
  ];

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Request Withdrawal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Available Balance:</strong> {balance} coins
          </p>
          {withdrawalSettings && (
            <p className="text-xs text-blue-600 mt-1">
              Processing time: ~{withdrawalSettings.estimated_processing_hours} hours
            </p>
          )}
        </div>

        {!timeAllowed && (
          <div className="bg-red-50 p-3 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
            <div>
              <p className="text-sm text-red-800 font-medium">
                Withdrawals Not Available
              </p>
              <p className="text-xs text-red-600">
                {withdrawalSettings ? 
                  `Submit requests between ${formatTimeForDisplay(withdrawalSettings.start_time)} and ${formatTimeForDisplay(withdrawalSettings.end_time)}` :
                  'Submit requests between 6:00 PM and 10:00 PM'
                }
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="amount">Withdrawal Amount (Coins)</Label>
            <Input
              id="amount"
              type="number"
              value={amount || ''}
              onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
              max={balance}
              min={1}
              disabled={!timeAllowed || loading}
              placeholder="Enter amount"
            />
          </div>

          <div>
            <Label htmlFor="upiId">UPI ID</Label>
            <Input
              id="upiId"
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              disabled={!timeAllowed || loading}
              placeholder="your-upi@bank"
            />
          </div>

          <div>
            <Label htmlFor="timeSlot">Preferred Time Slot (Optional)</Label>
            <Select 
              value={preferredTimeSlot} 
              onValueChange={setPreferredTimeSlot}
              disabled={!timeAllowed || loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select preferred time" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((slot) => (
                  <SelectItem key={slot} value={slot}>
                    {slot}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={!timeAllowed || loading || amount <= 0 || !upiId.trim()}
          >
            {loading ? 'Submitting...' : 'Submit Withdrawal Request'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
