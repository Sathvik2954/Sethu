import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

// Called on page load as fallback when pg_cron hasn't run yet
export async function POST() {
  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) return NextResponse.json({ ok: false, error: 'No service key' })

    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const results: string[] = []

    // 1. Delete completed requests older than 7 days
    const { error: reqErr, count: reqCount } = await admin
      .from('requests')
      .delete({ count: 'exact' })
      .eq('status', 'completed')
      .lt('updated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

    if (!reqErr) results.push(`Deleted ${reqCount ?? 0} completed requests`)

    // 2. Send last-day deadline reminders (faculty deadlines due today)
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const { data: todayDeadlines } = await admin
      .from('deadlines')
      .select('*')
      .eq('source', 'faculty')
      .eq('is_done', false)
      .gte('due_date', todayStart.toISOString())
      .lte('due_date', todayEnd.toISOString())

    for (const dl of todayDeadlines ?? []) {
      if (!dl.sender_id) continue

      // Check if we already sent a reminder today for this deadline
      const { data: existing } = await admin
        .from('notifications')
        .select('id')
        .eq('sender_id', dl.sender_id)
        .ilike('title', `Last Day Reminder: ${dl.title}`)
        .gte('created_at', todayStart.toISOString())
        .limit(1)

      if (existing && existing.length > 0) continue // already sent

      const dueTime = new Date(dl.due_date).toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata'
      })

      await admin.from('notifications').insert({
        sender_id: dl.sender_id,
        target_dept: dl.target_dept ?? null,
        target_section: dl.target_section ?? null,
        target_year: dl.target_year ?? null,
        title: `Last Day Reminder: ${dl.title}`,
        message: `Today is the last day to submit "${dl.title}". Due at ${dueTime}. Make sure you submit before the deadline.`,
        priority: 'urgent',
      })

      results.push(`Sent last-day reminder for: ${dl.title}`)
    }

    return NextResponse.json({ ok: true, results })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: message })
  }
}