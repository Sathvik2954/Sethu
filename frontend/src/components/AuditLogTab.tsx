'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

type AuditEntry = {
  id: string
  actor_id: string | null
  action: string
  target_type: string
  target_id: string | null
  details: Record<string, unknown> | null
  created_at: string
  actor_name?: string
}

const ACTION_COLOR: Record<string, { bg: string; fg: string }> = {
  create_staff_account:     { bg: '#3D7A50', fg: '#F2EDE6' },
  delete_staff_account:     { bg: '#D94F00', fg: '#F2EDE6' },
  deactivate_staff_account: { bg: '#8A6A4A', fg: '#F2EDE6' },
  reactivate_staff_account: { bg: '#3D7A50', fg: '#F2EDE6' },
  request_approved:         { bg: '#3D7A50', fg: '#F2EDE6' },
  request_rejected:         { bg: '#D94F00', fg: '#F2EDE6' },
  request_in_review:        { bg: '#E8C87A', fg: '#1C1208' },
  request_completed:        { bg: '#1C1208', fg: '#C8A878' },
}

const ACTION_LABEL: Record<string, string> = {
  create_staff_account:     'Created staff account',
  delete_staff_account:     'Deleted staff account',
  deactivate_staff_account: 'Deactivated account',
  reactivate_staff_account: 'Reactivated account',
  request_approved:         'Approved request',
  request_rejected:         'Rejected request',
  request_in_review:        'Marked in review',
  request_completed:        'Completed request',
}

const inp: React.CSSProperties = {
  width: '100%', border: '1.5px solid #C8A878', background: '#F2EDE6',
  padding: '9px 12px', fontSize: '13px', color: '#1C1208',
  outline: 'none', borderRadius: 0, fontFamily: 'inherit', display: 'block',
}

export default function AuditLogTab() {
  const supabase = createClient()
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filterAction, setFilterAction] = useState('all')
  const [filterTargetType, setFilterTargetType] = useState('all')
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)

    if (!data) { setEntries([]); setLoading(false); return }

    const actorIds = [...new Set(data.filter(d => d.actor_id).map(d => d.actor_id as string))]
    let actorMap: Record<string, string> = {}
    if (actorIds.length > 0) {
      const { data: actors } = await supabase.from('users').select('id, full_name').in('id', actorIds)
      actorMap = Object.fromEntries((actors ?? []).map((a: { id: string; full_name: string }) => [a.id, a.full_name]))
    }

    setEntries(data.map((d: AuditEntry) => ({ ...d, actor_name: d.actor_id ? actorMap[d.actor_id] ?? 'Unknown' : 'System' })))
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  const actionTypes = [...new Set(entries.map(e => e.action))]
  const targetTypes = [...new Set(entries.map(e => e.target_type))]

  const filtered = entries.filter(e => {
    if (filterAction !== 'all' && e.action !== filterAction) return false
    if (filterTargetType !== 'all' && e.target_type !== filterTargetType) return false
    if (search.trim()) {
      const s = search.toLowerCase()
      const detailsStr = JSON.stringify(e.details ?? {}).toLowerCase()
      if (!e.actor_name?.toLowerCase().includes(s) && !detailsStr.includes(s) && !e.action.toLowerCase().includes(s)) {
        return false
      }
    }
    return true
  })

  return (
    <main style={{ flex: 1, overflowY: 'auto', padding: 'clamp(12px,4vw,24px)', display: 'flex', flexDirection: 'column', gap: '16px' }}>

      <div>
        <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1C1208', margin: 0 }}>Audit Log</h1>
        <p style={{ fontSize: '11px', color: '#8A6A4A', margin: '3px 0 0' }}>
          Record of sensitive actions taken by staff - account changes and request decisions. Last 200 entries.
        </p>
      </div>

      {/* Filters */}
      <div style={{ border: '1.5px solid #1C1208', background: '#FDFAF5', padding: '14px 18px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
          <div>
            <label style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px', color: '#6A4A2A', marginBottom: '5px', display: 'block' }}>SEARCH</label>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search actor or details..." style={inp} />
          </div>
          <div>
            <label style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px', color: '#6A4A2A', marginBottom: '5px', display: 'block' }}>ACTION</label>
            <select value={filterAction} onChange={e => setFilterAction(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
              <option value="all">All actions</option>
              {actionTypes.map(a => <option key={a} value={a}>{ACTION_LABEL[a] ?? a}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px', color: '#6A4A2A', marginBottom: '5px', display: 'block' }}>TARGET TYPE</label>
            <select value={filterTargetType} onChange={e => setFilterTargetType(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
              <option value="all">All types</option>
              {targetTypes.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div style={{ fontSize: '10px', color: '#8A6A4A' }}>{filtered.length} of {entries.length} entries</div>

      {/* Entries */}
      {loading ? (
        <div style={{ fontSize: '11px', color: '#8A6A4A' }}>LOADING...</div>
      ) : filtered.length === 0 ? (
        <div style={{ border: '1.5px solid #1C1208', background: '#FDFAF5', padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#1C1208', marginBottom: '6px' }}>No entries found</div>
          <div style={{ fontSize: '11px', color: '#8A6A4A' }}>
            {entries.length === 0 ? 'No audit log entries yet. Actions will appear here as they happen.' : 'Try adjusting your filters.'}
          </div>
        </div>
      ) : (
        <div style={{ border: '1.5px solid #1C1208' }}>
          {filtered.map((e, i) => {
            const ac = ACTION_COLOR[e.action] ?? { bg: '#8A6A4A', fg: '#F2EDE6' }
            return (
              <div key={e.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '14px 16px',
                borderBottom: i < filtered.length - 1 ? '1px solid #E0D0B8' : 'none',
                background: i % 2 === 0 ? '#FDFAF5' : '#F2EDE6', flexWrap: 'wrap',
              }}>
                <span style={{
                  fontSize: '8px', fontWeight: 700, letterSpacing: '1px',
                  padding: '4px 10px', background: ac.bg, color: ac.fg, flexShrink: 0, whiteSpace: 'nowrap',
                }}>
                  {(ACTION_LABEL[e.action] ?? e.action).toUpperCase()}
                </span>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#1C1208' }}>
                    {e.actor_name} <span style={{ fontWeight: 400, color: '#8A6A4A' }}>· {e.target_type}</span>
                  </div>
                  {e.details && Object.keys(e.details).length > 0 && (
                    <div style={{ fontSize: '10px', color: '#6A4A2A', marginTop: '4px', lineHeight: 1.6 }}>
                      {Object.entries(e.details).filter(([, v]) => v != null).map(([k, v]) => (
                        <span key={k} style={{ marginRight: '12px' }}>
                          <strong>{k.replace(/_/g, ' ')}:</strong> {String(v)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <span style={{ fontSize: '10px', color: '#8A6A4A', flexShrink: 0, whiteSpace: 'nowrap' }}>
                  {new Date(e.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}