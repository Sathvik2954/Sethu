'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

type Deadline = {
  id: string
  subject_id: string | null
  title: string
  description: string | null
  due_date: string
  type: 'assignment' | 'lab' | 'project' | 'internal' | 'other'
  is_done: boolean
}

type Subject = { id: string; code: string }

const TYPE_LABEL: Record<string, string> = {
  assignment: 'ASSIGNMENT',
  lab: 'LAB RECORD',
  project: 'PROJECT',
  internal: 'INTERNAL',
  other: 'OTHER',
}

export default function DeadlinesPage() {
  const [deadlines, setDeadlines] = useState<Deadline[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [showDone, setShowDone] = useState(false)

  const [form, setForm] = useState({
    title: '',
    subject_id: '',
    type: 'assignment',
    due_date: '',
    description: '',
  })

  const supabase = createClient()

  const fetchAll = useCallback(async () => {
    const [dRes, sRes] = await Promise.all([
      supabase.from('deadlines').select('*').order('due_date'),
      supabase.from('subjects').select('id, code').order('code'),
    ])
    if (dRes.data) setDeadlines(dRes.data)
    if (sRes.data) setSubjects(sRes.data)
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchAll() }, [fetchAll])

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  async function handleSave() {
    if (!form.title.trim()) { setError('Title is required'); return }
    if (!form.due_date) { setError('Due date is required'); return }

    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not signed in'); setSaving(false); return }

    const { error: dbError } = await supabase.from('deadlines').insert({
      student_id: user.id,
      title: form.title.trim(),
      subject_id: form.subject_id || null,
      type: form.type,
      due_date: new Date(form.due_date).toISOString(),
      description: form.description.trim() || null,
    })

    if (dbError) {
      setError(dbError.message)
      setSaving(false)
      return
    }

    setSaving(false)
    setShowForm(false)
    setForm({ title: '', subject_id: '', type: 'assignment', due_date: '', description: '' })
    fetchAll()
  }

  async function toggleDone(d: Deadline) {
    await supabase.from('deadlines').update({ is_done: !d.is_done }).eq('id', d.id)
    fetchAll()
  }

  async function handleDelete(id: string) {
    await supabase.from('deadlines').delete().eq('id', id)
    fetchAll()
  }

  function subjectCode(id: string | null): string {
    if (!id) return ''
    return subjects.find(s => s.id === id)?.code ?? ''
  }

  function daysLeft(due: string): number {
    const diff = new Date(due).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)
    return Math.round(diff / 86400000)
  }

  const visible = deadlines.filter(d => showDone || !d.is_done)
  const openCount = deadlines.filter(d => !d.is_done).length

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
            DEADLINES
          </span>
          <span style={{ fontSize: '11px', color: '#C8A878' }}>/</span>
          <span style={{ fontSize: '11px', color: '#8A6A4A' }}>{openCount} open</span>
        </div>
        <span style={{ fontSize: '10px', color: '#6A4A2A', background: '#E8DDD0', padding: '4px 10px', letterSpacing: '0.5px' }}>
          {today}
        </span>
      </header>

      <main style={{ flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1C1208', margin: 0 }}>
              Assignments &amp; submissions
            </h1>
            <p style={{ fontSize: '11px', color: '#8A6A4A', margin: '3px 0 0' }}>
              Track every due date — assignments, lab records, projects, internals.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span
              onClick={() => setShowDone(!showDone)}
              style={{
                fontSize: '9px', fontWeight: 700, letterSpacing: '1px',
                color: showDone ? '#1C1208' : '#8A6A4A', cursor: 'pointer',
                borderBottom: showDone ? '2px solid #D94F00' : '2px solid transparent',
                paddingBottom: '2px',
              }}
            >
              SHOW COMPLETED
            </span>
            <button
              type="button"
              onClick={() => { setShowForm(!showForm); setError('') }}
              style={{
                background: '#1C1208', color: '#F2EDE6', border: 'none',
                padding: '10px 22px', fontSize: '10px', fontWeight: 700,
                letterSpacing: '2px', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {showForm ? '✕ CLOSE' : '+ ADD DEADLINE'}
            </button>
          </div>
        </div>

        {showForm && (
          <div style={{ border: '1.5px solid #1C1208', background: '#FDFAF5', padding: '18px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>TITLE</label>
                <input type="text" value={form.title} onChange={e => update('title', e.target.value)} placeholder="DBMS Assignment 3" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>SUBJECT</label>
                <select value={form.subject_id} onChange={e => update('subject_id', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">—</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.code}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>TYPE</label>
                <select value={form.type} onChange={e => update('type', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="assignment">Assignment</option>
                  <option value="lab">Lab record</option>
                  <option value="project">Project</option>
                  <option value="internal">Internal</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>DUE DATE</label>
                <input type="date" value={form.due_date} onChange={e => update('due_date', e.target.value)} style={inputStyle} />
              </div>
            </div>

            {error && (
              <div style={{ fontSize: '11px', color: '#D94F00', borderLeft: '2px solid #D94F00', paddingLeft: '10px', marginTop: '12px' }}>
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{
                marginTop: '14px', width: '100%',
                background: saving ? '#8A6A4A' : '#1C1208', color: '#F2EDE6',
                border: 'none', padding: '11px', fontSize: '10px', fontWeight: 700,
                letterSpacing: '2px', cursor: saving ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {saving ? 'SAVING...' : 'ADD DEADLINE →'}
            </button>
          </div>
        )}

        {loading ? (
          <div style={{ fontSize: '11px', color: '#8A6A4A', letterSpacing: '1px' }}>LOADING...</div>
        ) : visible.length === 0 ? (
          <div style={{
            border: '1.5px solid #1C1208', background: '#FDFAF5',
            padding: '40px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#1C1208', marginBottom: '6px' }}>
              {openCount === 0 && deadlines.length > 0 ? 'All caught up ✓' : 'No deadlines yet'}
            </div>
            <div style={{ fontSize: '11px', color: '#8A6A4A' }}>
              {openCount === 0 && deadlines.length > 0
                ? 'Everything is done. Enjoy the free time — or let the AI planner fill it.'
                : 'Add your first assignment or lab record deadline.'}
            </div>
          </div>
        ) : (
          <div style={{ border: '1.5px solid #1C1208' }}>
            {visible.map((d, i) => {
              const days = daysLeft(d.due_date)
              const overdue = !d.is_done && days < 0
              return (
                <div key={d.id} style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '13px 16px',
                  background: '#FDFAF5',
                  borderBottom: i < visible.length - 1 ? '1px solid #E0D0B8' : 'none',
                  opacity: d.is_done ? 0.55 : 1,
                }}>
                  {/* Checkbox */}
                  <div
                    onClick={() => toggleDone(d)}
                    style={{
                      width: '18px', height: '18px', flexShrink: 0,
                      border: '1.5px solid #1C1208',
                      background: d.is_done ? '#3D7A50' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '11px', color: '#F2EDE6', cursor: 'pointer',
                    }}
                  >
                    {d.is_done ? '✓' : ''}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '12px', fontWeight: 700, color: '#1C1208',
                      textDecoration: d.is_done ? 'line-through' : 'none',
                    }}>
                      {d.title}
                    </div>
                    <div style={{ fontSize: '10px', color: '#8A6A4A', marginTop: '2px' }}>
                      {subjectCode(d.subject_id) && `${subjectCode(d.subject_id)} · `}
                      {TYPE_LABEL[d.type]}
                      {' · Due '}
                      {new Date(d.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </div>
                  </div>

                  {!d.is_done && (
                    <span style={{
                      fontSize: '9px', fontWeight: 700, letterSpacing: '1px',
                      padding: '3px 9px',
                      background: overdue ? '#D94F00' : days <= 2 ? '#3A2808' : days <= 7 ? '#E8C87A' : '#1A3020',
                      color: overdue ? '#F2EDE6' : days <= 2 ? '#C8A050' : days <= 7 ? '#1C1208' : '#6AAA70',
                    }}>
                      {overdue ? `OVERDUE ${Math.abs(days)}D` : days === 0 ? 'TODAY' : `IN ${days}D`}
                    </span>
                  )}

                  <span
                    onClick={() => handleDelete(d.id)}
                    style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '1px', color: '#D94F00', cursor: 'pointer' }}
                  >
                    DEL
                  </span>
                </div>
              )
            })}
          </div>
        )}

      </main>
    </>
  )
}
