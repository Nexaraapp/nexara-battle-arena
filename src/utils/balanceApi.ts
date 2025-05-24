import { supabase } from "@/integrations/supabase/client";

export interface Balance {
  balance: number;
  realCoinsBalance: number;
}

export const getUserBalance = async (): Promise<Balance> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error("Not authenticated");
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/getUserBalance`,
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch balance");
    }

    return await response.json();
  } catch (error: any) {
    console.error("Error fetching balance:", error);
    throw new Error(error.message || "Failed to fetch balance");
  }
}; 