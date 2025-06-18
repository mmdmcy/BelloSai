import React, { useState } from 'react'
import { useSubscription } from '../hooks/useSubscription'
import { useAuth } from '../contexts/AuthContext'
import { SUBSCRIPTION_PLANS } from '../lib/stripeService'

export function SubscriptionManager() {
  const { user } = useAuth()
  const {
    subscription,
    customer,
    hasActiveSubscription,
    loading,
    error,
    createCheckoutSession,
    openCustomerPortal,
    cancelSubscription,
    reactivateSubscription,
    refreshSubscription
  } = useSubscription()

  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const handleUpgrade = async (priceId: string, planName: string) => {
    setActionLoading(`upgrade-${planName}`)
    try {
      await createCheckoutSession(priceId)
    } catch (err) {
      console.error('Error upgrading:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleManageSubscription = async () => {
    setActionLoading('manage')
    try {
      await openCustomerPortal()
    } catch (err) {
      console.error('Error opening portal:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancelSubscription = async () => {
    const confirmed = window.confirm('Are you sure you want to cancel your subscription?')
    if (!confirmed) return

    setActionLoading('cancel')
    try {
      const success = await cancelSubscription()
      if (success) {
        console.log('Subscription cancelled successfully!')
      }
    } catch (err) {
      console.error('Error cancelling subscription:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleReactivateSubscription = async () => {
    setActionLoading('reactivate')
    try {
      const success = await reactivateSubscription()
      if (success) {
        console.log('Subscription reactivated successfully!')
      }
    } catch (err) {
      console.error('Error reactivating subscription:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return 'Onbekend'
    return new Date(timestamp * 1000).toLocaleDateString('nl-NL')
  }

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100'
      case 'trialing':
        return 'text-blue-600 bg-blue-100'
      case 'past_due':
        return 'text-yellow-600 bg-yellow-100'
      case 'canceled':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusText = (status: string | null) => {
    switch (status) {
      case 'active':
        return 'Active'
      case 'trialing':
        return 'Trial Period'
      case 'past_due':
        return 'Payment Overdue'
      case 'canceled':
        return 'Canceled'
      case 'incomplete':
        return 'Incomplete'
      case 'unpaid':
        return 'Unpaid'
      default:
        return 'Unknown'
    }
  }

  if (!user) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">You must be logged in to manage your subscription.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Subscription Management</h2>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <p className="text-gray-600">Loading subscription data...</p>
          </div>
        )}

        {/* Current Subscription Status */}
        {!loading && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Status</h3>
            
            {hasActiveSubscription && subscription ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-lg font-medium text-gray-900">Premium Subscription</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(subscription.subscription_status)}`}>
                      {getStatusText(subscription.subscription_status)}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Next payment</p>
                    <p className="font-medium">{formatDate(subscription.current_period_end)}</p>
                  </div>
                </div>

                {subscription.payment_method_brand && subscription.payment_method_last4 && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">
                      Payment method: {subscription.payment_method_brand.toUpperCase()} •••• {subscription.payment_method_last4}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleManageSubscription}
                    disabled={actionLoading === 'manage'}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {actionLoading === 'manage' ? 'Loading...' : 'Manage Subscription'}
                  </button>

                  {subscription.subscription_status === 'active' && !subscription.cancel_at_period_end && (
                    <button
                      onClick={handleCancelSubscription}
                      disabled={actionLoading === 'cancel'}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                    >
                      {actionLoading === 'cancel' ? 'Loading...' : 'Cancel'}
                    </button>
                  )}

                  {subscription.cancel_at_period_end && (
                    <button
                      onClick={handleReactivateSubscription}
                      disabled={actionLoading === 'reactivate'}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                    >
                      {actionLoading === 'reactivate' ? 'Loading...' : 'Reactivate'}
                    </button>
                  )}

                  <button
                    onClick={refreshSubscription}
                    disabled={loading}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
                  >
                    Refresh
                  </button>
                </div>

                {subscription.cancel_at_period_end && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-yellow-800 text-sm">
                      Your subscription will be canceled on {formatDate(subscription.current_period_end)}. 
                      You can still reactivate it before that date.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-gray-800 mb-2">You currently have no active subscription.</p>
                <p className="text-sm text-gray-600">Upgrade to Premium for unlimited access!</p>
              </div>
            )}
          </div>
        )}

        {/* Subscription Plans */}
        {!hasActiveSubscription && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Subscriptions</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.values(SUBSCRIPTION_PLANS).map((plan) => (
                <div
                  key={plan.id}
                  className={`border rounded-lg p-6 ${
                    plan.id === 'free' 
                      ? 'border-gray-200 bg-gray-50' 
                      : 'border-blue-200 bg-blue-50'
                  }`}
                >
                  <div className="text-center mb-4">
                    <h4 className="text-xl font-bold text-gray-900">{plan.name}</h4>
                    <p className="text-3xl font-bold text-blue-600 mt-2">{plan.price}</p>
                    <p className="text-sm text-gray-600">per {plan.interval === 'month' ? 'month' : 'year'}</p>
                  </div>

                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-700">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {plan.id !== 'free' && (
                    <button
                      onClick={() => handleUpgrade(plan.priceId, plan.id)}
                      disabled={actionLoading === `upgrade-${plan.id}` || !plan.priceId}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading === `upgrade-${plan.id}` ? 'Loading...' : 'Choose This Plan'}
                    </button>
                  )}

                  {plan.id === 'free' && (
                    <div className="w-full px-4 py-2 bg-gray-300 text-gray-600 rounded-md text-center">
                      Current Plan
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Customer Info */}
        {customer && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Information</h3>
            <div className="text-sm text-gray-600">
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Customer ID:</strong> {customer.customer_id}</p>
              <p><strong>Account created:</strong> {new Date(customer.created_at).toLocaleDateString('en-US')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 
