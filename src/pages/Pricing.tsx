import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import { SUBSCRIPTION_PLANS } from '../lib/stripeService';
import { CheckCircle, ArrowLeft, Loader2 } from 'lucide-react';

export default function Pricing() {
  const { user } = useAuth();
  const { hasActiveSubscription, createCheckoutSession, loading } = useSubscription();
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  const handleSelectPlan = async (priceId: string, planId: string) => {
    if (!user) {
      alert('You must log in first to choose a subscription.');
      return;
    }

    if (!priceId) {
      alert('Dit plan is nog niet beschikbaar.');
      return;
    }

    setActionLoading(planId);
    try {
      await createCheckoutSession(priceId);
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Er ging iets mis bij het starten van de checkout. Probeer het opnieuw.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBackToHome = () => {
    window.location.href = '/';
  };

  return (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToHome}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to BelloSai
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 6h18v2H3V6m0 5h18v2H3v-2m0 5h18v2H3v-2Z"/>
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">BelloSai</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Kies je perfecte plan
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Unlock de volledige kracht van BelloSai met onbeperkte AI conversaties
          </p>

          {hasActiveSubscription && (
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full">
              <CheckCircle className="w-5 h-5" />
              You already have an active Pro subscription
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {Object.values(SUBSCRIPTION_PLANS).map((plan) => {
            const isPopular = plan.id === 'monthly';
            const isFree = plan.id === 'free';
            const isYearly = plan.id === 'yearly';

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all hover:shadow-xl ${
                  isPopular 
                    ? 'border-gray-900 scale-105' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gray-900 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Meest Populair
                    </span>
                  </div>
                )}

                <div className="p-8">
                  {/* Plan Header */}
                  <div className="text-center mb-8">
                    <h3 className={`text-2xl font-bold ${
                      isPopular ? 'text-gray-900' : 'text-gray-900'
                    }`}>
                      {plan.name}
                    </h3>
                    <div className="mt-4">
                      <span className={`text-4xl font-bold ${
                        isPopular ? 'text-gray-900' : 'text-gray-900'
                      }`}>
                        {plan.price}
                      </span>
                      {!isFree && (
                        <span className="text-gray-600 ml-2">
                          /{plan.interval === 'month' ? 'month' : 'year'}
                        </span>
                      )}
                    </div>
                    {isYearly && (
                      <div className="mt-2">
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                          Save over 15%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                          isPopular ? 'text-gray-900' : 'text-green-500'
                        }`} />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <div className="text-center">
                    {isFree ? (
                      <button
                        onClick={handleBackToHome}
                        className="w-full py-3 px-6 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                      >
                        Try Free
                      </button>
                    ) : hasActiveSubscription ? (
                      <div className="w-full py-3 px-6 bg-gray-100 text-gray-500 rounded-lg font-medium text-center">
                        Current Plan
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSelectPlan(plan.priceId, plan.id)}
                        disabled={actionLoading === plan.id || !plan.priceId}
                        className={`w-full py-3 px-6 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          isPopular
                            ? 'bg-gray-900 text-white hover:bg-black disabled:hover:bg-gray-900'
                            : 'bg-gray-900 text-white hover:bg-gray-800 disabled:hover:bg-gray-900'
                        }`}
                      >
                        {actionLoading === plan.id ? (
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Loading...
                          </div>
                        ) : !plan.priceId && !isFree ? (
                          'Coming Soon'
                        ) : (
                          'Choose This Plan'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ or Additional Info */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            Frequently Asked Questions
          </h3>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="text-left">
              <h4 className="font-semibold text-gray-900 mb-2">
                                  Can I cancel my subscription at any time?
              </h4>
              <p className="text-gray-600">
                                  Yes, you can cancel your subscription at any time. You retain access to Pro features until the end of your billing period.
              </p>
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-gray-900 mb-2">
                What happens to my data if I cancel?
              </h4>
              <p className="text-gray-600">
                Your chat history and account are preserved. You can always upgrade to Pro again whenever you want.
              </p>
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-gray-900 mb-2">
                What payment methods do you accept?
              </h4>
              <p className="text-gray-600">
                We accept all major credit cards, SEPA transfers and other local payment methods via Stripe.
              </p>
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-gray-900 mb-2">
                Is there a free trial?
              </h4>
              <p className="text-gray-600">
                Yes! You can try BelloSai for free with 20 messages per month. No credit card required.
              </p>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-gray-600">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            Secure payment by Stripe • SSL encrypted • No data stored
          </div>
        </div>
      </div>
    </div>
  );
} 
