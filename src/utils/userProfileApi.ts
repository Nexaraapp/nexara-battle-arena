
import { supabase } from "@/integrations/supabase/client";

export interface UserProfile {
  id: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get a user's profile
 * @param userId User ID to fetch profile for
 */
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    // Since we don't have a user_profiles table yet, we'll return a simplified profile
    // based on auth.users data that we can access
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (userError || !userData) {
      console.error("Error fetching user:", userError);
      return null;
    }
    
    // Create a temporary profile based on auth user data
    const tempProfile: UserProfile = {
      id: userData.user.id,
      username: userData.user.email?.split('@')[0] || 'user',
      display_name: userData.user.user_metadata?.name || userData.user.email?.split('@')[0] || 'User',
      created_at: userData.user.created_at,
      updated_at: userData.user.updated_at || userData.user.created_at,
    };
    
    return tempProfile;
  } catch (error) {
    console.error("Error in getUserProfile:", error);
    return null;
  }
};

/**
 * Update a user's profile
 * @param userId User ID to update profile for
 * @param profileData Profile data to update
 */
export const updateUserProfile = async (
  userId: string, 
  profileData: Partial<UserProfile>
): Promise<UserProfile | null> => {
  try {
    // Since we don't have a user_profiles table yet, we'll use auth metadata instead
    const { data: userData, error: userError } = await supabase.auth.updateUser({
      data: {
        display_name: profileData.display_name,
        bio: profileData.bio
      }
    });
    
    if (userError || !userData) {
      console.error("Error updating user:", userError);
      return null;
    }
    
    // Create a temporary profile based on auth user data
    const tempProfile: UserProfile = {
      id: userData.user.id,
      username: userData.user.email?.split('@')[0] || 'user',
      display_name: userData.user.user_metadata?.display_name || userData.user.email?.split('@')[0] || 'User',
      bio: userData.user.user_metadata?.bio,
      created_at: userData.user.created_at,
      updated_at: new Date().toISOString(),
    };
    
    return tempProfile;
  } catch (error) {
    console.error("Error in updateUserProfile:", error);
    return null;
  }
};
