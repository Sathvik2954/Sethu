import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { checkRateLimit } from '@/lib/rateLimit'

/**
 * Generic audit-log writer for actions taken from authenticated client pages
 * (e.g. approving/rejecting a request). The client can't write to audit_log
 * directly (RLS blocks it), so it calls this route instead.
 */
export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

    // Only staff actions get logged this way
    const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (!me?.role || !['faculty', 'hod', 'admin'].includes(me.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const limited = await checkRateLimit(`log-action:${user.id}`, 'log-action', 60, 3600)
    if (limited) return NextResponse.json({ error: 'Too many actions logged.' }, { status: 429 })

    const { action, target_type, target_id, details } = await req.json()
    if (!action || !target_type) {
      return NextResponse.json({ error: 'action and target_type are required' }, { status: 400 })
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    await admin.from('audit_log').insert({
      actor_id: user.id,
      action,
      target_type,
      target_id: target_id || null,
      details: details || null,
    })

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}