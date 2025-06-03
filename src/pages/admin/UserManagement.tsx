
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Users, Shield, Crown } from 'lucide-react';
import { toast } from 'sonner';

const UserManagement = () => {
  const [searchEmail, setSearchEmail] = useState('');

  const { data: users, refetch } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data } = await supabase.auth.admin.listUsers();
      return data.users;
    }
  });

  const assignRole = async (userId: string, role: 'admin' | 'superadmin') => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: role
        });

      if (error) throw error;
      toast.success(`${role} role assigned successfully`);
      refetch();
    } catch (error: any) {
      toast.error(`Failed to assign role: ${error.message}`);
    }
  };

  const filteredUsers = users?.filter(user => 
    user.email?.toLowerCase().includes(searchEmail.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-6 h-6" />
            User Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              placeholder="Search by email..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
            />

            <div className="space-y-2">
              {filteredUsers?.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{user.email}</p>
                    <p className="text-sm text-muted-foreground">ID: {user.id}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => assignRole(user.id, 'admin')}
                      className="flex items-center gap-1"
                    >
                      <Shield className="w-3 h-3" />
                      Make Admin
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => assignRole(user.id, 'superadmin')}
                      className="flex items-center gap-1"
                    >
                      <Crown className="w-3 h-3" />
                      Make Superadmin
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
