
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AlertTriangle, Clock, Repeat, DollarSign } from 'lucide-react';

interface EnhancedWithdrawal {
  id: number;
  user_id: string;
  amount: number;
  upi_id: string;
  status: string;
  created_at: string;
  risk_score: number;
  auto_tags: string[];
  is_suspicious: boolean;
}

export const SmartWithdrawalTagging = () => {
  const [withdrawals, setWithdrawals] = useState<EnhancedWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Apply smart tagging logic
      const taggedWithdrawals = await Promise.all(
        (data || []).map(async (withdrawal) => {
          const tags = await generateSmartTags(withdrawal);
          const riskScore = calculateRiskScore(withdrawal, tags);
          
          return {
            ...withdrawal,
            auto_tags: tags,
            risk_score: riskScore,
            is_suspicious: riskScore > 70
          };
        })
      );

      setWithdrawals(taggedWithdrawals);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSmartTags = async (withdrawal: any): Promise<string[]> => {
    const tags: string[] = [];

    try {
      // Check if user is new (first withdrawal)
      const { count: withdrawalCount } = await supabase
        .from('withdrawals')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', withdrawal.user_id);

      if (withdrawalCount === 1) {
        tags.push('NEW');
      }

      // Check frequency (more than 3 withdrawals in last 7 days)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { count: recentCount } = await supabase
        .from('withdrawals')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', withdrawal.user_id)
        .gte('created_at', weekAgo);

      if ((recentCount || 0) > 3) {
        tags.push('FREQUENT');
      }

      // Check for high amounts (over 10000 coins)
      if (withdrawal.amount > 10000) {
        tags.push('HIGH_AMOUNT');
      }

      // Check for duplicate UPI IDs
      const { count: upiCount } = await supabase
        .from('withdrawals')
        .select('*', { count: 'exact', head: true })
        .eq('upi_id', withdrawal.upi_id)
        .neq('user_id', withdrawal.user_id);

      if ((upiCount || 0) > 0) {
        tags.push('DUPLICATE_UPI');
      }

      // Check user balance vs withdrawal ratio
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', withdrawal.user_id)
        .eq('status', 'completed');

      const totalBalance = transactions?.reduce((sum, tx) => sum + tx.amount, 0) || 0;
      if (withdrawal.amount > totalBalance * 0.8) {
        tags.push('HIGH_RATIO');
      }

    } catch (error) {
      console.error('Error generating tags:', error);
    }

    return tags;
  };

  const calculateRiskScore = (withdrawal: any, tags: string[]): number => {
    let score = 0;
    
    // Base score based on tags
    if (tags.includes('NEW')) score += 10;
    if (tags.includes('FREQUENT')) score += 30;
    if (tags.includes('HIGH_AMOUNT')) score += 25;
    if (tags.includes('DUPLICATE_UPI')) score += 40;
    if (tags.includes('HIGH_RATIO')) score += 20;

    // Additional factors
    if (withdrawal.amount > 50000) score += 15;
    
    return Math.min(score, 100);
  };

  const getTagIcon = (tag: string) => {
    switch (tag) {
      case 'NEW': return Clock;
      case 'FREQUENT': return Repeat;
      case 'HIGH_AMOUNT': return DollarSign;
      case 'DUPLICATE_UPI': return AlertTriangle;
      case 'HIGH_RATIO': return AlertTriangle;
      default: return AlertTriangle;
    }
  };

  const getTagColor = (tag: string) => {
    switch (tag) {
      case 'NEW': return 'bg-blue-100 text-blue-800';
      case 'FREQUENT': return 'bg-orange-100 text-orange-800';
      case 'HIGH_AMOUNT': return 'bg-purple-100 text-purple-800';
      case 'DUPLICATE_UPI': return 'bg-red-100 text-red-800';
      case 'HIGH_RATIO': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskBadgeColor = (score: number) => {
    if (score >= 70) return 'bg-red-100 text-red-800';
    if (score >= 40) return 'bg-orange-100 text-orange-800';
    return 'bg-green-100 text-green-800';
  };

  const getRiskLevel = (score: number) => {
    if (score >= 70) return 'HIGH';
    if (score >= 40) return 'MEDIUM';
    return 'LOW';
  };

  if (loading) {
    return <div className="text-center">Loading withdrawals...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Smart Withdrawal Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        {withdrawals.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No pending withdrawals
          </div>
        ) : (
          <div className="space-y-4">
            {withdrawals.map((withdrawal) => (
              <div key={withdrawal.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">₹{withdrawal.amount}</p>
                    <p className="text-sm text-muted-foreground">
                      UPI: {withdrawal.upi_id}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(withdrawal.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge className={getRiskBadgeColor(withdrawal.risk_score)}>
                      {getRiskLevel(withdrawal.risk_score)} RISK ({withdrawal.risk_score})
                    </Badge>
                  </div>
                </div>

                {withdrawal.auto_tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {withdrawal.auto_tags.map((tag) => {
                      const Icon = getTagIcon(tag);
                      return (
                        <Badge 
                          key={tag}
                          variant="outline"
                          className={`${getTagColor(tag)} flex items-center gap-1`}
                        >
                          <Icon className="w-3 h-3" />
                          {tag.replace('_', ' ')}
                        </Badge>
                      );
                    })}
                  </div>
                )}

                {withdrawal.is_suspicious && (
                  <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-red-700">
                      This withdrawal requires manual review due to high risk score
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
