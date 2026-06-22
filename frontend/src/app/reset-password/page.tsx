'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Logo from '@/components/Logo'
import FloatingShapes from '@/components/FloatingShapes'

function passwordChecks(pwd: string) {
  return {
    length: pwd.length >= 8,
    cases: /[A-Z]/.test(pwd) && /[a-z]/.test(pwd),
    numberSymbol: /[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd),
  }
}

type Stage = 'verifying' | 'ready' | 'invalid' | 'done'

function ResetForm() {
  const [stage, setStage] = useState<Stage>('verifying')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    // If callback route failed it appends ?error=...
    const err = searchParams.get('error')
    if (err) { setStage('invalid'); return }

    // Otherwise the session is already in cookies from /auth/callback
    // Just verify we actually have a session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setStage('ready')
      } else {
        setStage('invalid')
      }
    })
  }, [])

  const checks = passwordChecks(password)
  const passScore = Object.values(checks).filter(Boolean).length

  async function handleReset() {
    if (!checks.length || !checks.cases || !checks.numberSymbol) {
      setError('Password does not meet all requirements')
      return
    }
    if (password !== confirm) { setError('Passwords do not match'); return }

    setLoading(true)
    setError('')

    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(error.message); setLoading(false); return }

    setStage('done')
    setLoading(false)
    setTimeout(() => router.push('/login'), 2500)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', border: '1.5px solid #C8A878',
    background: '#F2EDE6', padding: '10px 12px',
    fontSize: '13px', color: '#1C1208',
    outline: 'none', borderRadius: 0, fontFamily: 'inherit', display: 'block',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px',
    color: '#6A4A2A', marginBottom: '6px', display: 'block',
  }
  const reqRow = (ok: boolean): React.CSSProperties => ({
    fontSize: '10px', color: ok ? '#3D7A50' : '#8A6A4A',
    display: 'flex', alignItems: 'center', gap: '6px',
  })

  return (
    <div style={{ border: '1.5px solid #1C1208', background: '#FDFAF5' }}>
      <div style={{
        borderBottom: '1.5px solid #1C1208', padding: '12px 20px',
        fontSize: '9px', fontWeight: 700, letterSpacing: '2px', color: '#8A6A4A',
      }}>
        SET NEW PASSWORD
      </div>
      <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {stage === 'verifying' && (
          <div style={{ fontSize: '12px', color: '#6A4A2A', textAlign: 'center', padding: '12px 0' }}>
            Verifying reset link...
          </div>
        )}

        {stage === 'invalid' && (
          <div style={{ padding: '16px', background: '#F2EDE6', border: '1.5px solid #D94F00', borderLeft: '4px solid #D94F00' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#D94F00', letterSpacing: '1px', marginBottom: '6px' }}>
              LINK INVALID OR EXPIRED
            </div>
            <div style={{ fontSize: '12px', color: '#1C1208', lineHeight: 1.6 }}>
              This reset link has expired or already been used. Please request a new one.
            </div>
            <a href="/forgot-password" style={{
              display: 'inline-block', marginTop: '14px', fontSize: '10px',
              fontWeight: 700, letterSpacing: '1.5px', color: '#F2EDE6',
              background: '#1C1208', padding: '10px 20px', textDecoration: 'none',
            }}>
              REQUEST NEW LINK →
            </a>
          </div>
        )}

        {stage === 'done' && (
          <div style={{ padding: '16px', background: '#F2EDE6', border: '1.5px solid #3D7A50', borderLeft: '4px solid #3D7A50' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#3D7A50', letterSpacing: '1px', marginBottom: '6px' }}>
              PASSWORD UPDATED
            </div>
            <div style={{ fontSize: '12px', color: '#1C1208', lineHeight: 1.6 }}>
              Your password has been reset. Redirecting to sign in...
            </div>
          </div>
        )}

        {stage === 'ready' && (
          <>
            <div style={{ fontSize: '12px', color: '#6A4A2A', lineHeight: 1.6 }}>
              Choose a strong new password for your SETHU account.
            </div>
            <div>
              <label style={labelStyle}>NEW PASSWORD</label>
              <input type="password" value={password} onChange={e => { setPassword(e.target.value); setError('') }} placeholder="min 8 chars" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>CONFIRM PASSWORD</label>
              <input type="password" value={confirm} onChange={e => { setConfirm(e.target.value); setError('') }} onKeyDown={e => e.key === 'Enter' && handleReset()} placeholder="repeat" style={inputStyle} />
            </div>
            <div>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                {[1, 2, 3].map(seg => (
                  <div key={seg} style={{
                    flex: 1, height: '4px',
                    background: passScore >= seg ? (passScore === 1 ? '#D94F00' : passScore === 2 ? '#E8C87A' : '#3D7A50') : '#E0D0B8',
                  }} />
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <div style={reqRow(checks.length)}><span>{checks.length ? '✓' : '-'}</span><span>Minimum 8 characters</span></div>
                <div style={reqRow(checks.cases)}><span>{checks.cases ? '✓' : '-'}</span><span>Upper &amp; lowercase letters</span></div>
                <div style={reqRow(checks.numberSymbol)}><span>{checks.numberSymbol ? '✓' : '-'}</span><span>A number and a symbol</span></div>
              </div>
            </div>
            {error && (
              <div style={{ fontSize: '11px', color: '#D94F00', borderLeft: '2px solid #D94F00', paddingLeft: '10px' }}>{error}</div>
            )}
            <button type="button" onClick={handleReset} disabled={loading} style={{
              width: '100%', background: loading ? '#8A6A4A' : '#1C1208',
              color: '#F2EDE6', border: 'none', padding: '12px',
              fontSize: '10px', fontWeight: 700, letterSpacing: '2px',
              cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            }}>
              {loading ? 'UPDATING...' : 'UPDATE PASSWORD →'}
            </button>
          </>
        )}

      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <main style={{
      minHeight: '100vh', width: '100%', background: '#F2EDE6',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      position: 'relative', overflowX: 'hidden', overflowY: 'auto', padding: '40px 0',
    }}>
      <FloatingShapes />
      <div style={{
        width: '100%', maxWidth: '400px', padding: '0 clamp(16px, 5vw, 24px)',
        opacity: 0, animation: 'sethuFadeUp 0.5s ease-out forwards',
      }}>
        <div style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <Logo variant="light" size={48} />
          <div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#1C1208', letterSpacing: '4px', lineHeight: 1 }}>SETHU</div>
            <div style={{ fontSize: '10px', color: '#8A6A4A', letterSpacing: '1.5px', marginTop: '6px' }}>CBIT CAMPUS MANAGEMENT</div>
          </div>
        </div>
        <Suspense fallback={
          <div style={{ border: '1.5px solid #1C1208', background: '#FDFAF5', padding: '24px 20px', textAlign: 'center', fontSize: '12px', color: '#6A4A2A' }}>
            Loading...
          </div>
        }>
          <ResetForm />
        </Suspense>
        <div style={{ marginTop: '16px', fontSize: '11px', color: '#8A6A4A', textAlign: 'center' }}>
          <a href="/login" style={{ color: '#D94F00', textDecoration: 'none', fontWeight: 700 }}>← BACK TO SIGN IN</a>
        </div>
      </div>
    </main>
  )
}