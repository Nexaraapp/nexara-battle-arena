
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Settings as SettingsIcon } from 'lucide-react';
import { toast } from 'sonner';

const Settings = () => {
  const [withdrawalSettings, setWithdrawalSettings] = useState({
    start_time: '18:00',
    end_time: '22:00',
    is_active: true,
    estimated_processing_hours: 24
  });

  const { data: settings, refetch } = useQuery({
    queryKey: ['withdrawal-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('withdrawal_settings')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  });

  const handleSaveSettings = async () => {
    try {
      const { error } = await supabase
        .from('withdrawal_settings')
        .upsert({
          ...withdrawalSettings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      toast.success('Settings saved successfully');
      refetch();
    } catch (error: any) {
      toast.error('Failed to save settings');
    }
  };

  React.useEffect(() => {
    if (settings) {
      setWithdrawalSettings({
        start_time: settings.start_time || '18:00',
        end_time: settings.end_time || '22:00',
        is_active: settings.is_active ?? true,
        estimated_processing_hours: settings.estimated_processing_hours || 24
      });
    }
  }, [settings]);

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="w-6 h-6" />
            System Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Withdrawal Settings</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_time">Start Time</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={withdrawalSettings.start_time}
                  onChange={(e) => setWithdrawalSettings({ 
                    ...withdrawalSettings, 
                    start_time: e.target.value 
                  })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="end_time">End Time</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={withdrawalSettings.end_time}
                  onChange={(e) => setWithdrawalSettings({ 
                    ...withdrawalSettings, 
                    end_time: e.target.value 
                  })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="processing_hours">Estimated Processing Hours</Label>
              <Input
                id="processing_hours"
                type="number"
                min="1"
                max="72"
                value={withdrawalSettings.estimated_processing_hours}
                onChange={(e) => setWithdrawalSettings({ 
                  ...withdrawalSettings, 
                  estimated_processing_hours: parseInt(e.target.value) 
                })}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={withdrawalSettings.is_active}
                onCheckedChange={(checked) => setWithdrawalSettings({ 
                  ...withdrawalSettings, 
                  is_active: checked 
                })}
              />
              <Label htmlFor="is_active">Enable Withdrawal Window</Label>
            </div>
          </div>
          
          <Button onClick={handleSaveSettings} className="w-full">
            Save Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
