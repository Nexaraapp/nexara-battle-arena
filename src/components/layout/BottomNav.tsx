
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Trophy, Wallet, Bell, User, Gift, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return null;
  }

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/matches', icon: Trophy, label: 'Matches' },
    { path: '/wallet', icon: Wallet, label: 'Wallet' },
    { path: '/achievements', icon: Star, label: 'Rewards' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 safe-area-bottom z-40">
      <div className="flex justify-around items-center py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${
                isActive 
                  ? 'text-blue-500 bg-blue-500/20' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.path === '/achievements' && (
                  <Badge className="absolute -top-2 -right-2 h-4 w-4 p-0 text-xs bg-purple-500 text-white">
                    !
                  </Badge>
                )}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
