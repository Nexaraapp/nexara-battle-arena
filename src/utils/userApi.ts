
import { supabase } from "@/integrations/supabase/client";

export const getUserInfo = async (userId: string): Promise<{ name?: string; email?: string }> => {
  try {
    const { data: userData } = await supabase.auth.admin.getUserById(userId);
    if (userData?.user) {
      return {
        name: userData.user.user_metadata?.name,
        email: userData.user.email
      };
    }
    const { data: profileData, error: profileError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('user_id', userId)
      .single();
    if (!profileError && profileData) {
      return {
        name: 'User ' + userId.substring(0, 6)
      };
    }
    return {};
  } catch (error) {
    console.error("Error in getUserInfo:", error);
    return {};
  }
};
