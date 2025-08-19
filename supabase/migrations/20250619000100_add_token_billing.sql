-- Token billing: per-tier credit balances and helper function

create table if not exists public.user_token_balances (
  user_id uuid primary key references auth.users(id) on delete cascade,
  light_credits integer not null default 0,
  medium_credits integer not null default 0,
  heavy_credits integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.user_token_balances enable row level security;

create policy "Users can view own token balances" on public.user_token_balances
  for select using (auth.uid() = user_id);

create policy "Users can update own token balances" on public.user_token_balances
  for update using (auth.uid() = user_id);

-- Helper function to credit tokens atomically
create or replace function public.credit_tokens(p_user_id uuid,
                                               p_light integer,
                                               p_medium integer,
                                               p_heavy integer)
returns void as $$
begin
  insert into public.user_token_balances (user_id, light_credits, medium_credits, heavy_credits)
  values (p_user_id, greatest(p_light,0), greatest(p_medium,0), greatest(p_heavy,0))
  on conflict (user_id) do update set
    light_credits = public.user_token_balances.light_credits + greatest(p_light,0),
    medium_credits = public.user_token_balances.medium_credits + greatest(p_medium,0),
    heavy_credits = public.user_token_balances.heavy_credits + greatest(p_heavy,0),
    updated_at = now();
end;
$$ language plpgsql security definer;

-- Helper function to attempt debit of a single credit in a given tier
-- Returns true if debited, false if insufficient balance
create or replace function public.debit_token_if_available(p_user_id uuid, p_tier text)
returns boolean as $$
declare
  ok boolean := false;
begin
  if p_tier = 'light' then
    update public.user_token_balances
      set light_credits = light_credits - 1,
          updated_at = now()
      where user_id = p_user_id and light_credits > 0
      returning true into ok;
  elsif p_tier = 'medium' then
    update public.user_token_balances
      set medium_credits = medium_credits - 1,
          updated_at = now()
      where user_id = p_user_id and medium_credits > 0
      returning true into ok;
  elsif p_tier = 'heavy' then
    update public.user_token_balances
      set heavy_credits = heavy_credits - 1,
          updated_at = now()
      where user_id = p_user_id and heavy_credits > 0
      returning true into ok;
  else
    return false;
  end if;
  return coalesce(ok, false);
end;
$$ language plpgsql security definer;



