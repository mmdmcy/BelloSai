/**
 * Supabase Client Configuration
 * 
 * This module configures and exports the Supabase client used throughout the application
 * for database operations, authentication, and real-time subscriptions.
 * 
 * Features:
 * - Custom storage configuration to prevent cross-tab auth sync issues
 * - Optimized settings for BelloSai chat application
 * - Session management with manual refresh control
 * - Type-safe database operations using generated types
 * 
 * Configuration:
 * - Disables auto-refresh to prevent connection corruption
 * - Uses localStorage for session persistence
 * - Implements PKCE flow for secure authentication
 * - Sets up real-time subscriptions with rate limiting
 * 
 * Environment Variables:
 * - VITE_SUPABASE_URL: Your Supabase project URL
 * - VITE_SUPABASE_ANON_KEY: Your Supabase anonymous key
 */

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

// Create a custom storage that disables BroadcastChannel to prevent cross-tab auth sync
const customStorage = {
  getItem: (key: string) => {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem(key);
    }
    return null;
  },
  setItem: (key: string, value: string) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, value);
    }
  },
  removeItem: (key: string) => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(key);
    }
  },
  // Add this to disable BroadcastChannel
  removeEventListener: () => {},
  addEventListener: () => {}
}

// Create the Supabase client with disabled cross-tab sync
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false, // Disable auto-refresh to prevent connection corruption
    persistSession: true,
    detectSessionInUrl: false, // Disable URL session detection to prevent auth state changes
    storage: customStorage,
    storageKey: 'sb-uxqrdnotdkcwfwcifajf-auth-token', // Use the standard Supabase storage key
    flowType: 'pkce'
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
