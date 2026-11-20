import { useRef, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Ticket, ClipboardList, Palette, Settings, LogOut, Users, FolderKanban, Sparkles, GraduationCap, CalendarPlus, User, Trophy, Briefcase, Activity, ChevronDown, ChevronUp, Calendar, Megaphone, IndianRupee, Shield, Compass, Bell, Search } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import plutoPLogo from '@/assets/transperent.png'
import './Navbar.css'
import './navbar-animation.css'
import './navbar-animation-freeze.css'

import { NotificationsModal } from './NotificationsModal'
import { SearchModal } from './SearchModal'
import { DesktopSearchModal } from './DesktopSearchModal'
import { ProfileDropdown } from './ProfileDropdown'
import { supabase } from '@/lib/supabase'
import { competitionRegistrationService } from '@/services/competitionRegistrationService'
import { useSearchStore } from '@/stores/searchStore'

export function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuthStore()
  const { openAuthModal, profileDropdownOpen, setProfileDropdownOpen } = useUIStore()
  const { setSearchVisible } = useSearchStore()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const mobileDropdownRef = useRef<HTMLDivElement>(null)
  const createDropdownRef = useRef<HTMLDivElement>(null)
  const [createDropdownOpen, setCreateDropdownOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [avatarError, setAvatarError] = useState(false)
  const [activityExpanded, setActivityExpanded] = useState(false)
  const [eventsExpanded, setEventsExpanded] = useState(false)
  const [createExpanded, setCreateExpanded] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)
  const notifDropdownRef = useRef<HTMLDivElement>(null)
  const mobileNotifDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) return
    const checkUnread = async () => {
      try {
        const [invData, reqData, notifRes] = await Promise.all([
          competitionRegistrationService.getPendingInvites(),
          competitionRegistrationService.getLeaderJoinRequests(),
          supabase.from('notifications').select('id').eq('user_id', user.id).eq('read', false).limit(1)
        ])
        if ((invData && invData.length > 0) || (reqData && reqData.length > 0) || (notifRes.data && notifRes.data.length > 0)) {
          setHasUnread(true)
        } else {
          setHasUnread(false)
        }
      } catch (err) {
        // ignore
      }
    }
    checkUnread()
  }, [user, notificationsOpen])

  useEffect(() => {
    setAvatarError(false)
  }, [user?.avatar_url])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) && 
          mobileDropdownRef.current && !mobileDropdownRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false)
      }
      if (createDropdownRef.current && !createDropdownRef.current.contains(e.target as Node)) {
        setCreateDropdownOpen(false)
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target as Node) &&
          mobileNotifDropdownRef.current && !mobileNotifDropdownRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false)
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [setProfileDropdownOpen])

  // Track scroll for navbar background intensity
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Lock body scroll when profile dropdown is open
  useEffect(() => {
    if (profileDropdownOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [profileDropdownOpen])

  const isActive = (path: string) => location.pathname === path

  const getInitials = (name?: string) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  // Don't show navbar on landing page
  if (location.pathname === '/') return null

  const isCheckoutPage = location.pathname.startsWith('/book/') || location.pathname.startsWith('/payment/') || location.pathname === '/success'

  const isPureOrganizer = user?.roles?.includes('organizer') && !user?.roles?.includes('user') && !user?.roles?.includes('student') && !user?.roles?.includes('admin') && !user?.roles?.includes('staff')
  const isAdminUser = !!user?.admin_type || user?.roles?.includes('admin') || user?.email?.endsWith('@admin.com')
  const isStaff = user?.roles?.includes('staff')

  return (
    <>
    <nav className={`navbar hide-mobile ${isCheckoutPage ? 'mobile-hidden' : ''} ${scrolled ? 'navbar-scrolled' : ''}`}>
      <div className="nav-content">
        {/* PLUTO Logo */}
        <Link
          to={
            location.pathname.startsWith('/admin/dept/')
              ? location.pathname // stay on dept admin page
              : location.pathname === '/admin'
                ? '/admin'
                : '/explore'
          }
          className="logo-container"
          onClick={(e) => {
            if (!user && location.pathname !== '/admin') {
              e.preventDefault()
              openAuthModal('login')
            }
          }}
        >
          <div className="logo" style={{ display: 'flex', alignItems: 'center' }}>
            <img src="/plutocampus.png" alt="Pluto Campus" style={{ height: '28px', objectFit: 'contain' }} />
          </div>
        </Link>

        {location.pathname === '/admin' || location.pathname.startsWith('/admin/dept/') || (isAdminUser && (location.pathname.startsWith('/event/') || location.pathname.startsWith('/competition/'))) ? (
          <ul className="nav-links hide-mobile">
            <li>
              <span style={{ color: 'var(--white)', fontWeight: 500 }}>
                {location.pathname.startsWith('/admin/dept/') || (isAdminUser && user?.admin_type === 'department_admin') ? 'Department Admin' : 'Campus Admin Panel'}
              </span>
            </li>
            {isAdminUser && (location.pathname.startsWith('/event/') || location.pathname.startsWith('/competition/')) && (
              <li>
                <Link 
                  to={user?.admin_type === 'department_admin' && user?.department ? `/admin/dept/${encodeURIComponent(user.department)}` : '/admin'} 
                  style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}
                >
                  ← Back to Dashboard
                </Link>
              </li>
            )}
            {location.pathname.startsWith('/admin/dept/') && (user?.admin_type === 'college_admin' || user?.admin_type === 'pluto_hq' || user?.email?.endsWith('@admin.com')) && (
              <li>
                <Link to="/admin" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>← College Admin</Link>
              </li>
            )}
          </ul>
        ) : isPureOrganizer ? (
          <ul className="nav-links hide-mobile">
            <li>
              <Link to="/community" className={isActive('/community') ? 'active' : ''}>Community</Link>
            </li>
            <li style={{ display: 'flex', gap: '1rem', background: 'rgba(255,255,255,0.05)', padding: '0.35rem 1rem', borderRadius: '100px', alignItems: 'center', fontSize: '0.85rem' }}>
              <Link to="/organizer" className={location.pathname === '/organizer' ? 'active' : ''}>Dashboard</Link>
              <Link to="/organizer/events" className={isActive('/organizer/events') ? 'active' : ''}>My Events</Link>
              <Link to="/organizer/bookings" className={isActive('/organizer/bookings') ? 'active' : ''}>Bookings</Link>
            </li>
            <li style={{ display: 'flex', gap: '1rem', background: 'rgba(255,255,255,0.05)', padding: '0.35rem 1rem', borderRadius: '100px', alignItems: 'center', fontSize: '0.85rem' }}>
              <Link to="/organizer/competitions?tab=competitions" className={location.pathname === '/organizer/competitions' ? 'active' : ''}>My Competitions</Link>
              <Link to="/organizer/competitions?tab=registrations" className={location.pathname === '/organizer/competitions' && location.search.includes('tab=registrations') ? 'active' : ''}>All Registrations</Link>
            </li>
          </ul>

        ) : location.pathname === '/organizer/payouts' ? (
          <ul className="nav-links hide-mobile">
            <li>
              <Link to="/organizer/payouts" className="active">Organizer Payouts</Link>
            </li>
          </ul>
        ) : location.pathname.startsWith('/organizer/competitions') ? (
          <ul className="nav-links hide-mobile">
            <li>
              <Link to="/organizer/competitions?tab=competitions" className={!location.search.includes('tab=registrations') ? 'active' : ''}>My Competitions</Link>
            </li>
            <li>
              <Link to="/organizer/competitions?tab=registrations" className={location.search.includes('tab=registrations') ? 'active' : ''}>All Registrations</Link>
            </li>
          </ul>
        ) : location.pathname.startsWith('/organizer') ? (
          <ul className="nav-links hide-mobile">
            <li>
              <Link to="/organizer" className={location.pathname === '/organizer' ? 'active' : ''}>Dashboard</Link>
            </li>
            <li>
              <Link to="/organizer/events" className={isActive('/organizer/events') ? 'active' : ''}>My Events</Link>
            </li>
            <li>
              <Link to="/organizer/bookings" className={isActive('/organizer/bookings') ? 'active' : ''}>Bookings</Link>
            </li>
          </ul>
        ) : (
          <ul className="nav-links hide-mobile">
            <li>
              <Link
                to="/explore"
                className={isActive('/explore') ? 'active' : ''}
                onClick={(e) => {
                  if (!user) {
                    e.preventDefault()
                    openAuthModal('login')
                  }
                }}
              >
                Explore
              </Link>
            </li>
            <li>
              <Link
                to="/community"
                className={isActive('/community') ? 'active' : ''}
                onClick={(e) => {
                  if (!user) {
                    e.preventDefault()
                    openAuthModal('login')
                  }
                }}
              >
                Community
              </Link>
            </li>
            {!isStaff && (
              <>
                <li>
                  <Link
                    to="/portfolio"
                    className={isActive('/portfolio') ? 'active' : ''}
                    onClick={(e) => {
                      if (!user) {
                        e.preventDefault()
                        openAuthModal('login')
                      }
                    }}
                  >
                    Portfolio
                  </Link>
                </li>
                <li>
                  <Link
                    to="/students"
                    className={isActive('/students') ? 'active' : ''}
                    onClick={(e) => {
                      if (!user) {
                        e.preventDefault()
                        openAuthModal('login')
                      }
                    }}
                  >
                    Students
                  </Link>
                </li>
                <li>
                  <Link
                    to="/my-projects"
                    className={isActive('/my-projects') ? 'active' : ''}
                    onClick={(e) => {
                      if (!user) {
                        e.preventDefault()
                        openAuthModal('login')
                      }
                    }}
                  >
                    Projects
                  </Link>
                </li>
              </>
            )}
          </ul>
        )}

        {/* Right Side */}
        <div className="nav-right hide-mobile">
          {user ? (
            <>
              {location.pathname !== '/admin' && !isPureOrganizer && !isAdminUser && !isStaff && (
                <Link to="/team-builder" className="nav-simple-link nav-create-link" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>+</span> Create Team
                </Link>
              )}
              {isPureOrganizer && (
                <div className="profile-container" ref={createDropdownRef}>
                  <div 
                    className="nav-simple-link nav-create-link" 
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
                    onClick={() => setCreateDropdownOpen(!createDropdownOpen)}
                  >
                    <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>+</span> Create
                  </div>
                  <div className={`profile-dropdown ${createDropdownOpen ? 'show' : ''}`} style={{ width: '240px', minWidth: 'unset', right: '0', top: 'calc(100% + 10px)' }}>
                    <div className="profile-dropdown-scroll">
                      <div className="dropdown-item-group">
                        <Link to="/create-event?type=event" className="dropdown-item" onClick={() => setCreateDropdownOpen(false)} style={{ gap: '0.5rem' }}>
                          <span className="dropdown-icon highlight"><CalendarPlus size={16} /></span>
                          Create Event
                        </Link>
                        <Link to="/create-event?type=competition" className="dropdown-item" onClick={() => setCreateDropdownOpen(false)} style={{ gap: '0.5rem' }}>
                          <span className="dropdown-icon highlight"><Trophy size={16} /></span>
                          Create Competition
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="nav-icon-btn-container" style={{ position: 'relative' }}>
                <button 
                  className="nav-icon-btn" 
                  onClick={() => setSearchVisible(true)}
                  style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Search size={20} />
                </button>
              </div>
              
              <div className="nav-icon-btn-container" ref={notifDropdownRef} style={{ position: 'relative' }}>
                <button 
                  className="nav-icon-btn" 
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Bell size={20} />
                  {hasUnread && <div className="nav-unread-dot" style={{ position: 'absolute', top: 6, right: 8, width: 8, height: 8, backgroundColor: '#f87171', borderRadius: '50%', border: '2px solid #121212' }} />}
                </button>
                <NotificationsModal open={notificationsOpen} onClose={() => setNotificationsOpen(false)} isMobile={false} />
              </div>

              <div className="profile-container" ref={dropdownRef}>
                <div
                  className="profile-avatar"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                >
                  {user.avatar_url && !avatarError ? (
                    <img
                      src={user.avatar_url}
                      alt={user.name}
                      onError={() => setAvatarError(true)}
                    />
                  ) : null}
                  <span className="avatar-initials">{getInitials(user.name)}</span>
                </div>
                <ProfileDropdown 
                  user={user}
                  avatarError={avatarError}
                  setAvatarError={setAvatarError}
                  getInitials={getInitials}
                  profileDropdownOpen={profileDropdownOpen}
                  setProfileDropdownOpen={setProfileDropdownOpen}
                  isAdminUser={isAdminUser}
                  isPureOrganizer={isPureOrganizer}
                  isStaff={isStaff}
                  activityExpanded={activityExpanded}
                  setActivityExpanded={setActivityExpanded}
                  eventsExpanded={eventsExpanded}
                  setEventsExpanded={setEventsExpanded}
                  createExpanded={createExpanded}
                  setCreateExpanded={setCreateExpanded}
                  signOut={signOut}
                />
              </div>
            </>
          ) : (
            <>
              {location.pathname !== '/admin' && (
                <button
                  className="nav-simple-link nav-create-link"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0 }}
                  onClick={() => openAuthModal('login')}
                >
                  <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>+</span> Create Team
                </button>
              )}
              <div className="profile-container">
                <div
                  className="profile-avatar"
                  onClick={() => openAuthModal('login')}
                  style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.05)' }}
                >
                  <span className="avatar-initials" style={{ opacity: 0.6 }}><User size={18} /></span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
    
    {profileDropdownOpen && (
      <div className="profile-dropdown-overlay" onClick={() => setProfileDropdownOpen(false)} />
    )}
    {location.pathname !== '/settings' && !location.pathname.startsWith('/event/') && !location.pathname.startsWith('/competition/') && !isCheckoutPage && (
      <div className="mobile-header show-mobile">
        <Link to="/explore" className="logo-container" onClick={(e) => { if (!user) { e.preventDefault(); openAuthModal('login'); } }}>
          <img src="/plutocampus.png" alt="Pluto Campus" style={{ height: '28px', objectFit: 'contain' }} />
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {(location.pathname === '/explore' || location.pathname === '/community') && (
            <div className="nav-icon-btn-container" style={{ position: 'relative' }}>
              <button 
                className="nav-icon-btn" 
                onClick={() => setSearchVisible(true, location.pathname === '/explore' ? 'explore' : 'community')}
                style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}
              >
                <Search size={20} />
              </button>
            </div>
          )}
          {user && (
            <div className="nav-icon-btn-container" style={{ position: 'relative' }} ref={mobileNotifDropdownRef}>
              <button 
                className="nav-icon-btn" 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}
              >
                <Bell size={20} />
                {hasUnread && <div className="nav-unread-dot" style={{ position: 'absolute', top: 6, right: 8, width: 8, height: 8, backgroundColor: '#f87171', borderRadius: '50%', border: '2px solid #121212' }} />}
              </button>
            </div>
          )}
          <div className="profile-container" ref={mobileDropdownRef}>
            <div className="profile-avatar" onClick={() => user ? setProfileDropdownOpen(!profileDropdownOpen) : openAuthModal('login')} style={{ 
            width: '36px', height: '36px', 
            background: 'rgba(99,102,241,0.2)', 
            borderRadius: '18px'
          }}>
            {user ? (
              user.avatar_url && !avatarError ? (
                <img src={user.avatar_url} alt={user.name} onError={() => setAvatarError(true)} style={{ borderRadius: '18px' }} />
              ) : <span className="avatar-initials" style={{ fontSize: '0.9rem', color: '#a78bfa', fontWeight: 700 }}>{getInitials(user.name)}</span>
            ) : (
              <span className="avatar-initials" style={{ opacity: 0.6, fontSize: '0.9rem', color: '#a78bfa' }}><User size={18} /></span>
            )}
          </div>
          {user && (
            <ProfileDropdown 
              user={user}
              avatarError={avatarError}
              setAvatarError={setAvatarError}
              getInitials={getInitials}
              profileDropdownOpen={profileDropdownOpen}
              setProfileDropdownOpen={setProfileDropdownOpen}
              isAdminUser={isAdminUser}
              isPureOrganizer={isPureOrganizer}
              isStaff={isStaff}
              activityExpanded={activityExpanded}
              setActivityExpanded={setActivityExpanded}
              eventsExpanded={eventsExpanded}
              setEventsExpanded={setEventsExpanded}
              createExpanded={createExpanded}
              setCreateExpanded={setCreateExpanded}
              signOut={signOut}
            />
          )}
        </div>
        </div>
      </div>
    )}
    {/* Mobile Notifications Modal rendered outside the header container to overlay everything */}
    <NotificationsModal open={notificationsOpen} onClose={() => setNotificationsOpen(false)} isMobile={true} />
    
    {/* Mobile Search Modal */}
    <SearchModal />
    <DesktopSearchModal />
    </>
  )
}

declare global {
  interface Window {
    PlutoAnimation: any
    plutoAnimationInstance: any
  }
}
