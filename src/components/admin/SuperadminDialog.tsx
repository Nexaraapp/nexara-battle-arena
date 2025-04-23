
import React, { useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { searchUsers } from "@/utils/adminUtils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Key } from "lucide-react";

interface UserSearchResult {
  id: string;
  email?: string;
}

interface SuperadminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Superadmin emails that should always be granted access
const SUPERADMIN_EMAILS = ["dsouzaales06@gmail.com"];
const SUPERADMIN_PIN = "1234"; // Simple PIN for confirmation (can be changed)

export const SuperadminDialog: React.FC<SuperadminDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const [debugEmail, setDebugEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [userSearchResults, setUserSearchResults] = useState<UserSearchResult[]>([]);
  const [showPinConfirmation, setShowPinConfirmation] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  
  const navigate = useNavigate();

  const handleDebugEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDebugEmail(e.target.value);
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPin(e.target.value);
  };

  const handleDebugSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!debugEmail.trim()) return;

    setLoading(true);

    try {
      // Check if email is in the superadmin list
      const isKnownSuperadmin = SUPERADMIN_EMAILS.some(
        email => email.toLowerCase() === debugEmail.toLowerCase()
      );

      // Search for users
      const users = await searchUsers(debugEmail);
      
      if (users.length === 0) {
        toast.error("No users found with that email");
        setUserSearchResults([]);
        return;
      }

      // Highlight the known superadmin email if it's in results
      const resultsWithHighlighting = users.map(user => ({
        ...user,
        isKnownSuperadmin: isKnownSuperadmin && 
          user.email?.toLowerCase() === debugEmail.toLowerCase()
      }));

      setUserSearchResults(resultsWithHighlighting);
    } catch (error: any) {
      console.error("Error searching for user:", error);
      toast.error(error.message || "Failed to search for users");
    } finally {
      setLoading(false);
    }
  };

  const confirmMakeSuperadmin = (userId: string) => {
    setSelectedUserId(userId);
    setShowPinConfirmation(true);
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;
    
    // Very basic PIN verification
    if (pin !== SUPERADMIN_PIN) {
      toast.error("Incorrect PIN");
      return;
    }
    
    setLoading(true);
    await makeSuperAdmin(selectedUserId);
    setShowPinConfirmation(false);
    setPin("");
  };

  const makeSuperAdmin = async (userId: string) => {
    setLoading(true);
    try {
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", userId)
        .eq("role", "superadmin")
        .single();

      if (existingRole) {
        toast.info("User is already a Superadmin");
        return;
      }

      const { error: roleError } = await supabase
        .from("user_roles")
        .insert([
          {
            user_id: userId,
            role: "superadmin",
          },
        ]);

      if (roleError) throw new Error(roleError.message);

      await supabase.from("system_logs").insert([
        {
          admin_id: userId,
          action: "Superadmin Created",
          details: "User was designated as a superadmin via logo gesture trigger"
        },
      ]);

      toast.success("Superadmin role assigned successfully!");
      onOpenChange(false);
      
      // Navigate to admin dashboard
      navigate("/admin");
    } catch (error: any) {
      console.error("Error assigning superadmin role:", error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // If PIN confirmation dialog is shown
  if (showPinConfirmation) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-nexara-bg border border-nexara-accent text-white max-w-md w-full">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2 text-nexara-accent">
              <Key className="h-5 w-5" />
              Superadmin Security
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div className="text-center">
              <p className="text-gray-300">Enter security PIN to confirm superadmin access</p>
            </div>
            
            <Input
              type="password"
              placeholder="Enter PIN"
              value={pin}
              onChange={handlePinChange}
              className="w-full p-2 bg-slate-800 border border-nexara-accent/30 rounded text-white"
              autoComplete="off"
              autoFocus
              disabled={loading}
              maxLength={4}
            />
            
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPinConfirmation(false)}
                disabled={loading}
                className="border-red-500 text-red-500 hover:bg-red-500/10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-nexara-accent hover:bg-nexara-accent2"
                disabled={loading || pin.length < 4}
              >
                {loading ? "Verifying..." : "Confirm"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  // Main superadmin dialog
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-nexara-bg border border-nexara-accent text-white max-w-md w-full">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2 text-nexara-accent">
            <Shield className="h-5 w-5" />
            Superadmin Access
          </DialogTitle>
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
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700/50"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-nexara-accent hover:bg-nexara-accent2 text-white"
              disabled={loading}
            >
              {loading ? "Searching..." : "Search"}
            </Button>
          </div>
        </form>

        {userSearchResults.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2 text-white">Results:</h3>
            <div className="max-h-48 overflow-y-auto">
              {userSearchResults.map((user: any) => (
                <div
                  key={user.id}
                  className={`flex justify-between items-center p-2 border-b border-nexara-accent/30 ${
                    user.isKnownSuperadmin ? 'bg-nexara-accent/20' : 'hover:bg-nexara-accent/10'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="text-white">{user.email || "No email"}</span>
                    {user.isKnownSuperadmin && (
                      <span className="ml-2 px-2 py-0.5 bg-nexara-accent text-xs rounded-full">
                        Known Superadmin
                      </span>
                    )}
                  </div>
                  <Button
                    onClick={() => confirmMakeSuperadmin(user.id)}
                    className="px-3 py-1 bg-nexara-accent rounded hover:bg-nexara-accent2 text-white text-sm"
                    disabled={loading}
                  >
                    Make Superadmin
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
