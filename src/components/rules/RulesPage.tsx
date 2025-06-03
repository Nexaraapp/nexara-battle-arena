
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, Shield, Award, AlertTriangle, Gamepad2, Target } from 'lucide-react';
import { toast } from 'sonner';
import { useDefaultRules } from '@/hooks/useDefaultRules';

interface Rule {
  id: string;
  category: string;
  title: string;
  content: string;
  order_index: number;
  is_active: boolean;
}

export const RulesPage = () => {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize default rules if none exist
  useDefaultRules();

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('rules')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error fetching rules:', error);
        toast.error('Failed to load rules');
        return;
      }

      console.log('Fetched rules:', data);
      setRules(data || []);
    } catch (error) {
      console.error('Error fetching rules:', error);
      toast.error('Failed to load rules');
    } finally {
      setLoading(false);
    }
  };

  const getRulesByCategory = (category: string) => {
    return rules.filter(rule => rule.category === category);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'battle_royale':
        return <Gamepad2 className="w-5 h-5" />;
      case 'clash_squad':
        return <Target className="w-5 h-5" />;
      case 'penalties':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <BookOpen className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'battle_royale':
        return 'text-blue-600';
      case 'clash_squad':
        return 'text-green-600';
      case 'penalties':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const renderRulesForCategory = (category: string) => {
    const categoryRules = getRulesByCategory(category);
    
    if (categoryRules.length === 0) {
      return (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="text-center py-12">
            <div className={`${getCategoryColor(category)} mb-4 flex justify-center`}>
              {getCategoryIcon(category)}
            </div>
            <p className="text-gray-400">No rules available for this category</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {categoryRules.map((rule, index) => (
          <Card key={rule.id} className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-white">
                <Badge variant="outline" className="text-xs">
                  {index + 1}
                </Badge>
                {rule.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-line text-gray-300">{rule.content}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-8">
          <div className="text-white">Loading rules...</div>
        </div>
      </div>
    );
  }

  const categories = [
    { key: 'general', label: 'General Rules', icon: BookOpen },
    { key: 'battle_royale', label: 'Battle Royale', icon: Gamepad2 },
    { key: 'clash_squad', label: 'Clash Squad', icon: Target },
    { key: 'penalties', label: 'Penalties & Tags', icon: AlertTriangle }
  ];

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-2">
          <Shield className="w-8 h-8" />
          Game Rules & Policies
        </h1>
        <p className="text-gray-400 mt-2">
          Please read and follow all rules to ensure fair gameplay
        </p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-gray-800 border-gray-700">
          {categories.map((category) => {
            const Icon = category.icon;
            const categoryRules = getRulesByCategory(category.key);
            return (
              <TabsTrigger 
                key={category.key} 
                value={category.key}
                className="flex items-center gap-1 text-xs md:text-sm text-gray-300 data-[state=active]:text-white data-[state=active]:bg-gray-700"
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{category.label}</span>
                <span className="sm:hidden">{category.label.split(' ')[0]}</span>
                {categoryRules.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {categoryRules.length}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category.key} value={category.key} className="mt-6">
            <div className="mb-4">
              <h2 className={`text-xl font-semibold flex items-center gap-2 ${getCategoryColor(category.key)} text-white`}>
                {getCategoryIcon(category.key)}
                {category.label}
              </h2>
            </div>
            {renderRulesForCategory(category.key)}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
