import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'

export default async function NotificationsLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('users').select('full_name, department, year, section, role').eq('id', user.id).single()
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F2EDE6', fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
      <Sidebar fullName={profile?.full_name ?? 'User'} department={profile?.department ?? ''} year={profile?.year ?? null} section={profile?.section ?? null} role={profile?.role ?? 'student'} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>{children}</div>
    </div>
  )
}