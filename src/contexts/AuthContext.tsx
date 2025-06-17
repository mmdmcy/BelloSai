import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase, forceSessionRestore, checkAuthStatus } from '../lib/supabase'

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

  // Add visibility change handler to refresh session when tab becomes active
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden && session) {
        console.log('👀 Tab became visible, checking session validity...')
        
        // Check if session is still valid
        const now = Date.now() / 1000
        if (session.expires_at && session.expires_at < now + 300) { // Refresh if expires in 5 minutes
          console.log('🔄 Session expires soon, refreshing...')
          try {
            const { data, error } = await supabase.auth.refreshSession()
            if (error) {
              console.error('❌ Failed to refresh session on visibility change:', error)
            } else {
              console.log('✅ Session refreshed on visibility change')
            }
          } catch (error) {
            console.error('❌ Error refreshing session on visibility change:', error)
          }
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [session])

  // Add periodic session check
  useEffect(() => {
    if (!session) return

    const checkSessionPeriodically = setInterval(async () => {
      const now = Date.now() / 1000
      if (session.expires_at && session.expires_at < now + 600) { // Refresh if expires in 10 minutes
        console.log('🔄 Periodic session check - refreshing soon-to-expire session...')
        try {
          const { data, error } = await supabase.auth.refreshSession()
          if (error) {
            console.error('❌ Failed to refresh session periodically:', error)
          } else {
            console.log('✅ Session refreshed periodically')
          }
        } catch (error) {
          console.error('❌ Error refreshing session periodically:', error)
        }
      }
    }, 5 * 60 * 1000) // Check every 5 minutes

    return () => clearInterval(checkSessionPeriodically)
  }, [session])

  // Check if we have a stored session on mount
  useEffect(() => {
    const checkStoredSession = () => {
      try {
        const storedSession = localStorage.getItem('bellosai-auth-token')
        if (storedSession) {
          console.log('🔍 Found stored auth token, waiting for session restoration...')
          console.log('🔍 Token preview:', storedSession.substring(0, 50) + '...')
        } else {
          console.log('🔍 No stored auth token found')
        }
        
        // Also check for any other Supabase auth keys
        const allKeys = Object.keys(localStorage).filter(key => key.includes('supabase') || key.includes('auth'))
        console.log('🔍 All auth-related localStorage keys:', allKeys)
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
          console.log('✅ Clearing fallback timeout - auth event received')
          clearTimeout(fallbackTimeoutId)
          fallbackTimeoutId = null
        }
        
        // Update state immediately
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
        setIsAuthReady(true)

        // Handle specific auth events
        if (event === 'SIGNED_IN') {
          console.log('✅ User signed in:', session?.user?.email)
        } else if (event === 'SIGNED_OUT') {
          console.log('✅ User signed out')
          // Clear any stored tokens on sign out
          localStorage.removeItem('bellosai-auth-token')
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
        
        // First check if we have a token
        const hasToken = checkAuthStatus()
        
        // Try to get session
        const session = await forceSessionRestore()
        
        if (!mounted) return
        
        if (!session && hasToken) {
          console.warn('⚠️ Have token but no session - attempting refresh...')
          // Try to refresh the session
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
          if (refreshError) {
            console.error('❌ Error refreshing session:', refreshError)
            // Clear invalid token
            localStorage.removeItem('bellosai-auth-token')
          } else if (refreshData.session) {
            console.log('✅ Session refreshed successfully')
            return // Let the auth state change handler deal with it
          }
        }
        
        // Only start fallback timeout if we have no stored token at all
        const hasStoredToken = localStorage.getItem('bellosai-auth-token')
        if (!session && !hasStoredToken && mounted) {
          console.log('🕐 No session and no stored token - starting fallback timeout')
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
          }, 3000) // Even shorter timeout since no token exists
        } else if (!session && hasStoredToken && mounted) {
          console.log('🕐 No session but stored token exists - waiting longer for restoration')
          // Longer timeout when we have a stored token - give it time to restore
          fallbackTimeoutId = setTimeout(() => {
            if (mounted) {
              setLoading(currentLoading => {
                if (currentLoading) {
                  console.warn('⚠️ Auth fallback timeout - stored token failed to restore session')
                  setIsAuthReady(true)
                  return false
                }
                return currentLoading
              })
              fallbackTimeoutId = null
            }
          }, 15000) // Much longer timeout when we expect a session to be restored
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