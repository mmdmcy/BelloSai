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
          role: 'user' | 'assistant'
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
          role: 'user' | 'assistant'
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
          role?: 'user' | 'assistant'
          content?: string
          model?: string | null
          parent_message_id?: string | null
          attachments?: string[] | null
          metadata?: Record<string, any> | null
          created_at?: string
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
          status: Database['public']['Enums']['stripe_subscription_status']
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
          status: Database['public']['Enums']['stripe_subscription_status']
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
          status?: Database['public']['Enums']['stripe_subscription_status']
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
          status: Database['public']['Enums']['stripe_order_status']
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
          status?: Database['public']['Enums']['stripe_order_status']
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
          status?: Database['public']['Enums']['stripe_order_status']
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
          subscription_status: Database['public']['Enums']['stripe_subscription_status'] | null
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