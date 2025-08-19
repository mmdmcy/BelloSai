import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { TOKEN_BUNDLES } from '../lib/stripeService';
import { ArrowLeft, Sparkles, BadgeDollarSign, Star, ArrowRight, LogIn } from 'lucide-react';
import { StripeService } from '../lib/stripeService';

export default function Pricing() {
  const { user } = useAuth();
  const prefersLight = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  const isLight = prefersLight;
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  const handleBackToHome = () => {
    window.location.href = '/';
  };

  return (
  <div className={`min-h-screen relative overflow-hidden ${isLight ? 'bg-white text-gray-900' : 'bg-[#0b0b10] text-white'}`}>
      <style>{`
        @keyframes pulseGlow { 0%,100%{opacity:.25; filter:blur(80px)} 50%{opacity:.45; filter:blur(100px)} }
        .glass { backdrop-filter: blur(14px); background: linear-gradient( to bottom right, rgba(255,255,255,0.08), rgba(255,255,255,0.03) ); border: 1px solid rgba(255,255,255,0.08); }
      `}</style>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-32 w-[900px] h-[900px] bg-gradient-to-br from-purple-700/40 via-fuchsia-500/30 to-indigo-700/40 rounded-full" style={{ animation: 'pulseGlow 8s ease-in-out infinite' }} />
        <div className="absolute -bottom-48 -right-24 w-[800px] h-[800px] bg-gradient-to-tr from-indigo-700/40 via-purple-600/30 to-fuchsia-500/40 rounded-full" style={{ animation: 'pulseGlow 10s ease-in-out infinite' }} />
      </div>
      {/* Header */}
      <div className={`bg-transparent border-b ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToHome}
                className={`flex items-center gap-2 ${isLight ? 'text-gray-600 hover:text-gray-900' : 'text-white/80 hover:text-white'} transition-colors`}
              >
                <ArrowLeft className="w-5 h-5" />
                Back to BelloSai
              </button>
            </div>
            <div className="flex items-center gap-3">
              {!user && (
                <a
                  href="/auth"
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition ${isLight ? 'bg-gray-900 text-white hover:bg-black' : 'bg-white/10 hover:bg-white/15 border border-white/10'}`}
                >
                  <span className="inline-flex items-center gap-2"><LogIn className="w-4 h-4"/> Log in</span>
                </a>
              )}
              <a
                href="/"
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${isLight ? 'bg-white border border-gray-200 hover:bg-gray-50' : 'bg-white/10 hover:bg-white/15 border border-white/10'}`}
              >
                Open App
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs text-white/80">
            <Sparkles className="w-3.5 h-3.5" /> Pick your bundle
          </span>
          <h1 className="mt-3 text-3xl md:text-4xl font-extrabold">Choose your credits</h1>
          <p className={`text-sm md:text-base mt-2 ${isLight ? 'text-gray-600' : 'text-white/70'}`}>No subscriptions. Instant access. Keep unused credits forever.</p>
        </div>

        {/* One-time Token Bundles */}
        <div className="mb-16">
          <h2 className={`text-3xl font-extrabold text-center mb-3 ${isLight ? 'text-gray-900' : ''}`}>Pay‑as‑you‑go Bundles</h2>
          <p className={`${isLight ? 'text-gray-600' : 'text-white/70'} text-center mb-10`}>More messages for less. Medium includes Light; Heavy includes Medium + Light.</p>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {TOKEN_BUNDLES.map((bundle) => {
              const highlight = bundle.sku === 'MEDIUM' ? 'Most Popular' : (bundle.sku === 'HEAVY' ? 'Best Value' : null);
              return (
                <div key={bundle.id} className="relative rounded-3xl glass border border-white/10 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1">
                  {highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        <Star className="w-3.5 h-3.5" /> {highlight}
                      </span>
                    </div>
                  )}
                  <div className="p-8">
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-extrabold">{bundle.name}</h3>
                      <div className="mt-3 text-4xl font-extrabold">{bundle.price}</div>
                      <p className="mt-3 text-white/70">{bundle.description}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      {(['light','medium','heavy'] as const).map((tier) => (
                        <div key={tier} className={`${isLight ? 'bg-gray-50' : 'bg-white/5 border border-white/10'} rounded-lg p-3 text-center`}>
                          <p className={`${isLight ? 'text-gray-800' : 'text-white/80'} text-xs capitalize`}>{tier}</p>
                          <p className={`${isLight ? 'text-gray-900' : 'text-white'} text-lg font-semibold`}>{bundle.credits[tier]}</p>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={async () => {
                        if (!user) { alert('Please log in to purchase a bundle.'); return }
                        setActionLoading(bundle.id)
                        try { await StripeService.createBundleCheckout(bundle) } catch(e){ console.error(e); alert('Failed to start checkout. Please try again.'); } finally { setActionLoading(null) }
                      }}
                      disabled={actionLoading === bundle.id || !bundle.priceId}
                      className="group w-full py-3 px-6 rounded-xl font-semibold transition-all bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-[0_14px_60px_rgba(124,58,237,.55)] disabled:opacity-50 shadow-[0_10px_40px_rgba(124,58,237,.35)]"
                    >
                      {actionLoading === bundle.id ? 'Processing…' : (!bundle.priceId ? 'Coming Soon' : 'Buy Bundle')} <ArrowRight className="inline w-4 h-4 ml-1 translate-x-0 group-hover:translate-x-0.5 transition" />
                    </button>
                    <div className="mt-3 text-xs text-gray-600 flex items-center justify-center gap-2">
                      <BadgeDollarSign className="w-4 h-4 text-purple-400" />
                      <span>Use credits on {bundle.id==='light'?'Light':'Light+Medium'}{bundle.id==='heavy'?'+Heavy':''} models. No expiry.</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Subscriptions removed — bundles only */}

        {/* Selling points below the fold */}
        <div className="mt-12 grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <div className="rounded-2xl glass p-6 shadow-md border border-white/10">
            <h4 className="font-semibold mb-2">Access many top models</h4>
            <p className="text-white/70 text-sm">Chat with Qwen, Mistral, Groq, Claude‑compatible routes and more. Light/Medium/Heavy tiers map to real API costs.</p>
          </div>
          <div className="rounded-2xl glass p-6 shadow-md border border-white/10">
            <h4 className="font-semibold mb-2">No lock‑in, keep credits</h4>
            <p className="text-white/70 text-sm">Buy once, use any time. Credits don’t expire, and you can upgrade later.</p>
          </div>
          <div className="rounded-2xl glass p-6 shadow-md border border-white/10">
            <h4 className="font-semibold mb-2">Great value</h4>
            <p className="text-white/70 text-sm">We optimize costs so you can send as many messages as possible while we keep it sustainable.</p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-white/70">
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
