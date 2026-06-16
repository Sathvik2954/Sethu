'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

type Notification = {
  id: string
  sender_id: string
  target_dept: string | null
  target_section: string | null
  target_year: number | null
  title: string
  message: string
  attachment_url: string | null
  priority: 'normal' | 'urgent'
  created_at: string
  sender_name?: string
  is_read?: boolean
}

type UserInfo = {
  id: string
  role: string
  department: string | null
  year: number | null
  section: string | null
}

const DEPARTMENTS = ['CSE','AIML','CET','AIDS','IT','ECE','EEE','MECH','CIVIL','BIO TECH']

const inp: React.CSSProperties = {
  width: '100%', border: '1.5px solid #C8A878', background: '#F2EDE6',
  padding: '10px 12px', fontSize: '13px', color: '#1C1208',
  outline: 'none', borderRadius: 0, fontFamily: 'inherit', display: 'block',
}
const lbl: React.CSSProperties = {
  fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px',
  color: '#6A4A2A', marginBottom: '6px', display: 'block',
}

// ── Outside main to avoid remount ────────────────────────────
function NotifCard({ n, onRead }: { n: Notification; onRead: (id: string) => void }) {
  const [open, setOpen] = useState(false)

  function toggle() {
    setOpen(o => !o)
    if (!n.is_read) onRead(n.id)
  }

  return (
    <div style={{
      border: `1.5px solid ${n.priority === 'urgent' ? '#D94F00' : '#1C1208'}`,
      background: n.is_read ? '#FDFAF5' : '#FFF8F2',
      marginBottom: '8px',
    }}>
      <div onClick={toggle} style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '12px 16px', cursor: 'pointer', flexWrap: 'wrap',
      }}>
        {/* Unread dot */}
        {!n.is_read && (
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#D94F00', flexShrink: 0 }} />
        )}
        {n.priority === 'urgent' && (
          <span style={{ fontSize: '7px', fontWeight: 700, letterSpacing: '1px', padding: '2px 7px', background: '#D94F00', color: '#F2EDE6', flexShrink: 0 }}>
            URGENT
          </span>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: n.is_read ? 400 : 700, color: '#1C1208' }}>{n.title}</div>
          <div style={{ fontSize: '10px', color: '#8A6A4A', marginTop: '2px' }}>
            {n.sender_name ?? 'Staff'} · {new Date(n.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            {n.target_dept && ` · ${n.target_dept}${n.target_section ? `-${n.target_section}` : ''}${n.target_year ? ` Y${n.target_year}` : ''}`}
          </div>
        </div>
        <span style={{ fontSize: '11px', color: '#8A6A4A' }}>{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div style={{ borderTop: '1px solid #E0D0B8', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontSize: '13px', color: '#1C1208', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{n.message}</div>
          {n.attachment_url && (
            <a href={n.attachment_url} target="_blank" rel="noopener noreferrer" style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              fontSize: '10px', fontWeight: 700, color: '#D94F00', textDecoration: 'none',
              alignSelf: 'flex-start',
            }}>
              ↓ VIEW ATTACHMENT ↗
            </a>
          )}
        </div>
      )}
    </div>
  )
}

export default function NotificationsPage() {
  const supabase = createClient()
  const [me, setMe] = useState<UserInfo | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [reads, setReads] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [showCompose, setShowCompose] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent'>('all')

  // Compose form
  const [form, setForm] = useState({
    title: '', message: '', priority: 'normal',
    target_dept: '', target_section: '', target_year: '',
  })
  const [attachFile, setAttachFile] = useState<File | null>(null)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const [sendSuccess, setSendSuccess] = useState('')
  const fileRef = useRef<HTMLInputElement | null>(null)

  const isStaff = me && ['faculty', 'hod', 'admin'].includes(me.role)

  const load = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('users')
      .select('id, role, department, year, section')
      .eq('id', user.id)
      .single()

    setMe(profile as UserInfo)

    // Load notifications
    const { data: notifs } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })

    // Load read receipts
    const { data: readData } = await supabase
      .from('notification_reads')
      .select('notification_id')
      .eq('user_id', user.id)

    const readSet = new Set((readData ?? []).map((r: { notification_id: string }) => r.notification_id))
    setReads(readSet)

    // Fetch sender names
    if (notifs && notifs.length > 0) {
      const senderIds = [...new Set(notifs.map((n: Notification) => n.sender_id))]
      const { data: senders } = await supabase
        .from('users')
        .select('id, full_name')
        .in('id', senderIds)
      const senderMap = Object.fromEntries((senders ?? []).map((s: { id: string; full_name: string }) => [s.id, s.full_name]))
      setNotifications((notifs as Notification[]).map(n => ({
        ...n,
        sender_name: senderMap[n.sender_id] ?? 'Staff',
        is_read: readSet.has(n.id),
      })))
    } else {
      setNotifications([])
    }

    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  async function markRead(notifId: string) {
    if (reads.has(notifId)) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('notification_reads').upsert({ user_id: user.id, notification_id: notifId })
    setReads(prev => new Set([...prev, notifId]))
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n))
  }

  async function handleSend() {
    if (!form.title.trim()) { setSendError('Title is required'); return }
    if (!form.message.trim()) { setSendError('Message is required'); return }
    setSending(true); setSendError(''); setSendSuccess('')

    let attachUrl: string | null = null
    if (attachFile) {
      const { data: { user } } = await supabase.auth.getUser()
      const path = `${user!.id}/${Date.now()}-${attachFile.name}`
      const { error: upErr } = await supabase.storage.from('notifications').upload(path, attachFile, { upsert: true })
      if (upErr) { setSendError('Attachment upload failed: ' + upErr.message); setSending(false); return }
      const { data } = supabase.storage.from('notifications').getPublicUrl(path)
      attachUrl = data.publicUrl
    }

    const payload: Record<string, unknown> = {
      title: form.title.trim(),
      message: form.message.trim(),
      priority: form.priority,
      attachment_url: attachUrl,
    }

    // Faculty/HOD: default to own dept, allow override
    // Admin: can target any dept or leave null for institution-wide
    if (form.target_dept) payload.target_dept = form.target_dept
    else if (me?.role !== 'admin' && me?.department) payload.target_dept = me.department

    if (form.target_section) payload.target_section = form.target_section
    if (form.target_year) payload.target_year = parseInt(form.target_year)

    const { data: { user } } = await supabase.auth.getUser()
    payload.sender_id = user!.id

    const { error: dbErr } = await supabase.from('notifications').insert(payload)
    if (dbErr) { setSendError(dbErr.message); setSending(false); return }

    setSendSuccess('Notification sent successfully.')
    setForm({ title: '', message: '', priority: 'normal', target_dept: '', target_section: '', target_year: '' })
    setAttachFile(null)
    setShowCompose(false)
    setSending(false)
    load()
  }

  const unreadCount = notifications.filter(n => !n.is_read).length
  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.is_read
    if (filter === 'urgent') return n.priority === 'urgent'
    return true
  })

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
  }).toUpperCase()

  return (
    <>
      <header style={{
        minHeight: '48px', borderBottom: '2px solid #1C1208',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(12px,4vw,24px)', background: '#F2EDE6',
        flexShrink: 0, flexWrap: 'wrap', gap: '4px',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#1C1208', letterSpacing: '0.5px' }}>NOTIFICATIONS</span>
          {unreadCount > 0 && (
            <span style={{ fontSize: '9px', fontWeight: 700, background: '#D94F00', color: '#F2EDE6', padding: '2px 7px', letterSpacing: '1px' }}>
              {unreadCount} UNREAD
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '10px', color: '#6A4A2A', background: '#E8DDD0', padding: '4px 10px' }}>{today}</span>
          {isStaff && (
            <button type="button" onClick={() => { setShowCompose(s => !s); setSendError(''); setSendSuccess('') }} style={{
              background: '#1C1208', color: '#F2EDE6', border: 'none',
              padding: '8px 16px', fontSize: '9px', fontWeight: 700,
              letterSpacing: '1.5px', cursor: 'pointer', fontFamily: 'inherit',
            }}>
              {showCompose ? '✕ CANCEL' : '+ SEND NOTIFICATION'}
            </button>
          )}
        </div>
      </header>

      <main style={{ flex: 1, overflowY: 'auto', padding: 'clamp(12px,4vw,20px) clamp(12px,4vw,24px)', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {sendSuccess && <div style={{ fontSize: '11px', color: '#3D7A50', borderLeft: '2px solid #3D7A50', paddingLeft: '10px' }}>{sendSuccess}</div>}

        {/* Compose panel */}
        {isStaff && showCompose && (
          <div style={{ border: '1.5px solid #1C1208', background: '#FDFAF5' }}>
            <div style={{ padding: '12px 18px', borderBottom: '1.5px solid #1C1208', fontSize: '9px', fontWeight: 700, letterSpacing: '2px', color: '#8A6A4A' }}>
              COMPOSE NOTIFICATION
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* Targeting */}
              <div style={{ background: '#F2EDE6', border: '1px solid #E0D0B8', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '9px', fontWeight: 700, color: '#8A6A4A', letterSpacing: '1.5px' }}>AUDIENCE</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px' }}>
                  <div>
                    <label style={lbl}>DEPARTMENT</label>
                    <select
                      value={form.target_dept || (me?.role !== 'admin' ? (me?.department ?? '') : '')}
                      onChange={e => setForm(p => ({ ...p, target_dept: e.target.value }))}
                      disabled={me?.role !== 'admin'}
                      style={{ ...inp, cursor: me?.role !== 'admin' ? 'not-allowed' : 'pointer', opacity: me?.role !== 'admin' ? 0.7 : 1 }}
                    >
                      {me?.role === 'admin' && <option value="">All departments (institution-wide)</option>}
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    {me?.role !== 'admin' && (
                      <div style={{ fontSize: '9px', color: '#8A6A4A', marginTop: '4px' }}>Auto-set to your department</div>
                    )}
                  </div>
                  <div>
                    <label style={lbl}>SECTION (OPTIONAL)</label>
                    <input type="text" value={form.target_section} onChange={e => setForm(p => ({ ...p, target_section: e.target.value.toUpperCase() }))} placeholder="A, B, C... or leave blank for all" style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>YEAR (OPTIONAL)</label>
                    <select value={form.target_year} onChange={e => setForm(p => ({ ...p, target_year: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>
                      <option value="">All years</option>
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div>
                <label style={lbl}>TITLE</label>
                <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Unit test postponed to next week" style={inp} />
              </div>
              <div>
                <label style={lbl}>MESSAGE</label>
                <textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} rows={5} placeholder="Write your message here..." style={{ ...inp, resize: 'vertical' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={lbl}>PRIORITY</label>
                  <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label style={lbl}>ATTACHMENT (OPTIONAL)</label>
                  <div onClick={() => fileRef.current?.click()} style={{
                    border: '1.5px dashed #C8A878', padding: '10px 14px', cursor: 'pointer',
                    background: '#F2EDE6', fontSize: '11px', color: '#8A6A4A',
                  }}>
                    {attachFile ? <span style={{ color: '#3D7A50', fontWeight: 700 }}>✓ {attachFile.name}</span> : 'Click to attach file'}
                  </div>
                  <input ref={fileRef} type="file" style={{ display: 'none' }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) setAttachFile(f) }} />
                </div>
              </div>

              {sendError && <div style={{ fontSize: '11px', color: '#D94F00', borderLeft: '2px solid #D94F00', paddingLeft: '10px' }}>{sendError}</div>}

              <button type="button" onClick={handleSend} disabled={sending} style={{
                background: sending ? '#8A6A4A' : '#D94F00', color: '#F2EDE6', border: 'none',
                padding: '12px', fontSize: '10px', fontWeight: 700, letterSpacing: '2px',
                cursor: sending ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              }}>
                {sending ? 'SENDING...' : 'SEND NOTIFICATION →'}
              </button>
            </div>
          </div>
        )}

        {/* Filter bar */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', border: '1.5px solid #1C1208' }}>
            {(['all', 'unread', 'urgent'] as const).map((f, i, arr) => (
              <button key={f} type="button" onClick={() => setFilter(f)} style={{
                padding: '7px 14px', fontSize: '9px', fontWeight: 700, letterSpacing: '1px',
                cursor: 'pointer', fontFamily: 'inherit', border: 'none',
                borderRight: i < arr.length - 1 ? '1.5px solid #1C1208' : 'none',
                background: filter === f ? '#1C1208' : '#F2EDE6',
                color: filter === f ? '#F2EDE6' : '#8A6A4A',
              }}>
                {f.toUpperCase()}
              </button>
            ))}
          </div>
          <span style={{ fontSize: '10px', color: '#8A6A4A' }}>{filtered.length} notification{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* List */}
        {loading ? (
          <div style={{ fontSize: '11px', color: '#8A6A4A' }}>LOADING...</div>
        ) : filtered.length === 0 ? (
          <div style={{ border: '1.5px solid #1C1208', background: '#FDFAF5', padding: '40px', textAlign: 'center' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#1C1208', marginBottom: '6px' }}>
              {filter === 'unread' ? 'All caught up!' : filter === 'urgent' ? 'No urgent notifications' : 'No notifications yet'}
            </div>
            <div style={{ fontSize: '11px', color: '#8A6A4A' }}>
              {filter === 'unread' ? 'No unread notifications.' : 'Notifications from your faculty will appear here.'}
            </div>
          </div>
        ) : (
          <div>
            {filtered.map(n => <NotifCard key={n.id} n={n} onRead={markRead} />)}
          </div>
        )}

      </main>
    </>
  )
}