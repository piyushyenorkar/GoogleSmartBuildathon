import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart3, CalendarPlus, Ticket, IndianRupee, TrendingUp,
  Users, Eye, ArrowRight, CalendarDays, MapPin, Clock, ChevronDown, Search, LayoutGrid
} from 'lucide-react'
import { useOrganizerEvents } from '@/hooks/useEvents'
import { useEventsBookings } from '@/hooks/useBookings'
import { useAuthStore } from '@/stores/authStore'
import { formatDate, formatPrice, formatTime, formatCompactNumber, formatCompactPrice } from '@/lib/utils'

import './Dashboard.css'
import './OrganizerDashboard.css'

export default function OrganizerDashboard() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { data: rawEvents, isLoading } = useOrganizerEvents(user?.id)
  const events = (rawEvents || []).filter(e => (e as any).type !== 'announcement')

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return events
    const q = searchQuery.toLowerCase()
    return events.filter(e =>
      e.title?.toLowerCase().includes(q) ||
      e.venue?.toLowerCase().includes(q)
    )
  }, [events, searchQuery])

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id)
  }

  const eventIds = useMemo(() => events.map(e => e.id), [events])
  const { data: allBookings = [] } = useEventsBookings(eventIds)

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

  const stats = useMemo(() => {
    const totalBookings = allBookings.reduce((sum, b) => sum + (b.quantity || 0), 0)
    const totalRevenue = allBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0)

    return {
      totalEvents: events.length,
      totalBookings,
      totalRevenue,
    }
  }, [events, allBookings])

  if (!user) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '4rem' }}>
        <BarChart3 size={64} strokeWidth={1} style={{ color: 'var(--primary)', opacity: 0.6 }} />
        <h2 style={{ marginTop: '1rem', color: 'var(--white)' }}>Login Required</h2>
        <p style={{ color: 'var(--text-secondary)' }}>You need to be logged in as an organizer.</p>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>Organizer Dashboard | PLUTO</title>
      </Helmet>

      <div className="container org-dashboard-container" style={{ maxWidth: '1140px', margin: '0 auto' }}>
        {/* MOBILE MAIN TABS */}
        <div className="org-main-tabs hide-desktop">
          <button
            className="org-main-tab-btn active"
            onClick={() => navigate('/organizer')}
          >
            <LayoutGrid size={16} /> <span>Dashboard</span>
          </button>
          <button
            className="org-main-tab-btn"
            onClick={() => navigate('/organizer/events')}
          >
            <CalendarDays size={16} /> <span>Events</span>
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
            <h1>Organizer Dashboard</h1>
            <p>Manage your events, track sales, and view bookings</p>
          </div>
          <button className="btn btn-primary org-create-btn" onClick={() => navigate('/create-event')}>
            <CalendarPlus size={16} /> Create Event
          </button>
        </motion.div>

        {/* ─── Mobile Header ─────────────────────── */}
        <motion.div
          className="dashboard-header hide-desktop"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ justifyContent: 'space-between', marginTop: '1.5rem' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="header-icon-wrap">
              <BarChart3 size={22} color="#a78bfa" />
            </div>
            <div>
              <h1 style={{ margin: 0 }}>Dashboard</h1>
            </div>
          </div>
        </motion.div>


        {/* ─── Stats ─────────────────────────── */}
        <motion.div
          className="dashboard-stats"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="dstat dstat-primary">
            <div className="dstat-icon"><CalendarDays size={22} /></div>
            <div className="dstat-info">
              <div className="dstat-value">
                {isLoading ? <div className="skeleton-block" style={{ width: 40, height: 24, borderRadius: 6 }} /> : (
                  <>
                    <span className="hide-mobile">{stats.totalEvents}</span>
                    <span className="hide-desktop">{formatCompactNumber(stats.totalEvents)}</span>
                  </>
                )}
              </div>
              <div className="dstat-label">Total Events</div>
            </div>
          </div>
          <div className="dstat dstat-primary">
            <div className="dstat-icon"><Ticket size={22} /></div>
            <div className="dstat-info">
              <div className="dstat-value">
                {isLoading ? <div className="skeleton-block" style={{ width: 40, height: 24, borderRadius: 6 }} /> : (
                  <>
                    <span className="hide-mobile">{stats.totalBookings}</span>
                    <span className="hide-desktop">{formatCompactNumber(stats.totalBookings)}</span>
                  </>
                )}
              </div>
              <div className="dstat-label">Tickets Sold</div>
            </div>
          </div>
          <div className="dstat dstat-primary">
            <div className="dstat-icon"><IndianRupee size={22} /></div>
            <div className="dstat-info">
              <div className="dstat-value">
                {isLoading ? <div className="skeleton-block" style={{ width: 60, height: 24, borderRadius: 6 }} /> : (
                  <>
                    <span className="hide-mobile">{stats.totalRevenue > 0 ? formatPrice(stats.totalRevenue) : '₹0'}</span>
                    <span className="hide-desktop">{stats.totalRevenue > 0 ? formatCompactPrice(stats.totalRevenue) : '₹0'}</span>
                  </>
                )}
              </div>
              <div className="dstat-label">Total Revenue</div>
            </div>
          </div>
        </motion.div>

        {/* ─── Events List ───────────────────── */}
        <motion.div
          className="org-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', width: '100%', gap: '2rem' }}>
            <div className="org-section-header" style={{ marginBottom: 0 }}>
              <h2><TrendingUp size={20} /> Your Events</h2>
            </div>

            <div className="dashboard-search org-events-search" style={{
              width: '100%',
              maxWidth: '500px',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              flex: 1
            }}>
              <Search size={16} strokeWidth={2.5} style={{ position: 'absolute', left: '14px', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Search your events"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 1rem 0.65rem 2.5rem', background: 'rgba(255, 255, 255, 0.04)', border: 'none', borderRadius: '50px', color: 'var(--white)', fontSize: '13px', outline: 'none', boxShadow: 'none' }}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="booking-strips" style={{ marginTop: '0.5rem' }}>
              {[1, 2, 3].map(i => (
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

                    <div className="strip-right" style={{ display: 'flex', justifyContent: 'flex-end', marginLeft: 'auto', gap: 16 }}>
                      <div className="skeleton-block" style={{ height: 26, width: 60, borderRadius: 8 }} />
                      <div className="skeleton-block" style={{ height: 34, width: 80, borderRadius: 8 }} />
                    </div>

                  </div>
                </div>
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="dashboard-empty">
              <CalendarPlus size={48} strokeWidth={1} style={{ color: 'var(--primary)', opacity: 0.6 }} />
              <h3>{searchQuery ? 'No Events Found' : 'No Events Created'}</h3>
              <p>{searchQuery ? 'Try adjusting your search' : 'Create your first event to get started'}</p>
              {!searchQuery && (
                <button className="btn btn-primary" onClick={() => navigate('/create-event')}>
                  <CalendarPlus size={16} /> Create Event
                </button>
              )}
            </div>
          ) : (
            <>
            <div className="booking-strips hide-mobile">
              <AnimatePresence>
                {filteredEvents.map((event, i) => {
                  return (
                    <motion.div
                      key={event.id}
                      className="booking-strip"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * i }}
                      style={{ cursor: 'default' }}
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
                          <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Tickets Sold</span>
                          <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                            <Users size={13} style={{ color: 'var(--text-muted)' }} />
                            {(event as any).ticket_count || 0} / {(event as any).ticketLimit || (event as any).ticket_limit || '∞'}
                          </span>
                        </div>

                        <div className="org-stats-column" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Price</span>
                          <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                            <Ticket size={13} style={{ color: 'var(--text-muted)' }} />
                            {getPriceDisplay(event)}
                          </span>
                        </div>

                        <div className="org-stats-column" style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                          <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Venue</span>
                          <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            <MapPin size={13} style={{ color: 'var(--text-muted)' }} />
                            {event.venue || '—'}
                          </span>
                        </div>

                        <div className="strip-right" style={{ display: 'flex', alignItems: 'center', gap: '16px', justifyContent: 'flex-end', marginLeft: 'auto' }}>
                          <span className="strip-badge strip-badge-live">Active</span>
                          <button
                            className="btn btn-outline"
                            onClick={(e) => {
                              navigate(`/event/${event.id}`)
                            }}
                            style={{
                              padding: '6px 14px',
                              fontSize: '0.8rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              height: '34px',
                              background: 'rgba(255,255,255,0.05)',
                              borderColor: 'rgba(255,255,255,0.1)'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                          >
                            <Eye size={14} /> View
                          </button>
                        </div>

                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>

            {/* MOBILE CARDS */}
            <div className="hide-desktop" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <AnimatePresence>
                {filteredEvents.map((event, i) => (
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
                      <div className="booking-card-badge confirmed">Active</div>
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
      </div>
    </>
  )
}
