'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Logo from '@/components/Logo'
import FloatingShapes from '@/components/FloatingShapes'

const DEPARTMENTS = [
  'CSE', 'AIML', 'CET', 'AIDS', 'IT',
  'ECE', 'EEE', 'MECH', 'CIVIL', 'BIO TECH',
]

function passwordChecks(pwd: string) {
  return {
    length: pwd.length >= 8,
    cases: /[A-Z]/.test(pwd) && /[a-z]/.test(pwd),
    numberSymbol: /[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd),
  }
}

export default function SignupPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    roll_number: '',
    department: '',
    year: '',
    section: '',
  })

  const router = useRouter()
  const supabase = createClient()

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const checks = passwordChecks(form.password)
  const passScore = Object.values(checks).filter(Boolean).length

  function goToStep2() {
    if (!form.full_name.trim()) { setError('Full name is required'); return }
    if (!form.email.trim()) { setError('Email is required'); return }
    if (!form.password) { setError('Password is required'); return }
    if (!checks.length || !checks.cases || !checks.numberSymbol) {
      setError('Password does not meet all requirements below')
      return
    }
    if (form.password !== form.confirm_password) { setError('Passwords do not match'); return }
    setError('')
    setStep(2)
  }

  async function handleSubmit() {
    if (!form.roll_number.trim()) { setError('Roll number is required'); return }
    if (!form.department) { setError('Department is required'); return }
    if (!form.year) { setError('Year is required'); return }
    if (!form.section) { setError('Section is required'); return }

    setLoading(true)
    setError('')

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      })

      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }

      if (!data.user) {
        setError('Signup failed — no user returned. Try again.')
        setLoading(false)
        return
      }

      const { error: dbError } = await supabase.from('users').insert({
        id: data.user.id,
        full_name: form.full_name,
        email: form.email,
        role: 'student',
        department: form.department,
        roll_number: form.roll_number,
        year: parseInt(form.year),
        section: form.section,
      })

      if (dbError) {
        setError('Profile save failed: ' + dbError.message)
        setLoading(false)
        return
      }

      router.push('/dashboard')
      router.refresh()

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError('Unexpected error: ' + message)
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    border: '1.5px solid #C8A878',
    background: '#F2EDE6',
    padding: '10px 12px',
    fontSize: '13px',
    color: '#1C1208',
    outline: 'none',
    borderRadius: 0,
    fontFamily: 'inherit',
    display: 'block',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '9px',
    fontWeight: 700,
    letterSpacing: '1.5px',
    color: '#6A4A2A',
    marginBottom: '6px',
    display: 'block',
  }

  const btnPrimary: React.CSSProperties = {
    width: '100%',
    background: loading ? '#8A6A4A' : '#1C1208',
    color: '#F2EDE6',
    border: 'none',
    padding: '12px',
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '2px',
    cursor: loading ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit',
  }

  const reqRowStyle = (ok: boolean): React.CSSProperties => ({
    fontSize: '10px',
    color: ok ? '#3D7A50' : '#8A6A4A',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  })

  return (
    <main style={{
      minHeight: '100vh',
      width: '100%',
      background: '#F2EDE6',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      padding: 'clamp(24px, 8vw, 40px) clamp(16px, 5vw, 24px)',
      position: 'relative', overflowX: 'hidden', overflowY: 'auto',
    }}>
      <FloatingShapes />

      <div style={{
        width: '100%', maxWidth: '480px',
        opacity: 0, animation: 'sethuFadeUp 0.5s ease-out forwards',
      }}>

        {/* Wordmark */}
        <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <Logo variant="light" size={48} />
          <div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#1C1208', letterSpacing: '4px', lineHeight: 1 }}>SETHU</div>
            <div style={{ fontSize: '10px', color: '#8A6A4A', letterSpacing: '1.5px', marginTop: '6px' }}>
              CBIT CAMPUS MANAGEMENT
            </div>
          </div>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', marginBottom: '20px', border: '1.5px solid #1C1208' }}>
          {['01 — ACCOUNT', '02 — DETAILS'].map((label, i) => (
            <div key={i} style={{
              flex: 1,
              padding: '8px',
              textAlign: 'center',
              fontSize: '9px',
              fontWeight: 700,
              letterSpacing: '1.5px',
              background: step === i + 1 ? '#1C1208' : '#F2EDE6',
              color: step === i + 1 ? '#F2EDE6' : '#8A6A4A',
              borderRight: i === 0 ? '1.5px solid #1C1208' : 'none',
            }}>
              {label}
            </div>
          ))}
        </div>

        {/* Box */}
        <div style={{ border: '1.5px solid #1C1208', background: '#FDFAF5' }}>

          {/* Box header */}
          <div style={{
            borderBottom: '1.5px solid #1C1208',
            padding: '12px 20px',
            fontSize: '9px',
            fontWeight: 700,
            letterSpacing: '2px',
            color: '#8A6A4A',
          }}>
            {step === 1 ? 'CREATE ACCOUNT' : 'STUDENT DETAILS'}
          </div>

          <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* ── STEP 1 ── */}
            {step === 1 && (
              <>
                <div>
                  <label style={labelStyle}>FULL NAME</label>
                  <input
                    type="text"
                    value={form.full_name}
                    onChange={e => update('full_name', e.target.value)}
                    placeholder="Enter your full name"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>EMAIL</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => update('email', e.target.value)}
                    placeholder="Enter your email address"
                    style={inputStyle}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>PASSWORD</label>
                    <input
                      type="password"
                      value={form.password}
                      onChange={e => update('password', e.target.value)}
                      placeholder="Create a password"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>CONFIRM PASSWORD</label>
                    <input
                      type="password"
                      value={form.confirm_password}
                      onChange={e => update('confirm_password', e.target.value)}
                      placeholder="Re-enter password"
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Strength meter */}
                <div>
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                    {[1, 2, 3].map(seg => (
                      <div key={seg} style={{
                        flex: 1, height: '4px',
                        background:
                          passScore >= seg
                            ? (passScore === 1 ? '#D94F00' : passScore === 2 ? '#E8C87A' : '#3D7A50')
                            : '#E0D0B8',
                      }} />
                    ))}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <div style={reqRowStyle(checks.length)}>
                      <span>{checks.length ? '✓' : '—'}</span>
                      <span>Minimum 8 characters</span>
                    </div>
                    <div style={reqRowStyle(checks.cases)}>
                      <span>{checks.cases ? '✓' : '—'}</span>
                      <span>Upper &amp; lowercase letters</span>
                    </div>
                    <div style={reqRowStyle(checks.numberSymbol)}>
                      <span>{checks.numberSymbol ? '✓' : '—'}</span>
                      <span>A number and a symbol</span>
                    </div>
                  </div>
                </div>

                {error && (
                  <div style={{ fontSize: '11px', color: '#D94F00', borderLeft: '2px solid #D94F00', paddingLeft: '10px' }}>
                    {error}
                  </div>
                )}

                <button
                  type="button"
                  onClick={goToStep2}
                  style={btnPrimary}
                >
                  NEXT →
                </button>
              </>
            )}

            {/* ── STEP 2 ── */}
            {step === 2 && (
              <>
                <div>
                  <label style={labelStyle}>ROLL NUMBER</label>
                  <input
                    type="text"
                    value={form.roll_number}
                    onChange={e => update('roll_number', e.target.value)}
                    placeholder="160122737XXX"
                    style={inputStyle}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>DEPARTMENT</label>
                    <select
                      value={form.department}
                      onChange={e => update('department', e.target.value)}
                      style={{ ...inputStyle, cursor: 'pointer' }}
                    >
                      <option value="">Select</option>
                      {DEPARTMENTS.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>YEAR</label>
                    <select
                      value={form.year}
                      onChange={e => update('year', e.target.value)}
                      style={{ ...inputStyle, cursor: 'pointer' }}
                    >
                      <option value="">Select</option>
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>
                  </div>
                </div>

                {/* Section — numeric dropdown */}
                <div>
                  <label style={labelStyle}>SECTION</label>
                  <select
                    value={form.section}
                    onChange={e => update('section', e.target.value)}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    <option value="">Select</option>
                    <option value="1">Section 1</option>
                    <option value="2">Section 2</option>
                    <option value="3">Section 3</option>
                    <option value="4">Section 4</option>
                    <option value="5">Section 5</option>
                    <option value="6">Section 6</option>
                  </select>
                </div>

                {error && (
                  <div style={{ fontSize: '11px', color: '#D94F00', borderLeft: '2px solid #D94F00', paddingLeft: '10px' }}>
                    {error}
                  </div>
                )}

                <div style={{ display: 'flex' }}>
                  <button
                    type="button"
                    onClick={() => { setStep(1); setError('') }}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      color: '#1C1208',
                      border: '1.5px solid #1C1208',
                      borderRight: 'none',
                      padding: '12px',
                      fontSize: '10px',
                      fontWeight: 700,
                      letterSpacing: '2px',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    ← BACK
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    style={{
                      flex: 2,
                      background: loading ? '#8A6A4A' : '#1C1208',
                      color: '#F2EDE6',
                      border: '1.5px solid #1C1208',
                      padding: '12px',
                      fontSize: '10px',
                      fontWeight: 700,
                      letterSpacing: '2px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    {loading ? 'CREATING...' : 'CREATE ACCOUNT →'}
                  </button>
                </div>
              </>
            )}

          </div>
        </div>

        <div style={{ marginTop: '16px', fontSize: '11px', color: '#8A6A4A', textAlign: 'center' }}>
          Already have an account?{' '}
          <a href="/login" style={{ color: '#D94F00', textDecoration: 'none', fontWeight: 700 }}>
            SIGN IN
          </a>
        </div>

      </div>
    </main>
  )
}