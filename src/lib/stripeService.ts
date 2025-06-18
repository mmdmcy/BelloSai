import { supabase } from './supabase'
import type { Database } from './supabase'

export type StripeCustomer = Database['public']['Tables']['stripe_customers']['Row']
export type StripeSubscription = Database['public']['Tables']['stripe_subscriptions']['Row']
export type StripeUserSubscription = Database['public']['Views']['stripe_user_subscriptions']['Row']

// Subscription plans configuratie (zoals in Bible Kitty)
export interface SubscriptionPlan {
  id: string
  name: string
  price: string
  features: string[]
  priceId: string
  interval: 'month' | 'year'
}

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  FREE: {
    id: 'free',
    name: 'Free Trial',
    price: '€0',
    features: ['20 AI messages', 'Basic chat functionality'],
    priceId: '',
    interval: 'month'
  },
  MONTHLY: {
    id: 'monthly',
    name: 'BelloSai Pro Monthly',
    price: '€6.99',
    features: ['Unlimited AI messages', 'All AI models', 'Priority support', 'Advanced features'],
    priceId: 'price_1RZtB0BzQy7WGhPxMJcDPPTK',
    interval: 'month'
  },
  YEARLY: {
    id: 'yearly',
    name: 'BelloSai Pro Yearly',
    price: '€69.99',
    features: ['Everything in monthly', 'Save over 15%', 'Annual discount'],
    priceId: '', // Add this when you create a yearly price
    interval: 'year'
  }
}

export class StripeService {
  /**
   * Check environment configuration
   */
  static checkEnvironment(): void {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    console.log('🔍 [StripeService] Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseAnonKey: !!supabaseAnonKey,
      supabaseUrlPreview: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'missing'
    })
    
    if (!supabaseUrl) {
      console.error('❌ [StripeService] VITE_SUPABASE_URL is not configured')
    }
    
    if (!supabaseAnonKey) {
      console.error('❌ [StripeService] VITE_SUPABASE_ANON_KEY is not configured')
    }
  }

  /**
   * Create a checkout session for a subscription
   */
  static async createCheckoutSession(priceId: string): Promise<void> {
    try {
      console.log('🔄 [StripeService] Creating checkout session for price:', priceId)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('User not authenticated')
      }

      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Checkout session creation timeout')), 10000) // 10 second timeout
      })

      const fetchPromise = fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            price_id: priceId,
            success_url: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${window.location.origin}/`
          })
        }
      )

      const response = await Promise.race([fetchPromise, timeoutPromise]) as Response

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ [StripeService] Checkout session creation failed:', errorText)
        throw new Error(`Failed to create checkout session: ${response.status} ${errorText}`)
      }

      const { url } = await response.json()
      console.log('✅ [StripeService] Checkout session created, redirecting to:', url)
      window.location.assign(url)
    } catch (error) {
      console.error('❌ [StripeService] Error creating checkout session:', error)
      throw error
    }
  }

  /**
   * Haal de huidige subscription van een user op
   */
  static async getUserSubscription(): Promise<StripeUserSubscription | null> {
    try {
      console.log('🔄 [StripeService] Getting user subscription...')
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.warn('⚠️ [StripeService] No user found for subscription check')
        throw new Error('User not authenticated')
      }

      console.log('🔄 [StripeService] Querying stripe_user_subscriptions for user:', user.id)
      const { data, error } = await supabase
        .from('stripe_user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) {
        console.error('❌ [StripeService] Error fetching user subscription:', error)
        throw error
      }

      console.log('✅ [StripeService] Subscription data retrieved:', data ? 'Found subscription' : 'No subscription')
      return data
    } catch (error) {
      console.error('❌ [StripeService] Failed to fetch user subscription:', error)
      return null
    }
  }

  /**
   * Check if a user has an active subscription
   */
  static async hasActiveSubscription(): Promise<boolean> {
    try {
      console.log('🔄 [StripeService] Checking for active subscription...')
      const subscription = await this.getUserSubscription()
      
      // Check multiple conditions for active subscription:
      // 1. Status is explicitly 'active'
      // 2. We have a subscription_id (indicates successful payment) but status is null (webhook delay)
      // 3. We have a subscription with current_period_end in the future
      const now = Math.floor(Date.now() / 1000)
      const isActive = subscription?.subscription_status === 'active' || 
                      (!!subscription?.subscription_id && subscription.subscription_status === null) ||
                      (!!subscription?.subscription_id && !!subscription.current_period_end && subscription.current_period_end > now)
      
      console.log('✅ [StripeService] Active subscription check result:', { 
        hasSubscription: !!subscription, 
        hasSubscriptionId: !!subscription?.subscription_id,
        status: subscription?.subscription_status,
        currentPeriodEnd: subscription?.current_period_end,
        currentTime: now,
        isActive 
      })
      return isActive
    } catch (error) {
      console.error('❌ [StripeService] Failed to check active subscription:', error)
      return false
    }
  }

  /**
   * Haal Stripe customer informatie op
   */
  static async getStripeCustomer(): Promise<StripeCustomer | null> {
    try {
      console.log('🔄 [StripeService] Getting stripe customer...')
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.warn('⚠️ [StripeService] No user found for customer check')
        throw new Error('User not authenticated')
      }

      console.log('🔄 [StripeService] Querying stripe_customers for user:', user.id)
      const { data, error } = await supabase
        .from('stripe_customers')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .maybeSingle()

      if (error) {
        console.error('❌ [StripeService] Error fetching stripe customer:', error)
        throw error
      }

      console.log('✅ [StripeService] Customer data retrieved:', data ? 'Found customer' : 'No customer')
      return data
    } catch (error) {
      console.error('❌ [StripeService] Failed to fetch stripe customer:', error)
      return null
    }
  }

  /**
   * Maak een customer portal sessie (voor subscription management)
   */
  static async createCustomerPortalSession(): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('User not authenticated')
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-customer-portal`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            return_url: `${window.location.origin}/dashboard`
          })
        }
      )

      if (!response.ok) {
        throw new Error('Failed to create customer portal session')
      }

      const { url } = await response.json()
      window.location.assign(url)
    } catch (error) {
      console.error('Error creating customer portal session:', error)
      throw error
    }
  }

  /**
   * Cancel a subscription
   */
  static async cancelSubscription(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('User not authenticated')
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-cancel-subscription`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to cancel subscription')
      }

      return true
    } catch (error) {
      console.error('Error canceling subscription:', error)
      return false
    }
  }

  /**
   * Reactivate a canceled subscription
   */
  static async reactivateSubscription(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('User not authenticated')
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-reactivate-subscription`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to reactivate subscription')
      }

      return true
    } catch (error) {
      console.error('Error reactivating subscription:', error)
      return false
    }
  }

  /**
   * Verify payment via checkout session ID
   */
  static async verifyPaymentSession(sessionId: string): Promise<{
    success: boolean
    subscriptionActive: boolean
    message: string
  }> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('User not authenticated')
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-verify-session`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            session_id: sessionId
          })
        }
      )

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Failed to verify payment session: ${error}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error verifying payment session:', error)
      return {
        success: false,
        subscriptionActive: false,
        message: 'Could not verify payment'
      }
    }
  }

  /**
   * Forceer synchronisatie van subscription status via backend
   */
  static async forceSyncSubscription(): Promise<boolean> {
    try {
      console.log('🔄 [StripeService] Force syncing subscription...')
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('User not authenticated')
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-sync-subscription`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ [StripeService] Force sync failed:', errorText)
        return false
      }

      const result = await response.json()
      console.log('✅ [StripeService] Force sync result:', result)
      return result.success || false
    } catch (error) {
      console.error('❌ [StripeService] Error force syncing subscription:', error)
      return false
    }
  }
} 
