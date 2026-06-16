import { createServerSupabaseClient } from '@/lib/supabase/server'
import VerifyEmailBanner from '@/components/VerifyEmailBanner'
import DashboardTabs from '@/components/DashboardTabs'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, department, year, section, roll_number, email_verified_at, created_at, blood_group, phone_number, skills, profile_photo_url, email')
    .eq('id', user!.id)
    .single()

  const { count: subjectCount } = await supabase
    .from('subjects')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', user!.id)

  const { count: deadlineCount } = await supabase
    .from('deadlines')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', user!.id)
    .eq('is_done', false)

  const { count: requestCount } = await supabase
    .from('requests')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', user!.id)
    .in('status', ['pending', 'in_review'])

  const firstName = (profile?.full_name ?? 'Student').split(' ')[0]

  const daysSinceCreated = profile?.created_at
    ? (Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24)
    : 0
  const daysLeft = Math.max(0, Math.ceil(7 - daysSinceCreated))

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
  }).toUpperCase()

  const kpis = [
    { label: 'SUBJECTS THIS SEM', value: subjectCount ?? 0, flag: subjectCount ? 'TRACKED' : 'ADD SUBJECTS', flagColor: subjectCount ? '#3D7A50' : '#D94F00' },
    { label: 'OPEN DEADLINES', value: deadlineCount ?? 0, flag: deadlineCount ? 'PENDING' : 'ALL CLEAR', flagColor: deadlineCount ? '#E8C87A' : '#3D7A50' },
    { label: 'ACTIVE REQUESTS', value: requestCount ?? 0, flag: requestCount ? 'IN PROGRESS' : 'NONE', flagColor: requestCount ? '#E8C87A' : '#3D7A50' },
    { label: 'AI PLANNER', value: '—', flag: 'SETUP NEEDED', flagColor: '#D94F00' },
  ]

  // The overview content is server-rendered and passed as a prop into the client DashboardTabs component
  const overviewContent = (
    <>
      {/* Topbar */}
      <header style={{
        height: '48px', borderBottom: '2px solid #1C1208',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(12px, 4vw, 24px)', background: '#F2EDE6', flexShrink: 0,
        flexWrap: 'wrap', gap: '4px', minHeight: '48px',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#1C1208', letterSpacing: '0.5px' }}>
            DASHBOARD
          </span>
          <span style={{ fontSize: '11px', color: '#C8A878' }}>/</span>
          <span style={{ fontSize: '11px', color: '#8A6A4A' }}>
            {profile?.department} · {profile?.section ? `SEC ${profile.section}` : ''}
          </span>
        </div>
        <span style={{
          fontSize: '10px', color: '#6A4A2A', background: '#E8DDD0',
          padding: '4px 10px', letterSpacing: '0.5px',
        }}>
          {today}
        </span>
      </header>

      <div style={{ flex: 1, padding: 'clamp(12px, 4vw, 20px) clamp(12px, 4vw, 24px)', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        <VerifyEmailBanner
          email={user!.email!}
          verified={!!profile?.email_verified_at}
          daysLeft={daysLeft}
        />

        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#1C1208', margin: 0, letterSpacing: '0.5px' }}>
            {greeting()}, {firstName}
          </h1>
          <p style={{ fontSize: '11px', color: '#8A6A4A', margin: '4px 0 0', letterSpacing: '0.5px' }}>
            ROLL NO {profile?.roll_number ?? '—'}
          </p>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '8px',
        }}>
          {kpis.map((kpi) => (
            <div key={kpi.label} style={{ padding: '14px 16px', border: '1.5px solid #1C1208' }}>
              <div style={{ fontSize: '9px', letterSpacing: '1.5px', color: '#8A6A4A', marginBottom: '8px', fontWeight: 700 }}>
                {kpi.label}
              </div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#1C1208', lineHeight: 1 }}>
                {kpi.value}
              </div>
              <span style={{
                fontSize: '8px', letterSpacing: '1px', marginTop: '6px',
                display: 'inline-block', padding: '2px 6px', fontWeight: 700,
                background: kpi.flagColor,
                color: kpi.flagColor === '#E8C87A' ? '#1C1208' : '#F2EDE6',
              }}>
                {kpi.flag}
              </span>
            </div>
          ))}
        </div>

        <div style={{ border: '1.5px solid #1C1208', background: '#FDFAF5' }}>
          <div style={{
            borderBottom: '1px solid #D4C8B8', padding: '12px 18px',
            fontSize: '9px', fontWeight: 700, letterSpacing: '2px', color: '#8A6A4A',
          }}>
            GET SET UP
          </div>
          <div style={{ padding: '18px' }}>
            {[
              { num: '01', title: 'Add your subjects', desc: 'Register this semester\'s subjects with difficulty and exam dates — this powers the AI planner.', done: (subjectCount ?? 0) > 0 },
              { num: '02', title: 'Build your timetable', desc: 'Add your weekly class schedule so SETHU can detect your free slots.', done: false },
              { num: '03', title: 'Run the AI planner', desc: 'Once subjects and timetable exist, Mistral generates your daily study priorities.', done: false },
            ].map((s, i) => (
              <div key={s.num} style={{
                display: 'flex', gap: '14px', alignItems: 'flex-start',
                padding: '12px 0',
                borderBottom: i < 2 ? '1px solid #EDE0CC' : 'none',
              }}>
                <div style={{
                  fontSize: '11px', fontWeight: 700,
                  color: s.done ? '#3D7A50' : '#D94F00',
                  letterSpacing: '1px', minWidth: '24px',
                }}>
                  {s.done ? '✓' : s.num}
                </div>
                <div>
                  <div style={{
                    fontSize: '12px', fontWeight: 700, color: '#1C1208',
                    letterSpacing: '0.5px',
                    textDecoration: s.done ? 'line-through' : 'none',
                  }}>
                    {s.title}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6A4A2A', marginTop: '3px', lineHeight: 1.5 }}>
                    {s.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  )

  return (
    <DashboardTabs
      profile={{
        id: user!.id,
        full_name: profile?.full_name ?? '',
        email: profile?.email ?? user!.email ?? '',
        department: profile?.department ?? '',
        year: profile?.year ?? null,
        section: profile?.section ?? null,
        roll_number: profile?.roll_number ?? null,
        blood_group: profile?.blood_group ?? null,
        phone_number: profile?.phone_number ?? null,
        skills: profile?.skills ?? null,
        profile_photo_url: profile?.profile_photo_url ?? null,
        email_verified_at: profile?.email_verified_at ?? null,
        created_at: profile?.created_at ?? '',
      }}
      userId={user!.id}
      overviewContent={overviewContent}
    />
  )
}