'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

type Doc = {
  id: string
  request_type: string
  section: string
  generated_pdf_url: string
  submitted_at: string
  updated_at: string
}

const TYPE_LABELS: Record<string, string> = {
  bonafide:         'Bonafide Certificate',
  lost_id_card:     'ID Card Replacement',
  fees:             'Fee Payment Certificate',
  event_permission: 'Event Permission Letter',
  complaint:        'Complaint Acknowledgement',
  gate_pass:        'Gate Pass',
  suggestion:       'Suggestion Acknowledgement',
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchDocs = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('requests')
      .select('id, request_type, section, generated_pdf_url, submitted_at, updated_at')
      .eq('student_id', user.id)
      .not('generated_pdf_url', 'is', null)
      .order('updated_at', { ascending: false })

    if (data) setDocs(data as Doc[])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchDocs() }, [fetchDocs])

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
  }).toUpperCase()

  return (
    <>
      <header style={{
        minHeight: '48px', borderBottom: '2px solid #1C1208',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(12px,4vw,24px)', background: '#F2EDE6',
        flexShrink: 0, flexWrap: 'wrap', gap: '4px',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#1C1208', letterSpacing: '0.5px' }}>DOCUMENTS</span>
          <span style={{ fontSize: '11px', color: '#C8A878' }}>/</span>
          <span style={{ fontSize: '11px', color: '#8A6A4A' }}>{docs.length} issued</span>
        </div>
        <span style={{ fontSize: '10px', color: '#6A4A2A', background: '#E8DDD0', padding: '4px 10px' }}>{today}</span>
      </header>

      <main style={{
        flex: 1, padding: 'clamp(12px,4vw,20px) clamp(12px,4vw,24px)',
        display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto',
      }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1C1208', margin: 0 }}>Issued documents</h1>
          <p style={{ fontSize: '11px', color: '#8A6A4A', margin: '3px 0 0' }}>
            Auto-generated when your requests are approved. Verifiable by reference number.
          </p>
        </div>

        {loading ? (
          <div style={{ fontSize: '11px', color: '#8A6A4A', letterSpacing: '1px' }}>LOADING...</div>
        ) : docs.length === 0 ? (
          <div style={{ border: '1.5px solid #1C1208', background: '#FDFAF5', padding: '40px', textAlign: 'center' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#1C1208', marginBottom: '6px' }}>No documents yet</div>
            <div style={{ fontSize: '11px', color: '#8A6A4A' }}>
              When a request is approved, its document appears here automatically.
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
            {docs.map(d => (
              <div key={d.id} style={{ border: '1.5px solid #1C1208', background: '#FDFAF5' }}>
                <div style={{ background: '#1C1208', padding: '14px 16px' }}>
                  <div style={{ fontSize: '8px', fontWeight: 700, letterSpacing: '2px', color: '#6A4A2A' }}>
                    SETHU-{d.id.slice(0, 8).toUpperCase()}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#F2EDE6', letterSpacing: '0.5px', marginTop: '4px' }}>
                    {TYPE_LABELS[d.request_type] ?? d.request_type}
                  </div>
                  <div style={{ fontSize: '9px', color: '#6A4A2A', marginTop: '4px', letterSpacing: '1px' }}>
                    {d.section.toUpperCase()} REQUEST
                  </div>
                </div>
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ fontSize: '10px', color: '#8A6A4A', marginBottom: '12px' }}>
                    Issued {new Date(d.updated_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                  <a
                    href={d.generated_pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'block', textAlign: 'center',
                      fontSize: '9px', fontWeight: 700, letterSpacing: '2px',
                      color: '#F2EDE6', background: '#3D7A50',
                      padding: '10px', textDecoration: 'none',
                    }}
                  >
                    ↓ DOWNLOAD PDF
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  )
}