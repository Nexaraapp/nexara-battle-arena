
// Define user roles and auth-related utilities
import { supabase } from "@/integrations/supabase/client";

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPERADMIN = 'superadmin'
}

export interface AuthUser {
  id: string;
  email: string;
  role?: UserRole;
}

export const hasUserRole = async (userId: string, role: UserRole): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('role', role)
      .maybeSingle();
      
    if (error) {
      console.error("Error checking role:", error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error("Error in hasUserRole:", error);
    return false;
  }
};
