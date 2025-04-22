
import { supabase } from "@/integrations/supabase/client";

export interface UserSearchResult {
  id: string;
  email: string;
}

interface SupabaseUser {
  id: string;
  email?: string;
  [key: string]: any;
}

export const searchUsers = async (searchTerm: string): Promise<UserSearchResult[]> => {
  try {
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError || !authData) {
      console.error("Error fetching users:", authError);
      throw new Error("Failed to search users");
    }
    
    const filteredUsers = authData.users.filter((user: SupabaseUser) => 
      user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return filteredUsers.slice(0, 10).map((user: SupabaseUser) => ({
      id: user.id,
      email: user.email || 'No email'
    }));
  } catch (error) {
    console.error("Error searching users:", error);
    throw error;
  }
};

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
