-- Debit with fallback based on desired tier
-- Returns the actual tier debited ('light' | 'medium' | 'heavy') or NULL if insufficient

create or replace function public.debit_token_with_fallback(p_user_id uuid, p_desired_tier text)
returns text as $$
declare
  debited boolean;
begin
  if p_desired_tier = 'light' then
    -- try light -> medium -> heavy
    update public.user_token_balances set light_credits = light_credits - 1, updated_at = now()
      where user_id = p_user_id and light_credits > 0 returning true into debited;
    if debited then return 'light'; end if;

    update public.user_token_balances set medium_credits = medium_credits - 1, updated_at = now()
      where user_id = p_user_id and medium_credits > 0 returning true into debited;
    if debited then return 'medium'; end if;

    update public.user_token_balances set heavy_credits = heavy_credits - 1, updated_at = now()
      where user_id = p_user_id and heavy_credits > 0 returning true into debited;
    if debited then return 'heavy'; end if;
    return null;

  elsif p_desired_tier = 'medium' then
    -- try medium -> heavy
    update public.user_token_balances set medium_credits = medium_credits - 1, updated_at = now()
      where user_id = p_user_id and medium_credits > 0 returning true into debited;
    if debited then return 'medium'; end if;

    update public.user_token_balances set heavy_credits = heavy_credits - 1, updated_at = now()
      where user_id = p_user_id and heavy_credits > 0 returning true into debited;
    if debited then return 'heavy'; end if;
    return null;

  elsif p_desired_tier = 'heavy' then
    update public.user_token_balances set heavy_credits = heavy_credits - 1, updated_at = now()
      where user_id = p_user_id and heavy_credits > 0 returning true into debited;
    if debited then return 'heavy'; end if;
    return null;
  end if;
  return null;
end;
$$ language plpgsql security definer;



