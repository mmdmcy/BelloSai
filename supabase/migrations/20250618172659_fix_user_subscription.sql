-- Fix user subscription tier for user who has active Stripe subscription
-- but wrong subscription_tier in users table

UPDATE public.users 
SET 
    subscription_tier = 'pro',
    message_limit = 2000,
    message_count = 0,
    updated_at = NOW()
WHERE id = '823a187e-0739-4aea-8d92-56837abf7458';
