'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

type RequestType = 'event_permission' | 'complaint' | 'gate_pass' | 'suggestion'
  | 'bonafide' | 'lost_id_card' | 'fees'

type Request = {
  id: string
  section: string
  request_type: RequestType
  status: string
  submitted_at: string
  admin_notes: string | null
  admin_set_date: string | null
  event_date: string | null
  event_subject: string | null
  event_content: string | null
  signature_confirm: boolean | null
  problem_description: string | null
  gate_pass_date: string | null
  gate_pass_reason: string | null
  gate_pass_return_time: string | null
  suggestion_text: string | null
  bonafide_purpose: string | null
  bonafide_notes: string | null
  lost_date: string | null
  lost_location: string | null
  lost_description: string | null
  fee_name: string | null
  fee_other_name: string | null
  fee_amount: number | null
  payment_screenshot_url: string | null
  generated_pdf_url: string | null
}

type FormState = {
  event_date: string; event_subject: string; event_content: string; signature_confirm: boolean
  problem_description: string
  gate_pass_date: string; gate_pass_reason: string; gate_pass_return_time: string
  suggestion_text: string
  bonafide_purpose: string; bonafide_notes: string
  lost_date: string; lost_location: string; lost_description: string
  fee_name: string; fee_other_name: string; fee_amount: string
}

const inputStyle: React.CSSProperties = {
  width: '100%', border: '1.5px solid #C8A878', background: '#F2EDE6',
  padding: '10px 12px', fontSize: '13px', color: '#1C1208',
  outline: 'none', borderRadius: 0, fontFamily: 'inherit', display: 'block',
}
const labelStyle: React.CSSProperties = {
  fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px',
  color: '#6A4A2A', marginBottom: '6px', display: 'block',
}
const statusColor: Record<string, string> = {
  pending: '#E8C87A', in_review: '#D94F00', approved: '#3D7A50',
  rejected: '#8A6A4A', completed: '#3D7A50',
}
const TYPE_LABELS: Record<RequestType, string> = {
  event_permission: 'Event / Placement Permission',
  complaint: 'Complaint',
  gate_pass: 'Gate Pass',
  suggestion: 'Suggestion',
  bonafide: 'Bonafide Certificate',
  lost_id_card: 'Lost ID Card',
  fees: 'Fee Receipt',
}

function emptyForm(): FormState {
  return {
    event_date: '', event_subject: '', event_content: '', signature_confirm: false,
    problem_description: '',
    gate_pass_date: '', gate_pass_reason: '', gate_pass_return_time: '',
    suggestion_text: '',
    bonafide_purpose: '', bonafide_notes: '',
    lost_date: '', lost_location: '', lost_description: '',
    fee_name: '', fee_other_name: '', fee_amount: '',
  }
}

// ── Sub-components OUTSIDE main (fixes cursor jump) ────────────

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
      <span style={{ fontSize: '9px', fontWeight: 700, color: '#8A6A4A', letterSpacing: '1px', minWidth: '100px' }}>
        {label.toUpperCase()}
      </span>
      <span style={{ fontSize: '12px', color: '#1C1208', flex: 1 }}>{value}</span>
    </div>
  )
}

function RequestCard({ r }: { r: Request }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ border: '1.5px solid #1C1208', background: '#FDFAF5', marginBottom: '8px' }}>
      <div onClick={() => setOpen(o => !o)} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', cursor: 'pointer', gap: '12px', flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{
            fontSize: '8px', fontWeight: 700, letterSpacing: '1px', padding: '3px 8px',
            background: statusColor[r.status] ?? '#8A6A4A',
            color: r.status === 'pending' ? '#1C1208' : '#F2EDE6',
          }}>
            {r.status.replace('_', ' ').toUpperCase()}
          </span>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#1C1208' }}>
            {TYPE_LABELS[r.request_type]}
          </span>
        </div>
        <span style={{ fontSize: '10px', color: '#8A6A4A' }}>
          {new Date(r.submitted_at).toLocaleDateString('en-IN')} {open ? '▲' : '▼'}
        </span>
      </div>

      {open && (
        <div style={{ borderTop: '1px solid #E0D0B8', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {r.request_type === 'event_permission' && (<>
            <Row label="Date" value={r.event_date ?? '—'} />
            <Row label="Subject" value={r.event_subject ?? '—'} />
            <Row label="Content" value={r.event_content ?? '—'} />
            <Row label="Signature" value={r.signature_confirm ? 'Confirmed' : 'Not confirmed'} />
          </>)}
          {r.request_type === 'complaint' && <Row label="Problem" value={r.problem_description ?? '—'} />}
          {r.request_type === 'gate_pass' && (<>
            <Row label="Date" value={r.gate_pass_date ?? '—'} />
            <Row label="Reason" value={r.gate_pass_reason ?? '—'} />
            <Row label="Return Time" value={r.gate_pass_return_time ?? '—'} />
          </>)}
          {r.request_type === 'suggestion' && <Row label="Suggestion" value={r.suggestion_text ?? '—'} />}
          {r.request_type === 'bonafide' && (<>
            <Row label="Purpose" value={r.bonafide_purpose ?? '—'} />
            {r.bonafide_notes && <Row label="Notes" value={r.bonafide_notes} />}
          </>)}
          {r.request_type === 'lost_id_card' && (<>
            <Row label="Lost On" value={r.lost_date ?? '—'} />
            <Row label="Location" value={r.lost_location ?? '—'} />
            <Row label="Description" value={r.lost_description ?? '—'} />
          </>)}
          {r.request_type === 'fees' && (<>
            <Row label="Fee Type" value={
              r.fee_name === 'year_long_fee' ? 'Year Long Fee'
              : r.fee_name === 'semester_end_exam_fee' ? 'Semester End Exam Fee'
              : r.fee_other_name ?? 'Other'
            } />
            {r.fee_amount != null && <Row label="Amount" value={`₹${r.fee_amount}`} />}
          </>)}

          {r.admin_notes && (
            <div style={{ padding: '12px', background: '#F2EDE6', border: '1.5px solid #3D7A50', borderLeft: '4px solid #3D7A50' }}>
              <div style={{ fontSize: '9px', fontWeight: 700, color: '#3D7A50', letterSpacing: '1px', marginBottom: '4px' }}>ADMIN MESSAGE</div>
              <div style={{ fontSize: '12px', color: '#1C1208', lineHeight: 1.6 }}>{r.admin_notes}</div>
              {r.admin_set_date && (
                <div style={{ fontSize: '11px', color: '#6A4A2A', marginTop: '6px', fontWeight: 700 }}>
                  📅 {r.request_type === 'lost_id_card' ? 'Collect on: ' : 'Ready on: '}
                  {new Date(r.admin_set_date).toLocaleString('en-IN')}
                </div>
              )}
            </div>
          )}
          {r.request_type === 'lost_id_card' && r.status === 'approved' && r.admin_set_date && (
            <div style={{ padding: '12px', background: '#F2EDE6', border: '1.5px solid #D94F00', borderLeft: '4px solid #D94F00' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#D94F00', letterSpacing: '1px', marginBottom: '4px' }}>COLLECT YOUR ID CARD</div>
              <div style={{ fontSize: '12px', color: '#1C1208', lineHeight: 1.6 }}>
                Please collect your new ID card on <strong>{new Date(r.admin_set_date).toLocaleString('en-IN')}</strong> from the Administrative & Examination Cell (AEC).
              </div>
            </div>
          )}
          {r.generated_pdf_url && (
            <a href={r.generated_pdf_url} target="_blank" rel="noopener noreferrer" style={{
              display: 'inline-block', padding: '10px 20px', background: '#1C1208',
              color: '#F2EDE6', fontSize: '10px', fontWeight: 700,
              letterSpacing: '1.5px', textDecoration: 'none', alignSelf: 'flex-start',
            }}>
              ↓ DOWNLOAD {r.request_type === 'bonafide' ? 'BONAFIDE' : r.request_type === 'fees' ? 'RECEIPT' : 'DOCUMENT'}
            </a>
          )}
        </div>
      )}
    </div>
  )
}

function TypeBtn({ type, desc, onClick }: { type: RequestType; desc: string; onClick: (t: RequestType) => void }) {
  return (
    <button type="button" onClick={() => onClick(type)} style={{
      background: '#FDFAF5', border: '1.5px solid #1C1208',
      padding: '18px 20px', textAlign: 'left', cursor: 'pointer',
      fontFamily: 'inherit', display: 'flex', flexDirection: 'column', gap: '6px', width: '100%',
    }}>
      <span style={{ fontSize: '14px', fontWeight: 700, color: '#D94F00', letterSpacing: '0.3px' }}>
        {TYPE_LABELS[type]}
      </span>
      <span style={{ fontSize: '11px', color: '#8A6A4A' }}>{desc}</span>
    </button>
  )
}

// ── File upload — outside main ─────────────────────────────────
function FileUpload({
  fileRef, paymentFile, setPaymentFile, setFormError,
}: {
  fileRef: React.RefObject<HTMLInputElement | null>
  paymentFile: File | null
  setPaymentFile: (f: File | null) => void
  setFormError: (e: string) => void
}) {
  return (
    <div>
      <label style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px', color: '#6A4A2A', marginBottom: '6px', display: 'block' }}>
        PAYMENT SCREENSHOT *
      </label>
      <div onClick={() => fileRef.current?.click()} style={{
        border: '1.5px dashed #C8A878', padding: '20px', textAlign: 'center',
        cursor: 'pointer', background: '#F2EDE6',
      }}>
        {paymentFile
          ? <span style={{ fontSize: '12px', color: '#3D7A50', fontWeight: 700 }}>✓ {paymentFile.name}</span>
          : <span style={{ fontSize: '11px', color: '#8A6A4A' }}>Click to upload payment screenshot (JPG, PNG, PDF — max 5MB)</span>
        }
      </div>
      <input ref={fileRef} type="file" accept="image/*,application/pdf" style={{ display: 'none' }}
        onChange={e => {
          const f = e.target.files?.[0]
          if (f && f.size > 5 * 1024 * 1024) { setFormError('File must be under 5MB'); return }
          if (f) { setPaymentFile(f); setFormError('') }
        }}
      />
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────
export default function RequestsPage() {
  const supabase = createClient()
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [activeForm, setActiveForm] = useState<RequestType | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm())
  const [paymentFile, setPaymentFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const { data } = await supabase
        .from('requests').select('*')
        .eq('student_id', user.id)
        .order('submitted_at', { ascending: false })
      setRequests((data as Request[]) ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const upd = useCallback((field: string, value: string | boolean) => {
    setForm(p => ({ ...p, [field]: value }))
    setFormError('')
  }, [])

  const openForm = useCallback((type: RequestType) => {
    setActiveForm(type)
    setForm(emptyForm())
    setPaymentFile(null)
    setFormError('')
    setSuccess('')
  }, [])

  const closeForm = useCallback(() => {
    setActiveForm(null)
    setFormError('')
  }, [])

  async function uploadPaymentScreenshot(uid: string): Promise<string | null> {
    if (!paymentFile) return null
    const ext = paymentFile.name.split('.').pop()
    const path = `${uid}/payment-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('request-attachments').upload(path, paymentFile, { upsert: true })
    if (error) { setFormError('File upload failed: ' + error.message); return null }
    const { data } = supabase.storage.from('request-attachments').getPublicUrl(path)
    return data.publicUrl
  }

  async function handleSubmit() {
    if (!userId) return
    setSubmitting(true)
    setFormError('')

    if (activeForm === 'event_permission') {
      if (!form.event_date) { setFormError('Date is required'); setSubmitting(false); return }
      if (!form.event_subject.trim()) { setFormError('Subject is required'); setSubmitting(false); return }
      if (!form.event_content.trim()) { setFormError('Content is required'); setSubmitting(false); return }
      if (!form.signature_confirm) { setFormError('Please confirm your signature'); setSubmitting(false); return }
    }
    if (activeForm === 'complaint' && !form.problem_description.trim()) { setFormError('Problem description is required'); setSubmitting(false); return }
    if (activeForm === 'gate_pass') {
      if (!form.gate_pass_date) { setFormError('Date is required'); setSubmitting(false); return }
      if (!form.gate_pass_reason.trim()) { setFormError('Reason is required'); setSubmitting(false); return }
    }
    if (activeForm === 'suggestion' && !form.suggestion_text.trim()) { setFormError('Suggestion is required'); setSubmitting(false); return }
    if (activeForm === 'bonafide') {
      if (!form.bonafide_purpose.trim()) { setFormError('Purpose is required'); setSubmitting(false); return }
      if (!paymentFile) { setFormError('Payment screenshot is required'); setSubmitting(false); return }
    }
    if (activeForm === 'lost_id_card') {
      if (!form.lost_date) { setFormError('Date lost is required'); setSubmitting(false); return }
      if (!form.lost_location.trim()) { setFormError('Location is required'); setSubmitting(false); return }
      if (!form.lost_description.trim()) { setFormError('Description is required'); setSubmitting(false); return }
      if (!paymentFile) { setFormError('Payment screenshot is required'); setSubmitting(false); return }
    }
    if (activeForm === 'fees') {
      if (!form.fee_name) { setFormError('Fee type is required'); setSubmitting(false); return }
      if (!paymentFile) { setFormError('Payment screenshot is required'); setSubmitting(false); return }
    }

    const paymentUrl = await uploadPaymentScreenshot(userId)
    if (formError) { setSubmitting(false); return }

    const section = ['event_permission','complaint','gate_pass','suggestion'].includes(activeForm!) ? 'hod' : 'admin'
    const payload: Record<string, unknown> = { student_id: userId, section, request_type: activeForm, payment_screenshot_url: paymentUrl }

    if (activeForm === 'event_permission') Object.assign(payload, { event_date: form.event_date, event_subject: form.event_subject, event_content: form.event_content, signature_confirm: form.signature_confirm })
    else if (activeForm === 'complaint') payload.problem_description = form.problem_description
    else if (activeForm === 'gate_pass') Object.assign(payload, { gate_pass_date: form.gate_pass_date, gate_pass_reason: form.gate_pass_reason, gate_pass_return_time: form.gate_pass_return_time })
    else if (activeForm === 'suggestion') payload.suggestion_text = form.suggestion_text
    else if (activeForm === 'bonafide') Object.assign(payload, { bonafide_purpose: form.bonafide_purpose, bonafide_notes: form.bonafide_notes })
    else if (activeForm === 'lost_id_card') Object.assign(payload, { lost_date: form.lost_date, lost_location: form.lost_location, lost_description: form.lost_description })
    else if (activeForm === 'fees') Object.assign(payload, { fee_name: form.fee_name, fee_other_name: form.fee_other_name, fee_amount: form.fee_amount ? parseFloat(form.fee_amount) : null })

    const { data, error: dbError } = await supabase.from('requests').insert(payload).select().single()
    if (dbError) { setFormError('Submission failed: ' + dbError.message); setSubmitting(false); return }
    setRequests(prev => [data as Request, ...prev])
    setSuccess('Request submitted successfully.')
    setActiveForm(null)
    setSubmitting(false)
  }

  const hodRequests = requests.filter(r => r.section === 'hod')
  const adminRequests = requests.filter(r => r.section === 'admin')

  return (
    <>
      {activeForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(28,18,8,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200, padding: '16px',
        }}>
          <div style={{
            width: '100%', maxWidth: '520px', background: '#FDFAF5',
            border: '1.5px solid #1C1208', maxHeight: '90vh', overflowY: 'auto',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 20px', borderBottom: '1.5px solid #1C1208',
              position: 'sticky', top: 0, background: '#FDFAF5', zIndex: 1,
            }}>
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', color: '#1C1208' }}>
                {TYPE_LABELS[activeForm].toUpperCase()}
              </span>
              <button type="button" onClick={closeForm} style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                fontSize: '18px', color: '#8A6A4A', fontFamily: 'inherit', lineHeight: 1,
              }}>✕</button>
            </div>

            <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {activeForm === 'event_permission' && (<>
                <div>
                  <label style={labelStyle}>DATE OF EVENT</label>
                  <input type="date" value={form.event_date} onChange={e => upd('event_date', e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>SUBJECT</label>
                  <input type="text" value={form.event_subject} onChange={e => upd('event_subject', e.target.value)} placeholder="e.g. Permission for Tech Fest participation" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>CONTENT</label>
                  <textarea value={form.event_content} onChange={e => upd('event_content', e.target.value)} placeholder="Describe the event and why you need permission..." rows={5} style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.signature_confirm} onChange={e => upd('signature_confirm', e.target.checked)} style={{ marginTop: '2px', accentColor: '#D94F00' }} />
                  <span style={{ fontSize: '11px', color: '#1C1208', lineHeight: 1.5 }}>
                    I confirm that this request has been signed by me and the information provided is accurate.
                  </span>
                </label>
              </>)}

              {activeForm === 'complaint' && (
                <div>
                  <label style={labelStyle}>DESCRIBE THE PROBLEM</label>
                  <textarea value={form.problem_description} onChange={e => upd('problem_description', e.target.value)} placeholder="Describe the issue clearly..." rows={6} style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
              )}

              {activeForm === 'gate_pass' && (<>
                <div>
                  <label style={labelStyle}>DATE</label>
                  <input type="date" value={form.gate_pass_date} onChange={e => upd('gate_pass_date', e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>REASON FOR LEAVING</label>
                  <textarea value={form.gate_pass_reason} onChange={e => upd('gate_pass_reason', e.target.value)} placeholder="Reason for leaving campus..." rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
                <div>
                  <label style={labelStyle}>EXPECTED RETURN TIME</label>
                  <input type="time" value={form.gate_pass_return_time} onChange={e => upd('gate_pass_return_time', e.target.value)} style={inputStyle} />
                </div>
              </>)}

              {activeForm === 'suggestion' && (
                <div>
                  <label style={labelStyle}>YOUR SUGGESTION</label>
                  <textarea value={form.suggestion_text} onChange={e => upd('suggestion_text', e.target.value)} placeholder="Share your suggestion..." rows={6} style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
              )}

              {activeForm === 'bonafide' && (<>
                <div>
                  <label style={labelStyle}>PURPOSE</label>
                  <input type="text" value={form.bonafide_purpose} onChange={e => upd('bonafide_purpose', e.target.value)} placeholder="e.g. Bank account opening, Visa application" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>ADDITIONAL NOTES (OPTIONAL)</label>
                  <textarea value={form.bonafide_notes} onChange={e => upd('bonafide_notes', e.target.value)} placeholder="Any specific details to include..." rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
                <FileUpload fileRef={fileRef} paymentFile={paymentFile} setPaymentFile={setPaymentFile} setFormError={setFormError} />
              </>)}

              {activeForm === 'lost_id_card' && (<>
                <div>
                  <label style={labelStyle}>DATE IT WAS LOST</label>
                  <input type="date" value={form.lost_date} onChange={e => upd('lost_date', e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>WHERE WAS IT LOST</label>
                  <input type="text" value={form.lost_location} onChange={e => upd('lost_location', e.target.value)} placeholder="e.g. College canteen, Bus" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>HOW DID YOU LOSE IT</label>
                  <textarea value={form.lost_description} onChange={e => upd('lost_description', e.target.value)} placeholder="Briefly describe how it was lost..." rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
                <FileUpload fileRef={fileRef} paymentFile={paymentFile} setPaymentFile={setPaymentFile} setFormError={setFormError} />
              </>)}

              {activeForm === 'fees' && (<>
                <div>
                  <label style={labelStyle}>FEE TYPE</label>
                  <select value={form.fee_name} onChange={e => upd('fee_name', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="">Select fee type</option>
                    <option value="year_long_fee">Year Long Fee</option>
                    <option value="semester_end_exam_fee">Semester End Examination Fee</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                {form.fee_name === 'other' && (
                  <div>
                    <label style={labelStyle}>FEE NAME</label>
                    <input type="text" value={form.fee_other_name} onChange={e => upd('fee_other_name', e.target.value)} placeholder="Specify the fee name" style={inputStyle} />
                  </div>
                )}
                <div>
                  <label style={labelStyle}>AMOUNT PAID (₹)</label>
                  <input type="number" value={form.fee_amount} onChange={e => upd('fee_amount', e.target.value)} placeholder="0.00" style={inputStyle} />
                </div>
                <FileUpload fileRef={fileRef} paymentFile={paymentFile} setPaymentFile={setPaymentFile} setFormError={setFormError} />
              </>)}

              {formError && (
                <div style={{ fontSize: '11px', color: '#D94F00', borderLeft: '2px solid #D94F00', paddingLeft: '10px' }}>
                  {formError}
                </div>
              )}

              <button type="button" onClick={handleSubmit} disabled={submitting} style={{
                width: '100%', background: submitting ? '#8A6A4A' : '#1C1208',
                color: '#F2EDE6', border: 'none', padding: '13px',
                fontSize: '10px', fontWeight: 700, letterSpacing: '2px',
                cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              }}>
                {submitting ? 'SUBMITTING...' : 'SUBMIT REQUEST →'}
              </button>
            </div>
          </div>
        </div>
      )}

      <header style={{
        minHeight: '48px', borderBottom: '2px solid #1C1208',
        display: 'flex', alignItems: 'center', padding: '0 clamp(12px,4vw,24px)',
        background: '#F2EDE6', flexShrink: 0,
      }}>
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#1C1208', letterSpacing: '0.5px' }}>REQUESTS</span>
      </header>

      <main style={{
        flex: 1, overflowY: 'auto',
        padding: 'clamp(12px,4vw,20px) clamp(12px,4vw,24px)',
        display: 'flex', flexDirection: 'column', gap: '32px',
      }}>

        {success && (
          <div style={{ fontSize: '11px', color: '#3D7A50', borderLeft: '2px solid #3D7A50', paddingLeft: '10px' }}>
            {success}
          </div>
        )}

        <section>
          <div style={{
            fontSize: '16px', fontWeight: 700, color: '#D94F00',
            letterSpacing: '1px', padding: '14px 20px', border: '1.5px solid #1C1208',
          }}>
            HEAD OF THE DEPARTMENT — REQUESTS
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '8px', padding: '16px',
            background: '#F2EDE6', border: '1.5px solid #1C1208', borderTop: 'none',
          }}>
            <TypeBtn type="event_permission" desc="Events, placements, trips & more" onClick={openForm} />
            <TypeBtn type="complaint" desc="Raise a concern or complaint" onClick={openForm} />
            <TypeBtn type="gate_pass" desc="Permission to leave campus" onClick={openForm} />
            <TypeBtn type="suggestion" desc="Share an idea or feedback" onClick={openForm} />
          </div>
          {hodRequests.length > 0 && (
            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '2px', color: '#8A6A4A', marginBottom: '8px' }}>YOUR HOD REQUESTS</div>
              {hodRequests.map(r => <RequestCard key={r.id} r={r} />)}
            </div>
          )}
        </section>

        <section>
          <div style={{
            fontSize: '16px', fontWeight: 700, color: '#D94F00',
            letterSpacing: '1px', padding: '14px 20px', border: '1.5px solid #1C1208',
          }}>
            ADMINISTRATIVE — REQUESTS
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '8px', padding: '16px',
            background: '#F2EDE6', border: '1.5px solid #1C1208', borderTop: 'none',
          }}>
            <TypeBtn type="bonafide" desc="Certificate with payment screenshot" onClick={openForm} />
            <TypeBtn type="lost_id_card" desc="Report lost card + payment" onClick={openForm} />
            <TypeBtn type="fees" desc="Fee payment confirmation & receipt" onClick={openForm} />
            <div />
          </div>
          {adminRequests.length > 0 && (
            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '2px', color: '#8A6A4A', marginBottom: '8px' }}>YOUR ADMIN REQUESTS</div>
              {adminRequests.map(r => <RequestCard key={r.id} r={r} />)}
            </div>
          )}
        </section>

        {loading && (
          <div style={{ fontSize: '12px', color: '#8A6A4A', textAlign: 'center', padding: '20px' }}>
            Loading requests...
          </div>
        )}
      </main>
    </>
  )
}