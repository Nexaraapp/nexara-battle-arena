
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Match, MatchStatus, MatchType, RoomMode, RoomType } from '@/utils/matchTypes';
import { useAuth } from '@/hooks/useAuth';

const formSchema = z.object({
  title: z.string().optional(),
  type: z.string(),
  mode: z.string(),
  room_type: z.string(),
  entry_fee: z.coerce.number().int().positive(),
  prize: z.coerce.number().int().positive(),
  slots: z.coerce.number().int().positive(),
  room_id: z.string().optional(),
  room_password: z.string().optional(),
  status: z.string(),
  first_prize: z.coerce.number().int().optional(),
  second_prize: z.coerce.number().int().optional(),
  third_prize: z.coerce.number().int().optional(),
  coins_per_kill: z.coerce.number().int().min(0).optional(),
});

interface MatchEditorProps {
  match?: Match | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const MatchEditor = ({ match, isOpen, onClose, onSave }: MatchEditorProps) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: match?.title || '',
      type: match?.type || MatchType.BattleRoyale,
      mode: match?.mode || RoomMode.Solo,
      room_type: match?.room_type || RoomType.Normal,
      entry_fee: match?.entry_fee || 10,
      prize: match?.prize || 400,
      slots: match?.slots || 48,
      room_id: match?.room_id || '',
      room_password: match?.room_password || '',
      status: match?.status || MatchStatus.Upcoming,
      first_prize: match?.first_prize || 0,
      second_prize: match?.second_prize || 0,
      third_prize: match?.third_prize || 0,
      coins_per_kill: match?.coins_per_kill || 0,
    },
  });

  // Update form when match changes
  useEffect(() => {
    if (match) {
      form.reset({
        title: match.title || '',
        type: match.type,
        mode: match.mode || RoomMode.Solo,
        room_type: match.room_type || RoomType.Normal,
        entry_fee: match.entry_fee,
        prize: match.prize,
        slots: match.slots,
        room_id: match.room_id || '',
        room_password: match.room_password || '',
        status: match.status,
        first_prize: match.first_prize || 0,
        second_prize: match.second_prize || 0,
        third_prize: match.third_prize || 0,
        coins_per_kill: match.coins_per_kill || 0,
      });
    } else {
      form.reset({
        title: '',
        type: MatchType.BattleRoyale,
        mode: RoomMode.Solo,
        room_type: RoomType.Normal,
        entry_fee: 10,
        prize: 400,
        slots: 48,
        room_id: '',
        room_password: '',
        status: MatchStatus.Upcoming,
        first_prize: 240,
        second_prize: 120,
        third_prize: 40,
        coins_per_kill: 5,
      });
    }
  }, [match, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast.error("You must be logged in to edit matches");
      return;
    }

    setIsSubmitting(true);
    try {
      if (match) {
        // Update existing match
        const { error } = await supabase
          .from('matches')
          .update(values)
          .eq('id', match.id);

        if (error) throw error;
        
        // Log the admin action
        await supabase
          .from('system_logs')
          .insert({
            admin_id: user.id,
            action: 'Match Updated',
            details: `Updated match ${match.id}`
          });
          
        toast.success("Match updated successfully");
      } else {
        // Create new match
        const { error } = await supabase
          .from('matches')
          .insert({
            ...values,
            created_by: user.id,
            slots_filled: 0,
          });

        if (error) throw error;
        
        // Log the admin action
        await supabase
          .from('system_logs')
          .insert({
            admin_id: user.id,
            action: 'Match Created',
            details: `Created new ${values.type} match`
          });
          
        toast.success("Match created successfully");
      }

      onSave();
      onClose();
    } catch (error) {
      console.error("Error saving match:", error);
      toast.error("Failed to save match");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{match ? 'Edit Match' : 'Create New Match'}</DialogTitle>
          <DialogDescription>
            {match ? 'Update the match details below.' : 'Fill in the details to create a new match.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Match Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter match title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Game Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select game type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={MatchType.BattleRoyale}>Battle Royale</SelectItem>
                        <SelectItem value={MatchType.ClashSquad}>Clash Squad</SelectItem>
                        <SelectItem value={MatchType.ClashDuo}>Clash Duo</SelectItem>
                        <SelectItem value={MatchType.ClashSolo}>Clash Solo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="mode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room Mode</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select mode" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={RoomMode.Solo}>Solo</SelectItem>
                        <SelectItem value={RoomMode.Duo}>Duo</SelectItem>
                        <SelectItem value={RoomMode.Squad}>Squad</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="room_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select room type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={RoomType.Normal}>Normal</SelectItem>
                        <SelectItem value={RoomType.Sniper}>Sniper Only</SelectItem>
                        <SelectItem value={RoomType.Pistol}>Pistol Only</SelectItem>
                        <SelectItem value={RoomType.Melee}>Melee Only</SelectItem>
                        <SelectItem value={RoomType.Custom}>Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="entry_fee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entry Fee (coins)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
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
                    <FormLabel>Max Players</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="prize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Prize Pool</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="first_prize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>1st Prize</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
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
                    <FormLabel>2nd Prize</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
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
                    <FormLabel>3rd Prize</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
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
                  <FormLabel>Coins Per Kill</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="room_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room ID</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter room ID" {...field} />
                    </FormControl>
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
                      <Input placeholder="Enter password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Match Status</FormLabel>
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
                      <SelectItem value={MatchStatus.Upcoming}>Upcoming</SelectItem>
                      <SelectItem value={MatchStatus.Active}>Active</SelectItem>
                      <SelectItem value={MatchStatus.Completed}>Completed</SelectItem>
                      <SelectItem value={MatchStatus.Cancelled}>Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button variant="outline" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : match ? 'Update Match' : 'Create Match'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
