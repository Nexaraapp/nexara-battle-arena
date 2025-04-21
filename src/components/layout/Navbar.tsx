
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Menu, Trophy, User, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { name: "Matches", href: "/matches" },
    { name: "Wallet", href: "/wallet", icon: <Wallet size={18} /> },
    { name: "Profile", href: "/profile", icon: <User size={18} /> },
    { name: "Notifications", href: "/notifications", icon: <Bell size={18} /> },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-nexara-bg/95 backdrop-blur-sm border-b border-nexara-accent/20">
      <div className="container flex items-center justify-between h-16 px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2" id="app-logo">
          <div className="flex items-center">
            <Trophy className="text-nexara-neon w-8 h-8" />
            <span className="ml-2 text-xl font-bold text-white neon-text">
              Nexara<span className="text-nexara-accent">BF</span>
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              className="text-gray-300 hover:text-nexara-accent transition-colors flex items-center gap-1"
            >
              {link.icon}
              <span>{link.name}</span>
            </Link>
          ))}
          <Button
            asChild
            className="bg-nexara-neon hover:bg-nexara-accent2 text-white ml-4 animate-pulse-neon"
          >
            <Link to="/matches">Join Match</Link>
          </Button>
        </nav>

        {/* Mobile Menu Button */}
        <div className="flex items-center space-x-4 md:hidden">
          <Link to="/notifications" className="relative">
            <Bell className="h-6 w-6 text-gray-300" />
            <span className="absolute -top-1 -right-1 bg-nexara-highlight text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
              2
            </span>
          </Link>

          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-gray-300">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-nexara-bg border-nexara-accent/30">
              <SheetHeader>
                <SheetTitle className="text-nexara-accent neon-text">Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col space-y-4 mt-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.href}
                    className="flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-nexara-accent/10 rounded-md transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.icon || <div className="w-[18px]" />}
                    <span>{link.name}</span>
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
