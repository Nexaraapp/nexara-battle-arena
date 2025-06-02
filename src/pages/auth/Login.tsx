
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trophy, Mail, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SuperadminGestureDetector } from "@/components/admin/SuperadminGestureDetector";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if already logged in
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // Already logged in, redirect to appropriate page
          navigate("/");
        }
      } catch (error) {
        console.error("Error checking session:", error);
      }
    };
    
    checkSession();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      console.log("Attempting login with:", { email });
      
      // Use Supabase authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error("Login error:", error);
        if (error.message.includes("Email not confirmed")) {
          toast.error("Please verify your email address first.");
        } else if (error.message.includes("Invalid login")) {
          toast.error("Invalid email or password. Please try again.");
        } else if (error.message.includes("Invalid API key")) {
          toast.error("Authentication service error. Please try again later.");
        } else {
          toast.error(error.message);
        }
        return;
      }
      
      console.log("Login successful:", data);
      toast.success("Login successful!");
      
      // Check if user has special role
      const checkUserRole = async () => {
        try {
          const { data: roleData, error: roleError } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", data.user.id)
            .single();
            
          if (roleData?.role === "superadmin" || roleData?.role === "admin") {
            // If admin or superadmin, redirect to admin dashboard
            navigate("/admin", { replace: true });
            return;
          }
          
          // Regular user, redirect to home
          navigate("/", { replace: true });
        } catch (roleCheckError) {
          console.error("Role check error:", roleCheckError);
          // Default to regular user flow if role check fails
          navigate("/", { replace: true });
        }
      };
      
      await checkUserRole();
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-nexara-bg">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <Trophy id="app-logo" className="h-12 w-12 text-nexara-accent animate-pulse-neon" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-white neon-text">
            Welcome Back!
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Enter your credentials to access your account
          </p>
        </div>
        
        <div className="mt-8 space-y-6 neon-border p-6 rounded-lg bg-card">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-muted border-nexara-accent/30"
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Password</Label>
                <Link 
                  to="/forgot-password" 
                  className="text-sm text-nexara-accent hover:text-nexara-accent2"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-muted border-nexara-accent/30"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="game-button w-full"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </div>
        
        <div className="text-center mt-4">
          <p className="text-sm text-gray-400">
            Don't have an account yet?{" "}
            <Link to="/register" className="text-nexara-accent hover:text-nexara-accent2 font-medium">
              Register now
            </Link>
          </p>
        </div>
      </div>
      
      {/* Add the SuperadminGestureDetector with our logo element ID */}
      <SuperadminGestureDetector logoElementId="app-logo" />
    </div>
  );
};

export default Login;
