
import React from 'react';
import { WithdrawalRequestForm } from '@/components/withdrawals/WithdrawalRequestForm';
import { WithdrawalHistory } from '@/components/withdrawals/WithdrawalHistory';

const WithdrawalPage = () => {
  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Withdraw Coins</h1>
        <p className="text-muted-foreground mt-2">
          Request withdrawals between 6 PM and 10 PM daily
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <WithdrawalRequestForm />
        <WithdrawalHistory />
      </div>
    </div>
  );
};

export default WithdrawalPage;
