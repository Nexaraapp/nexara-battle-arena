
import React from 'react';
import { ReferralSystem } from '@/components/referral/ReferralSystem';

const ReferralPage = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Referral Program</h1>
        <p className="text-muted-foreground mt-2">
          Invite friends and earn rewards together
        </p>
      </div>
      
      <div className="max-w-4xl mx-auto">
        <ReferralSystem />
      </div>
    </div>
  );
};

export default ReferralPage;
