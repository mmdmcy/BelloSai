import { supabase } from './supabase'
import type { Database } from './supabase'

type StripeCustomer = Database['public']['Tables']['stripe_customers']['Row']
type StripeSubscription = Database['public']['Tables']['stripe_subscriptions']['Row']
type StripeUserSubscription = Database['public']['Views']['stripe_user_subscriptions']['Row']

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
    priceId: import.meta.env.VITE_STRIPE_PRICE_ID_MONTHLY || 'price_1RZtB0BzQy7WGhPxMJcDPPTK',
    interval: 'month'
  },
  YEARLY: {
    id: 'yearly',
    name: 'BelloSai Pro Yearly',
    price: '€69.99',
    features: ['Everything in monthly', 'Save over 15%', '18000 standard credits', '1200 premium credits'],
    priceId: import.meta.env.VITE_STRIPE_PRICE_ID_YEARLY || '',
    interval: 'year'
  }
}

export class StripeService {
  /**
   * Maak een checkout sessie voor een abonnement
   */
  static async createCheckoutSession(priceId: string): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('User not authenticated')
      }

      const response = await fetch(
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
            cancel_url: `${window.location.origin}/pricing`
          })
        }
      )

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { url } = await response.json()
      window.location.assign(url)
    } catch (error) {
      console.error('Error creating checkout session:', error)
      throw error
    }
  }

  /**
   * Haal de huidige subscription van een user op
   */
  static async getUserSubscription(): Promise<StripeUserSubscription | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase
        .from('stripe_user_subscriptions')
        .select('*')
        .single()

      if (error) {
        // Als er geen subscription is, is dat geen error
        if (error.code === 'PGRST116') {
          return null
        }
        console.error('Error fetching user subscription:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Failed to fetch user subscription:', error)
      return null
    }
  }

  /**
   * Check of een user een actief abonnement heeft
   */
  static async hasActiveSubscription(): Promise<boolean> {
    try {
      const subscription = await this.getUserSubscription()
      return subscription?.subscription_status === 'active' || false
    } catch (error) {
      console.error('Failed to check active subscription:', error)
      return false
    }
  }

  /**
   * Haal Stripe customer informatie op
   */
  static async getStripeCustomer(): Promise<StripeCustomer | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase
        .from('stripe_customers')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null
        }
        console.error('Error fetching stripe customer:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Failed to fetch stripe customer:', error)
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
   * Annuleer een abonnement
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
   * Heractiveer een geannuleerd abonnement
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
}

// Export types voor gebruik in andere bestanden
export type { StripeCustomer, StripeSubscription, StripeUserSubscription } 