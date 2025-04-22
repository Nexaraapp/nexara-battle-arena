
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { searchUsers } from "@/utils/adminUtils";

interface SuperadminGestureDetectorProps {}

interface UserSearchResult {
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
  
  // Create a safe navigation function
  let navigate: ((to: string) => void) | undefined;
  try {
    const navFunction = useNavigate();
    navigate = (to: string) => navFunction(to);
  } catch (error) {
    console.log("Navigation not available in this context");
  }

  useEffect(() => {
    const handleFastClicks = (e: MouseEvent) => {
      // Check for Alt key
      if (e.altKey) {
        const currentTime = Date.now();
        if (currentTime - lastClickTime < 500) {
          setClickCount((prev) => prev + 1);
        } else {
          setClickCount(1);
        }
        setLastClickTime(currentTime);
      }
    };

    // Also add a special trigger for logo clicks
    const logoElement = document.getElementById("app-logo");
    if (logoElement) {
      const handleLogoClick = () => {
        setClickCount((prev) => prev + 1);
      };
      logoElement.addEventListener("click", handleLogoClick);
      return () => {
        window.removeEventListener("click", handleFastClicks);
        logoElement.removeEventListener("click", handleLogoClick);
      };
    }

    window.addEventListener("click", handleFastClicks);
    return () => {
      window.removeEventListener("click", handleFastClicks);
    };
  }, [lastClickTime]);

  useEffect(() => {
    // Require only 3 clicks to trigger
    if (clickCount >= 3) {
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
      // Use the searchUsers utility function to find users by email
      const users = await searchUsers(debugEmail);
      
      if (users.length === 0) {
        toast.error("No users found with that email");
        setUserSearchResults([]);
        setLoading(false);
        return;
      }

      setUserSearchResults(users);
    } catch (error: any) {
      console.error("Error searching for user:", error);
      toast.error(error.message || "Failed to search for users");
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
      
      // Navigate safely if function exists
      if (navigate) {
        navigate("/admin");
      } else {
        // Fallback to window location change if navigate doesn't exist
        window.location.href = "/admin";
      }
    } catch (error: any) {
      console.error("Error assigning superadmin role:", error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={showDebugDialog} onOpenChange={setShowDebugDialog}>
      <DialogContent className="bg-nexara-bg border border-nexara-accent text-white max-w-md w-full">
        <DialogHeader>
          <DialogTitle className="text-xl text-nexara-accent">Superadmin Access</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleDebugSubmit} className="mb-4 space-y-4">
          <input
            type="text"
            placeholder="Search user by email"
            value={debugEmail}
            onChange={handleDebugEmailChange}
            className="w-full p-2 bg-slate-800 border border-nexara-accent/30 rounded mb-2 text-white"
            disabled={loading}
            autoFocus
          />
          
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setShowDebugDialog(false)}
              className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700 text-white"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-nexara-accent rounded hover:bg-nexara-accent2 text-white"
              disabled={loading}
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
        </form>

        {userSearchResults.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2 text-white">Results:</h3>
            <div className="max-h-48 overflow-y-auto">
              {userSearchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex justify-between items-center p-2 border-b border-nexara-accent/30 hover:bg-nexara-accent/10"
                >
                  <span className="text-white">{user.email || "No email"}</span>
                  <button
                    onClick={() => makeSuperAdmin(user.id)}
                    className="px-3 py-1 bg-nexara-accent rounded hover:bg-nexara-accent2 text-white text-sm"
                    disabled={loading}
                  >
                    Make Superadmin
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SuperadminGestureDetector;
