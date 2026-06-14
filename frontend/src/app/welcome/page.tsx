import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import Logo from '@/components/Logo'
import FloatingShapes from '@/components/FloatingShapes'

export default async function WelcomePage() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const firstName = (profile?.full_name ?? 'Student').split(' ')[0]

  return (
    <main style={{
      minHeight: '100vh', width: '100%',
      background: '#F2EDE6', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      position: 'relative', overflow: 'hidden',
      padding: '40px 24px',
    }}>
      <FloatingShapes />

      <div style={{
        width: '100%', maxWidth: '440px', textAlign: 'center',
        opacity: 0, animation: 'sethuFadeUp 0.5s ease-out forwards',
      }}>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <Logo variant="light" size={64} />
        </div>

        <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '3px', color: '#D94F00', marginBottom: '16px' }}>
          EMAIL VERIFIED
        </div>

        <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#1C1208', letterSpacing: '1px', margin: 0, lineHeight: 1.2 }}>
          Welcome to SETHU, {firstName}
        </h1>

        <div style={{ height: '3px', width: '48px', background: '#D94F00', margin: '20px auto 24px' }} />

        <p style={{ fontSize: '13px', color: '#6A4A2A', lineHeight: 1.7, marginBottom: '32px' }}>
          Your account is verified and ready. Thank you for joining SETHU —
          CBIT&apos;s unified platform for academic planning, AI-powered
          study prioritisation, and digital administrative workflows.
        </p>

        <Link href="/dashboard" style={{
          display: 'inline-block', padding: '13px 32px',
          fontSize: '10px', fontWeight: 700, letterSpacing: '2px',
          color: '#F2EDE6', background: '#1C1208',
          border: '1.5px solid #1C1208', textDecoration: 'none',
        }}>
          GO TO DASHBOARD →
        </Link>

      </div>
    </main>
  )
}