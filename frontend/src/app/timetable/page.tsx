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

type ParsedExam = {
  exam_subject: string
  exam_date: string
  exam_start_time: string | null
  exam_end_time: string | null
  exam_room: string | null
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
  const [activeTab, setActiveTab] = useState<'class' | 'exam' | 'almanac'>('class')

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

  // Exam PDF import
  const [showExamImport, setShowExamImport] = useState(false)
  const [examImportFile, setExamImportFile] = useState<File | null>(null)
  const [parsedExams, setParsedExams] = useState<ParsedExam[]>([])
  const [examImporting, setExamImporting] = useState(false)
  const [examImportError, setExamImportError] = useState('')
  const [savingExamImport, setSavingExamImport] = useState(false)
  const examImportFileRef = useRef<HTMLInputElement | null>(null)
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

  // ── Exam PDF import ─────────────────────────────────────────
  async function handleParseExam() {
    if (!examImportFile) { setExamImportError('Choose a PDF file first'); return }
    if (!targetYear) { setExamImportError('Set the year before parsing'); return }
    if (!targetSection.trim()) { setExamImportError('Set the section before parsing'); return }
    setExamImporting(true); setExamImportError(''); setParsedExams([])
    const formData = new FormData()
    formData.append('file', examImportFile)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_AI_SERVICE_URL}/parse-exam-timetable`, {
        method: 'POST', body: formData,
      })
      const data = await res.json()
      if (!res.ok) { setExamImportError(data.detail ?? 'Could not parse PDF'); setExamImporting(false); return }
      const result: ParsedExam[] = (data.slots ?? []).map((s: Omit<ParsedExam, 'include'>) => ({ ...s, include: true }))
      setParsedExams(result)
    } catch { setExamImportError('Could not reach AI service. Is it running?') }
    setExamImporting(false)
  }

  function updateParsedExam(i: number, field: keyof ParsedExam, value: string | boolean) {
    setParsedExams(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s))
  }

  async function handleSaveExamImport() {
    if (!me) return
    setSavingExamImport(true); setExamImportError('')
    const dept = targetDept || me.department || ''
    const included = parsedExams.filter(s => s.include)

    for (const exam of included) {
      const { error: e } = await supabase.from('timetable_slots').insert({
        timetable_type: 'exam',
        department: dept,
        year: parseInt(targetYear),
        section: targetSection,
        exam_date: exam.exam_date,
        exam_start_time: exam.exam_start_time || null,
        exam_end_time: exam.exam_end_time || null,
        exam_subject: exam.exam_subject,
        exam_room: exam.exam_room || null,
        created_by: me.id,
      })
      if (e) { setExamImportError('Save failed: ' + e.message); setSavingExamImport(false); return }
    }
    setSuccess(`${included.length} exams imported.`)
    setParsedExams([])
    setExamImportFile(null)
    setShowExamImport(false)
    setSavingExamImport(false)
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

        {/* Tab bar: Class / Almanac / Exam */}
        <div style={{ display: 'flex', border: '1.5px solid #1C1208' }}>
          {(['class', 'almanac', 'exam'] as const).map((t, i) => (
            <button key={t} type="button" onClick={() => setActiveTab(t)} style={{
              flex: 1, padding: '10px', fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px',
              cursor: 'pointer', fontFamily: 'inherit', border: 'none',
              borderRight: i < 2 ? '1.5px solid #1C1208' : 'none',
              background: activeTab === t ? '#1C1208' : '#F2EDE6',
              color: activeTab === t ? '#F2EDE6' : '#8A6A4A',
            }}>
              {t === 'class' ? 'CLASS TIMETABLE' : t === 'almanac' ? 'ALMANAC' : 'EXAM TIMETABLE'}
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

        {/* ── ALMANAC ── */}
        {activeTab === 'almanac' && (
          <AlmanacSection
            me={me}
            isStaff={!!isStaff}
            targetDept={targetDept}
            targetYear={targetYear}
            supabase={supabase}
          />
        )}

        {/* ── EXAM TIMETABLE ── */}
        {activeTab === 'exam' && (
          <>
            {isStaff && (
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button type="button" onClick={() => { setShowExamImport(s => !s); setShowExamForm(false); setError(''); setExamImportError('') }} style={{
                  background: 'transparent', color: '#1C1208', border: '1.5px solid #1C1208',
                  padding: '9px 18px', fontSize: '9px', fontWeight: 700,
                  letterSpacing: '1.5px', cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  {showExamImport ? '✕ CLOSE' : '↑ IMPORT PDF'}
                </button>
                <button type="button" onClick={() => { setShowExamForm(s => !s); setShowExamImport(false); setError('') }} style={{
                  background: '#1C1208', color: '#F2EDE6', border: 'none',
                  padding: '9px 18px', fontSize: '9px', fontWeight: 700,
                  letterSpacing: '1.5px', cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  {showExamForm ? '✕ CANCEL' : '+ ADD EXAM'}
                </button>
              </div>
            )}

            {/* Exam PDF import panel */}
            {isStaff && showExamImport && (
              <div style={{ border: '1.5px solid #1C1208', background: '#FDFAF5' }}>
                <div style={{ padding: '10px 18px', borderBottom: '1.5px solid #1C1208', fontSize: '9px', fontWeight: 700, letterSpacing: '2px', color: '#8A6A4A' }}>
                  IMPORT EXAM TIMETABLE FROM PDF
                </div>
                <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ fontSize: '11px', color: '#6A4A2A', lineHeight: 1.6 }}>
                    Upload an exam timetable PDF. Make sure Year and Section are set above before parsing.
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div
                      onClick={() => examImportFileRef.current?.click()}
                      style={{
                        flex: 1, minWidth: '200px', border: '1.5px dashed #C8A878',
                        padding: '12px 16px', cursor: 'pointer', background: '#F2EDE6',
                        fontSize: '11px', color: examImportFile ? '#3D7A50' : '#8A6A4A', fontWeight: examImportFile ? 700 : 400,
                      }}
                    >
                      {examImportFile ? `✓ ${examImportFile.name}` : 'Click to choose PDF file'}
                    </div>
                    <input ref={examImportFileRef} type="file" accept="application/pdf" style={{ display: 'none' }}
                      onChange={e => { setExamImportFile(e.target.files?.[0] ?? null); setExamImportError(''); setParsedExams([]) }} />
                    <button type="button" onClick={handleParseExam} disabled={examImporting} style={{
                      background: examImporting ? '#8A6A4A' : '#D94F00', color: '#F2EDE6', border: 'none',
                      padding: '12px 22px', fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px',
                      cursor: examImporting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                    }}>
                      {examImporting ? 'PARSING...' : 'PARSE WITH AI →'}
                    </button>
                  </div>

                  {examImportError && <div style={{ fontSize: '11px', color: '#D94F00', borderLeft: '2px solid #D94F00', paddingLeft: '10px' }}>{examImportError}</div>}

                  {parsedExams.length > 0 && (
                    <div>
                      <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px', color: '#8A6A4A', marginBottom: '10px' }}>
                        REVIEW {parsedExams.length} PARSED EXAMS — EDIT IF NEEDED, UNCHECK TO SKIP
                      </div>
                      <div style={{ border: '1.5px solid #1C1208', maxHeight: '320px', overflowY: 'auto', overflowX: 'auto' }}>
                        {parsedExams.map((ex, i) => (
                          <div key={i} style={{
                            display: 'grid', gridTemplateColumns: '24px 1fr 110px 75px 75px 90px',
                            gap: '6px', alignItems: 'center', padding: '7px 10px',
                            background: i % 2 === 0 ? '#FDFAF5' : '#F2EDE6',
                            borderBottom: i < parsedExams.length - 1 ? '1px solid #E0D0B8' : 'none',
                            minWidth: '560px',
                          }}>
                            <input type="checkbox" checked={ex.include} onChange={e => updateParsedExam(i, 'include', e.target.checked)} style={{ accentColor: '#D94F00' }} />
                            <input type="text" value={ex.exam_subject} onChange={e => updateParsedExam(i, 'exam_subject', e.target.value)} style={{ ...inp, padding: '4px 6px', fontSize: '11px' }} />
                            <input type="date" value={ex.exam_date} onChange={e => updateParsedExam(i, 'exam_date', e.target.value)} style={{ ...inp, padding: '4px 5px', fontSize: '10px' }} />
                            <input type="time" value={ex.exam_start_time ?? ''} onChange={e => updateParsedExam(i, 'exam_start_time', e.target.value)} style={{ ...inp, padding: '4px 5px', fontSize: '10px' }} />
                            <input type="time" value={ex.exam_end_time ?? ''} onChange={e => updateParsedExam(i, 'exam_end_time', e.target.value)} style={{ ...inp, padding: '4px 5px', fontSize: '10px' }} />
                            <input type="text" value={ex.exam_room ?? ''} onChange={e => updateParsedExam(i, 'exam_room', e.target.value)} placeholder="Room" style={{ ...inp, padding: '4px 5px', fontSize: '10px' }} />
                          </div>
                        ))}
                      </div>
                      <button type="button" onClick={handleSaveExamImport} disabled={savingExamImport} style={{
                        marginTop: '12px', width: '100%',
                        background: savingExamImport ? '#8A6A4A' : '#1C1208', color: '#F2EDE6',
                        border: 'none', padding: '12px', fontSize: '10px', fontWeight: 700,
                        letterSpacing: '2px', cursor: savingExamImport ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                      }}>
                        {savingExamImport ? 'SAVING...' : `SAVE ${parsedExams.filter(s => s.include).length} EXAMS →`}
                      </button>
                    </div>
                  )}
                </div>
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

// ── Almanac types ──────────────────────────────────────────────
type AlmanacEvent = {
  id: string
  academic_year: string
  semester: number
  sl_no: number
  event_name: string
  date_from: string
  date_to: string | null
  event_type: string
  is_active: boolean
}

const EVENT_TYPE_COLOR: Record<string, { bg: string; fg: string }> = {
  academic:     { bg: '#1C1208', fg: '#C8A878' },
  holiday:      { bg: '#3D7A50', fg: '#F2EDE6' },
  exam:         { bg: '#D94F00', fg: '#F2EDE6' },
  registration: { bg: '#8A6A4A', fg: '#F2EDE6' },
  other:        { bg: '#E8C87A', fg: '#1C1208' },
}

function formatDateRange(from: string, to: string | null): string {
  const f = new Date(from + 'T00:00:00')
  const fStr = f.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  if (!to || to === from) return fStr
  const t = new Date(to + 'T00:00:00')
  const tStr = t.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  return `${fStr} — ${tStr}`
}

function AlmanacSection({ me, isStaff, targetDept, targetYear, supabase }: {
  me: UserInfo | null
  isStaff: boolean
  targetDept: string
  targetYear: string
  supabase: ReturnType<typeof createClient>
}) {
  const [events, setEvents] = useState<AlmanacEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [academicYear, setAcademicYear] = useState('2026-27')
  const [semester, setSemester] = useState('7')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({
    sl_no: '', event_name: '', date_from: '', date_to: '', event_type: 'academic',
  })

  // PDF import state
  const [showImport, setShowImport] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [parsedEvents, setParsedEvents] = useState<Array<{
    sl_no: number; event_name: string; date_from: string; date_to: string | null
    event_type: string; semester: number | null; include: boolean
  }>>([])
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState('')
  const [savingImport, setSavingImport] = useState(false)
  const importFileRef = useRef<HTMLInputElement | null>(null)

  const dept = targetDept || me?.department || ''

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('almanac')
      .select('*')
      .eq('department', dept)
      .eq('academic_year', academicYear)
      .eq('semester', parseInt(semester))
      .eq('is_active', true)
      .order('sl_no')
    setEvents((data as AlmanacEvent[]) ?? [])
    setLoading(false)
  }, [supabase, dept, academicYear, semester])

  useEffect(() => { load() }, [load])

  async function handleAdd() {
    if (!form.sl_no) { setError('S.No is required'); return }
    if (!form.event_name.trim()) { setError('Event name is required'); return }
    if (!form.date_from) { setError('Start date is required'); return }
    setSaving(true); setError('')
    const { data: { user } } = await supabase.auth.getUser()
    const { error: e } = await supabase.from('almanac').insert({
      created_by: user!.id,
      department: dept,
      academic_year: academicYear,
      semester: parseInt(semester),
      sl_no: parseInt(form.sl_no),
      event_name: form.event_name.trim(),
      date_from: form.date_from,
      date_to: form.date_to || null,
      event_type: form.event_type,
    })
    if (e) { setError(e.message); setSaving(false); return }
    setSuccess('Event added.')
    setForm({ sl_no: '', event_name: '', date_from: '', date_to: '', event_type: 'academic' })
    setShowForm(false)
    setSaving(false)
    load()
  }

  async function handleDelete(id: string) {
    await supabase.from('almanac').update({ is_active: false }).eq('id', id)
    setEvents(prev => prev.filter(e => e.id !== id))
  }

  // ── Almanac PDF import ──────────────────────────────────────
  async function handleParseAlmanac() {
    if (!importFile) { setImportError('Choose a PDF file first'); return }
    setImporting(true); setImportError(''); setParsedEvents([])
    const formData = new FormData()
    formData.append('file', importFile)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_AI_SERVICE_URL}/parse-almanac`, {
        method: 'POST', body: formData,
      })
      const data = await res.json()
      if (!res.ok) { setImportError(data.detail ?? 'Could not parse PDF'); setImporting(false); return }
      const result = (data.events ?? []).map((e: { sl_no: number; event_name: string; date_from: string; date_to: string | null; event_type: string; semester: number | null }) => ({ ...e, include: true }))
      setParsedEvents(result)
    } catch { setImportError('Could not reach AI service. Is it running?') }
    setImporting(false)
  }

  function updateParsedEvent(i: number, field: string, value: string | boolean | number) {
    setParsedEvents(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: value } : e))
  }

  async function handleSaveImport() {
    setSavingImport(true); setImportError('')
    const { data: { user } } = await supabase.auth.getUser()
    const included = parsedEvents.filter(e => e.include)

    for (const ev of included) {
      const { error: e } = await supabase.from('almanac').insert({
        created_by: user!.id,
        department: dept,
        academic_year: academicYear,
        semester: ev.semester ?? parseInt(semester),
        sl_no: ev.sl_no,
        event_name: ev.event_name,
        date_from: ev.date_from,
        date_to: ev.date_to || null,
        event_type: ev.event_type,
      })
      if (e) { setImportError('Save failed: ' + e.message); setSavingImport(false); return }
    }
    setSuccess(`${included.length} almanac events imported.`)
    setParsedEvents([])
    setImportFile(null)
    setShowImport(false)
    setSavingImport(false)
    load()
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

  // Group by semester for display
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {success && <div style={{ fontSize: '11px', color: '#3D7A50', borderLeft: '2px solid #3D7A50', paddingLeft: '10px' }}>{success}</div>}
      {error && <div style={{ fontSize: '11px', color: '#D94F00', borderLeft: '2px solid #D94F00', paddingLeft: '10px' }}>{error}</div>}

      {/* Controls */}
      <div style={{ border: '1.5px solid #1C1208', background: '#FDFAF5', padding: '14px 18px' }}>
        <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '2px', color: '#8A6A4A', marginBottom: '10px' }}>ALMANAC FILTERS</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px,1fr))', gap: '10px', alignItems: 'end' }}>
          <div>
            <label style={lbl}>ACADEMIC YEAR</label>
            <input type="text" value={academicYear} onChange={e => setAcademicYear(e.target.value)} placeholder="2026-27" style={inp} />
          </div>
          <div>
            <label style={lbl}>SEMESTER</label>
            <select value={semester} onChange={e => setSemester(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
              {['1','2','3','4','5','6','7','8'].map(s => <option key={s} value={s}>Semester {s}</option>)}
            </select>
          </div>
          {isStaff && (
            <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-end' }}>
              <button type="button" onClick={() => { setShowImport(s => !s); setShowForm(false); setError(''); setImportError('') }} style={{
                background: 'transparent', color: '#1C1208', border: '1.5px solid #1C1208',
                padding: '9px 16px', fontSize: '9px', fontWeight: 700,
                letterSpacing: '1.5px', cursor: 'pointer', fontFamily: 'inherit',
              }}>
                {showImport ? '✕ CLOSE' : '↑ IMPORT PDF'}
              </button>
              <button type="button" onClick={() => { setShowForm(s => !s); setShowImport(false); setError('') }} style={{
                background: '#1C1208', color: '#F2EDE6', border: 'none',
                padding: '9px 16px', fontSize: '9px', fontWeight: 700,
                letterSpacing: '1.5px', cursor: 'pointer', fontFamily: 'inherit',
              }}>
                {showForm ? '✕ CANCEL' : '+ ADD EVENT'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Almanac PDF import panel */}
      {isStaff && showImport && (
        <div style={{ border: '1.5px solid #1C1208', background: '#FDFAF5' }}>
          <div style={{ padding: '10px 18px', borderBottom: '1.5px solid #1C1208', fontSize: '9px', fontWeight: 700, letterSpacing: '2px', color: '#8A6A4A' }}>
            IMPORT ALMANAC FROM PDF
          </div>
          <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ fontSize: '11px', color: '#6A4A2A', lineHeight: 1.6 }}>
              Upload the official academic almanac PDF (e.g. from the institution). The AI service will
              extract all numbered events, dates, and semester information for you to review before saving.
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
                onChange={e => { setImportFile(e.target.files?.[0] ?? null); setImportError(''); setParsedEvents([]) }} />
              <button type="button" onClick={handleParseAlmanac} disabled={importing} style={{
                background: importing ? '#8A6A4A' : '#D94F00', color: '#F2EDE6', border: 'none',
                padding: '12px 22px', fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px',
                cursor: importing ? 'not-allowed' : 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
              }}>
                {importing ? 'PARSING...' : 'PARSE WITH AI →'}
              </button>
            </div>

            {importError && <div style={{ fontSize: '11px', color: '#D94F00', borderLeft: '2px solid #D94F00', paddingLeft: '10px' }}>{importError}</div>}

            {parsedEvents.length > 0 && (
              <div>
                <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px', color: '#8A6A4A', marginBottom: '10px' }}>
                  REVIEW {parsedEvents.length} PARSED EVENTS — EDIT IF NEEDED, UNCHECK TO SKIP
                </div>
                <div style={{ border: '1.5px solid #1C1208', maxHeight: '360px', overflowY: 'auto', overflowX: 'auto' }}>
                  {parsedEvents.map((ev, i) => (
                    <div key={i} style={{
                      display: 'grid', gridTemplateColumns: '24px 40px 1fr 100px 110px 110px 90px',
                      gap: '6px', alignItems: 'center', padding: '7px 10px',
                      background: i % 2 === 0 ? '#FDFAF5' : '#F2EDE6',
                      borderBottom: i < parsedEvents.length - 1 ? '1px solid #E0D0B8' : 'none',
                      minWidth: '620px',
                    }}>
                      <input type="checkbox" checked={ev.include} onChange={e => updateParsedEvent(i, 'include', e.target.checked)} style={{ accentColor: '#D94F00' }} />
                      <input type="number" value={ev.sl_no} onChange={e => updateParsedEvent(i, 'sl_no', parseInt(e.target.value) || 0)} style={{ ...inp, padding: '4px 5px', fontSize: '10px' }} />
                      <input type="text" value={ev.event_name} onChange={e => updateParsedEvent(i, 'event_name', e.target.value)} style={{ ...inp, padding: '4px 6px', fontSize: '11px' }} />
                      <select value={ev.event_type} onChange={e => updateParsedEvent(i, 'event_type', e.target.value)} style={{ ...inp, padding: '4px 5px', fontSize: '10px' }}>
                        <option value="academic">Academic</option>
                        <option value="exam">Exam</option>
                        <option value="holiday">Holiday</option>
                        <option value="registration">Registration</option>
                        <option value="other">Other</option>
                      </select>
                      <input type="date" value={ev.date_from} onChange={e => updateParsedEvent(i, 'date_from', e.target.value)} style={{ ...inp, padding: '4px 5px', fontSize: '10px' }} />
                      <input type="date" value={ev.date_to ?? ''} onChange={e => updateParsedEvent(i, 'date_to', e.target.value)} style={{ ...inp, padding: '4px 5px', fontSize: '10px' }} />
                      <input type="number" value={ev.semester ?? ''} onChange={e => updateParsedEvent(i, 'semester', parseInt(e.target.value) || 0)} placeholder="Sem" style={{ ...inp, padding: '4px 5px', fontSize: '10px' }} />
                    </div>
                  ))}
                </div>
                <button type="button" onClick={handleSaveImport} disabled={savingImport} style={{
                  marginTop: '12px', width: '100%',
                  background: savingImport ? '#8A6A4A' : '#1C1208', color: '#F2EDE6',
                  border: 'none', padding: '12px', fontSize: '10px', fontWeight: 700,
                  letterSpacing: '2px', cursor: savingImport ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                }}>
                  {savingImport ? 'SAVING...' : `SAVE ${parsedEvents.filter(e => e.include).length} EVENTS →`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Add form */}
      {isStaff && showForm && (
        <div style={{ border: '1.5px solid #1C1208', background: '#FDFAF5' }}>
          <div style={{ padding: '10px 18px', borderBottom: '1.5px solid #1C1208', fontSize: '9px', fontWeight: 700, letterSpacing: '2px', color: '#8A6A4A' }}>
            NEW ALMANAC EVENT — {dept} · SEM {semester} · {academicYear}
          </div>
          <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px,1fr))', gap: '10px' }}>
              <div>
                <label style={lbl}>S.NO</label>
                <input type="number" value={form.sl_no} onChange={e => setForm(p => ({ ...p, sl_no: e.target.value }))} placeholder="1" style={inp} />
              </div>
              <div>
                <label style={lbl}>EVENT TYPE</label>
                <select value={form.event_type} onChange={e => setForm(p => ({ ...p, event_type: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>
                  <option value="academic">Academic</option>
                  <option value="exam">Exam / Test</option>
                  <option value="holiday">Holiday</option>
                  <option value="registration">Registration</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div>
              <label style={lbl}>EVENT NAME</label>
              <input type="text" value={form.event_name} onChange={e => setForm(p => ({ ...p, event_name: e.target.value }))} placeholder="e.g. Commencement of class work" style={inp} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={lbl}>DATE FROM</label>
                <input type="date" value={form.date_from} onChange={e => setForm(p => ({ ...p, date_from: e.target.value }))} style={inp} />
              </div>
              <div>
                <label style={lbl}>DATE TO (leave blank if single day)</label>
                <input type="date" value={form.date_to} onChange={e => setForm(p => ({ ...p, date_to: e.target.value }))} style={inp} />
              </div>
            </div>
            <button type="button" onClick={handleAdd} disabled={saving} style={{
              background: saving ? '#8A6A4A' : '#D94F00', color: '#F2EDE6', border: 'none',
              padding: '11px', fontSize: '10px', fontWeight: 700, letterSpacing: '2px',
              cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            }}>
              {saving ? 'SAVING...' : 'ADD TO ALMANAC →'}
            </button>
          </div>
        </div>
      )}

      {/* Almanac table */}
      {loading ? (
        <div style={{ fontSize: '11px', color: '#8A6A4A' }}>LOADING...</div>
      ) : events.length === 0 ? (
        <div style={{ border: '1.5px solid #1C1208', background: '#FDFAF5', padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#1C1208', marginBottom: '6px' }}>No almanac entries</div>
          <div style={{ fontSize: '11px', color: '#8A6A4A' }}>
            {isStaff ? `Click + ADD EVENT to create the almanac for Semester ${semester}, ${academicYear}.` : 'Your faculty has not set the almanac yet.'}
          </div>
        </div>
      ) : (
        <>
          {/* Header */}
          <div style={{ border: '1.5px solid #1C1208', background: '#1C1208', padding: '14px 20px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#F2EDE6', letterSpacing: '1px' }}>
              ALMANAC {academicYear}
            </div>
            <div style={{ fontSize: '10px', color: '#8A6A4A', marginTop: '4px', letterSpacing: '1px' }}>
              {dept} · SEMESTER {semester} · B.E. / B.TECH
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto', border: '1.5px solid #1C1208', borderTop: 'none' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '480px' }}>
              <thead>
                <tr style={{ background: '#F2EDE6' }}>
                  <th style={{ padding: '10px 14px', fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px', color: '#8A6A4A', textAlign: 'left', border: '1px solid #E0D0B8', width: '50px' }}>S.NO</th>
                  <th style={{ padding: '10px 14px', fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px', color: '#8A6A4A', textAlign: 'left', border: '1px solid #E0D0B8' }}>EVENT</th>
                  <th style={{ padding: '10px 14px', fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px', color: '#8A6A4A', textAlign: 'left', border: '1px solid #E0D0B8', whiteSpace: 'nowrap' }}>DATE(S)</th>
                  {isStaff && <th style={{ padding: '10px 14px', border: '1px solid #E0D0B8', width: '80px' }}></th>}
                </tr>
              </thead>
              <tbody>
                {events.map((e, i) => {
                  const tc = EVENT_TYPE_COLOR[e.event_type] ?? EVENT_TYPE_COLOR.other
                  const isActive = e.date_from <= today && (!e.date_to || e.date_to >= today)
                  const isPast = e.date_to ? e.date_to < today : e.date_from < today
                  return (
                    <tr key={e.id} style={{
                      background: isActive ? '#FFF8F2' : i % 2 === 0 ? '#FDFAF5' : '#F2EDE6',
                      opacity: isPast ? 0.65 : 1,
                    }}>
                      <td style={{ padding: '11px 14px', border: '1px solid #E0D0B8', textAlign: 'center' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#1C1208' }}>{e.sl_no}</span>
                      </td>
                      <td style={{ padding: '11px 14px', border: '1px solid #E0D0B8' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '7px', fontWeight: 700, letterSpacing: '1px', padding: '2px 7px', background: tc.bg, color: tc.fg, whiteSpace: 'nowrap' }}>
                            {e.event_type.toUpperCase()}
                          </span>
                          <span style={{ fontSize: '13px', color: '#1C1208', fontWeight: isActive ? 700 : 400 }}>{e.event_name}</span>
                          {isActive && <span style={{ fontSize: '7px', fontWeight: 700, background: '#D94F00', color: '#F2EDE6', padding: '2px 6px', letterSpacing: '1px' }}>NOW</span>}
                        </div>
                      </td>
                      <td style={{ padding: '11px 14px', border: '1px solid #E0D0B8', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: '11px', color: '#1C1208' }}>{formatDateRange(e.date_from, e.date_to)}</span>
                      </td>
                      {isStaff && (
                        <td style={{ padding: '8px 14px', border: '1px solid #E0D0B8', textAlign: 'center' }}>
                          <button type="button" onClick={() => handleDelete(e.id)} style={{
                            background: 'transparent', border: '1px solid #D94F00', color: '#D94F00',
                            padding: '3px 8px', fontSize: '8px', fontWeight: 700,
                            cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '1px',
                          }}>REMOVE</button>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: '10px', color: '#8A6A4A', fontStyle: 'italic', textAlign: 'center' }}>
            Note: The Almanac may be revised in case of any unforeseen circumstances that may arise from time to time.
          </div>
        </>
      )}
    </div>
  )
}