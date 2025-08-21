-- Create subscription counters table
create table if not exists public.user_subscription_counters (
  user_id uuid primary key references auth.users(id) on delete cascade,
  standard_remaining integer not null default 0,
  premium_remaining integer not null default 0,
  heavy_remaining integer not null default 0,
  period_end timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.user_subscription_counters enable row level security;

do $$ begin
  create policy "own_counters_read" on public.user_subscription_counters
    for select using ( auth.uid() = user_id );
exception when others then null; end $$;

do $$ begin
  create policy "own_counters_write" on public.user_subscription_counters
    for update using ( auth.uid() = user_id );
exception when others then null; end $$;

-- Upsert (credit/reset) counters for a user (service role or the user self)
create or replace function public.credit_subscription_counters(
  p_user_id uuid,
  p_standard integer,
  p_premium integer,
  p_heavy integer,
  p_period_end timestamptz
) returns void language plpgsql security definer as $$
begin
  insert into public.user_subscription_counters as c (user_id, standard_remaining, premium_remaining, heavy_remaining, period_end, updated_at)
  values (p_user_id, greatest(p_standard,0), greatest(p_premium,0), greatest(p_heavy,0), p_period_end, now())
  on conflict (user_id) do update set
    standard_remaining = greatest(excluded.standard_remaining, 0),
    premium_remaining = greatest(excluded.premium_remaining, 0),
    heavy_remaining = greatest(excluded.heavy_remaining, 0),
    period_end = excluded.period_end,
    updated_at = now();
end; $$;

revoke all on function public.credit_subscription_counters(uuid, integer, integer, integer, timestamptz) from public;

-- Debit 1 message from appropriate tier; returns true if debited
create or replace function public.debit_subscription_counter(
  p_user_id uuid,
  p_tier text
) returns boolean language plpgsql security definer as $$
declare
  debited boolean := false;
begin
  if p_tier = 'light' or p_tier = 'standard' then
    update public.user_subscription_counters
      set standard_remaining = standard_remaining - 1,
          updated_at = now()
      where user_id = p_user_id and standard_remaining > 0;
    get diagnostics debited = row_count > 0;
    return debited;
  elsif p_tier = 'medium' or p_tier = 'premium' then
    update public.user_subscription_counters
      set premium_remaining = premium_remaining - 1,
          updated_at = now()
      where user_id = p_user_id and premium_remaining > 0;
    get diagnostics debited = row_count > 0;
    return debited;
  elsif p_tier = 'heavy' then
    update public.user_subscription_counters
      set heavy_remaining = heavy_remaining - 1,
          updated_at = now()
      where user_id = p_user_id and heavy_remaining > 0;
    get diagnostics debited = row_count > 0;
    return debited;
  end if;
  return false;
end; $$;

revoke all on function public.debit_subscription_counter(uuid, text) from public;





