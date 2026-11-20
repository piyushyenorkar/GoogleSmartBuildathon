import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Briefcase, Activity, Calendar, Trophy, IndianRupee, Settings, LogOut, 
  ChevronDown, ChevronUp, Ticket, Shield, CalendarPlus, Megaphone
} from 'lucide-react';

export function ProfileDropdown({
  user,
  avatarError,
  setAvatarError,
  getInitials,
  profileDropdownOpen,
  setProfileDropdownOpen,
  isAdminUser,
  isPureOrganizer,
  isStaff,
  activityExpanded,
  setActivityExpanded,
  eventsExpanded,
  setEventsExpanded,
  createExpanded,
  setCreateExpanded,
  signOut
}: any) {
  const navigate = useNavigate();

  return (
    <div className={`profile-dropdown ${profileDropdownOpen ? 'show' : ''}`}>
      <div className="profile-dropdown-scroll">
        <div className="dropdown-header">
          <div className="dropdown-avatar">
            {user.avatar_url && !avatarError ? (
              <img src={user.avatar_url} alt={user.name} onError={() => setAvatarError(true)} />
            ) : (
              getInitials(user.name)
            )}
          </div>
          <div className="dropdown-user-info">
            <div className="dropdown-name">{user.name}</div>
            <div className="dropdown-email">{user.email}</div>
            {user.college && (
              <div className="dropdown-college" style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                {user.college}
              </div>
            )}
          </div>
        </div>
        {isAdminUser && (
          <Link
            to={user?.admin_type === 'department_admin' && user?.department ? `/admin/dept/${encodeURIComponent(user.department)}` : '/admin'}
            className="dropdown-item"
            onClick={() => setProfileDropdownOpen(false)}
            style={{ color: '#8b5cf6', fontWeight: 600 }}
          >
            <span className="dropdown-icon"><Shield size={16} /></span>
            Admin Dashboard
          </Link>
        )}

        {!isPureOrganizer && !isAdminUser && (
          <>
            {!isStaff && (
              <Link to="/portfolio" className="dropdown-item" onClick={() => setProfileDropdownOpen(false)} style={{ gap: '0.5rem' }}>
                <span className="dropdown-icon highlight"><Briefcase size={16} /></span>
                Portfolio
              </Link>
            )}

            {!isStaff && (
              <div className="dropdown-item-group">
                <div
                  className="dropdown-item"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActivityExpanded(!activityExpanded); }}
                  style={{ justifyContent: 'space-between', paddingRight: '1rem' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="dropdown-icon highlight"><Activity size={16} /></span>
                    My Activity
                  </div>
                  {activityExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
                {activityExpanded && (
                  <div className="dropdown-submenu">
                    <Link to="/dashboard" className="dropdown-item sub-item" onClick={() => setProfileDropdownOpen(false)}>
                      <span className="dropdown-icon"><Ticket size={14} /></span>
                      My Bookings
                    </Link>
                  </div>
                )}
              </div>
            )}

            <div className="dropdown-item-group">
              <div
                className="dropdown-item"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEventsExpanded(!eventsExpanded); }}
                style={{ justifyContent: 'space-between', paddingRight: '1rem' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="dropdown-icon highlight"><Calendar size={16} /></span>
                  Organizer Hub
                </div>
                {eventsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
              {eventsExpanded && (
                <div className="dropdown-submenu">
                  <Link to="/organizer/competitions" className="dropdown-item sub-item" onClick={() => setProfileDropdownOpen(false)}>
                    <span className="dropdown-icon"><Trophy size={14} /></span>
                    My Competitions
                  </Link>
                  <Link to="/organizer" className="dropdown-item sub-item" onClick={() => setProfileDropdownOpen(false)}>
                    <span className="dropdown-icon"><Calendar size={14} /></span>
                    My Events
                  </Link>
                  <Link to="/organizer/payouts" className="dropdown-item sub-item" onClick={() => setProfileDropdownOpen(false)}>
                    <span className="dropdown-icon"><IndianRupee size={14} /></span>
                    My Payouts
                  </Link>
                </div>
              )}
            </div>

            <div className="dropdown-item-group">
              <div
                className="dropdown-item"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCreateExpanded(!createExpanded); }}
                style={{ justifyContent: 'space-between', paddingRight: '1rem' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="dropdown-icon highlight"><CalendarPlus size={16} /></span>
                  Create New
                </div>
                {createExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
              {createExpanded && (
                <div className="dropdown-submenu">
                  <Link to="/create-event?type=competition" className="dropdown-item sub-item" onClick={() => setProfileDropdownOpen(false)}>
                    <span className="dropdown-icon"><Trophy size={14} /></span>
                    Create Competition
                  </Link>
                  <Link to="/create-event?type=event" className="dropdown-item sub-item" onClick={() => setProfileDropdownOpen(false)}>
                    <span className="dropdown-icon"><Calendar size={14} /></span>
                    Create Event
                  </Link>
                  <Link to="/create-event?type=announcement" className="dropdown-item sub-item" onClick={() => setProfileDropdownOpen(false)}>
                    <span className="dropdown-icon"><Megaphone size={14} /></span>
                    Create Announcement
                  </Link>
                </div>
              )}
            </div>
          </>
        )}
        <Link to="/settings" className="dropdown-item" onClick={() => setProfileDropdownOpen(false)} style={{ gap: '0.5rem' }}>
          <span className="dropdown-icon highlight"><Settings size={16} /></span>
          Settings
        </Link>
        <div className="dropdown-divider" />
        <button
          className="dropdown-item"
          style={{ gap: '0.5rem', width: '100%', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer' }}
          onClick={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            setProfileDropdownOpen(false);
            try {
              await signOut();
              navigate('/');
            } catch (error) {
              console.error('Error signing out:', error);
            }
          }}
        >
          <span className="dropdown-icon highlight-white"><LogOut size={16} /></span>
          Sign Out
        </button>
      </div>
    </div>
  );
}
