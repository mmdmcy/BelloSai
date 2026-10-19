-- Server-side quota for anonymous chat requests.
--
-- Until now the "N messages per day" limit for visitors without an account
-- lived only in the browser's localStorage, so anyone could clear it and use
-- the owner's provider API keys without bound. The chat edge functions now
-- call consume_anonymous_quota() (supabase/functions/_shared/anonymous-quota.ts)
-- before every anonymous request. Rows are keyed by a salted SHA-256 of the
-- client IP plus the UTC day; no raw IP addresses are stored.

create table if not exists public.anonymous_usage (
  ip_hash text not null,
  day date not null default (now() at time zone 'utc')::date,
  request_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (ip_hash, day)
);

comment on table public.anonymous_usage is
  'Per-IP-hash, per-UTC-day request counter for anonymous chat traffic. Written only by consume_anonymous_quota().';

-- Only the service role (edge functions) may touch this table.
alter table public.anonymous_usage enable row level security;
revoke all on table public.anonymous_usage from public, anon, authenticated;
grant select, insert, update, delete on table public.anonymous_usage to service_role;

-- Atomically increments today's counter for p_ip_hash and returns the new
-- count. The caller compares it with p_limit; a value greater than p_limit
-- means the request must be rejected. The counter keeps incrementing past the
-- limit (cheap, and useful for spotting abuse), but is capped to avoid
-- overflow on hammering.
create or replace function public.consume_anonymous_quota(p_ip_hash text, p_limit integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  if p_ip_hash is null or length(p_ip_hash) = 0 then
    raise exception 'p_ip_hash is required';
  end if;

  insert into public.anonymous_usage as u (ip_hash, day, request_count, updated_at)
  values (p_ip_hash, (now() at time zone 'utc')::date, 1, now())
  on conflict (ip_hash, day) do update
    set request_count = least(u.request_count + 1, greatest(p_limit, 0) + 1000),
        updated_at = now()
  returning request_count into new_count;

  return new_count;
end;
$$;

revoke all on function public.consume_anonymous_quota(text, integer) from public, anon, authenticated;
grant execute on function public.consume_anonymous_quota(text, integer) to service_role;

-- Housekeeping: drop counters older than a week. Run manually or schedule it,
-- e.g. with pg_cron:  select cron.schedule('purge-anon-usage', '15 3 * * *', $$select public.purge_anonymous_usage()$$);
create or replace function public.purge_anonymous_usage()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  removed integer;
begin
  delete from public.anonymous_usage
  where day < (now() at time zone 'utc')::date - 7;
  get diagnostics removed = row_count;
  return removed;
end;
$$;

revoke all on function public.purge_anonymous_usage() from public, anon, authenticated;
grant execute on function public.purge_anonymous_usage() to service_role;
