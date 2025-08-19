import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.19.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

interface FulfillRequest {
  session_id: string
}

serve(async (req) => {
  try {
    // CORS
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
        },
      })
    }

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: { 'Access-Control-Allow-Origin': '*' } })
    }

    // Auth
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response('Missing authorization header', { status: 401, headers: { 'Access-Control-Allow-Origin': '*' } })
    }
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return new Response('Unauthorized', { status: 401, headers: { 'Access-Control-Allow-Origin': '*' } })
    }

    const { session_id }: FulfillRequest = await req.json()
    if (!session_id) {
      return new Response('Missing session_id', { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } })
    }

    // Retrieve checkout session
    const session = await stripe.checkout.sessions.retrieve(session_id)
    if (!session) {
      return new Response('Session not found', { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } })
    }
    if (session.mode !== 'payment' || session.payment_status !== 'paid') {
      return new Response('Session not a paid one-time purchase', { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } })
    }

    const supabaseUserId = (session.metadata?.supabase_user_id || '') as string
    const bundleSku = (session.metadata?.bundle_sku || '') as 'LIGHT' | 'MEDIUM' | 'HEAVY' | ''
    if (!supabaseUserId || !bundleSku) {
      return new Response('Missing metadata for fulfillment', { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } })
    }

    // Ensure the session belongs to the same authed user
    if (supabaseUserId !== user.id) {
      return new Response('Session does not belong to user', { status: 403, headers: { 'Access-Control-Allow-Origin': '*' } })
    }

    // Idempotency: check if we already have an order for this session
    const { data: existingOrder } = await supabaseAdmin
      .from('stripe_orders')
      .select('checkout_session_id')
      .eq('checkout_session_id', session.id)
      .maybeSingle()

    if (!existingOrder) {
      // Insert order record
      await supabaseAdmin
        .from('stripe_orders')
        .insert({
          checkout_session_id: session.id,
          payment_intent_id: session.payment_intent as string,
          customer_id: session.customer as string,
          amount_subtotal: session.amount_subtotal || 0,
          amount_total: session.amount_total || 0,
          currency: session.currency || 'eur',
          payment_status: session.payment_status,
          status: 'completed',
        })
    }

    // Map bundle SKU -> credits
    let light = 0, medium = 0, heavy = 0
    if (bundleSku === 'LIGHT') {
      light = 300
    } else if (bundleSku === 'MEDIUM') {
      light = 300; medium = 200
    } else if (bundleSku === 'HEAVY') {
      light = 500; medium = 300; heavy = 150
    }

    if (light + medium + heavy === 0) {
      return new Response('Unknown bundle SKU', { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } })
    }

    // Credit tokens via RPC (idempotency via session order row)
    const { error: creditErr } = await supabaseAdmin.rpc('credit_tokens', {
      p_user_id: user.id,
      p_light: light,
      p_medium: medium,
      p_heavy: heavy,
    })
    if (creditErr) {
      console.error('credit_tokens failed:', creditErr)
      return new Response('Failed to credit tokens', { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } })
    }

    return new Response(JSON.stringify({ success: true, credited: { light, medium, heavy } }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  } catch (error) {
    console.error('Fulfill bundle error:', error)
    return new Response(JSON.stringify({ success: false, message: 'Fulfillment error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }
})


