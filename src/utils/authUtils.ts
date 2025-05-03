
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * User role enum
 */
export enum UserRole {
  PLAYER = "user",
  ADMIN = "admin",
  SUPERADMIN = "superadmin"
}

/**
 * Gets the user's current role
 */
export const getUserRole = async (userId: string): Promise<UserRole | null> => {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (error) {
      console.error("Error getting user role:", error);
      return null;
    }
    
    if (!data) return UserRole.PLAYER; // Default role is player
    
    return data.role as UserRole;
  } catch (error) {
    console.error("Error in getUserRole:", error);
    return null;
  }
};

/**
 * Sets the user role
 */
export const setUserRole = async (userId: string, role: UserRole): Promise<boolean> => {
  try {
    // Check if user already has a role
    const { data, error: checkError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (checkError) {
      console.error("Error checking user role:", checkError);
      return false;
    }
    
    if (data) {
      // Update existing role
      const { error: updateError } = await supabase
        .from('user_roles')
        .update({ role: role })
        .eq('user_id', userId);
        
      if (updateError) {
        console.error("Error updating user role:", updateError);
        return false;
      }
    } else {
      // Insert new role
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: role
        });
        
      if (insertError) {
        console.error("Error inserting user role:", insertError);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error in setUserRole:", error);
    return false;
  }
};

/**
 * Check if a user has a specific role
 */
export const checkUserHasRole = async (userId: string, role: UserRole): Promise<boolean> => {
  try {
    const userRole = await getUserRole(userId);
    
    if (!userRole) return false;
    
    // Superadmin has all permissions
    if (userRole === UserRole.SUPERADMIN) return true;
    
    // For admin role check
    if (role === UserRole.ADMIN && userRole === UserRole.ADMIN) return true;
    
    // Exact match for other roles
    return userRole === role;
  } catch (error) {
    console.error("Error in checkUserHasRole:", error);
    return false;
  }
};

/**
 * Check if a user is an admin
 */
export const checkUserIsAdmin = async (userId: string): Promise<boolean> => {
  return await checkUserHasRole(userId, UserRole.ADMIN) || await checkUserHasRole(userId, UserRole.SUPERADMIN);
};

/**
 * Check if a user is a superadmin
 */
export const checkUserIsSuperAdmin = async (userId: string): Promise<boolean> => {
  return await checkUserHasRole(userId, UserRole.SUPERADMIN);
};

/**
 * Register a new user with Supabase and set default values
 */
export const registerUser = async (email: string, password: string): Promise<{ success: boolean; userId?: string; message?: string }> => {
  try {
    // Sign up the user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error("Signup error:", error);
      return { success: false, message: error.message };
    }

    // Set the default role (PLAYER)
    if (data?.user) {
      // Special case: If this is the superadmin email, give them superadmin role
      if (email === 'dsouzaales06@gmail.com') {
        await setUserRole(data.user.id, UserRole.SUPERADMIN);
      } else {
        await setUserRole(data.user.id, UserRole.PLAYER);
      }

      return { success: true, userId: data.user.id };
    }

    return { success: false, message: "User registration failed." };
  } catch (error: any) {
    console.error("Error in registerUser:", error);
    return { success: false, message: error.message || "An unexpected error occurred." };
  }
};
