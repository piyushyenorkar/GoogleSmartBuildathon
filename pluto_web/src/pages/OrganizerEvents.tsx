import { useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Search, Plus, Edit, Eye, Trash2, Calendar, MapPin, Clock, Users, ChevronDown, CalendarDays, Ticket, List, CalendarPlus, LayoutGrid, MoreVertical, Megaphone } from 'lucide-react'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { motion, AnimatePresence } from 'framer-motion'
import { useOrganizerEvents, useDeleteEvent } from '@/hooks/useEvents'
import { useAuthStore } from '@/stores/authStore'
import { isEventActive, formatDate, formatTime, formatPrice } from '@/lib/utils'

import './Dashboard.css'
import './OrganizerDashboard.css'
import './OrganizerEvents.css'
import { Navbar } from '@/components/layout'
export default function OrganizerEventsPage() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const { data: rawEvents = [], isLoading } = useOrganizerEvents(user?.id)
  const [viewMode, setViewMode] = useState<'events' | 'announcements'>('events')
  const events = rawEvents.filter(e => viewMode === 'events' ? (e as any).type !== 'announcement' : (e as any).type === 'announcement')
  const deleteEvent = useDeleteEvent()

  const isPureOrganizer = user?.roles?.includes('organizer') && !user?.roles?.includes('user') && !user?.roles?.includes('student') && !user?.roles?.includes('admin') && !user?.roles?.includes('staff')

  const getPriceDisplay = (evt: any) => {
    if (evt.has_seating && evt.seat_layout) {
      let minPrice = Infinity
      let maxPrice = -Infinity
      const seats = evt.seat_layout.seats || []
      const tables = evt.seat_layout.tables || []

      seats.forEach((s: any) => {
        if (s.price < minPrice) minPrice = s.price
        if (s.price > maxPrice) maxPrice = s.price
      })
      tables.forEach((t: any) => {
        if (t.price < minPrice) minPrice = t.price
        if (t.price > maxPrice) maxPrice = t.price
      })

      if (minPrice !== Infinity && maxPrice !== -Infinity) {
        if (minPrice === maxPrice) {
          return formatPrice(minPrice)
        } else {
          return `${formatPrice(minPrice)} - ${formatPrice(maxPrice).replace('₹', '').trim()}`
        }
      }
    }
    return formatPrice(evt.ticket_price || evt.price || 0)
  }

  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'past'>('all')
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return events
    const q = searchQuery.toLowerCase()
    return events.filter(e =>
      e.title?.toLowerCase().includes(q) ||
      e.venue?.toLowerCase().includes(q)
    )
  }, [events, searchQuery])

  const { activeEvents, pastEvents } = useMemo(() => {
    const active: typeof events = []
    const past: typeof events = []

    filteredEvents.forEach((e) => {
      if (isEventActive({ date: e.start_date, endDate: e.end_date, time: e.start_time, endTime: e.end_time })) {
        active.push(e)
      } else {
        past.push(e)
      }
    })

    return { activeEvents: active, pastEvents: past }
  }, [events])

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This action cannot be undone.`)) return
    deleteEvent.mutate(id)
  }

  if (!user) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🔒</div>
        <h3>Sign in required</h3>
        <p>Please sign in to view your events.</p>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>My Events | PLUTO Organizer</title>
      </Helmet>

      <div className="organizer-events-page">
        <div className="container org-dashboard-container" style={{ maxWidth: '1140px', margin: '0 auto' }}>

          {/* MOBILE MAIN TABS */}
          <div className="org-main-tabs hide-desktop">
            <button
              className="org-main-tab-btn"
              onClick={() => navigate('/organizer')}
            >
              <LayoutGrid size={16} /> <span>Dashboard</span>
            </button>
            <button
              className="org-main-tab-btn active"
              onClick={() => navigate('/organizer/events')}
            >
              <CalendarDays size={16} /> <span>My Events</span>
            </button>
            <button
              className="org-main-tab-btn"
              onClick={() => navigate('/organizer/bookings')}
            >
              <Ticket size={16} /> <span>Bookings</span>
            </button>
          </div>

          {/* ─── Desktop Header ────────────────────── */}
          <motion.div
            className="org-header hide-mobile"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="org-header-text">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0 }}>My {viewMode === 'events' ? 'Events' : 'Announcements'}</h1>
                {!isPureOrganizer && (
                  <button
                    className="btn btn-outline"
                    onClick={() => setViewMode(viewMode === 'events' ? 'announcements' : 'events')}
                    style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <List size={14} />
                    Switch to {viewMode === 'events' ? 'Announcements' : 'Events'}
                  </button>
                )}
              </div>
              <p>Manage your created {viewMode}</p>
            </div>

            <button
              className="btn btn-primary org-create-btn"
              onClick={() => navigate('/create-event')}
            >
              <CalendarPlus size={16} /> Create Event
            </button>
          </motion.div>

          {/* ─── Mobile Header ─────────────────────── */}
          <motion.div
            className="dashboard-header hide-desktop"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ justifyContent: 'space-between', marginTop: '1.5rem', marginBottom: '1rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="header-icon-wrap">
                <CalendarDays size={22} color="#a78bfa" />
              </div>
              <div className="org-header-text" style={{ margin: 0 }}>
                <h1 style={{ margin: 0 }}>My {viewMode === 'events' ? 'Events' : 'Announcements'}</h1>
              </div>
            </div>
          </motion.div>

          {!isPureOrganizer && (
            <div className="view-mode-tabs hide-desktop" style={{ display: 'flex', flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '100px', padding: '3px', marginBottom: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <button
                className="view-mode-tab"
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 0', borderRadius: '100px', backgroundColor: viewMode === 'events' ? '#fff' : 'transparent', color: viewMode === 'events' ? '#09090b' : '#a1a1aa', border: 'none', cursor: 'pointer', transition: 'all 0.2s ease', fontWeight: 600, fontSize: '0.85rem' }}
                onClick={() => setViewMode('events')}
              >
                <Ticket size={14} /> Events
                <div style={{ backgroundColor: viewMode === 'events' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 700 }}>
                  {rawEvents?.filter(e => (e as any).type !== 'announcement').length || 0}
                </div>
              </button>
              <button
                className="view-mode-tab"
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 0', borderRadius: '100px', backgroundColor: viewMode === 'announcements' ? '#fff' : 'transparent', color: viewMode === 'announcements' ? '#09090b' : '#a1a1aa', border: 'none', cursor: 'pointer', transition: 'all 0.2s ease', fontWeight: 600, fontSize: '0.85rem' }}
                onClick={() => setViewMode('announcements')}
              >
                <Megaphone size={14} /> Announcements
                <div style={{ backgroundColor: viewMode === 'announcements' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 700 }}>
                  {rawEvents?.filter(e => (e as any).type === 'announcement').length || 0}
                </div>
              </button>
            </div>
          )}

          <div className="dashboard-tab-row hide-desktop" style={{ margin: '0 auto 1rem', opacity: isLoading ? 0.5 : 1, pointerEvents: isLoading ? 'none' : 'auto', display: 'flex', gap: '0.5rem', width: 'fit-content' }}>
            <button
              className={`dashboard-sub-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All ({filteredEvents.length})
            </button>
            <button
              className={`dashboard-sub-tab-btn ${activeTab === 'active' ? 'active' : ''}`}
              onClick={() => setActiveTab('active')}
            >
              Upcoming ({activeEvents.length})
            </button>
            <button
              className={`dashboard-sub-tab-btn ${activeTab === 'past' ? 'active' : ''}`}
              onClick={() => setActiveTab('past')}
            >
              Past ({pastEvents.length})
            </button>
          </div>

          <div className="org-events-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', width: '100%', flexWrap: 'nowrap', gap: '1rem' }}>
            <div className="dashboard-tab-row hide-mobile" style={{ marginBottom: 0, opacity: isLoading ? 0.5 : 1, pointerEvents: isLoading ? 'none' : 'auto', flexShrink: 0, display: 'flex', whiteSpace: 'nowrap' }}>
              <button
                className={`dashboard-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                <List size={18} /> All ({filteredEvents.length})
              </button>
              <button
                className={`dashboard-tab-btn ${activeTab === 'active' ? 'active' : ''}`}
                onClick={() => setActiveTab('active')}
              >
                <Calendar size={18} /> Upcoming ({activeEvents.length})
              </button>
              <button
                className={`dashboard-tab-btn ${activeTab === 'past' ? 'active' : ''}`}
                onClick={() => setActiveTab('past')}
              >
                <CalendarDays size={18} /> Past ({pastEvents.length})
              </button>
            </div>

            <div className="dashboard-search org-events-search" style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              opacity: isLoading ? 0.5 : 1,
              pointerEvents: isLoading ? 'none' : 'auto',
              flex: 1,
              minWidth: '250px'
            }}>
              <Search size={16} strokeWidth={2.5} style={{ position: 'absolute', left: '14px', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Search events"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 1rem 0.65rem 2.5rem', background: 'rgba(255, 255, 255, 0.04)', border: 'none', borderRadius: '50px', color: 'var(--white)', fontSize: '13px', outline: 'none', boxShadow: 'none' }}
                disabled={isLoading}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="booking-strips" style={{ marginTop: '0' }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="booking-strip" style={{ cursor: 'default' }}>
                  <div className="strip-header" style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1.5fr) 1fr 1fr 1fr auto', alignItems: 'center', gap: '1rem', width: '100%', padding: '1rem 1.25rem' }}>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                      <div className="skeleton-block" style={{ width: 44, height: 44, borderRadius: 8, flexShrink: 0 }} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                        <div className="skeleton-block" style={{ height: 16, width: '70%', borderRadius: 4 }} />
                        <div className="skeleton-block" style={{ height: 12, width: '40%', borderRadius: 4 }} />
                      </div>
                    </div>

                    <div className="org-stats-column" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Tickets Sold</span>
                      <div className="skeleton-block" style={{ height: 16, width: '60%', borderRadius: 4, marginTop: 2 }} />
                    </div>

                    <div className="org-stats-column" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Price</span>
                      <div className="skeleton-block" style={{ height: 16, width: '40%', borderRadius: 4, marginTop: 2 }} />
                    </div>

                    <div className="org-stats-column" style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                      <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Venue</span>
                      <div className="skeleton-block" style={{ height: 16, width: '80%', borderRadius: 4, marginTop: 2 }} />
                    </div>

                    <div className="strip-right" style={{ display: 'flex', justifyContent: 'flex-end', marginLeft: 'auto' }}>
                      <div className="skeleton-block" style={{ height: 26, width: 60, borderRadius: 8 }} />
                    </div>

                  </div>
                </div>
              ))}
            </div>
          ) : filteredEvents.length === 0 && searchQuery ? (
            <div className="dashboard-empty">
              <CalendarDays size={48} strokeWidth={1} style={{ color: 'var(--primary)', opacity: 0.6 }} />
              <h3>No events found</h3>
              <p>Try adjusting your search query.</p>
            </div>
          ) : events.length === 0 ? (
            <div className="dashboard-empty">
              <CalendarDays size={48} strokeWidth={1} style={{ color: 'var(--primary)', opacity: 0.6 }} />
              <h3>No {viewMode} yet</h3>
              <p>Create your first {viewMode === 'events' ? 'event' : 'announcement'} to get started!</p>
              <Link to="/create-event" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                <Plus size={18} /> Create {viewMode === 'events' ? 'Event' : 'Announcement'}
              </Link>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {(activeTab === 'all' ? filteredEvents : activeTab === 'active' ? activeEvents : pastEvents).length === 0 ? (
                  <div className="dashboard-empty">
                    <CalendarDays size={48} strokeWidth={1} style={{ color: 'var(--primary)', opacity: 0.6 }} />
                    <h3>No {activeTab === 'all' ? '' : activeTab === 'active' ? 'upcoming' : 'past'} {viewMode}</h3>
                    <p>There are no {activeTab === 'all' ? '' : activeTab === 'active' ? 'upcoming ' : 'past '}{viewMode === 'events' ? 'events' : 'announcements'} to show here.</p>
                  </div>
                ) : (
                <>
                  <div className="booking-strips hide-mobile">
                    <AnimatePresence>
                      {(activeTab === 'all' ? filteredEvents : activeTab === 'active' ? activeEvents : pastEvents).map((event, i) => {
                        const isHovered = hoveredId === event.id
                        const isPast = activeTab === 'all' ? pastEvents.some(p => p.id === event.id) : activeTab === 'past'

                        return (
                          <motion.div
                            key={event.id}
                            className={`booking-strip ${isPast ? 'history-strip' : ''} ${isHovered ? 'expanded' : ''}`}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.04 * i }}
                            onMouseEnter={() => setHoveredId(event.id)}
                            onMouseLeave={() => setHoveredId(null)}
                            style={{ cursor: 'default' }}
                            layout
                          >
                            <div className="strip-header" style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1.5fr) 1fr 1fr 1fr auto', alignItems: 'center', gap: '1rem', width: '100%', padding: '1rem 1.25rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                                <div className="strip-thumb" style={{ flexShrink: 0 }}>
                                  {event.banner_url ? (
                                    <img src={event.banner_url} alt={event.title} />
                                  ) : (
                                    <CalendarDays size={18} style={{ color: 'var(--primary)', opacity: 0.6 }} />
                                  )}
                                </div>
                                <div className="strip-main" style={{ margin: 0, minWidth: 0 }}>
                                  <div className="strip-title" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.title || 'Untitled Event'}</div>
                                  <div className="strip-sub">
                                    {event.start_date && <><CalendarDays size={11} /> {formatDate(event.start_date)}</>}
                                    {event.start_time && <span style={{ marginLeft: 6 }}><Clock size={11} /> {formatTime(event.start_time)}</span>}
                                  </div>
                                </div>
                              </div>

                              <div className="org-stats-column" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Tickets {isPast ? 'Attended' : 'Sold'}</span>
                                <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                                  <Users size={13} style={{ color: 'var(--text-muted)' }} />
                                  {(event as any).ticket_count || 0} / {(event as any).ticketLimit || (event as any).ticket_limit || '∞'}
                                </span>
                              </div>

                              <div className="org-stats-column" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {!isPast && viewMode === 'events' && (
                                  <>
                                    <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Price</span>
                                    <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                                      <Ticket size={13} style={{ color: 'var(--text-muted)' }} />
                                      {getPriceDisplay(event)}
                                    </span>
                                  </>
                                )}
                              </div>

                              <div className="org-stats-column" style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                                <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Venue</span>
                                <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  <MapPin size={13} style={{ color: 'var(--text-muted)' }} />
                                  {event.venue || '—'}
                                </span>
                              </div>

                              <div className="strip-right" style={{ display: 'flex', alignItems: 'center', gap: '16px', justifyContent: 'flex-end', marginLeft: 'auto' }}>
                                {!isPast && <span className="strip-badge strip-badge-live">Live</span>}
                                {isPast && <span className="strip-badge strip-badge-attended">Completed</span>}
                                <ChevronDown size={18} className="strip-chevron" />
                              </div>
                            </div>

                            <AnimatePresence>
                              {isHovered && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2, ease: 'easeOut' }}
                                  style={{ overflow: 'hidden' }}
                                >
                                  <div style={{
                                    display: 'flex',
                                    gap: '12px',
                                    justifyContent: 'flex-end',
                                    padding: '0 1.25rem 1rem 1.25rem',
                                    borderTop: '1px solid rgba(255,255,255,0.05)',
                                    marginTop: '0.25rem',
                                    paddingTop: '1rem'
                                  }}>
                                    <button
                                      className="btn btn-outline"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        navigate(`/event/${event.id}`)
                                      }}
                                      style={{
                                        padding: '6px 14px',
                                        fontSize: '0.85rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        color: 'rgba(255, 255, 255, 0.7)',
                                        background: '#3c3c3e',
                                        border: 'none',
                                        borderRadius: '20px'
                                      }}
                                    >
                                      <Eye size={14} color="var(--primary, #8b5cf6)" /> View Details
                                    </button>

                                    {/* Edit Button */}
                                    <button
                                      className={`btn btn-outline ${isPast ? 'disabled-edit' : ''}`}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        if (!isPast) navigate(`/edit-event/${event.id}`)
                                      }}
                                      style={{
                                        padding: '6px 14px',
                                        fontSize: '0.85rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        color: isPast ? 'rgba(255,255,255,0.3)' : 'rgba(255, 255, 255, 0.7)',
                                        border: 'none',
                                        background: isPast ? 'rgba(0,0,0,0.1)' : '#3c3c3e',
                                        borderRadius: '20px',
                                        cursor: isPast ? 'not-allowed' : 'pointer'
                                      }}
                                      title={isPast ? 'Editing is locked after the end time' : 'Edit details'}
                                    >
                                      <Edit size={14} color={isPast ? "rgba(255,255,255,0.3)" : "#fdba74"} /> Edit
                                    </button>

                                    {!isPast && (
                                      <>
                                        <button
                                          className="btn btn-outline"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleDelete(event.id, event.title)
                                          }}
                                          style={{
                                            padding: '6px 14px',
                                            fontSize: '0.85rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            color: 'rgba(255, 255, 255, 0.7)',
                                            border: 'none',
                                            background: '#3c3c3e',
                                            borderRadius: '20px'
                                          }}
                                        >
                                          <Trash2 size={14} color="#fca5a5" /> Delete
                                        </button>
                                      </>
                                    )}

                                    {isPast && (
                                      <button
                                        className="btn btn-outline"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleDelete(event.id, event.title)
                                        }}
                                        style={{
                                          padding: '6px 14px',
                                          fontSize: '0.85rem',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '6px',
                                          color: '#ef4444',
                                          borderColor: 'rgba(239, 68, 68, 0.3)',
                                          background: 'rgba(239, 68, 68, 0.05)'
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
                                        onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'}
                                      >
                                        <Trash2 size={14} /> Delete
                                      </button>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        )
                      })}
                    </AnimatePresence>
                  </div>

                  {/* MOBILE CARDS */}
                  <div className="hide-desktop" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <AnimatePresence>
                      {(activeTab === 'all' ? filteredEvents : activeTab === 'active' ? activeEvents : pastEvents).map((event, i) => (
                        <motion.div
                          key={event.id}
                          className="booking-card"
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.05 * i }}
                          onClick={() => navigate(`/event/${event.id}`)}
                        >
                          <div className="booking-card-row">
                            <div className="booking-card-thumb">
                              {event.banner_url ? (
                                <img src={event.banner_url} alt={event.title} />
                              ) : (
                                <CalendarDays size={20} style={{ color: 'var(--primary)', opacity: 0.6 }} />
                              )}
                            </div>
                            <div className="booking-card-meta">
                              <div className="booking-card-title">{event.title || 'Untitled Event'}</div>
                              <div className="booking-card-subrow">
                                {event.start_date && (
                                  <div className="booking-card-chip">
                                    <CalendarDays size={12} color="#a1a1aa" />
                                    <span>{formatDate(event.start_date)}</span>
                                  </div>
                                )}
                                {event.start_time && (
                                  <div className="booking-card-chip">
                                    <Clock size={12} color="#a1a1aa" />
                                    <span>{formatTime(event.start_time)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div className={`booking-card-badge ${activeTab === 'active' ? 'confirmed' : ''}`} style={activeTab === 'past' ? { backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff' } : {}}>
                                {activeTab === 'active' ? 'Active' : 'Past'}
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ background: 'none', border: 'none', color: '#a1a1aa', padding: '4px', cursor: 'pointer', display: 'flex' }}
                                  >
                                    <MoreVertical size={18} />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" style={{ minWidth: '160px', backgroundColor: '#18181b', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}>
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/event/${event.id}`); }} style={{ cursor: 'pointer' }}>
                                    <Eye size={14} style={{ marginRight: '8px' }} color="var(--primary)" /> View Details
                                  </DropdownMenuItem>
                                  {activeTab !== 'past' && (
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/edit-event/${event.id}`); }} style={{ cursor: 'pointer' }}>
                                      <Edit size={14} style={{ marginRight: '8px' }} color="#fdba74" /> Edit Event
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onClick={(e) => { e.stopPropagation(); handleDelete(event.id, event.title); }}
                                    style={{ color: '#fca5a5', cursor: 'pointer' }}
                                  >
                                    <Trash2 size={14} style={{ marginRight: '8px' }} /> Delete Event
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>

                          <div className="booking-card-inline">
                            <div className="booking-card-inline-item">
                              <span className="booking-card-inline-label">TICKETS</span>
                              <span className="booking-card-inline-value">{(event as any).ticket_count || 0} / {(event as any).ticketLimit || (event as any).ticket_limit || '∞'}</span>
                            </div>
                            <div className="booking-card-inline-item">
                              <span className="booking-card-inline-label">PRICE</span>
                              <span className="booking-card-inline-value">{getPriceDisplay(event)}</span>
                            </div>
                            <div className="booking-card-inline-item">
                              <span className="booking-card-inline-label">VENUE</span>
                              <span className="booking-card-inline-value" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{event.venue || '—'}</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>


    </>
  )
}
