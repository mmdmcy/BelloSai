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
    // Get customer from our database
    const { data: customer, error: customerError } = await supabaseClient
      .from('stripe_customers')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .single()

    if (customerError) {
      console.error('Customer not found:', customerError)
      return { success: false, message: 'Customer not found' }
    }

    console.log('Found customer:', customer.customer_id)

    // Get subscriptions from Stripe for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.customer_id,
      status: 'all'
    })

    console.log('Found subscriptions:', subscriptions.data.length)

    if (subscriptions.data.length === 0) {
      return { success: true, message: 'No subscriptions found', hasActiveSubscription: false }
    }

    // Get the most recent subscription
    const subscription = subscriptions.data[0]
    console.log('Syncing subscription:', subscription.id, 'status:', subscription.status)

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
      return { success: false, message: 'Failed to update subscription' }
    }

    console.log('Subscription synced successfully')
    return { 
      success: true, 
      message: 'Subscription synced',
      hasActiveSubscription: subscription.status === 'active',
      subscriptionStatus: subscription.status
    }
  } catch (error) {
    console.error('Error syncing subscription:', error)
    return { success: false, message: 'Sync failed' }
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
        message: 'Er ging iets mis bij het synchroniseren van je abonnement'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}) 