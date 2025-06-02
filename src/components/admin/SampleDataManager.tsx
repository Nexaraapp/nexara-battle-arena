
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { insertSampleRules, insertSampleMatch } from '@/utils/sampleData';
import { toast } from 'sonner';
import { Plus, Database } from 'lucide-react';

export const SampleDataManager = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleInsertRules = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      await insertSampleRules();
      toast.success('Sample rules added successfully!');
    } catch (error) {
      toast.error('Failed to add sample rules');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleInsertMatch = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      await insertSampleMatch(user.id);
      toast.success('Sample match created successfully!');
    } catch (error) {
      toast.error('Failed to create sample match');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Sample Data Manager
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={handleInsertRules}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Sample Rules
          </Button>
          
          <Button
            onClick={handleInsertMatch}
            disabled={loading}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Sample Match
          </Button>
        </div>
        
        <p className="text-sm text-muted-foreground">
          Use these buttons to add sample data for testing. Rules will be added to all categories, 
          and a sample Battle Royale match will be created.
        </p>
      </CardContent>
    </Card>
  );
};
