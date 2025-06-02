
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface WelcomeOnboardingProps {
  onComplete: () => void;
}

export const WelcomeOnboarding: React.FC<WelcomeOnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    gameId: '',
    referralCode: ''
  });
  const { toast } = useToast();
  const { user } = useAuth();

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          username: formData.username,
          game_id: formData.gameId,
          has_completed_onboarding: true,
          referred_by: formData.referralCode ? await getReferrerByCode(formData.referralCode) : null
        });

      if (profileError) throw profileError;

      // Process referral if provided
      if (formData.referralCode) {
        await processReferral(formData.referralCode);
      }

      // Add welcome transaction
      await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'bonus',
          amount: 50,
          status: 'completed',
          notes: 'Welcome bonus for new users'
        });

      toast({
        title: "Welcome to Nexara! 🎉",
        description: "You've received 50 welcome coins!"
      });

      onComplete();
    } catch (error: any) {
      console.error('Onboarding error:', error);
      toast({
        title: "Error",
        description: "Failed to complete onboarding. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getReferrerByCode = async (code: string) => {
    const { data } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('referral_code', code)
      .single();
    return data?.user_id || null;
  };

  const processReferral = async (code: string) => {
    const referrerId = await getReferrerByCode(code);
    if (referrerId && user) {
      await supabase
        .from('referrals')
        .insert({
          referrer_id: referrerId,
          referred_id: user.id,
          status: 'completed',
          completed_at: new Date().toISOString()
        });

      // Add bonus for both users
      await Promise.all([
        supabase.from('transactions').insert({
          user_id: referrerId,
          type: 'referral_bonus',
          amount: 25,
          status: 'completed',
          notes: 'Referral bonus - friend joined'
        }),
        supabase.from('transactions').insert({
          user_id: user.id,
          type: 'referral_bonus',
          amount: 25,
          status: 'completed',
          notes: 'Referral bonus - used referral code'
        })
      ]);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Welcome to Nexara BattleField! 🎮</h2>
              <p className="text-gray-300">The ultimate competitive gaming arena where skill meets rewards</p>
            </div>
            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 p-4 rounded-lg">
              <h3 className="font-semibold text-white mb-2">What makes us special:</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Real money prizes for skilled players</li>
                <li>• Fair play with admin verification</li>
                <li>• Multiple game modes and formats</li>
                <li>• Instant withdrawals to your UPI</li>
              </ul>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Create Your Gaming Profile</h2>
            <div className="space-y-3">
              <div>
                <Label htmlFor="username">Choose Your Username</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  placeholder="Enter your gaming username"
                  className="bg-gray-800 border-gray-600"
                />
              </div>
              <div>
                <Label htmlFor="gameId">Your Game ID (Optional)</Label>
                <Input
                  id="gameId"
                  value={formData.gameId}
                  onChange={(e) => setFormData({...formData, gameId: e.target.value})}
                  placeholder="Your in-game ID for verification"
                  className="bg-gray-800 border-gray-600"
                />
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Referral Code (Optional)</h2>
            <p className="text-gray-300 text-sm">Have a friend who referred you? Enter their code to get bonus coins!</p>
            <div>
              <Label htmlFor="referralCode">Referral Code</Label>
              <Input
                id="referralCode"
                value={formData.referralCode}
                onChange={(e) => setFormData({...formData, referralCode: e.target.value.toUpperCase()})}
                placeholder="NEX123456"
                className="bg-gray-800 border-gray-600"
              />
            </div>
            <div className="bg-green-500/20 p-3 rounded-lg">
              <p className="text-sm text-green-300">
                💰 Using a referral code gives you and your friend 25 bonus coins each!
              </p>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4 text-center">
            <h2 className="text-xl font-bold text-white">You're All Set! 🚀</h2>
            <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 p-4 rounded-lg">
              <h3 className="font-semibold text-white mb-2">Your Welcome Package:</h3>
              <div className="text-sm text-gray-300 space-y-1">
                <p>🎁 50 Welcome Coins</p>
                {formData.referralCode && <p>🤝 25 Referral Bonus Coins</p>}
                <p>🏆 Access to all game modes</p>
                <p>💸 Instant withdrawal capability</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm">
              Ready to start your gaming journey and earn real rewards?
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md bg-gray-900 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Getting Started</CardTitle>
            <span className="text-sm text-gray-400">{step}/{totalSteps}</span>
          </div>
          <Progress value={progress} className="w-full" />
        </CardHeader>
        <CardContent className="space-y-6">
          {renderStep()}
          <div className="flex gap-3">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="flex-1"
                disabled={loading}
              >
                Back
              </Button>
            )}
            <Button
              onClick={handleNext}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={loading || (step === 2 && !formData.username)}
            >
              {loading ? 'Setting up...' : step === totalSteps ? 'Enter Arena' : 'Next'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
