import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
  isAuthReady: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthReady, setIsAuthReady] = useState(false)

  // Check if we have a stored session on mount
  useEffect(() => {
    const checkStoredSession = () => {
      try {
        const storedSession = localStorage.getItem('bellosai-auth-token')
        if (storedSession) {
          console.log('🔍 Found stored auth token, waiting for session restoration...')
        } else {
          console.log('🔍 No stored auth token found')
        }
      } catch (error) {
        console.warn('⚠️ Could not check stored session:', error)
      }
    }
    
    checkStoredSession()
  }, [])

  useEffect(() => {
    console.log('🔄 Starting auth initialization...')
    
    let mounted = true

    // Listen for auth changes first - this handles both initial session and changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        
        console.log('🔄 Auth state changed:', event, session ? `User logged in: ${session.user.email}` : 'No session')
        
        // Update state
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
        setIsAuthReady(true)

        // Handle specific auth events
        if (event === 'SIGNED_IN') {
          console.log('✅ User signed in:', session?.user?.email)
        } else if (event === 'SIGNED_OUT') {
          console.log('✅ User signed out')
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('🔄 Token refreshed for user:', session?.user?.email)
        } else if (event === 'INITIAL_SESSION') {
          console.log('🔄 Initial session loaded:', session ? `User: ${session.user.email}` : 'No session')
        }
      }
    )

    // Get initial session - this will trigger the onAuthStateChange with INITIAL_SESSION
    const getInitialSession = async () => {
      try {
        console.log('🔄 Getting initial session...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!mounted) return
        
        if (error) {
          console.error('❌ Error getting initial session:', error)
          // Still mark as ready even if there's an error
          setLoading(false)
          setIsAuthReady(true)
        }
        // Note: We don't set the session here because onAuthStateChange will handle it
        // This prevents double-setting and ensures consistency
      } catch (error) {
        console.error('❌ Error in getInitialSession:', error)
        if (mounted) {
          setLoading(false)
          setIsAuthReady(true)
        }
      }
    }

    // Start the initialization
    getInitialSession()

    // Fallback timeout - if nothing happens in 10 seconds, mark as ready anyway
    const fallbackTimeoutId = setTimeout(() => {
      if (mounted && loading) {
        console.warn('⚠️ Auth fallback timeout - marking as ready without session')
        setLoading(false)
        setIsAuthReady(true)
      }
    }, 10000)

    return () => {
      console.log('🧹 Cleaning up auth subscription')
      mounted = false
      clearTimeout(fallbackTimeoutId)
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    try {
      console.log('🔄 Signing out...')
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('❌ Error signing out:', error)
        throw error
      }
      console.log('✅ Signed out successfully')
    } catch (error) {
      console.error('❌ Sign out failed:', error)
      throw error
    }
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