
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Helper function to set a user as admin
export const setUserAsAdmin = async (email: string, adminId: string): Promise<boolean> => {
  try {
    // First find the user by email
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error("Error finding user:", userError);
      toast.error("Failed to find user");
      return false;
    }
    
    const user = userData?.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      toast.error("User not found");
      return false;
    }
    
    // Check if user is already an admin
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();
      
    if (existingRole?.role === 'admin') {
      toast.error("User is already an admin");
      return false;
    }
    
    // Insert or update user role
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: user.id,
        role: 'admin'
      }, { onConflict: 'user_id' });
      
    if (roleError) {
      console.error("Error setting admin role:", roleError);
      toast.error("Failed to set admin role");
      return false;
    }
    
    // Log admin action
    await supabase
      .from('system_logs')
      .insert({
        admin_id: adminId,
        action: 'Admin Created',
        details: `Set ${email} as admin`
      });
      
    toast.success(`Successfully set ${email} as admin`);
    return true;
  } catch (error) {
    console.error("Error in setUserAsAdmin:", error);
    toast.error("An unexpected error occurred");
    return false;
  }
};

// Helper function to update match room details
export const updateMatchRoomDetails = async (
  matchId: string, 
  roomId: string, 
  roomPassword: string,
  adminId: string
): Promise<boolean> => {
  try {
    // Update the match
    const { error } = await supabase
      .from('matches')
      .update({ 
        room_id: roomId,
        room_password: roomPassword,
        status: 'active'
      })
      .eq('id', matchId);
      
    if (error) {
      console.error("Error updating match:", error);
      toast.error("Failed to update match");
      return false;
    }
    
    // Log admin action
    await supabase
      .from('system_logs')
      .insert({
        admin_id: adminId,
        action: 'Room Details Updated',
        details: `Updated room details for match ${matchId}`
      });
      
    return true;
  } catch (error) {
    console.error("Error in updateMatchRoomDetails:", error);
    toast.error("An unexpected error occurred");
    return false;
  }
};

// Helper function to get system settings
export const getSystemSettings = async () => {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .single();
      
    if (error) {
      console.error("Error fetching system settings:", error);
      return {
        requireAdForWithdrawal: false,
        matchProfitMargin: 40
      };
    }
    
    return {
      requireAdForWithdrawal: data.require_ad_for_withdrawal,
      matchProfitMargin: data.match_profit_margin
    };
  } catch (error) {
    console.error("Error in getSystemSettings:", error);
    return {
      requireAdForWithdrawal: false,
      matchProfitMargin: 40
    };
  }
};

// Helper function to update system settings
export const updateSystemSettings = async (
  settings: { 
    requireAdForWithdrawal: boolean;
    matchProfitMargin: number;
  },
  adminId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('system_settings')
      .update({
        require_ad_for_withdrawal: settings.requireAdForWithdrawal,
        match_profit_margin: settings.matchProfitMargin,
        updated_at: new Date().toISOString()
      })
      .eq('id', '1'); // Assuming there's only one settings row
      
    if (error) {
      console.error("Error updating system settings:", error);
      toast.error("Failed to update system settings");
      return false;
    }
    
    // Log admin action
    await supabase
      .from('system_logs')
      .insert({
        admin_id: adminId,
        action: 'System Settings Updated',
        details: `Updated system settings`
      });
      
    return true;
  } catch (error) {
    console.error("Error in updateSystemSettings:", error);
    toast.error("An unexpected error occurred");
    return false;
  }
};
