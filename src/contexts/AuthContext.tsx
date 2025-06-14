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
    // Initialize auth with retry
    const initializeAuth = async (retryCount = 0) => {
      try {
        console.log(`🔄 Initializing auth... (attempt ${retryCount + 1})`)
        
        // Check if supabase client is available
        if (!supabase) {
          console.error('❌ Supabase client not available')
          return
        }
        
        // Add timeout to the request itself
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 3000)
        )
        
        const sessionPromise = supabase.auth.getSession()
        
        const { data: { session }, error } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any
        
        if (error) {
          console.error('❌ Error getting session:', error)
          // Don't throw, just continue without session
        } else {
          console.log('✅ Session loaded:', session ? 'User logged in' : 'No session')
          setSession(session)
          setUser(session?.user ?? null)
        }
      } catch (error) {
        console.error(`❌ Error initializing auth (attempt ${retryCount + 1}):`, error)
        
        // Retry up to 2 times
        if (retryCount < 2) {
          console.log('🔄 Retrying auth initialization...')
          setTimeout(() => initializeAuth(retryCount + 1), 1000)
          return
        }
        
        // After all retries failed, continue anyway
        console.warn('⚠️ Auth initialization failed after retries, proceeding without auth')
      } finally {
        if (retryCount >= 2) {
          console.log('✅ Auth initialization complete (with or without success)')
          setLoading(false)
          setIsAuthReady(true)
        }
      }
    }

    initializeAuth()

    // Fallback timeout in case auth initialization hangs
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('⚠️ Auth initialization timeout, proceeding without auth')
        setLoading(false)
        setIsAuthReady(true)
      }
    }, 10000) // 10 second timeout - give more time for slow connections

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        // Handle specific auth events
        if (event === 'SIGNED_IN') {
          console.log('User signed in:', session?.user?.email)
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out')
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed for user:', session?.user?.email)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeoutId)
    }
  }, [])

  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error signing out:', error)
        throw error
      }
    } catch (error) {
      console.error('Failed to sign out:', error)
      throw error
    } finally {
      setLoading(false)
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