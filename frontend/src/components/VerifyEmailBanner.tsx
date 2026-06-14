'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Props = {
  email: string
  verified: boolean
  daysLeft: number
}

export default function VerifyEmailBanner({ email, verified, daysLeft }: Props) {
  const [stage, setStage] = useState<'idle' | 'sent' | 'verifying'>('idle')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const supabase = createClient()
  const router = useRouter()

  if (verified) return null

  async function sendCode() {
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    })
    if (error) {
      setError(error.message)
      return
    }
    setStage('sent')
  }

  async function verifyCode() {
    if (!code.trim()) { setError('Enter the code from your email'); return }
    setError('')
    setStage('verifying')

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: 'email',
    })

    if (verifyError) {
      setError(verifyError.message)
      setStage('sent')
      return
    }

    if (data.user) {
      await supabase
        .from('users')
        .update({ email_verified_at: new Date().toISOString() })
        .eq('id', data.user.id)
    }

    router.push('/welcome')
  }

  const inputStyle: React.CSSProperties = {
    border: '1.5px solid #C8A878', background: '#F2EDE6',
    padding: '8px 11px', fontSize: '14px', color: '#1C1208',
    outline: 'none', borderRadius: 0, fontFamily: 'inherit',
    letterSpacing: '3px', width: '170px', textAlign: 'center',
  }

  return (
    <div style={{
      border: '1.5px solid #D94F00', background: '#FDFAF5',
      padding: '12px 16px', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap',
      marginBottom: '4px',
    }}>
      <div style={{ flex: 1, minWidth: '220px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#1C1208', letterSpacing: '0.5px' }}>
          Verify your email address
        </div>
        <div style={{ fontSize: '10px', color: '#8A6A4A', marginTop: '2px' }}>
          {stage === 'idle' && `Confirm ${email}. `}
          {stage !== 'idle' && `A verification code was sent to ${email}. `}
          {daysLeft <= 3
            ? <span style={{ color: '#D94F00', fontWeight: 700 }}>Verify within {daysLeft} day{daysLeft === 1 ? '' : 's'} or your account will be removed.</span>
            : `Verify within ${daysLeft} days or your account will be removed.`}
          {error && <span style={{ color: '#D94F00' }}> {error}</span>}
        </div>
      </div>

      {stage === 'idle' && (
        <button
          type="button"
          onClick={sendCode}
          style={{
            background: '#1C1208', color: '#F2EDE6', border: 'none',
            padding: '9px 18px', fontSize: '9px', fontWeight: 700,
            letterSpacing: '1.5px', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
          }}
        >
          SEND VERIFICATION CODE
        </button>
      )}

      {(stage === 'sent' || stage === 'verifying') && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
            onKeyDown={e => e.key === 'Enter' && verifyCode()}
            placeholder="00000000"
            style={inputStyle}
          />
          <button
            type="button"
            onClick={verifyCode}
            disabled={stage === 'verifying'}
            style={{
              background: stage === 'verifying' ? '#8A6A4A' : '#1C1208',
              color: '#F2EDE6', border: 'none',
              padding: '9px 18px', fontSize: '9px', fontWeight: 700,
              letterSpacing: '1.5px',
              cursor: stage === 'verifying' ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {stage === 'verifying' ? 'VERIFYING...' : 'VERIFY'}
          </button>
          <span
            onClick={sendCode}
            style={{ fontSize: '9px', color: '#8A6A4A', letterSpacing: '1px', cursor: 'pointer', textDecoration: 'underline' }}
          >
            RESEND
          </span>
        </div>
      )}
    </div>
  )
}