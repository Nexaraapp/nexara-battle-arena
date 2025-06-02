
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, Shield, Award, AlertTriangle, Gamepad2 } from 'lucide-react';

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

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const { data, error } = await supabase
        .from('rules')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setRules(data || []);
    } catch (error) {
      console.error('Error fetching rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRulesByCategory = (category: string) => {
    return rules.filter(rule => rule.category === category);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'gameplay':
        return <Gamepad2 className="w-5 h-5" />;
      case 'withdrawal':
        return <Award className="w-5 h-5" />;
      case 'penalties':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <BookOpen className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'gameplay':
        return 'text-blue-600';
      case 'withdrawal':
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
        <Card>
          <CardContent className="text-center py-12">
            <div className={`${getCategoryColor(category)} mb-4`}>
              {getCategoryIcon(category)}
            </div>
            <p className="text-muted-foreground">No rules available for this category</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {categoryRules.map((rule, index) => (
          <Card key={rule.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Badge variant="outline" className="text-xs">
                  {index + 1}
                </Badge>
                {rule.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: rule.content.replace(/\n/g, '<br>') }}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  if (loading) {
    return <div className="text-center py-8">Loading rules...</div>;
  }

  const categories = [
    { key: 'general', label: 'General Rules', icon: BookOpen },
    { key: 'gameplay', label: 'Gameplay Rules', icon: Gamepad2 },
    { key: 'withdrawal', label: 'Withdrawal Policy', icon: Award },
    { key: 'penalties', label: 'Penalties & Violations', icon: AlertTriangle }
  ];

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Shield className="w-8 h-8" />
          Game Rules & Policies
        </h1>
        <p className="text-muted-foreground mt-2">
          Please read and follow all rules to ensure fair gameplay
        </p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          {categories.map((category) => {
            const Icon = category.icon;
            const categoryRules = getRulesByCategory(category.key);
            return (
              <TabsTrigger 
                key={category.key} 
                value={category.key}
                className="flex items-center gap-1 text-xs md:text-sm"
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
              <h2 className={`text-xl font-semibold flex items-center gap-2 ${getCategoryColor(category.key)}`}>
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
