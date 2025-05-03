
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserRole } from "./authUtils";

export interface UserSearchResult {
  id: string;
  email: string;
}

export const setUserAsAdmin = async (
  userId: string | { email: string }, 
  byAdminId: string
): Promise<boolean> => {
  try {
    let targetUserId = typeof userId === 'string' ? userId : '';
    
    // If email was provided instead of ID, look up the user ID
    if (typeof userId === 'object' && userId.email) {
      // Since we can't directly query auth.users table from client,
      // we need to check in user_roles table or other tables to find the user ID
      // This is a simplification - in production you might want to use a Supabase Edge Function
      
      // For this example, we'll prompt an error message to use IDs directly
      toast.error("Email lookup not implemented. Please use user ID directly.");
      return false;
    }
    
    if (!targetUserId) {
      toast.error("Invalid user ID or email");
      return false;
    }
    
    // Check if the user already has the admin role
    const { data, error: checkError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('role', UserRole.ADMIN)
      .maybeSingle();
      
    if (checkError) {
      console.error("Error checking admin role:", checkError);
      toast.error("Failed to check current user role");
      return false;
    }
    
    // If user already has admin role, do nothing
    if (data) {
      toast.info("User is already an admin");
      return true;
    }
    
    // Add admin role to the user
    const { error: insertError } = await supabase
      .from('user_roles')
      .insert({
        user_id: targetUserId,
        role: UserRole.ADMIN
      });
      
    if (insertError) {
      console.error("Error setting user as admin:", insertError);
      toast.error("Failed to set user as admin");
      return false;
    }
    
    // Log the admin action
    await supabase
      .from('system_logs')
      .insert({
        admin_id: byAdminId,
        action: 'Admin Role Assigned',
        details: `Assigned admin role to user ${targetUserId}`
      });
      
    toast.success("User has been set as admin");
    return true;
  } catch (error) {
    console.error("Error in setUserAsAdmin:", error);
    toast.error("An unexpected error occurred");
    return false;
  }
};

/**
 * Remove admin role from a user
 */
export const removeUserAsAdmin = async (
  userId: string, 
  byAdminId: string
): Promise<boolean> => {
  try {
    // Delete the admin role from the user
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', UserRole.ADMIN);
      
    if (error) {
      console.error("Error removing admin role:", error);
      toast.error("Failed to remove admin role");
      return false;
    }
    
    // Log the admin action
    await supabase
      .from('system_logs')
      .insert({
        admin_id: byAdminId,
        action: 'Admin Role Removed',
        details: `Removed admin role from user ${userId}`
      });
      
    toast.success("Admin role has been removed from user");
    return true;
  } catch (error) {
    console.error("Error in removeUserAsAdmin:", error);
    toast.error("An unexpected error occurred");
    return false;
  }
};
