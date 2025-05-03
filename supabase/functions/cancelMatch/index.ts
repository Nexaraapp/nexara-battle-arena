
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create a Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the request body
    const { matchId, adminId } = await req.json();
    
    if (!matchId || !adminId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required parameters" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Begin transaction
    const transaction = async () => {
      // 1. Get match data
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single();
        
      if (matchError) {
        console.error("Error fetching match:", matchError);
        throw new Error("Match not found");
      }
      
      // 2. Get all paid participants
      const { data: entries, error: entriesError } = await supabase
        .from('match_entries')
        .select('*')
        .eq('match_id', matchId)
        .eq('paid', true);
        
      if (entriesError) {
        console.error("Error fetching match entries:", entriesError);
        throw new Error("Failed to get match entries");
      }
      
      // 3. Update match status to cancelled
      const { error: updateError } = await supabase
        .from('matches')
        .update({ status: 'cancelled' })
        .eq('id', matchId);
        
      if (updateError) {
        console.error("Error updating match status:", updateError);
        throw new Error("Failed to update match status");
      }
      
      // 4. Process refunds for each participant
      for (const entry of entries || []) {
        // Add refund transaction
        const { error: refundError } = await supabase
          .from('transactions')
          .insert({
            user_id: entry.user_id,
            amount: match.entry_fee,
            type: 'refund',
            status: 'completed',
            date: new Date().toISOString().split('T')[0],
            match_id: matchId,
            admin_id: adminId,
            notes: `Refund for cancelled match ${match.type}`
          });
          
        if (refundError) {
          console.error("Error creating refund transaction:", refundError);
          throw new Error(`Failed to process refund for user ${entry.user_id}`);
        }
        
        // Add notification for the user
        await supabase
          .from('notifications')
          .insert({
            user_id: entry.user_id,
            message: `Your match has been cancelled and your entry fee of ${match.entry_fee} coins has been refunded.`
          });
      }
      
      // 5. Log the admin action
      await supabase
        .from('system_logs')
        .insert({
          admin_id: adminId,
          action: 'Match Cancelled',
          details: `Cancelled match ${matchId} and refunded ${entries?.length || 0} participants`
        });
        
      return { success: true, refundedUsers: entries?.length || 0 };
    };
    
    // Execute the transaction
    const result = await transaction();
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
    
  } catch (error) {
    console.error("Error:", error.message);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
