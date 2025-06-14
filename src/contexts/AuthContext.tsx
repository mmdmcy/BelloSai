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

  useEffect(() => {
    console.log('🔄 Starting auth initialization...')
    
    let mounted = true
    let timeoutId: NodeJS.Timeout

    // Initialize auth with timeout protection
    const initializeAuth = async () => {
      try {
        console.log('🔄 Getting initial session...')
        
        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error('Session request timeout'))
          }, 5000) // 5 second timeout
        })

        // Race between session request and timeout
        const sessionPromise = supabase.auth.getSession()
        
        const result = await Promise.race([sessionPromise, timeoutPromise])
        
        // Clear timeout if we got a result
        clearTimeout(timeoutId)
        
        const { data: { session }, error } = result as any
        
        if (!mounted) return // Component unmounted
        
        if (error) {
          console.error('❌ Error getting session:', error)
        } else {
          console.log('✅ Initial session loaded:', session ? 'User logged in' : 'No session')
          setSession(session)
          setUser(session?.user ?? null)
        }
      } catch (error) {
        console.error('❌ Error in auth initialization:', error)
        if (error instanceof Error && error.message === 'Session request timeout') {
          console.warn('⚠️ Session request timed out, continuing without initial session')
        }
      } finally {
        if (mounted) {
          console.log('✅ Auth initialization complete')
          setLoading(false)
          setIsAuthReady(true)
        }
      }
    }

    // Listen for auth changes - this is the primary way auth state updates
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        
        console.log('🔄 Auth state changed:', event, session ? 'User logged in' : 'No session')
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
        }
      }
    )

    // Initialize auth
    initializeAuth()

    // Fallback timeout - if nothing happens in 8 seconds, mark as ready anyway
    const fallbackTimeoutId = setTimeout(() => {
      if (mounted && loading) {
        console.warn('⚠️ Auth fallback timeout - marking as ready without session')
        setLoading(false)
        setIsAuthReady(true)
      }
    }, 8000)

    return () => {
      console.log('🧹 Cleaning up auth subscription')
      mounted = false
      clearTimeout(timeoutId)
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