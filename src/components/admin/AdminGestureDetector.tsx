
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const AdminGestureDetector = () => {
  const [tapCount, setTapCount] = useState(0);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (tapCount >= 5) {
      setShowAdminModal(true);
      setTapCount(0);
    } else if (tapCount > 0) {
      timeoutId = setTimeout(() => {
        setTapCount(0);
      }, 2000);
    }
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [tapCount]);

  const handleLogoClick = () => {
    setTapCount((prev) => prev + 1);
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    
    try {
      // Placeholder for Supabase auth - will be implemented when Supabase is connected
      console.log("Admin login attempt:", { email, password });
      
      // Simulate login for now (this will be replaced with actual Supabase auth)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (email === "admin@nexara.test" && password === "admin123") {
        toast.success("Admin login successful");
        // In a real implementation, we would navigate to admin dashboard
        window.location.href = "/admin";
      } else {
        toast.error("Invalid admin credentials");
      }
    } catch (error) {
      console.error("Admin login error:", error);
      toast.error("Login failed. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  useEffect(() => {
    // Find all elements with id "app-logo" and add click event listeners
    const logoElements = document.querySelectorAll("#app-logo");
    
    logoElements.forEach(element => {
      element.addEventListener("click", handleLogoClick);
    });
    
    return () => {
      logoElements.forEach(element => {
        element.removeEventListener("click", handleLogoClick);
      });
    };
  }, []);

  return (
    <Dialog open={showAdminModal} onOpenChange={setShowAdminModal}>
      <DialogContent className="bg-nexara-bg border-nexara-accent neon-border">
        <DialogHeader>
          <DialogTitle className="text-nexara-accent neon-text text-center">Admin Access</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleAdminLogin} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="admin-email">Email</Label>
            <Input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-muted border-nexara-accent/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-password">Password</Label>
            <Input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-muted border-nexara-accent/50"
            />
          </div>
          <Button
            type="submit"
            className="w-full game-button"
            disabled={isLoggingIn}
          >
            {isLoggingIn ? "Authenticating..." : "Login as Admin"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
