import React from 'react';
import { Sparkles, ShieldCheck, TrendingUp, Zap, CheckCircle, Star } from 'lucide-react';

export default function Welcome() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-white via-purple-50/40 to-indigo-50/30">
      {/* Animated background grid */}
      <div className="pointer-events-none absolute inset-0 opacity-40" aria-hidden>
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(124,58,237,0.15) 1px, transparent 1px)`,
          backgroundSize: '28px 28px'
        }} />
        <div className="absolute -top-40 -left-20 w-[800px] h-[800px] bg-gradient-to-br from-purple-200/50 to-indigo-200/50 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-20 w-[700px] h-[700px] bg-gradient-to-br from-indigo-200/40 to-purple-200/40 rounded-full blur-3xl animate-pulse" />
      </div>

      {/* Hero */}
      <section className="relative max-w-7xl mx-auto px-6 py-16 md:py-24 text-center">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" /> Meet BelloSai
        </span>
        <h1 className="mt-4 text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900">
          An AI chatbot that puts <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">you</span> in control
        </h1>
        <p className="mt-4 max-w-3xl mx-auto text-gray-600 text-base md:text-lg">
          Multiple top models, streaming responses, and simple pay‑as‑you‑go credits. No subscriptions. No lock‑in.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <a href="/pricing" className="px-5 py-3 rounded-xl bg-purple-600 text-white font-semibold shadow-lg hover:shadow-xl hover:bg-purple-700 transition-all">Buy credits</a>
          <a href="/" className="px-5 py-3 rounded-xl border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 font-semibold transition">Start chatting</a>
        </div>

        {/* 3D-ish card visual */}
        <div className="mt-12 flex items-center justify-center">
          <div className="[transform-style:preserve-3d] [perspective:1000px]">
            <div className="w-72 h-44 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-xl transition-transform hover:rotate-x-6 hover:-rotate-y-6 duration-300"></div>
          </div>
        </div>
      </section>

      {/* Why BelloSai */}
      <section className="max-w-7xl mx-auto px-6 py-12 md:py-16">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="rounded-2xl bg-white/90 backdrop-blur p-6 shadow-md">
            <Zap className="w-6 h-6 text-purple-600" />
            <h3 className="mt-3 font-semibold text-gray-900">Fast & responsive</h3>
            <p className="mt-2 text-sm text-gray-600">Optimized streaming routes deliver answers quickly so you stay in flow.</p>
          </div>
          <div className="rounded-2xl bg-white/90 backdrop-blur p-6 shadow-md">
            <ShieldCheck className="w-6 h-6 text-purple-600" />
            <h3 className="mt-3 font-semibold text-gray-900">Simple, sustainable</h3>
            <p className="mt-2 text-sm text-gray-600">Buy credits once and keep them. Clear tiers aligned to actual model costs.</p>
          </div>
          <div className="rounded-2xl bg-white/90 backdrop-blur p-6 shadow-md">
            <TrendingUp className="w-6 h-6 text-purple-600" />
            <h3 className="mt-3 font-semibold text-gray-900">Choice of models</h3>
            <p className="mt-2 text-sm text-gray-600">Pick Qwen, Mistral, Groq and more—choose what fits your task and budget.</p>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 text-center">How we stack up</h2>
        <p className="text-gray-600 text-sm md:text-base text-center mt-2">Transparent, flexible, and fast—without lock‑ins.</p>
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[800px] text-left border-separate border-spacing-y-2">
            <thead>
              <tr>
                {['Feature','BelloSai','Typical Subscriptions','Single‑Model Apps'].map(h => (
                  <th key={h} className="px-4 py-2 text-xs uppercase tracking-wider text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[{
                feature:'Pricing', bs:'Pay‑as‑you‑go (keep credits)', sub:'Recurring monthly fees', single:'Per‑token/paywall'
              },{
                feature:'Models', bs:'Multiple providers, tiers', sub:'1‑2 models', single:'Usually 1'
              },{
                feature:'Speed', bs:'Optimized streaming', sub:'Varies', single:'Varies'
              },{
                feature:'Limits', bs:'Clear tier credits', sub:'Hidden caps', single:'Opaque'
              }].map((row,i)=> (
                <tr key={i} className="bg-white/90 backdrop-blur shadow-sm rounded-2xl">
                  <td className="px-4 py-3 font-medium text-gray-900">{row.feature}</td>
                  <td className="px-4 py-3 text-gray-900"><span className="inline-flex items-center gap-1 text-green-700"><CheckCircle className="w-4 h-4" /> {row.bs}</span></td>
                  <td className="px-4 py-3 text-gray-600">{row.sub}</td>
                  <td className="px-4 py-3 text-gray-600">{row.single}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Illustrative bar chart */}
        <div className="mt-10 rounded-2xl bg-white/90 backdrop-blur p-6 shadow-md">
          <div className="text-sm text-gray-600 mb-4">Illustrative cost efficiency (more bar = more usable messages per €)</div>
          <div className="space-y-3">
            {[{label:'BelloSai (Bundles)',w:'85%'},{label:'Typical Subscription',w:'55%'},{label:'Single‑Model App',w:'45%'}].map(b => (
              <div key={b.label}>
                <div className="flex items-center justify-between text-xs text-gray-700 mb-1">
                  <span>{b.label}</span><span>{b.w}</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-gray-200">
                  <div className="h-full rounded-full bg-gradient-to-r from-purple-600 to-indigo-600" style={{ width: b.w }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-12 md:py-16">
        <div className="rounded-3xl bg-gradient-to-r from-purple-600 to-indigo-600 p-8 md:p-12 text-center text-white shadow-xl">
          <h3 className="text-2xl md:text-3xl font-extrabold">Ready to try BelloSai?</h3>
          <p className="mt-2 text-white/90">Pick a bundle or jump straight into a conversation.</p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <a href="/pricing" className="px-5 py-3 rounded-xl bg-white text-purple-700 font-semibold shadow hover:shadow-md">See pricing</a>
            <a href="/" className="px-5 py-3 rounded-xl border border-white/60 text-white font-semibold hover:bg-white/10">Start chatting</a>
          </div>
          <div className="mt-4 text-sm flex items-center justify-center gap-1 opacity-90">
            <Star className="w-4 h-4" /> Speed, simplicity and choice
          </div>
        </div>
      </section>

      {/* SEO headings */}
      <section className="sr-only">
        <h1>BelloSai AI Chatbot – Pay‑as‑you‑go credits</h1>
        <h2>AI chat assistant with multiple providers</h2>
        <h3>No subscription AI, streaming responses</h3>
      </section>
    </div>
  );
}
