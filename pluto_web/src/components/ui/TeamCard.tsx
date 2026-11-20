import { useRef } from 'react'
import { motion } from 'framer-motion'
import { Users, MapPin, CalendarDays, CheckCircle2 } from 'lucide-react'
import { CursorGlow } from '@/components/ui/CursorGlow'
import type { Team } from '@/hooks/usePortfolio'

export const formatEventDate = (dateStr: string) => {
  if (!dateStr) return ''

  if (dateStr.includes(' to ')) {
    const parts = dateStr.split(' to ')
    const d1 = formatSingleDate(parts[0])
    const d2 = formatSingleDate(parts[1])
    if (d1 && d2 && d1 !== d2) return `${d1} to ${d2}`
    return d1 || dateStr
  }
  return formatSingleDate(dateStr)
}

const formatSingleDate = (dateStr: string) => {
  if (!dateStr) return ''
  let d: Date
  if (dateStr.includes('-')) {
    const [year, month, day] = dateStr.split('T')[0].split('-')
    d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  } else {
    d = new Date(dateStr)
  }
  if (isNaN(d.getTime())) return dateStr
  const day = d.getDate()
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const month = monthNames[d.getMonth()].toLowerCase()
  return `${day} ${month}`
}

export const formatEventTime = (timeStr: string) => {
  if (!timeStr) return ''

  if (timeStr.includes(' to ')) {
    const parts = timeStr.split(' to ')
    const t1 = formatSingleTime(parts[0])
    const t2 = formatSingleTime(parts[1])
    if (t1 && t2 && t1 !== t2) return `${t1} to ${t2}`
    return t1 || timeStr
  }
  return formatSingleTime(timeStr)
}

const formatSingleTime = (timeStr: string) => {
  if (!timeStr) return ''
  const parts = timeStr.split(':')
  if (parts.length < 2) return timeStr
  let hours = parseInt(parts[0], 10)
  const minutes = parseInt(parts[1], 10)
  if (isNaN(hours) || isNaN(minutes)) return timeStr
  const ampm = hours >= 12 ? 'pm' : 'am'
  hours = hours % 12
  hours = hours ? hours : 12
  const minStr = minutes < 10 ? '0' + minutes : minutes
  return `${hours}:${minStr} ${ampm}`
}

export const ROLE_ICONS: Record<string, React.ReactNode> = {
  'Frontend': <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" alt="Frontend" style={{ width: '14px', height: '14px', objectFit: 'contain' }} />,
  'Backend': <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" alt="Backend" style={{ width: '14px', height: '14px', objectFit: 'contain' }} />,
  'Full Stack': <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg" alt="Full Stack" style={{ width: '14px', height: '14px', objectFit: 'contain' }} />,
  'AI/ML': <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tensorflow/tensorflow-original.svg" alt="AI/ML" style={{ width: '14px', height: '14px', objectFit: 'contain' }} />,
  'Data Science': <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/pandas/pandas-original.svg" alt="Data Science" style={{ width: '14px', height: '14px', objectFit: 'contain' }} />,
  'UI/UX Designer': <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/figma/figma-original.svg" alt="UI/UX" style={{ width: '14px', height: '14px', objectFit: 'contain' }} />,
  'DevOps': <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg" alt="DevOps" style={{ width: '14px', height: '14px', objectFit: 'contain' }} />,
  'Mobile Dev': <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flutter/flutter-original.svg" alt="Mobile" style={{ width: '14px', height: '14px', objectFit: 'contain' }} />,
  'Blockchain': <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/solidity/solidity-original.svg" alt="Blockchain" style={{ width: '14px', height: '14px', objectFit: 'contain' }} />,
  'Cybersecurity': <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg" alt="Cybersecurity" style={{ width: '14px', height: '14px', objectFit: 'contain' }} />,
  'Cloud': <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/googlecloud/googlecloud-original.svg" alt="Cloud" style={{ width: '14px', height: '14px', objectFit: 'contain' }} />,
  'Game Dev': <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/unity/unity-original.svg" alt="Game Dev" style={{ width: '14px', height: '14px', objectFit: 'contain' }} />,
  'IoT': <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/arduino/arduino-original.svg" alt="IoT" style={{ width: '14px', height: '14px', objectFit: 'contain' }} />,
  'AR/VR': <span style={{ fontSize: '14px', lineHeight: 1 }}>🥽</span>,
  'Project Manager': <span style={{ fontSize: '14px', lineHeight: 1 }}>📊</span>,
  'Content Writer': <span style={{ fontSize: '14px', lineHeight: 1 }}>✍️</span>,
  'Video Editor': <span style={{ fontSize: '14px', lineHeight: 1 }}>🎬</span>,
}

interface Props {
  team: Team
  index?: number
  onApply?: (team: Team) => void
}

export function TeamCard({ team, index = 0, onApply }: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const approvedCount = team.team_members?.filter(m => m.status === 'approved').length || 0
  const spotsLeft = team.team_size - approvedCount - 1 // -1 for creator

  const isClosed = spotsLeft <= 0 || team.status === 'closed' || team.status === 'full'
  const displayStatus = isClosed ? 'CLOSED' : team.status === 'open' ? 'OPEN' : team.status.toUpperCase()
  const statusClass = isClosed ? 'closed' : team.status === 'open' ? 'open' : team.status

  return (
    <motion.div
      ref={cardRef}
      className={`tc-card glow-card-container ${isClosed ? 'closed' : ''}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => onApply?.(team)}
      role="button"
    >
      {/* Card Base */}

      <div className="tc-top">
        <h3 className="tc-title">{team.team_name || team.competition_name}</h3>
        <span className={`tc-status ${statusClass}`}>{displayStatus}</span>
      </div>

      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 500 }}>
        Event: <span style={{ color: 'var(--white)' }}>{team.competition_name}</span>
      </div>



      <div className="tc-roles">
        {(team.roles || []).slice(0, 2).map((role, i) => {
          const isFilled = team.team_members?.some(m => m.role === role && m.status === 'approved')
          return (
            <span key={i} className={`tc-role-chip ${isFilled ? 'taken' : ''}`} title={isFilled ? 'Role Filled' : 'Open Role'}>
              {isFilled && <CheckCircle2 size={12} style={{ flexShrink: 0 }} />}
              <span style={{ flexShrink: 0 }}>{ROLE_ICONS[role]}</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{role}</span>
            </span>
          )
        })}
        {(team.roles || []).length > 2 && (
          <span className="tc-role-chip tc-more">+{team.roles.length - 2}</span>
        )}
      </div>

      <div className="tc-meta-bar" style={{ flexWrap: 'wrap' }}>
        <span><Users size={13} /> {approvedCount + 1}/{team.team_size}</span>
        {team.event_date && <span><CalendarDays size={13} /> {formatEventDate(team.event_date)}</span>}
        {(() => {
          const loc = team.location || (team as any).creator_college_city
          const state = (team as any).creator_college_state

          if (!loc) return null

          const fullLocation = [loc, state].filter(Boolean).join(', ')
          return (
            <span style={{
              width: '100%',
              overflow: 'hidden'
            }}>
              <MapPin size={13} style={{ flexShrink: 0 }} />
              <span style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: 'block'
              }}>
                {fullLocation}
              </span>
            </span>
          )
        })()}
      </div>

      <div className="tc-footer">
        <span className="tc-creator">
          {team.creator_avatar ? (
            <img src={team.creator_avatar} alt={team.creator_name} className="tc-creator-avatar" style={{ objectFit: 'cover' }} />
          ) : (
            <span className="tc-creator-avatar">{(team.creator_name || '?')[0].toUpperCase()}</span>
          )}
          {team.creator_name}
        </span>
        {spotsLeft > 0 ? (
          <span className="tc-spots">{spotsLeft} spot{spotsLeft > 1 ? 's' : ''} left</span>
        ) : (
          <span className="tc-full">Full</span>
        )}
      </div>
    </motion.div>
  )
}
