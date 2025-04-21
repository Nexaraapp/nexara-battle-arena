
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Superadmin Seeder Utility (for development/initial setup only!)
 */
export const CreateSuperadminUtility = () => {
  const [status, setStatus] = useState<null | string>(null);
  const [customEmail, setCustomEmail] = useState("");
  const [customPassword, setCustomPassword] = useState("");
  
  const SUPERADMIN_EMAIL = "dsouzaales06@gmail.com";
  const SUPERADMIN_PASSWORD = "23july2023"; // Updated password to be more secure

  const createSuperadmin = async (email: string, password: string) => {
    setStatus(`Working on creating superadmin for ${email}...`);

    try {
      // 1. Try to sign up the user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (signUpError && !signUpError.message.includes("User already registered")) {
        setStatus(`Failed to sign up: ${signUpError.message}`);
        toast.error(`Sign up failed: ${signUpError.message}`);
        return;
      }

      // Find the user id
      let userId = signUpData?.user?.id;
      
      if (!userId) {
        // Try to get user via login if already registered
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });
        
        if (signInError) {
          setStatus(`Login error: ${signInError.message}`);
          toast.error(`Login failed: ${signInError.message}`);
          return;
        }
        
        userId = signInData?.user?.id;
      }
      
      if (!userId) {
        setStatus("Failed to get user ID. Please try again.");
        toast.error("User creation/login failed");
        return;
      }

      // 2. Assign superadmin role in user_roles
      const { error: insertRoleError } = await supabase
        .from("user_roles")
        .upsert([{ user_id: userId, role: "superadmin" }], { 
          onConflict: 'user_id,role',
          ignoreDuplicates: true 
        });

      if (insertRoleError) {
        setStatus(`Failed to assign role: ${insertRoleError.message}`);
        toast.error(`Role assignment failed: ${insertRoleError.message}`);
        return;
      }

      setStatus("Superadmin account created and assigned successfully!");
      toast.success(`Superadmin created for ${email}! You can now log in with these credentials.`);
    } catch (error: any) {
      setStatus(`Unexpected error: ${error.message}`);
      toast.error(`Error: ${error.message}`);
    }
  };
  
  useEffect(() => {
    // Create the default superadmin on component mount
    createSuperadmin(SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD);
  }, []);

  const handleCustomSuperadminCreation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail || !customPassword) {
      toast.error("Email and password are required");
      return;
    }
    createSuperadmin(customEmail, customPassword);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-nexara-bg text-white">
      <h1 className="text-2xl font-bold mb-4 text-nexara-accent">Superadmin Seeder Utility</h1>
      <div className="p-6 rounded-lg bg-card border border-nexara-accent/50 max-w-md w-full">
        <p className="mb-4">
          <span className="font-bold">Status:</span> {status || "Ready."}
        </p>
        <div className="mt-6 p-4 bg-muted rounded-md border border-nexara-accent/30">
          <p className="mb-2 font-medium">Default Superadmin Credentials:</p>
          <p>Email: <span className="text-nexara-accent">{SUPERADMIN_EMAIL}</span></p>
          <p>Password: <span className="text-nexara-accent">*****</span></p>
        </div>
        
        <div className="mt-6">
          <h2 className="text-lg font-medium mb-2">Create Custom Superadmin</h2>
          <form onSubmit={handleCustomSuperadminCreation}>
            <div className="space-y-3">
              <div>
                <Input
                  type="email"
                  placeholder="Enter email"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="bg-muted border-nexara-accent/30"
                />
              </div>
              <div>
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={customPassword}
                  onChange={(e) => setCustomPassword(e.target.value)}
                  className="bg-muted border-nexara-accent/30"
                />
              </div>
              <Button type="submit" className="w-full game-button">
                Create Custom Superadmin
              </Button>
            </div>
          </form>
        </div>
        
        <p className="mt-6 text-sm text-gray-400">
          Visit the login page and try the credentials above, or trigger the superadmin login by tapping the logo 7 times.
        </p>
      </div>
    </div>
  );
};
