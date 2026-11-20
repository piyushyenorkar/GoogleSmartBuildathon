/**
 * CompetitionCard.tsx — Reusable competition card for Explore/Community pages
 * Ported from pluto_app/src/shared/CompetitionCard.tsx
 */

import { Link } from 'react-router-dom'
import { Calendar, Users, Trophy, Code, Terminal, FileText, Lightbulb, CheckCircle2, Clock, ArrowRight, ChevronRight, Wifi } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Competition } from '@/types'
import { truncate, formatTargetAudience } from '@/lib/utils'
import { getCdnUrl } from '@/utils/cdn'
import { useCompRegistration } from '@/hooks/useCompetitionRegistrations'
import { useAuthStore } from '@/stores/authStore'
import '@/components/event/EventCard.css'

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  hackathon: { label: 'Hackathon', color: '#a78bfa', bg: 'rgba(139,92,246,0.15)', icon: Code },
  coding_competition: { label: 'Coding', color: '#60a5fa', bg: 'rgba(96,165,250,0.15)', icon: Terminal },
  case_study: { label: 'Case Study', color: '#34d399', bg: 'rgba(52,211,153,0.15)', icon: FileText },
  ideathon: { label: 'Ideathon', color: '#fbbf24', bg: 'rgba(251,191,36,0.15)', icon: Lightbulb },
}

interface CompetitionCardProps {
  item: Competition
  isRegistered?: boolean
  compact?: boolean
}

export function CompetitionCard({ item, isRegistered: propIsRegistered, compact }: CompetitionCardProps) {
  const { user } = useAuthStore()
  const { data: registration } = useCompRegistration(user ? item.id : undefined)
  const isRegistered = propIsRegistered || !!registration

  const cat = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.hackathon
  const CatIcon = cat.icon

  const dateStr = item.start_date
    ? `${new Date(item.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}${item.end_date ? ` - ${new Date(item.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : ''}`
    : ''

  const teamInfo = item.registration_type === 'individual'
    ? 'Individual'
    : `Team (${item.registration_type === 'both' ? 1 : (item.team_size_min || 2)}-${item.team_size_max || 5})`

  const prizePool = (item.prizes || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
  const prizeText = prizePool > 0
    ? prizePool >= 100000 ? `₹${(prizePool / 100000).toFixed(prizePool % 100000 === 0 ? 0 : 1)}L` : `₹${prizePool.toLocaleString('en-IN')}`
    : 'Free'

  let deadlineText = ''
  let deadlineDate = ''
  if (item.registration_deadline) {
    const dl = new Date(item.registration_deadline)
    deadlineDate = dl.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    const now = new Date()
    const diffDays = Math.ceil((dl.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays > 0 && diffDays <= 7) deadlineText = `${diffDays}d left`
    else if (diffDays === 0) deadlineText = 'Closes today'
    else if (diffDays < 0) deadlineText = 'Closed'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <Link to={`/competition/${item.id}`} className="event-card-container glow-card-container" style={compact ? {minWidth: '260px', maxWidth: '320px'} : {}}>
        
        {/* DESKTOP VIEW */}
        <div className="event-card desktop-card">
          {/* Banner Image */}
          <div className="event-card-image-wrapper">
            {item.banner_url ? (
              <img
                src={getCdnUrl(item.banner_url)}
                alt={item.title}
                className="event-card-image"
                loading="lazy"
              />
            ) : (
              <div className="event-card-placeholder">
                <Trophy size={32} style={{ color: 'var(--gray)', opacity: 0.8 }} />
              </div>
            )}

            {/* Category badge */}
            <div style={{
              position: 'absolute', top: 10, left: 10,
              display: 'flex', alignItems: 'center', gap: '4px',
              background: 'rgba(0, 0, 0, 0.5)', color: '#fff',
              padding: '4px 10px', borderRadius: '20px',
              fontSize: '0.7rem', fontWeight: 600,
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <CatIcon size={12} />
              {cat.label}
            </div>

            {/* Deadline Countdown */}
            {deadlineText && (
              <div style={{
                position: 'absolute', top: 10, right: 10,
                display: 'flex', alignItems: 'center', gap: '4px',
                background: 'rgba(0, 0, 0, 0.5)', color: '#fff',
                padding: '4px 10px', borderRadius: '20px',
                fontSize: '0.65rem', fontWeight: 600,
                backdropFilter: 'blur(8px)',
              }}>
                <Clock size={12} />
                {deadlineText}
              </div>
            )}

            {/* Target Audience Badge */}
            {(() => {
              const audience = formatTargetAudience(item)
              if (!audience) return null
              return (
                <div style={{
                  position: 'absolute', bottom: 10, right: 10,
                  display: 'flex', alignItems: 'center', gap: '4px',
                  background: 'rgba(0, 0, 0, 0.6)', color: '#fff',
                  padding: '4px 10px', borderRadius: '20px',
                  fontSize: '0.65rem', fontWeight: 600,
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <Users size={12} />
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>{audience}</span>
                </div>
              )
            })()}
          </div>

          {/* Content */}
          <div className="event-card-body">
            <h3 className="event-card-title">{truncate(item.title, 45)}</h3>

            {item.description && (
              <p className="event-card-description">{item.description}</p>
            )}

            <div className="event-card-meta" style={{ gap: '0.5rem' }}>
              <div className="event-card-meta-item">
                <div style={{ background: 'rgba(255, 255, 255, 0.1)', borderRadius: '6px', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={14} color="#38bdf8" />
                </div>
                <span>{dateStr || 'Dates TBA'}</span>
              </div>
              <div className="event-card-meta-item">
                <div style={{ background: 'rgba(255, 255, 255, 0.1)', borderRadius: '6px', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={14} color="#38bdf8" />
                </div>
                <span>{teamInfo}</span>
              </div>
              {deadlineDate && (
                <div className="event-card-meta-item">
                  <div style={{ background: 'rgba(255, 255, 255, 0.1)', borderRadius: '6px', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Clock size={14} color="#38bdf8" />
                  </div>
                  <span>Deadline: {deadlineDate}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="event-card-footer-wrapper">
              <div className="event-card-footer" style={{ justifyContent: 'center' }}>
                <span className="event-card-price" style={{ color: registration ? (registration.status === 'draft' ? '#fbbf24' : '#34d399') : '#2eece2ff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {registration ? (
                    registration.status === 'draft' ? 'Pending' : 
                    registration.status.charAt(0).toUpperCase() + registration.status.slice(1)
                  ) : 'Register'}
                  {!registration && <ArrowRight size={16} />}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* MOBILE VIEW (React Native Port) */}
        <div className="event-card-mobile mobile-card">
          {item.banner_url ? (
            <img src={item.banner_url} className="ecm-image" alt="" loading="lazy" />
          ) : (
            <div className="ecm-placeholder"><Trophy color="rgba(255,255,255,0.2)" size={36} /></div>
          )}

          <div className="ecm-overlay"></div>

          {/* Top Badges */}
          <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)' }}>
            <CatIcon size={10} color="#fff" />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>{cat.label}</span>
          </div>

          {deadlineText && !isRegistered && (
            <div style={{ position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(255,255,255,0.15)', padding: '4px 8px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={12} color="#f59e0b" />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b' }}>{deadlineText}</span>
            </div>
          )}

          <div className="ecm-content">
            <div className="ecm-info-left">
              {item.is_online && (
                <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 3, backgroundColor: 'rgba(255,255,255,0.15)', padding: '3px 8px', borderRadius: 8, marginBottom: 4 }}>
                  <Wifi size={8} color="#fff" />
                  <span style={{ fontSize: 9, fontWeight: 600, color: '#fff' }}>Online</span>
                </div>
              )}
              <h3 className="ecm-title">{item.title}</h3>

              {dateStr && (
                <div className="ecm-meta-row">
                  <Calendar color="#a1a1aa" size={10} />
                  <span>{dateStr}</span>
                </div>
              )}
              {deadlineDate && (
                <div className="ecm-meta-row">
                  <Clock color="#a1a1aa" size={10} />
                  <span style={{color: '#a1a1aa'}}>Deadline: {deadlineDate}</span>
                </div>
              )}
              <div className="ecm-meta-row">
                <Users color="#a1a1aa" size={10} />
                <span>{teamInfo}</span>
                {prizePool > 0 && (
                  <>
                    <span style={{ color: '#52525b', fontSize: 10 }}> • </span>
                    <Trophy color="#a1a1aa" size={10} />
                    <span>{prizeText}</span>
                  </>
                )}
              </div>
            </div>

            <div className="ecm-info-right" style={{ width: 85 }}>
              <div className="ecm-price-badge" style={{ marginBottom: Number(item.entry_fee) > 0 ? 2 : 8 }}>
                <span>{Number(item.entry_fee) > 0 ? `₹${item.entry_fee}` : 'Free'}</span>
              </div>
              {Number(item.entry_fee) > 0 && (
                <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)', marginBottom: 8, marginTop: -2 }}>per member</span>
              )}

              {isRegistered ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 'auto', backgroundColor: 'rgba(52,211,153,0.1)', padding: '4px 10px', borderRadius: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#34d399' }}>Registered</span>
                </div>
              ) : (
                <div className="ecm-action-btn" style={{ justifyContent: 'flex-end' }}>
                  <span>Register</span>
                  <ChevronRight color="#818cf8" size={12} style={{marginLeft: 2}} />
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
