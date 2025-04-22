
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Check if user has admin role
 */
export const hasAdminRole = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('has_role', { 
      _user_id: userId,
      _role: 'admin'
    });
    
    if (error) {
      console.error("Error checking admin role:", error);
      return false;
    }
    
    return data || false;
  } catch (error) {
    console.error("Error in hasAdminRole:", error);
    return false;
  }
};

/**
 * Check if user has superadmin role
 */
export const hasSuperadminRole = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('has_role', { 
      _user_id: userId,
      _role: 'superadmin'
    });
    
    if (error) {
      console.error("Error checking superadmin role:", error);
      return false;
    }
    
    return data || false;
  } catch (error) {
    console.error("Error in hasSuperadminRole:", error);
    return false;
  }
};

/**
 * Create a new system log entry
 */
export const createSystemLog = async (adminId: string, action: string, details?: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('system_logs')
      .insert({
        admin_id: adminId,
        action,
        details,
        created_at: new Date().toISOString()
      });
    
    if (error) {
      console.error("Error creating system log:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in createSystemLog:", error);
    return false;
  }
};

/**
 * Search for users by email pattern
 */
export const searchUsersByEmail = async (emailPattern: string, limit = 10): Promise<any[]> => {
  try {
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError || !userData) {
      console.error("Error fetching users:", userError);
      throw new Error("Failed to search users");
    }
    
    // Filter users by email
    const filteredUsers = userData.users
      .filter(user => 
        typeof user.email === 'string' && 
        user.email.toLowerCase().includes(emailPattern.toLowerCase())
      )
      .map(user => ({
        id: user.id,
        email: user.email
      }))
      .slice(0, limit);
      
    return filteredUsers;
  } catch (error) {
    console.error("Error in searchUsersByEmail:", error);
    return [];
  }
};

/**
 * Process a topup request
 */
export const processTopupRequest = async (
  requestId: string,
  approve: boolean,
  adminId: string
): Promise<boolean> => {
  try {
    // Update the transaction status
    const { error: updateError } = await supabase
      .from('transactions')
      .update({ 
        status: approve ? 'completed' : 'rejected',
        admin_id: adminId
      })
      .eq('id', requestId);
      
    if (updateError) {
      console.error("Error updating transaction:", updateError);
      throw new Error("Failed to update transaction");
    }
    
    // Create system log
    await createSystemLog(
      adminId, 
      approve ? 'Topup Request Approved' : 'Topup Request Rejected',
      `${approve ? 'Approved' : 'Rejected'} topup request ID: ${requestId}`
    );
    
    return true;
  } catch (error) {
    console.error("Error in processTopupRequest:", error);
    return false;
  }
};

/**
 * Process a withdrawal request
 */
export const processWithdrawalRequest = async (
  requestId: string,
  approve: boolean,
  adminId: string,
  userId: string
): Promise<boolean> => {
  try {
    // Update the transaction status
    const { error: updateError } = await supabase
      .from('transactions')
      .update({ 
        status: approve ? 'completed' : 'rejected',
        admin_id: adminId
      })
      .eq('id', requestId);
      
    if (updateError) {
      console.error("Error updating transaction:", updateError);
      throw new Error("Failed to update transaction");
    }
    
    // Update the withdrawal status in the withdrawals table
    const { error: withdrawalError } = await supabase
      .from('withdrawals')
      .update({ 
        status: approve ? 'completed' : 'rejected'
      })
      .eq('user_id', userId);
      
    if (withdrawalError && withdrawalError.code !== 'PGRST116') {
      // Only log as error if it's not a "not found" error
      console.error("Error updating withdrawal record:", withdrawalError);
    }
    
    // Create system log
    await createSystemLog(
      adminId, 
      approve ? 'Withdrawal Request Approved' : 'Withdrawal Request Rejected',
      `${approve ? 'Approved' : 'Rejected'} withdrawal request ID: ${requestId} for user ${userId}`
    );
    
    return true;
  } catch (error) {
    console.error("Error in processWithdrawalRequest:", error);
    return false;
  }
};
