'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Logo from '@/components/Logo'
import FloatingShapes from '@/components/FloatingShapes'

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin() {
    if (!identifier.trim()) { setError('Roll number or email is required'); return }
    if (!password) { setError('Password is required'); return }

    setLoading(true)
    setError('')

    // Step 1 — resolve roll number / email to the account's email
    let resolvedEmail = identifier.trim()

    if (!resolvedEmail.includes('@')) {
      try {
        const res = await fetch('/api/lookup-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: resolvedEmail }),
        })
        const data = await res.json()

        if (!res.ok) {
          setError(data.error ?? 'Account not found')
          setLoading(false)
          return
        }

        resolvedEmail = data.email
      } catch {
        setError('Could not verify roll number. Try signing in with email instead.')
        setLoading(false)
        return
      }
    }

    // Step 2 — sign in with the resolved email
    const { error } = await supabase.auth.signInWithPassword({
      email: resolvedEmail,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Step 3 — enforce the 7-day verification window
    try {
      const checkRes = await fetch('/api/check-verification', { method: 'POST' })
      const checkData = await checkRes.json()
      if (checkData.terminated) {
        setError('Your account was not verified within 7 days and has been removed. Please sign up again.')
        setLoading(false)
        return
      }
    } catch {
      // Non-fatal — don't block login if this check fails
    }

    router.push('/dashboard')
    router.refresh()
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', border: '1.5px solid #C8A878',
    background: '#F2EDE6', padding: '10px 12px',
    fontSize: '13px', color: '#1C1208',
    outline: 'none', borderRadius: 0, fontFamily: 'inherit',
    display: 'block',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '9px', fontWeight: 700,
    letterSpacing: '1.5px', color: '#6A4A2A',
    marginBottom: '6px', display: 'block',
  }

  return (
    <main style={{
      minHeight: '100vh', width: '100%',
      background: '#F2EDE6', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      position: 'relative', overflow: 'hidden',
    }}>
      <FloatingShapes />

      <div style={{
        width: '100%', maxWidth: '400px', padding: '0 24px',
        opacity: 0, animation: 'sethuFadeUp 0.5s ease-out forwards',
      }}>

        <div style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Logo variant="light" size={48} />
          <div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#1C1208', letterSpacing: '4px', lineHeight: 1 }}>
              SETHU
            </div>
            <div style={{ fontSize: '10px', color: '#8A6A4A', letterSpacing: '1.5px', marginTop: '6px' }}>
              CBIT CAMPUS MANAGEMENT
            </div>
          </div>
        </div>

        <div style={{ border: '1.5px solid #1C1208', background: '#FDFAF5' }}>
          <div style={{
            borderBottom: '1.5px solid #1C1208', padding: '12px 20px',
            fontSize: '9px', fontWeight: 700,
            letterSpacing: '2px', color: '#8A6A4A'
          }}>
            SIGN IN
          </div>

          <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

            <div>
              <label style={labelStyle}>ROLL NUMBER OR EMAIL</label>
              <input
                type="text"
                value={identifier}
                onChange={e => { setIdentifier(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="160122737XXX or you@cbit.ac.in"
                style={inputStyle}
              />
              <div style={{ fontSize: '9px', color: '#8A6A4A', marginTop: '5px' }}>
                You can use either to sign in
              </div>
            </div>

            <div>
              <label style={labelStyle}>PASSWORD</label>
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="••••••••"
                style={inputStyle}
              />
            </div>

            {error && (
              <div style={{ fontSize: '11px', color: '#D94F00', borderLeft: '2px solid #D94F00', paddingLeft: '10px' }}>
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleLogin}
              disabled={loading}
              style={{
                width: '100%', background: loading ? '#8A6A4A' : '#1C1208',
                color: '#F2EDE6', border: 'none', padding: '12px',
                fontSize: '10px', fontWeight: 700, letterSpacing: '2px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', marginTop: '4px'
              }}
            >
              {loading ? 'SIGNING IN...' : 'SIGN IN →'}
            </button>

          </div>
        </div>

        <div style={{ marginTop: '16px', fontSize: '11px', color: '#8A6A4A', textAlign: 'center' }}>
          No account yet?{' '}
          <a href="/signup" style={{ color: '#D94F00', textDecoration: 'none', fontWeight: 700 }}>
            CREATE ACCOUNT
          </a>
        </div>

      </div>
    </main>
  )
}