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
    let fallbackTimeoutId: NodeJS.Timeout | null = null

    // Listen for auth changes first - this handles both initial session and changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        
        console.log('🔄 Auth state changed:', event, session ? `User logged in: ${session.user.email}` : 'No session')
        
        // Clear the fallback timeout since we got a response
        if (fallbackTimeoutId) {
          clearTimeout(fallbackTimeoutId)
          fallbackTimeoutId = null
        }
        
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
          // Clear timeout and mark as ready even if there's an error
          if (fallbackTimeoutId) {
            clearTimeout(fallbackTimeoutId)
            fallbackTimeoutId = null
          }
          setLoading(false)
          setIsAuthReady(true)
          return
        }
        
        // Start fallback timeout only after we've tried to get the session
        // and if we don't have a session yet
        if (!session && mounted) {
          fallbackTimeoutId = setTimeout(() => {
            if (mounted) {
              setLoading(currentLoading => {
                if (currentLoading) {
                  console.warn('⚠️ Auth fallback timeout - marking as ready without session')
                  setIsAuthReady(true)
                  return false
                }
                return currentLoading
              })
              fallbackTimeoutId = null
            }
          }, 5000) // Shorter timeout since we already tried to get session
        }
        
        // Note: We don't set the session here because onAuthStateChange will handle it
        // This prevents double-setting and ensures consistency
      } catch (error) {
        console.error('❌ Error in getInitialSession:', error)
        if (mounted) {
          // Clear timeout and mark as ready
          if (fallbackTimeoutId) {
            clearTimeout(fallbackTimeoutId)
            fallbackTimeoutId = null
          }
          setLoading(false)
          setIsAuthReady(true)
        }
      }
    }

    // Start the initialization
    getInitialSession()

    return () => {
      console.log('🧹 Cleaning up auth subscription')
      mounted = false
      if (fallbackTimeoutId) {
        clearTimeout(fallbackTimeoutId)
      }
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