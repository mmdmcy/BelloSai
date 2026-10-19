/**
 * Server-side quota for anonymous (not signed-in) chat requests.
 *
 * The browser-side counter in src/lib/anonymous-usage.ts is only a UX hint;
 * it lives in localStorage and anyone can clear it. This helper is the real
 * limit: every chat edge function calls it before spending the owner's
 * provider API key on a request that carries no valid user session.
 *
 * Buckets are keyed by SHA-256(salt + client IP) + UTC day, stored in
 * public.anonymous_usage (see migration 20251019000000_anonymous_usage_quota.sql)
 * and incremented atomically by the consume_anonymous_quota() RPC, which only
 * the service role may execute.
 *
 * Env vars (optional):
 *   ANON_DAILY_MESSAGE_LIMIT  - requests per IP per UTC day (default 3)
 *   ANON_QUOTA_SALT           - secret mixed into the hash
 */

import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

export const ANON_DAILY_MESSAGE_LIMIT = (() => {
  const parsed = parseInt(Deno.env.get('ANON_DAILY_MESSAGE_LIMIT') ?? '', 10)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 3
})()

/** Payload of the 429 returned when the quota is exhausted. */
export interface AnonymousQuotaExceeded {
  error: 'Anonymous message limit exceeded'
  limit: number
  current: number
  resets_at: string
  sign_in_required: boolean
}

const jsonHeaders = (cors: Record<string, string>) => ({ ...cors, 'Content-Type': 'application/json' })

/**
 * Creates the service-role Supabase client used by the edge functions.
 * Returns null when the platform-injected env is missing, so callers can
 * fail with a clear 500 instead of talking to a hardcoded project.
 */
export function createAdminClient(): SupabaseClient | null {
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) {
    console.error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set')
    return null
  }
  return createClient(url, key, { auth: { persistSession: false } })
}

/**
 * Resolves the signed-in user from a "Bearer <jwt>" Authorization header.
 * Returns null for anonymous callers (no header, the anon key, or an
 * invalid/expired token).
 */
export async function getAuthenticatedUser(req: Request, supabaseAdmin: SupabaseClient) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice('Bearer '.length).trim()
  if (!token) return null
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
    if (error || !user) return null
    return user
  } catch (err) {
    console.warn('Token validation failed, treating request as anonymous:', (err as Error).message)
    return null
  }
}

/** Best-effort client IP from the headers the Supabase/Deno edge sets. */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  return (
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

async function hashIp(ip: string): Promise<string> {
  const salt = Deno.env.get('ANON_QUOTA_SALT') ?? ''
  const bytes = new TextEncoder().encode(`${salt}|${ip}`)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

function nextUtcMidnight(): string {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)).toISOString()
}

/**
 * Consumes one unit of the anonymous quota for this request's client IP.
 *
 * Returns null when the request may proceed, otherwise a ready-to-return
 * Response: 429 with an AnonymousQuotaExceeded body when the daily cap is
 * reached, or 503 when the quota store is unavailable (fail closed; the
 * migration must be applied before anonymous traffic is served).
 */
export async function enforceAnonymousQuota(
  req: Request,
  supabaseAdmin: SupabaseClient,
  corsHeaders: Record<string, string>,
  limit: number = ANON_DAILY_MESSAGE_LIMIT,
): Promise<Response | null> {
  const ipHash = await hashIp(getClientIp(req))

  const { data, error } = await supabaseAdmin.rpc('consume_anonymous_quota', {
    p_ip_hash: ipHash,
    p_limit: limit,
  })

  if (error) {
    console.error('Anonymous quota check failed:', error.message)
    return new Response(
      JSON.stringify({ error: 'Anonymous access is temporarily unavailable. Please sign in or try again later.' }),
      { status: 503, headers: jsonHeaders(corsHeaders) },
    )
  }

  const current = typeof data === 'number' ? data : Number(data)
  if (!Number.isFinite(current) || current > limit) {
    const body: AnonymousQuotaExceeded = {
      error: 'Anonymous message limit exceeded',
      limit,
      current: Number.isFinite(current) ? Math.min(current, limit) : limit,
      resets_at: nextUtcMidnight(),
      sign_in_required: true,
    }
    return new Response(JSON.stringify(body), { status: 429, headers: jsonHeaders(corsHeaders) })
  }

  return null
}
