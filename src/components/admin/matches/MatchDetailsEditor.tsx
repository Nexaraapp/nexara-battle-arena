
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { logAdminAction } from "@/utils/adminUtils";
import { updateMatchWithRoomInfo } from "@/utils/match/matchmakingOperations";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  entry_fee: z.coerce.number().min(0, "Entry fee must be at least 0"),
  slots: z.coerce.number().min(2, "Match must have at least 2 slots"),
  first_prize: z.coerce.number().min(0, "First prize must be at least 0").optional(),
  second_prize: z.coerce.number().min(0, "Second prize must be at least 0").optional(),
  third_prize: z.coerce.number().min(0, "Third prize must be at least 0").optional(),
  coins_per_kill: z.coerce.number().min(0, "Coins per kill must be at least 0").optional(),
  room_id: z.string().optional(),
  room_password: z.string().optional(),
  status: z.string(),
  mode: z.string().optional(),
  type: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

interface MatchDetailsEditorProps {
  matchId: string;
  open: boolean;
  onClose: () => void;
}

export default function MatchDetailsEditor({ matchId, open, onClose }: MatchDetailsEditorProps) {
  const [loading, setLoading] = useState(false);
  const [match, setMatch] = useState<any>(null);
  const { user } = useAuth();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      entry_fee: 0,
      slots: 2,
      first_prize: 0,
      second_prize: 0,
      third_prize: 0,
      coins_per_kill: 0,
      room_id: "",
      room_password: "",
      status: "upcoming",
      mode: "",
      type: "one_vs_one",
    },
  });

  useEffect(() => {
    if (matchId && open) {
      fetchMatchDetails();
    }
  }, [matchId, open]);

  const fetchMatchDetails = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("matches")
        .select("*")
        .eq("id", matchId)
        .single();

      if (error) throw error;

      setMatch(data);
      form.reset({
        title: data.title || "",
        description: data.description || "",
        entry_fee: data.entry_fee || 0,
        slots: data.slots || 2,
        first_prize: data.first_prize || 0,
        second_prize: data.second_prize || 0,
        third_prize: data.third_prize || 0,
        coins_per_kill: data.coins_per_kill || 0,
        room_id: data.room_id || "",
        room_password: data.room_password || "",
        status: data.status || "upcoming",
        mode: data.mode || "",
        type: data.type || "one_vs_one",
      });
    } catch (error) {
      console.error("Error fetching match details:", error);
      toast.error("Failed to load match details");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      // Update the match in the database
      const { error } = await supabase
        .from("matches")
        .update({
          title: values.title,
          description: values.description,
          entry_fee: values.entry_fee,
          slots: values.slots,
          first_prize: values.first_prize,
          second_prize: values.second_prize,
          third_prize: values.third_prize,
          coins_per_kill: values.coins_per_kill,
          room_id: values.room_id,
          room_password: values.room_password,
          status: values.status,
          mode: values.mode,
          type: values.type,
        })
        .eq("id", matchId);

      if (error) throw error;

      // If room info was updated, also update it in PlayFab
      if (values.room_id && values.room_password) {
        const updated = await updateMatchWithRoomInfo(
          matchId,
          values.room_id,
          values.room_password
        );
        
        if (!updated) {
          toast.warning("Match updated in database but PlayFab update failed");
        }
      }

      await logAdminAction(
        user?.id || "",
        "Updated Match",
        `Updated match ${matchId} details including room information`
      );

      toast.success("Match details updated successfully");
      onClose();
    } catch (error) {
      console.error("Error updating match:", error);
      toast.error("Failed to update match details");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Match Details</DialogTitle>
        </DialogHeader>

        {loading && !match ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Match Title</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter match title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="upcoming">Upcoming</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Match description"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Match Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select match type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="one_vs_one">1v1</SelectItem>
                          <SelectItem value="four_vs_four">4v4</SelectItem>
                          <SelectItem value="battle_royale_26_50">
                            Battle Royale
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Game Mode</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Mode (e.g. TPP, FPP)"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="entry_fee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Entry Fee (coins)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          min={0}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slots"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Slots</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          min={2}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="first_prize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>1st Prize (coins)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          min={0}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="second_prize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>2nd Prize (coins)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          min={0}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="third_prize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>3rd Prize (coins)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          min={0}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="coins_per_kill"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Coins per Kill</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        min={0}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="border-t pt-4 mt-4">
                <h3 className="font-medium mb-2">Room Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="room_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Room ID</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter room ID" />
                        </FormControl>
                        <FormDescription>
                          The unique identifier for the match room
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="room_password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Room Password</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter room password" />
                        </FormControl>
                        <FormDescription>
                          Password required for players to join
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
