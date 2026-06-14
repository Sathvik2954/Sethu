import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

// Swiss palette
const INK = rgb(0.11, 0.07, 0.03)        // #1C1208
const ORANGE = rgb(0.85, 0.31, 0.0)      // #D94F00
const BROWN = rgb(0.54, 0.42, 0.29)      // #8A6A4A
const PAPER = rgb(0.95, 0.93, 0.90)      // #F2EDE6

const TYPE_TITLES: Record<string, string> = {
  gate_pass: 'GATE PASS',
  bonafide: 'BONAFIDE CERTIFICATE',
  lost_id: 'ID CARD REPLACEMENT APPROVAL',
  fee_verification: 'FEE VERIFICATION CERTIFICATE',
}

export async function POST(req: Request) {
  try {
    const { requestId } = await req.json()
    if (!requestId) {
      return NextResponse.json({ error: 'requestId required' }, { status: 400 })
    }

    // ── Step 1: authenticate the caller using the normal session client ──
    const supabase = await createServerSupabaseClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
    }

    const { data: me } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (me?.role !== 'faculty' && me?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // ── Step 2: load the request with student + steps (still via session client) ──
    const { data: request, error: reqError } = await supabase
      .from('requests')
      .select('*, approval_steps(*), student:users!requests_student_id_fkey(full_name, roll_number, department, year, section)')
      .eq('id', requestId)
      .single()

    if (reqError || !request) {
      return NextResponse.json({ error: 'Request not found: ' + (reqError?.message ?? '') }, { status: 404 })
    }

    if (request.status !== 'approved') {
      return NextResponse.json({ error: 'Request is not fully approved' }, { status: 400 })
    }

    // ── Step 3: admin client (service role) for storage + final update ──
    // We've already verified the caller is faculty/admin above, so it's
    // safe to bypass RLS here for the actual write operations.
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY is not set in .env.local' }, { status: 500 })
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey
    )

    // ── Build the PDF ────────────────────────────────────────
    const pdf = await PDFDocument.create()
    const page = pdf.addPage([595, 842]) // A4
    const helv = await pdf.embedFont(StandardFonts.Helvetica)
    const helvBold = await pdf.embedFont(StandardFonts.HelveticaBold)

    const { width, height } = page.getSize()
    const margin = 56

    page.drawRectangle({ x: 0, y: 0, width, height, color: PAPER })

    page.drawRectangle({
      x: margin - 16, y: margin - 16,
      width: width - 2 * (margin - 16), height: height - 2 * (margin - 16),
      borderColor: INK, borderWidth: 1.5,
    })

    let y = height - margin - 24

    page.drawText('SETHU', { x: margin, y, size: 26, font: helvBold, color: INK })
    page.drawRectangle({ x: margin, y: y - 10, width: 40, height: 3, color: ORANGE })
    page.drawText('CHAITANYA BHARATHI INSTITUTE OF TECHNOLOGY, HYDERABAD', {
      x: margin, y: y - 26, size: 8, font: helvBold, color: BROWN,
    })

    y -= 70

    const title = TYPE_TITLES[request.type] ?? 'OFFICIAL DOCUMENT'
    page.drawText(title, { x: margin, y, size: 16, font: helvBold, color: INK })
    page.drawText(`REF: SETHU-${String(request.id).slice(0, 8).toUpperCase()}`, {
      x: margin, y: y - 16, size: 8, font: helv, color: BROWN,
    })

    y -= 52

    page.drawLine({
      start: { x: margin, y }, end: { x: width - margin, y },
      thickness: 1, color: INK,
    })

    y -= 28

    const student = request.student
    const rows: [string, string][] = [
      ['STUDENT NAME', student?.full_name ?? '—'],
      ['ROLL NUMBER', student?.roll_number ?? '—'],
      ['DEPARTMENT', student?.department ?? '—'],
      ['YEAR / SECTION', `${student?.year ?? '—'} / ${student?.section ?? '—'}`],
    ]

    if (request.metadata) {
      for (const [k, v] of Object.entries(request.metadata as Record<string, string>)) {
        rows.push([k.replace(/_/g, ' ').toUpperCase(), String(v)])
      }
    }

    for (const [label, value] of rows) {
      page.drawText(label, { x: margin, y, size: 8, font: helvBold, color: BROWN })
      page.drawText(value, { x: margin + 160, y, size: 11, font: helv, color: INK })
      y -= 22
    }

    y -= 14
    page.drawLine({
      start: { x: margin, y }, end: { x: width - margin, y },
      thickness: 0.5, color: BROWN,
    })
    y -= 26

    page.drawText('APPROVAL TRAIL', { x: margin, y, size: 8, font: helvBold, color: BROWN })
    y -= 20

    const steps = (request.approval_steps ?? []).sort(
      (a: { step_number: number }, b: { step_number: number }) => a.step_number - b.step_number
    )

    for (const step of steps) {
      const acted = step.acted_at
        ? new Date(step.acted_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : '—'
      page.drawRectangle({ x: margin, y: y - 2, width: 10, height: 10, color: rgb(0.24, 0.48, 0.31) })
      page.drawText(`${step.step_label} — APPROVED on ${acted}`, {
        x: margin + 18, y, size: 10, font: helv, color: INK,
      })
      y -= 18
    }

    y -= 24

    const statement =
      request.type === 'bonafide'
        ? 'This is to certify that the above-named student is a bonafide student of this institution. This document was generated and digitally approved through the SETHU campus management platform.'
        : 'This document was submitted, routed, and digitally approved through the SETHU campus management platform. All approvals listed above were recorded with timestamps.'

    const words = statement.split(' ')
    let line = ''
    for (const w of words) {
      if ((line + ' ' + w).length > 78) {
        page.drawText(line.trim(), { x: margin, y, size: 9, font: helv, color: BROWN })
        y -= 14
        line = w
      } else {
        line += ' ' + w
      }
    }
    if (line.trim()) {
      page.drawText(line.trim(), { x: margin, y, size: 9, font: helv, color: BROWN })
      y -= 14
    }

    const issued = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    page.drawText(`ISSUED: ${issued.toUpperCase()}`, {
      x: margin, y: margin + 4, size: 8, font: helvBold, color: BROWN,
    })
    page.drawText('DIGITALLY GENERATED — NO PHYSICAL SIGNATURE REQUIRED', {
      x: width - margin - 248, y: margin + 4, size: 8, font: helvBold, color: BROWN,
    })

    const pdfBytes = await pdf.save()

    // ── Upload via service role (bypasses storage RLS) ───────
    const path = `${request.student_id}/${request.id}.pdf`

    const { error: uploadError } = await admin.storage
      .from('documents')
      .upload(path, Buffer.from(pdfBytes), {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) {
      return NextResponse.json({ error: 'Upload failed: ' + uploadError.message }, { status: 500 })
    }

    const { data: urlData } = admin.storage.from('documents').getPublicUrl(path)

    // ── Save URL on the request (also via service role) ──────
    const { error: updateError } = await admin
      .from('requests')
      .update({ document_url: urlData.publicUrl })
      .eq('id', requestId)

    if (updateError) {
      return NextResponse.json({ error: 'URL save failed: ' + updateError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, url: urlData.publicUrl })

  } catch (err: unknown) {
    console.error('GENERATE-DOCUMENT ERROR:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}