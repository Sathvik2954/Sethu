'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SkeletonList, SkeletonStyles } from '@/components/SkeletonLoader'

// ── Types ──────────────────────────────────────────────────────
type Deadline = {
  id: string
  source: 'student' | 'faculty'
  student_id: string | null
  sender_id: string | null
  title: string
  description: string | null
  due_date: string
  priority: 'low' | 'medium' | 'high'
  is_done: boolean
  created_at: string
  sender_name?: string
  subject_name?: string
}

type UserInfo = {
  id: string
  role: string
  department: string | null
  year: number | null
  section: string | null
}

const PRIORITY_COLOR: Record<string, string> = {
  high: '#D94F00', medium: '#E8C87A', low: '#3D7A50',
}
const PRIORITY_FG: Record<string, string> = {
  high: '#F2EDE6', medium: '#1C1208', low: '#F2EDE6',
}

const inp: React.CSSProperties = {
  width: '100%', border: '1.5px solid #C8A878', background: '#F2EDE6',
  padding: '10px 12px', fontSize: '13px', color: '#1C1208',
  outline: 'none', borderRadius: 0, fontFamily: 'inherit', display: 'block',
}
const lbl: React.CSSProperties = {
  fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px',
  color: '#6A4A2A', marginBottom: '6px', display: 'block',
}

const DEPARTMENTS = ['CSE','AIML','CET','AIDS','IT','ECE','EEE','MECH','CIVIL','BIO TECH']

// ── Deadline card (outside main to prevent remount) ────────────
function DeadlineCard({
  d, isOwn, onToggle, onDelete,
}: {
  d: Deadline
  isOwn: boolean
  onToggle: (id: string, done: boolean) => void
  onDelete: (id: string) => void
}) {
  const due = new Date(d.due_date)
  const now = new Date()
  const daysLeft = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  const isOverdue = daysLeft < 0 && !d.is_done
  const isToday = daysLeft === 0 && !d.is_done
  const isSoon = daysLeft > 0 && daysLeft <= 3 && !d.is_done

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 16px',
      border: `1.5px solid ${isOverdue ? '#D94F00' : '#1C1208'}`,
      background: d.is_done ? '#F5F0EA' : isOverdue ? '#FFF8F5' : '#FDFAF5',
      marginBottom: '8px', opacity: d.is_done ? 0.65 : 1,
    }}>
      {/* Checkbox (only for own deadlines) */}
      {isOwn ? (
        <input
          type="checkbox"
          checked={d.is_done}
          onChange={e => onToggle(d.id, e.target.checked)}
          style={{ marginTop: '3px', accentColor: '#D94F00', width: '16px', height: '16px', flexShrink: 0, cursor: 'pointer' }}
        />
      ) : (
        <div style={{ width: '16px', height: '16px', flexShrink: 0, marginTop: '3px',
          background: '#8A6A4A', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '8px', color: '#F2EDE6', fontWeight: 700,
        }}>F</div>
      )}

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#1C1208', textDecoration: d.is_done ? 'line-through' : 'none' }}>
            {d.title}
          </span>
          <span style={{
            fontSize: '7px', fontWeight: 700, letterSpacing: '1px',
            padding: '2px 7px', background: PRIORITY_COLOR[d.priority], color: PRIORITY_FG[d.priority],
          }}>
            {d.priority.toUpperCase()}
          </span>
          {d.source === 'faculty' && (
            <span style={{ fontSize: '9px', color: '#8A6A4A', fontStyle: 'italic' }}>
              from {d.sender_name ?? 'Faculty'}
            </span>
          )}
        </div>
        {d.description && (
          <div style={{ fontSize: '11px', color: '#6A4A2A', marginTop: '4px', lineHeight: 1.5 }}>{d.description}</div>
        )}
        {d.subject_name && (
          <div style={{ fontSize: '10px', color: '#8A6A4A', marginTop: '3px' }}>📚 {d.subject_name}</div>
        )}
        <div style={{ fontSize: '10px', marginTop: '5px', fontWeight: 700,
          color: isOverdue ? '#D94F00' : isToday ? '#D94F00' : isSoon ? '#E8A000' : '#8A6A4A',
        }}>
          {d.is_done ? '✓ Done' :
            isOverdue ? `Overdue by ${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? 's' : ''}` :
            isToday ? 'Due today!' :
            isSoon ? `Due in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}` :
            `Due ${due.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`
          }
        </div>
      </div>

      {/* Delete (own only) */}
      {isOwn && (
        <button type="button" onClick={() => onDelete(d.id)} style={{
          background: 'transparent', border: 'none', color: '#C8A878',
          cursor: 'pointer', fontSize: '14px', lineHeight: 1, padding: '0 2px',
          fontFamily: 'inherit', flexShrink: 0,
        }}>✕</button>
      )}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────
export default function DeadlinesPage() {
  const supabase = createClient()
  const [me, setMe] = useState<UserInfo | null>(null)
  const [deadlines, setDeadlines] = useState<Deadline[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('pending')
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  // Student add form
  const [form, setForm] = useState({ title: '', description: '', due_date: '', priority: 'medium' })

  // Faculty send form
  const [fForm, setFForm] = useState({
    title: '', description: '', due_date: '', priority: 'medium',
    target_dept: '', target_section: '', target_year: '',
  })
  const [showFForm, setShowFForm] = useState(false)
  const [fSaving, setFSaving] = useState(false)

  const isStaff = me && ['faculty', 'hod', 'admin'].includes(me.role)

  const load = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('users').select('id, role, department, year, section').eq('id', user.id).single()
    setMe(profile as UserInfo)

    const { data } = await supabase
      .from('deadlines').select('*').order('due_date', { ascending: true })
    if (!data) { setLoading(false); return }

    // Fetch sender names for faculty deadlines
    const senderIds = [...new Set(data.filter(d => d.sender_id).map(d => d.sender_id as string))]
    let senderMap: Record<string, string> = {}
    if (senderIds.length > 0) {
      const { data: senders } = await supabase.from('users').select('id, full_name').in('id', senderIds)
      senderMap = Object.fromEntries((senders ?? []).map(s => [s.id, s.full_name]))
    }

    setDeadlines(data.map(d => ({ ...d, sender_name: d.sender_id ? senderMap[d.sender_id] : undefined })))
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  async function handleAdd() {
    if (!form.title.trim()) { setError('Title is required'); return }
    if (!form.due_date) { setError('Due date is required'); return }
    if (!me) return
    setSaving(true); setError('')

    const { data: { user } } = await supabase.auth.getUser()
    const { error: e } = await supabase.from('deadlines').insert({
      source: 'student',
      student_id: user!.id,
      title: form.title.trim(),
      description: form.description.trim() || null,
      due_date: form.due_date,
      priority: form.priority,
    })

    if (e) { setError(e.message); setSaving(false); return }
    setSuccess('Deadline added.')
    setForm({ title: '', description: '', due_date: '', priority: 'medium' })
    setShowForm(false)
    setSaving(false)
    load()
  }

  async function handleSend() {
    if (!fForm.title.trim()) { setError('Title is required'); return }
    if (!fForm.due_date) { setError('Due date is required'); return }
    if (!me) return
    setFSaving(true); setError('')

    const { data: { user } } = await supabase.auth.getUser()
    const payload: Record<string, unknown> = {
      source: 'faculty',
      sender_id: user!.id,
      title: fForm.title.trim(),
      description: fForm.description.trim() || null,
      due_date: fForm.due_date,
      priority: fForm.priority,
    }

    // Faculty: auto-fill dept from profile, admin can pick
    payload.target_dept = fForm.target_dept || me.department || null
    if (fForm.target_section) payload.target_section = fForm.target_section
    if (fForm.target_year) payload.target_year = parseInt(fForm.target_year)

    const { error: e } = await supabase.from('deadlines').insert(payload)
    if (e) { setError(e.message); setFSaving(false); return }
    setSuccess('Deadline sent to students.')
    setFForm({ title: '', description: '', due_date: '', priority: 'medium', target_dept: '', target_section: '', target_year: '' })
    setShowFForm(false)
    setFSaving(false)
    load()
  }

  async function handleToggle(id: string, done: boolean) {
    await supabase.from('deadlines').update({ is_done: done }).eq('id', id)
    setDeadlines(prev => prev.map(d => d.id === id ? { ...d, is_done: done } : d))
  }

  async function handleDelete(id: string) {
    await supabase.from('deadlines').delete().eq('id', id)
    setDeadlines(prev => prev.filter(d => d.id !== id))
  }

  const myId = me?.id
  // Filter: expired faculty deadlines don't show in pending view
  const now = new Date()
  const filtered = deadlines.filter(d => {
    if (d.source === 'faculty' && !d.is_done && new Date(d.due_date) < now && filter !== 'done') return false
    if (filter === 'pending') return !d.is_done
    if (filter === 'done') return d.is_done
    return true
  })

  const overdue = filtered.filter(d => !d.is_done && new Date(d.due_date) < new Date()).length
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()

  return (
    <>
      <SkeletonStyles />
      <header style={{
        minHeight: '48px', borderBottom: '2px solid #1C1208',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(12px,4vw,24px)', background: '#F2EDE6',
        flexShrink: 0, flexWrap: 'wrap', gap: '4px',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#1C1208' }}>DEADLINES</span>
          {overdue > 0 && (
            <span style={{ fontSize: '9px', fontWeight: 700, background: '#D94F00', color: '#F2EDE6', padding: '2px 7px', letterSpacing: '1px' }}>
              {overdue} OVERDUE
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', color: '#6A4A2A', background: '#E8DDD0', padding: '4px 10px' }}>{today}</span>
          {isStaff ? (
            <button type="button" onClick={() => { setShowFForm(s => !s); setError('') }} style={{
              background: '#1C1208', color: '#F2EDE6', border: 'none',
              padding: '8px 16px', fontSize: '9px', fontWeight: 700,
              letterSpacing: '1.5px', cursor: 'pointer', fontFamily: 'inherit',
            }}>
              {showFForm ? '✕ CANCEL' : '+ SEND DEADLINE'}
            </button>
          ) : (
            <button type="button" onClick={() => { setShowForm(s => !s); setError('') }} style={{
              background: '#1C1208', color: '#F2EDE6', border: 'none',
              padding: '8px 16px', fontSize: '9px', fontWeight: 700,
              letterSpacing: '1.5px', cursor: 'pointer', fontFamily: 'inherit',
            }}>
              {showForm ? '✕ CANCEL' : '+ ADD DEADLINE'}
            </button>
          )}
        </div>
      </header>

      <main style={{
        flex: 1, overflowY: 'auto',
        padding: 'clamp(12px,4vw,20px) clamp(12px,4vw,24px)',
        display: 'flex', flexDirection: 'column', gap: '16px',
      }}>

        {success && <div style={{ fontSize: '11px', color: '#3D7A50', borderLeft: '2px solid #3D7A50', paddingLeft: '10px' }}>{success}</div>}
        {error && <div style={{ fontSize: '11px', color: '#D94F00', borderLeft: '2px solid #D94F00', paddingLeft: '10px' }}>{error}</div>}

        {/* ── Student add form ── */}
        {!isStaff && showForm && (
          <div style={{ border: '1.5px solid #1C1208', background: '#FDFAF5' }}>
            <div style={{ padding: '10px 18px', borderBottom: '1.5px solid #1C1208', fontSize: '9px', fontWeight: 700, letterSpacing: '2px', color: '#8A6A4A' }}>
              NEW PERSONAL DEADLINE
            </div>
            <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: '12px' }}>
                <div>
                  <label style={lbl}>TITLE</label>
                  <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Submit assignment" style={inp} />
                </div>
                <div>
                  <label style={lbl}>DUE DATE</label>
                  <input type="datetime-local" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} style={inp} />
                </div>
                <div>
                  <label style={lbl}>PRIORITY</label>
                  <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={lbl}>DESCRIPTION (OPTIONAL)</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} placeholder="Any notes..." style={{ ...inp, resize: 'vertical' }} />
              </div>
              <button type="button" onClick={handleAdd} disabled={saving} style={{
                background: saving ? '#8A6A4A' : '#1C1208', color: '#F2EDE6', border: 'none',
                padding: '12px', fontSize: '10px', fontWeight: 700, letterSpacing: '2px',
                cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              }}>
                {saving ? 'SAVING...' : 'ADD DEADLINE →'}
              </button>
            </div>
          </div>
        )}

        {/* ── Faculty send form ── */}
        {isStaff && showFForm && (
          <div style={{ border: '1.5px solid #1C1208', background: '#FDFAF5' }}>
            <div style={{ padding: '10px 18px', borderBottom: '1.5px solid #1C1208', fontSize: '9px', fontWeight: 700, letterSpacing: '2px', color: '#8A6A4A' }}>
              SEND DEADLINE TO STUDENTS
            </div>
            <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

              {/* Audience */}
              <div style={{ background: '#F2EDE6', border: '1px solid #E0D0B8', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '9px', fontWeight: 700, color: '#8A6A4A', letterSpacing: '1.5px' }}>AUDIENCE</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px,1fr))', gap: '10px' }}>
                  <div>
                    <label style={lbl}>DEPARTMENT</label>
                    <select
                      value={fForm.target_dept || (me?.role !== 'admin' ? (me?.department ?? '') : '')}
                      onChange={e => setFForm(p => ({ ...p, target_dept: e.target.value }))}
                      disabled={me?.role !== 'admin'}
                      style={{ ...inp, cursor: me?.role !== 'admin' ? 'not-allowed' : 'pointer', opacity: me?.role !== 'admin' ? 0.7 : 1 }}
                    >
                      {me?.role === 'admin' && <option value="">All departments</option>}
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    {me?.role !== 'admin' && <div style={{ fontSize: '9px', color: '#8A6A4A', marginTop: '3px' }}>Auto-set to your department</div>}
                  </div>
                  <div>
                    <label style={lbl}>SECTION (OPTIONAL)</label>
                    <input type="text" value={fForm.target_section} onChange={e => setFForm(p => ({ ...p, target_section: e.target.value.toUpperCase() }))} placeholder="A, B... or blank for all" style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>YEAR (OPTIONAL)</label>
                    <select value={fForm.target_year} onChange={e => setFForm(p => ({ ...p, target_year: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>
                      <option value="">All years</option>
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: '12px' }}>
                <div>
                  <label style={lbl}>TITLE</label>
                  <input type="text" value={fForm.title} onChange={e => setFForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Lab record submission" style={inp} />
                </div>
                <div>
                  <label style={lbl}>DUE DATE & TIME</label>
                  <input type="datetime-local" value={fForm.due_date} onChange={e => setFForm(p => ({ ...p, due_date: e.target.value }))} style={inp} />
                </div>
                <div>
                  <label style={lbl}>PRIORITY</label>
                  <select value={fForm.priority} onChange={e => setFForm(p => ({ ...p, priority: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={lbl}>DESCRIPTION (OPTIONAL)</label>
                <textarea value={fForm.description} onChange={e => setFForm(p => ({ ...p, description: e.target.value }))} rows={2} placeholder="Any additional details..." style={{ ...inp, resize: 'vertical' }} />
              </div>
              <button type="button" onClick={handleSend} disabled={fSaving} style={{
                background: fSaving ? '#8A6A4A' : '#D94F00', color: '#F2EDE6', border: 'none',
                padding: '12px', fontSize: '10px', fontWeight: 700, letterSpacing: '2px',
                cursor: fSaving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              }}>
                {fSaving ? 'SENDING...' : 'SEND DEADLINE →'}
              </button>
            </div>
          </div>
        )}

        {/* Filter bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', border: '1.5px solid #1C1208' }}>
            {(['pending', 'all', 'done'] as const).map((f, i, arr) => (
              <button key={f} type="button" onClick={() => setFilter(f)} style={{
                padding: '7px 14px', fontSize: '9px', fontWeight: 700, letterSpacing: '1px',
                cursor: 'pointer', fontFamily: 'inherit', border: 'none',
                borderRight: i < arr.length - 1 ? '1.5px solid #1C1208' : 'none',
                background: filter === f ? '#1C1208' : '#F2EDE6',
                color: filter === f ? '#F2EDE6' : '#8A6A4A',
              }}>
                {f.toUpperCase()}
              </button>
            ))}
          </div>
          <span style={{ fontSize: '10px', color: '#8A6A4A' }}>{filtered.length} deadline{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Legend */}
        {!isStaff && (
          <div style={{ display: 'flex', gap: '16px', fontSize: '10px', color: '#8A6A4A', flexWrap: 'wrap' }}>
            <span>☑ Personal</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '14px', height: '14px', background: '#8A6A4A', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '7px', color: '#F2EDE6', fontWeight: 700 }}>F</span>
              Faculty-sent
            </span>
          </div>
        )}

        {/* Deadline list */}
        {loading ? (
          <SkeletonList count={4} />
        ) : filtered.length === 0 ? (
          <div style={{ border: '1.5px solid #1C1208', background: '#FDFAF5', padding: '40px', textAlign: 'center' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#1C1208', marginBottom: '6px' }}>
              {filter === 'pending' ? 'All clear!' : filter === 'done' ? 'Nothing completed yet' : 'No deadlines'}
            </div>
            <div style={{ fontSize: '11px', color: '#8A6A4A' }}>
              {filter === 'pending' ? 'No pending deadlines. Add one or check back later.' : ''}
            </div>
          </div>
        ) : (
          <div>
            {filtered.map(d => (
              <DeadlineCard
                key={d.id}
                d={d}
                isOwn={d.source === 'student' && d.student_id === myId}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>
    </>
  )
}