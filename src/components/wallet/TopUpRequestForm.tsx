
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Plus, Upload } from 'lucide-react';

export const TopUpRequestForm = () => {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to submit a top-up request');
      return;
    }

    if (!amount || !paymentMethod) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('topup_requests')
        .insert({
          user_id: user.id,
          amount: parseInt(amount),
          payment_method: paymentMethod,
          screenshot_url: screenshotUrl || null
        });

      if (error) throw error;

      toast.success('Top-up request submitted successfully!');
      setAmount('');
      setPaymentMethod('');
      setScreenshotUrl('');
    } catch (error) {
      console.error('Error submitting top-up request:', error);
      toast.error('Failed to submit top-up request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Request Coin Top-Up
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (Coins)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-method">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="paytm">Paytm</SelectItem>
                <SelectItem value="google_pay">Google Pay</SelectItem>
                <SelectItem value="phonepe">PhonePe</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="screenshot">Payment Screenshot (Optional)</Label>
            <Input
              id="screenshot"
              type="url"
              placeholder="Upload screenshot URL"
              value={screenshotUrl}
              onChange={(e) => setScreenshotUrl(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Upload your payment screenshot to help speed up verification
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Request'}
          </Button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">How it works:</h4>
          <ol className="text-sm text-blue-700 space-y-1">
            <li>1. Submit your top-up request with payment details</li>
            <li>2. Admin will review and verify your payment</li>
            <li>3. Coins will be added to your account once approved</li>
            <li>4. You'll receive a notification when processed</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};
