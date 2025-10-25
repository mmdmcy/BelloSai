type RuntimeEnv = {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  VITE_STRIPE_PUBLISHABLE_KEY?: string;
  [key: string]: string | undefined;
};

export function getRuntimeEnv() {
  const w = typeof window !== 'undefined' ? (window as any) : {};
  const injected: RuntimeEnv = w.__ENV__ || {};
  const defaults: Required<Pick<RuntimeEnv, 'VITE_SUPABASE_URL' | 'VITE_SUPABASE_ANON_KEY'>> & Pick<RuntimeEnv,'VITE_STRIPE_PUBLISHABLE_KEY'> = {
    VITE_SUPABASE_URL: 'https://sbmgdvbuveghxqneterd.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNibWdkdmJ1dmVnaHhxbmV0ZXJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMDc0NDIsImV4cCI6MjA3MTg4MzQ0Mn0.mHLCijfGLnKR-sqhwshNCdm6ThQg5qfehXjc78ZEzWQ',
    VITE_STRIPE_PUBLISHABLE_KEY: 'pk_test_51Q4PWFBzQy7WGhPxTqHnfZ8zBGnCISzt4Rwus8Dv8Oa2zRqcU3JLpY0cf5vSjHnWeBvaAKvkdYHlX4CPdeJG14ZC00WXgHImgP'
  };
  const env = {
    VITE_SUPABASE_URL: injected.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || defaults.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: injected.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || defaults.VITE_SUPABASE_ANON_KEY,
    VITE_STRIPE_PUBLISHABLE_KEY: injected.VITE_STRIPE_PUBLISHABLE_KEY || import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || defaults.VITE_STRIPE_PUBLISHABLE_KEY,
  } as const;
  if ((!injected.VITE_SUPABASE_URL || !injected.VITE_SUPABASE_ANON_KEY) && typeof window !== 'undefined') {
    try { console.warn('Using default runtime env fallback for Supabase.'); } catch {}
  }
  return env;
}


