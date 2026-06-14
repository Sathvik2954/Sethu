'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Props = {
  email: string
  verified: boolean
}

export default function VerifyEmailBanner({ email, verified }: Props) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState('')
  const supabase = createClient()

  if (verified) return null

  async function sendVerification() {
    setStatus('sending')
    setError('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        shouldCreateUser: false,
      },
    })

    if (error) {
      setError(error.message)
      setStatus('error')
      return
    }

    setStatus('sent')
  }

  return (
    <div style={{
      border: '1.5px solid #D94F00', background: '#FDFAF5',
      padding: '12px 16px', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap',
      marginBottom: '4px',
    }}>
      <div>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#1C1208', letterSpacing: '0.5px' }}>
          Verify your email address
        </div>
        <div style={{ fontSize: '10px', color: '#8A6A4A', marginTop: '2px' }}>
          {status === 'sent'
            ? `Verification link sent to ${email} — check your inbox.`
            : `Confirm ${email} to secure your SETHU account.`}
          {error && <span style={{ color: '#D94F00' }}> {error}</span>}
        </div>
      </div>
      <button
        type="button"
        onClick={sendVerification}
        disabled={status === 'sending' || status === 'sent'}
        style={{
          background: '#1C1208', color: '#F2EDE6', border: 'none',
          padding: '9px 18px', fontSize: '9px', fontWeight: 700,
          letterSpacing: '1.5px',
          cursor: status === 'idle' || status === 'error' ? 'pointer' : 'default',
          fontFamily: 'inherit', flexShrink: 0,
        }}
      >
        {status === 'sending' ? 'SENDING...' : status === 'sent' ? 'SENT ✓' : 'SEND VERIFICATION EMAIL'}
      </button>
    </div>
  )
}