
import { supabase } from "@/integrations/supabase/client";

interface UserSearchResult {
  id: string;
  email?: string;
}

// Add any additional admin utility functions here
// This file can be expanded as needed for specific admin operations
export const searchUsers = async (searchTerm: string): Promise<UserSearchResult[]> => {
  try {
    // Get all users from Supabase auth
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error("Error fetching users:", userError);
      throw new Error("Failed to search users");
    }
    
    // Filter users by email containing the search term
    const filteredUsers = userData?.users
      ?.filter(user => 
        user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .map(user => ({
        id: user.id,
        email: user.email
      }))
      .slice(0, 10) || [];
      
    return filteredUsers;
  } catch (error) {
    console.error("Error in searchUsers:", error);
    return [];
  }
};

// Function to check if a user is an admin
export const checkUserIsAdmin = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();
      
    if (error) {
      return false;
    }
    
    return data?.role === 'admin' || data?.role === 'superadmin';
  } catch (error) {
    return false;
  }
};

// Function to check if a user is a superadmin
export const checkUserIsSuperAdmin = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();
      
    if (error) {
      return false;
    }
    
    return data?.role === 'superadmin';
  } catch (error) {
    return false;
  }
};

// Log admin action to system logs
export const logAdminAction = async (
  adminId: string, 
  action: string, 
  details?: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('system_logs')
      .insert({
        admin_id: adminId,
        action,
        details
      });
      
    if (error) {
      console.error("Error logging admin action:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in logAdminAction:", error);
    return false;
  }
};

// Check if a specific page is accessible to the current user
export const checkPageAccess = async (
  userId: string,
  requiredRole: 'admin' | 'superadmin' = 'admin'
): Promise<boolean> => {
  try {
    if (!userId) return false;
    
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();
      
    if (error) return false;
    
    if (requiredRole === 'superadmin') {
      return data?.role === 'superadmin';
    }
    
    return data?.role === 'admin' || data?.role === 'superadmin';
  } catch (error) {
    return false;
  }
};
