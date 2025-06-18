-- Migration: Sync subscription status to users table
-- This migration creates triggers to automatically update the users table
-- when subscription status changes in the stripe_subscriptions table

-- Function to update user subscription tier based on Stripe subscription
CREATE OR REPLACE FUNCTION public.sync_user_subscription_tier()
RETURNS TRIGGER AS $$
DECLARE
    user_uuid UUID;
    new_tier subscription_tier;
    new_limit INTEGER;
BEGIN
    -- Get the user_id from stripe_customers table
    SELECT user_id INTO user_uuid
    FROM public.stripe_customers
    WHERE customer_id = NEW.customer_id;
    
    -- If no user found, skip
    IF user_uuid IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Determine subscription tier and message limit based on status
    IF NEW.status = 'active' THEN
        -- Check price_id to determine tier
        IF NEW.price_id = 'price_1QZayqIQdUxn9G0AeN2CKUgA' THEN -- Monthly Pro plan price ID
            new_tier := 'pro';
            new_limit := 2000;
        ELSIF NEW.price_id LIKE 'price_%' THEN -- Any other paid plan
            new_tier := 'pro';
            new_limit := 2000;
        ELSE
            new_tier := 'free';
            new_limit := 100;
        END IF;
    ELSE
        -- For any non-active status, revert to free
        new_tier := 'free';
        new_limit := 100;
    END IF;
    
    -- Update the users table
    UPDATE public.users
    SET 
        subscription_tier = new_tier,
        message_limit = new_limit,
        updated_at = NOW()
    WHERE id = user_uuid;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for INSERT on stripe_subscriptions
CREATE TRIGGER sync_user_tier_on_subscription_insert
    AFTER INSERT ON public.stripe_subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.sync_user_subscription_tier();

-- Trigger for UPDATE on stripe_subscriptions
CREATE TRIGGER sync_user_tier_on_subscription_update
    AFTER UPDATE ON public.stripe_subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.sync_user_subscription_tier();

-- Function to manually sync all users with active subscriptions
-- This is useful for fixing existing users who have subscriptions but wrong tier
CREATE OR REPLACE FUNCTION public.sync_all_user_subscription_tiers()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER := 0;
    subscription_record RECORD;
    user_uuid UUID;
    new_tier subscription_tier;
    new_limit INTEGER;
BEGIN
    -- Loop through all active subscriptions
    FOR subscription_record IN 
        SELECT DISTINCT s.customer_id, s.status, s.price_id
        FROM public.stripe_subscriptions s
        WHERE s.deleted_at IS NULL
    LOOP
        -- Get the user_id for this customer
        SELECT user_id INTO user_uuid
        FROM public.stripe_customers
        WHERE customer_id = subscription_record.customer_id;
        
        -- Skip if no user found
        CONTINUE WHEN user_uuid IS NULL;
        
        -- Determine tier and limit
        IF subscription_record.status = 'active' THEN
            IF subscription_record.price_id = 'price_1QZayqIQdUxn9G0AeN2CKUgA' THEN
                new_tier := 'pro';
                new_limit := 2000;
            ELSIF subscription_record.price_id LIKE 'price_%' THEN
                new_tier := 'pro';
                new_limit := 2000;
            ELSE
                new_tier := 'free';
                new_limit := 100;
            END IF;
        ELSE
            new_tier := 'free';
            new_limit := 100;
        END IF;
        
        -- Update the user
        UPDATE public.users
        SET 
            subscription_tier = new_tier,
            message_limit = new_limit,
            updated_at = NOW()
        WHERE id = user_uuid;
        
        updated_count := updated_count + 1;
    END LOOP;
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users for the manual sync function
GRANT EXECUTE ON FUNCTION public.sync_all_user_subscription_tiers() TO authenticated; 