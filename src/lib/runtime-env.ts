type RuntimeEnv = {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  VITE_STRIPE_PUBLISHABLE_KEY?: string;
  [key: string]: string | undefined;
};

/**
 * Public runtime configuration for the frontend.
 *
 * Resolution order: values injected by the Cloudflare Worker at serve time
 * (window.__ENV__, from wrangler.jsonc "vars"), then Vite build-time env
 * (.env.local, see .env.example). There are deliberately no hardcoded
 * fallbacks: a misconfigured deployment should fail loudly (src/lib/supabase.ts
 * throws) instead of silently talking to someone else's Supabase project.
 */
export function getRuntimeEnv() {
  const w = typeof window !== 'undefined' ? (window as any) : {};
  const injected: RuntimeEnv = w.__ENV__ || {};
  const env = {
    VITE_SUPABASE_URL: injected.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || '',
    VITE_SUPABASE_ANON_KEY: injected.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    VITE_STRIPE_PUBLISHABLE_KEY: injected.VITE_STRIPE_PUBLISHABLE_KEY || import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
  } as const;
  if ((!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) && typeof window !== 'undefined') {
    try { console.error('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set (see .env.example).'); } catch {}
  }
  return env;
}


