
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Superadmin Seeder Utility (for development/initial setup only!)
 */
const SUPERADMIN_EMAIL = "dsouzaales06@gmail.com";
const SUPERADMIN_PASSWORD = "23july2023"; // Updated password to be more secure

export const CreateSuperadminUtility = () => {
  const [status, setStatus] = useState<null | string>(null);

  useEffect(() => {
    const createSuperadmin = async () => {
      setStatus("Working...");

      try {
        // 1. Try to sign up the user
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: SUPERADMIN_EMAIL,
          password: SUPERADMIN_PASSWORD,
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
            email: SUPERADMIN_EMAIL,
            password: SUPERADMIN_PASSWORD,
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
        toast.success("Superadmin created! You can now log in with these credentials.");
      } catch (error: any) {
        setStatus(`Unexpected error: ${error.message}`);
        toast.error(`Error: ${error.message}`);
      }
    };
    
    createSuperadmin();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-nexara-bg text-white">
      <h1 className="text-2xl font-bold mb-4 text-nexara-accent">Superadmin Seeder Utility</h1>
      <div className="p-6 rounded-lg bg-card border border-nexara-accent/50 max-w-md w-full">
        <p className="mb-4">
          <span className="font-bold">Status:</span> {status || "Ready."}
        </p>
        <div className="mt-6 p-4 bg-muted rounded-md border border-nexara-accent/30">
          <p className="mb-2 font-medium">Superadmin Credentials:</p>
          <p>Email: <span className="text-nexara-accent">{SUPERADMIN_EMAIL}</span></p>
          <p>Password: <span className="text-nexara-accent">*****</span></p>
        </div>
        <p className="mt-6 text-sm text-gray-400">
          Visit the login page and try the credentials above, or trigger the superadmin login by tapping the logo 7 times.
        </p>
      </div>
    </div>
  );
};
