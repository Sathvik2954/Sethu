import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { checkRateLimit } from '@/lib/rateLimit'

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

    const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (me?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Rate limit: max 20 account actions per admin per hour
    const limited = await checkRateLimit(`deactivate-staff:${user.id}`, 'deactivate-staff', 20, 3600)
    if (limited) {
      return NextResponse.json({ error: 'Too many account actions. Please wait before continuing.' }, { status: 429 })
    }

    const { userId, action } = await req.json()
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })
    if (userId === user.id) return NextResponse.json({ error: 'Cannot modify your own account' }, { status: 400 })

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Fetch target user info before deletion for audit log
    const { data: targetUser } = await admin.from('users').select('full_name, email, role').eq('id', userId).single()

    if (action === 'delete') {
      await admin.from('users').delete().eq('id', userId)
      await admin.auth.admin.deleteUser(userId)

      await admin.from('audit_log').insert({
        actor_id: user.id,
        action: 'delete_staff_account',
        target_type: 'user',
        target_id: userId,
        details: targetUser ? { full_name: targetUser.full_name, email: targetUser.email, role: targetUser.role } : null,
      })

      return NextResponse.json({ ok: true })
    }

    const banned = action === 'deactivate'
    const { error } = await admin.auth.admin.updateUserById(userId, {
      ban_duration: banned ? '876600h' : 'none',
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    await admin.from('users').update({ skip_verification: !banned }).eq('id', userId)

    await admin.from('audit_log').insert({
      actor_id: user.id,
      action: banned ? 'deactivate_staff_account' : 'reactivate_staff_account',
      target_type: 'user',
      target_id: userId,
      details: targetUser ? { full_name: targetUser.full_name, email: targetUser.email } : null,
    })

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}