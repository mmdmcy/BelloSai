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

async function syncUserSubscription(userId: string) {
  console.log('Syncing subscription for user:', userId)

  try {
    // Get user's Stripe customer
    const { data: customer, error: customerError } = await supabaseClient
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .single()

    if (customerError || !customer) {
      console.log('No Stripe customer found for user')
      return { success: true, message: 'No customer found - user probably not subscribed yet' }
    }

    // Get all subscriptions for this customer from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.customer_id,
      limit: 10
    })

    console.log(`Found ${subscriptions.data.length} subscriptions for customer ${customer.customer_id}`)

    if (subscriptions.data.length === 0) {
      console.log('No subscriptions found in Stripe')
      return { success: true, message: 'No subscriptions found' }
    }

    // Get the most recent subscription
    const latestSubscription = subscriptions.data[0]
    console.log('Latest subscription status:', latestSubscription.status)

    // Get payment method details
    let paymentMethodBrand = null
    let paymentMethodLast4 = null

    if (latestSubscription.default_payment_method) {
      try {
        const paymentMethod = await stripe.paymentMethods.retrieve(
          latestSubscription.default_payment_method as string
        )
        paymentMethodBrand = paymentMethod.card?.brand || null
        paymentMethodLast4 = paymentMethod.card?.last4 || null
      } catch (err) {
        console.warn('Could not retrieve payment method:', err)
      }
    }

    // Upsert subscription in database
    const { error } = await supabaseClient
      .from('stripe_subscriptions')
      .upsert({
        customer_id: customer.customer_id,
        subscription_id: latestSubscription.id,
        price_id: latestSubscription.items.data[0]?.price.id || null,
        status: latestSubscription.status as any,
        current_period_start: latestSubscription.current_period_start,
        current_period_end: latestSubscription.current_period_end,
        cancel_at_period_end: latestSubscription.cancel_at_period_end,
        payment_method_brand: paymentMethodBrand,
        payment_method_last4: paymentMethodLast4,
      }, {
        onConflict: 'customer_id'
      })

    if (error) {
      console.error('Error upserting subscription:', error)
      throw error
    }

    console.log('Subscription synced successfully, status:', latestSubscription.status)
    return { 
      success: true, 
      status: latestSubscription.status,
      message: `Subscription synced with status: ${latestSubscription.status}` 
    }
  } catch (error) {
    console.error('Error syncing subscription:', error)
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

    console.log('Syncing subscription for user:', user.id)

    const result = await syncUserSubscription(user.id)

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Sync subscription error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        message: 'Something went wrong synchronizing your subscription'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}) 