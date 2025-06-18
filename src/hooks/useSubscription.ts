import { useState, useEffect, useCallback } from 'react'
import { StripeService, type StripeUserSubscription, type StripeCustomer } from '../lib/stripeService'
import { useAuth } from '../contexts/AuthContext'
import React from 'react'

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
  forceSyncSubscription: () => Promise<void>
}

export function useSubscription(): UseSubscriptionReturn {
  const { user, isAuthReady } = useAuth()
  const [subscription, setSubscription] = useState<StripeUserSubscription | null>(null)
  const [customer, setCustomer] = useState<StripeCustomer | null>(null)
  const [hasActiveSubscription, setHasActiveSubscription] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Check environment on mount
  React.useEffect(() => {
    StripeService.checkEnvironment()
  }, [])

  // Add a failsafe to prevent infinite loading
  React.useEffect(() => {
    const failsafeTimeout = setTimeout(() => {
      if (loading) {
        console.warn('⚠️ [useSubscription] Failsafe timeout triggered - forcing loading to false')
        setLoading(false)
        setError('Unable to load subscription data - please refresh the page')
      }
    }, 15000) // 15 second failsafe

    return () => clearTimeout(failsafeTimeout)
  }, [loading])

  // Add timeout for auth readiness
  React.useEffect(() => {
    const authTimeout = setTimeout(() => {
      if (!isAuthReady && loading) {
        console.warn('⚠️ [useSubscription] Auth readiness timeout - proceeding without auth')
        setLoading(false)
        setError('Authentication timeout - please refresh the page')
      }
    }, 8000) // 8 second timeout for auth

    return () => clearTimeout(authTimeout)
  }, [isAuthReady, loading])

  // Fetch subscription data
  const fetchSubscriptionData = useCallback(async () => {
    console.log('🔄 [useSubscription] Starting fetchSubscriptionData', { user: !!user, isAuthReady })
    
    if (!user || !isAuthReady) {
      console.log('🔄 [useSubscription] User not ready, setting loading to false', { user: !!user, isAuthReady })
      setLoading(false)
      return
    }

    try {
      console.log('🔄 [useSubscription] Setting loading to true and fetching data...')
      setLoading(true)
      setError(null)

      // Add a timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Subscription data fetch timeout')), 10000) // 10 second timeout
      })

      const dataPromise = Promise.all([
        StripeService.getUserSubscription(),
        StripeService.getStripeCustomer(),
        StripeService.hasActiveSubscription()
      ])

      const [subscriptionData, customerData, hasActive] = await Promise.race([
        dataPromise,
        timeoutPromise
      ]) as [any, any, boolean]

      console.log('✅ [useSubscription] Data fetched successfully:', { 
        hasSubscription: !!subscriptionData, 
        hasCustomer: !!customerData, 
        hasActive 
      })

      setSubscription(subscriptionData)
      setCustomer(customerData)
      setHasActiveSubscription(hasActive)
    } catch (err) {
      console.error('❌ [useSubscription] Error fetching subscription data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch subscription data')
    } finally {
      console.log('✅ [useSubscription] Setting loading to false')
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

  // Force sync subscription data
  const forceSyncSubscription = useCallback(async () => {
    try {
      console.log('🔧 [useSubscription] Force syncing subscription...')
      setLoading(true)
      setError(null)
      
      // Use the new force refresh method
      const syncResult = await StripeService.forceRefreshSubscription()
      
      if (syncResult.success) {
        console.log('✅ [useSubscription] Force sync successful, refreshing data...')
        // Refresh local data after successful sync
        await fetchSubscriptionData()
      } else {
        console.error('❌ [useSubscription] Force sync failed:', syncResult.message)
        setError(syncResult.message)
      }
    } catch (err) {
      console.error('❌ [useSubscription] Force sync error:', err)
      setError('Failed to sync subscription data')
    } finally {
      setLoading(false)
    }
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
    forceSyncSubscription,
  }
} 