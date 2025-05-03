import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export enum UserRole {
  PLAYER = 'player',
  ADMIN = 'admin',
  SUPERADMIN = 'superadmin'
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: any;
}

// Function to register a new user
export const registerUser = async (
  email: string, 
  password: string,
  username?: string
): Promise<AuthResponse> => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username || email.split('@')[0]
        }
      }
    });
    
    if (error) {
      console.error("Registration error:", error);
      return { 
        success: false, 
        message: error.message || "Failed to register. Please try again." 
      };
    }
    
    // If registration is successful, create a user profile
    if (data?.user) {
      // Assign default player role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: data.user.id,
          role: UserRole.PLAYER
        });
      
      if (roleError) {
        console.error("Error assigning user role:", roleError);
      }
      
      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: data.user.id,
          username: username || email.split('@')[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (profileError) {
        console.error("Error creating user profile:", profileError);
      }
      
      // Create initial bonus coins transaction (10 free coins)
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: data.user.id,
          type: 'admin_reward',
          amount: 10,
          status: 'completed',
          notes: 'Welcome bonus',
          is_real_coins: false
        });
      
      if (transactionError) {
        console.error("Error creating welcome bonus transaction:", transactionError);
      }
    }
    
    return { 
      success: true, 
      message: "Registration successful! Please check your email to verify your account.",
      user: data.user
    };
  } catch (error: any) {
    console.error("Registration error:", error);
    return { 
      success: false, 
      message: error.message || "An unexpected error occurred. Please try again." 
    };
  }
};

// Function to login a user
export const loginUser = async (
  email: string, 
  password: string
): Promise<AuthResponse> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error("Login error:", error);
      return { 
        success: false, 
        message: error.message || "Failed to login. Please check your credentials." 
      };
    }
    
    // Automatically handle the dsouzaales06@gmail.com as superadmin
    if (email === 'dsouzaales06@gmail.com') {
      // Check if the user already has the superadmin role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .eq('role', UserRole.SUPERADMIN)
        .single();
      
      // If not, assign the superadmin role
      if (!roleData) {
        await supabase
          .from('user_roles')
          .upsert({
            user_id: data.user.id,
            role: UserRole.SUPERADMIN
          });
      }
    }
    
    return { 
      success: true, 
      message: "Login successful!",
      user: data.user
    };
  } catch (error: any) {
    console.error("Login error:", error);
    return { 
      success: false, 
      message: error.message || "An unexpected error occurred. Please try again." 
    };
  }
};

// Function to logout a user
export const logoutUser = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error("Logout error:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Logout error:", error);
    return false;
  }
};

// Function to check if a user has a specific role
export const hasUserRole = async (
  userId: string, 
  role: UserRole
): Promise<boolean> => {
  try {
    // Handle special case for dsouzaales06@gmail.com
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user?.email === 'dsouzaales06@gmail.com' && role === UserRole.SUPERADMIN) {
      return true;
    }
    
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', role)
      .maybeSingle();
      
    if (error) {
      console.error("Error checking user role:", error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error("Error in hasUserRole:", error);
    return false;
  }
};

// Function to get all roles of a user
export const getUserRoles = async (userId: string): Promise<UserRole[]> => {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);
      
    if (error) {
      console.error("Error fetching user roles:", error);
      return [];
    }
    
    return data?.map(r => r.role as UserRole) || [];
  } catch (error) {
    console.error("Error in getUserRoles:", error);
    return [];
  }
};
