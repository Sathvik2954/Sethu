'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

type ApprovalStep = {
  id: string
  step_number: number
  step_label: string
  status: 'pending' | 'approved' | 'rejected'
  comments: string | null
  acted_at: string | null
}

type Request = {
  id: string
  type: string
  status: 'pending' | 'in_review' | 'approved' | 'rejected'
  title: string
  description: string | null
  metadata: Record<string, string> | null
  document_url: string | null
  submitted_at: string
  approval_steps: ApprovalStep[]
}

const REQUEST_TYPES = [
  { value: 'gate_pass', label: 'Gate Pass', desc: 'Permission to leave campus during college hours' },
  { value: 'bonafide', label: 'Bonafide Certificate', desc: 'Proof of enrollment for bank, passport, scholarships' },
  { value: 'lost_id', label: 'Lost ID Card', desc: 'Apply for a replacement ID card' },
  { value: 'fee_verification', label: 'Fee Verification', desc: 'Semester-end fee payment confirmation' },
]

const STATUS_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
  pending:   { bg: '#3A2808', fg: '#C8A050', label: 'PENDING' },
  in_review: { bg: '#2A1A30', fg: '#C0A0D0', label: 'IN REVIEW' },
  approved:  { bg: '#1A3020', fg: '#6AAA70', label: 'APPROVED' },
  rejected:  { bg: '#3D1A08', fg: '#E8805A', label: 'REJECTED' },
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const [reqType, setReqType] = useState('')
  const [description, setDescription] = useState('')
  const [meta, setMeta] = useState<Record<string, string>>({})

  const supabase = createClient()

  const fetchRequests = useCallback(async () => {
    const { data, error } = await supabase
      .from('requests')
      .select('*, approval_steps(*)')
      .order('submitted_at', { ascending: false })

    if (!error && data) {
      data.forEach((r: Request) =>
        r.approval_steps?.sort((a, b) => a.step_number - b.step_number)
      )
      setRequests(data)
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  function metaFields(type: string): { key: string; label: string; inputType: string }[] {
    switch (type) {
      case 'gate_pass':
        return [
          { key: 'date', label: 'DATE OF EXIT', inputType: 'date' },
          { key: 'time', label: 'TIME OF EXIT', inputType: 'time' },
          { key: 'reason', label: 'REASON', inputType: 'text' },
        ]
      case 'bonafide':
        return [{ key: 'purpose', label: 'PURPOSE (BANK / PASSPORT / SCHOLARSHIP...)', inputType: 'text' }]
      case 'lost_id':
        return [
          { key: 'lost_date', label: 'WHEN WAS IT LOST', inputType: 'date' },
          { key: 'details', label: 'WHERE / HOW (BRIEF)', inputType: 'text' },
        ]
      case 'fee_verification':
        return [
          { key: 'semester', label: 'SEMESTER', inputType: 'text' },
          { key: 'receipt_no', label: 'FEE RECEIPT NUMBER', inputType: 'text' },
        ]
      default:
        return []
    }
  }

  async function handleSubmit() {
    if (!reqType) { setError('Select a request type'); return }
    const fields = metaFields(reqType)
    for (const f of fields) {
      if (!meta[f.key]?.trim()) {
        setError(`${f.label} is required`)
        return
      }
    }

    setSaving(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not signed in'); setSaving(false); return }

    const typeLabel = REQUEST_TYPES.find(t => t.value === reqType)?.label ?? reqType

    // 1 — create the request
    const { data: request, error: reqError } = await supabase
      .from('requests')
      .insert({
        student_id: user.id,
        type: reqType,
        status: 'pending',
        title: typeLabel,
        description: description.trim() || null,
        metadata: meta,
      })
      .select()
      .single()

    if (reqError || !request) {
      setError(reqError?.message ?? 'Request creation failed')
      setSaving(false)
      return
    }

    // 2 — fetch routing rules for this type
    const { data: routing, error: routeError } = await supabase
      .from('request_routing')
      .select('step_number, step_label')
      .eq('request_type', reqType)
      .order('step_number')

    if (routeError) {
      setError('Routing lookup failed: ' + routeError.message)
      setSaving(false)
      return
    }

    // 3 — create the approval steps
    if (routing && routing.length > 0) {
      const steps = routing.map(r => ({
        request_id: request.id,
        step_number: r.step_number,
        step_label: r.step_label,
        status: 'pending',
      }))
      const { error: stepError } = await supabase.from('approval_steps').insert(steps)
      if (stepError) {
        setError('Steps creation failed: ' + stepError.message +
          ' — did you run requests_rls_fix.sql in Supabase?')
        setSaving(false)
        return
      }
    }

    setSaving(false)
    setShowForm(false)
    setReqType('')
    setDescription('')
    setMeta({})
    fetchRequests()
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', border: '1.5px solid #C8A878',
    background: '#F2EDE6', padding: '9px 11px',
    fontSize: '12px', color: '#1C1208',
    outline: 'none', borderRadius: 0, fontFamily: 'inherit',
    display: 'block',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '9px', fontWeight: 700,
    letterSpacing: '1.5px', color: '#6A4A2A',
    marginBottom: '5px', display: 'block',
  }

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
  }).toUpperCase()

  return (
    <>
      <header style={{
        height: '48px', borderBottom: '2px solid #1C1208',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', background: '#F2EDE6', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#1C1208', letterSpacing: '0.5px' }}>
            REQUESTS
          </span>
          <span style={{ fontSize: '11px', color: '#C8A878' }}>/</span>
          <span style={{ fontSize: '11px', color: '#8A6A4A' }}>
            {requests.filter(r => r.status === 'pending' || r.status === 'in_review').length} active
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

        {/* Action bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1C1208', margin: 0, letterSpacing: '0.5px' }}>
              Administrative requests
            </h1>
            <p style={{ fontSize: '11px', color: '#8A6A4A', margin: '3px 0 0' }}>
              Submit digitally, track every approval stage — no queues.
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setShowForm(!showForm); setError('') }}
            style={{
              background: '#1C1208', color: '#F2EDE6', border: 'none',
              padding: '10px 22px', fontSize: '10px', fontWeight: 700,
              letterSpacing: '2px', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {showForm ? '✕ CLOSE' : '+ NEW REQUEST'}
          </button>
        </div>

        {/* New request form */}
        {showForm && (
          <div style={{ border: '1.5px solid #1C1208', background: '#FDFAF5' }}>
            <div style={{
              borderBottom: '1.5px solid #1C1208', padding: '11px 18px',
              fontSize: '9px', fontWeight: 700, letterSpacing: '2px', color: '#8A6A4A',
            }}>
              NEW REQUEST
            </div>

            <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Type selector */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {REQUEST_TYPES.map(t => (
                  <div
                    key={t.value}
                    onClick={() => { setReqType(t.value); setMeta({}); setError('') }}
                    style={{
                      border: reqType === t.value ? '1.5px solid #D94F00' : '1.5px solid #C8A878',
                      background: reqType === t.value ? '#1C1208' : '#F2EDE6',
                      padding: '12px 14px', cursor: 'pointer',
                    }}
                  >
                    <div style={{
                      fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px',
                      color: reqType === t.value ? '#F2EDE6' : '#1C1208',
                    }}>
                      {t.label}
                    </div>
                    <div style={{
                      fontSize: '10px', marginTop: '3px', lineHeight: 1.4,
                      color: reqType === t.value ? '#C8A878' : '#8A6A4A',
                    }}>
                      {t.desc}
                    </div>
                  </div>
                ))}
              </div>

              {/* Dynamic fields */}
              {reqType && (
                <div style={{ display: 'grid', gridTemplateColumns: metaFields(reqType).length > 1 ? 'repeat(2, 1fr)' : '1fr', gap: '12px' }}>
                  {metaFields(reqType).map(f => (
                    <div key={f.key} style={f.key === 'reason' || f.key === 'details' ? { gridColumn: '1 / -1' } : {}}>
                      <label style={labelStyle}>{f.label}</label>
                      <input
                        type={f.inputType}
                        value={meta[f.key] ?? ''}
                        onChange={e => { setMeta(prev => ({ ...prev, [f.key]: e.target.value })); setError('') }}
                        style={inputStyle}
                      />
                    </div>
                  ))}
                </div>
              )}

              {reqType && (
                <div>
                  <label style={labelStyle}>ADDITIONAL NOTES (OPTIONAL)</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={2}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>
              )}

              {error && (
                <div style={{ fontSize: '11px', color: '#D94F00', borderLeft: '2px solid #D94F00', paddingLeft: '10px' }}>
                  {error}
                </div>
              )}

              {reqType && (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={saving}
                  style={{
                    background: saving ? '#8A6A4A' : '#1C1208', color: '#F2EDE6',
                    border: 'none', padding: '11px', fontSize: '10px', fontWeight: 700,
                    letterSpacing: '2px', cursor: saving ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {saving ? 'SUBMITTING...' : 'SUBMIT REQUEST →'}
                </button>
              )}

            </div>
          </div>
        )}

        {/* Request list */}
        {loading ? (
          <div style={{ fontSize: '11px', color: '#8A6A4A', letterSpacing: '1px', padding: '20px 0' }}>
            LOADING...
          </div>
        ) : requests.length === 0 && !showForm ? (
          <div style={{
            border: '1.5px solid #1C1208', background: '#FDFAF5',
            padding: '40px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#1C1208', marginBottom: '6px' }}>
              No requests yet
            </div>
            <div style={{ fontSize: '11px', color: '#8A6A4A' }}>
              Submit your first request — gate pass, bonafide, lost ID, or fee verification.
            </div>
          </div>
        ) : (
          <div style={{ border: '1.5px solid #1C1208' }}>
            {requests.map((r, i) => {
              const st = STATUS_STYLE[r.status]
              const isOpen = expanded === r.id
              return (
                <div key={r.id} style={{
                  borderBottom: i < requests.length - 1 ? '1px solid #E0D0B8' : 'none',
                  background: '#FDFAF5',
                }}>
                  {/* Row */}
                  <div
                    onClick={() => setExpanded(isOpen ? null : r.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '14px',
                      padding: '14px 16px', cursor: 'pointer',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#1C1208', letterSpacing: '0.5px' }}>
                        {r.title}
                      </div>
                      <div style={{ fontSize: '10px', color: '#8A6A4A', marginTop: '2px' }}>
                        Submitted {new Date(r.submitted_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        {' · '}{r.approval_steps?.filter(s => s.status === 'approved').length ?? 0}/{r.approval_steps?.length ?? 0} approvals done
                      </div>
                    </div>
                    <span style={{
                      fontSize: '9px', fontWeight: 700, letterSpacing: '1px',
                      padding: '3px 9px', background: st.bg, color: st.fg,
                    }}>
                      {st.label}
                    </span>
                    <span style={{ fontSize: '11px', color: '#8A6A4A' }}>{isOpen ? '▴' : '▾'}</span>
                  </div>

                  {/* Expanded: approval timeline */}
                  {isOpen && (
                    <div style={{ padding: '0 16px 16px 16px' }}>
                      <div style={{ borderTop: '1px solid #E0D0B8', paddingTop: '14px' }}>
                        <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px', color: '#8A6A4A', marginBottom: '12px' }}>
                          APPROVAL TIMELINE
                        </div>

                        {r.approval_steps?.map(step => (
                          <div key={step.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '12px' }}>
                            <div style={{
                              width: '18px', height: '18px', flexShrink: 0,
                              background:
                                step.status === 'approved' ? '#3D7A50' :
                                step.status === 'rejected' ? '#D94F00' : '#E0D0B8',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '10px', color: '#F2EDE6', fontWeight: 700,
                            }}>
                              {step.status === 'approved' ? '✓' : step.status === 'rejected' ? '✕' : step.step_number}
                            </div>
                            <div>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: '#1C1208' }}>
                                {step.step_label}
                              </div>
                              <div style={{ fontSize: '10px', color: '#8A6A4A', marginTop: '1px' }}>
                                {step.status === 'pending' ? 'Awaiting review' :
                                 `${step.status === 'approved' ? 'Approved' : 'Rejected'}${step.acted_at ? ' on ' + new Date(step.acted_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : ''}`}
                              </div>
                              {step.comments && (
                                <div style={{
                                  fontSize: '10px', color: '#6A4A2A', marginTop: '4px',
                                  borderLeft: '2px solid #C8A878', paddingLeft: '8px',
                                }}>
                                  &ldquo;{step.comments}&rdquo;
                                </div>
                              )}
                            </div>
                          </div>
                        ))}

                        {r.document_url && (
                          <a
                            href={r.document_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-block', marginTop: '4px',
                              fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px',
                              color: '#F2EDE6', background: '#3D7A50',
                              padding: '8px 16px', textDecoration: 'none',
                            }}
                          >
                            ↓ DOWNLOAD DOCUMENT
                          </a>
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
