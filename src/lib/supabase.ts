import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('🔧 Supabase config:', { url: supabaseUrl, hasKey: !!supabaseAnonKey })

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables:', {
    url: supabaseUrl ? 'Set' : 'Missing',
    key: supabaseAnonKey ? 'Set' : 'Missing'
  })
  throw new Error('Missing Supabase environment variables. Please check your deployment settings.')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: localStorage,
    storageKey: 'bellosai-auth-token',
    flowType: 'pkce',
    debug: import.meta.env.DEV,
    // Lock to prevent concurrent auth operations
    lock: async (name: string, acquireTimeout?: number, fn?: () => Promise<any>) => {
      console.log(`🔒 Auth lock acquired: ${name}`);
      if (fn) {
        try {
          return await fn();
        } finally {
          console.log(`🔓 Auth lock released: ${name}`);
        }
      }
    }
  },
  global: {
    headers: {
      'x-client-info': 'bellosai',
      'x-app-version': '1.0.0'
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Helper function to force session restoration
export const forceSessionRestore = async () => {
  console.log('🔄 Forcing session restoration...');
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('❌ Error forcing session restore:', error);
      return null;
    }
    console.log('✅ Session restore result:', data.session ? 'Session found' : 'No session');
    return data.session;
  } catch (error) {
    console.error('❌ Exception during session restore:', error);
    return null;
  }
};

// Helper function to check auth status
export const checkAuthStatus = () => {
  const token = localStorage.getItem('bellosai-auth-token');
  console.log('🔍 Auth status check:', {
    hasToken: !!token,
    tokenPreview: token ? token.substring(0, 50) + '...' : 'None'
  });
  return !!token;
};

// Export the Database type from the separate file
export type { Database } from '../types/database' 