import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { PDFDocument, PDFFont, StandardFonts, rgb } from 'pdf-lib'

const INK    = rgb(0.11, 0.07, 0.03)
const ORANGE = rgb(0.85, 0.31, 0.0)
const BROWN  = rgb(0.54, 0.42, 0.29)
const GREEN  = rgb(0.24, 0.48, 0.31)
const PAPER  = rgb(0.95, 0.93, 0.90)

// ── Document titles per request_type ──────────────────────────
const DOC_TITLE: Record<string, string> = {
  bonafide:         'BONAFIDE CERTIFICATE',
  lost_id_card:     'ID CARD REPLACEMENT APPROVAL',
  fees:             'FEE PAYMENT CERTIFICATE',
  event_permission: 'EVENT / PLACEMENT PERMISSION LETTER',
  complaint:        'COMPLAINT ACKNOWLEDGEMENT',
  gate_pass:        'GATE PASS',
  suggestion:       'SUGGESTION ACKNOWLEDGEMENT',
}

// ── Helper: wrap long text ────────────────────────────────────
function drawWrapped(
  page: ReturnType<PDFDocument['addPage']>,
  text: string,
  x: number,
  startY: number,
  size: number,
  font: PDFFont,
  color: ReturnType<typeof rgb>,
  maxChars = 78
): number {
  const words = text.split(' ')
  let line = ''
  let y = startY
  for (const w of words) {
    if ((line + ' ' + w).length > maxChars) {
      page.drawText(line.trim(), { x, y, size, font, color })
      y -= size + 4
      line = w
    } else {
      line += ' ' + w
    }
  }
  if (line.trim()) { page.drawText(line.trim(), { x, y, size, font, color }); y -= size + 4 }
  return y
}

export async function POST(req: Request) {
  try {
    const { requestId } = await req.json()
    if (!requestId) return NextResponse.json({ error: 'requestId required' }, { status: 400 })

    // ── Auth check ────────────────────────────────────────────
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

    const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (me?.role !== 'faculty' && me?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // ── Load request + student profile ────────────────────────
    // Load request first
    const { data: request, error: reqErr } = await supabase
      .from('requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (reqErr || !request) {
      return NextResponse.json({ error: 'Request not found: ' + (reqErr?.message ?? '') }, { status: 404 })
    }

    if (request.status !== 'approved') {
      return NextResponse.json({ error: 'Request is not approved yet' }, { status: 400 })
    }

    // Load student profile separately (avoids FK join issues)
    const { data: student } = await supabase
      .from('users')
      .select('full_name, roll_number, department, year, section, email')
      .eq('id', request.student_id)
      .single()

    // Attach student to request object for PDF generation
    request.student = student

    // ── Build PDF ─────────────────────────────────────────────
    const pdf    = await PDFDocument.create()
    const page   = pdf.addPage([595, 842]) // A4
    const helv   = await pdf.embedFont(StandardFonts.Helvetica)
    const bold   = await pdf.embedFont(StandardFonts.HelveticaBold)
    const { width, height } = page.getSize()
    const M = 56 // margin

    // Paper background
    page.drawRectangle({ x: 0, y: 0, width, height, color: PAPER })

    // Outer border
    page.drawRectangle({
      x: M - 16, y: M - 16,
      width: width - 2 * (M - 16), height: height - 2 * (M - 16),
      borderColor: INK, borderWidth: 1.5,
    })

    // Inner thin border
    page.drawRectangle({
      x: M - 8, y: M - 8,
      width: width - 2 * (M - 8), height: height - 2 * (M - 8),
      borderColor: BROWN, borderWidth: 0.5,
    })

    let y = height - M - 24

    // ── Header ────────────────────────────────────────────────
    page.drawText('SETHU', { x: M, y, size: 28, font: bold, color: INK })
    page.drawRectangle({ x: M, y: y - 8, width: 48, height: 3, color: ORANGE })
    page.drawText('CHAITANYA BHARATHI INSTITUTE OF TECHNOLOGY, HYDERABAD', {
      x: M, y: y - 22, size: 7.5, font: bold, color: BROWN,
    })
    page.drawText('Gandipet, Hyderabad — 500075 | Telangana, India', {
      x: M, y: y - 34, size: 7, font: helv, color: BROWN,
    })

    // Reference number top right
    const ref = `SETHU-${String(requestId).slice(0, 8).toUpperCase()}`
    page.drawText(ref, { x: width - M - 120, y, size: 8, font: bold, color: BROWN })
    const issued = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()
    page.drawText(`DATE: ${issued}`, { x: width - M - 120, y: y - 14, size: 8, font: helv, color: BROWN })

    y -= 64

    // ── Document title ────────────────────────────────────────
    const title = DOC_TITLE[request.request_type] ?? 'OFFICIAL DOCUMENT'
    page.drawText(title, { x: M, y, size: 15, font: bold, color: INK })
    y -= 6
    page.drawRectangle({ x: M, y, width: width - 2 * M, height: 2, color: INK })
    y -= 24

    // ── Student details ───────────────────────────────────────
    const s = request.student
    const studentRows: [string, string][] = [
      ['STUDENT NAME',  s?.full_name   ?? '—'],
      ['ROLL NUMBER',   s?.roll_number ?? '—'],
      ['DEPARTMENT',    s?.department  ?? '—'],
      ['YEAR / SECTION', `${s?.year ?? '—'} / ${s?.section ?? '—'}`],
    ]
    page.drawText('STUDENT DETAILS', { x: M, y, size: 8, font: bold, color: BROWN })
    y -= 16
    for (const [label, value] of studentRows) {
      page.drawText(label, { x: M, y, size: 8, font: bold, color: BROWN })
      page.drawText(value, { x: M + 140, y, size: 10, font: helv, color: INK })
      y -= 18
    }

    y -= 10
    page.drawLine({ start: { x: M, y }, end: { x: width - M, y }, thickness: 0.5, color: BROWN })
    y -= 20

    // ── Request-specific details ──────────────────────────────
    page.drawText('REQUEST DETAILS', { x: M, y, size: 8, font: bold, color: BROWN })
    y -= 16

    type RequestRow = [string, string | null | undefined]
    const reqRows: RequestRow[] = []

    if (request.request_type === 'bonafide') {
      reqRows.push(['PURPOSE', request.bonafide_purpose])
      if (request.bonafide_notes) reqRows.push(['ADDITIONAL NOTES', request.bonafide_notes])
    } else if (request.request_type === 'lost_id_card') {
      reqRows.push(['DATE LOST', request.lost_date])
      reqRows.push(['LOCATION', request.lost_location])
      reqRows.push(['DESCRIPTION', request.lost_description])
      if (request.admin_set_date) {
        const col = new Date(request.admin_set_date).toLocaleString('en-IN')
        reqRows.push(['COLLECTION DATE & TIME', col])
        reqRows.push(['COLLECTION LOCATION', 'Administrative & Examination Cell (AEC)'])
      }
    } else if (request.request_type === 'fees') {
      const feeName = request.fee_name === 'year_long_fee' ? 'Year Long Fee'
        : request.fee_name === 'semester_end_exam_fee' ? 'Semester End Examination Fee'
        : request.fee_other_name ?? 'Other'
      reqRows.push(['FEE TYPE', feeName])
      if (request.fee_amount) reqRows.push(['AMOUNT PAID', `₹${request.fee_amount}`])
    } else if (request.request_type === 'event_permission') {
      reqRows.push(['EVENT DATE', request.event_date])
      reqRows.push(['SUBJECT', request.event_subject])
      reqRows.push(['DETAILS', request.event_content])
    } else if (request.request_type === 'complaint') {
      reqRows.push(['COMPLAINT', request.problem_description])
    } else if (request.request_type === 'gate_pass') {
      reqRows.push(['DATE', request.gate_pass_date])
      reqRows.push(['REASON', request.gate_pass_reason])
      reqRows.push(['RETURN TIME', request.gate_pass_return_time])
    } else if (request.request_type === 'suggestion') {
      reqRows.push(['SUGGESTION', request.suggestion_text])
    }

    for (const [label, value] of reqRows) {
      if (!value) continue
      page.drawText(label, { x: M, y, size: 8, font: bold, color: BROWN })
      // Long text gets wrapped
      if (value.length > 55) {
        y = drawWrapped(page, value, M + 140, y, 10, helv, INK, 58)
      } else {
        page.drawText(value, { x: M + 140, y, size: 10, font: helv, color: INK })
        y -= 18
      }
    }

    y -= 10
    page.drawLine({ start: { x: M, y }, end: { x: width - M, y }, thickness: 0.5, color: BROWN })
    y -= 20

    // ── Admin message ─────────────────────────────────────────
    if (request.admin_notes) {
      page.drawText('MESSAGE FROM ADMINISTRATION', { x: M, y, size: 8, font: bold, color: BROWN })
      y -= 14
      y = drawWrapped(page, request.admin_notes, M, y, 10, helv, INK)
      y -= 10
      page.drawLine({ start: { x: M, y }, end: { x: width - M, y }, thickness: 0.5, color: BROWN })
      y -= 20
    }

    // ── Declaration ───────────────────────────────────────────
    const declarations: Record<string, string> = {
      bonafide: 'This is to certify that the above-named student is a bonafide student of this institution for the current academic year. This certificate is issued for the purpose stated above.',
      lost_id_card: 'This document certifies that the above-named student has applied for a replacement ID card. The student is authorised to collect their new ID card on the date and location specified above.',
      fees: 'This is to certify that the above-named student has paid the stated fee. This document serves as an official acknowledgement of the payment.',
      event_permission: 'This document certifies that the above-named student has been granted official permission to participate in the event described above. This permission has been approved by the Head of the Department.',
      complaint: 'This document acknowledges receipt of the complaint filed by the above-named student. The matter has been noted and appropriate action will be taken.',
      gate_pass: 'This document certifies that the above-named student has been granted official permission to leave the campus premises on the date and time stated above.',
      suggestion: 'This document acknowledges the suggestion submitted by the above-named student. The suggestion has been duly noted by the administration.',
    }

    const decl = declarations[request.request_type] ?? 'This document was officially processed and approved through the SETHU campus management platform.'
    y = drawWrapped(page, decl, M, y, 9, helv, BROWN)

    // ── Footer ────────────────────────────────────────────────
    y = M + 40
    page.drawLine({ start: { x: M, y }, end: { x: width - M, y }, thickness: 0.5, color: BROWN })
    y -= 16
    page.drawText(`REF: ${ref}`, { x: M, y, size: 7.5, font: bold, color: BROWN })
    page.drawText(`ISSUED: ${issued}`, { x: M + 130, y, size: 7.5, font: helv, color: BROWN })
    page.drawText('DIGITALLY GENERATED — NO PHYSICAL SIGNATURE REQUIRED', {
      x: width - M - 230, y, size: 7.5, font: bold, color: BROWN,
    })

    const pdfBytes = await pdf.save()

    // ── Upload via service role ────────────────────────────────
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not set' }, { status: 500 })

    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey)

    const path = `${request.student_id}/${requestId}.pdf`
    const { error: uploadErr } = await admin.storage
      .from('documents')
      .upload(path, Buffer.from(pdfBytes), { contentType: 'application/pdf', upsert: true })

    if (uploadErr) return NextResponse.json({ error: 'Upload failed: ' + uploadErr.message }, { status: 500 })

    const { data: urlData } = admin.storage.from('documents').getPublicUrl(path)

    // ── Save URL to requests.generated_pdf_url ────────────────
    const { error: updateErr } = await admin
      .from('requests')
      .update({ generated_pdf_url: urlData.publicUrl })
      .eq('id', requestId)

    if (updateErr) return NextResponse.json({ error: 'URL save failed: ' + updateErr.message }, { status: 500 })

    return NextResponse.json({ ok: true, url: urlData.publicUrl })

  } catch (err: unknown) {
    console.error('GENERATE-DOCUMENT ERROR:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}