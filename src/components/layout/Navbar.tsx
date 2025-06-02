
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { AdminGestureDetector } from "@/components/admin/AdminGestureDetector";
import { SuperadminGestureDetector } from "@/components/admin/SuperadminGestureDetector";
import { Badge } from "@/components/ui/badge";
import { Bell, Menu, X, Gift, Users, Star, Settings } from "lucide-react";
import { getUserBalance } from "@/utils/balanceApi";
import { useQuery } from "@tanstack/react-query";

export const Navbar = () => {
  const { user, isAuthenticated, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const { data: balanceData } = useQuery({
    queryKey: ['balance'],
    queryFn: getUserBalance,
    enabled: isAuthenticated,
  });

  const handleAuthAction = () => {
    if (isAuthenticated) {
      signOut();
    } else {
      navigate('/login');
    }
  };

  const navLinks = [
    { path: '/matches', label: 'Matches', icon: '🎯' },
    { path: '/wallet', label: 'Wallet', icon: '💰' },
    { path: '/referral', label: 'Referral', icon: '🤝' },
    { path: '/achievements', label: 'Achievements', icon: '🏆' },
  ];

  return (
    <>
      <nav className="bg-gray-900 border-b border-gray-700 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="text-2xl font-bold text-white">
                NEXARA
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              {isAuthenticated && navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="text-gray-300 hover:text-white transition-colors flex items-center gap-2"
                >
                  <span>{link.icon}</span>
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {isAuthenticated && balanceData && (
                <div className="hidden md:flex items-center space-x-2 bg-gray-800 px-3 py-1 rounded-lg">
                  <span className="text-sm text-gray-400">Balance:</span>
                  <span className="text-sm font-semibold text-green-400">
                    {balanceData.balance} coins
                  </span>
                </div>
              )}

              {isAuthenticated && (
                <Link to="/notifications" className="relative">
                  <Button variant="ghost" size="icon">
                    <Bell className="w-5 h-5" />
                  </Button>
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs bg-red-500">
                    3
                  </Badge>
                </Link>
              )}

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>

              {/* Desktop auth button */}
              <div className="hidden md:block">
                <Button
                  onClick={handleAuthAction}
                  variant={isAuthenticated ? "outline" : "default"}
                >
                  {isAuthenticated ? "Sign Out" : "Sign In"}
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile menu */}
          {isMenuOpen && (
            <div className="md:hidden border-t border-gray-700">
              <div className="py-4 space-y-3">
                {isAuthenticated && balanceData && (
                  <div className="flex items-center justify-between bg-gray-800 px-3 py-2 rounded-lg">
                    <span className="text-sm text-gray-400">Balance:</span>
                    <span className="text-sm font-semibold text-green-400">
                      {balanceData.balance} coins
                    </span>
                  </div>
                )}

                {isAuthenticated && navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className="block text-gray-300 hover:text-white transition-colors py-2 flex items-center gap-3"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="text-lg">{link.icon}</span>
                    {link.label}
                  </Link>
                ))}

                <div className="pt-3 border-t border-gray-700">
                  <Button
                    onClick={() => {
                      handleAuthAction();
                      setIsMenuOpen(false);
                    }}
                    variant={isAuthenticated ? "outline" : "default"}
                    className="w-full"
                  >
                    {isAuthenticated ? "Sign Out" : "Sign In"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
      
      {/* Admin Gesture Detectors */}
      <AdminGestureDetector />
      <SuperadminGestureDetector />
    </>
  );
};
