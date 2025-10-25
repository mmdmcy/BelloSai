type RuntimeEnv = {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  VITE_STRIPE_PUBLISHABLE_KEY?: string;
  [key: string]: string | undefined;
};

export function getRuntimeEnv() {
  const w = typeof window !== 'undefined' ? (window as any) : {};
  const injected: RuntimeEnv = w.__ENV__ || {};
  return {
    VITE_SUPABASE_URL: injected.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: injected.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY,
    VITE_STRIPE_PUBLISHABLE_KEY: injected.VITE_STRIPE_PUBLISHABLE_KEY || import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
  } as const;
}


