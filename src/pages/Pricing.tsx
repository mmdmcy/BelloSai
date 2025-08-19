import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import { TOKEN_BUNDLES } from '../lib/stripeService';
import { ArrowLeft, Sparkles, BadgeDollarSign, Star } from 'lucide-react';

export default function Pricing() {
  const { user } = useAuth();
  const { createBundleCheckout, loading } = useSubscription();
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  const handleBackToHome = () => {
    window.location.href = '/';
  };

  return (
  <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/70 backdrop-blur border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToHome}
                className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to BelloSai
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-gray-900">BelloSai</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            One-time credits. Yours to use, anytime.
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Flexible AI credits for every need</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Light, Medium, and Heavy bundles designed to fit your usage. No recurring fees, no lock-in—just buy and chat.
          </p>
        </div>

        {/* One-time Token Bundles */}
        <div className="mb-16">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-3">Pay‑as‑you‑go Bundles</h2>
          <p className="text-gray-600 text-center mb-10">More messages for less. Medium includes Light; Heavy includes Medium + Light.</p>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {TOKEN_BUNDLES.map((bundle) => {
              const highlight = bundle.id === 'medium' ? 'Most Popular' : (bundle.id === 'heavy' ? 'Best Value' : null);
              return (
                <div key={bundle.id} className="relative rounded-3xl border border-purple-200/60 bg-white/80 backdrop-blur shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1">
                  {highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        <Star className="w-3.5 h-3.5" /> {highlight}
                      </span>
                    </div>
                  )}
                  <div className="p-8">
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-extrabold text-gray-900">{bundle.name}</h3>
                      <div className="mt-3 text-4xl font-extrabold text-gray-900">{bundle.price}</div>
                      <p className="mt-3 text-gray-600">{bundle.description}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      <div className="rounded-lg bg-gray-50 p-3 text-center">
                        <p className="text-xs text-gray-500">Light</p>
                        <p className="text-lg font-semibold text-gray-900">{bundle.credits.light}</p>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-3 text-center">
                        <p className="text-xs text-gray-500">Medium</p>
                        <p className="text-lg font-semibold text-gray-900">{bundle.credits.medium}</p>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-3 text-center">
                        <p className="text-xs text-gray-500">Heavy</p>
                        <p className="text-lg font-semibold text-gray-900">{bundle.credits.heavy}</p>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        if (!user) { alert('Please log in to purchase a bundle.'); return }
                        setActionLoading(bundle.id)
                        try { await createBundleCheckout(bundle.sku) } finally { setActionLoading(null) }
                      }}
                      disabled={actionLoading === bundle.id || !bundle.priceId}
                      className="w-full py-3 px-6 rounded-xl font-semibold transition-all bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 shadow-lg hover:shadow-xl"
                    >
                      {actionLoading === bundle.id ? 'Processing…' : (!bundle.priceId ? 'Coming Soon' : 'Buy Bundle')}
                    </button>
                    <div className="mt-3 text-xs text-gray-600 flex items-center justify-center gap-2">
                      <BadgeDollarSign className="w-4 h-4 text-purple-600" />
                      <span>Use credits on {bundle.id==='light'?'Light':'Light+Medium'}{bundle.id==='heavy'?'+Heavy':''} models. No expiry.</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Subscriptions removed — bundles only */}

        {/* FAQ or Additional Info */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            Frequently Asked Questions
          </h3>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="text-left">
              <h4 className="font-semibold text-gray-900 mb-2">
                What do credits mean?
              </h4>
              <p className="text-gray-600">
                Each message to a model deducts one credit of its tier. Medium bundles also include Light credits; Heavy bundles include Medium and Light.
              </p>
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-gray-900 mb-2">
                What happens to my data if I cancel?
              </h4>
              <p className="text-gray-600">
                Your chat history and account are preserved. You can buy bundles any time—no subscription required.
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
                Can I get a refund?
              </h4>
              <p className="text-gray-600">
                Refunds depend on Stripe’s policy and our terms. Contact support if you have any issues.
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
