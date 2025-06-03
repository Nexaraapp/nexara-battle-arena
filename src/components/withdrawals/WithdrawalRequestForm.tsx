
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Loader2, Clock, AlertCircle } from 'lucide-react';
import { getUserWalletBalance } from '@/utils/transactionApi';

interface WithdrawalTier {
  id: number;
  coins: number;
  amount: number;
}

export const WithdrawalRequestForm = () => {
  const { user } = useAuth();
  const [tiers, setTiers] = useState<WithdrawalTier[]>([]);
  const [selectedTier, setSelectedTier] = useState<WithdrawalTier | null>(null);
  const [upiId, setUpiId] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [preferredTimeSlot, setPreferredTimeSlot] = useState('');
  const [balance, setBalance] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isWithdrawalTimeAllowed, setIsWithdrawalTimeAllowed] = useState(false);

  useEffect(() => {
    if (user) {
      fetchWithdrawalTiers();
      fetchUserBalance();
    }
    checkWithdrawalTime();
    
    // Check withdrawal time every minute
    const interval = setInterval(checkWithdrawalTime, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const checkWithdrawalTime = () => {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Allow withdrawals between 18:00 (6 PM) and 22:00 (10 PM)
    const isAllowed = currentHour >= 18 && currentHour < 22;
    setIsWithdrawalTimeAllowed(isAllowed);
    
    console.log('Current hour:', currentHour, 'Withdrawal allowed:', isAllowed);
  };

  const fetchWithdrawalTiers = async () => {
    try {
      const { data, error } = await supabase
        .from('withdrawal_tiers')
        .select('*')
        .order('coins', { ascending: true });

      if (error) throw error;
      setTiers(data || []);
    } catch (error) {
      console.error('Error fetching withdrawal tiers:', error);
      toast.error('Failed to load withdrawal options');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserBalance = async () => {
    if (!user?.id) return;
    try {
      const userBalance = await getUserWalletBalance(user.id);
      setBalance(userBalance);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id || !selectedTier) return;

    if (!isWithdrawalTimeAllowed) {
      toast.error('Withdrawals are only allowed between 6:00 PM and 10:00 PM');
      return;
    }

    if (!upiId.trim()) {
      toast.error('Please enter your UPI ID');
      return;
    }

    if (balance < selectedTier.coins) {
      toast.error('Insufficient balance for this withdrawal');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('withdrawals')
        .insert({
          user_id: user.id,
          amount: selectedTier.amount,
          upi_id: upiId.trim(),
          qr_url: qrUrl.trim() || null,
          preferred_time_slot: preferredTimeSlot || null,
          status: 'pending'
        });

      if (error) throw error;

      toast.success('Withdrawal request submitted successfully!');
      
      // Reset form
      setSelectedTier(null);
      setUpiId('');
      setQrUrl('');
      setPreferredTimeSlot('');
      fetchUserBalance();
      
    } catch (error) {
      console.error('Error submitting withdrawal:', error);
      toast.error('Failed to submit withdrawal request');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const getCurrentTimeInfo = () => {
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    if (isWithdrawalTimeAllowed) {
      return `Current time: ${currentTime} - Withdrawals are open`;
    } else {
      return `Current time: ${currentTime} - Withdrawals allowed 18:00-22:00`;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Request Withdrawal
        </CardTitle>
        <div className={`flex items-center gap-2 text-sm ${
          isWithdrawalTimeAllowed ? 'text-green-600' : 'text-red-600'
        }`}>
          <AlertCircle className="w-4 h-4" />
          {getCurrentTimeInfo()}
        </div>
      </CardHeader>
      <CardContent>
        {!isWithdrawalTimeAllowed ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Withdrawal Window Closed</h3>
            <p className="text-muted-foreground mb-4">
              Withdrawals are only available between 6:00 PM and 10:00 PM daily.
            </p>
            <p className="text-sm text-muted-foreground">
              Please return during the allowed time window.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-medium">Current Balance: {balance} coins</p>
            </div>

            <div>
              <Label htmlFor="tier">Withdrawal Amount</Label>
              <Select onValueChange={(value) => {
                const tier = tiers.find(t => t.id.toString() === value);
                setSelectedTier(tier || null);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select withdrawal amount" />
                </SelectTrigger>
                <SelectContent>
                  {tiers.map((tier) => (
                    <SelectItem 
                      key={tier.id} 
                      value={tier.id.toString()}
                      disabled={balance < tier.coins}
                    >
                      {tier.coins} coins → ₹{tier.amount}
                      {balance < tier.coins && ' (Insufficient balance)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="upiId">UPI ID *</Label>
              <Input
                id="upiId"
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="example@paytm"
                required
              />
            </div>

            <div>
              <Label htmlFor="qrUrl">QR Code URL (Optional)</Label>
              <Input
                id="qrUrl"
                type="url"
                value={qrUrl}
                onChange={(e) => setQrUrl(e.target.value)}
                placeholder="https://example.com/qr-code"
              />
            </div>

            <div>
              <Label htmlFor="timeSlot">Preferred Processing Time (Optional)</Label>
              <Select onValueChange={setPreferredTimeSlot}>
                <SelectTrigger>
                  <SelectValue placeholder="Select preferred time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning (9 AM - 12 PM)</SelectItem>
                  <SelectItem value="afternoon">Afternoon (12 PM - 5 PM)</SelectItem>
                  <SelectItem value="evening">Evening (5 PM - 9 PM)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !selectedTier || !upiId.trim()}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Withdrawal Request'
              )}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
};
