'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

type Slot = {
  id: string
  subject_id: string | null
  day_of_week: number
  start_time: string
  end_time: string
  slot_type: 'class' | 'lab' | 'free' | 'break'
  room: string | null
}

type Subject = { id: string; code: string; name: string }

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

const SLOT_STYLE: Record<string, { bg: string; border: string; fg: string; sub: string }> = {
  class: { bg: '#FDFAF5', border: '#E0D0B8', fg: '#1C1208', sub: '#8A6A4A' },
  lab:   { bg: '#E8DDD0', border: '#C8A878', fg: '#1C1208', sub: '#6A4A2A' },
  free:  { bg: '#1C1208', border: '#1C1208', fg: '#D94F00', sub: '#6A4A2A' },
  break: { bg: '#F2EDE6', border: '#E0D0B8', fg: '#8A6A4A', sub: '#C8A878' },
}

export default function TimetablePage() {
  const [slots, setSlots] = useState<Slot[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    day_of_week: '0',
    start_time: '09:00',
    end_time: '10:00',
    slot_type: 'class',
    subject_id: '',
    room: '',
  })

  const supabase = createClient()

  const fetchAll = useCallback(async () => {
    const [slotsRes, subjectsRes] = await Promise.all([
      supabase.from('timetable').select('*').order('start_time'),
      supabase.from('subjects').select('id, code, name').order('code'),
    ])
    if (slotsRes.data) setSlots(slotsRes.data)
    if (subjectsRes.data) setSubjects(subjectsRes.data)
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchAll() }, [fetchAll])

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  async function handleSave() {
    if (form.start_time >= form.end_time) {
      setError('End time must be after start time')
      return
    }
    if (form.slot_type === 'class' && !form.subject_id) {
      setError('Pick a subject for class slots')
      return
    }

    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not signed in'); setSaving(false); return }

    const { error: dbError } = await supabase.from('timetable').insert({
      student_id: user.id,
      day_of_week: parseInt(form.day_of_week),
      start_time: form.start_time,
      end_time: form.end_time,
      slot_type: form.slot_type,
      subject_id: form.subject_id || null,
      room: form.room.trim() || null,
    })

    if (dbError) {
      setError(dbError.message)
      setSaving(false)
      return
    }

    setSaving(false)
    setShowForm(false)
    fetchAll()
  }

  async function handleDelete(id: string) {
    await supabase.from('timetable').delete().eq('id', id)
    fetchAll()
  }

  function subjectCode(id: string | null): string {
    if (!id) return ''
    return subjects.find(s => s.id === id)?.code ?? ''
  }

  function hhmm(t: string): string {
    return t.slice(0, 5)
  }

  function slotHours(s: Slot): number {
    const [sh, sm] = s.start_time.split(':').map(Number)
    const [eh, em] = s.end_time.split(':').map(Number)
    return (eh * 60 + em - sh * 60 - sm) / 60
  }

  // Free hours today (JS getDay: 0=Sun..6=Sat -> our 0=Mon..5=Sat)
  const jsDay = new Date().getDay()
  const todayIdx = jsDay === 0 ? -1 : jsDay - 1
  const freeToday = slots
    .filter(s => s.day_of_week === todayIdx && s.slot_type === 'free')
    .reduce((sum, s) => sum + slotHours(s), 0)

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
            TIMETABLE
          </span>
          <span style={{ fontSize: '11px', color: '#C8A878' }}>/</span>
          <span style={{ fontSize: '11px', color: '#8A6A4A' }}>
            {freeToday > 0 ? `${freeToday}h free today` : `${slots.length} slots this week`}
          </span>
        </div>
        <span style={{ fontSize: '10px', color: '#6A4A2A', background: '#E8DDD0', padding: '4px 10px', letterSpacing: '0.5px' }}>
          {today}
        </span>
      </header>

      <main style={{ flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1C1208', margin: 0 }}>Weekly schedule</h1>
            <p style={{ fontSize: '11px', color: '#8A6A4A', margin: '3px 0 0' }}>
              Mark free slots too — the AI planner uses them to suggest study sessions.
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
            {showForm ? '✕ CLOSE' : '+ ADD SLOT'}
          </button>
        </div>

        {showForm && (
          <div style={{ border: '1.5px solid #1C1208', background: '#FDFAF5', padding: '18px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px', alignItems: 'end' }}>
              <div>
                <label style={labelStyle}>DAY</label>
                <select value={form.day_of_week} onChange={e => update('day_of_week', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>START</label>
                <input type="time" value={form.start_time} onChange={e => update('start_time', e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>END</label>
                <input type="time" value={form.end_time} onChange={e => update('end_time', e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>TYPE</label>
                <select value={form.slot_type} onChange={e => update('slot_type', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="class">Class</option>
                  <option value="lab">Lab</option>
                  <option value="free">Free</option>
                  <option value="break">Break</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>SUBJECT</label>
                <select value={form.subject_id} onChange={e => update('subject_id', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">—</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.code}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>ROOM</label>
                <input type="text" value={form.room} onChange={e => update('room', e.target.value)} placeholder="LH-2" style={inputStyle} />
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
              {saving ? 'SAVING...' : 'ADD SLOT →'}
            </button>
          </div>
        )}

        {/* Weekly grid */}
        {loading ? (
          <div style={{ fontSize: '11px', color: '#8A6A4A', letterSpacing: '1px' }}>LOADING...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', border: '1.5px solid #1C1208' }}>
            {DAYS.map((day, dayIdx) => {
              const daySlots = slots
                .filter(s => s.day_of_week === dayIdx)
                .sort((a, b) => a.start_time.localeCompare(b.start_time))
              const isToday = dayIdx === todayIdx
              return (
                <div key={day} style={{
                  borderRight: dayIdx < 5 ? '1.5px solid #1C1208' : 'none',
                  minHeight: '220px',
                }}>
                  <div style={{
                    padding: '8px', textAlign: 'center',
                    fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px',
                    background: isToday ? '#D94F00' : '#1C1208',
                    color: '#F2EDE6',
                  }}>
                    {day}{isToday ? ' ●' : ''}
                  </div>
                  <div style={{ padding: '6px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {daySlots.length === 0 ? (
                      <div style={{ fontSize: '9px', color: '#C8A878', textAlign: 'center', padding: '12px 0' }}>—</div>
                    ) : daySlots.map(s => {
                      const st = SLOT_STYLE[s.slot_type]
                      return (
                        <div key={s.id} style={{
                          background: st.bg, border: `1px solid ${st.border}`,
                          padding: '6px 8px', position: 'relative',
                        }}>
                          <div style={{ fontSize: '9px', color: st.sub }}>
                            {hhmm(s.start_time)}–{hhmm(s.end_time)}
                          </div>
                          <div style={{ fontSize: '10px', fontWeight: 700, color: st.fg, letterSpacing: '0.3px' }}>
                            {s.slot_type === 'free' ? 'FREE ✦' :
                             s.slot_type === 'break' ? 'BREAK' :
                             `${subjectCode(s.subject_id)}${s.slot_type === 'lab' ? ' LAB' : ''}`}
                          </div>
                          {s.room && (
                            <div style={{ fontSize: '8px', color: st.sub }}>{s.room}</div>
                          )}
                          <span
                            onClick={() => handleDelete(s.id)}
                            style={{
                              position: 'absolute', top: '4px', right: '6px',
                              fontSize: '9px', color: st.sub, cursor: 'pointer',
                            }}
                          >
                            ✕
                          </span>
                        </div>
                      )
                    })}
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
