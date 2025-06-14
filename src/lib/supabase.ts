import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('🔧 Supabase config:', { url: supabaseUrl, hasKey: !!supabaseAnonKey })

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables:', {
    url: supabaseUrl ? 'Set' : 'Missing',
    key: supabaseAnonKey ? 'Set' : 'Missing'
  })
  throw new Error('Missing Supabase environment variables. Please check your deployment settings.')
}

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
      user_messages: {
        Row: {
          id: number
          user_id: string
          message: string
          created_at: string
        }
        Insert: {
          user_id: string
          message: string
          created_at?: string
        }
        Update: {
          user_id?: string
          message?: string
          created_at?: string
        }
      }
      stripe_customers: {
        Row: {
          id: number
          user_id: string
          customer_id: string
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          user_id: string
          customer_id: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          user_id?: string
          customer_id?: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      stripe_subscriptions: {
        Row: {
          id: number
          customer_id: string
          subscription_id: string | null
          price_id: string | null
          current_period_start: number | null
          current_period_end: number | null
          cancel_at_period_end: boolean
          payment_method_brand: string | null
          payment_method_last4: string | null
          status: 'not_started' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'paused'
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          customer_id: string
          subscription_id?: string | null
          price_id?: string | null
          current_period_start?: number | null
          current_period_end?: number | null
          cancel_at_period_end?: boolean
          payment_method_brand?: string | null
          payment_method_last4?: string | null
          status: 'not_started' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'paused'
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          customer_id?: string
          subscription_id?: string | null
          price_id?: string | null
          current_period_start?: number | null
          current_period_end?: number | null
          cancel_at_period_end?: boolean
          payment_method_brand?: string | null
          payment_method_last4?: string | null
          status?: 'not_started' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'paused'
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      stripe_orders: {
        Row: {
          id: number
          checkout_session_id: string
          payment_intent_id: string
          customer_id: string
          amount_subtotal: number
          amount_total: number
          currency: string
          payment_status: string
          status: 'pending' | 'completed' | 'canceled'
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          checkout_session_id: string
          payment_intent_id: string
          customer_id: string
          amount_subtotal: number
          amount_total: number
          currency: string
          payment_status: string
          status?: 'pending' | 'completed' | 'canceled'
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          checkout_session_id?: string
          payment_intent_id?: string
          customer_id?: string
          amount_subtotal?: number
          amount_total?: number
          currency?: string
          payment_status?: string
          status?: 'pending' | 'completed' | 'canceled'
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
    }
    Views: {
      stripe_user_subscriptions: {
        Row: {
          customer_id: string
          subscription_id: string | null
          subscription_status: 'not_started' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'paused' | null
          price_id: string | null
          current_period_start: number | null
          current_period_end: number | null
          cancel_at_period_end: boolean | null
          payment_method_brand: string | null
          payment_method_last4: string | null
        }
      }
    }
    Functions: {
      increment_message_count: {
        Args: {
          user_uuid: string
        }
        Returns: boolean
      }
      generate_share_id: {
        Args: {}
        Returns: string
      }
    }
    Enums: {
      subscription_tier: 'free' | 'pro' | 'enterprise'
      message_type: 'user' | 'ai'
      subscription_status: 'active' | 'inactive' | 'cancelled' | 'past_due'
      stripe_subscription_status: 'not_started' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'paused'
      stripe_order_status: 'pending' | 'completed' | 'canceled'
    }
  }
} 