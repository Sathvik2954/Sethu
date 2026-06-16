import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

    const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (me?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { userId, action } = await req.json() // action: 'deactivate' | 'reactivate' | 'delete'
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })
    if (userId === user.id) return NextResponse.json({ error: 'Cannot modify your own account' }, { status: 400 })

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    if (action === 'delete') {
      await admin.from('users').delete().eq('id', userId)
      await admin.auth.admin.deleteUser(userId)
      return NextResponse.json({ ok: true })
    }

    // Deactivate: ban the user in Supabase Auth
    const banned = action === 'deactivate'
    const { error } = await admin.auth.admin.updateUserById(userId, {
      ban_duration: banned ? '876600h' : 'none',
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    // Also update a flag in public.users so we can show status in UI
    await admin.from('users').update({ skip_verification: !banned }).eq('id', userId)

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}