import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://uxqrdnotdkcwfwcifajf.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4cXJkbm90ZGtjd2Z3Y2lmYWpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0OTcyMjgsImV4cCI6MjA2NTA3MzIyOH0.qiOp6HjPir90t3y6wq9teoYdZsMPGnQcGiDEucEDako'

console.log('🔧 Supabase config:', { url: supabaseUrl, hasKey: !!supabaseAnonKey })

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          subscription_tier: 'free' | 'pro' | 'enterprise'
          message_count: number
          message_limit: number
          api_keys: Record<string, string> | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          subscription_tier?: 'free' | 'pro' | 'enterprise'
          message_count?: number
          message_limit?: number
          api_keys?: Record<string, string> | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          subscription_tier?: 'free' | 'pro' | 'enterprise'
          message_count?: number
          message_limit?: number
          api_keys?: Record<string, string> | null
          created_at?: string
          updated_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          user_id: string
          title: string
          model: string
          is_shared: boolean
          share_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          model: string
          is_shared?: boolean
          share_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          model?: string
          is_shared?: boolean
          share_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          type: 'user' | 'ai'
          content: string
          model: string | null
          parent_message_id: string | null
          attachments: string[] | null
          metadata: Record<string, any> | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          type: 'user' | 'ai'
          content: string
          model?: string | null
          parent_message_id?: string | null
          attachments?: string[] | null
          metadata?: Record<string, any> | null
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          type?: 'user' | 'ai'
          content?: string
          model?: string | null
          parent_message_id?: string | null
          attachments?: string[] | null
          metadata?: Record<string, any> | null
          created_at?: string
        }
      }
      attachments: {
        Row: {
          id: string
          user_id: string
          filename: string
          file_type: string
          file_size: number
          storage_path: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          filename: string
          file_type: string
          file_size: number
          storage_path: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          filename?: string
          file_type?: string
          file_size?: number
          storage_path?: string
          created_at?: string
        }
      }
      subscription_plans: {
        Row: {
          id: string
          name: string
          description: string
          price: number
          message_limit: number
          features: string[]
          stripe_price_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          price: number
          message_limit: number
          features: string[]
          stripe_price_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          price?: number
          message_limit?: number
          features?: string[]
          stripe_price_id?: string | null
          created_at?: string
        }
      }
      user_subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_id: string
          stripe_subscription_id: string | null
          status: 'active' | 'inactive' | 'cancelled' | 'past_due'
          current_period_start: string
          current_period_end: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_id: string
          stripe_subscription_id?: string | null
          status?: 'active' | 'inactive' | 'cancelled' | 'past_due'
          current_period_start: string
          current_period_end: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_id?: string
          stripe_subscription_id?: string | null
          status?: 'active' | 'inactive' | 'cancelled' | 'past_due'
          current_period_start?: string
          current_period_end?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      subscription_tier: 'free' | 'pro' | 'enterprise'
      message_type: 'user' | 'ai'
      subscription_status: 'active' | 'inactive' | 'cancelled' | 'past_due'
    }
  }
} 