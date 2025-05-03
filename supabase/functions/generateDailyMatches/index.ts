
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Create Supabase client with admin privileges
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Check if matches already exist for today
    const { data: existingMatches, error: checkError } = await supabase
      .from('matches')
      .select('id, start_time')
      .gte('start_time', today.toISOString())
      .lt('start_time', tomorrow.toISOString());
      
    if (checkError) {
      throw new Error(`Error checking existing matches: ${checkError.message}`);
    }
    
    // If matches already exist for today, don't generate more
    if (existingMatches && existingMatches.length >= 5) {
      return new Response(
        JSON.stringify({ message: "Default matches already exist for today", count: existingMatches.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
    
    // Get system settings for profit margin
    const { data: settings, error: settingsError } = await supabase
      .from('system_settings')
      .select('match_profit_margin')
      .single();
      
    if (settingsError) {
      throw new Error(`Error fetching system settings: ${settingsError.message}`);
    }
    
    const profitMargin = settings?.match_profit_margin || 40; // Default to 40% if not set

    // Get a superadmin to attribute the matches to
    const { data: superadmin, error: adminError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'superadmin')
      .limit(1)
      .single();
      
    if (adminError || !superadmin) {
      throw new Error(`Error fetching superadmin user: ${adminError?.message || "No superadmin found"}`);
    }
    
    // Define match types and modes
    const MATCH_TYPES = {
      BATTLE_ROYALE: 'battle_royale',
      CLASH_SQUAD: 'clash_squad'
    };
    
    const ROOM_MODES = {
      SOLO: 'solo',
      DUO: 'duo',
      SQUAD: 'squad'
    };
    
    // Define default match configurations
    const defaultMatches = [
      {
        hour: 17, // 5 PM
        type: MATCH_TYPES.BATTLE_ROYALE,
        mode: ROOM_MODES.SOLO,
        entry_fee: 20,
        slots: 48,
        prize_pool: 800,
        title: "Solo Battle Royale"
      },
      {
        hour: 18, // 6 PM
        type: MATCH_TYPES.BATTLE_ROYALE,
        mode: ROOM_MODES.DUO,
        entry_fee: 30,
        slots: 48,
        prize_pool: 1200,
        title: "Duo Battle Royale"
      },
      {
        hour: 19, // 7 PM
        type: MATCH_TYPES.BATTLE_ROYALE,
        mode: ROOM_MODES.SQUAD,
        entry_fee: 40,
        slots: 48,
        prize_pool: 1600,
        title: "Squad Battle Royale"
      },
      {
        hour: 20, // 8 PM
        type: MATCH_TYPES.BATTLE_ROYALE,
        mode: ROOM_MODES.SOLO,
        entry_fee: 50,
        slots: 48,
        prize_pool: 2000,
        title: "Evening Solo Battle"
      },
      {
        hour: 21, // 9 PM
        type: MATCH_TYPES.CLASH_SQUAD,
        mode: ROOM_MODES.SQUAD,
        entry_fee: 60,
        slots: 48,
        prize_pool: 2400,
        title: "Night Clash Squad"
      },
    ];
    
    // Filter out matches that already exist at the same times
    const matchesToCreate = defaultMatches.filter(match => {
      if (!existingMatches) return true;
      
      return !existingMatches.some(em => {
        const matchDate = new Date(em.start_time);
        return matchDate.getHours() === match.hour;
      });
    });
    
    // Generate matches
    const matchInserts = matchesToCreate.map(match => {
      // Create start time
      const startTime = new Date(today);
      startTime.setHours(match.hour, 0, 0, 0);
      
      // Calculate prize distribution
      const firstPrize = Math.floor(match.prize_pool * 0.6);
      const secondPrize = Math.floor(match.prize_pool * 0.3);
      const thirdPrize = match.prize_pool - firstPrize - secondPrize;
      
      return {
        type: match.type,
        mode: match.mode,
        room_type: 'normal',
        slots: match.slots,
        entry_fee: match.entry_fee,
        prize: match.prize_pool,
        first_prize: firstPrize,
        second_prize: secondPrize,
        third_prize: thirdPrize,
        coins_per_kill: 5,
        start_time: startTime.toISOString(),
        status: 'upcoming',
        created_by: superadmin.user_id,
        title: match.title
      };
    });
    
    // Insert matches if any need to be created
    if (matchInserts.length > 0) {
      const { error: insertError } = await supabase
        .from('matches')
        .insert(matchInserts);
        
      if (insertError) {
        throw new Error(`Error creating default matches: ${insertError.message}`);
      }
      
      // Log the action
      await supabase
        .from('system_logs')
        .insert({
          admin_id: superadmin.user_id,
          action: 'Default Matches Created',
          details: `Auto-generated ${matchInserts.length} default matches for ${today.toISOString().split('T')[0]}`
        });
    }
    
    return new Response(
      JSON.stringify({ 
        message: "Successfully generated default matches", 
        count: matchInserts.length,
        matches: matchInserts
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
