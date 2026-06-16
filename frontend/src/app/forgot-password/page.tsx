'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Logo from '@/components/Logo'
import FloatingShapes from '@/components/FloatingShapes'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const supabase = createClient()

  async function handleSend() {
    if (!email.trim()) { setError('Email is required'); return }
    if (!email.includes('@')) { setError('Enter a valid email address'); return }

    setLoading(true)
    setError('')

    // Use implicit flow (not PKCE) so no code-verifier cookie is needed.
    // This sends a hash-based link: /reset-password#access_token=...&type=recovery
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
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
      position: 'relative', overflowX: 'hidden', overflowY: 'auto',
      padding: '40px 0',
    }}>
      <FloatingShapes />

      <div style={{
        width: '100%', maxWidth: '400px', padding: '0 clamp(16px, 5vw, 24px)',
        opacity: 0, animation: 'sethuFadeUp 0.5s ease-out forwards',
      }}>

        <div style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
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
            fontSize: '9px', fontWeight: 700, letterSpacing: '2px', color: '#8A6A4A',
          }}>
            RESET PASSWORD
          </div>

          <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {sent ? (
              <>
                <div style={{
                  padding: '16px', background: '#F2EDE6',
                  border: '1.5px solid #3D7A50', borderLeft: '4px solid #3D7A50',
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#3D7A50', letterSpacing: '1px', marginBottom: '6px' }}>
                    CHECK YOUR EMAIL
                  </div>
                  <div style={{ fontSize: '12px', color: '#1C1208', lineHeight: 1.6 }}>
                    We sent a reset link to <strong>{email}</strong>. Click the link in that email to set a new password.
                  </div>
                  <div style={{ fontSize: '10px', color: '#8A6A4A', marginTop: '10px' }}>
                    Didn't receive it? Check your spam folder or wait a minute before trying again.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setSent(false); setEmail('') }}
                  style={{
                    width: '100%', background: 'transparent',
                    color: '#1C1208', border: '1.5px solid #1C1208',
                    padding: '12px', fontSize: '10px', fontWeight: 700,
                    letterSpacing: '2px', cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  RESEND EMAIL
                </button>
              </>
            ) : (
              <>
                <div style={{ fontSize: '12px', color: '#6A4A2A', lineHeight: 1.6 }}>
                  Enter the email address linked to your SETHU account. We'll send you a link to reset your password.
                </div>
                <div>
                  <label style={labelStyle}>EMAIL ADDRESS</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError('') }}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    placeholder="you@cbit.ac.in"
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
                  onClick={handleSend}
                  disabled={loading}
                  style={{
                    width: '100%', background: loading ? '#8A6A4A' : '#1C1208',
                    color: '#F2EDE6', border: 'none', padding: '12px',
                    fontSize: '10px', fontWeight: 700, letterSpacing: '2px',
                    cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                  }}
                >
                  {loading ? 'SENDING...' : 'SEND RESET LINK →'}
                </button>
              </>
            )}

          </div>
        </div>

        <div style={{ marginTop: '16px', fontSize: '11px', color: '#8A6A4A', textAlign: 'center' }}>
          <a href="/login" style={{ color: '#D94F00', textDecoration: 'none', fontWeight: 700 }}>
            ← BACK TO SIGN IN
          </a>
        </div>

      </div>
    </main>
  )
}