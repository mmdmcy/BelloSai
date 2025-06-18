-- Stripe Integration Migration
-- Creates tables, views, and policies for Stripe subscription management

-- Stripe Customers Table
CREATE TABLE IF NOT EXISTS public.stripe_customers (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  customer_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Stripe Subscription Status Enum
DO $$ BEGIN
  CREATE TYPE stripe_subscription_status AS ENUM (
    'not_started', 'incomplete', 'incomplete_expired', 
    'trialing', 'active', 'past_due', 'canceled', 
    'unpaid', 'paused'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Stripe Subscriptions Table
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
DO $$ BEGIN
  CREATE TYPE stripe_order_status AS ENUM ('pending', 'completed', 'canceled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Stripe Orders Table
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

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stripe_customers_user_id ON public.stripe_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_customer_id ON public.stripe_customers(customer_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_customer_id ON public.stripe_subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_subscription_id ON public.stripe_subscriptions(subscription_id);
CREATE INDEX IF NOT EXISTS idx_stripe_orders_customer_id ON public.stripe_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_stripe_orders_checkout_session_id ON public.stripe_orders(checkout_session_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS (Row Level Security)
ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stripe_customers
CREATE POLICY "Users can view their own customer data" ON public.stripe_customers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage customer data" ON public.stripe_customers
    FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for stripe_subscriptions
CREATE POLICY "Users can view their own subscription data" ON public.stripe_subscriptions
    FOR SELECT USING (
        customer_id IN (
            SELECT customer_id FROM public.stripe_customers
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Service role can manage subscription data" ON public.stripe_subscriptions
    FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for stripe_orders
CREATE POLICY "Users can view their own order data" ON public.stripe_orders
    FOR SELECT USING (
        customer_id IN (
            SELECT customer_id FROM public.stripe_customers
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Service role can manage order data" ON public.stripe_orders
    FOR ALL USING (auth.role() = 'service_role');

-- Create stripe_user_subscriptions view
CREATE OR REPLACE VIEW stripe_user_subscriptions WITH (security_invoker = true) AS
SELECT 
    c.user_id,
    c.customer_id,
    s.subscription_id,
    s.status as subscription_status,
    s.price_id,
    s.current_period_start,
    s.current_period_end,
    s.cancel_at_period_end,
    s.payment_method_brand,
    s.payment_method_last4,
    s.created_at as subscription_created_at,
    s.updated_at as subscription_updated_at
FROM stripe_customers c
LEFT JOIN stripe_subscriptions s ON c.customer_id = s.customer_id
WHERE c.deleted_at IS NULL
  AND (s.deleted_at IS NULL OR s.deleted_at IS NOT NULL);

-- Triggers for updating updated_at
CREATE TRIGGER update_stripe_customers_updated_at
    BEFORE UPDATE ON public.stripe_customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stripe_subscriptions_updated_at
    BEFORE UPDATE ON public.stripe_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stripe_orders_updated_at
    BEFORE UPDATE ON public.stripe_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.stripe_user_subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.stripe_customers TO authenticated;
GRANT SELECT ON public.stripe_subscriptions TO authenticated;
GRANT SELECT ON public.stripe_orders TO authenticated; 