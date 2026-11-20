import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import {
  Home, Users, Plus, Settings, MoreVertical,
  LayoutGrid, CalendarDays, Ticket, Sparkles, GraduationCap,
  FolderKanban
} from 'lucide-react'
import './MobileDock.css'

const TAB_ICONS = {
  explore: {
    outline: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    solid: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3L2 12h3v8h5v-6h4v6h5v-8h3L12 3z"/></svg>
  },
  community: {
    outline: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>,
    solid: <svg viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM9.88 9.88L7.76 16.24L14.12 14.12L16.24 7.76L9.88 9.88Z"/></svg>
  },
  profiles: {
    outline: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    solid: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
  },
  projects: {
    outline: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-1.22-1.8A2 2 0 0 0 7.53 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/><path d="M8 10v4"/><path d="M12 10v2"/><path d="M16 10v6"/></svg>,
    solid: <svg viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" clipRule="evenodd" d="M4 3a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-1.22-1.8A2 2 0 0 0 7.53 3H4Zm3 7h2v4H7v-4Zm4 0h2v2h-2v-2Zm4 0h2v6h-2v-6Z"/></svg>
  },
  team: {
    outline: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
    solid: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
  }
}

export function MobileDock() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { openAuthModal } = useUIStore()

  const isActive = (path: string) => location.pathname === path
  const isOrganizerMode = location.pathname.startsWith('/organizer')

  // Don't show on landing page
  if (location.pathname === '/') return null

  // Hide dock completely on admin pages since they are for student side
  if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/organizer') || location.pathname.startsWith('/event/') || location.pathname.startsWith('/competition/') || location.pathname.startsWith('/book/') || location.pathname.startsWith('/payment/') || location.pathname === '/success') return null

  return (
    <div className="mobile-dock">
      <Link to="/explore" className={`dock-item ${isActive('/explore') ? 'active' : ''}`}>
        <div className="dock-icon">
          <span className="icon-outline" style={{ width: 26, height: 26 }}>{TAB_ICONS.explore.outline}</span>
          <span className="icon-solid" style={{ width: 24, height: 24 }}>{TAB_ICONS.explore.solid}</span>
        </div>
      </Link>
      <Link to="/community" className={`dock-item ${isActive('/community') ? 'active' : ''}`}>
        <div className="dock-icon">
          <span className="icon-outline" style={{ width: 26, height: 26 }}>{TAB_ICONS.community.outline}</span>
          <span className="icon-solid" style={{ width: 24, height: 24 }}>{TAB_ICONS.community.solid}</span>
        </div>
      </Link>
      <Link to="/students" className={`dock-item ${isActive('/students') ? 'active' : ''}`}>
        <div className="dock-icon">
          <span className="icon-outline" style={{ width: 26, height: 26 }}>{TAB_ICONS.profiles.outline}</span>
          <span className="icon-solid" style={{ width: 24, height: 24 }}>{TAB_ICONS.profiles.solid}</span>
        </div>
      </Link>
      <Link to="/my-projects" className={`dock-item ${isActive('/my-projects') ? 'active' : ''}`}>
        <div className="dock-icon">
          <span className="icon-outline" style={{ width: 26, height: 26 }}>{TAB_ICONS.projects.outline}</span>
          <span className="icon-solid" style={{ width: 24, height: 24 }}>{TAB_ICONS.projects.solid}</span>
        </div>
      </Link>
      <Link to="/team-builder" className={`dock-item ${isActive('/team-builder') ? 'active' : ''}`}>
        <div className="dock-icon">
          <span className="icon-outline" style={{ width: 26, height: 26 }}>{TAB_ICONS.team.outline}</span>
          <span className="icon-solid" style={{ width: 24, height: 24 }}>{TAB_ICONS.team.solid}</span>
        </div>
      </Link>
    </div>
  )
}
