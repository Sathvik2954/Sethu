'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

type Step = {
  id: string
  step_number: number
  step_label: string
  status: 'pending' | 'approved' | 'rejected'
  comments: string | null
  acted_at: string | null
}

type StudentInfo = {
  full_name: string
  roll_number: string | null
  department: string
}

type Req = {
  id: string
  type: string
  status: string
  title: string
  description: string | null
  metadata: Record<string, string> | null
  submitted_at: string
  approval_steps: Step[]
  student: StudentInfo | null
}

const STATUS_STYLE: Record<string, { bg: string; fg: string }> = {
  pending:   { bg: '#3A2808', fg: '#C8A050' },
  in_review: { bg: '#2A1A30', fg: '#C0A0D0' },
  approved:  { bg: '#1A3020', fg: '#6AAA70' },
  rejected:  { bg: '#3D1A08', fg: '#E8805A' },
}

export default function ApprovalsPage() {
  const [requests, setRequests] = useState<Req[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'active' | 'all'>('active')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [comment, setComment] = useState('')
  const [acting, setActing] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('requests')
      .select('*, approval_steps(*), student:users!requests_student_id_fkey(full_name, roll_number, department)')
      .order('submitted_at', { ascending: false })

    if (filter === 'active') {
      query = query.in('status', ['pending', 'in_review'])
    }

    const { data, error } = await query
    if (error) {
      setError(error.message)
    } else if (data) {
      data.forEach((r: Req) =>
        r.approval_steps?.sort((a, b) => a.step_number - b.step_number)
      )
      setRequests(data as Req[])
      setError('')
    }
    setLoading(false)
  }, [supabase, filter])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  function currentStep(r: Req): Step | null {
    return r.approval_steps?.find(s => s.status === 'pending') ?? null
  }

  async function act(r: Req, decision: 'approved' | 'rejected') {
    const step = currentStep(r)
    if (!step) return

    setActing(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not signed in'); setActing(false); return }

    // 1 — update the step
    const { error: stepError } = await supabase
      .from('approval_steps')
      .update({
        status: decision,
        approver_id: user.id,
        comments: comment.trim() || null,
        acted_at: new Date().toISOString(),
      })
      .eq('id', step.id)

    if (stepError) {
      setError('Step update failed: ' + stepError.message)
      setActing(false)
      return
    }

    // 2 — work out the new request status
    let newStatus: string
    if (decision === 'rejected') {
      newStatus = 'rejected'
    } else {
      const remaining = r.approval_steps.filter(
        s => s.id !== step.id && s.status === 'pending'
      ).length
      newStatus = remaining === 0 ? 'approved' : 'in_review'
    }

    const { error: reqError } = await supabase
      .from('requests')
      .update({ status: newStatus })
      .eq('id', r.id)

    if (reqError) {
      setError('Request update failed: ' + reqError.message)
      setActing(false)
      return
    }

    // 3 — generate the PDF document on final approval
    if (newStatus === 'approved') {
      try {
        const pdfRes = await fetch('/api/generate-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestId: r.id }),
        })
        const pdfData = await pdfRes.json()
        console.log('PDF GEN RESULT:', pdfRes.status, pdfData)
      } catch (e) {
        console.log('PDF GEN FETCH ERROR:', e)
      }
    }

    setComment('')
    setExpanded(null)
    setActing(false)
    fetchRequests()
  }

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
  }).toUpperCase()

  const activeCount = requests.filter(r => r.status === 'pending' || r.status === 'in_review').length

  return (
    <>
      <header style={{
        height: '48px', borderBottom: '2px solid #1C1208',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', background: '#F2EDE6', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#1C1208', letterSpacing: '0.5px' }}>
            APPROVALS
          </span>
          <span style={{ fontSize: '11px', color: '#C8A878' }}>/</span>
          <span style={{ fontSize: '11px', color: '#8A6A4A' }}>
            {activeCount} awaiting action
          </span>
        </div>
        <span style={{
          fontSize: '10px', color: '#6A4A2A', background: '#E8DDD0',
          padding: '4px 10px', letterSpacing: '0.5px',
        }}>
          {today}
        </span>
      </header>

      <main style={{ flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>

        {/* Filter bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1C1208', margin: 0, letterSpacing: '0.5px' }}>
            Request queue
          </h1>
          <div style={{ display: 'flex', border: '1.5px solid #1C1208' }}>
            {(['active', 'all'] as const).map((f, i) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                style={{
                  padding: '7px 18px', fontSize: '9px', fontWeight: 700,
                  letterSpacing: '1.5px', cursor: 'pointer', fontFamily: 'inherit',
                  border: 'none',
                  borderRight: i === 0 ? '1.5px solid #1C1208' : 'none',
                  background: filter === f ? '#1C1208' : '#F2EDE6',
                  color: filter === f ? '#F2EDE6' : '#8A6A4A',
                }}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ border: '1.5px solid #D94F00', background: '#FDFAF5', padding: '14px 16px' }}>
            <div style={{ fontSize: '11px', color: '#D94F00' }}>{error}</div>
          </div>
        )}

        {loading ? (
          <div style={{ fontSize: '11px', color: '#8A6A4A', letterSpacing: '1px', padding: '20px 0' }}>
            LOADING...
          </div>
        ) : requests.length === 0 ? (
          <div style={{
            border: '1.5px solid #1C1208', background: '#FDFAF5',
            padding: '40px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#1C1208', marginBottom: '6px' }}>
              {filter === 'active' ? 'Queue is clear' : 'No requests'}
            </div>
            <div style={{ fontSize: '11px', color: '#8A6A4A' }}>
              {filter === 'active' ? 'No requests awaiting your action.' : 'No requests have been submitted yet.'}
            </div>
          </div>
        ) : (
          <div style={{ border: '1.5px solid #1C1208' }}>
            {requests.map((r, i) => {
              const st = STATUS_STYLE[r.status] ?? STATUS_STYLE.pending
              const isOpen = expanded === r.id
              const step = currentStep(r)
              return (
                <div key={r.id} style={{
                  borderBottom: i < requests.length - 1 ? '1px solid #E0D0B8' : 'none',
                  background: '#FDFAF5',
                }}>
                  {/* Row */}
                  <div
                    onClick={() => { setExpanded(isOpen ? null : r.id); setComment(''); setError('') }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '14px',
                      padding: '14px 16px', cursor: 'pointer',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#1C1208', letterSpacing: '0.5px' }}>
                        {r.title}
                        <span style={{ fontWeight: 400, color: '#8A6A4A' }}>
                          {' — '}{r.student?.full_name ?? 'Unknown'}
                          {r.student?.roll_number ? ` (${r.student.roll_number})` : ''}
                        </span>
                      </div>
                      <div style={{ fontSize: '10px', color: '#8A6A4A', marginTop: '2px' }}>
                        {r.student?.department ?? ''} · Submitted{' '}
                        {new Date(r.submitted_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        {step ? ` · Awaiting: ${step.step_label}` : ''}
                      </div>
                    </div>
                    <span style={{
                      fontSize: '9px', fontWeight: 700, letterSpacing: '1px',
                      padding: '3px 9px', background: st.bg, color: st.fg,
                    }}>
                      {r.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span style={{ fontSize: '11px', color: '#8A6A4A' }}>{isOpen ? '▴' : '▾'}</span>
                  </div>

                  {/* Expanded */}
                  {isOpen && (
                    <div style={{ padding: '0 16px 16px' }}>
                      <div style={{ borderTop: '1px solid #E0D0B8', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

                        {/* Request details */}
                        {r.metadata && Object.keys(r.metadata).length > 0 && (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                            {Object.entries(r.metadata).map(([k, v]) => (
                              <div key={k}>
                                <div style={{ fontSize: '8px', fontWeight: 700, letterSpacing: '1.5px', color: '#8A6A4A' }}>
                                  {k.replace(/_/g, ' ').toUpperCase()}
                                </div>
                                <div style={{ fontSize: '12px', color: '#1C1208', marginTop: '2px' }}>{v}</div>
                              </div>
                            ))}
                          </div>
                        )}

                        {r.description && (
                          <div style={{ fontSize: '11px', color: '#6A4A2A', borderLeft: '2px solid #C8A878', paddingLeft: '10px' }}>
                            {r.description}
                          </div>
                        )}

                        {/* Steps timeline */}
                        <div>
                          <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px', color: '#8A6A4A', marginBottom: '10px' }}>
                            APPROVAL STEPS
                          </div>
                          {r.approval_steps.map(s => (
                            <div key={s.id} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '7px' }}>
                              <div style={{
                                width: '16px', height: '16px', flexShrink: 0,
                                background:
                                  s.status === 'approved' ? '#3D7A50' :
                                  s.status === 'rejected' ? '#D94F00' : '#E0D0B8',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '9px', color: '#F2EDE6', fontWeight: 700,
                              }}>
                                {s.status === 'approved' ? '✓' : s.status === 'rejected' ? '✕' : s.step_number}
                              </div>
                              <div style={{ fontSize: '11px', color: '#1C1208', fontWeight: s.status === 'pending' ? 700 : 400 }}>
                                {s.step_label}
                              </div>
                              {s.comments && (
                                <div style={{ fontSize: '10px', color: '#8A6A4A' }}>— &ldquo;{s.comments}&rdquo;</div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Action panel — only if there's a pending step */}
                        {step && (
                          <div style={{ background: '#1C1208', padding: '14px 16px' }}>
                            <div style={{ fontSize: '8px', fontWeight: 700, letterSpacing: '2px', color: '#6A4A2A', marginBottom: '8px' }}>
                              ACT AS: {step.step_label.toUpperCase()}
                            </div>
                            <input
                              type="text"
                              value={comment}
                              onChange={e => setComment(e.target.value)}
                              placeholder="Comment (optional)"
                              style={{
                                width: '100%', border: '1px solid #4A3020',
                                background: '#261A0A', padding: '9px 11px',
                                fontSize: '11px', color: '#E8C87A',
                                outline: 'none', borderRadius: 0, fontFamily: 'inherit',
                                marginBottom: '10px', display: 'block',
                              }}
                            />
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                type="button"
                                onClick={() => act(r, 'approved')}
                                disabled={acting}
                                style={{
                                  flex: 1, background: '#3D7A50', color: '#F2EDE6',
                                  border: 'none', padding: '10px', fontSize: '9px',
                                  fontWeight: 700, letterSpacing: '2px',
                                  cursor: acting ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                                }}
                              >
                                {acting ? '...' : '✓ APPROVE'}
                              </button>
                              <button
                                type="button"
                                onClick={() => act(r, 'rejected')}
                                disabled={acting}
                                style={{
                                  flex: 1, background: '#D94F00', color: '#F2EDE6',
                                  border: 'none', padding: '10px', fontSize: '9px',
                                  fontWeight: 700, letterSpacing: '2px',
                                  cursor: acting ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                                }}
                              >
                                {acting ? '...' : '✕ REJECT'}
                              </button>
                            </div>
                          </div>
                        )}

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
