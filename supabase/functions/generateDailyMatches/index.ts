
// Import types from the new location if needed
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';

// Define match type enums that exactly match the database constraints
enum MatchType {
  BattleRoyale = "battle_royale",
  ClashSquad = "clash_squad",
  OneVOne = "1v1"  // Added this type to match the requested 1v1 matches
}

enum RoomMode {
  Solo = "solo",
  Duo = "duo",
  Squad = "squad",
  OneVOne = "1v1"  // Added this mode for 1v1 matches
}

enum RoomType {
  Normal = "normal",
  Sniper = "sniper_only",
  Pistol = "pistol_only",
  Melee = "melee_only",
  Custom = "custom"
}

serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { requested_by } = await req.json();

    if (!requested_by) {
      return new Response(
        JSON.stringify({ error: 'Missing user ID' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Match definitions with correct type values that match the database constraint
    // Using 1v1 matches as requested
    const matches = [
      { 
        type: "1v1",  // Use the correct type that matches database constraint
        entry_fee: 10, 
        prize: 18,    // Updated to 18 as specified
        slots: 2,     // 1v1 matches have 2 slots
        mode: "1v1", 
        room_type: "normal",
        first_prize: 18, // Winner gets all for 1v1
        second_prize: 0,
        third_prize: 0,
        coins_per_kill: 0
      },
      { 
        type: "1v1", 
        entry_fee: 10, 
        prize: 18, 
        slots: 2, 
        mode: "1v1", 
        room_type: "normal",
        first_prize: 18,
        second_prize: 0,
        third_prize: 0,
        coins_per_kill: 0
      },
      { 
        type: "1v1", 
        entry_fee: 10, 
        prize: 18, 
        slots: 2, 
        mode: "1v1", 
        room_type: "normal",
        first_prize: 18,
        second_prize: 0,
        third_prize: 0,
        coins_per_kill: 0
      },
      { 
        type: "1v1", 
        entry_fee: 10, 
        prize: 18, 
        slots: 2, 
        mode: "1v1", 
        room_type: "normal",
        first_prize: 18,
        second_prize: 0,
        third_prize: 0,
        coins_per_kill: 0
      },
      { 
        type: "1v1", 
        entry_fee: 10, 
        prize: 18, 
        slots: 2, 
        mode: "1v1", 
        room_type: "normal",
        first_prize: 18,
        second_prize: 0,
        third_prize: 0,
        coins_per_kill: 0
      }
    ];

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase URL or key');
    }

    // Use URL-based import for @supabase/supabase-js to fix the error
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.32.0");
    const supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // First, check if matches are already generated for today
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();
    
    const { data: existingMatches, error: checkError } = await supabaseClient
      .from('matches')
      .select('id, type, start_time')
      .gte('start_time', startOfDay)
      .lte('start_time', endOfDay);
      
    if (checkError) {
      console.error("Error checking existing matches:", checkError);
      return new Response(
        JSON.stringify({ error: "Failed to check existing matches" }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    // If we already have matches for today, don't create more duplicates
    if (existingMatches && existingMatches.length >= 5) {
      console.log("Default matches already generated for today");
      return new Response(
        JSON.stringify({ message: 'Daily matches already generated', count: 0 }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Get system settings for profit margin
    const { data: settings, error: settingsError } = await supabaseClient
      .from('system_settings')
      .select('match_profit_margin')
      .single();

    const profitMargin = settings?.match_profit_margin || 40; // Default to 40% if not set

    let createdCount = 0;
    const matchesToCreate = [];
    
    // Calculate start times for matches (5 PM, 6 PM, 7 PM, 8 PM, 9 PM)
    const matchTimes = [17, 18, 19, 20, 21];
    
    // Skip times that already have matches
    const existingTimes = new Set();
    if (existingMatches && existingMatches.length > 0) {
      existingMatches.forEach(match => {
        if (match.start_time) {
          const matchTime = new Date(match.start_time).getHours();
          existingTimes.add(matchTime);
        }
      });
    }
    
    for (let i = 0; i < matches.length; i++) {
      const matchTime = matchTimes[i];
      
      if (existingTimes.has(matchTime)) {
        console.log(`Match already exists for ${matchTime}:00`);
        continue;
      }
      
      const match = matches[i];
      
      // Calculate start time for this match
      const startTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), matchTime, 0, 0).toISOString();
      
      matchesToCreate.push({
        ...match,
        start_time: startTime,
        status: 'upcoming',
        created_by: requested_by,
        slots_filled: 0,
      });
    }

    // Insert new matches
    if (matchesToCreate.length > 0) {
      const { data, error: insertError } = await supabaseClient
        .from('matches')
        .insert(matchesToCreate)
        .select();
        
      if (insertError) {
        console.error("Error creating default matches:", insertError);
        return new Response(
          JSON.stringify({ error: "Failed to create matches: " + insertError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      
      // Log the action
      await supabaseClient
        .from('system_logs')
        .insert({
          admin_id: requested_by,
          action: 'Default Matches Generated',
          details: `Generated ${matchesToCreate.length} default matches for today`
        });
        
      console.log(`Created ${matchesToCreate.length} default matches`);
      createdCount = matchesToCreate.length;
    }

    return new Response(
      JSON.stringify({ message: 'Daily matches generated successfully', count: createdCount }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
