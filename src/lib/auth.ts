import { supabase } from './supabase'
import type { User, Session } from '@supabase/supabase-js'

export interface AuthUser {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  subscription_tier: 'free' | 'pro' | 'enterprise'
  message_count: number
  message_limit: number
  api_keys?: Record<string, string>
}

export interface SignUpData {
  email: string
  password: string
  full_name?: string
}

export interface SignInData {
  email: string
  password: string
}

class AuthService {
  /**
   * Sign up a new user
   */
  async signUp(data: SignUpData) {
    const { email, password, full_name } = data
    
    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: full_name || '',
        }
      }
    })

    if (error) throw error
    return authData
  }

  /**
   * Sign in an existing user
   */
  async signIn(data: SignInData) {
    const { email, password } = data
    
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error
    return authData
  }

  /**
   * Sign out the current user
   */
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  /**
   * Get the current session
   */
  async getSession(): Promise<Session | null> {
    const { data: { session } } = await supabase.auth.getSession()
    return session
  }

  /**
   * Get the current user
   */
  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  }

  /**
   * Get the current user's profile data
   */
  async getUserProfile(): Promise<AuthUser | null> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return null

    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error fetching user profile:', error)
      return null
    }

    return profile
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<AuthUser>) {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) throw new Error('No authenticated user')

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Check if user has reached message limit
   */
  async checkMessageLimit(): Promise<boolean> {
    const profile = await this.getUserProfile()
    if (!profile) return false

    return profile.message_count < profile.message_limit
  }

  /**
   * Increment user's message count
   */
  async incrementMessageCount(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return false

    const { data, error } = await supabase.rpc('increment_message_count', {
      user_uuid: user.id
    })

    if (error) {
      console.error('Error incrementing message count:', error)
      return false
    }

    return data
  }

  /**
   * Reset password
   */
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) throw error
  }

  /**
   * Update password
   */
  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })
    if (error) throw error
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

export const authService = new AuthService() 
