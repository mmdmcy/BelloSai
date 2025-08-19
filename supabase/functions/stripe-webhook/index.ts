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

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('Processing checkout completed:', session.id)

  try {
    // Identify if this is subscription or one-time bundle
    const mode = session.mode
    const customerId = session.customer as string
    const supabaseUserId = (session.metadata?.supabase_user_id || '') as string
    const bundleSku = (session.metadata?.bundle_sku || '') as string

    if (mode === 'subscription' && session.subscription) {
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
      await syncSubscription(subscription)
    }

    // Create order record
    await supabaseClient
      .from('stripe_orders')
      .insert({
        checkout_session_id: session.id,
        payment_intent_id: session.payment_intent as string,
        customer_id: customerId,
        amount_subtotal: session.amount_subtotal || 0,
        amount_total: session.amount_total || 0,
        currency: session.currency || 'eur',
        payment_status: session.payment_status,
        status: 'completed',
      })

    // Credit tokens for one-time bundles
    if (mode === 'payment' && supabaseUserId && bundleSku) {
      // Map bundle SKU -> credits; prices set in Stripe dashboard
      let light = 0, medium = 0, heavy = 0
      if (bundleSku === 'LIGHT') {
        light = 300
      } else if (bundleSku === 'MEDIUM') {
        // Includes light as well
        light = 300
        medium = 200
      } else if (bundleSku === 'HEAVY') {
        // Includes medium + light
        light = 500
        medium = 300
        heavy = 150
      }

      if (light + medium + heavy > 0) {
        const { error: creditErr } = await supabaseClient.rpc('credit_tokens', {
          p_user_id: supabaseUserId,
          p_light: light,
          p_medium: medium,
          p_heavy: heavy,
        })
        if (creditErr) {
          console.error('Failed to credit tokens:', creditErr)
        } else {
          console.log('Credited tokens for bundle', { bundleSku, light, medium, heavy })
        }
      }
    }

    // Credit subscription counters for subscriptions
    if (mode === 'subscription' && session.subscription && supabaseUserId) {
      const sub = await stripe.subscriptions.retrieve(session.subscription as string)
      const priceId = sub.items.data[0]?.price?.id || ''
      const periodEnd = new Date(sub.current_period_end * 1000).toISOString()
      const planLite = Deno.env.get('STRIPE_PRICE_SUB_LITE') || ''
      const planPro = Deno.env.get('STRIPE_PRICE_SUB_PRO') || ''
      const planElite = Deno.env.get('STRIPE_PRICE_SUB_ELITE') || ''

      let standard = 0, premium = 0, heavy = 0
      if (priceId === planLite) {
        standard = 4000; premium = 20; heavy = 0
      } else if (priceId === planPro) {
        standard = 5000; premium = 150; heavy = 0
      } else if (priceId === planElite) {
        standard = 8000; premium = 200; heavy = 200
      }
      if (standard + premium + heavy > 0) {
        const { error } = await supabaseClient.rpc('credit_subscription_counters', {
          p_user_id: supabaseUserId,
          p_standard: standard,
          p_premium: premium,
          p_heavy: heavy,
          p_period_end: periodEnd
        })
        if (error) console.error('Failed to credit subscription counters:', error)
      }
    }

    console.log('Checkout completed processed successfully')
  } catch (error) {
    console.error('Error processing checkout completed:', error)
    throw error
  }
}

async function syncSubscription(subscription: Stripe.Subscription) {
  console.log('Syncing subscription:', subscription.id)

  try {
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

    // Upsert subscription
    await supabaseClient
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

    console.log('Subscription synced successfully')
  } catch (error) {
    console.error('Error syncing subscription:', error)
    throw error
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Processing invoice payment succeeded:', invoice.id)

  try {
    if (invoice.subscription) {
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
      await syncSubscription(subscription)
    }

    console.log('Invoice payment succeeded processed successfully')
  } catch (error) {
    console.error('Error processing invoice payment succeeded:', error)
    throw error
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Processing invoice payment failed:', invoice.id)

  try {
    if (invoice.subscription) {
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
      await syncSubscription(subscription)
    }

    console.log('Invoice payment failed processed successfully')
  } catch (error) {
    console.error('Error processing invoice payment failed:', error)
    throw error
  }
}

serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    const signature = req.headers.get('stripe-signature')
    if (!signature) {
      return new Response('Missing stripe signature', { status: 400 })
    }

    const body = await req.text()
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

    if (!webhookSecret) {
      return new Response('Missing webhook secret', { status: 500 })
    }

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return new Response('Invalid signature', { status: 400 })
    }

    console.log('Processing webhook event:', event.type)

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await syncSubscription(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break

      default:
        console.log('Unhandled event type:', event.type)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}) 