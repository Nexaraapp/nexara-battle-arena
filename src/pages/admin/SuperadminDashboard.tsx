
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Crown, Users, Settings, DollarSign, FileText, Shield } from 'lucide-react';

const SuperadminDashboard = () => {
  const navigate = useNavigate();

  const superadminFeatures = [
    {
      title: 'Admin Management',
      description: 'Manage admin users and permissions',
      icon: Shield,
      action: () => navigate('/admin/user-management'),
      color: 'bg-purple-100 text-purple-800'
    },
    {
      title: 'System Settings',
      description: 'Configure app-wide settings',
      icon: Settings,
      action: () => navigate('/admin/settings'),
      color: 'bg-blue-100 text-blue-800'
    },
    {
      title: 'Full Withdrawal Logs',
      description: 'View all withdrawal history and analytics',
      icon: DollarSign,
      action: () => navigate('/admin/withdrawal-logs'),
      color: 'bg-green-100 text-green-800'
    },
    {
      title: 'Manual Coin Edits',
      description: 'Manually adjust user balances',
      icon: Users,
      action: () => navigate('/admin/manual-coins'),
      color: 'bg-yellow-100 text-yellow-800'
    },
    {
      title: 'App Rules Control',
      description: 'Create, edit, and delete app rules',
      icon: FileText,
      action: () => navigate('/admin/rules-management'),
      color: 'bg-red-100 text-red-800'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4">
          <Crown className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold">Superadmin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Complete system control and management
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {superadminFeatures.map((feature, index) => (
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

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-blue-600">24</div>
            <p className="text-sm text-muted-foreground">Active Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-green-600">12</div>
            <p className="text-sm text-muted-foreground">Pending Withdrawals</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-purple-600">8</div>
            <p className="text-sm text-muted-foreground">Active Matches</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-orange-600">5</div>
            <p className="text-sm text-muted-foreground">Top-up Requests</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SuperadminDashboard;
