import { createClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * Database-backed rate limiter for Next.js API routes.
 * Survives serverless cold starts since it's backed by Supabase, not memory.
 *
 * Usage in an API route:
 *   const limited = await checkRateLimit(`login:${email}`, 'login', 5, 60)
 *   if (limited) return NextResponse.json({ error: 'Too many attempts. Try again in a minute.' }, { status: 429 })
 */

let adminClient: SupabaseClient | null = null

function getAdminClient(): SupabaseClient {
  if (adminClient) return adminClient
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase service credentials not configured')
  adminClient = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
  return adminClient
}

/**
 * Returns true if the identifier+action combo has exceeded `maxAttempts`
 * within the last `windowSeconds`. Also logs this attempt.
 */
export async function checkRateLimit(
  identifier: string,
  action: string,
  maxAttempts: number,
  windowSeconds: number
): Promise<boolean> {
  const supabase = getAdminClient()
  const windowStart = new Date(Date.now() - windowSeconds * 1000).toISOString()

  const { count } = await supabase
    .from('rate_limits')
    .select('*', { count: 'exact', head: true })
    .eq('identifier', identifier)
    .eq('action', action)
    .gte('created_at', windowStart)

  const isLimited = (count ?? 0) >= maxAttempts

  // Log this attempt regardless (even if limited, so the window keeps moving)
  await supabase.from('rate_limits').insert({ identifier, action })

  return isLimited
}

/**
 * Helper to get a stable identifier from a request — prefers a logged-in
 * user ID if available, falls back to IP address.
 */
export function getRequestIdentifier(req: Request, fallbackKey?: string): string {
  if (fallbackKey) return fallbackKey
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
  return ip
}