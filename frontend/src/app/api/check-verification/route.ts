import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ terminated: false })

    const { data: profile } = await supabase
      .from('users')
      .select('role, skip_verification, email_verified_at, created_at')
      .eq('id', user.id)
      .single()

    if (!profile) return NextResponse.json({ terminated: false })

    // Staff accounts (faculty, hod, admin) are NEVER subject to verification cleanup
    if (['faculty', 'hod', 'admin'].includes(profile.role)) {
      return NextResponse.json({ terminated: false })
    }

    // Staff flag set explicitly
    if (profile.skip_verification === true) {
      return NextResponse.json({ terminated: false })
    }

    // Student already verified
    if (profile.email_verified_at) {
      return NextResponse.json({ terminated: false })
    }

    // Student unverified after 7 days - terminate
    const created = new Date(profile.created_at)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    if (created < sevenDaysAgo) {
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
      const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      })
      await admin.from('users').delete().eq('id', user.id)
      await admin.auth.admin.deleteUser(user.id)
      await supabase.auth.signOut()
      return NextResponse.json({ terminated: true })
    }

    return NextResponse.json({ terminated: false })
  } catch {
    return NextResponse.json({ terminated: false })
  }
}