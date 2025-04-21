
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Superadmin Seeder Utility (for development/initial setup only!)
 */
const SUPERADMIN_EMAIL = "dsouzaales06@gmail.com";
const SUPERADMIN_PASSWORD = "23july";

export const CreateSuperadminUtility = () => {
  const [status, setStatus] = useState<null | string>(null);

  useEffect(() => {
    const createSuperadmin = async () => {
      setStatus("Working...");

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

      // Find the user id (works even if already registered)
      let userId = signUpData?.user?.id;
      if (!userId) {
        // Get the user by email (for already registered cases)
        const { data: users, error: fetchError } = await supabase
          .from("user_roles")
          .select("user_id")
          .limit(1);
        if (fetchError) {
          setStatus(`Fetch user error: ${fetchError.message}`);
          toast.error(`User query error: ${fetchError.message}`);
          return;
        }
        // Supabase does not expose a direct way, so must login and get id
        // Or require running this right after signup.
        setStatus(`User already exists. Please login as this user to get user_id and assign manually.`);
        toast.warning(
          "User exists. To promote, log in as this user, check their session id, and add 'superadmin' to user_roles."
        );
        return;
      }

      // 2. Assign role in user_roles
      const { error: insertRoleError } = await supabase
        .from("user_roles")
        .insert([{ user_id: userId, role: "superadmin" }]);

      if (insertRoleError?.message?.includes("duplicate key value")) {
        setStatus("Superadmin already assigned!");
        toast.success("Superadmin already set up!");
        return;
      }
      if (insertRoleError) {
        setStatus(`Failed to assign role: ${insertRoleError.message}`);
        toast.error(`Role grant failed: ${insertRoleError.message}`);
        return;
      }

      setStatus("Superadmin account created and assigned successfully!");
      toast.success("Superadmin created!");
    };
    createSuperadmin();
  }, []);

  return (
    <div className="p-8 text-center">
      <h1 className="text-xl font-bold">Superadmin Seeder Utility</h1>
      <p>Status: {status || "Ready."}</p>
    </div>
  );
};

// To use: Temporarily mount <CreateSuperadminUtility /> in your app where only you can access.
