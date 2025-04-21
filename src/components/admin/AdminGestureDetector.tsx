
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
import { supabase } from "@/integrations/supabase/client";

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
      // Use Supabase authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        throw error;
      }

      // Check if user has admin role
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user?.id)
        .single();

      if (roleError) {
        console.error("Role check error:", roleError);
        toast.error("Failed to check user role.");
        return;
      }

      if (roleData?.role === "admin" || roleData?.role === "superadmin") {
        toast.success("Admin login successful");
        // Redirect to admin dashboard
        window.location.href = "/admin";
      } else {
        toast.error("Access denied: Not an admin.");
      }
    } catch (error: any) {
      console.error("Admin login error:", error);
      toast.error(error.message || "Login failed. Please try again.");
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
