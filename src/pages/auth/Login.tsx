
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trophy } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Use Supabase authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        throw error;
      }
      
      toast.success("Login successful!");
      
      // Check if user has superadmin role
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .single();
        
      if (roleError) {
        console.error("Role check error:", roleError);
      } else if (roleData?.role === "superadmin") {
        // If superadmin, redirect to admin dashboard
        navigate("/admin");
        return;
      }
      
      // Regular user, redirect to home
      navigate("/");
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
            <Trophy className="h-12 w-12 text-nexara-accent animate-pulse-neon" />
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
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 bg-muted border-nexara-accent/30"
              />
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
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 bg-muted border-nexara-accent/30"
              />
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
    </div>
  );
};

export default Login;
