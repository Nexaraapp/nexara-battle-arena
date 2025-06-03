
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Shield, DollarSign, Users, Trophy, Settings, Plus } from 'lucide-react';
import { AdminDashboardStats } from '@/components/admin/AdminDashboardStats';

const AdminDashboard = () => {
  const navigate = useNavigate();

  const adminFeatures = [
    {
      title: 'Withdrawal Requests',
      description: 'Review and process user withdrawal requests',
      icon: DollarSign,
      action: () => navigate('/admin/withdrawals'),
      color: 'bg-green-100 text-green-800'
    },
    {
      title: 'Top-Up Requests',
      description: 'Approve user coin top-up requests',
      icon: Plus,
      action: () => navigate('/admin/topup-requests'),
      color: 'bg-blue-100 text-blue-800'
    },
    {
      title: 'Manage Matches',
      description: 'Create and manage gaming matches',
      icon: Trophy,
      action: () => navigate('/admin/matches'),
      color: 'bg-purple-100 text-purple-800'
    },
    {
      title: 'User Management',
      description: 'View and manage user accounts',
      icon: Users,
      action: () => navigate('/admin/users'),
      color: 'bg-orange-100 text-orange-800'
    },
    {
      title: 'System Settings',
      description: 'Configure app settings and parameters',
      icon: Settings,
      action: () => navigate('/admin/settings'),
      color: 'bg-gray-100 text-gray-800'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Manage your gaming platform
        </p>
      </div>
      
      {/* Dashboard Statistics */}
      <AdminDashboardStats />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminFeatures.map((feature, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-3`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <CardTitle className="text-lg">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{feature.description}</p>
              <Button onClick={feature.action} className="w-full">
                Access
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
