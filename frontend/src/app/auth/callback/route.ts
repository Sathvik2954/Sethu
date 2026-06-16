import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/welcome'

  if (code) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('CALLBACK EXCHANGE ERROR:', error.message)
      // If it's a password reset flow, send back with error flag
      if (next === '/reset-password') {
        return NextResponse.redirect(`${origin}/reset-password?error=exchange_failed`)
      }
      return NextResponse.redirect(`${origin}/welcome`)
    }

    if (data.user) {
      // Only update email_verified_at for email confirmation flows (not password reset)
      if (next !== '/reset-password') {
        const { error: updateError } = await supabase
          .from('users')
          .update({ email_verified_at: new Date().toISOString() })
          .eq('id', data.user.id)
          .is('email_verified_at', null)

        if (updateError) {
          console.error('CALLBACK UPDATE ERROR:', updateError.message)
        } else {
          console.log('EMAIL VERIFIED FOR USER:', data.user.id)
        }
      }
    } else {
      console.error('CALLBACK: no user after exchange')
    }
  } else {
    console.error('CALLBACK: no code param in URL')
  }

  return NextResponse.redirect(`${origin}${next}`)
}