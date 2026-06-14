import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('CALLBACK EXCHANGE ERROR:', error.message)
    }

    if (data.user) {
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
    } else {
      console.error('CALLBACK: no user after exchange, no code in URL')
    }
  } else {
    console.error('CALLBACK: no code param in URL')
  }

  return NextResponse.redirect(`${origin}/welcome`)
}