'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

// ── Types ──────────────────────────────────────────────────────
type RequestType = 'event_permission' | 'complaint' | 'gate_pass' | 'suggestion'
  | 'bonafide' | 'lost_id_card' | 'fees'

type Request = {
  id: string
  section: 'hod' | 'admin'
  request_type: RequestType
  status: string
  submitted_at: string
  admin_notes: string | null
  admin_set_date: string | null
  // HOD fields
  event_date: string | null
  event_end_date: string | null
  event_subject: string | null
  event_content: string | null
  signature_confirm: boolean | null
  problem_description: string | null
  gate_pass_date: string | null
  gate_pass_reason: string | null
  gate_pass_return_time: string | null
  suggestion_text: string | null
  // Admin fields
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
  // Joined
  student: { full_name: string; roll_number: string | null; department: string } | null
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

const STATUS_COLOR: Record<string, { bg: string; fg: string }> = {
  pending:   { bg: '#E8C87A', fg: '#1C1208' },
  in_review: { bg: '#D94F00', fg: '#F2EDE6' },
  approved:  { bg: '#3D7A50', fg: '#F2EDE6' },
  rejected:  { bg: '#8A6A4A', fg: '#F2EDE6' },
  completed: { bg: '#3D7A50', fg: '#F2EDE6' },
}

// ── Detail row ─────────────────────────────────────────────────
function Row({ label, value }: { label: string; value: string | null }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '6px' }}>
      <span style={{ fontSize: '9px', fontWeight: 700, color: '#8A6A4A', letterSpacing: '1px', minWidth: '110px' }}>
        {label.toUpperCase()}
      </span>
      <span style={{ fontSize: '12px', color: '#1C1208', flex: 1 }}>{value}</span>
    </div>
  )
}

// ── Request detail fields ──────────────────────────────────────
function RequestDetail({ r }: { r: Request }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {r.request_type === 'event_permission' && (<>
        <Row label="Event Date" value={r.event_end_date ? `${r.event_date} to ${r.event_end_date}` : r.event_date} />
        <Row label="Subject" value={r.event_subject} />
        <Row label="Content" value={r.event_content} />
        <Row label="Signature" value={r.signature_confirm ? 'Confirmed by student' : 'Not confirmed'} />
      </>)}
      {r.request_type === 'complaint' && <Row label="Problem" value={r.problem_description} />}
      {r.request_type === 'gate_pass' && (<>
        <Row label="Date" value={r.gate_pass_date} />
        <Row label="Reason" value={r.gate_pass_reason} />
        <Row label="Return Time" value={r.gate_pass_return_time} />
      </>)}
      {r.request_type === 'suggestion' && <Row label="Suggestion" value={r.suggestion_text} />}
      {r.request_type === 'bonafide' && (<>
        <Row label="Purpose" value={r.bonafide_purpose} />
        <Row label="Notes" value={r.bonafide_notes} />
      </>)}
      {r.request_type === 'lost_id_card' && (<>
        <Row label="Lost On" value={r.lost_date} />
        <Row label="Location" value={r.lost_location} />
        <Row label="Description" value={r.lost_description} />
      </>)}
      {r.request_type === 'fees' && (<>
        <Row label="Fee Type" value={
          r.fee_name === 'year_long_fee' ? 'Year Long Fee'
          : r.fee_name === 'semester_end_exam_fee' ? 'Semester End Exam Fee'
          : r.fee_other_name ?? 'Other'
        } />
        {r.fee_amount != null && <Row label="Amount" value={`₹${r.fee_amount}`} />}
      </>)}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────
// ── Payment screenshot - generates a signed URL on click since the
// request-attachments bucket is private ──────────────────────────
function PaymentScreenshotLink({ path, supabase }: { path: string; supabase: ReturnType<typeof createClient> }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleView() {
    setLoading(true); setError('')
    const { data, error: err } = await supabase.storage
      .from('request-attachments')
      .createSignedUrl(path, 300) // valid for 5 minutes

    setLoading(false)
    if (err || !data) { setError('Could not load screenshot: ' + (err?.message ?? 'unknown error')); return }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div>
      <button type="button" onClick={handleView} disabled={loading} style={{
        background: 'transparent', border: 'none', padding: 0,
        fontSize: '11px', color: '#D94F00', fontWeight: 700,
        cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
        textDecoration: 'underline',
      }}>
        {loading ? 'LOADING...' : 'VIEW SCREENSHOT ↗'}
      </button>
      {error && <div style={{ fontSize: '10px', color: '#D94F00', marginTop: '4px' }}>{error}</div>}
    </div>
  )
}

export default function ApprovalsPage() {
  const supabase = createClient()
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'pending' | 'all'>('pending')
  const [sectionFilter, setSectionFilter] = useState<'all' | 'hod' | 'admin'>('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [adminDate, setAdminDate] = useState('')
  const [acting, setActing] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('requests')
      .select('*, student:users!requests_student_id_fkey(full_name, roll_number, department)')
      .order('submitted_at', { ascending: false })

    if (filter === 'pending') query = query.in('status', ['pending', 'in_review'])
    if (sectionFilter !== 'all') query = query.eq('section', sectionFilter)

    const { data, error } = await query
    if (error) setError(error.message)
    else { setRequests((data as Request[]) ?? []); setError('') }
    setLoading(false)
  }, [filter, sectionFilter])

  useEffect(() => { fetchRequests() }, [fetchRequests])

  function openExpand(id: string) {
    const r = requests.find(x => x.id === id)
    setExpanded(id)
    setAdminNotes(r?.admin_notes ?? '')
    setAdminDate(r?.admin_set_date ? new Date(r.admin_set_date).toISOString().slice(0, 16) : '')
    setError('')
    setSuccessMsg('')
  }

  async function handleAct(r: Request, newStatus: string) {
    setActing(true)
    setError('')
    setSuccessMsg('')

    const { error: dbErr } = await supabase
      .from('requests')
      .update({
        status: newStatus,
        admin_notes: adminNotes.trim() || null,
        admin_set_date: adminDate ? new Date(adminDate).toISOString() : null,
      })
      .eq('id', r.id)

    if (dbErr) { setError('Update failed: ' + dbErr.message); setActing(false); return }

    // Audit log this status change
    fetch('/api/log-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: `request_${newStatus}`,
        target_type: 'request',
        target_id: r.id,
        details: { request_type: r.request_type, student_name: r.student?.full_name ?? null, previous_status: r.status },
      }),
    }).catch(() => {}) // non-blocking - don't fail the approval if logging fails

    // Auto-generate PDF when approved
    if (newStatus === 'approved') {
      try {
        const res = await fetch('/api/generate-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestId: r.id }),
        })
        const result = await res.json()
        if (!res.ok) console.error('Doc gen failed:', result.error)
      } catch (e) {
        console.error('Doc gen error:', e)
      }
    }

    setSuccessMsg(`Request marked as ${newStatus}.`)
    setExpanded(null)
    setActing(false)
    fetchRequests()
  }

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
  }).toUpperCase()

  const pendingCount = requests.filter(r => r.status === 'pending' || r.status === 'in_review').length

  const inputStyle: React.CSSProperties = {
    width: '100%', border: '1px solid #4A3020', background: '#261A0A',
    padding: '9px 11px', fontSize: '11px', color: '#E8C87A',
    outline: 'none', borderRadius: 0, fontFamily: 'inherit', display: 'block',
  }

  return (
    <>
      <header style={{
        minHeight: '48px', borderBottom: '2px solid #1C1208',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(12px,4vw,24px)', background: '#F2EDE6',
        flexShrink: 0, flexWrap: 'wrap', gap: '4px',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#1C1208', letterSpacing: '0.5px' }}>APPROVALS</span>
          <span style={{ fontSize: '11px', color: '#C8A878' }}>/</span>
          <span style={{ fontSize: '11px', color: '#8A6A4A' }}>{pendingCount} awaiting action</span>
        </div>
        <span style={{ fontSize: '10px', color: '#6A4A2A', background: '#E8DDD0', padding: '4px 10px' }}>{today}</span>
      </header>

      <main style={{
        flex: 1, overflowY: 'auto',
        padding: 'clamp(12px,4vw,20px) clamp(12px,4vw,24px)',
        display: 'flex', flexDirection: 'column', gap: '16px',
      }}>

        {/* Filter bar */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1C1208', margin: 0 }}>Request queue</h1>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {/* Status filter */}
            <div style={{ display: 'flex', border: '1.5px solid #1C1208' }}>
              {(['pending', 'all'] as const).map((f, i) => (
                <button key={f} type="button" onClick={() => setFilter(f)} style={{
                  padding: '7px 14px', fontSize: '9px', fontWeight: 700, letterSpacing: '1px',
                  cursor: 'pointer', fontFamily: 'inherit', border: 'none',
                  borderRight: i === 0 ? '1.5px solid #1C1208' : 'none',
                  background: filter === f ? '#1C1208' : '#F2EDE6',
                  color: filter === f ? '#F2EDE6' : '#8A6A4A',
                }}>
                  {f === 'pending' ? 'ACTIVE' : 'ALL'}
                </button>
              ))}
            </div>
            {/* Section filter */}
            <div style={{ display: 'flex', border: '1.5px solid #1C1208' }}>
              {(['all', 'hod', 'admin'] as const).map((f, i) => (
                <button key={f} type="button" onClick={() => setSectionFilter(f)} style={{
                  padding: '7px 14px', fontSize: '9px', fontWeight: 700, letterSpacing: '1px',
                  cursor: 'pointer', fontFamily: 'inherit', border: 'none',
                  borderRight: i < 2 ? '1.5px solid #1C1208' : 'none',
                  background: sectionFilter === f ? '#1C1208' : '#F2EDE6',
                  color: sectionFilter === f ? '#F2EDE6' : '#8A6A4A',
                }}>
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {successMsg && (
          <div style={{ fontSize: '11px', color: '#3D7A50', borderLeft: '2px solid #3D7A50', paddingLeft: '10px' }}>{successMsg}</div>
        )}
        {error && (
          <div style={{ fontSize: '11px', color: '#D94F00', borderLeft: '2px solid #D94F00', paddingLeft: '10px' }}>{error}</div>
        )}

        {loading ? (
          <div style={{ fontSize: '11px', color: '#8A6A4A', padding: '20px 0' }}>LOADING...</div>
        ) : requests.length === 0 ? (
          <div style={{ border: '1.5px solid #1C1208', background: '#FDFAF5', padding: '40px', textAlign: 'center' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#1C1208', marginBottom: '6px' }}>
              {filter === 'pending' ? 'Queue is clear' : 'No requests yet'}
            </div>
            <div style={{ fontSize: '11px', color: '#8A6A4A' }}>
              {filter === 'pending' ? 'No requests awaiting your action.' : 'No requests have been submitted.'}
            </div>
          </div>
        ) : (
          <div style={{ border: '1.5px solid #1C1208' }}>
            {requests.map((r, i) => {
              const st = STATUS_COLOR[r.status] ?? STATUS_COLOR.pending
              const isOpen = expanded === r.id
              const needsDate = r.request_type === 'lost_id_card' || r.request_type === 'bonafide' || r.request_type === 'fees'

              return (
                <div key={r.id} style={{ borderBottom: i < requests.length - 1 ? '1px solid #E0D0B8' : 'none', background: '#FDFAF5' }}>
                  {/* Row */}
                  <div
                    onClick={() => isOpen ? setExpanded(null) : openExpand(r.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', cursor: 'pointer', flexWrap: 'wrap' }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#1C1208' }}>
                        {TYPE_LABELS[r.request_type]}
                        <span style={{ fontWeight: 400, color: '#8A6A4A' }}>
                          {' - '}{r.student?.full_name ?? 'Unknown'}
                          {r.student?.roll_number ? ` (${r.student.roll_number})` : ''}
                        </span>
                      </div>
                      <div style={{ fontSize: '10px', color: '#8A6A4A', marginTop: '2px' }}>
                        {r.student?.department ?? ''} · {r.section.toUpperCase()} ·{' '}
                        {new Date(r.submitted_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                    <span style={{
                      fontSize: '9px', fontWeight: 700, letterSpacing: '1px',
                      padding: '3px 9px', background: st.bg, color: st.fg, flexShrink: 0,
                    }}>
                      {r.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span style={{ fontSize: '11px', color: '#8A6A4A' }}>{isOpen ? '▴' : '▾'}</span>
                  </div>

                  {/* Expanded panel */}
                  {isOpen && (
                    <div style={{ borderTop: '1px solid #E0D0B8', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                      {/* Student details */}
                      <RequestDetail r={r} />

                      {/* Payment screenshot */}
                      {r.payment_screenshot_url && (
                        <div>
                          <div style={{ fontSize: '9px', fontWeight: 700, color: '#8A6A4A', letterSpacing: '1px', marginBottom: '6px' }}>PAYMENT SCREENSHOT</div>
                          <PaymentScreenshotLink path={r.payment_screenshot_url} supabase={supabase} />
                        </div>
                      )}

                      {/* Action panel */}
                      <div style={{ background: '#1C1208', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ fontSize: '8px', fontWeight: 700, letterSpacing: '2px', color: '#6A4A2A' }}>
                          TAKE ACTION
                        </div>

                        <div>
                          <div style={{ fontSize: '9px', color: '#8A6A4A', letterSpacing: '1px', marginBottom: '6px' }}>MESSAGE TO STUDENT (OPTIONAL)</div>
                          <textarea
                            value={adminNotes}
                            onChange={e => setAdminNotes(e.target.value)}
                            placeholder="e.g. Your request has been approved. Please collect..."
                            rows={3}
                            style={{ ...inputStyle, resize: 'vertical' }}
                          />
                        </div>

                        {needsDate && (
                          <div>
                            <div style={{ fontSize: '9px', color: '#8A6A4A', letterSpacing: '1px', marginBottom: '6px' }}>
                              {r.request_type === 'lost_id_card' ? 'ID CARD COLLECTION DATE & TIME' : 'DOCUMENT READY DATE & TIME'}
                            </div>
                            <input
                              type="datetime-local"
                              value={adminDate}
                              onChange={e => setAdminDate(e.target.value)}
                              style={inputStyle}
                            />
                          </div>
                        )}

                        {r.generated_pdf_url && (
                          <div style={{ fontSize: '10px', color: '#6A4A2A' }}>
                            Previously generated:{' '}
                            <a href={r.generated_pdf_url} target="_blank" rel="noopener noreferrer" style={{ color: '#E8C87A' }}>
                              view PDF ↗
                            </a>
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button type="button" onClick={() => handleAct(r, 'in_review')} disabled={acting} style={{
                            flex: 1, minWidth: '80px', background: '#4A3020', color: '#E8C87A',
                            border: 'none', padding: '10px', fontSize: '9px', fontWeight: 700,
                            letterSpacing: '1.5px', cursor: acting ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                          }}>
                            IN REVIEW
                          </button>
                          <button type="button" onClick={() => handleAct(r, 'approved')} disabled={acting} style={{
                            flex: 1, minWidth: '80px', background: '#3D7A50', color: '#F2EDE6',
                            border: 'none', padding: '10px', fontSize: '9px', fontWeight: 700,
                            letterSpacing: '1.5px', cursor: acting ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                          }}>
                            {acting ? '...' : '✓ APPROVE'}
                          </button>
                          <button type="button" onClick={() => handleAct(r, 'rejected')} disabled={acting} style={{
                            flex: 1, minWidth: '80px', background: '#D94F00', color: '#F2EDE6',
                            border: 'none', padding: '10px', fontSize: '9px', fontWeight: 700,
                            letterSpacing: '1.5px', cursor: acting ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                          }}>
                            {acting ? '...' : '✕ REJECT'}
                          </button>
                          <button type="button" onClick={() => handleAct(r, 'completed')} disabled={acting} style={{
                            flex: 1, minWidth: '80px', background: '#1C3828', color: '#6AAA70',
                            border: '1px solid #3D7A50', padding: '10px', fontSize: '9px', fontWeight: 700,
                            letterSpacing: '1.5px', cursor: acting ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                          }}>
                            {acting ? '...' : '✓✓ COMPLETE'}
                          </button>
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </>
  )
}