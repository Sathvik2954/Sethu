import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export async function POST() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('users')
    .select('email_verified_at, created_at')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ terminated: false, daysLeft: 7 })
  }

  if (profile.email_verified_at) {
    return NextResponse.json({ terminated: false, verified: true, daysLeft: 7 })
  }

  const createdAt = new Date(profile.created_at).getTime()
  const daysSince = (Date.now() - createdAt) / (1000 * 60 * 60 * 24)
  const daysLeft = Math.max(0, Math.ceil(7 - daysSince))

  if (daysSince > 7) {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) {
      return NextResponse.json({ terminated: false, daysLeft: 0, error: 'SUPABASE_SERVICE_ROLE_KEY missing' })
    }

    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey)

    await admin.from('users').delete().eq('id', user.id)
    await admin.auth.admin.deleteUser(user.id)
    await supabase.auth.signOut()

    return NextResponse.json({ terminated: true })
  }

  return NextResponse.json({ terminated: false, verified: false, daysLeft })
}