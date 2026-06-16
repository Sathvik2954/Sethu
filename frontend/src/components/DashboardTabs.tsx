'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

type Profile = {
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

type Props = {
  profile: Profile
  userId: string
  overviewContent: React.ReactNode
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

const inputStyle: React.CSSProperties = {
  width: '100%', border: '1.5px solid #C8A878',
  background: '#F2EDE6', padding: '10px 12px',
  fontSize: '13px', color: '#1C1208',
  outline: 'none', borderRadius: 0, fontFamily: 'inherit',
  display: 'block',
}

const labelStyle: React.CSSProperties = {
  fontSize: '9px', fontWeight: 700,
  letterSpacing: '1.5px', color: '#6A4A2A',
  marginBottom: '6px', display: 'block',
}

export default function DashboardTabs({ profile, userId, overviewContent }: Props) {
  const [tab, setTab] = useState<'overview' | 'profile'>('overview')
  const [form, setForm] = useState({
    full_name: profile.full_name ?? '',
    phone_number: profile.phone_number ?? '',
    blood_group: profile.blood_group ?? '',
    section: profile.section ?? '',
    department: profile.department ?? '',
    roll_number: profile.roll_number ?? '',
    year: profile.year?.toString() ?? '',
    skillInput: '',
    skills: profile.skills ?? [],
  })
  const [photoUrl, setPhotoUrl] = useState(profile.profile_photo_url ?? '')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    setSaveMsg('')
    setError('')
  }

  function addSkill() {
    const s = form.skillInput.trim()
    if (!s || form.skills.includes(s)) return
    setForm(prev => ({ ...prev, skills: [...prev.skills, s], skillInput: '' }))
  }

  function removeSkill(skill: string) {
    setForm(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }))
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { setError('Photo must be under 2 MB'); return }

    setUploading(true)
    setError('')

    const ext = file.name.split('.').pop()
    const path = `${userId}/avatar.${ext}`

    const { error: upErr } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })

    if (upErr) { setError('Upload failed: ' + upErr.message); setUploading(false); return }

    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    const url = data.publicUrl + `?t=${Date.now()}`
    setPhotoUrl(url)
    setUploading(false)
  }

  async function handleSave() {
    setSaving(true)
    setSaveMsg('')
    setError('')

    const { error: dbErr } = await supabase.from('users').update({
      full_name: form.full_name,
      phone_number: form.phone_number || null,
      blood_group: form.blood_group || null,
      section: form.section || null,
      department: form.department || null,
      roll_number: form.roll_number || null,
      year: form.year ? parseInt(form.year) : null,
      skills: form.skills.length ? form.skills : null,
      profile_photo_url: photoUrl || null,
    }).eq('id', userId)

    if (dbErr) { setError('Save failed: ' + dbErr.message) }
    else { setSaveMsg('Profile saved successfully.') }
    setSaving(false)
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '10px',
    fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px',
    background: active ? '#1C1208' : '#F2EDE6',
    color: active ? '#F2EDE6' : '#8A6A4A',
    border: 'none', cursor: 'pointer', fontFamily: 'inherit',
    borderBottom: active ? '2px solid #D94F00' : '2px solid transparent',
  })

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Tab bar */}
      <div style={{
        display: 'flex', borderBottom: '2px solid #1C1208',
        background: '#F2EDE6', flexShrink: 0,
      }}>
        <button type="button" onClick={() => setTab('overview')} style={tabStyle(tab === 'overview')}>
          OVERVIEW
        </button>
        <button type="button" onClick={() => setTab('profile')} style={tabStyle(tab === 'profile')}>
          MY PROFILE
        </button>
      </div>

      {/* Overview tab */}
      {tab === 'overview' && (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {overviewContent}
        </div>
      )}

      {/* Profile tab */}
      {tab === 'profile' && (
        <main style={{
          flex: 1, overflowY: 'auto',
          padding: 'clamp(12px, 4vw, 24px)',
          display: 'flex', flexDirection: 'column', gap: '16px',
        }}>

          {/* Photo + name row */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '20px',
            flexWrap: 'wrap',
          }}>
            {/* Avatar */}
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                width: '80px', height: '80px', flexShrink: 0,
                border: '2px solid #1C1208', cursor: 'pointer',
                background: '#E8DDD0', position: 'relative',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {photoUrl
                ? <img src={photoUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: '28px', fontWeight: 700, color: '#8A6A4A' }}>
                    {form.full_name.charAt(0).toUpperCase() || '?'}
                  </span>
              }
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                background: 'rgba(28,18,8,0.65)', padding: '3px',
                fontSize: '7px', fontWeight: 700, color: '#F2EDE6',
                letterSpacing: '1px', textAlign: 'center',
              }}>
                {uploading ? 'UPLOADING...' : 'CHANGE'}
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />

            {/* Name + roll + dept */}
            <div style={{ flex: 1, minWidth: '180px' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#1C1208', letterSpacing: '0.5px' }}>
                {form.full_name || '—'}
              </div>
              <div style={{ fontSize: '11px', color: '#8A6A4A', marginTop: '4px' }}>
                {form.roll_number || 'No roll number'} · {form.department || 'No dept'}
              </div>
              <div style={{ fontSize: '10px', color: '#8A6A4A', marginTop: '2px' }}>
                {form.year ? `Year ${form.year}` : ''}{form.section ? ` · Sec ${form.section}` : ''}
              </div>
            </div>
          </div>

          {/* Form */}
          <div style={{ border: '1.5px solid #1C1208', background: '#FDFAF5' }}>
            <div style={{
              borderBottom: '1.5px solid #1C1208', padding: '10px 18px',
              fontSize: '9px', fontWeight: 700, letterSpacing: '2px', color: '#8A6A4A',
            }}>
              PERSONAL INFO
            </div>
            <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>FULL NAME</label>
                  <input type="text" value={form.full_name} onChange={e => update('full_name', e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>PHONE NUMBER</label>
                  <input type="tel" value={form.phone_number} onChange={e => update('phone_number', e.target.value)} placeholder="+91 XXXXX XXXXX" style={inputStyle} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>ROLL NUMBER</label>
                  <input type="text" value={form.roll_number} onChange={e => update('roll_number', e.target.value)} placeholder="160122737XXX" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>BLOOD GROUP</label>
                  <select value={form.blood_group} onChange={e => update('blood_group', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="">Select</option>
                    {BLOOD_GROUPS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>DEPARTMENT</label>
                  <input type="text" value={form.department} onChange={e => update('department', e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>YEAR</label>
                  <select value={form.year} onChange={e => update('year', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="">Select</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>SECTION</label>
                  <input type="text" value={form.section} onChange={e => update('section', e.target.value.toUpperCase())} placeholder="A" maxLength={2} style={inputStyle} />
                </div>
              </div>

            </div>
          </div>

          {/* Skills */}
          <div style={{ border: '1.5px solid #1C1208', background: '#FDFAF5' }}>
            <div style={{
              borderBottom: '1.5px solid #1C1208', padding: '10px 18px',
              fontSize: '9px', fontWeight: 700, letterSpacing: '2px', color: '#8A6A4A',
            }}>
              SKILLS
            </div>
            <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {form.skills.map(skill => (
                  <div key={skill} style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: '#1C1208', color: '#F2EDE6',
                    padding: '4px 10px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px',
                  }}>
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      style={{
                        background: 'transparent', border: 'none', color: '#C8A878',
                        cursor: 'pointer', fontSize: '12px', lineHeight: 1, padding: 0,
                        fontFamily: 'inherit',
                      }}
                    >×</button>
                  </div>
                ))}
                {form.skills.length === 0 && (
                  <span style={{ fontSize: '11px', color: '#8A6A4A' }}>No skills added yet</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={form.skillInput}
                  onChange={e => setForm(p => ({ ...p, skillInput: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && addSkill()}
                  placeholder="e.g. Python, Machine Learning"
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button
                  type="button"
                  onClick={addSkill}
                  style={{
                    background: '#1C1208', color: '#F2EDE6', border: 'none',
                    padding: '0 16px', fontSize: '10px', fontWeight: 700,
                    letterSpacing: '1px', cursor: 'pointer', fontFamily: 'inherit',
                    whiteSpace: 'nowrap',
                  }}
                >ADD</button>
              </div>
            </div>
          </div>

          {/* Error / success */}
          {error && (
            <div style={{ fontSize: '11px', color: '#D94F00', borderLeft: '2px solid #D94F00', paddingLeft: '10px' }}>
              {error}
            </div>
          )}
          {saveMsg && (
            <div style={{ fontSize: '11px', color: '#3D7A50', borderLeft: '2px solid #3D7A50', paddingLeft: '10px' }}>
              {saveMsg}
            </div>
          )}

          {/* Save button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || uploading}
            style={{
              background: saving ? '#8A6A4A' : '#1C1208',
              color: '#F2EDE6', border: 'none', padding: '13px',
              fontSize: '10px', fontWeight: 700, letterSpacing: '2px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', width: '100%',
            }}
          >
            {saving ? 'SAVING...' : 'SAVE PROFILE →'}
          </button>

        </main>
      )}
    </div>
  )
}