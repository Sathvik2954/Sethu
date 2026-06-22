'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

// ── Types ──────────────────────────────────────────────────────
type Subject = {
  id: string
  department: string
  year: number
  section: string | null
  subject_code: string | null
  subject_name: string
  credits: number | null
  subject_type: 'theory' | 'lab' | 'elective'
  is_active: boolean
  created_by: string | null
}

type Note = {
  id: string
  subject_id: string
  difficulty_level: 'easy' | 'medium' | 'hard' | null
  important_for_placements: boolean
  important_for_higher: boolean
  important_topics: string[] | null
  placement_topics: string[] | null
  personal_notes: string | null
}

type UserInfo = {
  id: string
  role: string
  department: string
  year: number | null
  section: string | null
}

const inp: React.CSSProperties = {
  width: '100%', border: '1.5px solid #C8A878', background: '#F2EDE6',
  padding: '9px 12px', fontSize: '13px', color: '#1C1208',
  outline: 'none', borderRadius: 0, fontFamily: 'inherit', display: 'block',
}
const lbl: React.CSSProperties = {
  fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px',
  color: '#6A4A2A', marginBottom: '5px', display: 'block',
}

const DIFF_COLOR = { easy: '#3D7A50', medium: '#E8C87A', hard: '#D94F00' }
const DIFF_FG   = { easy: '#F2EDE6', medium: '#1C1208', hard: '#F2EDE6' }
const TYPE_LABEL = { theory: 'THEORY', lab: 'LAB', elective: 'ELECTIVE' }
const DEPARTMENTS = ['CSE','AIML','CET','AIDS','IT','ECE','EEE','MECH','CIVIL','BIO TECH']

function TagInput({
  tags, onAdd, onRemove, placeholder,
}: { tags: string[]; onAdd: (t: string) => void; onRemove: (t: string) => void; placeholder: string }) {
  const [val, setVal] = useState('')
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '7px' }}>
        {tags.map(t => (
          <span key={t} style={{ background: '#1C1208', color: '#F2EDE6', fontSize: '10px', fontWeight: 700, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            {t}
            <button type="button" onClick={() => onRemove(t)} style={{ background: 'transparent', border: 'none', color: '#C8A878', cursor: 'pointer', fontSize: '11px', padding: 0, lineHeight: 1, fontFamily: 'inherit' }}>×</button>
          </span>
        ))}
        {tags.length === 0 && <span style={{ fontSize: '10px', color: '#8A6A4A', fontStyle: 'italic' }}>None added</span>}
      </div>
      <div style={{ display: 'flex', gap: '6px' }}>
        <input type="text" value={val} onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && val.trim()) { onAdd(val.trim()); setVal('') } }}
          placeholder={placeholder} style={{ ...inp, flex: 1 }} />
        <button type="button" onClick={() => { if (val.trim()) { onAdd(val.trim()); setVal('') } }}
          style={{ background: '#1C1208', color: '#F2EDE6', border: 'none', padding: '0 14px', fontSize: '10px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
          ADD
        </button>
      </div>
    </div>
  )
}

function SubjectCard({
  s, note, isStaff, onDelete, onSaveNote,
}: {
  s: Subject
  note: Note | null
  isStaff: boolean
  onDelete: (id: string) => void
  onSaveNote: (subjectId: string, note: Partial<Note>) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Partial<Note>>(note ?? {})
  const [saving, setSaving] = useState(false)

  useEffect(() => { setDraft(note ?? {}) }, [note])

  async function save() {
    setSaving(true)
    await onSaveNote(s.id, draft)
    setSaving(false)
    setEditing(false)
  }

  const diff = note?.difficulty_level
  const importantTopics = draft.important_topics ?? note?.important_topics ?? []
  const placementTopics = draft.placement_topics ?? note?.placement_topics ?? []

  return (
    <div style={{ border: '1.5px solid #1C1208', background: '#FDFAF5', marginBottom: '8px' }}>
      <div onClick={() => setOpen(o => !o)} style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '13px 16px', cursor: 'pointer', flexWrap: 'wrap',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {s.subject_code && (
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#D94F00', letterSpacing: '0.5px' }}>{s.subject_code}</span>
            )}
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#1C1208' }}>{s.subject_name}</span>
            <span style={{ fontSize: '7px', fontWeight: 700, letterSpacing: '1px', padding: '2px 6px', background: '#1C1208', color: '#C8A878' }}>
              {TYPE_LABEL[s.subject_type]}
            </span>
            {/* ── CREDITS FORMAT FIX: was {s.credits}cr, now Credits — {s.credits} ── */}
            {s.credits && <span style={{ fontSize: '9px', color: '#8A6A4A' }}>Credits — {s.credits}</span>}
          </div>
          <div style={{ fontSize: '10px', color: '#8A6A4A', marginTop: '3px' }}>
            {s.department} · Y{s.year}{s.section ? ` · Sec ${s.section}` : ''}
            {diff && <span style={{ marginLeft: '8px', padding: '1px 6px', background: DIFF_COLOR[diff], color: DIFF_FG[diff], fontSize: '8px', fontWeight: 700 }}>{diff.toUpperCase()}</span>}
            {note?.important_for_placements && <span style={{ marginLeft: '6px', fontSize: '9px', color: '#D94F00' }}>📎 Placements</span>}
            {note?.important_for_higher && <span style={{ marginLeft: '6px', fontSize: '9px', color: '#3D7A50' }}>🎓 Higher studies</span>}
          </div>
        </div>
        <span style={{ fontSize: '11px', color: '#8A6A4A' }}>{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div style={{ borderTop: '1px solid #E0D0B8', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {isStaff && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => onDelete(s.id)} style={{
                background: 'transparent', border: '1px solid #D94F00', color: '#D94F00',
                padding: '5px 12px', fontSize: '8px', fontWeight: 700, letterSpacing: '1px',
                cursor: 'pointer', fontFamily: 'inherit',
              }}>DEACTIVATE</button>
            </div>
          )}

          {!isStaff && (
            <>
              {!editing ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '2px', color: '#8A6A4A' }}>MY NOTES</span>
                    <button type="button" onClick={() => setEditing(true)} style={{
                      background: '#1C1208', color: '#F2EDE6', border: 'none',
                      padding: '5px 12px', fontSize: '8px', fontWeight: 700,
                      letterSpacing: '1px', cursor: 'pointer', fontFamily: 'inherit',
                    }}>EDIT NOTES</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: '10px', fontSize: '11px', color: '#1C1208' }}>
                    <div><span style={{ color: '#8A6A4A', fontSize: '9px', fontWeight: 700, display: 'block', marginBottom: '3px' }}>DIFFICULTY</span>{note?.difficulty_level ?? '—'}</div>
                    <div><span style={{ color: '#8A6A4A', fontSize: '9px', fontWeight: 700, display: 'block', marginBottom: '3px' }}>FOR PLACEMENTS</span>{note?.important_for_placements ? 'Yes' : 'No'}</div>
                    <div><span style={{ color: '#8A6A4A', fontSize: '9px', fontWeight: 700, display: 'block', marginBottom: '3px' }}>FOR HIGHER STUDIES</span>{note?.important_for_higher ? 'Yes' : 'No'}</div>
                  </div>
                  {note?.important_topics && note.important_topics.length > 0 && (
                    <div style={{ marginTop: '10px' }}>
                      <span style={{ color: '#8A6A4A', fontSize: '9px', fontWeight: 700 }}>IMPORTANT TOPICS</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '5px' }}>
                        {note.important_topics.map(t => <span key={t} style={{ background: '#1C1208', color: '#F2EDE6', fontSize: '10px', fontWeight: 700, padding: '2px 8px' }}>{t}</span>)}
                      </div>
                    </div>
                  )}
                  {note?.placement_topics && note.placement_topics.length > 0 && (
                    <div style={{ marginTop: '10px' }}>
                      <span style={{ color: '#8A6A4A', fontSize: '9px', fontWeight: 700 }}>PLACEMENT TOPICS</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '5px' }}>
                        {note.placement_topics.map(t => <span key={t} style={{ background: '#D94F00', color: '#F2EDE6', fontSize: '10px', fontWeight: 700, padding: '2px 8px' }}>{t}</span>)}
                      </div>
                    </div>
                  )}
                  {note?.personal_notes && (
                    <div style={{ marginTop: '10px', fontSize: '12px', color: '#1C1208', lineHeight: 1.6, borderLeft: '2px solid #C8A878', paddingLeft: '10px' }}>
                      {note.personal_notes}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '2px', color: '#8A6A4A' }}>EDIT MY NOTES</div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px,1fr))', gap: '10px' }}>
                    <div>
                      <label style={lbl}>DIFFICULTY</label>
                      <select value={draft.difficulty_level ?? ''} onChange={e => setDraft(p => ({ ...p, difficulty_level: e.target.value as Note['difficulty_level'] }))} style={{ ...inp, cursor: 'pointer' }}>
                        <option value="">Select</option>
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                    <div>
                      <label style={lbl}>IMPORTANT FOR PLACEMENTS</label>
                      <select value={draft.important_for_placements ? 'yes' : 'no'} onChange={e => setDraft(p => ({ ...p, important_for_placements: e.target.value === 'yes' }))} style={{ ...inp, cursor: 'pointer' }}>
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </div>
                    <div>
                      <label style={lbl}>IMPORTANT FOR HIGHER STUDIES</label>
                      <select value={draft.important_for_higher ? 'yes' : 'no'} onChange={e => setDraft(p => ({ ...p, important_for_higher: e.target.value === 'yes' }))} style={{ ...inp, cursor: 'pointer' }}>
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={lbl}>IMPORTANT TOPICS (said by teacher)</label>
                    <TagInput
                      tags={importantTopics}
                      onAdd={t => setDraft(p => ({ ...p, important_topics: [...(p.important_topics ?? []), t] }))}
                      onRemove={t => setDraft(p => ({ ...p, important_topics: (p.important_topics ?? []).filter(x => x !== t) }))}
                      placeholder="e.g. Normalization, SQL joins"
                    />
                  </div>

                  <div>
                    <label style={lbl}>TOPICS IMPORTANT FOR PLACEMENTS</label>
                    <TagInput
                      tags={placementTopics}
                      onAdd={t => setDraft(p => ({ ...p, placement_topics: [...(p.placement_topics ?? []), t] }))}
                      onRemove={t => setDraft(p => ({ ...p, placement_topics: (p.placement_topics ?? []).filter(x => x !== t) }))}
                      placeholder="e.g. Dynamic programming, Trees"
                    />
                  </div>

                  <div>
                    <label style={lbl}>PERSONAL NOTES</label>
                    <textarea value={draft.personal_notes ?? ''} onChange={e => setDraft(p => ({ ...p, personal_notes: e.target.value }))} rows={3} placeholder="Your own notes about this subject..." style={{ ...inp, resize: 'vertical' }} />
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="button" onClick={() => setEditing(false)} style={{
                      flex: 1, background: 'transparent', color: '#1C1208', border: '1.5px solid #1C1208',
                      padding: '10px', fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px',
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}>CANCEL</button>
                    <button type="button" onClick={save} disabled={saving} style={{
                      flex: 2, background: saving ? '#8A6A4A' : '#1C1208', color: '#F2EDE6', border: 'none',
                      padding: '10px', fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px',
                      cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                    }}>{saving ? 'SAVING...' : 'SAVE NOTES →'}</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default function SubjectsPage() {
  const supabase = createClient()
  const [me, setMe] = useState<UserInfo | null>(null)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [notes, setNotes] = useState<Record<string, Note>>({})
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    subject_code: '', subject_name: '', credits: '', subject_type: 'theory',
    target_dept: '', target_year: '', target_section: '',
  })

  const load = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('users').select('id, role, department, year, section').eq('id', user.id).single()
    setMe(profile as UserInfo)

    const isStaff = ['faculty', 'hod', 'admin'].includes(profile?.role ?? '')

    let query = supabase.from('subjects').select('*').eq('is_active', true)
    if (!isStaff) {
      if (profile?.department) query = query.eq('department', profile.department)
      if (profile?.year) query = query.eq('year', profile.year)
    }
    const { data: subs } = await query.order('subject_code')
    setSubjects((subs as Subject[]) ?? [])

    if (!isStaff && subs && subs.length > 0) {
      const subjectIds = subs.map((s: Subject) => s.id)
      const { data: noteData } = await supabase
        .from('student_subject_notes')
        .select('*')
        .eq('student_id', user.id)
        .in('subject_id', subjectIds)
      const noteMap = Object.fromEntries((noteData ?? []).map((n: Note) => [n.subject_id, n]))
      setNotes(noteMap)
    }

    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  const isStaff = me && ['faculty', 'hod', 'admin'].includes(me.role)

  async function handleAdd() {
    if (!form.subject_name.trim()) { setError('Subject name is required'); return }
    if (!form.target_year) { setError('Year is required'); return }
    const dept = form.target_dept || me?.department || ''
    if (!dept) { setError('Department is required'); return }
    setSaving(true); setError('')

    const { data: { user } } = await supabase.auth.getUser()
    const { error: e } = await supabase.from('subjects').insert({
      department: dept,
      year: parseInt(form.target_year),
      section: form.target_section || null,
      subject_code: form.subject_code.trim() || null,
      subject_name: form.subject_name.trim(),
      credits: form.credits ? parseInt(form.credits) : null,
      subject_type: form.subject_type,
      created_by: user!.id,
    })

    if (e) { setError(e.message); setSaving(false); return }
    setSuccess('Subject added.')
    setForm({ subject_code: '', subject_name: '', credits: '', subject_type: 'theory', target_dept: '', target_year: '', target_section: '' })
    setShowForm(false)
    setSaving(false)
    load()
  }

  async function handleDelete(id: string) {
    await supabase.from('subjects').update({ is_active: false }).eq('id', id)
    setSubjects(prev => prev.filter(s => s.id !== id))
  }

  async function handleSaveNote(subjectId: string, note: Partial<Note>) {
    const { data: { user } } = await supabase.auth.getUser()
    const payload = {
      student_id: user!.id, subject_id: subjectId,
      difficulty_level: note.difficulty_level ?? null,
      important_for_placements: note.important_for_placements ?? false,
      important_for_higher: note.important_for_higher ?? false,
      important_topics: note.important_topics ?? null,
      placement_topics: note.placement_topics ?? null,
      personal_notes: note.personal_notes ?? null,
    }
    await supabase.from('student_subject_notes').upsert(payload, { onConflict: 'student_id,subject_id' })
    setNotes(prev => ({ ...prev, [subjectId]: { ...prev[subjectId], ...payload, id: prev[subjectId]?.id ?? '', subject_id: subjectId } }))
  }

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()

  return (
    <>
      <header style={{
        minHeight: '48px', borderBottom: '2px solid #1C1208',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(12px,4vw,24px)', background: '#F2EDE6',
        flexShrink: 0, flexWrap: 'wrap', gap: '4px',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#1C1208' }}>SUBJECTS</span>
          <span style={{ fontSize: '11px', color: '#C8A878' }}>/</span>
          <span style={{ fontSize: '11px', color: '#8A6A4A' }}>{subjects.length} subjects</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', color: '#6A4A2A', background: '#E8DDD0', padding: '4px 10px' }}>{today}</span>
          {isStaff && (
            <button type="button" onClick={() => { setShowForm(s => !s); setError('') }} style={{
              background: '#1C1208', color: '#F2EDE6', border: 'none',
              padding: '8px 16px', fontSize: '9px', fontWeight: 700,
              letterSpacing: '1.5px', cursor: 'pointer', fontFamily: 'inherit',
            }}>
              {showForm ? '✕ CANCEL' : '+ ADD SUBJECT'}
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

        {isStaff && showForm && (
          <div style={{ border: '1.5px solid #1C1208', background: '#FDFAF5' }}>
            <div style={{ padding: '10px 18px', borderBottom: '1.5px solid #1C1208', fontSize: '9px', fontWeight: 700, letterSpacing: '2px', color: '#8A6A4A' }}>
              ADD SUBJECT
            </div>
            <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px,1fr))', gap: '10px' }}>
                {me?.role === 'admin' && (
                  <div>
                    <label style={lbl}>DEPARTMENT</label>
                    <select value={form.target_dept} onChange={e => setForm(p => ({ ...p, target_dept: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>
                      <option value="">Select dept</option>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label style={lbl}>YEAR</label>
                  <select value={form.target_year} onChange={e => setForm(p => ({ ...p, target_year: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>
                    <option value="">Select year</option>
                    {['1','2','3','4'].map(y => <option key={y} value={y}>{y}{['st','nd','rd','th'][+y-1]} Year</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>SECTION (OPTIONAL)</label>
                  <input type="text" value={form.target_section} onChange={e => setForm(p => ({ ...p, target_section: e.target.value.toUpperCase() }))} placeholder="A, B... or blank for all" style={inp} />
                </div>
                <div>
                  <label style={lbl}>SUBJECT CODE</label>
                  <input type="text" value={form.subject_code} onChange={e => setForm(p => ({ ...p, subject_code: e.target.value }))} placeholder="CS401" style={inp} />
                </div>
                <div>
                  <label style={lbl}>SUBJECT NAME</label>
                  <input type="text" value={form.subject_name} onChange={e => setForm(p => ({ ...p, subject_name: e.target.value }))} placeholder="Database Management Systems" style={inp} />
                </div>
                <div>
                  <label style={lbl}>CREDITS</label>
                  <input type="number" value={form.credits} onChange={e => setForm(p => ({ ...p, credits: e.target.value }))} placeholder="3" style={inp} />
                </div>
                <div>
                  <label style={lbl}>TYPE</label>
                  <select value={form.subject_type} onChange={e => setForm(p => ({ ...p, subject_type: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>
                    <option value="theory">Theory</option>
                    <option value="lab">Lab</option>
                    <option value="elective">Elective</option>
                  </select>
                </div>
              </div>
              <button type="button" onClick={handleAdd} disabled={saving} style={{
                background: saving ? '#8A6A4A' : '#D94F00', color: '#F2EDE6', border: 'none',
                padding: '12px', fontSize: '10px', fontWeight: 700, letterSpacing: '2px',
                cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              }}>
                {saving ? 'ADDING...' : 'ADD SUBJECT →'}
              </button>
            </div>
          </div>
        )}

        {!isStaff && (
          <div style={{ fontSize: '11px', color: '#6A4A2A', background: '#F2EDE6', padding: '10px 14px', border: '1px solid #E0D0B8' }}>
            These subjects are defined by your faculty. Click any subject to add your personal notes — difficulty, important topics, and placement-relevant topics. These feed into the AI Planner.
          </div>
        )}

        {loading ? (
          <div style={{ fontSize: '11px', color: '#8A6A4A' }}>LOADING...</div>
        ) : subjects.length === 0 ? (
          <div style={{ border: '1.5px solid #1C1208', background: '#FDFAF5', padding: '40px', textAlign: 'center' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#1C1208', marginBottom: '6px' }}>
              {isStaff ? 'No subjects added yet' : 'No subjects set by your faculty yet'}
            </div>
            <div style={{ fontSize: '11px', color: '#8A6A4A' }}>
              {isStaff ? 'Click + ADD SUBJECT to define subjects for your department.' : 'Check back once your faculty has added subjects.'}
            </div>
          </div>
        ) : (
          <div>
            {subjects.map(s => (
              <SubjectCard
                key={s.id}
                s={s}
                note={notes[s.id] ?? null}
                isStaff={!!isStaff}
                onDelete={handleDelete}
                onSaveNote={handleSaveNote}
              />
            ))}
          </div>
        )}
      </main>
    </>
  )
}