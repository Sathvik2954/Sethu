'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type SidebarProps = {
  fullName: string
  department: string
  year: number | null
}

const NAV = [
  { group: 'ACADEMIC', items: [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Timetable', href: '/timetable' },
    { label: 'Subjects', href: '/subjects' },
    { label: 'Deadlines', href: '/deadlines' },
  ]},
  { group: 'INTELLIGENCE', items: [
    { label: 'AI Planner', href: '/planner' },
  ]},
  { group: 'SERVICES', items: [
    { label: 'Requests', href: '/requests' },
    { label: 'Documents', href: '/documents' },
  ]},
]

export default function Sidebar({ fullName, department, year }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const yearLabel = year ? `${year}${['ST','ND','RD','TH'][year - 1] || 'TH'} YEAR` : ''

  return (
    <aside style={{
      width: '200px', minWidth: '200px', background: '#1C1208',
      display: 'flex', flexDirection: 'column', minHeight: '100vh',
    }}>

      {/* Wordmark */}
      <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid #2E1E10' }}>
        <div style={{ fontSize: '20px', fontWeight: 700, color: '#F2EDE6', letterSpacing: '3px' }}>
          SETHU
        </div>
        <div style={{ width: '28px', height: '2px', background: '#D94F00', margin: '8px 0 0' }} />
        <div style={{ fontSize: '8px', color: '#6A4A2A', letterSpacing: '1.5px', marginTop: '8px' }}>
          CBIT · {department}
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 0' }}>
        {NAV.map(group => (
          <div key={group.group}>
            <div style={{
              fontSize: '8px', letterSpacing: '2px', color: '#4A3020',
              padding: '14px 20px 5px', fontWeight: 700,
            }}>
              {group.group}
            </div>
            {group.items.map(item => {
              const active = pathname === item.href
              return (
                <Link key={item.href} href={item.href} style={{
                  display: 'block',
                  padding: '8px 20px',
                  fontSize: '11px',
                  letterSpacing: '0.5px',
                  textDecoration: 'none',
                  color: active ? '#F2EDE6' : '#8A6A4A',
                  background: active ? '#261A0A' : 'transparent',
                  borderLeft: active ? '2px solid #D94F00' : '2px solid transparent',
                  fontWeight: active ? 700 : 400,
                }}>
                  {item.label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid #2E1E10' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '12px' }}>
          <div style={{
            width: '26px', height: '26px', background: '#D94F00',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '10px', fontWeight: 700, color: '#F2EDE6', flexShrink: 0,
          }}>
            {fullName.charAt(0).toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{
              fontSize: '11px', color: '#C8A878', fontWeight: 500,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {fullName}
            </div>
            <div style={{ fontSize: '8px', color: '#4A3020', letterSpacing: '1px' }}>
              {yearLabel}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          style={{
            width: '100%', background: 'transparent',
            border: '1px solid #4A3020', color: '#8A6A4A',
            padding: '7px', fontSize: '8px', fontWeight: 700,
            letterSpacing: '2px', cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          SIGN OUT
        </button>
      </div>

    </aside>
  )
}
