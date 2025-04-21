
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Gamepad, Wallet, User, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

const BottomNav = () => {
  const location = useLocation();
  
  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Gamepad, label: "Matches", path: "/matches" },
    { icon: Wallet, label: "Wallet", path: "/wallet" },
    { icon: User, label: "Profile", path: "/profile" },
    { icon: Bell, label: "Alerts", path: "/notifications" },
  ];
  
  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-nexara-accent/20 bg-nexara-bg/95 backdrop-blur-sm z-40 md:hidden">
      <nav className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const IconComponent = item.icon;
          
          return (
            <Link
              key={item.label}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center px-3 py-1 transition-colors",
                isActive
                  ? "text-nexara-accent"
                  : "text-gray-400 hover:text-gray-200"
              )}
            >
              <IconComponent size={20} />
              <span className="text-xs mt-1">{item.label}</span>
              {isActive && (
                <span className="absolute top-0 h-1 w-8 bg-nexara-accent rounded-b-lg transform -translate-y-[1px]" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default BottomNav;
