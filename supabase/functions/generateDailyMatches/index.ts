// Import types from the new location if needed
// Note: Edge functions don't share code with the frontend, so they should have their own implementation
import { serve } from 'std/server';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { requested_by } = await req.json()

    if (!requested_by) {
      return new Response(
        JSON.stringify({ error: 'Missing user ID' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const matches = [
      { type: 'BattleRoyale', entry_fee: 10, prize: 400, slots: 48 },
      { type: 'ClashSquad', entry_fee: 15, prize: 600, slots: 32 },
      { type: 'BattleRoyale', entry_fee: 20, prize: 800, slots: 48 },
      { type: 'ClashSquad', entry_fee: 25, prize: 1000, slots: 32 },
    ];

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase URL or key');
    }

    const supabaseClient = (await import('@supabase/supabase-js')).createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    let createdCount = 0;

    for (const match of matches) {
      // Check if a match with the same type was already created today
      const { data: existingMatch, error: selectError } = await supabaseClient
        .from('matches')
        .select('*')
        .eq('type', match.type)
        .gte('created_at', new Date().toISOString().split('T')[0]) // Check if created today
        .single();

      if (selectError) {
        console.error('Error checking existing match:', selectError);
        continue; // Skip to the next match
      }

      if (!existingMatch) {
        // Add created_by field
        const newMatch = {
          ...match,
          created_by: requested_by,
          status: 'upcoming',
          slots_filled: 0,
          start_time: new Date().toISOString(),
        };

        const { error: insertError } = await supabaseClient
          .from('matches')
          .insert([newMatch]);

        if (insertError) {
          console.error('Error creating match:', insertError);
        } else {
          createdCount++;
        }
      }
    }

    return new Response(
      JSON.stringify({ message: 'Daily matches generated successfully', count: createdCount }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
