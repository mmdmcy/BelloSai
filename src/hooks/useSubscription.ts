import { useState, useEffect, useCallback } from 'react'
import { StripeService, type StripeUserSubscription, type StripeCustomer } from '../lib/stripeService'
import { useAuth } from '../contexts/AuthContext'

interface UseSubscriptionReturn {
  subscription: StripeUserSubscription | null
  customer: StripeCustomer | null
  hasActiveSubscription: boolean
  loading: boolean
  error: string | null
  createCheckoutSession: (priceId: string) => Promise<void>
  openCustomerPortal: () => Promise<void>
  cancelSubscription: () => Promise<boolean>
  reactivateSubscription: () => Promise<boolean>
  refreshSubscription: () => Promise<void>
}

export function useSubscription(): UseSubscriptionReturn {
  const { user, isAuthReady } = useAuth()
  const [subscription, setSubscription] = useState<StripeUserSubscription | null>(null)
  const [customer, setCustomer] = useState<StripeCustomer | null>(null)
  const [hasActiveSubscription, setHasActiveSubscription] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch subscription data
  const fetchSubscriptionData = useCallback(async () => {
    if (!user || !isAuthReady) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const [subscriptionData, customerData, hasActive] = await Promise.all([
        StripeService.getUserSubscription(),
        StripeService.getStripeCustomer(),
        StripeService.hasActiveSubscription()
      ])

      setSubscription(subscriptionData)
      setCustomer(customerData)
      setHasActiveSubscription(hasActive)
    } catch (err) {
      console.error('Error fetching subscription data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch subscription data')
    } finally {
      setLoading(false)
    }
  }, [user, isAuthReady])

  // Create checkout session
  const createCheckoutSession = useCallback(async (priceId: string): Promise<void> => {
    if (!user) {
      setError('User not authenticated')
      return
    }

    try {
      setError(null)
      await StripeService.createCheckoutSession(priceId)
    } catch (err) {
      console.error('Error creating checkout session:', err)
      setError(err instanceof Error ? err.message : 'Failed to create checkout session')
      throw err
    }
  }, [user])

  // Open customer portal
  const openCustomerPortal = useCallback(async (): Promise<void> => {
    if (!user) {
      setError('User not authenticated')
      return
    }

    if (!customer) {
      setError('No customer found')
      return
    }

    try {
      setError(null)
      await StripeService.createCustomerPortalSession()
    } catch (err) {
      console.error('Error opening customer portal:', err)
      setError(err instanceof Error ? err.message : 'Failed to open customer portal')
      throw err
    }
  }, [user, customer])

  // Cancel subscription
  const cancelSubscription = useCallback(async (): Promise<boolean> => {
    if (!user) {
      setError('User not authenticated')
      return false
    }

    try {
      setError(null)
      const success = await StripeService.cancelSubscription()
      
      if (success) {
        // Refresh subscription data after cancellation
        await fetchSubscriptionData()
      }
      
      return success
    } catch (err) {
      console.error('Error canceling subscription:', err)
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription')
      return false
    }
  }, [user, fetchSubscriptionData])

  // Reactivate subscription
  const reactivateSubscription = useCallback(async (): Promise<boolean> => {
    if (!user) {
      setError('User not authenticated')
      return false
    }

    try {
      setError(null)
      const success = await StripeService.reactivateSubscription()
      
      if (success) {
        // Refresh subscription data after reactivation
        await fetchSubscriptionData()
      }
      
      return success
    } catch (err) {
      console.error('Error reactivating subscription:', err)
      setError(err instanceof Error ? err.message : 'Failed to reactivate subscription')
      return false
    }
  }, [user, fetchSubscriptionData])

  // Refresh subscription data
  const refreshSubscription = useCallback(async () => {
    await fetchSubscriptionData()
  }, [fetchSubscriptionData])

  // Fetch subscription data when component mounts or user changes
  useEffect(() => {
    fetchSubscriptionData()
  }, [fetchSubscriptionData])

  return {
    subscription,
    customer,
    hasActiveSubscription,
    loading,
    error,
    createCheckoutSession,
    openCustomerPortal,
    cancelSubscription,
    reactivateSubscription,
    refreshSubscription,
  }
} 