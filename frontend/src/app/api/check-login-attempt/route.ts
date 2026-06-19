import { NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rateLimit'

/**
 * Call this BEFORE attempting supabase.auth.signInWithPassword() on the
 * client. If it returns limited: true, block the login attempt client-side
 * with a friendly message instead of hammering Supabase Auth directly.
 */
export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })

    // Max 8 login attempts per email per 10 minutes
    const limited = await checkRateLimit(`login:${email.toLowerCase().trim()}`, 'login', 8, 600)

    return NextResponse.json({ limited })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}