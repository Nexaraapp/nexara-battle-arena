import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the user ID from the Authorization header
    const authHeader = req.headers.get('Authorization')?.split('Bearer ')[1]
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Verify the user's JWT
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader)
    if (authError || !user) {
      throw new Error('Invalid token')
    }

    // Get all completed transactions for the user
    const { data: transactions, error: txError } = await supabaseClient
      .from('transactions')
      .select('amount, is_real_coins')
      .eq('user_id', user.id)
      .eq('status', 'completed')

    if (txError) {
      throw txError
    }

    // Calculate balances
    const balances = transactions.reduce((acc, tx) => ({
      total: acc.total + (tx.amount || 0),
      realCoins: acc.realCoins + (tx.is_real_coins ? (tx.amount || 0) : 0)
    }), { total: 0, realCoins: 0 })

    return new Response(
      JSON.stringify({
        balance: balances.total,
        realCoinsBalance: balances.realCoins
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
}) 