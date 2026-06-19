'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import AccountsTab from '@/components/AccountsTab'
import AuditLogTab from '@/components/AuditLogTab'

// ── Types ──────────────────────────────────────────────────────
type UserProfile = {
  id: string
  full_name: string
  email: string
  department: string
  year: number | null
  section: string | null
  roll_number: string | null
  blood_group: string | null
  phone_number: string | null
  skills: string[] | null
  profile_photo_url: string | null
  email_verified_at: string | null
  created_at: string
}

type ResumeProfile = {
  headline: string
  bio: string
  linkedin_url: string
  github_url: string
  portfolio_url: string
  location: string
  education: EduItem[]
  experience: ExpItem[]
  projects: ProjectItem[]
  certifications: CertItem[]
  achievements: AchievItem[]
  technical_skills: string[]
}

type EduItem = { institution: string; degree: string; year: string; gpa: string }
type ExpItem = { company: string; role: string; start: string; end: string; description: string }
type ProjectItem = { name: string; description: string; tech: string; url: string }
type CertItem = { name: string; issuer: string; date: string; url: string }
type AchievItem = { title: string; description: string; date: string }

type BellNotif = {
  id: string; title: string; message: string; priority: string;
  created_at: string; sender_name?: string; is_read?: boolean
}

type Props = {
  profile: UserProfile
  userId: string
  overviewContent: React.ReactNode
  isAdmin?: boolean
}

// ── Style constants ────────────────────────────────────────────
const inp: React.CSSProperties = {
  width: '100%', border: '1.5px solid #C8A878', background: '#F2EDE6',
  padding: '9px 12px', fontSize: '13px', color: '#1C1208',
  outline: 'none', borderRadius: 0, fontFamily: 'inherit', display: 'block',
}
const lbl: React.CSSProperties = {
  fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px',
  color: '#6A4A2A', marginBottom: '5px', display: 'block',
}
const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-']

function emptyResume(): ResumeProfile {
  return {
    headline: '', bio: '', linkedin_url: '', github_url: '',
    portfolio_url: '', location: '',
    education: [], experience: [], projects: [],
    certifications: [], achievements: [], technical_skills: [],
  }
}

// ── Sub-components ─────────────────────────────────────────────
function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <div style={{ border: '1.5px solid #1C1208', background: '#FDFAF5' }}>
      <div onClick={() => setOpen(o => !o)} style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '11px 18px', borderBottom: open ? '1.5px solid #1C1208' : 'none',
        cursor: 'pointer', background: '#F2EDE6',
      }}>
        <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '2px', color: '#8A6A4A' }}>{title}</span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {action && <div onClick={e => e.stopPropagation()}>{action}</div>}
          <span style={{ fontSize: '11px', color: '#8A6A4A' }}>{open ? '▲' : '▼'}</span>
        </div>
      </div>
      {open && <div style={{ padding: '18px' }}>{children}</div>}
    </div>
  )
}

function AddBtn({ onClick, label = 'ADD' }: { onClick: () => void; label?: string }) {
  return (
    <button type="button" onClick={onClick} style={{
      background: '#1C1208', color: '#F2EDE6', border: 'none',
      padding: '4px 12px', fontSize: '8px', fontWeight: 700,
      letterSpacing: '1.5px', cursor: 'pointer', fontFamily: 'inherit',
    }}>{label}</button>
  )
}

function DeleteBtn({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{
      background: 'transparent', border: '1px solid #D94F00', color: '#D94F00',
      padding: '3px 8px', fontSize: '8px', fontWeight: 700,
      letterSpacing: '1px', cursor: 'pointer', fontFamily: 'inherit',
    }}>✕ REMOVE</button>
  )
}

function Grid({ cols = 2, children }: { cols?: number; children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${cols === 1 ? '100%' : '160px'}, 1fr))`, gap: '12px' }}>
      {children}
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder = '' }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string
}) {
  return (
    <div>
      <label style={lbl}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={inp} />
    </div>
  )
}

function TextArea({ label, value, onChange, rows = 3, placeholder = '' }: {
  label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string
}) {
  return (
    <div>
      <label style={lbl}>{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} placeholder={placeholder} style={{ ...inp, resize: 'vertical' }} />
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────
export default function DashboardTabs({ profile, userId, overviewContent, isAdmin = false }: Props) {
  const supabase = createClient()
  const [tab, setTab] = useState<'overview' | 'profile' | 'accounts' | 'audit'>('overview')

  // ── Personal info ──────────────────────────────────────────
  const [personal, setPersonal] = useState({
    full_name: profile?.full_name ?? '',
    phone_number: profile?.phone_number ?? '',
    blood_group: profile?.blood_group ?? '',
    section: profile?.section ?? '',
    department: profile?.department ?? '',
    roll_number: profile?.roll_number ?? '',
    year: profile?.year?.toString() ?? '',
    skillInput: '',
    skills: profile?.skills ?? [] as string[],
  })
  const [photoUrl, setPhotoUrl] = useState(profile?.profile_photo_url ?? '')
  const [photoUploading, setPhotoUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement | null>(null)

  // ── Resume profile ─────────────────────────────────────────
  const [resume, setResume] = useState<ResumeProfile>(emptyResume())
  const [resumeLoaded, setResumeLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  // ── Bell state ─────────────────────────────────────────────
  const [bellOpen, setBellOpen] = useState(false)
  const [bellNotifs, setBellNotifs] = useState<BellNotif[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifsLoaded, setNotifsLoaded] = useState(false)

  // ── Load resume on profile tab open ───────────────────────
  useEffect(() => {
    if (tab !== 'profile' || resumeLoaded) return
    async function load() {
      const { data } = await supabase.from('profiles').select('*').eq('user_id', userId).single()
      if (data) {
        setResume({
          headline: data.headline ?? '', bio: data.bio ?? '',
          linkedin_url: data.linkedin_url ?? '', github_url: data.github_url ?? '',
          portfolio_url: data.portfolio_url ?? '', location: data.location ?? '',
          education: data.education ?? [], experience: data.experience ?? [],
          projects: data.projects ?? [], certifications: data.certifications ?? [],
          achievements: data.achievements ?? [], technical_skills: data.technical_skills ?? [],
        })
      }
      setResumeLoaded(true)
    }
    load()
  }, [tab, resumeLoaded, userId, supabase])

  // ── Photo upload ───────────────────────────────────────────
  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { setError('Photo must be under 2MB'); return }
    setPhotoUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${userId}/avatar.${ext}`
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (upErr) { setError('Upload failed: ' + upErr.message); setPhotoUploading(false); return }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    setPhotoUrl(data.publicUrl + `?t=${Date.now()}`)
    setPhotoUploading(false)
  }

  // ── Save personal ──────────────────────────────────────────
  async function savePersonal() {
    setSaving(true); setMsg(''); setError('')
    const { error: e } = await supabase.from('users').update({
      full_name: personal.full_name, phone_number: personal.phone_number || null,
      blood_group: personal.blood_group || null, section: personal.section || null,
      department: personal.department || null, roll_number: personal.roll_number || null,
      year: personal.year ? parseInt(personal.year) : null,
      skills: personal.skills.length ? personal.skills : null,
      profile_photo_url: photoUrl || null,
    }).eq('id', userId)
    if (e) setError(e.message); else setMsg('Personal info saved.')
    setSaving(false)
  }

  // ── Save resume ────────────────────────────────────────────
  async function saveResume() {
    setSaving(true); setMsg(''); setError('')
    const { error: e } = await supabase.from('profiles').upsert({
      user_id: userId,
      headline: resume.headline || null, bio: resume.bio || null,
      linkedin_url: resume.linkedin_url || null, github_url: resume.github_url || null,
      portfolio_url: resume.portfolio_url || null, location: resume.location || null,
      education: resume.education, experience: resume.experience,
      projects: resume.projects, certifications: resume.certifications,
      achievements: resume.achievements,
      technical_skills: resume.technical_skills.length ? resume.technical_skills : null,
    }, { onConflict: 'user_id' })
    if (e) setError(e.message); else setMsg('Profile saved.')
    setSaving(false)
  }

  // ── Helpers ────────────────────────────────────────────────
  function updR<K extends keyof ResumeProfile>(key: K, val: ResumeProfile[K]) {
    setResume(p => ({ ...p, [key]: val })); setMsg(''); setError('')
  }
  function addSkill() {
    const s = personal.skillInput.trim()
    if (!s || personal.skills.includes(s)) return
    setPersonal(p => ({ ...p, skills: [...p.skills, s], skillInput: '' }))
  }
  function removeSkill(s: string) { setPersonal(p => ({ ...p, skills: p.skills.filter(x => x !== s) })) }
  function addTechSkill() {
    const s = personal.skillInput.trim()
    if (!s || resume.technical_skills.includes(s)) return
    updR('technical_skills', [...resume.technical_skills, s])
    setPersonal(p => ({ ...p, skillInput: '' }))
  }

  // ── Bell: load notifications ───────────────────────────────
  const loadNotifications = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: notifs } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(20)
    const { data: reads } = await supabase.from('notification_reads').select('notification_id').eq('user_id', user.id)
    const { data: dismissed } = await supabase.from('notification_dismissals').select('notification_id').eq('user_id', user.id)
    const readSet = new Set((reads ?? []).map((r: { notification_id: string }) => r.notification_id))
    const dismissSet = new Set((dismissed ?? []).map((d: { notification_id: string }) => d.notification_id))
    const senderIds = [...new Set((notifs ?? []).map((n: { sender_id: string }) => n.sender_id))]
    let senderMap: Record<string, string> = {}
    if (senderIds.length > 0) {
      const { data: senders } = await supabase.from('users').select('id, full_name').in('id', senderIds)
      senderMap = Object.fromEntries((senders ?? []).map((s: { id: string; full_name: string }) => [s.id, s.full_name]))
    }
    const enriched = (notifs ?? [])
      .filter((n: { id: string }) => !dismissSet.has(n.id))
      .map((n: { id: string; sender_id: string; title: string; message: string; priority: string; created_at: string }) => ({
        ...n, sender_name: senderMap[n.sender_id] ?? 'Staff', is_read: readSet.has(n.id),
      }))
    setBellNotifs(enriched)
    setUnreadCount(enriched.filter((n: BellNotif) => !n.is_read).length)
    setNotifsLoaded(true)
  }, [supabase])

  async function markAllRead() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const unread = bellNotifs.filter(n => !n.is_read)
    if (unread.length === 0) return
    await supabase.from('notification_reads').upsert(unread.map(n => ({ user_id: user.id, notification_id: n.id })))
    setBellNotifs(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  async function dismissBellNotif(notifId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('notification_dismissals').upsert({ user_id: user.id, notification_id: notifId })
    setBellNotifs(prev => prev.filter(n => n.id !== notifId))
    setUnreadCount(prev => Math.max(0, prev - (bellNotifs.find(n => n.id === notifId)?.is_read ? 0 : 1)))
  }

  async function clearAllBell() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    if (bellNotifs.length === 0) return
    await supabase.from('notification_dismissals').upsert(bellNotifs.map(n => ({ user_id: user.id, notification_id: n.id })))
    setBellNotifs([])
    setUnreadCount(0)
  }

  function openBell() {
    setBellOpen(true)
    if (!notifsLoaded) loadNotifications()
    setTimeout(markAllRead, 1500)
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '10px', fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px',
    background: active ? '#1C1208' : '#F2EDE6', color: active ? '#F2EDE6' : '#8A6A4A',
    border: 'none', cursor: 'pointer', fontFamily: 'inherit',
    borderBottom: active ? '2px solid #D94F00' : '2px solid transparent',
  })

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '2px solid #1C1208', background: '#F2EDE6', flexShrink: 0, alignItems: 'stretch' }}>
        <button type="button" onClick={() => setTab('overview')} style={tabStyle(tab === 'overview')}>OVERVIEW</button>
        <button type="button" onClick={() => setTab('profile')} style={tabStyle(tab === 'profile')}>MY PROFILE</button>
        {isAdmin && (
          <button type="button" onClick={() => setTab('accounts')} style={tabStyle(tab === 'accounts')}>ACCOUNTS</button>
        )}
        {isAdmin && (
          <button type="button" onClick={() => setTab('audit')} style={tabStyle(tab === 'audit')}>AUDIT LOG</button>
        )}
        <button type="button" onClick={openBell} style={{
          position: 'relative', background: 'transparent', border: 'none',
          padding: '0 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderLeft: '1px solid #E0D0B8', flexShrink: 0,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1C1208" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: '6px', right: '8px',
              background: '#D94F00', color: '#F2EDE6', fontSize: '8px', fontWeight: 700,
              borderRadius: '50%', width: '16px', height: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Notification drawer */}
      {bellOpen && (
        <>
          <div onClick={() => setBellOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(28,18,8,0.3)' }} />
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0,
            width: 'min(380px, 92vw)', background: '#FDFAF5',
            borderLeft: '2px solid #1C1208', zIndex: 100,
            display: 'flex', flexDirection: 'column',
            boxShadow: '-4px 0 20px rgba(28,18,8,0.15)',
          }}>
            {/* Drawer header */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '16px 20px', borderBottom: '1.5px solid #1C1208',
              background: '#1C1208', flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#F2EDE6', letterSpacing: '1px' }}>NOTIFICATIONS</span>
                {unreadCount > 0 && (
                  <span style={{ background: '#D94F00', color: '#F2EDE6', fontSize: '8px', fontWeight: 700, padding: '2px 7px', letterSpacing: '1px' }}>
                    {unreadCount} NEW
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {bellNotifs.length > 0 && (
                  <button type="button" onClick={clearAllBell} style={{
                    background: 'transparent', border: '1px solid #4A3020', color: '#8A6A4A',
                    padding: '4px 10px', fontSize: '8px', fontWeight: 700, letterSpacing: '1px',
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}>CLEAR ALL</button>
                )}
                <button type="button" onClick={() => setBellOpen(false)} style={{
                  background: 'transparent', border: 'none', color: '#8A6A4A',
                  fontSize: '18px', cursor: 'pointer', lineHeight: 1, fontFamily: 'inherit',
                }}>✕</button>
              </div>
            </div>

            {/* Notifications list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
              {!notifsLoaded ? (
                <div style={{ fontSize: '11px', color: '#8A6A4A', padding: '20px', textAlign: 'center' }}>Loading...</div>
              ) : bellNotifs.length === 0 ? (
                <div style={{ fontSize: '12px', color: '#8A6A4A', padding: '40px 20px', textAlign: 'center' }}>
                  <div style={{ marginBottom: '10px' }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8A6A4A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                    </svg>
                  </div>
                  No notifications yet
                </div>
              ) : bellNotifs.map(n => (
                <div key={n.id} style={{
                  padding: '12px 14px', marginBottom: '8px',
                  border: `1.5px solid ${n.priority === 'urgent' ? '#D94F00' : '#1C1208'}`,
                  background: n.is_read ? '#F2EDE6' : '#FFF8F2',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '5px', flexWrap: 'wrap' }}>
                        {!n.is_read && <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#D94F00', flexShrink: 0 }} />}
                        {n.priority === 'urgent' && (
                          <span style={{ fontSize: '7px', fontWeight: 700, letterSpacing: '1px', padding: '1px 6px', background: '#D94F00', color: '#F2EDE6' }}>URGENT</span>
                        )}
                        <span style={{ fontSize: '12px', fontWeight: n.is_read ? 400 : 700, color: '#1C1208' }}>{n.title}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#1C1208', lineHeight: 1.6, marginBottom: '6px' }}>{n.message}</div>
                      <div style={{ fontSize: '9px', color: '#8A6A4A' }}>
                        {n.sender_name} · {new Date(n.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </div>
                    </div>
                    <button type="button" onClick={() => dismissBellNotif(n.id)} title="Dismiss" style={{
                      background: 'transparent', border: 'none', color: '#8A6A4A',
                      cursor: 'pointer', fontSize: '13px', lineHeight: 1,
                      padding: '0 2px', flexShrink: 0, fontFamily: 'inherit',
                    }}>✕</button>
                  </div>
                </div>
              ))}
            </div>

            {/* View all link */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid #E0D0B8', flexShrink: 0 }}>
              <a href="/notifications" onClick={() => setBellOpen(false)} style={{
                display: 'block', textAlign: 'center', fontSize: '10px', fontWeight: 700,
                letterSpacing: '1.5px', color: '#D94F00', textDecoration: 'none',
                padding: '10px', border: '1.5px solid #D94F00',
              }}>
                VIEW ALL NOTIFICATIONS →
              </a>
            </div>
          </div>
        </>
      )}

      {/* Overview */}
      {tab === 'overview' && (
        <div style={{ flex: 1, overflowY: 'auto' }}>{overviewContent}</div>
      )}

      {/* Accounts (admin only) */}
      {tab === 'accounts' && isAdmin && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <AccountsTab />
        </div>
      )}

      {/* Audit Log (admin only) */}
      {tab === 'audit' && isAdmin && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <AuditLogTab />
        </div>
      )}

      {/* Profile */}
      {tab === 'profile' && (
        <main style={{ flex: 1, overflowY: 'auto', padding: 'clamp(12px,4vw,24px)', display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Avatar + name hero */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <div onClick={() => fileRef.current?.click()} style={{
              width: '80px', height: '80px', flexShrink: 0, border: '2px solid #1C1208',
              cursor: 'pointer', background: '#E8DDD0', position: 'relative',
              display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
            }}>
              {photoUrl
                ? <img src={photoUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: '28px', fontWeight: 700, color: '#8A6A4A' }}>{personal.full_name.charAt(0).toUpperCase() || '?'}</span>
              }
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                background: 'rgba(28,18,8,0.65)', padding: '3px',
                fontSize: '7px', fontWeight: 700, color: '#F2EDE6', letterSpacing: '1px', textAlign: 'center',
              }}>
                {photoUploading ? 'UPLOADING...' : 'CHANGE'}
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#1C1208' }}>{personal.full_name || '—'}</div>
              <div style={{ fontSize: '11px', color: '#8A6A4A', marginTop: '3px' }}>
                {resume.headline || <span style={{ fontStyle: 'italic', color: '#C8A878' }}>Add a headline...</span>}
              </div>
              <div style={{ fontSize: '10px', color: '#8A6A4A', marginTop: '2px' }}>
                {personal.department}{personal.year ? ` · Year ${personal.year}` : ''}{personal.section ? ` · Sec ${personal.section}` : ''}
              </div>
            </div>
          </div>

          {msg && <div style={{ fontSize: '11px', color: '#3D7A50', borderLeft: '2px solid #3D7A50', paddingLeft: '10px' }}>{msg}</div>}
          {error && <div style={{ fontSize: '11px', color: '#D94F00', borderLeft: '2px solid #D94F00', paddingLeft: '10px' }}>{error}</div>}

          {/* Personal Information */}
          <Section title="PERSONAL INFORMATION">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Grid>
                <Field label="FULL NAME" value={personal.full_name} onChange={v => setPersonal(p => ({ ...p, full_name: v }))} />
                <Field label="PHONE NUMBER" value={personal.phone_number} onChange={v => setPersonal(p => ({ ...p, phone_number: v }))} placeholder="+91 XXXXX XXXXX" />
              </Grid>
              <Grid>
                <Field label="ROLL NUMBER" value={personal.roll_number} onChange={v => setPersonal(p => ({ ...p, roll_number: v }))} placeholder="160122737XXX" />
                <div>
                  <label style={lbl}>BLOOD GROUP</label>
                  <select value={personal.blood_group} onChange={e => setPersonal(p => ({ ...p, blood_group: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>
                    <option value="">Select</option>
                    {BLOOD_GROUPS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </Grid>
              <Grid>
                <Field label="DEPARTMENT" value={personal.department} onChange={v => setPersonal(p => ({ ...p, department: v }))} />
                <div>
                  <label style={lbl}>YEAR</label>
                  <select value={personal.year} onChange={e => setPersonal(p => ({ ...p, year: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>
                    <option value="">Select</option>
                    {['1','2','3','4'].map(y => <option key={y} value={y}>{y}{['st','nd','rd','th'][+y-1]} Year</option>)}
                  </select>
                </div>
                <Field label="SECTION" value={personal.section} onChange={v => setPersonal(p => ({ ...p, section: v.toUpperCase() }))} placeholder="1" />
              </Grid>
              <div>
                <label style={lbl}>SKILLS (FOR AI PLANNER)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                  {personal.skills.map(s => (
                    <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#1C1208', color: '#F2EDE6', padding: '3px 9px', fontSize: '10px', fontWeight: 700 }}>
                      {s}
                      <button type="button" onClick={() => removeSkill(s)} style={{ background: 'transparent', border: 'none', color: '#C8A878', cursor: 'pointer', fontSize: '12px', padding: 0, fontFamily: 'inherit' }}>×</button>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" value={personal.skillInput} onChange={e => setPersonal(p => ({ ...p, skillInput: e.target.value }))} onKeyDown={e => e.key === 'Enter' && addSkill()} placeholder="e.g. Python, ML" style={{ ...inp, flex: 1 }} />
                  <button type="button" onClick={addSkill} style={{ background: '#1C1208', color: '#F2EDE6', border: 'none', padding: '0 16px', fontSize: '10px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>ADD</button>
                </div>
              </div>
              <button type="button" onClick={savePersonal} disabled={saving} style={{ background: saving ? '#8A6A4A' : '#1C1208', color: '#F2EDE6', border: 'none', padding: '11px', fontSize: '10px', fontWeight: 700, letterSpacing: '2px', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {saving ? 'SAVING...' : 'SAVE PERSONAL INFO →'}
              </button>
            </div>
          </Section>

          {/* Professional Summary */}
          <Section title="PROFESSIONAL SUMMARY">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Field label="HEADLINE" value={resume.headline} onChange={v => updR('headline', v)} placeholder="e.g. AI/ML Engineer · CBIT 2026" />
              <TextArea label="BIO / SUMMARY" value={resume.bio} onChange={v => updR('bio', v)} rows={4} placeholder="Write a short professional summary..." />
              <Grid>
                <Field label="LOCATION" value={resume.location} onChange={v => updR('location', v)} placeholder="Hyderabad, India" />
                <Field label="LINKEDIN" value={resume.linkedin_url} onChange={v => updR('linkedin_url', v)} placeholder="https://linkedin.com/in/..." />
                <Field label="GITHUB" value={resume.github_url} onChange={v => updR('github_url', v)} placeholder="https://github.com/..." />
                <Field label="PORTFOLIO" value={resume.portfolio_url} onChange={v => updR('portfolio_url', v)} placeholder="https://yoursite.com" />
              </Grid>
            </div>
          </Section>

          {/* Education */}
          <Section title="EDUCATION" action={<AddBtn onClick={() => updR('education', [...resume.education, { institution: '', degree: '', year: '', gpa: '' }])} />}>
            {resume.education.length === 0
              ? <div style={{ fontSize: '11px', color: '#8A6A4A', fontStyle: 'italic' }}>No education added yet. Click ADD to start.</div>
              : resume.education.map((e, i) => (
                <div key={i} style={{ border: '1px solid #E0D0B8', padding: '14px', marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <Grid>
                    <Field label="INSTITUTION" value={e.institution} onChange={v => { const a = [...resume.education]; a[i] = { ...a[i], institution: v }; updR('education', a) }} placeholder="CBIT, Hyderabad" />
                    <Field label="DEGREE" value={e.degree} onChange={v => { const a = [...resume.education]; a[i] = { ...a[i], degree: v }; updR('education', a) }} placeholder="B.Tech AI & ML" />
                    <Field label="YEAR" value={e.year} onChange={v => { const a = [...resume.education]; a[i] = { ...a[i], year: v }; updR('education', a) }} placeholder="2022 – 2026" />
                    <Field label="GPA / PERCENTAGE" value={e.gpa} onChange={v => { const a = [...resume.education]; a[i] = { ...a[i], gpa: v }; updR('education', a) }} placeholder="8.5 / 10" />
                  </Grid>
                  <DeleteBtn onClick={() => updR('education', resume.education.filter((_: EduItem, j: number) => j !== i))} />
                </div>
              ))
            }
          </Section>

          {/* Experience */}
          <Section title="EXPERIENCE" action={<AddBtn onClick={() => updR('experience', [...resume.experience, { company: '', role: '', start: '', end: '', description: '' }])} />}>
            {resume.experience.length === 0
              ? <div style={{ fontSize: '11px', color: '#8A6A4A', fontStyle: 'italic' }}>No experience added yet.</div>
              : resume.experience.map((e, i) => (
                <div key={i} style={{ border: '1px solid #E0D0B8', padding: '14px', marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <Grid>
                    <Field label="COMPANY / ORGANISATION" value={e.company} onChange={v => { const a = [...resume.experience]; a[i] = { ...a[i], company: v }; updR('experience', a) }} placeholder="Google, Startup, etc." />
                    <Field label="ROLE / POSITION" value={e.role} onChange={v => { const a = [...resume.experience]; a[i] = { ...a[i], role: v }; updR('experience', a) }} placeholder="Software Intern" />
                    <Field label="START DATE" value={e.start} onChange={v => { const a = [...resume.experience]; a[i] = { ...a[i], start: v }; updR('experience', a) }} placeholder="June 2024" />
                    <Field label="END DATE" value={e.end} onChange={v => { const a = [...resume.experience]; a[i] = { ...a[i], end: v }; updR('experience', a) }} placeholder="Aug 2024 or Present" />
                  </Grid>
                  <TextArea label="DESCRIPTION" value={e.description} onChange={v => { const a = [...resume.experience]; a[i] = { ...a[i], description: v }; updR('experience', a) }} rows={3} placeholder="Describe your responsibilities and achievements..." />
                  <DeleteBtn onClick={() => updR('experience', resume.experience.filter((_: ExpItem, j: number) => j !== i))} />
                </div>
              ))
            }
          </Section>

          {/* Technical Skills */}
          <Section title="TECHNICAL SKILLS">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
              {resume.technical_skills.map(s => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#1C1208', color: '#F2EDE6', padding: '4px 10px', fontSize: '10px', fontWeight: 700 }}>
                  {s}
                  <button type="button" onClick={() => updR('technical_skills', resume.technical_skills.filter(x => x !== s))} style={{ background: 'transparent', border: 'none', color: '#C8A878', cursor: 'pointer', fontSize: '12px', padding: 0, fontFamily: 'inherit' }}>×</button>
                </div>
              ))}
              {resume.technical_skills.length === 0 && <span style={{ fontSize: '11px', color: '#8A6A4A', fontStyle: 'italic' }}>No skills added yet.</span>}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="text" value={personal.skillInput} onChange={e => setPersonal(p => ({ ...p, skillInput: e.target.value }))} onKeyDown={e => e.key === 'Enter' && addTechSkill()} placeholder="e.g. React, Python, TensorFlow" style={{ ...inp, flex: 1 }} />
              <button type="button" onClick={addTechSkill} style={{ background: '#1C1208', color: '#F2EDE6', border: 'none', padding: '0 16px', fontSize: '10px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>ADD</button>
            </div>
          </Section>

          {/* Projects */}
          <Section title="PROJECTS" action={<AddBtn onClick={() => updR('projects', [...resume.projects, { name: '', description: '', tech: '', url: '' }])} />}>
            {resume.projects.length === 0
              ? <div style={{ fontSize: '11px', color: '#8A6A4A', fontStyle: 'italic' }}>No projects added yet.</div>
              : resume.projects.map((p, i) => (
                <div key={i} style={{ border: '1px solid #E0D0B8', padding: '14px', marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <Grid>
                    <Field label="PROJECT NAME" value={p.name} onChange={v => { const a = [...resume.projects]; a[i] = { ...a[i], name: v }; updR('projects', a) }} placeholder="SETHU Campus Platform" />
                    <Field label="TECH STACK" value={p.tech} onChange={v => { const a = [...resume.projects]; a[i] = { ...a[i], tech: v }; updR('projects', a) }} placeholder="Next.js, FastAPI, Supabase" />
                    <Field label="URL / LINK" value={p.url} onChange={v => { const a = [...resume.projects]; a[i] = { ...a[i], url: v }; updR('projects', a) }} placeholder="https://github.com/..." />
                  </Grid>
                  <TextArea label="DESCRIPTION" value={p.description} onChange={v => { const a = [...resume.projects]; a[i] = { ...a[i], description: v }; updR('projects', a) }} rows={3} placeholder="What does this project do? What problem does it solve?" />
                  <DeleteBtn onClick={() => updR('projects', resume.projects.filter((_: ProjectItem, j: number) => j !== i))} />
                </div>
              ))
            }
          </Section>

          {/* Certifications */}
          <Section title="CERTIFICATIONS" action={<AddBtn onClick={() => updR('certifications', [...resume.certifications, { name: '', issuer: '', date: '', url: '' }])} />}>
            {resume.certifications.length === 0
              ? <div style={{ fontSize: '11px', color: '#8A6A4A', fontStyle: 'italic' }}>No certifications added yet.</div>
              : resume.certifications.map((c, i) => (
                <div key={i} style={{ border: '1px solid #E0D0B8', padding: '14px', marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <Grid>
                    <Field label="CERTIFICATION NAME" value={c.name} onChange={v => { const a = [...resume.certifications]; a[i] = { ...a[i], name: v }; updR('certifications', a) }} placeholder="AWS Cloud Practitioner" />
                    <Field label="ISSUING ORGANISATION" value={c.issuer} onChange={v => { const a = [...resume.certifications]; a[i] = { ...a[i], issuer: v }; updR('certifications', a) }} placeholder="Amazon Web Services" />
                    <Field label="DATE" value={c.date} onChange={v => { const a = [...resume.certifications]; a[i] = { ...a[i], date: v }; updR('certifications', a) }} placeholder="March 2024" />
                    <Field label="CREDENTIAL URL" value={c.url} onChange={v => { const a = [...resume.certifications]; a[i] = { ...a[i], url: v }; updR('certifications', a) }} placeholder="https://..." />
                  </Grid>
                  <DeleteBtn onClick={() => updR('certifications', resume.certifications.filter((_: CertItem, j: number) => j !== i))} />
                </div>
              ))
            }
          </Section>

          {/* Leadership & Achievements */}
          <Section title="LEADERSHIP & ACHIEVEMENTS" action={<AddBtn onClick={() => updR('achievements', [...resume.achievements, { title: '', description: '', date: '' }])} />}>
            {resume.achievements.length === 0
              ? <div style={{ fontSize: '11px', color: '#8A6A4A', fontStyle: 'italic' }}>No achievements added yet.</div>
              : resume.achievements.map((a, i) => (
                <div key={i} style={{ border: '1px solid #E0D0B8', padding: '14px', marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <Grid>
                    <Field label="TITLE" value={a.title} onChange={v => { const arr = [...resume.achievements]; arr[i] = { ...arr[i], title: v }; updR('achievements', arr) }} placeholder="Technical Fest Winner" />
                    <Field label="DATE" value={a.date} onChange={v => { const arr = [...resume.achievements]; arr[i] = { ...arr[i], date: v }; updR('achievements', arr) }} placeholder="Oct 2023" />
                  </Grid>
                  <TextArea label="DESCRIPTION" value={a.description} onChange={v => { const arr = [...resume.achievements]; arr[i] = { ...arr[i], description: v }; updR('achievements', arr) }} rows={2} placeholder="Brief description of the achievement..." />
                  <DeleteBtn onClick={() => updR('achievements', resume.achievements.filter((_: AchievItem, j: number) => j !== i))} />
                </div>
              ))
            }
          </Section>

          <button type="button" onClick={saveResume} disabled={saving} style={{
            background: saving ? '#8A6A4A' : '#D94F00', color: '#F2EDE6', border: 'none',
            padding: '13px', fontSize: '10px', fontWeight: 700, letterSpacing: '2px',
            cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
          }}>
            {saving ? 'SAVING...' : 'SAVE FULL PROFILE →'}
          </button>

        </main>
      )}
    </div>
  )
}