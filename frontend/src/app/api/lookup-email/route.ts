import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Resolves a login identifier (roll number OR email) to the
// account's email address, so the client can call
// signInWithPassword() with an actual email - Supabase Auth
// only accepts email natively.
export async function POST(req: Request) {
  try {
    const { identifier } = await req.json()

    if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
      return NextResponse.json({ error: 'Roll number or email is required' }, { status: 400 })
    }

    const value = identifier.trim()

    // Already looks like an email - pass it straight through,
    // no lookup needed.
    if (value.includes('@')) {
      return NextResponse.json({ email: value })
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY is not set in .env.local' }, { status: 500 })
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey
    )

    // Roll number - case-insensitive lookup
    const { data, error } = await admin
      .from('users')
      .select('email')
      .ilike('roll_number', value)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'No account found with that roll number' }, { status: 404 })
    }

    return NextResponse.json({ email: data.email })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}