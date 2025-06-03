
import React from 'react';
import { SampleDataManager } from '@/components/admin/SampleDataManager';
import { AdminDashboardStats } from '@/components/admin/AdminDashboardStats';
import { ResultVerification } from '@/components/admin/ResultVerification';
import { SmartWithdrawalTagging } from '@/components/admin/SmartWithdrawalTagging';

const AdminDashboard = () => {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Manage your gaming platform
        </p>
      </div>
      
      {/* Dashboard Statistics */}
      <AdminDashboardStats />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sample Data Manager */}
        <SampleDataManager />
        
        {/* Smart Withdrawal Tagging */}
        <SmartWithdrawalTagging />
      </div>

      {/* Result Verification */}
      <ResultVerification />
    </div>
  );
};

export default AdminDashboard;
