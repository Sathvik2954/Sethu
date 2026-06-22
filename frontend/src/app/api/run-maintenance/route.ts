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

    // 3. Send exam reminders (7, 3, 1 days before)
    const dayWindows = [7, 3, 1]
    for (const daysBefore of dayWindows) {
      const targetDate = new Date()
      targetDate.setDate(targetDate.getDate() + daysBefore)
      const targetDateStr = targetDate.toISOString().slice(0, 10)

      const { data: exams } = await admin
        .from('timetable_slots')
        .select('*')
        .eq('timetable_type', 'exam')
        .eq('is_active', true)
        .eq('exam_date', targetDateStr)

      for (const ex of exams ?? []) {
        // Check if already sent
        const { data: existingLog } = await admin
          .from('exam_reminder_log')
          .select('id')
          .eq('slot_id', ex.id)
          .eq('days_before', daysBefore)
          .limit(1)

        if (existingLog && existingLog.length > 0) continue

        const title = daysBefore === 1
          ? `Exam Tomorrow: ${ex.exam_subject}`
          : `${ex.exam_subject} exam in ${daysBefore} days`

        const dateStr = new Date(ex.exam_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        const timeStr = ex.exam_start_time ? ` at ${ex.exam_start_time}` : ''
        const roomStr = ex.exam_room ? ` in ${ex.exam_room}` : ''

        const message = daysBefore === 1
          ? `${ex.exam_subject} exam is tomorrow (${dateStr})${timeStr}${roomStr}. Make sure you are well prepared.`
          : `${ex.exam_subject} exam is scheduled on ${dateStr}${roomStr}. ${daysBefore} days remaining - start preparing.`

        await admin.from('notifications').insert({
          sender_id: ex.created_by,
          target_dept: ex.department,
          target_section: ex.section,
          target_year: ex.year,
          title,
          message,
          priority: daysBefore === 1 ? 'urgent' : 'normal',
        })

        await admin.from('exam_reminder_log').insert({ slot_id: ex.id, days_before: daysBefore })
        results.push(`Sent exam reminder (${daysBefore}d): ${ex.exam_subject}`)
      }
    }

    return NextResponse.json({ ok: true, results })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: message })
  }
}