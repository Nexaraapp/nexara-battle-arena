import React, { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';
import { MatchManagement } from '@/components/admin/MatchManagement';

// Lazy load other admin components if needed
const Dashboard = () => {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-400">Manage all aspects of the platform</p>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Stats cards would go here */}
      </div>

      <Suspense fallback={
        <div className="h-96 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }>
        <MatchManagement />
      </Suspense>
      
      {/* Other admin components would go here */}
    </div>
  );
};

export default Dashboard;
