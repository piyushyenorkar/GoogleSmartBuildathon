import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import {
  User, Palette, Shield, CreditCard, Save, LogOut,
  Bell, Globe, Monitor, AtSign, Code2, Briefcase, Link2,
  CheckCircle, AlertTriangle, Camera, Trash2, ChevronDown, Mail, AlignLeft,
  FileText, ShieldCheck, RefreshCcw, ChevronLeft, Check, Headphones
} from 'lucide-react'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { supabase } from '@/lib/supabase'
import { INDIAN_BANKS } from '@/lib/banks'
import { useAuthStore } from '@/stores/authStore'
import { getInitials } from '@/lib/utils'
import { LegalModal } from '@/components/ui/LegalModal'
import { userService } from '@/services/userService'

import './Settings.css'

type SettingsTab = 'account' | 'preferences' | 'security' | 'payouts'

export default function Settings() {
  const navigate = useNavigate()
  const { user, setUser, signOut } = useAuthStore()
  const isPureOrganizer = user?.roles?.includes('organizer') && !user?.roles?.includes('user') && !user?.roles?.includes('student') && !user?.roles?.includes('admin') && !user?.roles?.includes('staff')

  const [searchParams] = useSearchParams()
  const tabQuery = searchParams.get('tab') as SettingsTab | null

  const [activeTab, setActiveTab] = useState<SettingsTab>(tabQuery || 'account')
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Legal modal state
  const [legalModalType, setLegalModalType] = useState<'terms' | 'privacy' | 'refund' | 'contact' | null>(null)

  // Account form state
  const [firstName, setFirstName] = useState(user?.name?.split(' ')[0] || '')
  const [lastName, setLastName] = useState(user?.name?.split(' ').slice(1).join(' ') || '')
  const [username, setUsername] = useState(user?.username || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [instagram, setInstagram] = useState(user?.socials?.instagram || '')
  const [twitter, setTwitter] = useState(user?.socials?.twitter || '')
  const [linkedin, setLinkedin] = useState(user?.socials?.linkedin || '')
  const [github, setGithub] = useState(user?.socials?.github || '')
  const [portfolio, setPortfolio] = useState(user?.socials?.portfolio || '')
  const [avatarPreview, setAvatarPreview] = useState('')

  // Payout state
  const [bankName, setBankName] = useState(user?.payouts?.bank_name || '')
  const [accountName, setAccountName] = useState(user?.payouts?.account_name || '')
  const [accountNumber, setAccountNumber] = useState(user?.payouts?.account_number || '')
  const [ifscCode, setIfscCode] = useState(user?.payouts?.ifsc_code || '')
  const [upiId, setUpiId] = useState(user?.payouts?.upi_id || '')

  // Bank dropdown state
  const [bankDropdownOpen, setBankDropdownOpen] = useState(false)
  const [bankSearch, setBankSearch] = useState('')
  const bankDropdownRef = useRef<HTMLDivElement>(null)

  // Preferences state
  const [notifications, setNotifications] = useState(true)

  // Close bank dropdown on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (bankDropdownRef.current && !bankDropdownRef.current.contains(e.target as Node)) {
        setBankDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Populate form from user
  useEffect(() => {
    if (!user) return
    const nameParts = (user.name || '').split(' ')
    setFirstName(nameParts[0] || '')
    setLastName(nameParts.slice(1).join(' ') || '')
    setBio(user.bio || '')
    setUsername(user.username || '')
    setInstagram(user.socials?.instagram || '')
    setTwitter(user.socials?.twitter || '')
    setLinkedin(user.socials?.linkedin || '')
    setGithub(user.socials?.github || '')
    setPortfolio(user.socials?.portfolio || '')
    setBankName(user.payouts?.bank_name || '')
    setAccountName(user.payouts?.account_name || '')
    setAccountNumber(user.payouts?.account_number || '')
    setIfscCode(user.payouts?.ifsc_code || '')
    setUpiId(user.payouts?.upi_id || '')

    // Load extended profile from Supabase to sync any changes made elsewhere
    loadProfile()
  }, [user?.id])

  async function loadProfile() {
    if (!user?.id) return
    const { data, error } = await supabase
      .from('users')
      .select('name, profile_avatar, username, bio, instagram, twitter, linkedin, github, portfolio, bank_name, account_name, account_number, ifsc_code, upi_id')
      .eq('id', user.id)
      .maybeSingle()

    if (error) {
      // If columns don't exist, just load what we can
      console.warn('[Settings] loadProfile partial fail — some columns may not exist yet:', error.message)
      const { data: fallback } = await supabase
        .from('users')
        .select('name, profile_avatar')
        .eq('id', user.id)
        .maybeSingle()
      // Nothing else to set
      return
    }

    if (data) {
      setUsername((data as any).username || '')
      setBio((data as any).bio || '')
      setInstagram((data as any).instagram || '')
      setTwitter((data as any).twitter || '')
      setLinkedin((data as any).linkedin || '')
      setGithub((data as any).github || '')
      setPortfolio((data as any).portfolio || '')
      setBankName((data as any).bank_name || '')
      setAccountName((data as any).account_name || '')
      setAccountNumber((data as any).account_number || '')
      setIfscCode((data as any).ifsc_code || '')
      setUpiId((data as any).upi_id || '')

      if ((data as any).profile_avatar && user.avatar_url !== (data as any).profile_avatar) {
        setUser({ ...user, avatar_url: (data as any).profile_avatar })
      }
    }
  }

  // Save account
  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSaving(true)
    setStatus(null)

    const fullName = [firstName, lastName].filter(Boolean).join(' ')

    try {
      // Save name (always works — column always existed)
      const { error: nameErr } = await supabase
        .from('users')
        .update({ name: fullName })
        .eq('id', user.id)

      if (nameErr) throw nameErr

      // Try saving social links (may fail if schema cache not reloaded)
      try {
        await supabase
          .from('users')
          .update({
            username: username || null,
            bio: bio || null,
            instagram: instagram || null,
            twitter: twitter || null,
            linkedin: linkedin || null,
            github: github || null,
            portfolio: portfolio || null,
          })
          .eq('id', user.id)
      } catch {
        console.warn('[Settings] Social links not saved — run NOTIFY pgrst, \'reload schema\'; in Supabase SQL Editor')
      }

      setUser({
        ...user,
        name: fullName,
        username: username || undefined,
        bio: bio || undefined,
        socials: {
          instagram: instagram || undefined,
          twitter: twitter || undefined,
          linkedin: linkedin || undefined,
          github: github || undefined,
          portfolio: portfolio || undefined,
        }
      })
      setStatus({ type: 'success', message: 'Profile updated successfully!' })
    } catch (err: any) {
      console.error('[Settings] Save error:', err)
      setStatus({ type: 'error', message: err.message || 'Failed to save' })
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  const handleSavePayouts = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSaving(true)
    setStatus(null)

    try {
      const { error } = await supabase
        .from('users')
        .update({
          bank_name: bankName || null,
          account_name: accountName || null,
          account_number: accountNumber || null,
          ifsc_code: ifscCode || null,
          upi_id: upiId || null,
        })
        .eq('id', user.id)

      if (error) throw error

      setUser({
        ...user,
        payouts: {
          bank_name: bankName || undefined,
          account_name: accountName || undefined,
          account_number: accountNumber || undefined,
          ifsc_code: ifscCode || undefined,
          upi_id: upiId || undefined,
        }
      })
      setStatus({ type: 'success', message: 'Payout details saved successfully!' })
    } catch (err: any) {
      console.error('[Settings] Payouts save error:', err)
      setStatus({ type: 'error', message: err.message || 'Failed to save payout details. Make sure database columns exist.' })
    } finally {
      setSaving(false)
    }
  }



  const tabs = [
    { id: 'account' as const, label: 'Account', icon: <User size={18} className="text-primary" /> },
    ...(user?.roles?.includes('organizer') ? [{ id: 'payouts' as const, label: 'Payouts', icon: <CreditCard size={18} className="text-primary" /> }] : []),
    { id: 'security' as const, label: 'Security', icon: <Shield size={18} className="text-primary" /> },
  ]

  if (!user) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '4rem' }}>
        <User size={64} strokeWidth={1} style={{ color: 'var(--primary)', opacity: 0.6 }} />
        <h2 style={{ marginTop: '1rem', color: 'var(--white)' }}>Please log in</h2>
        <p style={{ color: 'var(--text-secondary)' }}>You need to be logged in to access settings.</p>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>Settings | PLUTO</title>
      </Helmet>

      <div className="container dashboard-container settings-page">

        <div className="mobile-settings-header hide-desktop">
          <button className="back-btn" onClick={() => navigate(-1)} style={{ position: 'absolute', left: '0.5rem', zIndex: 2, padding: '0.5rem' }}><ChevronLeft size={24} color="#e4e4e7" /></button>

          <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', width: '60%', zIndex: 1 }}>
            <div className="header-title">Settings</div>
          </div>

          {activeTab !== 'security' ? (
            <button
              className="header-save-btn"
              onClick={activeTab === 'account' ? handleSaveAccount : handleSavePayouts}
              disabled={saving || !!status}
              style={{ position: 'absolute', right: '0.5rem', padding: '0.5rem', zIndex: 2, minWidth: '40px', display: 'flex', justifyContent: 'flex-end' }}
            >
              {saving ? (
                <div className="spinner" />
              ) : status?.type === 'success' ? (
                <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="saved-indicator" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle size={18} color="#4ade80" />
                  <span style={{ color: '#4ade80', fontSize: '14px', fontWeight: 700 }}>Saved</span>
                </motion.div>
              ) : (
                <Check size={22} color="#8b5cf6" strokeWidth={2.5} />
              )}
            </button>
          ) : <div style={{ position: 'absolute', right: '0.5rem', width: 40, padding: '0.5rem' }} />}
        </div>

        <div className="settings-split-layout">

          {/* ─── Left Panel (Sticky Navigation & Profile Card) ─── */}
          <motion.div
            className="settings-left-panel"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="settings-profile-card">
              <div className="profile-upload" onClick={() => document.getElementById('avatar-input')?.click()}>
                {(avatarPreview || user.avatar_url) ? (
                  <img src={avatarPreview || user.avatar_url} alt="Avatar" />
                ) : (
                  <div className="profile-upload-placeholder">
                    {getInitials(user.name)}
                  </div>
                )}
                <div className="upload-overlay">
                  <Camera size={24} color="var(--primary)" />
                </div>
              </div>
              <input
                id="avatar-input"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file || !user) return
                  if (file.size > 2 * 1024 * 1024) {
                    setStatus({ type: 'error', message: 'Image size should be less than 2MB' })
                    return
                  }
                  const reader = new FileReader()
                  reader.onload = async (ev) => {
                    const base64 = ev.target?.result as string
                    setAvatarPreview(base64)
                    setSaving(true)
                    setStatus(null)
                    try {
                      let finalUrl = base64;
                      const uploadedUrl = await userService.uploadAvatar(user.id, base64);
                      if (uploadedUrl) {
                        finalUrl = uploadedUrl;
                      }

                      const { error: updateErr } = await supabase
                        .from('users')
                        .update({ profile_avatar: finalUrl })
                        .eq('id', user.id)
                      if (updateErr) throw updateErr

                      setUser({ ...user, avatar_url: finalUrl })
                      setStatus({ type: 'success', message: 'Profile photo updated!' })
                    } catch (err: any) {
                      console.error('[Settings] Avatar save error:', err)
                      setStatus({ type: 'error', message: err.message || 'Failed to save photo' })
                    } finally {
                      setSaving(false)
                    }
                  }
                  reader.readAsDataURL(file)
                }}
              />
              <h2 className="profile-name">{user.name}</h2>
              <span className="profile-email" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><img src="/icons/gmail.svg" alt="Email" style={{ width: 16, height: 16 }} /> {user.email}</span>
            </div>

            <div className="settings-nav">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`settings-nav-btn ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
              <hr className="hide-mobile" style={{ border: 'none', borderBottom: '1px solid rgba(255,255,255,0.06)', margin: '0.5rem 0' }} />
              <button className="settings-nav-btn hide-mobile" onClick={handleLogout} style={{ color: '#ef4444' }}>
                <LogOut size={18} className="text-primary" />
                <span>Logout</span>
              </button>
            </div>
          </motion.div>

          {/* ─── Right Panel (Scrollable Forms) ─── */}
          <div className="settings-right-panel">

            {status && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`settings-status settings-status-${status.type} hide-mobile`}
              >
                {status.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                {status.message}
              </motion.div>
            )}

            {/* ── Account Tab ────────────── */}
            {activeTab === 'account' && (
              <motion.form
                key="account"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleSaveAccount}
                className="settings-right-panel"
              >
                <div className="settings-card">
                  <h3><User size={18} className="text-primary" /> Personal Information</h3>
                  <div className="form-row">
                    <div className="settings-input-group">
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><User size={16} color="var(--text-secondary)" /> First Name</label>
                      <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Enter your first name" />
                    </div>
                    <div className="settings-input-group">
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><User size={16} color="var(--text-secondary)" /> Last Name</label>
                      <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Enter your last name" />
                    </div>
                  </div>
                  <div className="settings-input-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><AtSign size={16} color="var(--text-secondary)" /> Username</label>
                    <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Choose a username" />
                  </div>
                  <div className="settings-input-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><AlignLeft size={16} color="var(--text-secondary)" /> Bio</label>
                    <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell us about yourself..." rows={4} />
                  </div>
                </div>

                <div className="settings-card">
                  <h3><Globe size={18} className="text-primary" /> Social Links</h3>
                  <div className="settings-input-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><img src="/icons/Instagram.webp" alt="Instagram" style={{ width: 16, height: 16, objectFit: 'contain' }} /> Instagram</label>
                    <input type="text" value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="instagram.com/username" />
                  </div>
                  <div className="settings-input-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><img src="/icons/Twitter.png" alt="Twitter" style={{ width: 16, height: 16, objectFit: 'contain' }} /> X (Twitter)</label>
                    <input type="text" value={twitter} onChange={e => setTwitter(e.target.value)} placeholder="x.com/username" />
                  </div>
                  <div className="settings-input-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><img src="/icons/linkedin.png" alt="LinkedIn" style={{ width: 16, height: 16, objectFit: 'contain' }} /> LinkedIn</label>
                    <input type="text" value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="linkedin.com/in/username" />
                  </div>
                  {!isPureOrganizer && (
                    <div className="settings-input-group">
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <svg height="16" width="16" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                        </svg> GitHub
                      </label>
                      <input type="text" value={github} onChange={e => setGithub(e.target.value)} placeholder="github.com/username" />
                    </div>
                  )}
                  {!isPureOrganizer && (
                    <div className="settings-input-group" style={{ marginBottom: 0 }}>
                      <label><Link2 size={16} color="var(--text-secondary)" /> Portfolio</label>
                      <input type="text" value={portfolio} onChange={e => setPortfolio(e.target.value)} placeholder="yourportfolio.com" />
                    </div>
                  )}
                </div>

                <div className="settings-card">
                  <h3><Shield size={18} className="text-primary" /> Terms, Policy & Refunds</h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.85rem' }}>
                    View our platform policies and terms.
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button type="button" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '100px', padding: '0.5rem 1rem' }} onClick={() => setLegalModalType('terms')}>
                      <FileText size={14} color="#c084fc" />
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e4e4e7' }}>Terms</span>
                    </button>
                    <button type="button" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '100px', padding: '0.5rem 1rem' }} onClick={() => setLegalModalType('privacy')}>
                      <ShieldCheck size={14} color="#34d399" />
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e4e4e7' }}>Privacy</span>
                    </button>
                    <button type="button" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '100px', padding: '0.5rem 1rem' }} onClick={() => setLegalModalType('refund')}>
                      <RefreshCcw size={14} color="#fb7185" />
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e4e4e7' }}>Refunds</span>
                    </button>
                  </div>
                </div>
                
                {/* Save Button for Desktop */}
                <div className="hide-mobile" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button type="submit" className="btn settings-save-btn" disabled={saving || !!status}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>

                <div className="settings-card" style={{ background: 'transparent', border: 'none', padding: 0, marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                  <button type="button" className="btn btn-outline" style={{ width: '65%', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#fff', backgroundColor: 'rgba(56, 171, 221, 1)', borderColor: 'rgba(56, 172, 222, 1)' }} onClick={() => setLegalModalType('contact')}>
                    <Headphones size={18} /> Contact Support
                  </button>
                </div>

              </motion.form>
            )}

            {/* ── Security Tab ───────────── */}
            {activeTab === 'security' && (
              <motion.div
                key="security"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="settings-right-panel"
              >
                <div className="security-notice">
                  <Shield size={20} style={{ flexShrink: 0, marginTop: 2, color: 'var(--text-secondary)' }} />
                  <div>
                    <h4 style={{ margin: '0 0 4px', fontSize: '1rem', color: '#fff' }}>Secure Hub</h4>
                    <p style={{ margin: 0 }}>Advanced security features like password changes and 2FA are managed securely via your Supabase Auth dashboard.</p>
                  </div>
                </div>

                <div className="settings-card">
                  <h3><Shield size={18} className="text-primary" /> Access Control</h3>
                  <div className="settings-input-group">
                    <label>Change Password</label>
                    <button className="btn btn-outline" disabled style={{ opacity: 0.6, cursor: 'not-allowed', width: 'fit-content' }} type="button">
                      Change Password (Coming Soon)
                    </button>
                    <span className="form-hint" style={{ marginTop: '0.75rem' }}>External auth providers do not require a password change here.</span>
                  </div>
                </div>

                <div className="settings-card">
                  <h3><CheckCircle size={18} className="text-primary" /> Two-Factor Authentication</h3>
                  <div className="preference-item" style={{ marginBottom: 0 }}>
                    <div className="preference-info">
                      <h4>Enable 2FA</h4>
                      <p>Add an extra layer of security to your account</p>
                    </div>
                    <label className="toggle-switch" style={{ opacity: 0.5 }}>
                      <input type="checkbox" disabled />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                <div className="settings-card">
                  <h3><Monitor size={18} className="text-primary" /> Active Sessions</h3>
                  <div className="preference-item" style={{ marginBottom: 0 }}>
                    <div className="preference-info">
                      <h4>Current Browser</h4>
                      <p>Last active: Just now</p>
                    </div>
                    <span className="active-badge">Active Now</span>
                  </div>
                </div>
                <div className="settings-card hide-desktop">
                  <h3><Shield size={18} className="text-primary" /> Session Management</h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                    Sign out of your account on this device.
                  </p>
                  <button
                    type="button"
                    className="btn"
                    onClick={handleLogout}
                    style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: 'none', borderRadius: '24px', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', fontWeight: 600 }}
                  >
                    <LogOut size={18} />
                    Logout from this device
                  </button>
                </div>

                <div className="settings-card" style={{ border: 'none' }}>
                  <h3 style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Trash2 size={18} color="white" /> Danger Zone
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => navigate('/delete-account')}
                    style={{ backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '12px', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <Trash2 size={18} />
                    Delete Account
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Payouts Tab (Organizers Only) ── */}
            {activeTab === 'payouts' && (
              <motion.form
                key="payouts"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleSavePayouts}
                className="settings-right-panel"
              >
                <div className="security-notice">
                  <CreditCard size={20} style={{ flexShrink: 0, marginTop: 2, color: 'var(--text-secondary)' }} />
                  <div>
                    <h4 style={{ margin: '0 0 4px', fontSize: '1rem', color: '#fff' }}>Payout Details</h4>
                    <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)' }}>Your event earnings are securely processed via Razorpay. Provide your bank account or UPI details below so we can securely transfer your requested withdrawals.</p>
                  </div>
                </div>

                <div className="settings-card" style={{ zIndex: 10, position: 'relative' }}>
                  <h3><Shield size={18} className="text-primary" /> Bank Account Details</h3>
                  <div className="form-row">
                    <div className="settings-input-group" ref={bankDropdownRef}>
                      <label>Bank Name</label>
                      <div className="bank-select-wrapper">
                        {bankDropdownOpen ? (
                          <input
                            type="text"
                            className="bank-input"
                            placeholder="Type to search bank..."
                            value={bankSearch}
                            onChange={e => {
                              setBankSearch(e.target.value)
                            }}
                            autoFocus
                          />
                        ) : (
                          <div
                            className="bank-input bank-input-display"
                            onClick={() => {
                              setBankDropdownOpen(true)
                              setBankSearch('')
                            }}
                          >
                            {bankName ? (
                              <>
                                <img
                                  src={INDIAN_BANKS.find(b => b.name === bankName)?.logo}
                                  alt=""
                                  className="bank-logo"
                                  onError={e => {
                                    const el = e.target as HTMLImageElement
                                    el.style.display = 'none'
                                    const fb = el.nextElementSibling
                                    if (fb) (fb as HTMLElement).style.display = 'flex'
                                  }}
                                />
                                <span className="bank-logo-fallback">{bankName.charAt(0)}</span>
                                <span>{bankName}</span>
                              </>
                            ) : (
                              <span style={{ color: 'rgba(255,255,255,0.35)' }}>Type to search bank...</span>
                            )}
                          </div>
                        )}
                        {bankDropdownOpen && (() => {
                          const q = bankSearch.toLowerCase()
                          const filtered = q
                            ? INDIAN_BANKS.filter(b => b.name.toLowerCase().includes(q))
                            : [...INDIAN_BANKS]
                          return filtered.length > 0 ? (
                            <div className="bank-dropdown">
                              <div className="bank-dropdown-list">
                                {filtered.map(bank => (
                                  <div
                                    key={bank.name}
                                    className={`bank-dropdown-item ${bankName === bank.name ? 'selected' : ''}`}
                                    onMouseDown={(e) => {
                                      e.preventDefault()
                                      setBankName(bank.name)
                                      setBankDropdownOpen(false)
                                      setBankSearch('')
                                    }}
                                  >
                                    <img
                                      src={bank.logo}
                                      alt=""
                                      className="bank-logo"
                                      onError={e => {
                                        const el = e.target as HTMLImageElement
                                        el.style.display = 'none'
                                        const fallback = el.nextElementSibling
                                        if (fallback) (fallback as HTMLElement).style.display = 'flex'
                                      }}
                                    />
                                    <span className="bank-logo-fallback">{bank.name.charAt(0)}</span>
                                    <span>{bank.name}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="bank-dropdown">
                              <div className="bank-dropdown-list">
                                <div className="bank-dropdown-item" style={{ opacity: 0.5, cursor: 'default' }}>No banks found</div>
                              </div>
                            </div>
                          )
                        })()}
                      </div>
                    </div>
                    <div className="settings-input-group">
                      <label>Account Holder Name</label>
                      <input type="text" value={accountName} onChange={e => setAccountName(e.target.value)} placeholder="Name exactly as on bank" required />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="settings-input-group">
                      <label>Account Number</label>
                      <input type="password" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="Enter Account Number" required />
                    </div>
                    <div className="settings-input-group">
                      <label>IFSC Code</label>
                      <input type="text" value={ifscCode} onChange={e => setIfscCode(e.target.value.toUpperCase())} placeholder="e.g. HDFC0001234" required />
                    </div>
                  </div>
                </div>

                <div className="settings-card">
                  <h3><CreditCard size={18} className="text-primary" /> Alternate: UPI ID</h3>
                  <div className="settings-input-group" style={{ marginBottom: 0 }}>
                    <label>UPI Virtual Payment Address</label>
                    <input type="text" value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="e.g. username@upi" />
                    <span className="form-hint">Fastest payout method for amounts under ₹1,00,000.</span>
                  </div>
                </div>

                <div className="hide-mobile" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <button type="submit" className="btn settings-save-btn" disabled={saving || !!status}>
                    {saving ? 'Saving...' : 'Save Payout Details'}
                  </button>
                </div>
              </motion.form>
            )}

          </div>
        </div>
      </div>

      <LegalModal type={legalModalType} onClose={() => setLegalModalType(null)} />
    </>
  )
}
