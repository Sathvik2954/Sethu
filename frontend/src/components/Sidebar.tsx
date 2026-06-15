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
}

export default function Sidebar({ fullName, department, year, role = 'student' }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [expanded, setExpanded] = useState(false)

  const NAV = role === 'student'
    ? [
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
    : [
        { group: 'STAFF', items: [
          { label: 'Approvals', href: '/approvals' },
        ]},
      ]

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const yearLabel = year ? `${year}${['ST','ND','RD','TH'][year - 1] || 'TH'} YEAR` : role.toUpperCase()

  return (
    <>
      {expanded && (
        <div className="sethu-backdrop" onClick={() => setExpanded(false)} />
      )}

      <aside className={`sethu-sidebar ${expanded ? 'sethu-sidebar-expanded' : ''}`} style={{
        width: '200px', minWidth: '200px', background: '#1C1208',
        display: 'flex', flexDirection: 'column', minHeight: '100vh',
        flexShrink: 0,
      }}>

        {/* Wordmark + mobile toggle */}
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
              CBIT · {department}
            </div>
          </div>
          <div className="sethu-wordmark-collapsed" style={{ fontSize: '18px', fontWeight: 700, color: '#F2EDE6', letterSpacing: '1px' }}>
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

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 0' }}>
          {NAV.map(group => (
            <div key={group.group}>
              <div className="sethu-nav-label" style={{
                fontSize: '8px', letterSpacing: '2px', color: '#4A3020',
                padding: '14px 20px 5px', fontWeight: 700,
              }}>
                {group.group}
              </div>
              {group.items.map(item => {
                const active = pathname === item.href
                return (
                  <Link key={item.href} href={item.href} className="sethu-nav-link" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 20px',
                    fontSize: '11px',
                    letterSpacing: '0.5px',
                    textDecoration: 'none',
                    color: active ? '#F2EDE6' : '#8A6A4A',
                    background: active ? '#261A0A' : 'transparent',
                    borderLeft: active ? '2px solid #D94F00' : '2px solid transparent',
                    fontWeight: active ? 700 : 400,
                  }}>
                    <span className="sethu-nav-icon" style={{
                      width: '20px', height: '20px', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '10px', fontWeight: 700,
                      border: '1px solid currentColor', borderRadius: '3px',
                    }}>
                      {item.label.charAt(0)}
                    </span>
                    <span className="sethu-nav-label">{item.label}</span>
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
            <div className="sethu-nav-label" style={{ overflow: 'hidden' }}>
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
        .sethu-sidebar-toggle {
          display: none;
        }
        .sethu-wordmark-collapsed {
          display: none;
        }
        .sethu-backdrop {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(28, 18, 8, 0.45);
          z-index: 90;
        }

        @media (max-width: 760px) {
          .sethu-sidebar {
            width: 56px !important;
            min-width: 56px !important;
          }
          .sethu-sidebar-toggle {
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .sethu-wordmark-full {
            display: none;
          }
          .sethu-wordmark-collapsed {
            display: block;
          }
          .sethu-nav-label {
            display: none;
          }
          .sethu-nav-link {
            justify-content: center;
            padding: 10px 0 !important;
          }
          .sethu-backdrop {
            display: block;
          }

          .sethu-sidebar-expanded {
            position: fixed;
            top: 0;
            left: 0;
            width: 220px !important;
            min-width: 220px !important;
            height: 100vh;
            z-index: 100;
            box-shadow: 4px 0 16px rgba(0, 0, 0, 0.3);
          }
          .sethu-sidebar-expanded .sethu-wordmark-full {
            display: block;
          }
          .sethu-sidebar-expanded .sethu-wordmark-collapsed {
            display: none;
          }
          .sethu-sidebar-expanded .sethu-nav-label {
            display: block;
          }
          .sethu-sidebar-expanded .sethu-nav-link {
            justify-content: flex-start;
            padding: 8px 20px !important;
          }
          .sethu-sidebar-expanded .sethu-nav-icon {
            display: none;
          }
        }
      `}</style>
    </>
  )
}