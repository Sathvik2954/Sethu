'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

type StaffUser = {
  id: string
  full_name: string
  email: string
  role: string
  department: string | null
  created_at: string
  skip_verification: boolean
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

const ROLE_COLOR: Record<string, string> = {
  admin: '#D94F00', hod: '#3D7A50', faculty: '#8A6A4A',
}

export default function AccountsTab() {
  const supabase = createClient()
  const [staff, setStaff] = useState<StaffUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'faculty', department: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [acting, setActing] = useState<string | null>(null)
  const [filterRole, setFilterRole] = useState<'all' | 'faculty' | 'hod' | 'admin'>('all')

  const loadStaff = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('users')
      .select('id, full_name, email, role, department, created_at, skip_verification')
      .in('role', ['faculty', 'hod', 'admin'])
      .order('role')
      .order('department')
      .order('full_name')
    setStaff((data as StaffUser[]) ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { loadStaff() }, [loadStaff])

  function upd(field: string, value: string) {
    setForm(p => ({ ...p, [field]: value }))
    setError('')
  }

  async function handleCreate() {
    if (!form.full_name.trim()) { setError('Full name is required'); return }
    if (!form.email.trim()) { setError('Email is required'); return }
    if (!form.password || form.password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (form.role !== 'admin' && !form.department) { setError('Department is required for faculty/HOD'); return }

    setSubmitting(true); setError(''); setSuccess('')

    const res = await fetch('/api/create-staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()

    if (!res.ok) { setError(data.error ?? 'Failed to create account'); setSubmitting(false); return }

    setSuccess(`Account created for ${form.full_name}.`)
    setForm({ full_name: '', email: '', password: '', role: 'faculty', department: '' })
    setShowForm(false)
    setSubmitting(false)
    loadStaff()
  }

  async function handleAction(userId: string, action: 'deactivate' | 'reactivate' | 'delete') {
    if (action === 'delete' && !confirm('Permanently delete this account? This cannot be undone.')) return
    setActing(userId)
    const res = await fetch('/api/deactivate-staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Action failed') }
    else { setSuccess(`Account ${action}d.`) }
    setActing(null)
    loadStaff()
  }

  const filtered = filterRole === 'all' ? staff : staff.filter(s => s.role === filterRole)

  return (
    <main style={{ flex: 1, overflowY: 'auto', padding: 'clamp(12px,4vw,24px)', display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1C1208', margin: 0 }}>Staff Accounts</h1>
          <p style={{ fontSize: '11px', color: '#8A6A4A', margin: '3px 0 0' }}>
            Create and manage faculty, HOD, and admin accounts. Staff bypass email verification.
          </p>
        </div>
        <button type="button" onClick={() => { setShowForm(s => !s); setError(''); setSuccess('') }} style={{
          background: '#1C1208', color: '#F2EDE6', border: 'none',
          padding: '10px 20px', fontSize: '10px', fontWeight: 700,
          letterSpacing: '1.5px', cursor: 'pointer', fontFamily: 'inherit',
        }}>
          {showForm ? '✕ CANCEL' : '+ CREATE ACCOUNT'}
        </button>
      </div>

      {success && <div style={{ fontSize: '11px', color: '#3D7A50', borderLeft: '2px solid #3D7A50', paddingLeft: '10px' }}>{success}</div>}
      {error && <div style={{ fontSize: '11px', color: '#D94F00', borderLeft: '2px solid #D94F00', paddingLeft: '10px' }}>{error}</div>}

      {/* Create form */}
      {showForm && (
        <div style={{ border: '1.5px solid #1C1208', background: '#FDFAF5' }}>
          <div style={{ padding: '12px 20px', borderBottom: '1.5px solid #1C1208', fontSize: '9px', fontWeight: 700, letterSpacing: '2px', color: '#8A6A4A' }}>
            NEW STAFF ACCOUNT
          </div>
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <div>
                <label style={lbl}>FULL NAME</label>
                <input type="text" value={form.full_name} onChange={e => upd('full_name', e.target.value)} placeholder="Dr. Ramesh Kumar" style={inp} />
              </div>
              <div>
                <label style={lbl}>EMAIL</label>
                <input type="email" value={form.email} onChange={e => upd('email', e.target.value)} placeholder="faculty@cbit.ac.in" style={inp} />
              </div>
              <div>
                <label style={lbl}>TEMPORARY PASSWORD</label>
                <input type="password" value={form.password} onChange={e => upd('password', e.target.value)} placeholder="min 6 characters" style={inp} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
              <div>
                <label style={lbl}>ROLE</label>
                <select value={form.role} onChange={e => upd('role', e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                  <option value="faculty">Faculty</option>
                  <option value="hod">HOD</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {form.role !== 'admin' && (
                <div>
                  <label style={lbl}>DEPARTMENT</label>
                  <select value={form.department} onChange={e => upd('department', e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                    <option value="">Select department</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div style={{ background: '#F2EDE6', border: '1px solid #E0D0B8', padding: '10px 14px', fontSize: '10px', color: '#6A4A2A', lineHeight: 1.6 }}>
              ℹ️ The staff member will use this email and password to log in. They can change their password via Forgot Password on the login page. No email verification is required.
            </div>

            <button type="button" onClick={handleCreate} disabled={submitting} style={{
              background: submitting ? '#8A6A4A' : '#1C1208', color: '#F2EDE6', border: 'none',
              padding: '12px', fontSize: '10px', fontWeight: 700, letterSpacing: '2px',
              cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            }}>
              {submitting ? 'CREATING...' : 'CREATE ACCOUNT →'}
            </button>
          </div>
        </div>
      )}

      {/* Filter */}
      <div style={{ display: 'flex', border: '1.5px solid #1C1208', alignSelf: 'flex-start' }}>
        {(['all', 'faculty', 'hod', 'admin'] as const).map((f, i, arr) => (
          <button key={f} type="button" onClick={() => setFilterRole(f)} style={{
            padding: '7px 14px', fontSize: '9px', fontWeight: 700, letterSpacing: '1px',
            cursor: 'pointer', fontFamily: 'inherit', border: 'none',
            borderRight: i < arr.length - 1 ? '1.5px solid #1C1208' : 'none',
            background: filterRole === f ? '#1C1208' : '#F2EDE6',
            color: filterRole === f ? '#F2EDE6' : '#8A6A4A',
          }}>
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Staff list */}
      {loading ? (
        <div style={{ fontSize: '11px', color: '#8A6A4A' }}>LOADING...</div>
      ) : filtered.length === 0 ? (
        <div style={{ border: '1.5px solid #1C1208', background: '#FDFAF5', padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#1C1208', marginBottom: '6px' }}>No accounts yet</div>
          <div style={{ fontSize: '11px', color: '#8A6A4A' }}>Click CREATE ACCOUNT to add a faculty or HOD account.</div>
        </div>
      ) : (
        <div style={{ border: '1.5px solid #1C1208' }}>
          {filtered.map((s, i) => (
            <div key={s.id} style={{
              display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px',
              borderBottom: i < filtered.length - 1 ? '1px solid #E0D0B8' : 'none',
              background: '#FDFAF5', flexWrap: 'wrap',
            }}>
              {/* Avatar */}
              <div style={{
                width: '36px', height: '36px', background: ROLE_COLOR[s.role] ?? '#8A6A4A',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', fontWeight: 700, color: '#F2EDE6', flexShrink: 0,
              }}>
                {s.full_name.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1C1208' }}>{s.full_name}</div>
                <div style={{ fontSize: '10px', color: '#8A6A4A', marginTop: '2px' }}>
                  {s.email} {s.department ? `· ${s.department}` : ''}
                </div>
              </div>

              {/* Role badge */}
              <span style={{
                fontSize: '8px', fontWeight: 700, letterSpacing: '1px',
                padding: '3px 9px', background: ROLE_COLOR[s.role] ?? '#8A6A4A',
                color: '#F2EDE6', flexShrink: 0,
              }}>
                {s.role.toUpperCase()}
              </span>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                <button
                  type="button"
                  disabled={acting === s.id}
                  onClick={() => handleAction(s.id, 'delete')}
                  style={{
                    background: 'transparent', border: '1px solid #D94F00', color: '#D94F00',
                    padding: '5px 10px', fontSize: '8px', fontWeight: 700,
                    letterSpacing: '1px', cursor: acting === s.id ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {acting === s.id ? '...' : 'DELETE'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}