'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

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

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirm_password) {
      setError('Passwords do not match')
      return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    // Step 1 — create auth user
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
      setError('Signup failed. Please try again.')
      setLoading(false)
      return
    }

    // Step 2 — insert into users table
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
      setError(dbError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  const inputStyle = {
    width: '100%',
    border: '1.5px solid #C8A878',
    background: '#F2EDE6',
    padding: '10px 12px',
    fontSize: '13px',
    color: '#1C1208',
    outline: 'none',
    borderRadius: 0,
    fontFamily: 'inherit',
  }

  const labelStyle = {
    fontSize: '9px',
    fontWeight: 700,
    letterSpacing: '1.5px',
    color: '#6A4A2A',
    marginBottom: '6px',
    display: 'block' as const,
  }

  const gridTwo = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  }

  return (
    <main style={{
      minHeight: '100vh',
      width: '100%',
      background: '#F2EDE6',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      padding: '40px 24px',
    }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>

        {/* Wordmark */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#1C1208', letterSpacing: '4px' }}>
            SETHU
          </div>
          <div style={{ width: '36px', height: '2px', background: '#D94F00', margin: '8px 0' }} />
          <div style={{ fontSize: '10px', color: '#8A6A4A', letterSpacing: '1.5px' }}>
            CBIT CAMPUS MANAGEMENT
          </div>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', marginBottom: '20px', border: '1.5px solid #1C1208' }}>
          {['ACCOUNT', 'DETAILS'].map((label, i) => (
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
              cursor: 'default',
            }}>
              {`0${i + 1} — ${label}`}
            </div>
          ))}
        </div>

        {/* Form box */}
        <div style={{ border: '1.5px solid #1C1208', background: '#FDFAF5' }}>
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

          <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2) } : handleSignup}
            style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {step === 1 && (
              <>
                <div>
                  <label style={labelStyle}>FULL NAME</label>
                  <input
                    type="text"
                    value={form.full_name}
                    onChange={e => update('full_name', e.target.value)}
                    required
                    placeholder="Neeharika Reddy"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>EMAIL</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => update('email', e.target.value)}
                    required
                    placeholder="you@cbit.ac.in"
                    style={inputStyle}
                  />
                </div>

                <div style={gridTwo}>
                  <div>
                    <label style={labelStyle}>PASSWORD</label>
                    <input
                      type="password"
                      value={form.password}
                      onChange={e => update('password', e.target.value)}
                      required
                      placeholder="min 6 chars"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>CONFIRM PASSWORD</label>
                    <input
                      type="password"
                      value={form.confirm_password}
                      onChange={e => update('confirm_password', e.target.value)}
                      required
                      placeholder="repeat password"
                      style={inputStyle}
                    />
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <label style={labelStyle}>ROLL NUMBER</label>
                  <input
                    type="text"
                    value={form.roll_number}
                    onChange={e => update('roll_number', e.target.value)}
                    required
                    placeholder="160122737XXX"
                    style={inputStyle}
                  />
                </div>

                <div style={gridTwo}>
                  <div>
                    <label style={labelStyle}>DEPARTMENT</label>
                    <select
                      value={form.department}
                      onChange={e => update('department', e.target.value)}
                      required
                      style={{ ...inputStyle, cursor: 'pointer' }}
                    >
                      <option value="">Select</option>
                      <option value="CSE">CSE</option>
                      <option value="AI&ML">AI & ML</option>
                      <option value="ECE">ECE</option>
                      <option value="EEE">EEE</option>
                      <option value="MECH">MECH</option>
                      <option value="CIVIL">CIVIL</option>
                      <option value="IT">IT</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>YEAR</label>
                    <select
                      value={form.year}
                      onChange={e => update('year', e.target.value)}
                      required
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

                <div>
                  <label style={labelStyle}>SECTION</label>
                  <input
                    type="text"
                    value={form.section}
                    onChange={e => update('section', e.target.value.toUpperCase())}
                    required
                    placeholder="A"
                    maxLength={2}
                    style={inputStyle}
                  />
                </div>
              </>
            )}

            {error && (
              <div style={{
                fontSize: '11px',
                color: '#D94F00',
                borderLeft: '2px solid #D94F00',
                paddingLeft: '10px',
              }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              {step === 2 && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    color: '#1C1208',
                    border: '1.5px solid #1C1208',
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
              )}
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1,
                  background: loading ? '#8A6A4A' : '#1C1208',
                  color: '#F2EDE6',
                  border: 'none',
                  padding: '12px',
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '2px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {loading ? 'CREATING...' : step === 1 ? 'NEXT →' : 'CREATE ACCOUNT →'}
              </button>
            </div>

          </form>
        </div>

        {/* Link to login */}
        <div style={{
          marginTop: '16px',
          fontSize: '11px',
          color: '#8A6A4A',
          textAlign: 'center',
        }}>
          Already have an account?{' '}
          <a href="/login" style={{ color: '#D94F00', textDecoration: 'none', fontWeight: 700 }}>
            SIGN IN
          </a>
        </div>

      </div>
    </main>
  )
}