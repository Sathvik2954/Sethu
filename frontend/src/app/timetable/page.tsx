'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

// ── Types ──────────────────────────────────────────────────────
type Slot = {
  id: string
  timetable_type: 'class' | 'exam'
  department: string
  year: number
  section: string
  day: string | null
  slot_label: string | null
  subject_code: string | null
  subject_name: string | null
  faculty_name: string | null
  room: string | null
  exam_date: string | null
  exam_start_time: string | null
  exam_end_time: string | null
  exam_subject: string | null
  exam_room: string | null
  is_active: boolean
}

type UserInfo = {
  id: string
  role: string
  department: string
  year: number | null
  section: string | null
}

type ParsedSlot = {
  day_of_week: number
  start_time: string
  end_time: string
  subject_code: string | null
  subject_name: string | null
  slot_type: 'class' | 'lab' | 'free' | 'break'
  room: string | null
  include: boolean
}

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const DEPARTMENTS = ['CSE','AIML','CET','AIDS','IT','ECE','EEE','MECH','CIVIL','BIO TECH']

const inp: React.CSSProperties = {
  width: '100%', border: '1.5px solid #C8A878', background: '#F2EDE6',
  padding: '9px 12px', fontSize: '13px', color: '#1C1208',
  outline: 'none', borderRadius: 0, fontFamily: 'inherit', display: 'block',
}
const lbl: React.CSSProperties = {
  fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px',
  color: '#6A4A2A', marginBottom: '5px', display: 'block',
}

function emptyClass() {
  return { day: 'MON', slot_label: '', subject_code: '', subject_name: '', faculty_name: '', room: '' }
}
function emptyExam() {
  return { exam_date: '', exam_start_time: '', exam_end_time: '', exam_subject: '', exam_room: '' }
}

// ── Student view: weekly class grid ───────────────────────────
function ClassGrid({ slots }: { slots: Slot[] }) {
  const classSlots = slots.filter(s => s.timetable_type === 'class' && s.is_active)

  // Collect all unique slot_labels (time periods) in order
  const allLabels = Array.from(new Set(classSlots.map(s => s.slot_label ?? ''))).filter(Boolean).sort()

  if (classSlots.length === 0) {
    return (
      <div style={{ border: '1.5px solid #1C1208', background: '#FDFAF5', padding: '32px', textAlign: 'center' }}>
        <div style={{ fontSize: '12px', color: '#8A6A4A' }}>No class timetable set yet. Your faculty will update this soon.</div>
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
        <thead>
          <tr>
            <th style={{ padding: '10px 14px', background: '#1C1208', color: '#F2EDE6', fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px', textAlign: 'left', border: '1px solid #2E1E10' }}>
              DAY
            </th>
            {allLabels.map(label => (
              <th key={label} style={{ padding: '10px 12px', background: '#1C1208', color: '#C8A878', fontSize: '9px', fontWeight: 700, letterSpacing: '1px', textAlign: 'center', border: '1px solid #2E1E10', whiteSpace: 'nowrap' }}>
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DAYS.map((day, di) => (
            <tr key={day} style={{ background: di % 2 === 0 ? '#FDFAF5' : '#F2EDE6' }}>
              <td style={{ padding: '10px 14px', fontSize: '10px', fontWeight: 700, color: '#1C1208', letterSpacing: '1px', border: '1px solid #E0D0B8' }}>
                {day}
              </td>
              {allLabels.map(label => {
                const slot = classSlots.find(s => s.day === day && s.slot_label === label)
                return (
                  <td key={label} style={{ padding: '8px 12px', border: '1px solid #E0D0B8', textAlign: 'center', minWidth: '100px' }}>
                    {slot ? (
                      <>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#1C1208' }}>{slot.subject_code || slot.subject_name}</div>
                        {slot.subject_code && slot.subject_name && (
                          <div style={{ fontSize: '9px', color: '#8A6A4A', marginTop: '2px' }}>{slot.subject_name}</div>
                        )}
                        {slot.room && <div style={{ fontSize: '9px', color: '#C8A878', marginTop: '2px' }}>{slot.room}</div>}
                      </>
                    ) : (
                      <span style={{ fontSize: '10px', color: '#D4C8B8' }}>—</span>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Student view: exam list ────────────────────────────────────
function ExamList({ slots }: { slots: Slot[] }) {
  const examSlots = slots
    .filter(s => s.timetable_type === 'exam' && s.is_active && s.exam_date)
    .sort((a, b) => (a.exam_date ?? '').localeCompare(b.exam_date ?? ''))

  if (examSlots.length === 0) {
    return (
      <div style={{ border: '1.5px solid #1C1208', background: '#FDFAF5', padding: '32px', textAlign: 'center' }}>
        <div style={{ fontSize: '12px', color: '#8A6A4A' }}>No exam timetable set yet. Your faculty will update this soon.</div>
      </div>
    )
  }

  const today = new Date().toISOString().slice(0, 10)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {examSlots.map(s => {
        const isPast = (s.exam_date ?? '') < today
        const isToday = s.exam_date === today
        return (
          <div key={s.id} style={{
            display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap',
            padding: '14px 18px', border: `1.5px solid ${isToday ? '#D94F00' : '#1C1208'}`,
            background: isToday ? '#FFF8F2' : isPast ? '#F5F0EA' : '#FDFAF5',
            opacity: isPast ? 0.6 : 1,
          }}>
            {/* Date block */}
            <div style={{ textAlign: 'center', minWidth: '52px', flexShrink: 0 }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: isToday ? '#D94F00' : '#1C1208', lineHeight: 1 }}>
                {new Date(s.exam_date + 'T00:00:00').getDate().toString().padStart(2,'0')}
              </div>
              <div style={{ fontSize: '9px', color: '#8A6A4A', letterSpacing: '1px', marginTop: '2px' }}>
                {new Date(s.exam_date + 'T00:00:00').toLocaleDateString('en-IN', { month: 'short' }).toUpperCase()}
              </div>
            </div>
            {/* Divider */}
            <div style={{ width: '2px', height: '40px', background: isToday ? '#D94F00' : '#E0D0B8', flexShrink: 0 }} />
            {/* Details */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#1C1208' }}>{s.exam_subject}</div>
              <div style={{ fontSize: '10px', color: '#8A6A4A', marginTop: '3px' }}>
                {s.exam_start_time && s.exam_end_time ? `${s.exam_start_time} – ${s.exam_end_time}` : ''}
                {s.exam_room ? ` · ${s.exam_room}` : ''}
              </div>
            </div>
            {isToday && (
              <span style={{ fontSize: '8px', fontWeight: 700, background: '#D94F00', color: '#F2EDE6', padding: '3px 8px', letterSpacing: '1px', flexShrink: 0 }}>TODAY</span>
            )}
            {isPast && !isToday && (
              <span style={{ fontSize: '8px', color: '#8A6A4A', letterSpacing: '1px', flexShrink: 0 }}>DONE</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────
export default function TimetablePage() {
  const supabase = createClient()
  const [me, setMe] = useState<UserInfo | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'class' | 'exam'>('class')

  // Faculty: target selector
  const [targetYear, setTargetYear] = useState('')
  const [targetSection, setTargetSection] = useState('')
  const [targetDept, setTargetDept] = useState('')

  // Forms
  const [showClassForm, setShowClassForm] = useState(false)
  const [showExamForm, setShowExamForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [classForm, setClassForm] = useState(emptyClass())
  const [examForm, setExamForm] = useState(emptyExam())
  const [importFile, setImportFile] = useState<File | null>(null)
  const [parsedSlots, setParsedSlots] = useState<ParsedSlot[]>([])
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState('')
  const [savingImport, setSavingImport] = useState(false)
  const importFileRef = useRef<HTMLInputElement | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('users')
      .select('id, role, department, year, section')
      .eq('id', user.id)
      .single()

    setMe(profile as UserInfo)

    const isStaff = ['faculty', 'hod', 'admin'].includes(profile?.role ?? '')

    // For faculty: set default target
    if (isStaff && profile?.department && !targetDept) {
      setTargetDept(profile.department ?? '')
    }

    // Build query
    let query = supabase.from('timetable_slots').select('*').eq('is_active', true)

    if (isStaff) {
      const dept = targetDept || profile?.department || ''
      if (dept) query = query.eq('department', dept)
      if (targetYear) query = query.eq('year', parseInt(targetYear))
      if (targetSection) query = query.eq('section', targetSection)
    } else {
      // Student: load own timetable
      if (profile?.department) query = query.eq('department', profile.department)
      if (profile?.year) query = query.eq('year', profile.year)
      if (profile?.section) query = query.eq('section', profile.section)
    }

    const { data } = await query
    setSlots((data as Slot[]) ?? [])
    setLoading(false)
  }, [supabase, targetDept, targetYear, targetSection])

  useEffect(() => { load() }, [load])

  const isStaff = me && ['faculty', 'hod', 'admin'].includes(me.role)

  async function handleParse() {
    if (!importFile) { setImportError('Choose a PDF file first'); return }
    if (!targetYear) { setImportError('Set the year before parsing'); return }
    if (!targetSection.trim()) { setImportError('Set the section before parsing'); return }
    setImporting(true); setImportError(''); setParsedSlots([])
    const formData = new FormData()
    formData.append('file', importFile)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_AI_SERVICE_URL}/parse-timetable`, {
        method: 'POST', body: formData,
      })
      const data = await res.json()
      if (!res.ok) { setImportError(data.detail ?? 'Could not parse PDF'); setImporting(false); return }
      const result: ParsedSlot[] = (data.slots ?? []).map((s: Omit<ParsedSlot, 'include'>) => ({ ...s, slot_type: s.slot_type ?? 'class', include: true }))
      setParsedSlots(result)
    } catch { setImportError('Could not reach AI service. Is it running?') }
    setImporting(false)
  }

  function updateParsed(i: number, field: keyof ParsedSlot, value: string | boolean) {
    setParsedSlots(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s))
  }

  async function handleSaveImport() {
    if (!me) return
    setSavingImport(true); setImportError('')
    const dept = targetDept || me.department || ''
    const included = parsedSlots.filter(s => s.include)
    const dayMap = ['MON','TUE','WED','THU','FRI','SAT']

    for (const slot of included) {
      const { error: e } = await supabase.from('timetable_slots').insert({
        timetable_type: 'class',
        department: dept,
        year: parseInt(targetYear),
        section: targetSection,
        day: dayMap[slot.day_of_week] ?? 'MON',
        slot_label: `${slot.start_time}–${slot.end_time}`,
        subject_code: slot.subject_code || null,
        subject_name: slot.subject_name || slot.subject_code || null,
        room: slot.room || null,
        created_by: me.id,
      })
      if (e) { setImportError('Save failed: ' + e.message); setSavingImport(false); return }
    }
    setSuccess(`${included.length} slots imported.`)
    setParsedSlots([])
    setImportFile(null)
    setShowImport(false)
    setSavingImport(false)
    load()
  }

  async function saveClass() {
    if (!classForm.slot_label.trim()) { setError('Time slot is required'); return }
    if (!classForm.subject_name.trim()) { setError('Subject is required'); return }
    if (!targetYear) { setError('Year is required'); return }
    if (!targetSection.trim()) { setError('Section is required'); return }

    setSaving(true); setError(''); setSuccess('')
    const dept = targetDept || me?.department || ''

    const { error: e } = await supabase.from('timetable_slots').insert({
      timetable_type: 'class',
      department: dept,
      year: parseInt(targetYear),
      section: targetSection,
      day: classForm.day,
      slot_label: classForm.slot_label,
      subject_code: classForm.subject_code || null,
      subject_name: classForm.subject_name,
      faculty_name: classForm.faculty_name || null,
      room: classForm.room || null,
      created_by: me?.id,
    })

    if (e) setError(e.message)
    else {
      setSuccess('Class slot added.')
      setClassForm(emptyClass())
      setShowClassForm(false)
      load()
    }
    setSaving(false)
  }

  async function saveExam() {
    if (!examForm.exam_date) { setError('Exam date is required'); return }
    if (!examForm.exam_subject.trim()) { setError('Subject is required'); return }
    if (!targetYear) { setError('Year is required'); return }
    if (!targetSection.trim()) { setError('Section is required'); return }

    setSaving(true); setError(''); setSuccess('')
    const dept = targetDept || me?.department || ''

    const { error: e } = await supabase.from('timetable_slots').insert({
      timetable_type: 'exam',
      department: dept,
      year: parseInt(targetYear),
      section: targetSection,
      exam_date: examForm.exam_date,
      exam_start_time: examForm.exam_start_time || null,
      exam_end_time: examForm.exam_end_time || null,
      exam_subject: examForm.exam_subject,
      exam_room: examForm.exam_room || null,
      created_by: me?.id,
    })

    if (e) setError(e.message)
    else {
      setSuccess('Exam added.')
      setExamForm(emptyExam())
      setShowExamForm(false)
      load()
    }
    setSaving(false)
  }

  async function deleteSlot(id: string) {
    if (!confirm('Remove this slot?')) return
    await supabase.from('timetable_slots').update({ is_active: false }).eq('id', id)
    setSlots(prev => prev.filter(s => s.id !== id))
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
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#1C1208' }}>TIMETABLE</span>
          <span style={{ fontSize: '11px', color: '#C8A878' }}>/</span>
          <span style={{ fontSize: '11px', color: '#8A6A4A' }}>
            {isStaff ? `${targetDept || me?.department || ''} ${targetYear ? `Y${targetYear}` : ''} ${targetSection ? `SEC ${targetSection}` : ''}`.trim()
              : `${me?.department ?? ''} · Y${me?.year ?? ''} · SEC ${me?.section ?? ''}`}
          </span>
        </div>
        <span style={{ fontSize: '10px', color: '#6A4A2A', background: '#E8DDD0', padding: '4px 10px' }}>{today}</span>
      </header>

      <main style={{ flex: 1, overflowY: 'auto', padding: 'clamp(12px,4vw,20px) clamp(12px,4vw,24px)', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {success && <div style={{ fontSize: '11px', color: '#3D7A50', borderLeft: '2px solid #3D7A50', paddingLeft: '10px' }}>{success}</div>}
        {error && <div style={{ fontSize: '11px', color: '#D94F00', borderLeft: '2px solid #D94F00', paddingLeft: '10px' }}>{error}</div>}

        {/* Faculty: target selector */}
        {isStaff && (
          <div style={{ border: '1.5px solid #1C1208', background: '#FDFAF5', padding: '14px 18px' }}>
            <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '2px', color: '#8A6A4A', marginBottom: '10px' }}>VIEWING / EDITING FOR</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px' }}>
              {me?.role === 'admin' && (
                <div>
                  <label style={lbl}>DEPARTMENT</label>
                  <select value={targetDept} onChange={e => setTargetDept(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                    <option value="">All</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label style={lbl}>YEAR</label>
                <select value={targetYear} onChange={e => setTargetYear(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                  <option value="">All years</option>
                  {['1','2','3','4'].map(y => <option key={y} value={y}>{y}{['st','nd','rd','th'][+y-1]} Year</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>SECTION</label>
                <input type="text" value={targetSection} onChange={e => setTargetSection(e.target.value.toUpperCase())} placeholder="A, B, C..." style={inp} />
              </div>
            </div>
          </div>
        )}

        {/* Tab bar: Class / Exam */}
        <div style={{ display: 'flex', border: '1.5px solid #1C1208' }}>
          {(['class', 'exam'] as const).map((t, i) => (
            <button key={t} type="button" onClick={() => setActiveTab(t)} style={{
              flex: 1, padding: '10px', fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px',
              cursor: 'pointer', fontFamily: 'inherit', border: 'none',
              borderRight: i === 0 ? '1.5px solid #1C1208' : 'none',
              background: activeTab === t ? '#1C1208' : '#F2EDE6',
              color: activeTab === t ? '#F2EDE6' : '#8A6A4A',
            }}>
              {t === 'class' ? 'CLASS TIMETABLE' : 'EXAM TIMETABLE'}
            </button>
          ))}
        </div>

        {/* ── CLASS TIMETABLE ── */}
        {activeTab === 'class' && (
          <>
            {isStaff && (
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button type="button" onClick={() => { setShowImport(s => !s); setShowClassForm(false); setError(''); setImportError('') }} style={{
                  background: 'transparent', color: '#1C1208', border: '1.5px solid #1C1208',
                  padding: '9px 18px', fontSize: '9px', fontWeight: 700,
                  letterSpacing: '1.5px', cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  {showImport ? '✕ CLOSE' : '↑ IMPORT PDF'}
                </button>
                <button type="button" onClick={() => { setShowClassForm(s => !s); setShowImport(false); setError('') }} style={{
                  background: '#1C1208', color: '#F2EDE6', border: 'none',
                  padding: '9px 18px', fontSize: '9px', fontWeight: 700,
                  letterSpacing: '1.5px', cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  {showClassForm ? '✕ CANCEL' : '+ ADD CLASS SLOT'}
                </button>
              </div>
            )}

            {/* PDF import panel */}
            {isStaff && showImport && (
              <div style={{ border: '1.5px solid #1C1208', background: '#FDFAF5' }}>
                <div style={{ padding: '10px 18px', borderBottom: '1.5px solid #1C1208', fontSize: '9px', fontWeight: 700, letterSpacing: '2px', color: '#8A6A4A' }}>
                  IMPORT CLASS TIMETABLE FROM PDF
                </div>
                <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ fontSize: '11px', color: '#6A4A2A', lineHeight: 1.6 }}>
                    Upload a class timetable PDF. The AI service will parse it and extract all slots for you to review before saving.
                    Make sure Year and Section are set above before parsing.
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div
                      onClick={() => importFileRef.current?.click()}
                      style={{
                        flex: 1, minWidth: '200px', border: '1.5px dashed #C8A878',
                        padding: '12px 16px', cursor: 'pointer', background: '#F2EDE6',
                        fontSize: '11px', color: importFile ? '#3D7A50' : '#8A6A4A', fontWeight: importFile ? 700 : 400,
                      }}
                    >
                      {importFile ? `✓ ${importFile.name}` : 'Click to choose PDF file'}
                    </div>
                    <input ref={importFileRef} type="file" accept="application/pdf" style={{ display: 'none' }}
                      onChange={e => { setImportFile(e.target.files?.[0] ?? null); setImportError(''); setParsedSlots([]) }} />
                    <button type="button" onClick={handleParse} disabled={importing} style={{
                      background: importing ? '#8A6A4A' : '#D94F00', color: '#F2EDE6', border: 'none',
                      padding: '12px 22px', fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px',
                      cursor: importing ? 'not-allowed' : 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                    }}>
                      {importing ? 'PARSING...' : 'PARSE WITH AI →'}
                    </button>
                  </div>

                  {importError && <div style={{ fontSize: '11px', color: '#D94F00', borderLeft: '2px solid #D94F00', paddingLeft: '10px' }}>{importError}</div>}

                  {parsedSlots.length > 0 && (
                    <div>
                      <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px', color: '#8A6A4A', marginBottom: '10px' }}>
                        REVIEW {parsedSlots.length} PARSED SLOTS — EDIT IF NEEDED, UNCHECK TO SKIP
                      </div>
                      <div style={{ border: '1.5px solid #1C1208', maxHeight: '320px', overflowY: 'auto', overflowX: 'auto' }}>
                        {parsedSlots.map((s, i) => (
                          <div key={i} style={{
                            display: 'grid', gridTemplateColumns: '24px 60px 75px 75px 80px 1fr 70px',
                            gap: '6px', alignItems: 'center', padding: '7px 10px',
                            background: i % 2 === 0 ? '#FDFAF5' : '#F2EDE6',
                            borderBottom: i < parsedSlots.length - 1 ? '1px solid #E0D0B8' : 'none',
                            minWidth: '540px',
                          }}>
                            <input type="checkbox" checked={s.include} onChange={e => updateParsed(i, 'include', e.target.checked)} style={{ accentColor: '#D94F00' }} />
                            <select value={s.day_of_week} onChange={e => updateParsed(i, 'day_of_week', e.target.value)} style={{ ...inp, padding: '4px 5px', fontSize: '10px' }}>
                              {DAYS.map((d, idx) => <option key={d} value={idx}>{d}</option>)}
                            </select>
                            <input type="time" value={s.start_time} onChange={e => updateParsed(i, 'start_time', e.target.value)} style={{ ...inp, padding: '4px 5px', fontSize: '10px' }} />
                            <input type="time" value={s.end_time} onChange={e => updateParsed(i, 'end_time', e.target.value)} style={{ ...inp, padding: '4px 5px', fontSize: '10px' }} />
                            <select value={s.slot_type} onChange={e => updateParsed(i, 'slot_type', e.target.value)} style={{ ...inp, padding: '4px 5px', fontSize: '10px' }}>
                              <option value="class">Class</option>
                              <option value="lab">Lab</option>
                              <option value="free">Free</option>
                              <option value="break">Break</option>
                            </select>
                            <div style={{ fontSize: '11px', color: '#1C1208', fontWeight: 600 }}>
                              {s.subject_code ? `${s.subject_code} — ` : ''}{s.subject_name ?? ''}
                            </div>
                            <div style={{ fontSize: '10px', color: '#8A6A4A' }}>{s.room ?? ''}</div>
                          </div>
                        ))}
                      </div>
                      <button type="button" onClick={handleSaveImport} disabled={savingImport} style={{
                        marginTop: '12px', width: '100%',
                        background: savingImport ? '#8A6A4A' : '#1C1208', color: '#F2EDE6',
                        border: 'none', padding: '12px', fontSize: '10px', fontWeight: 700,
                        letterSpacing: '2px', cursor: savingImport ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                      }}>
                        {savingImport ? 'SAVING...' : `SAVE ${parsedSlots.filter(s => s.include).length} SLOTS →`}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Add class form */}
            {isStaff && showClassForm && (
              <div style={{ border: '1.5px solid #1C1208', background: '#FDFAF5' }}>
                <div style={{ padding: '10px 18px', borderBottom: '1.5px solid #1C1208', fontSize: '9px', fontWeight: 700, letterSpacing: '2px', color: '#8A6A4A' }}>NEW CLASS SLOT</div>
                <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                    <div>
                      <label style={lbl}>DAY</label>
                      <select value={classForm.day} onChange={e => setClassForm(p => ({ ...p, day: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>
                        {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={lbl}>TIME SLOT</label>
                      <input type="text" value={classForm.slot_label} onChange={e => setClassForm(p => ({ ...p, slot_label: e.target.value }))} placeholder="9:00-9:55" style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>SUBJECT CODE</label>
                      <input type="text" value={classForm.subject_code} onChange={e => setClassForm(p => ({ ...p, subject_code: e.target.value }))} placeholder="CS401" style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>SUBJECT NAME</label>
                      <input type="text" value={classForm.subject_name} onChange={e => setClassForm(p => ({ ...p, subject_name: e.target.value }))} placeholder="DBMS" style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>FACULTY</label>
                      <input type="text" value={classForm.faculty_name} onChange={e => setClassForm(p => ({ ...p, faculty_name: e.target.value }))} placeholder="Dr. Sharma" style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>ROOM</label>
                      <input type="text" value={classForm.room} onChange={e => setClassForm(p => ({ ...p, room: e.target.value }))} placeholder="LH-3" style={inp} />
                    </div>
                  </div>
                  <button type="button" onClick={saveClass} disabled={saving} style={{
                    background: saving ? '#8A6A4A' : '#D94F00', color: '#F2EDE6', border: 'none',
                    padding: '11px', fontSize: '10px', fontWeight: 700, letterSpacing: '2px',
                    cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                  }}>
                    {saving ? 'SAVING...' : 'ADD SLOT →'}
                  </button>
                </div>
              </div>
            )}

            {/* Class grid */}
            {loading ? (
              <div style={{ fontSize: '11px', color: '#8A6A4A' }}>LOADING...</div>
            ) : (
              <>
                <ClassGrid slots={slots} />
                {/* Faculty: editable slot list */}
                {isStaff && slots.filter(s => s.timetable_type === 'class' && s.is_active).length > 0 && (
                  <div style={{ border: '1.5px solid #1C1208', marginTop: '8px' }}>
                    <div style={{ padding: '10px 16px', borderBottom: '1px solid #E0D0B8', fontSize: '9px', fontWeight: 700, letterSpacing: '2px', color: '#8A6A4A', background: '#F2EDE6' }}>
                      MANAGE SLOTS
                    </div>
                    {slots.filter(s => s.timetable_type === 'class' && s.is_active)
                      .sort((a, b) => (DAYS.indexOf(a.day ?? '') - DAYS.indexOf(b.day ?? '')) || (a.slot_label ?? '').localeCompare(b.slot_label ?? ''))
                      .map((s, i, arr) => (
                        <div key={s.id} style={{
                          display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px',
                          borderBottom: i < arr.length - 1 ? '1px solid #E0D0B8' : 'none',
                          background: '#FDFAF5', flexWrap: 'wrap',
                        }}>
                          <span style={{ fontSize: '9px', fontWeight: 700, color: '#D94F00', minWidth: '30px' }}>{s.day}</span>
                          <span style={{ fontSize: '9px', color: '#8A6A4A', minWidth: '70px' }}>{s.slot_label}</span>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#1C1208', flex: 1 }}>{s.subject_code ? `${s.subject_code} — ` : ''}{s.subject_name}</span>
                          {s.room && <span style={{ fontSize: '10px', color: '#8A6A4A' }}>{s.room}</span>}
                          <button type="button" onClick={() => deleteSlot(s.id)} style={{
                            background: 'transparent', border: '1px solid #D94F00', color: '#D94F00',
                            padding: '3px 8px', fontSize: '8px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                          }}>REMOVE</button>
                        </div>
                      ))
                    }
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── EXAM TIMETABLE ── */}
        {activeTab === 'exam' && (
          <>
            {isStaff && (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => { setShowExamForm(s => !s); setError('') }} style={{
                  background: '#1C1208', color: '#F2EDE6', border: 'none',
                  padding: '9px 18px', fontSize: '9px', fontWeight: 700,
                  letterSpacing: '1.5px', cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  {showExamForm ? '✕ CANCEL' : '+ ADD EXAM'}
                </button>
              </div>
            )}

            {/* Add exam form */}
            {isStaff && showExamForm && (
              <div style={{ border: '1.5px solid #1C1208', background: '#FDFAF5' }}>
                <div style={{ padding: '10px 18px', borderBottom: '1.5px solid #1C1208', fontSize: '9px', fontWeight: 700, letterSpacing: '2px', color: '#8A6A4A' }}>NEW EXAM</div>
                <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                    <div>
                      <label style={lbl}>SUBJECT</label>
                      <input type="text" value={examForm.exam_subject} onChange={e => setExamForm(p => ({ ...p, exam_subject: e.target.value }))} placeholder="DBMS" style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>DATE</label>
                      <input type="date" value={examForm.exam_date} onChange={e => setExamForm(p => ({ ...p, exam_date: e.target.value }))} style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>START TIME</label>
                      <input type="time" value={examForm.exam_start_time} onChange={e => setExamForm(p => ({ ...p, exam_start_time: e.target.value }))} style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>END TIME</label>
                      <input type="time" value={examForm.exam_end_time} onChange={e => setExamForm(p => ({ ...p, exam_end_time: e.target.value }))} style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>ROOM / VENUE</label>
                      <input type="text" value={examForm.exam_room} onChange={e => setExamForm(p => ({ ...p, exam_room: e.target.value }))} placeholder="Block A" style={inp} />
                    </div>
                  </div>
                  <button type="button" onClick={saveExam} disabled={saving} style={{
                    background: saving ? '#8A6A4A' : '#D94F00', color: '#F2EDE6', border: 'none',
                    padding: '11px', fontSize: '10px', fontWeight: 700, letterSpacing: '2px',
                    cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                  }}>
                    {saving ? 'SAVING...' : 'ADD EXAM →'}
                  </button>
                </div>
              </div>
            )}

            {loading ? (
              <div style={{ fontSize: '11px', color: '#8A6A4A' }}>LOADING...</div>
            ) : (
              <>
                <ExamList slots={slots} />
                {isStaff && slots.filter(s => s.timetable_type === 'exam' && s.is_active).length > 0 && (
                  <div style={{ border: '1.5px solid #1C1208', marginTop: '8px' }}>
                    <div style={{ padding: '10px 16px', borderBottom: '1px solid #E0D0B8', fontSize: '9px', fontWeight: 700, letterSpacing: '2px', color: '#8A6A4A', background: '#F2EDE6' }}>MANAGE EXAMS</div>
                    {slots.filter(s => s.timetable_type === 'exam' && s.is_active)
                      .sort((a, b) => (a.exam_date ?? '').localeCompare(b.exam_date ?? ''))
                      .map((s, i, arr) => (
                        <div key={s.id} style={{
                          display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px',
                          borderBottom: i < arr.length - 1 ? '1px solid #E0D0B8' : 'none',
                          background: '#FDFAF5', flexWrap: 'wrap',
                        }}>
                          <span style={{ fontSize: '10px', fontWeight: 700, color: '#1C1208', minWidth: '80px' }}>{s.exam_date}</span>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#1C1208', flex: 1 }}>{s.exam_subject}</span>
                          <span style={{ fontSize: '10px', color: '#8A6A4A' }}>{s.exam_start_time} – {s.exam_end_time}</span>
                          {s.exam_room && <span style={{ fontSize: '10px', color: '#8A6A4A' }}>{s.exam_room}</span>}
                          <button type="button" onClick={() => deleteSlot(s.id)} style={{
                            background: 'transparent', border: '1px solid #D94F00', color: '#D94F00',
                            padding: '3px 8px', fontSize: '8px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                          }}>REMOVE</button>
                        </div>
                      ))
                    }
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </>
  )
}