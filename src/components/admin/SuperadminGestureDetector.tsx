
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface SuperadminGestureDetectorProps {}

interface UserSearchResult {
  id: string;
  email?: string;
}

// Define the User interface for Supabase auth users
interface SupabaseAuthUser {
  id: string;
  email?: string;
}

export const SuperadminGestureDetector: React.FC<SuperadminGestureDetectorProps> = () => {
  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [showDebugDialog, setShowDebugDialog] = useState(false);
  const [debugEmail, setDebugEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [userSearchResults, setUserSearchResults] = useState<UserSearchResult[]>([]);
  
  // Create a safe version of navigate that won't crash if not in Router context
  // We'll initialize it to a no-op function
  const navigate = typeof window !== "undefined" ? useNavigate() : ((_to: any) => {});

  useEffect(() => {
    const handleFastClicks = (e: MouseEvent) => {
      if (e.ctrlKey && e.altKey) {
        const currentTime = Date.now();
        if (currentTime - lastClickTime < 500) {
          setClickCount((prev) => prev + 1);
        } else {
          setClickCount(1);
        }
        setLastClickTime(currentTime);
      }
    };

    window.addEventListener("click", handleFastClicks);

    return () => {
      window.removeEventListener("click", handleFastClicks);
    };
  }, [lastClickTime]);

  useEffect(() => {
    if (clickCount >= 5) {
      setShowDebugDialog(true);
      setClickCount(0);
    }
  }, [clickCount]);

  const handleDebugEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDebugEmail(e.target.value);
  };

  const handleDebugSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!debugEmail.trim()) return;

    setLoading(true);

    try {
      // Check if email exists in auth.users
      const { data: users, error: userError } = await supabase.auth.admin.listUsers({
        page: 1, 
        perPage: 100
      });

      if (userError) {
        throw new Error(userError.message);
      }

      // Filter by email
      const foundUsers = users.users.filter(
        (user: SupabaseAuthUser) => user.email?.toLowerCase().includes(debugEmail.toLowerCase())
      );

      if (foundUsers.length === 0) {
        toast.error("No users found with that email");
        setUserSearchResults([]);
        setLoading(false);
        return;
      }

      setUserSearchResults(foundUsers.map((user: SupabaseAuthUser) => ({
        id: user.id,
        email: user.email
      })));
    } catch (error: any) {
      console.error("Error searching for user:", error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const makeSuperAdmin = async (userId: string) => {
    setLoading(true);
    try {
      // Check if user is already an admin
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", userId)
        .eq("role", "superadmin")
        .single();

      if (existingRole) {
        toast.info("User is already a Superadmin");
        setLoading(false);
        return;
      }

      // Insert the superadmin role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert([
          {
            user_id: userId,
            role: "superadmin",
          },
        ]);

      if (roleError) {
        throw new Error(roleError.message);
      }

      // Create a system log entry
      await supabase.from("system_logs").insert([
        {
          admin_id: userId,
          action: "Superadmin Created",
          details: "User was designated as a superadmin via debug menu",
        },
      ]);

      toast.success("Superadmin role assigned successfully!");
      setShowDebugDialog(false);
      
      // Only navigate if we're in a browser context with Router
      if (typeof window !== "undefined" && navigate) {
        try {
          navigate("/admin");
        } catch (error) {
          console.error("Navigation error:", error);
        }
      }
    } catch (error: any) {
      console.error("Error assigning superadmin role:", error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!showDebugDialog) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-lg p-6 max-w-md w-full border border-slate-700">
        <h2 className="text-xl font-bold mb-4">Superadmin Access</h2>
        <form onSubmit={handleDebugSubmit} className="mb-4">
          <input
            type="text"
            placeholder="Search user by email"
            value={debugEmail}
            onChange={handleDebugEmailChange}
            className="w-full p-2 bg-slate-800 border border-slate-700 rounded mb-2"
            disabled={loading}
          />
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setShowDebugDialog(false)}
              className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
        </form>

        {userSearchResults.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Results:</h3>
            <div className="max-h-48 overflow-y-auto">
              {userSearchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex justify-between items-center p-2 border-b border-slate-700 hover:bg-slate-800"
                >
                  <span>{user.email || "No email"}</span>
                  <button
                    onClick={() => makeSuperAdmin(user.id)}
                    className="px-3 py-1 bg-green-600 rounded hover:bg-green-700 text-sm"
                    disabled={loading}
                  >
                    Make Superadmin
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperadminGestureDetector;
