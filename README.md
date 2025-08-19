# BelloSai - AI Chat Assistant

A modern, open-source AI chat app built with React, TypeScript, Tailwind, and Supabase. Talk to multiple top models (Qwen, Mistral, Groq, Claude-compatible routes) with real‑time streaming. Simple pay‑as‑you‑go bundles (no subscriptions).

## Live Demo

Website: https://bellosai.com

## Highlights
- Pay‑as‑you‑go bundles (Light / Medium / Heavy). No subscriptions, no expiry
- Tiered access mapped to model API costs; generous credits, sustainable pricing
- Real‑time streaming responses with SSE
- Anonymous usage with daily limit (3/day), upgrade anytime
- Dark/light themes, glass effects, designer mode grid layout

## Models & Tiers (examples)
- Free: Small/lightweight models for quick chats (limited daily usage)
- Light: Low‑cost general models (Qwen Flash, Mistral Small, etc.)
- Medium: Balanced performance models (Mistral Medium family, etc.)
- Heavy: Frontier/large models for complex tasks

See `src/models/registry.ts` and the in‑app Model Selector (Tiers tab) for details.

## Payments (Bundles)
- Bundles: Light, Medium (includes Light), Heavy (includes Medium + Light)
- One‑time purchase via Stripe Checkout (test mode supported)
- Credits are stored in `user_token_balances`; debited per message via RPC

## Anonymous Usage
- Anonymous users: 3 messages per day (resets at 2 AM local time)
- Create an account to buy bundles and store history/conversations

## Tech Stack
- Frontend: React 18, Vite, TypeScript, Tailwind CSS, React Router, Lucide
- Backend: Supabase (Postgres, Auth, RLS, Edge Functions)
- Streaming: SSE over Supabase Edge Functions
- Payments: Stripe (Checkout + Webhook)

## SEO & Safety
- Safe metadata in `index.html` (robots friendly, CSP, rating=safe for kids)
- `public/robots.txt` and `public/sitemap.xml` included

## Setup

1) Install
```bash
npm install
```

2) Env vars
Create `.env.local`:
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3) Supabase (CLI)
```bash
supabase db push
# Secrets
supabase secrets set GROQ_API_KEY=...
supabase secrets set MISTRAL_API_KEY=...
supabase secrets set CLAUDE_API_KEY=...
supabase secrets set QWEN_API_KEY=...
supabase secrets set STRIPE_SECRET_KEY=...
supabase secrets set STRIPE_WEBHOOK_SECRET=...
# Deploy functions
supabase functions deploy groq-chat
supabase functions deploy qwen-chat
supabase functions deploy claude-chat
supabase functions deploy mistral-chat
supabase functions deploy stripe-checkout
supabase functions deploy stripe-webhook
supabase functions deploy stripe-verify-session
```

4) Dev
```bash
npm run dev
```

## Project Structure
- `src/components/ModelSelector.tsx`: Tiers tab, favorites, grouping, gating
- `src/lib/supabase-chat.ts`: routing to Edge Functions + token pre‑debit
- `supabase/functions/*`: Edge Functions calling provider APIs with streaming
- `supabase/migrations/*`: credits tables and RPCs

## Deployment
- Frontend: Vercel (set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY)
- Backend: Supabase (migrations + functions + secrets)

## License
MIT 