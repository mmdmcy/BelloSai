-- sync_all_user_subscription_tiers() is SECURITY DEFINER and rewrites the
-- subscription tier and message limit of every user. Migration
-- 20250615000001 granted EXECUTE to `authenticated`, so any signed-in user
-- could call it through PostgREST (supabase.rpc) and reset everyone's tier.
-- It is an operator tool: only the service role may run it.

revoke execute on function public.sync_all_user_subscription_tiers() from public, anon, authenticated;
grant execute on function public.sync_all_user_subscription_tiers() to service_role;
