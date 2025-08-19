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
    
    // Get initial session with a short retry to avoid race conditions on page load
    ;(async () => {
      let sess = null as any;
      for (let i = 0; i < 2; i++) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) { sess = session; break; }
        await new Promise(r => setTimeout(r, 400));
      }
      console.log('🔧 AuthProvider: Initial session loaded:', !!sess)
      setSession(sess)
      setUser(sess?.user ?? null)
      setLoading(false)
      setIsAuthReady(true)
    })()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session ? `User: ${session.user.email}` : 'No session')
        
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
        setIsAuthReady(true)
        
        console.log('✅ Auth state change processing complete')
      }
    )

    // Ensure session is not lost on visibility changes (soft restore)
    const handleVisibility = async () => {
      if (document.visibilityState === 'visible') {
        const { data } = await supabase.auth.getSession()
        if (data?.session) {
          setSession(data.session)
          setUser(data.session.user)
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      console.log('🔧 AuthProvider: Cleaning up auth listener')
      subscription.unsubscribe()
      document.removeEventListener('visibilitychange', handleVisibility)
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
