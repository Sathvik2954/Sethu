'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

type Priority = {
  code: string
  name: string
  score: number
  level: 'critical' | 'high' | 'mid' | 'low'
  days_to_exam: number | null
  reason: string
}

type PlannerResult = {
  source: 'mistral' | 'rules' | 'none'
  priorities: Priority[]
  recommendation: string
  fallback_reason?: string
}

const LEVEL_COLOR: Record<string, { bg: string; fg: string }> = {
  critical: { bg: '#D94F00', fg: '#F2EDE6' },
  high:     { bg: '#E8C87A', fg: '#1C1208' },
  mid:      { bg: '#3D7A50', fg: '#F2EDE6' },
  low:      { bg: '#8A6A4A', fg: '#F2EDE6' },
}

export default function PlannerPage() {
  const supabase = createClient()
  const [result, setResult] = useState<PlannerResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [freeHours, setFreeHours] = useState(2)
  const [subjectCount, setSubjectCount] = useState(0)
  const [lastRun, setLastRun] = useState<string | null>(null)

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
  }).toUpperCase()

  // Get today's free hours from timetable
  const loadFreeHours = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('users').select('department, year, section').eq('id', user.id).single()

    if (!profile?.department || !profile?.year || !profile?.section) return

    const jsDay = new Date().getDay()
    const dayMap = ['SUN','MON','TUE','WED','THU','FRI','SAT']
    const todayName = dayMap[jsDay]

    if (todayName === 'SUN') { setFreeHours(8); return }

    // Count non-class slots today
    const { data: slots } = await supabase
      .from('timetable_slots')
      .select('slot_label, day')
      .eq('department', profile.department)
      .eq('year', profile.year)
      .eq('section', profile.section)
      .eq('timetable_type', 'class')
      .eq('is_active', true)
      .eq('day', todayName)

    // Estimate: 8 working hours minus class hours (assume each slot ~1hr)
    const classHours = slots?.length ?? 0
    setFreeHours(Math.max(1, 8 - classHours))
  }, [supabase])

  useEffect(() => { loadFreeHours() }, [loadFreeHours])

  async function runPlanner() {
    setLoading(true); setError(''); setResult(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not signed in'); setLoading(false); return }

    const { data: profile } = await supabase
      .from('users').select('department, year').eq('id', user.id).single()

    // Fetch subjects
    const { data: subjects } = await supabase
      .from('subjects')
      .select('id, subject_code, subject_name, credits, subject_type')
      .eq('department', profile?.department ?? '')
      .eq('year', profile?.year ?? 0)
      .eq('is_active', true)

    if (!subjects || subjects.length === 0) {
      setError('No subjects found. Your faculty needs to add subjects first.')
      setLoading(false); return
    }

    setSubjectCount(subjects.length)

    // Fetch student notes for each subject
    const subjectIds = subjects.map((s: { id: string }) => s.id)
    const { data: notes } = await supabase
      .from('student_subject_notes')
      .select('*')
      .eq('student_id', user.id)
      .in('subject_id', subjectIds)

    const noteMap = Object.fromEntries((notes ?? []).map((n: {
      subject_id: string
      difficulty_level: string | null
      important_for_placements: boolean
      placement_topics: string[] | null
    }) => [n.subject_id, n]))

    // Build payload for AI service
    const subjectPayload = subjects.map((s: {
      id: string
      subject_code: string | null
      subject_name: string
      credits: number | null
    }) => {
      const note = noteMap[s.id]
      const difficulty = note?.difficulty_level === 'easy' ? 2 : note?.difficulty_level === 'hard' ? 5 : 3
      const placement = note?.important_for_placements ? 80 : 50
      return {
        code: s.subject_code ?? s.subject_name.slice(0, 6).toUpperCase(),
        name: s.subject_name,
        difficulty,
        coverage_pct: 0, // students don't track this yet
        exam_weightage: placement,
        exam_date: null,
        credits: s.credits ?? 3,
      }
    })

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_AI_SERVICE_URL}/prioritize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjects: subjectPayload, free_hours_today: freeHours }),
      })

      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        setError(e.detail ?? 'AI service returned an error')
        setLoading(false); return
      }

      const data = await res.json()
      setResult(data)
      setLastRun(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }))
    } catch {
      setError('Could not reach AI service. Make sure it is running on Render.')
    }

    setLoading(false)
  }

  return (
    <>
      <header style={{
        minHeight: '48px', borderBottom: '2px solid #1C1208',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(12px,4vw,24px)', background: '#F2EDE6',
        flexShrink: 0, flexWrap: 'wrap', gap: '4px',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#1C1208' }}>AI PLANNER</span>
          <span style={{ fontSize: '11px', color: '#C8A878' }}>/</span>
          <span style={{ fontSize: '11px', color: '#8A6A4A' }}>Powered by Mistral</span>
        </div>
        <span style={{ fontSize: '10px', color: '#6A4A2A', background: '#E8DDD0', padding: '4px 10px' }}>{today}</span>
      </header>

      <main style={{
        flex: 1, overflowY: 'auto',
        padding: 'clamp(12px,4vw,20px) clamp(12px,4vw,24px)',
        display: 'flex', flexDirection: 'column', gap: '20px',
      }}>

        {/* Control panel */}
        <div style={{ border: '1.5px solid #1C1208', background: '#FDFAF5', padding: '20px' }}>
          <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '2px', color: '#8A6A4A', marginBottom: '14px' }}>STUDY PLANNER</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <label style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "1.5px", color: "#6A4A2A", marginBottom: "5px", display: "block" }}>FREE HOURS TODAY</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button type="button" onClick={() => setFreeHours(h => Math.max(0.5, h - 0.5))} style={{
                  width: '32px', height: '36px', background: '#F2EDE6', border: '1.5px solid #C8A878',
                  fontSize: '16px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>−</button>
                <span style={{ fontSize: '20px', fontWeight: 700, color: '#1C1208', minWidth: '40px', textAlign: 'center' }}>{freeHours}h</span>
                <button type="button" onClick={() => setFreeHours(h => Math.min(12, h + 0.5))} style={{
                  width: '32px', height: '36px', background: '#F2EDE6', border: '1.5px solid #C8A878',
                  fontSize: '16px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>+</button>
              </div>
              <div style={{ fontSize: '9px', color: '#8A6A4A', marginTop: '4px' }}>Auto-estimated from your timetable</div>
            </div>

            <button type="button" onClick={runPlanner} disabled={loading} style={{
              background: loading ? '#8A6A4A' : '#D94F00', color: '#F2EDE6', border: 'none',
              padding: '12px 28px', fontSize: '11px', fontWeight: 700, letterSpacing: '2px',
              cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            }}>
              {loading ? 'ANALYSING...' : '▶ GENERATE PLAN'}
            </button>

            {lastRun && (
              <span style={{ fontSize: '10px', color: '#8A6A4A' }}>Last run: {lastRun}</span>
            )}
          </div>

          <div style={{ marginTop: '14px', fontSize: '11px', color: '#6A4A2A', lineHeight: 1.6 }}>
            The planner uses your <strong>faculty-defined subjects</strong> and your <strong>personal notes</strong> (difficulty, placement importance) to rank what you should study today.
            Add notes to your subjects for better recommendations.
          </div>
        </div>

        {error && <div style={{ fontSize: '11px', color: '#D94F00', borderLeft: '2px solid #D94F00', paddingLeft: '10px' }}>{error}</div>}

        {/* Result */}
        {result && (
          <>
            {/* Recommendation */}
            <div style={{ border: '1.5px solid #D94F00', background: '#FDFAF5', padding: '20px' }}>
              <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '2px', color: '#D94F00', marginBottom: '10px' }}>
                TODAY'S RECOMMENDATION
                {result.source === 'rules' && <span style={{ marginLeft: '8px', color: '#8A6A4A' }}>(rule-based fallback)</span>}
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#1C1208', lineHeight: 1.5 }}>
                {result.recommendation}
              </div>
              {result.fallback_reason && (
                <div style={{ marginTop: '8px', fontSize: '10px', color: '#8A6A4A' }}>
                  AI unavailable: {result.fallback_reason}
                </div>
              )}
            </div>

            {/* Priority list */}
            <div>
              <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '2px', color: '#8A6A4A', marginBottom: '10px' }}>
                SUBJECT PRIORITIES — {subjectCount} SUBJECTS ANALYSED
              </div>
              {result.priorities.map((p, i) => {
                const lc = LEVEL_COLOR[p.level] ?? LEVEL_COLOR.low
                return (
                  <div key={p.code} style={{
                    display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px',
                    border: '1.5px solid #1C1208', background: '#FDFAF5',
                    marginBottom: '6px', flexWrap: 'wrap',
                  }}>
                    <div style={{
                      width: '28px', height: '28px', background: '#1C1208',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '12px', fontWeight: 700, color: '#F2EDE6', flexShrink: 0,
                    }}>{i + 1}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#1C1208' }}>{p.name}</span>
                        <span style={{ fontSize: '8px', fontWeight: 700, letterSpacing: '1px', padding: '2px 8px', background: lc.bg, color: lc.fg }}>
                          {p.level.toUpperCase()}
                        </span>
                        {p.days_to_exam != null && p.days_to_exam >= 0 && (
                          <span style={{ fontSize: '9px', color: '#8A6A4A' }}>Exam in {p.days_to_exam}d</span>
                        )}
                      </div>
                      <div style={{ fontSize: '11px', color: '#6A4A2A', marginTop: '3px' }}>{p.reason}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: '#1C1208', lineHeight: 1 }}>{p.score}</div>
                      <div style={{ fontSize: '8px', color: '#8A6A4A', letterSpacing: '1px' }}>SCORE</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {!result && !loading && !error && (
          <div style={{ border: '1.5px solid #1C1208', background: '#FDFAF5', padding: '40px', textAlign: 'center' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#1C1208', marginBottom: '8px' }}>Ready to plan your day</div>
            <div style={{ fontSize: '11px', color: '#8A6A4A', lineHeight: 1.6, maxWidth: '400px', margin: '0 auto' }}>
              Click GENERATE PLAN to let Mistral analyse your subjects and tell you what to focus on today based on your free hours.
              For best results, add difficulty and important topics to your subjects first.
            </div>
          </div>
        )}
      </main>
    </>
  )
}