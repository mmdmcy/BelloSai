import React from 'react';
import { Sparkles, Zap, Cpu, ShieldCheck, TerminalSquare, Rocket, ArrowRight } from 'lucide-react';

export default function Welcome() {
  const prefersLight = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  const isLight = prefersLight;
  return (
    <div className={`min-h-screen relative overflow-hidden ${isLight ? 'bg-white text-gray-900' : 'bg-[#0b0b10] text-white'}`}>
      {/* Animated background: moving gradients + subtle grid + particles */}
      <style>{`
        @keyframes floatSlow { 0%{transform:translateY(0)} 50%{transform:translateY(-10px)} 100%{transform:translateY(0)} }
        @keyframes pulseGlow { 0%,100%{opacity:.25; filter:blur(80px)} 50%{opacity:.45; filter:blur(100px)} }
        @keyframes drift {
          0% {transform: translate(0,0) rotate(0deg)}
          50% {transform: translate(20px,-20px) rotate(10deg)}
          100% {transform: translate(0,0) rotate(0deg)}
        }
        @keyframes shine { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        .glass { backdrop-filter: blur(14px); background: linear-gradient( to bottom right, rgba(255,255,255,0.08), rgba(255,255,255,0.03) ); border: 1px solid rgba(255,255,255,0.08); }
        .grid-overlay { background-image: linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px); background-size: 28px 28px; }
        .card3d { transform-style: preserve-3d; perspective: 1200px; }
        .tilt { transform: rotateX(8deg) rotateY(-12deg); transition: transform .35s ease, box-shadow .35s ease; }
        .tilt:hover { transform: rotateX(2deg) rotateY(-4deg) translateY(-4px); box-shadow: 0 30px 120px rgba(124,58,237,.25); }
      `}</style>

      {/* background layers */}
      <div className={`absolute inset-0 ${isLight ? '' : 'grid-overlay opacity-40'}`} aria-hidden />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-32 w-[900px] h-[900px] bg-gradient-to-br from-purple-700/40 via-fuchsia-500/30 to-indigo-700/40 rounded-full animate-pulseGlow" style={{ animation: 'pulseGlow 8s ease-in-out infinite' }} />
        <div className="absolute -bottom-48 -right-24 w-[800px] h-[800px] bg-gradient-to-tr from-indigo-700/40 via-purple-600/30 to-fuchsia-500/40 rounded-full" style={{ animation: 'pulseGlow 10s ease-in-out infinite' }} />
      </div>

      {/* NAV */}
      <header className="relative z-10 max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg flex items-center justify-center">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold tracking-tight">BelloSai</span>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm text-white/80">
          <a className="hover:text-white transition" href="/pricing">Pricing</a>
          <a className="hover:text-white transition" href="/models">Models</a>
          <a className="hover:text-white transition" href="/">App</a>
          <a className="hover:text-white transition" href="/welcome#why">Why BelloSai</a>
        </nav>
        <a href="/" className={`px-4 py-2 rounded-xl ${isLight ? 'bg-gray-900 text-white hover:bg-black border border-gray-900' : 'bg-white/10 hover:bg-white/15 border border-white/10'} text-sm transition`}>Open App</a>
      </header>

      {/* HERO */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-6 pb-10 md:pb-16">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs text-white/80">
            <Sparkles className="w-3.5 h-3.5" /> Simple subscriptions • Multi‑model • Streaming
          </span>
          <h1 className="mt-5 text-4xl md:text-6xl font-extrabold tracking-tight">
            Chat with multiple <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent animate-[shine_8s_ease_infinite]">AI models</span>
          </h1>
          <p className={`mt-4 max-w-3xl mx-auto ${isLight ? 'text-gray-600' : 'text-white/70'} text-base md:text-lg`}>
            BelloSai lets you choose Qwen, Mistral, Groq and more in one place. Generous monthly plans include Light, Medium, and Heavy usage so even premium models are covered.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <a href="/pricing" className={`group px-5 py-3 rounded-xl ${isLight ? 'bg-gray-900 text-white hover:bg-black shadow' : 'bg-gradient-to-r from-purple-600 to-indigo-600 shadow-[0_10px_40px_rgba(124,58,237,.35)] hover:shadow-[0_14px_60px_rgba(124,58,237,.55)]'} font-semibold transition`}>
              Choose a Plan <ArrowRight className="inline w-4 h-4 ml-1 translate-x-0 group-hover:translate-x-0.5 transition" />
            </a>
            <a href="/" className={`px-5 py-3 rounded-xl ${isLight ? 'bg-white border border-gray-300 text-gray-900 hover:bg-gray-50' : 'glass hover:bg-white/10 text-white border border-white/10'} font-semibold transition`}>Start Chatting</a>
          </div>
        </div>

        {/* 3D tilt preview card */}
        <div className="mt-14 flex items-center justify-center">
          <div className="card3d">
            <div className="tilt relative w-[780px] max-w-[94vw] rounded-3xl p-6 md:p-8 glass border-white/10">
              <div className="flex flex-wrap items-center gap-3 text-xs text-white/75">
                <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/10">Qwen</span>
                <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/10">Mistral</span>
                <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/10">Groq</span>
                <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/10">Claude‑compatible</span>
              </div>
              <div className="mt-5 grid md:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-white/80 text-xs">Tier</div>
                  <div className="text-lg font-semibold">Light</div>
                  <div className="mt-2 h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 w-1/3" /></div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-white/80 text-xs">Tier</div>
                  <div className="text-lg font-semibold">Medium</div>
                  <div className="mt-2 h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 w-2/3" /></div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-white/80 text-xs">Tier</div>
                  <div className="text-lg font-semibold">Heavy</div>
                  <div className="mt-2 h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 w-full" /></div>
                </div>
              </div>
              <div className="mt-5 flex items-center gap-3 text-white/70 text-sm">
                <TerminalSquare className="w-4 h-4" /> Proper streaming, markdown, and code blocks out of the box.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why section */}
      <section id="why" className="relative z-10 max-w-7xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-3 gap-6">
          {[{
            icon: <Zap className="w-6 h-6 text-purple-400" />, title:'Fast streaming', desc:'Snappy tokens with SSE and low‑latency routes.'
          },{
            icon: <ShieldCheck className="w-6 h-6 text-purple-400" />, title:'Clear pricing', desc:'Credits map to model tiers. No surprise usage.'
          },{
            icon: <Cpu className="w-6 h-6 text-purple-400" />, title:'Multiple models', desc:'Qwen, Mistral, Groq and more, one app.'
          }].map((c) => (
            <div key={c.title} className="rounded-3xl glass p-6 border border-white/10 hover:bg-white/[.08] transition group">
              <div className="flex items-center gap-3">{c.icon}<h3 className="font-semibold">{c.title}</h3></div>
              <p className="mt-2 text-sm text-white/70">{c.desc}</p>
              <div className="mt-4 h-px bg-gradient-to-r from-purple-500/30 to-transparent" />
            </div>
          ))}
        </div>

        {/* Comparison table */}
        <div className="mt-10 rounded-3xl glass p-6 border border-white/10">
          <h3 className="text-lg font-semibold">Compared to typical tooling</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-white/70">
                <tr>
                  <th className="py-2 pr-4">Feature</th>
                  <th className="py-2 pr-4">BelloSai</th>
                  <th className="py-2 pr-4">Typical subscriptions</th>
                  <th className="py-2">Single‑Model</th>
                </tr>
              </thead>
              <tbody>
                {[{f:'Pricing',b:'Fair monthly plans',s:'Annual lock‑ins',m:'Per‑token'},
                  {f:'Models',b:'Multiple providers',s:'Limited',m:'One'},
                  {f:'Streaming',b:'Yes',s:'Varies',m:'Varies'},
                  {f:'Limits',b:'Generous included usage',s:'Opaque caps',m:'Unpredictable'}].map((r) => (
                  <tr key={r.f} className="border-t border-white/10">
                    <td className="py-3 pr-4 text-white/80">{r.f}</td>
                    <td className="py-3 pr-4"><span className="text-emerald-300">{r.b}</span></td>
                    <td className="py-3 pr-4 text-white/70">{r.s}</td>
                    <td className="py-3 text-white/70">{r.m}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-10 text-center">
          <a href="/pricing" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 shadow-[0_10px_40px_rgba(124,58,237,.35)] hover:shadow-[0_14px_60px_rgba(124,58,237,.55)] font-semibold transition">
            See Pricing <Rocket className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* Hidden SEO headings for disambiguation */}
      <section className="sr-only">
        <h1>BelloSai AI chatbot – multi‑model streaming, subscription plans</h1>
        <h2>AI assistant with Qwen, Mistral, Groq, Claude‑compatible routes</h2>
        <h3>Generous monthly usage, heavy models included</h3>
      </section>
    </div>
  );
}
