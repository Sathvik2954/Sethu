'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

type Subject = {
  id: string
  name: string
  code: string
  credits: number
  difficulty: number
  coverage_pct: number
  exam_weightage: number
  exam_date: string | null
  faculty_name: string | null
}

const emptyForm = {
  name: '',
  code: '',
  credits: '3',
  difficulty: '3',
  coverage_pct: '0',
  exam_weightage: '50',
  exam_date: '',
  faculty_name: '',
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const supabase = createClient()

  const fetchSubjects = useCallback(async () => {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('exam_date', { ascending: true, nullsFirst: false })

    if (!error && data) setSubjects(data)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchSubjects()
  }, [fetchSubjects])

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  function openAddForm() {
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(true)
    setError('')
  }

  function openEditForm(s: Subject) {
    setForm({
      name: s.name,
      code: s.code,
      credits: String(s.credits),
      difficulty: String(s.difficulty),
      coverage_pct: String(s.coverage_pct),
      exam_weightage: String(s.exam_weightage),
      exam_date: s.exam_date ?? '',
      faculty_name: s.faculty_name ?? '',
    })
    setEditingId(s.id)
    setShowForm(true)
    setError('')
  }

  async function handleSave() {
    if (!form.name.trim()) { setError('Subject name is required'); return }
    if (!form.code.trim()) { setError('Subject code is required'); return }

    setSaving(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not signed in'); setSaving(false); return }

    const payload = {
      student_id: user.id,
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      credits: parseInt(form.credits) || 3,
      difficulty: parseInt(form.difficulty) || 3,
      coverage_pct: Math.min(100, Math.max(0, parseInt(form.coverage_pct) || 0)),
      exam_weightage: parseInt(form.exam_weightage) || 50,
      exam_date: form.exam_date || null,
      faculty_name: form.faculty_name.trim() || null,
    }

    let dbError
    if (editingId) {
      const { error } = await supabase.from('subjects').update(payload).eq('id', editingId)
      dbError = error
    } else {
      const { error } = await supabase.from('subjects').insert(payload)
      dbError = error
    }

    if (dbError) {
      setError(dbError.message)
      setSaving(false)
      return
    }

    setSaving(false)
    setShowForm(false)
    setForm(emptyForm)
    setEditingId(null)
    fetchSubjects()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this subject? This cannot be undone.')) return
    await supabase.from('subjects').delete().eq('id', id)
    fetchSubjects()
  }

  function daysToExam(examDate: string | null): number | null {
    if (!examDate) return null
    const diff = new Date(examDate).getTime() - new Date().setHours(0, 0, 0, 0)
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
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
      {/* Topbar */}
      <header style={{
        height: '48px', borderBottom: '2px solid #1C1208',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', background: '#F2EDE6', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#1C1208', letterSpacing: '0.5px' }}>
            SUBJECTS
          </span>
          <span style={{ fontSize: '11px', color: '#C8A878' }}>/</span>
          <span style={{ fontSize: '11px', color: '#8A6A4A' }}>
            {subjects.length} registered
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
              Semester subjects
            </h1>
            <p style={{ fontSize: '11px', color: '#8A6A4A', margin: '3px 0 0' }}>
              These power the AI planner — keep coverage and exam dates updated.
            </p>
          </div>
          <button
            type="button"
            onClick={openAddForm}
            style={{
              background: '#1C1208', color: '#F2EDE6', border: 'none',
              padding: '10px 22px', fontSize: '10px', fontWeight: 700,
              letterSpacing: '2px', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            + ADD SUBJECT
          </button>
        </div>

        {/* Add/Edit form */}
        {showForm && (
          <div style={{ border: '1.5px solid #1C1208', background: '#FDFAF5' }}>
            <div style={{
              borderBottom: '1.5px solid #1C1208', padding: '11px 18px',
              fontSize: '9px', fontWeight: 700, letterSpacing: '2px', color: '#8A6A4A',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span>{editingId ? 'EDIT SUBJECT' : 'NEW SUBJECT'}</span>
              <span
                onClick={() => setShowForm(false)}
                style={{ cursor: 'pointer', color: '#D94F00', letterSpacing: '1px' }}
              >
                ✕ CLOSE
              </span>
            </div>

            <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>SUBJECT NAME</label>
                  <input type="text" value={form.name} onChange={e => update('name', e.target.value)} placeholder="Database Management Systems" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>CODE</label>
                  <input type="text" value={form.code} onChange={e => update('code', e.target.value)} placeholder="DBMS" style={inputStyle} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>CREDITS</label>
                  <select value={form.credits} onChange={e => update('credits', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                    {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>DIFFICULTY (1–5)</label>
                  <select value={form.difficulty} onChange={e => update('difficulty', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="1">1 — Easy</option>
                    <option value="2">2 — Light</option>
                    <option value="3">3 — Medium</option>
                    <option value="4">4 — Hard</option>
                    <option value="5">5 — Very hard</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>COVERAGE %</label>
                  <input type="number" min="0" max="100" value={form.coverage_pct} onChange={e => update('coverage_pct', e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>EXAM WEIGHTAGE</label>
                  <input type="number" min="0" max="100" value={form.exam_weightage} onChange={e => update('exam_weightage', e.target.value)} style={inputStyle} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>EXAM DATE</label>
                  <input type="date" value={form.exam_date} onChange={e => update('exam_date', e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>FACULTY (OPTIONAL)</label>
                  <input type="text" value={form.faculty_name} onChange={e => update('faculty_name', e.target.value)} placeholder="Prof. name" style={inputStyle} />
                </div>
              </div>

              {error && (
                <div style={{ fontSize: '11px', color: '#D94F00', borderLeft: '2px solid #D94F00', paddingLeft: '10px' }}>
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                style={{
                  background: saving ? '#8A6A4A' : '#1C1208', color: '#F2EDE6',
                  border: 'none', padding: '11px', fontSize: '10px', fontWeight: 700,
                  letterSpacing: '2px', cursor: saving ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {saving ? 'SAVING...' : editingId ? 'UPDATE SUBJECT →' : 'SAVE SUBJECT →'}
              </button>

            </div>
          </div>
        )}

        {/* Subject list */}
        {loading ? (
          <div style={{ fontSize: '11px', color: '#8A6A4A', letterSpacing: '1px', padding: '20px 0' }}>
            LOADING...
          </div>
        ) : subjects.length === 0 && !showForm ? (
          <div style={{
            border: '1.5px solid #1C1208', background: '#FDFAF5',
            padding: '40px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#1C1208', letterSpacing: '0.5px', marginBottom: '6px' }}>
              No subjects yet
            </div>
            <div style={{ fontSize: '11px', color: '#8A6A4A' }}>
              Add your semester subjects to unlock the AI planner.
            </div>
          </div>
        ) : (
          <div style={{ border: '1.5px solid #1C1208' }}>

            {/* Table header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '90px 1fr 80px 100px 110px 120px 90px',
              background: '#1C1208', padding: '10px 14px',
            }}>
              {['CODE', 'SUBJECT', 'CREDITS', 'DIFFICULTY', 'COVERAGE', 'EXAM', ''].map(h => (
                <div key={h} style={{ fontSize: '8px', fontWeight: 700, letterSpacing: '1.5px', color: '#8A6A4A' }}>
                  {h}
                </div>
              ))}
            </div>

            {/* Rows */}
            {subjects.map((s, i) => {
              const days = daysToExam(s.exam_date)
              return (
                <div key={s.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '90px 1fr 80px 100px 110px 120px 90px',
                  padding: '12px 14px',
                  background: '#FDFAF5',
                  borderBottom: i < subjects.length - 1 ? '1px solid #E0D0B8' : 'none',
                  alignItems: 'center',
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#1C1208', letterSpacing: '0.5px' }}>
                    {s.code}
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#1C1208', fontWeight: 500 }}>{s.name}</div>
                    {s.faculty_name && (
                      <div style={{ fontSize: '9px', color: '#8A6A4A', marginTop: '1px' }}>{s.faculty_name}</div>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6A4A2A' }}>{s.credits}</div>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <div key={n} style={{
                        width: '8px', height: '8px',
                        background: n <= s.difficulty ? '#D94F00' : '#E0D0B8',
                      }} />
                    ))}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ flex: 1, height: '4px', background: '#E0D0B8', maxWidth: '60px' }}>
                        <div style={{
                          height: '4px', width: `${s.coverage_pct}%`,
                          background: s.coverage_pct >= 75 ? '#3D7A50' : s.coverage_pct >= 40 ? '#E8C87A' : '#D94F00',
                        }} />
                      </div>
                      <span style={{ fontSize: '10px', color: '#6A4A2A', fontWeight: 700 }}>{s.coverage_pct}%</span>
                    </div>
                  </div>
                  <div>
                    {s.exam_date ? (
                      <div>
                        <div style={{ fontSize: '10px', color: '#1C1208', fontWeight: 500 }}>
                          {new Date(s.exam_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </div>
                        {days !== null && (
                          <div style={{
                            fontSize: '8px', fontWeight: 700, letterSpacing: '0.5px',
                            color: days <= 7 ? '#D94F00' : days <= 21 ? '#8A6A4A' : '#3D7A50',
                          }}>
                            {days < 0 ? 'DONE' : days === 0 ? 'TODAY' : `IN ${days}D`}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span style={{ fontSize: '10px', color: '#C8A878' }}>—</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <span
                      onClick={() => openEditForm(s)}
                      style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '1px', color: '#6A4A2A', cursor: 'pointer' }}
                    >
                      EDIT
                    </span>
                    <span
                      onClick={() => handleDelete(s.id)}
                      style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '1px', color: '#D94F00', cursor: 'pointer' }}
                    >
                      DEL
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </main>
    </>
  )
}
