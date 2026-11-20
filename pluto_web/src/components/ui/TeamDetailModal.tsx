import { useState } from 'react'
import { motion } from 'framer-motion'
import { Users, MapPin, CalendarDays, X, Send, CheckCircle2, Clock, Circle, Rocket, XCircle } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { useApplyToTeam, type Team } from '@/hooks/usePortfolio'
import { ROLE_ICONS } from '@/components/ui/TeamCard'

interface Props {
  team: Team | null
  open: boolean
  onClose: () => void
}

export function TeamDetailModal({ team, open, onClose }: Props) {
  const { user } = useAuthStore()
  const { openAuthModal } = useUIStore()
  const [selectedRole, setSelectedRole] = useState('')
  const [intro, setIntro] = useState('')
  const [applied, setApplied] = useState(false)
  const applyToTeam = useApplyToTeam()

  if (!team || !open) return null

  const approvedMembers = team.team_members?.filter(m => m.status === 'approved') || []
  const pendingMembers = team.team_members?.filter(m => m.status === 'pending') || []
  const isCreator = user?.id === team.creator_id
  const currentUserMember = team.team_members?.find(m => m.user_id === user?.id)
  const hasApplied = applied || !!currentUserMember
  const isFull = (approvedMembers.length + 1) >= team.team_size
  const approvedRoles = approvedMembers.map(m => m.role)
  const pendingRoles = pendingMembers.map(m => m.role)
  const availableRoles = (team.roles || []).filter(r => !approvedRoles.includes(r) && !pendingRoles.includes(r))

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !selectedRole) return

    await applyToTeam.mutateAsync({
      teamId: team.id,
      userId: user.id,
      email: user.email || '',
      name: user.name || user.email?.split('@')[0] || 'Anonymous',
      role: selectedRole,
      intro: intro.trim(),
    })

    setSelectedRole('')
    setIntro('')
    setApplied(true)

    // Auto-close after showing success
    setTimeout(() => {
      setApplied(false)
      onClose()
    }, 2000)
  }

  const handleClose = () => {
    setApplied(false)
    setSelectedRole('')
    setIntro('')
    onClose()
  }

  const formatEventDate = (dateString?: string) => {
    if (!dateString) return ''
    const formatSingleDate = (ds: string) => {
      try {
        const d = new Date(ds)
        if (isNaN(d.getTime())) return ds
        const day = d.getDate()
        const month = d.toLocaleString('en-US', { month: 'short' }).toLowerCase()
        const year = d.getFullYear()
        return `${day} ${month} ${year}`
      } catch {
        return ds
      }
    }
    if (dateString.includes(' to ')) {
      return dateString.split(' to ').map(formatSingleDate).join(' - ')
    }
    return formatSingleDate(dateString)
  }

  return (
    <div className="tdm-overlay" onClick={handleClose}>
      <motion.div
        className="tdm-modal"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={e => e.stopPropagation()}
      >
        <button className="tdm-close" onClick={handleClose} style={{ zIndex: 10 }}><X size={16} /></button>

        <div className="tdm-content">
          {/* Title + Status */}
          <div className="tdm-header">
            <h2>{team.team_name || team.competition_name}</h2>
            <span className={`tc-status ${team.status}`}>{team.status}</span>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', fontWeight: 500 }}>
            Event: <span style={{ color: 'var(--white)' }}>{team.competition_name}</span>
          </div>

          {/* Description / Purpose inner card */}
          {team.purpose && (
            <div className="tdm-inner-card" style={{ marginBottom: '14px' }}>
              <div className="tdm-inner-card-label">Purpose</div>
              <p className="tdm-purpose">{team.purpose}</p>
            </div>
          )}

          {/* Meta info card (count, location, date) */}
          <div className="tdm-meta" style={{ marginBottom: '20px' }}>
            <span><Users size={14} /> {approvedMembers.length + 1}/{team.team_size}</span>
            {team.location && <span><MapPin size={14} /> {team.location}</span>}
            {team.event_date && <span><CalendarDays size={14} /> {formatEventDate(team.event_date)}</span>}
          </div>

          {/* Required Roles with visual status */}
          <div className="tdm-section" style={{ marginBottom: '20px' }}>
            <h4>Required Roles</h4>
            <div className="tdm-roles">
              {(team.roles || []).map((role, i) => {
                const isApproved = approvedRoles.includes(role)
                const isPending = pendingRoles.includes(role)
                return (
                  <span
                    key={i}
                    className={`tc-role-chip ${isApproved ? 'taken' : ''} ${isPending ? 'pending-role' : ''}`}
                    title={isApproved ? 'Filled' : isPending ? 'Application pending' : 'Available'}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    {isApproved && <CheckCircle2 size={12} />}
                    {isPending && <Clock size={12} />}
                    {ROLE_ICONS[role]} {role}
                  </span>
                )
              })}
            </div>
          </div>

          {/* Team Members — always show leader first */}
          <div className="tdm-section" style={{ marginBottom: '20px' }}>
            <h4>Team Members</h4>
            <div className="tdm-members">
              {/* Creator / Leader */}
              <div className="tdm-member">
                {team.creator_avatar ? (
                  <img src={team.creator_avatar} alt={team.creator_name} className="tdm-member-avatar" style={{ objectFit: 'cover' }} />
                ) : (
                  <div className="tdm-member-avatar">{(team.creator_name || '?')[0].toUpperCase()}</div>
                )}
                <div style={{ flex: 1 }}>
                  <div className="tdm-member-name">{team.creator_name}</div>
                  <div className="tdm-member-role">Leader</div>
                </div>
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  color: 'var(--primary-light)',
                  background: 'rgba(99, 102, 241, 0.12)',
                  padding: '3px 10px',
                  borderRadius: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>Leader</span>
              </div>
              {/* Other approved members */}
              {approvedMembers.map(m => (
                <div key={m.id} className="tdm-member">
                  {m.avatar ? (
                    <img src={m.avatar} alt={m.name} className="tdm-member-avatar" style={{ objectFit: 'cover' }} />
                  ) : (
                    <div className="tdm-member-avatar">{(m.name || '?')[0].toUpperCase()}</div>
                  )}
                  <div>
                    <div className="tdm-member-name">{m.name}</div>
                    <div className="tdm-member-role">{m.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Apply success message */}
          {applied && (
            <motion.div
              className="tdm-success-badge"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <CheckCircle2 size={18} /> Application submitted! The team leader will review it.
            </motion.div>
          )}

          {/* Apply form — only if not creator, not already applied, not full, and logged in */}
          {!applied && !isCreator && !hasApplied && !isFull && user && availableRoles.length > 0 && (
            <form className="tdm-apply" onSubmit={handleApply}>
              <h4><Rocket size={16} /> Apply to this Team</h4>
              <div className="tdm-form-group">
                <label>Select Role</label>
                <select value={selectedRole} onChange={e => setSelectedRole(e.target.value)} required>
                  <option value="">Choose a role...</option>
                  {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="tdm-form-group">
                <label>Introduction</label>
                <textarea value={intro} onChange={e => setIntro(e.target.value)} placeholder="Why should you be picked? Share a short intro..." rows={3} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', borderRadius: 16, padding: '12px' }} disabled={applyToTeam.isPending || !selectedRole}>
                {applyToTeam.isPending ? <><span className="spinner" /> Applying...</> : <><Send size={16} /> Apply</>}
              </button>
            </form>
          )}

          {/* Not logged in */}
          {!user && !isCreator && (
            <div className="tdm-apply" style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Login to apply for this team
              </p>
              <button className="btn btn-primary" style={{ borderRadius: 16 }} onClick={() => { handleClose(); openAuthModal('login') }}>
                Login
              </button>
            </div>
          )}

          {/* User Status */}
          {!applied && currentUserMember && (
            currentUserMember.status === 'approved' ? (
              <div className="tdm-applied-badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', border: 'none' }}>
                <CheckCircle2 size={16} /> You are already in the team
              </div>
            ) : currentUserMember.status === 'rejected' ? (
              <div className="tdm-applied-badge" style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.08)', border: 'none' }}>
                <XCircle size={16} /> Your application was not accepted
              </div>
            ) : (
              <div className="tdm-applied-badge">
                <Clock size={16} /> You've already applied to this team
              </div>
            )
          )}

          {/* Team full */}
          {isFull && !isCreator && !hasApplied && (
            <div className="tdm-full-badge">Team is full — no spots available</div>
          )}

          {/* Creator view hint */}
          {isCreator && (
            <div className="tdm-creator-badge">
              <CheckCircle2 size={16} /> This is your team.
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
