
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const RulesManagement = () => {
  const [newRule, setNewRule] = useState({
    title: '',
    content: '',
    category: 'general'
  });

  const { data: rules, refetch } = useQuery({
    queryKey: ['rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rules')
        .select('*')
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('rules')
        .insert({
          title: newRule.title,
          content: newRule.content,
          category: newRule.category,
          order_index: (rules?.length || 0) + 1
        });

      if (error) throw error;
      
      toast.success('Rule created successfully');
      setNewRule({ title: '', content: '', category: 'general' });
      refetch();
    } catch (error: any) {
      toast.error('Failed to create rule');
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      const { error } = await supabase
        .from('rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;
      
      toast.success('Rule deleted successfully');
      refetch();
    } catch (error: any) {
      toast.error('Failed to delete rule');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-6 h-6" />
            Create New Rule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateRule} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Rule Title</Label>
              <Input
                id="title"
                value={newRule.title}
                onChange={(e) => setNewRule({ ...newRule, title: e.target.value })}
                placeholder="Enter rule title"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={newRule.category}
                onChange={(e) => setNewRule({ ...newRule, category: e.target.value })}
                placeholder="e.g., general, gameplay, rewards"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="content">Rule Content</Label>
              <Textarea
                id="content"
                value={newRule.content}
                onChange={(e) => setNewRule({ ...newRule, content: e.target.value })}
                placeholder="Enter rule description"
                rows={4}
                required
              />
            </div>
            
            <Button type="submit" className="w-full">
              Create Rule
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Existing Rules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rules?.map((rule) => (
              <div key={rule.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-medium">{rule.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">Category: {rule.category}</p>
                    <p className="text-sm">{rule.content}</p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteRule(rule.id)}
                    className="ml-4"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RulesManagement;
