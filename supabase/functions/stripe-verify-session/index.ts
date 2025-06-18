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

interface VerifySessionRequest {
  session_id: string
}

async function syncSubscriptionFromSession(session: Stripe.Checkout.Session) {
  console.log('Syncing subscription from session:', session.id)

  try {
    if (!session.subscription) {
      throw new Error('No subscription found in session')
    }

    // Get the full subscription object
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
    
    // Get payment method details
    let paymentMethodBrand = null
    let paymentMethodLast4 = null

    if (subscription.default_payment_method) {
      const paymentMethod = await stripe.paymentMethods.retrieve(
        subscription.default_payment_method as string
      )
      paymentMethodBrand = paymentMethod.card?.brand || null
      paymentMethodLast4 = paymentMethod.card?.last4 || null
    }

    // Upsert subscription in database
    const { error } = await supabaseClient
      .from('stripe_subscriptions')
      .upsert({
        customer_id: subscription.customer as string,
        subscription_id: subscription.id,
        price_id: subscription.items.data[0]?.price.id || null,
        status: subscription.status as any,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
        payment_method_brand: paymentMethodBrand,
        payment_method_last4: paymentMethodLast4,
      }, {
        onConflict: 'customer_id'
      })

    if (error) {
      console.error('Error upserting subscription:', error)
      throw error
    }

    console.log('Subscription synced successfully')
    return subscription
  } catch (error) {
    console.error('Error syncing subscription from session:', error)
    throw error
  }
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
      return new Response('Method not allowed', { 
        status: 405,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
        }
      })
    }

    // Get the authorization header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response('Missing authorization header', { 
        status: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
        }
      })
    }

    // Get user from auth token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)

    if (authError || !user) {
      console.error('Auth error:', authError)
      return new Response('Unauthorized', { 
        status: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
        }
      })
    }

    // Parse request body
    const { session_id }: VerifySessionRequest = await req.json()

    if (!session_id) {
      return new Response('Missing session_id', { 
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
        }
      })
    }

    console.log('Verifying session:', session_id)

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(session_id)

    if (!session) {
          return new Response(JSON.stringify({
      success: false,
      subscriptionActive: false,
      message: 'Session niet gevonden'
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
      },
      status: 404
    })
    }

    console.log('Session found:', session.payment_status, session.status)

    // Check if payment was successful
    if (session.payment_status !== 'paid') {
          return new Response(JSON.stringify({
      success: false,
      subscriptionActive: false,
      message: 'Betaling nog niet voltooid'
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
      },
    })
    }

    // If session has a subscription, sync it to our database
    let subscriptionActive = false
    if (session.subscription) {
      try {
        const subscription = await syncSubscriptionFromSession(session)
        subscriptionActive = subscription.status === 'active'
        console.log('Subscription synced, status:', subscription.status)
      } catch (error) {
        console.error('Failed to sync subscription:', error)
      }
    }

    return new Response(JSON.stringify({
      success: true,
      subscriptionActive,
      message: subscriptionActive 
        ? 'Abonnement is actief' 
        : 'Betaling voltooid, abonnement wordt geactiveerd'
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
      },
    })

  } catch (error) {
    console.error('Verify session error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        subscriptionActive: false,
        message: 'Er ging iets mis bij het verifiëren van de betaling'
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
        },
      }
    )
  }
}) 