import React from 'react';
import { SampleDataManager } from '@/components/admin/SampleDataManager';

const AdminDashboard = () => {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Manage your gaming platform
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <SampleDataManager />
        
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4">
            {/* Add more admin widgets here as needed */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
