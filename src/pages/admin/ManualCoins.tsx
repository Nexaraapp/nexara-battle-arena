
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, Plus, Minus } from 'lucide-react';

interface SupabaseUser {
  id: string;
  email?: string;
  [key: string]: any;
}

const ManualCoins = () => {
  const [userEmail, setUserEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [operation, setOperation] = useState<'add' | 'subtract'>('add');
  const [loading, setLoading] = useState(false);

  const handleManualCoinEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail || !amount) {
      toast.error('Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      // Find user by email
      const { data: userData } = await supabase.auth.admin.listUsers();
      const user = userData.users.find((u: SupabaseUser) => u.email === userEmail);
      
      if (!user) {
        toast.error('User not found');
        return;
      }

      const coinAmount = parseInt(amount);
      const finalAmount = operation === 'add' ? coinAmount : -coinAmount;

      // Add transaction
      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'manual_adjustment',
          amount: finalAmount,
          status: 'completed',
          notes: `Manual ${operation} by superadmin: ${coinAmount} coins`
        });

      if (error) throw error;

      toast.success(`Successfully ${operation === 'add' ? 'added' : 'subtracted'} ${coinAmount} coins to ${userEmail}`);
      setUserEmail('');
      setAmount('');
    } catch (error: any) {
      console.error('Manual coin edit error:', error);
      toast.error('Failed to update coins');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-6 h-6" />
              Manual Coin Management
            </CardTitle>
            <p className="text-muted-foreground">
              Add or subtract coins from user accounts manually
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleManualCoinEdit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="userEmail">User Email</Label>
                <Input
                  id="userEmail"
                  type="email"
                  placeholder="Enter user email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  placeholder="Enter coin amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Operation</Label>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant={operation === 'add' ? 'default' : 'outline'}
                    onClick={() => setOperation('add')}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Coins
                  </Button>
                  <Button
                    type="button"
                    variant={operation === 'subtract' ? 'default' : 'outline'}
                    onClick={() => setOperation('subtract')}
                    className="flex items-center gap-2"
                  >
                    <Minus className="w-4 h-4" />
                    Subtract Coins
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Processing...' : `${operation === 'add' ? 'Add' : 'Subtract'} Coins`}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ManualCoins;
