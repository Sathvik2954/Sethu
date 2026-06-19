'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type SidebarProps = {
  fullName: string
  department: string
  year: number | null
  role?: string
  section?: string | null
}

type NavItem = { label: string; href: string; external?: boolean }
type NavGroup = { group: string; items: NavItem[] }

function getNav(role: string): NavGroup[] {
  switch (role) {
    case 'student':
      return [
        { group: 'ACADEMIC', items: [
          { label: 'Dashboard',  href: '/dashboard' },
          { label: 'Timetable', href: '/timetable' },
          { label: 'Subjects',  href: '/subjects' },
          { label: 'Deadlines', href: '/deadlines' },
        ]},
        { group: 'INTELLIGENCE', items: [
          { label: 'AI Planner', href: '/planner' },
        ]},
        { group: 'SERVICES', items: [
          { label: 'Requests',  href: '/requests' },
          { label: 'Documents', href: '/documents' },
        ]},
        { group: 'EXPLORE', items: [
          { label: 'Jobs', href: 'https://job-recommender-sigma.vercel.app/', external: true },
        ]},
      ]

    case 'faculty':
      return [
        { group: 'OVERVIEW', items: [
          { label: 'Dashboard',      href: '/dashboard' },
          { label: 'Notifications',  href: '/notifications' },
        ]},
        { group: 'MANAGE', items: [
          { label: 'Timetable',  href: '/timetable' },
          { label: 'Subjects',   href: '/subjects' },
          { label: 'Deadlines',  href: '/deadlines' },
        ]},
        { group: 'APPROVALS', items: [
          { label: 'Requests',  href: '/approvals' },
          { label: 'Documents', href: '/documents' },
        ]},
        { group: 'EXPLORE', items: [
          { label: 'Jobs', href: 'https://job-recommender-sigma.vercel.app/', external: true },
        ]},
      ]

    case 'hod':
      return [
        { group: 'OVERVIEW', items: [
          { label: 'Dashboard',     href: '/dashboard' },
          { label: 'Notifications', href: '/notifications' },
        ]},
        { group: 'MANAGE', items: [
          { label: 'Timetable', href: '/timetable' },
          { label: 'Subjects',  href: '/subjects' },
          { label: 'Deadlines', href: '/deadlines' },
        ]},
        { group: 'APPROVALS', items: [
          { label: 'Requests',  href: '/approvals' },
          { label: 'Documents', href: '/documents' },
        ]},
        { group: 'EXPLORE', items: [
          { label: 'Jobs', href: 'https://job-recommender-sigma.vercel.app/', external: true },
        ]},
      ]

    case 'admin':
      return [
        { group: 'OVERVIEW', items: [
          { label: 'Dashboard',     href: '/dashboard' },
          { label: 'Notifications', href: '/notifications' },
        ]},
        { group: 'INSTITUTION', items: [
          { label: 'Approvals',  href: '/approvals' },
          { label: 'Documents',  href: '/documents' },
          { label: 'Deadlines',  href: '/deadlines' },
        ]},
        { group: 'EXPLORE', items: [
          { label: 'Jobs', href: 'https://job-recommender-sigma.vercel.app/', external: true },
        ]},
      ]

    default:
      return []
  }
}

function roleLabel(role: string, year: number | null, section: string | null | undefined): string {
  if (role === 'student' && year) {
    const suffix = ['ST','ND','RD','TH'][year - 1] ?? 'TH'
    return `${year}${suffix} YEAR${section ? ` · SEC ${section}` : ''}`
  }
  return role.toUpperCase()
}

function roleBadgeColor(role: string): string {
  switch (role) {
    case 'admin':   return '#D94F00'
    case 'hod':     return '#3D7A50'
    case 'faculty': return '#8A6A4A'
    default:        return '#D94F00' // student
  }
}

export default function Sidebar({ fullName, department, year, role = 'student', section }: SidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()
  const [expanded, setExpanded] = useState(false)

  const NAV = getNav(role)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {expanded && (
        <div className="sethu-backdrop" onClick={() => setExpanded(false)} />
      )}

      <aside className={`sethu-sidebar ${expanded ? 'sethu-sidebar-expanded' : ''}`} style={{
        width: 'clamp(64px, 16vw, 200px)', minWidth: '64px', background: '#1C1208',
        display: 'flex', flexDirection: 'column', minHeight: '100vh', flexShrink: 0,
      }}>

        {/* Wordmark */}
        <div style={{
          padding: '22px 20px 18px', borderBottom: '1px solid #2E1E10',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        }}>
          <div className="sethu-wordmark-full">
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#F2EDE6', letterSpacing: '3px' }}>
              SETHU
            </div>
            <div style={{ width: '28px', height: '2px', background: '#D94F00', margin: '8px 0 0' }} />
            <div style={{ fontSize: '8px', color: '#6A4A2A', letterSpacing: '1.5px', marginTop: '8px' }}>
              CBIT · {department || 'CAMPUS'}
            </div>
          </div>
          <div className="sethu-wordmark-collapsed" style={{ fontSize: '18px', fontWeight: 700, color: '#F2EDE6' }}>
            S
          </div>
          <button
            type="button"
            className="sethu-sidebar-toggle"
            onClick={() => setExpanded(e => !e)}
            aria-label="Toggle menu"
            style={{
              background: 'transparent', border: '1px solid #4A3020', color: '#C8A878',
              width: '28px', height: '28px', fontSize: '13px', cursor: 'pointer',
              flexShrink: 0, lineHeight: 1, fontFamily: 'inherit',
            }}
          >
            {expanded ? '✕' : '☰'}
          </button>
        </div>

        {/* Role badge */}
        <div className="sethu-nav-label" style={{
          margin: '10px 20px 0',
          display: 'inline-flex', alignSelf: 'flex-start',
          background: roleBadgeColor(role),
          color: '#F2EDE6', fontSize: '7px', fontWeight: 700,
          letterSpacing: '1.5px', padding: '3px 8px',
        }}>
          {role.toUpperCase()}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '6px 0' }}>
          {NAV.map(group => (
            <div key={group.group}>
              <div className="sethu-nav-label" style={{
                fontSize: '8px', letterSpacing: '2px', color: '#4A3020',
                padding: '12px 20px 4px', fontWeight: 700,
              }}>
                {group.group}
              </div>
              {group.items.map(item => {
                const active = !item.external && pathname === item.href
                const linkProps = item.external
                  ? { href: item.href, target: '_blank', rel: 'noopener noreferrer' }
                  : { href: item.href }

                return (
                  <Link
                    key={item.href}
                    {...linkProps}
                    className="sethu-nav-link"
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '8px 20px', fontSize: '11px', letterSpacing: '0.5px',
                      textDecoration: 'none',
                      color: active ? '#F2EDE6' : item.external ? '#C8A878' : '#8A6A4A',
                      background: active ? '#261A0A' : 'transparent',
                      borderLeft: active ? '2px solid #D94F00' : '2px solid transparent',
                      fontWeight: active ? 700 : 400,
                    }}
                  >
                    <span className="sethu-nav-icon" style={{
                      width: '20px', height: '20px', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '10px', fontWeight: 700,
                      border: '1px solid currentColor', borderRadius: '3px',
                    }}>
                      {item.external ? '↗' : item.label.charAt(0)}
                    </span>
                    <span className="sethu-nav-label">
                      {item.label}{item.external ? ' ↗' : ''}
                    </span>
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
              width: '26px', height: '26px', background: roleBadgeColor(role),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '10px', fontWeight: 700, color: '#F2EDE6', flexShrink: 0,
            }}>
              {fullName.charAt(0).toUpperCase()}
            </div>
            <div className="sethu-nav-label" style={{ overflow: 'hidden' }}>
              <div style={{
                fontSize: '11px', color: '#C8A878', fontWeight: 500,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {fullName}
              </div>
              <div style={{ fontSize: '8px', color: '#4A3020', letterSpacing: '1px' }}>
                {roleLabel(role, year, section)}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="sethu-nav-label"
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

      <style jsx>{`
        .sethu-sidebar-toggle { display: none; }
        .sethu-wordmark-collapsed { display: none; }
        .sethu-backdrop {
          display: none; position: fixed; inset: 0;
          background: rgba(28,18,8,0.45); z-index: 90;
        }

        @media (max-width: 1024px) and (min-width: 761px) {
          .sethu-sidebar { width: clamp(60px, 12vw, 80px) !important; }
          .sethu-wordmark-full { display: none; }
          .sethu-wordmark-collapsed { display: block; }
          .sethu-nav-label { display: none; }
          .sethu-nav-link { justify-content: center; padding: 10px 0 !important; }
        }

        @media (max-width: 760px) {
          .sethu-sidebar { width: 56px !important; min-width: 56px !important; }
          .sethu-sidebar-toggle { display: flex; align-items: center; justify-content: center; }
          .sethu-wordmark-full { display: none; }
          .sethu-wordmark-collapsed { display: block; }
          .sethu-nav-label { display: none; }
          .sethu-nav-link { justify-content: center; padding: 10px 0 !important; }
          .sethu-backdrop { display: block; }

          .sethu-sidebar-expanded {
            position: fixed; top: 0; left: 0;
            width: min(220px, 80vw) !important; min-width: 0 !important;
            height: 100vh; z-index: 100;
            box-shadow: 4px 0 16px rgba(0,0,0,0.3);
          }
          .sethu-sidebar-expanded .sethu-wordmark-full { display: block; }
          .sethu-sidebar-expanded .sethu-wordmark-collapsed { display: none; }
          .sethu-sidebar-expanded .sethu-nav-label { display: block; }
          .sethu-sidebar-expanded .sethu-nav-link { justify-content: flex-start; padding: 8px 20px !important; }
          .sethu-sidebar-expanded .sethu-nav-icon { display: none; }
        }
      `}</style>
    </>
  )
}