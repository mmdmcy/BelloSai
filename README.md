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

---

## 🚀 Technologies & Architecture (CV Highlights)

### Frontend Stack
| Technology | Purpose |
|------------|---------|
| **React 18** | Modern component architecture with Hooks, Context API, and functional components |
| **TypeScript 5** | Full type safety across 53+ source files, interfaces, and strict typing |
| **Vite 5** | Lightning-fast HMR, optimized builds, and modern ES module bundling |
| **Tailwind CSS 3** | Utility-first styling with custom design system |
| **React Router 7** | Client-side routing with protected routes |
| **Lucide React** | Modern icon system |

### Backend & Infrastructure
| Technology | Purpose |
|------------|---------|
| **Supabase** | Backend-as-a-Service with PostgreSQL, Auth, RLS, and Edge Functions |
| **PostgreSQL** | Relational database with custom enums, foreign keys, triggers, and stored procedures |
| **Deno Runtime** | Edge Functions for serverless AI API routing |
| **Cloudflare Workers** | Edge deployment with Wrangler CLI (alternative hosting) |

### AI Integration (Multi-Provider Architecture)
- **45+ AI Models** from 5 providers in a unified interface
- **Providers:** Claude (Anthropic), DeepSeek, Mistral, Groq, Qwen (Alibaba)
- **SSE Streaming** for real-time AI responses
- **Model Tiering System** (Light/Medium/Heavy) with automatic cost classification
- **Provider Routing** via Edge Functions with OpenAI-compatible API patterns

### Payment & Monetization
| Technology | Purpose |
|------------|---------|
| **Stripe Checkout** | Secure payment processing for subscriptions and bundles |
| **Stripe Webhooks** | Real-time subscription status updates |
| **Stripe Customer Portal** | Self-service billing management |
| **Token/Credit System** | Custom credit-based billing with tiered pricing |

### Security & Best Practices
- **Row-Level Security (RLS)** - Database-level access control policies
- **Content Security Policy (CSP)** - XSS protection via meta headers
- **JWT Authentication** - Secure session management via Supabase Auth
- **Environment Variable Management** - Runtime env injection for multi-platform deployment

### UI/UX Design Patterns
- **Glassmorphism Design System** - 15+ glass effect utilities with backdrop-blur
- **iOS-Inspired Components** - Modern panels, toolbars, chips, and pressable effects
- **Dynamic Theme Engine** - 10+ themes with light/dark mode support
- **CSS Custom Properties** - Design tokens for colors, typography, spacing, and shadows
- **Responsive Design** - Mobile-first with adaptive layouts
- **Accessibility** - Reduced motion support, custom scrollbars, focus states

### Architecture Patterns
- **Context API State Management** - AuthContext, ThemeContext, MessageContext
- **Custom Hooks** - `useSubscription`, `useMessages` for reusable logic
- **Service Layer Pattern** - Dedicated services for Stripe, Supabase, and chat
- **Model Registry Pattern** - Centralized AI model configuration with capabilities
- **Database Migration System** - Versioned schema migrations

### DevOps & Infrastructure
- **ESLint 9** - Code quality with React and TypeScript rules
- **PostCSS & Autoprefixer** - CSS processing pipeline
- **Multi-Platform Deployment** - Vercel, Cloudflare Pages/Workers support
- **Supabase CLI** - Database migrations and Edge Function deployment

### SEO & Performance
- **Structured Data (JSON-LD)** - WebSite, Organization, and SoftwareApplication schemas
- **Open Graph & Twitter Cards** - Social media preview optimization
- **Semantic HTML5** - Proper heading hierarchy and accessibility
- **Content-Visibility** - CSS containment for large content optimization
- **Lazy Loading** - Deferred rendering for performance

### Database Schema Highlights
```sql
-- Custom PostgreSQL enums
CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'enterprise');
CREATE TYPE message_type AS ENUM ('user', 'ai');
CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'cancelled', 'past_due');

-- Trigger-based automation
-- Auto user creation, timestamp updates, message counting
-- Share ID generation with cryptographically secure random bytes
```

### Project Statistics
- **53+ Source Files** in `/src`
- **18 React Components** with modular architecture
- **15 Library Modules** for services and utilities
- **13 Supabase Edge Functions** for serverless API
- **11 Database Migrations** with full version control
- **1,400+ Lines** in main App component

---

*This project demonstrates full-stack development expertise across modern React architecture, serverless computing, multi-provider AI integration, payment processing, and enterprise-grade security patterns.*
