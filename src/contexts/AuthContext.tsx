import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase, recreateSupabaseClient } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
  isAuthReady: boolean
}

interface AuthProviderProps {
  children: React.ReactNode
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
  isAuthReady: false,
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthReady, setIsAuthReady] = useState(false)

  useEffect(() => {
    console.log('🔧 AuthProvider: Setting up auth listener')
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔧 AuthProvider: Initial session loaded:', !!session)
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      setIsAuthReady(true)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session ? `User: ${session.user.email}` : 'No session')
        console.log('📍 Stack trace for auth change:', new Error().stack)
        
        // Detect if this is a potentially corrupting auth state change
        // These specific events seem to corrupt the Supabase client
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          console.log('⚠️ Potentially corrupting auth event detected, testing client...')
          
          // Test if the Supabase client is still working by trying a quick session check
          try {
            const testPromise = supabase.auth.getSession()
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Client corruption test timeout')), 2000)
            )
            
            await Promise.race([testPromise, timeoutPromise])
            console.log('✅ Supabase client test passed - no corruption detected')
          } catch (error) {
            console.log('❌ Supabase client corruption detected! Recreating client...')
            
            // Recreate the Supabase client
            recreateSupabaseClient()
            
            // Give the new client a moment to initialize
            await new Promise(resolve => setTimeout(resolve, 500))
            
            console.log('✅ Supabase client recreated - corruption fixed')
          }
        }
        
        // Force a small delay to let any ongoing database operations complete
        // This prevents corruption of in-flight queries
        await new Promise(resolve => setTimeout(resolve, 100))
        
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
        setIsAuthReady(true)
        
        // Log when auth processing is complete
        console.log('✅ Auth state change processing complete')
      }
    )

    return () => {
      console.log('🔧 AuthProvider: Cleaning up auth listener')
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const value: AuthContextType = {
    user,
    session,
    loading,
    signOut,
    isAuthReady,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 
