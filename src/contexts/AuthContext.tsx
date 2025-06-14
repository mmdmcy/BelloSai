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
    
    // Initialize auth - simplified approach based on Bible Kitty guide
    const initializeAuth = async () => {
      try {
        console.log('🔄 Getting initial session...')
        
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('❌ Error getting session:', error)
          // Continue without throwing - don't block the app
        } else {
          console.log('✅ Initial session loaded:', session ? 'User logged in' : 'No session')
          setSession(session)
          setUser(session?.user ?? null)
        }
      } catch (error) {
        console.error('❌ Error in auth initialization:', error)
        // Continue without throwing - don't block the app
      } finally {
        console.log('✅ Auth initialization complete')
        setLoading(false)
        setIsAuthReady(true)
      }
    }

    // Listen for auth changes - this is the primary way auth state updates
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
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

    return () => {
      console.log('🧹 Cleaning up auth subscription')
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