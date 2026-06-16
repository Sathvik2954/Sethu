import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    // Verify caller is admin
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

    const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (me?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { full_name, email, password, role, department } = await req.json()

    if (!full_name?.trim()) return NextResponse.json({ error: 'Full name is required' }, { status: 400 })
    if (!email?.trim()) return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    if (!password || password.length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    if (!['faculty', 'hod', 'admin'].includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    if (role !== 'admin' && !department?.trim()) return NextResponse.json({ error: 'Department is required for faculty/HOD' }, { status: 400 })

    // Use service role to create auth user
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) return NextResponse.json({ error: 'Server config error' }, { status: 500 })

    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Create the auth user
    const { data: newUser, error: authErr } = await admin.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true, // no email verification needed for staff
    })

    if (authErr) return NextResponse.json({ error: authErr.message }, { status: 400 })
    if (!newUser.user) return NextResponse.json({ error: 'User creation failed' }, { status: 500 })

    // Insert into public.users
    const { error: dbErr } = await admin.from('users').insert({
      id: newUser.user.id,
      full_name: full_name.trim(),
      email: email.trim(),
      role,
      department: department?.trim() || null,
      skip_verification: true,
      email_verified_at: new Date().toISOString(),
    })

    if (dbErr) {
      // Rollback: delete the auth user if DB insert fails
      await admin.auth.admin.deleteUser(newUser.user.id)
      return NextResponse.json({ error: 'Profile creation failed: ' + dbErr.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, userId: newUser.user.id })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}