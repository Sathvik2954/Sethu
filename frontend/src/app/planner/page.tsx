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

type AIResult = {
  source: string
  priorities: Priority[]
  recommendation: string
  fallback_reason?: string
}

const LEVEL_STYLE: Record<string, { bg: string; fg: string; bar: string }> = {
  critical: { bg: '#D94F00', fg: '#F2EDE6', bar: '#D94F00' },
  high:     { bg: '#E8C87A', fg: '#1C1208', bar: '#E8C87A' },
  mid:      { bg: '#E8C87A', fg: '#1C1208', bar: '#C8A878' },
  low:      { bg: '#3D7A50', fg: '#F2EDE6', bar: '#3D7A50' },
}

export default function PlannerPage() {
  const [result, setResult] = useState<AIResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [subjectCount, setSubjectCount] = useState<number | null>(null)
  const [freeHours, setFreeHours] = useState('2')

  const supabase = createClient()

  const checkSubjects = useCallback(async () => {
    const { count } = await supabase
      .from('subjects')
      .select('*', { count: 'exact', head: true })
    setSubjectCount(count ?? 0)
  }, [supabase])

  useEffect(() => {
    checkSubjects()
  }, [checkSubjects])

  async function runPlanner() {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      // 1 — fetch subjects from Supabase
      const { data: subjects, error: dbError } = await supabase
        .from('subjects')
        .select('name, code, difficulty, coverage_pct, exam_weightage, exam_date, credits')

      if (dbError) {
        setError('Could not load subjects: ' + dbError.message)
        setLoading(false)
        return
      }

      if (!subjects || subjects.length === 0) {
        setError('No subjects found. Add subjects first.')
        setLoading(false)
        return
      }

      // 2 — send to FastAPI AI service
      const aiUrl = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000'
      const res = await fetch(`${aiUrl}/prioritize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjects,
          free_hours_today: parseFloat(freeHours) || 2,
        }),
      })

      if (!res.ok) {
        setError(`AI service returned ${res.status}. Is it running on port 8000?`)
        setLoading(false)
        return
      }

      const data: AIResult = await res.json()
      setResult(data)
      setLoading(false)

    } catch (err: any) {
      setError(
        'Could not reach the AI service. Make sure it is running: ' +
        'open a terminal in ai-service and run "uvicorn main:app --reload --port 8000". ' +
        '(' + err.message + ')'
      )
      setLoading(false)
    }
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
            AI PLANNER
          </span>
          <span style={{ fontSize: '11px', color: '#C8A878' }}>/</span>
          <span style={{ fontSize: '11px', color: '#8A6A4A' }}>
            Powered by Mistral
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

        {/* Control bar */}
        <div style={{ border: '1.5px solid #1C1208', background: '#FDFAF5', padding: '18px', display: 'flex', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '220px' }}>
            <h1 style={{ fontSize: '16px', fontWeight: 700, color: '#1C1208', margin: 0, letterSpacing: '0.5px' }}>
              Generate today&apos;s study priorities
            </h1>
            <p style={{ fontSize: '11px', color: '#8A6A4A', margin: '4px 0 0', lineHeight: 1.5 }}>
              Mistral analyses your {subjectCount ?? '...'} subjects — exam dates, coverage gaps,
              difficulty — and ranks what to study today.
            </p>
          </div>

          <div>
            <label style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px', color: '#6A4A2A', marginBottom: '5px', display: 'block' }}>
              FREE HOURS TODAY
            </label>
            <input
              type="number"
              min="0.5"
              max="12"
              step="0.5"
              value={freeHours}
              onChange={e => setFreeHours(e.target.value)}
              style={{
                width: '90px', border: '1.5px solid #C8A878',
                background: '#F2EDE6', padding: '9px 11px',
                fontSize: '12px', color: '#1C1208',
                outline: 'none', borderRadius: 0, fontFamily: 'inherit',
              }}
            />
          </div>

          <button
            type="button"
            onClick={runPlanner}
            disabled={loading || subjectCount === 0}
            style={{
              background: loading ? '#8A6A4A' : '#1C1208',
              color: '#F2EDE6', border: 'none',
              padding: '11px 26px', fontSize: '10px', fontWeight: 700,
              letterSpacing: '2px',
              cursor: loading || subjectCount === 0 ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {loading ? 'ANALYSING...' : 'RUN PLANNER →'}
          </button>
        </div>

        {/* No subjects warning */}
        {subjectCount === 0 && (
          <div style={{ border: '1.5px solid #D94F00', background: '#FDFAF5', padding: '16px 18px' }}>
            <div style={{ fontSize: '11px', color: '#D94F00', fontWeight: 700, letterSpacing: '0.5px' }}>
              NO SUBJECTS FOUND
            </div>
            <div style={{ fontSize: '11px', color: '#6A4A2A', marginTop: '4px' }}>
              Go to the Subjects page and add your semester subjects with exam dates first.
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ border: '1.5px solid #D94F00', background: '#FDFAF5', padding: '16px 18px' }}>
            <div style={{ fontSize: '11px', color: '#D94F00', lineHeight: 1.6 }}>{error}</div>
          </div>
        )}

        {/* Results */}
        {result && (
          <>
            {/* Recommendation strip */}
            <div style={{ background: '#1C1208', padding: '16px 18px' }}>
              <div style={{ fontSize: '8px', letterSpacing: '2px', color: '#6A4A2A', marginBottom: '7px', fontWeight: 700 }}>
                {result.source === 'mistral' ? 'MISTRAL RECOMMENDATION' : 'RECOMMENDATION (RULE-BASED FALLBACK)'}
              </div>
              <div style={{ fontSize: '13px', color: '#E8C87A', lineHeight: 1.6 }}>
                {result.recommendation}
              </div>
              {result.fallback_reason && (
                <div style={{ fontSize: '9px', color: '#6A4A2A', marginTop: '8px' }}>
                  Mistral unavailable: {result.fallback_reason}
                </div>
              )}
            </div>

            {/* Priority table */}
            <div style={{ border: '1.5px solid #1C1208' }}>
              <div style={{
                borderBottom: '1.5px solid #1C1208', padding: '11px 16px',
                fontSize: '9px', fontWeight: 700, letterSpacing: '2px', color: '#8A6A4A',
                background: '#FDFAF5',
              }}>
                TODAY&apos;S PRIORITY RANKING
              </div>

              {result.priorities.map((p, i) => {
                const style = LEVEL_STYLE[p.level] ?? LEVEL_STYLE.mid
                return (
                  <div key={p.code} style={{
                    display: 'flex', alignItems: 'center', gap: '14px',
                    padding: '14px 16px',
                    background: '#FDFAF5',
                    borderBottom: i < result.priorities.length - 1 ? '1px solid #E0D0B8' : 'none',
                  }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#8A6A4A', minWidth: '22px' }}>
                      {String(i + 1).padStart(2, '0')}
                    </div>

                    <div style={{ minWidth: '52px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#1C1208', letterSpacing: '0.5px' }}>
                        {p.code}
                      </div>
                      {p.days_to_exam !== null && p.days_to_exam >= 0 && (
                        <div style={{
                          fontSize: '8px', fontWeight: 700, letterSpacing: '0.5px',
                          color: p.days_to_exam <= 7 ? '#D94F00' : '#8A6A4A',
                        }}>
                          EXAM IN {p.days_to_exam}D
                        </div>
                      )}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ height: '4px', background: '#E0D0B8' }}>
                        <div style={{ height: '4px', width: `${p.score}%`, background: style.bar }} />
                      </div>
                      <div style={{ fontSize: '10px', color: '#6A4A2A', marginTop: '5px', lineHeight: 1.4 }}>
                        {p.reason}
                      </div>
                    </div>

                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#1C1208', minWidth: '32px', textAlign: 'right' }}>
                      {p.score}
                    </div>

                    <span style={{
                      fontSize: '8px', fontWeight: 700, letterSpacing: '1px',
                      padding: '3px 8px',
                      background: style.bg, color: style.fg,
                      minWidth: '58px', textAlign: 'center',
                    }}>
                      {p.level.toUpperCase()}
                    </span>
                  </div>
                )
              })}
            </div>
          </>
        )}

      </main>
    </>
  )
}
