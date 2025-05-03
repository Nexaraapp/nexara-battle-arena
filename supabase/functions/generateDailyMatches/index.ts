
// Import types from the new location if needed
// Note: Edge functions don't share code with the frontend, so they should have their own implementation
import { serve } from "std/server";
import { corsHeaders } from '../_shared/cors.ts';

// Define match types for the edge function
enum MatchType {
  BattleRoyale = "battle_royale",
  ClashSolo = "clash_solo",
  ClashDuo = "clash_duo",
  ClashSquad = "clash_squad"
}

enum RoomMode {
  Solo = "solo",
  Duo = "duo",
  Squad = "squad"
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
    const matches = [
      { 
        type: MatchType.BattleRoyale, 
        entry_fee: 10, 
        prize: 400, 
        slots: 48, 
        mode: RoomMode.Solo, 
        room_type: RoomType.Normal,
        first_prize: 240,
        second_prize: 120,
        third_prize: 40,
        coins_per_kill: 1
      },
      { 
        type: MatchType.ClashSquad, 
        entry_fee: 15, 
        prize: 600, 
        slots: 32, 
        mode: RoomMode.Squad, 
        room_type: RoomType.Normal,
        first_prize: 360,
        second_prize: 180,
        third_prize: 60,
        coins_per_kill: 0
      },
      { 
        type: MatchType.BattleRoyale, 
        entry_fee: 20, 
        prize: 800, 
        slots: 48, 
        mode: RoomMode.Duo, 
        room_type: RoomType.Normal,
        first_prize: 480,
        second_prize: 240,
        third_prize: 80,
        coins_per_kill: 2
      },
      { 
        type: MatchType.ClashSquad, 
        entry_fee: 25, 
        prize: 1000, 
        slots: 32, 
        mode: RoomMode.Squad, 
        room_type: RoomType.Normal,
        first_prize: 600,
        second_prize: 300,
        third_prize: 100,
        coins_per_kill: 0
      },
    ];

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase URL or key');
    }

    const supabaseClient = (await import('@supabase/supabase-js')).createClient(supabaseUrl, supabaseKey, {
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
      throw new Error("Failed to check existing matches");
    }
    
    // If we already have matches for today, don't create more duplicates
    if (existingMatches && existingMatches.length >= 4) {
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
    
    // Calculate start times for matches (5 PM, 6 PM, 7 PM, 8 PM)
    const matchTimes = [17, 18, 19, 20];
    
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
      const { error: insertError } = await supabaseClient
        .from('matches')
        .insert(matchesToCreate);
        
      if (insertError) {
        console.error("Error creating default matches:", insertError);
        throw new Error("Failed to create matches: " + insertError.message);
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
      status: 400,
    });
  }
});
