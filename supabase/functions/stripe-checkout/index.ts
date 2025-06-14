import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.19.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

interface CheckoutRequest {
  price_id: string
  success_url: string
  cancel_url: string
}

async function getOrCreateCustomer(user: any): Promise<string> {
  // Check if customer already exists in our database
  const { data: existingCustomer } = await supabaseClient
    .from('stripe_customers')
    .select('customer_id')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single()

  if (existingCustomer) {
    return existingCustomer.customer_id
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email: user.email,
    metadata: {
      supabase_user_id: user.id,
    },
  })

  // Store customer in our database
  await supabaseClient
    .from('stripe_customers')
    .insert({
      user_id: user.id,
      customer_id: customer.id,
    })

  return customer.id
}

serve(async (req) => {
  try {
    // CORS headers
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
      return new Response('Method not allowed', { status: 405 })
    }

    // Get the authorization header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response('Missing authorization header', { status: 401 })
    }

    // Get user from auth token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)

    if (authError || !user) {
      console.error('Auth error:', authError)
      return new Response('Unauthorized', { status: 401 })
    }

    // Parse request body
    const { price_id, success_url, cancel_url }: CheckoutRequest = await req.json()

    if (!price_id || !success_url || !cancel_url) {
      return new Response('Missing required fields', { status: 400 })
    }

    // Get or create Stripe customer
    const customerId = await getOrCreateCustomer(user)

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: price_id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url,
      cancel_url,
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
        },
      },
      metadata: {
        supabase_user_id: user.id,
      },
    })

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
}) 