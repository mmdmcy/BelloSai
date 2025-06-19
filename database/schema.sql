-- BelloSai Database Schema
-- 
-- Complete PostgreSQL database schema for the BelloSai AI Chat Assistant application.
-- This schema supports multi-user chat functionality, subscription management,
-- and AI conversation storage with advanced features.
--
-- Architecture Overview:
-- - User management with Supabase Auth integration
-- - Conversation-based chat organization with branching support
-- - Subscription management with Stripe integration
-- - File attachment support for multimedia conversations
-- - Row Level Security (RLS) for data protection
-- - Real-time capabilities with optimized indexing
--
-- Key Features:
-- - Multi-tier subscription system (free, pro, enterprise)
-- - Message branching for conversation alternatives
-- - Shared conversation support with public links
-- - Attachment management with file metadata
-- - Automatic timestamp tracking and triggers
-- - Comprehensive indexing for performance
--
-- Security:
-- - Row Level Security enabled on all user-facing tables
-- - User-scoped data access policies
-- - Shared conversation access controls
-- - Secure function execution with SECURITY DEFINER
--
-- External Integrations:
-- - Supabase Auth for user management
-- - Stripe for payment processing and subscriptions
-- - Edge Functions for AI model integration

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types/enums
CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'enterprise');
CREATE TYPE message_type AS ENUM ('user', 'ai');
CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'cancelled', 'past_due');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    subscription_tier subscription_tier DEFAULT 'free',
    message_count INTEGER DEFAULT 0,
    message_limit INTEGER DEFAULT 100, -- Free tier limit
    api_keys JSONB, -- Store user's own API keys for different models
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscription plans table
CREATE TABLE public.subscription_plans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    message_limit INTEGER NOT NULL,
    features TEXT[] NOT NULL,
    stripe_price_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User subscriptions table
CREATE TABLE public.user_subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES public.subscription_plans(id),
    stripe_subscription_id TEXT,
    status subscription_status DEFAULT 'active',
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversations table
CREATE TABLE public.conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    model TEXT NOT NULL,
    is_shared BOOLEAN DEFAULT FALSE,
    share_id TEXT UNIQUE, -- Public ID for sharing
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table (supports branching)
CREATE TABLE public.messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    type message_type NOT NULL,
    content TEXT NOT NULL,
    model TEXT, -- Which AI model was used for this message
    parent_message_id UUID REFERENCES public.messages(id), -- For branching conversations
    attachments TEXT[], -- Array of attachment IDs
    metadata JSONB, -- Additional metadata (tokens used, processing time, etc.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attachments table
CREATE TABLE public.attachments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    storage_path TEXT NOT NULL, -- Path in Supabase storage
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX idx_conversations_share_id ON public.conversations(share_id);
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_parent_id ON public.messages(parent_message_id);
CREATE INDEX idx_attachments_user_id ON public.attachments(user_id);
CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Conversations policies
CREATE POLICY "Users can view own conversations" ON public.conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view shared conversations" ON public.conversations
    FOR SELECT USING (is_shared = true);

CREATE POLICY "Users can create own conversations" ON public.conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON public.conversations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations" ON public.conversations
    FOR DELETE USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Users can view messages in own conversations" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE id = conversation_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view messages in shared conversations" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE id = conversation_id AND is_shared = true
        )
    );

CREATE POLICY "Users can create messages in own conversations" ON public.messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE id = conversation_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update messages in own conversations" ON public.messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE id = conversation_id AND user_id = auth.uid()
        )
    );

-- Attachments policies
CREATE POLICY "Users can view own attachments" ON public.attachments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own attachments" ON public.attachments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own attachments" ON public.attachments
    FOR DELETE USING (auth.uid() = user_id);

-- Subscription plans policies (public read)
CREATE POLICY "Anyone can view subscription plans" ON public.subscription_plans
    FOR SELECT USING (true);

-- User subscriptions policies
CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON public.user_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- Functions

-- Function to handle user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, avatar_url)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update user's updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at timestamps
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
    BEFORE UPDATE ON public.user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to increment message count and check limits
CREATE OR REPLACE FUNCTION public.increment_message_count(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_count INTEGER;
    limit_count INTEGER;
BEGIN
    SELECT message_count, message_limit INTO current_count, limit_count
    FROM public.users WHERE id = user_uuid;
    
    IF current_count >= limit_count THEN
        RETURN FALSE; -- Message limit exceeded
    END IF;
    
    UPDATE public.users 
    SET message_count = message_count + 1 
    WHERE id = user_uuid;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate share ID for conversations
CREATE OR REPLACE FUNCTION public.generate_share_id()
RETURNS TEXT AS $$
BEGIN
    RETURN encode(gen_random_bytes(16), 'base64url');
END;
$$ LANGUAGE plpgsql;

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, description, price, message_limit, features) VALUES
    ('Free', 'Basic access to AI chat', 0, 100, ARRAY['Access to basic models', '100 messages per month', 'Standard support']),
    ('Pro', 'Enhanced AI experience', 19.99, 2000, ARRAY['Access to all models', '2,000 messages per month', 'Priority support', 'Chat sharing', 'File attachments']),
    ('Enterprise', 'Unlimited AI power', 99.99, 50000, ARRAY['Access to all models', '50,000 messages per month', '24/7 priority support', 'Chat sharing', 'File attachments', 'Bring your own API keys', 'Advanced analytics']);

-- Create storage bucket for attachments (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for attachments
CREATE POLICY "Users can upload own attachments" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own attachments" ON storage.objects
    FOR SELECT USING (bucket_id = 'attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own attachments" ON storage.objects
    FOR DELETE USING (bucket_id = 'attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ========================================
-- BIBLE KITTY SPECIFIC ADDITIONS
-- ========================================

-- User Messages Tracking (from Bible Kitty template)
CREATE TABLE IF NOT EXISTS public.user_messages (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stripe Integration Tables (from Bible Kitty template)

-- Stripe Customers
CREATE TABLE IF NOT EXISTS public.stripe_customers (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  customer_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Stripe Subscription Status Enum
CREATE TYPE IF NOT EXISTS stripe_subscription_status AS ENUM (
  'not_started', 'incomplete', 'incomplete_expired', 
  'trialing', 'active', 'past_due', 'canceled', 
  'unpaid', 'paused'
);

-- Stripe Subscriptions
CREATE TABLE IF NOT EXISTS public.stripe_subscriptions (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  customer_id TEXT UNIQUE NOT NULL,
  subscription_id TEXT DEFAULT NULL,
  price_id TEXT DEFAULT NULL,
  current_period_start BIGINT DEFAULT NULL,
  current_period_end BIGINT DEFAULT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  payment_method_brand TEXT DEFAULT NULL,
  payment_method_last4 TEXT DEFAULT NULL,
  status stripe_subscription_status NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Stripe Order Status Enum
CREATE TYPE IF NOT EXISTS stripe_order_status AS ENUM ('pending', 'completed', 'canceled');

-- Stripe Orders
CREATE TABLE IF NOT EXISTS public.stripe_orders (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  checkout_session_id TEXT NOT NULL,
  payment_intent_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  amount_subtotal BIGINT NOT NULL,
  amount_total BIGINT NOT NULL,
  currency TEXT NOT NULL,
  payment_status TEXT NOT NULL,
  status stripe_order_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Indexes for new tables
CREATE INDEX IF NOT EXISTS idx_user_messages_user_id ON public.user_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_user_id ON public.stripe_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_customer_id ON public.stripe_customers(customer_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_customer_id ON public.stripe_subscriptions(customer_id);

-- RLS Policies for new tables

-- User Messages
ALTER TABLE public.user_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages" ON public.user_messages
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own messages" ON public.user_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Stripe Customers
ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own customer data" ON public.stripe_customers
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() AND deleted_at IS NULL);

-- Stripe Subscriptions
ALTER TABLE public.stripe_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription data" ON public.stripe_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT customer_id FROM public.stripe_customers 
      WHERE user_id = auth.uid() AND deleted_at IS NULL
    ) AND deleted_at IS NULL
  );

-- Stripe Orders
ALTER TABLE public.stripe_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own order data" ON public.stripe_orders
  FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT customer_id FROM public.stripe_customers 
      WHERE user_id = auth.uid() AND deleted_at IS NULL
    ) AND deleted_at IS NULL
  );

-- Database Views (from Bible Kitty template)

-- Veilige view voor user subscriptions
CREATE OR REPLACE VIEW stripe_user_subscriptions WITH (security_invoker = true) AS
SELECT
  c.customer_id,
  s.subscription_id,
  s.status as subscription_status,
  s.price_id,
  s.current_period_start,
  s.current_period_end,
  s.cancel_at_period_end,
  s.payment_method_brand,
  s.payment_method_last4
FROM stripe_customers c
LEFT JOIN stripe_subscriptions s ON c.customer_id = s.customer_id
WHERE c.user_id = auth.uid()
AND c.deleted_at IS NULL
AND (s.deleted_at IS NULL OR s IS NULL);

-- Triggers for updated_at timestamps on new tables
CREATE TRIGGER update_stripe_customers_updated_at
    BEFORE UPDATE ON public.stripe_customers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stripe_subscriptions_updated_at
    BEFORE UPDATE ON public.stripe_subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stripe_orders_updated_at
    BEFORE UPDATE ON public.stripe_orders
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column(); 