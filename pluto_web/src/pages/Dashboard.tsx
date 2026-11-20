import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarDays, Clock, MapPin, Ticket, IndianRupee,
  TrendingUp, CalendarCheck, ArrowRight, Telescope,
  QrCode, ChevronDown, Undo2, Ban, CheckCircle2, Trophy,
  XCircle, Users
} from 'lucide-react'
import { useMyBookings } from '@/hooks/useBookings'
import { useMyCompRegistrations } from '@/hooks/useCompetitionRegistrations'
import { useAuthStore } from '@/stores/authStore'
import { formatDate, formatTime, formatPrice, isEventActive, formatCompactPrice } from '@/lib/utils'

import { CancelRefundModal } from '@/components/ui/CancelRefundModal'
import type { BookingFrontend } from '@/services/bookingService'
import './Dashboard.css'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { data: rawBookings, isLoading: isBookingsLoading } = useMyBookings()
  const { data: rawComps, isLoading: isCompsLoading } = useMyCompRegistrations()

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [mainTab, setMainTab] = useState<'events' | 'competitions'>('events')
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming')
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null)

  const isLoading = isBookingsLoading || isCompsLoading

  const bookings = (rawBookings || []) as BookingFrontend[]
  const comps = (rawComps || []) as any[]

  // Split into upcoming vs past for events
  const { upcoming, historyEvents, totalSpent } = useMemo(() => {
    const up: BookingFrontend[] = []
    const hist: BookingFrontend[] = []
    let spent = 0

    for (const b of bookings) {
      spent += b.totalAmount || 0
      if (b.eventDate && isEventActive({ start_date: b.eventDate, end_date: b.endDate })) {
        up.push(b)
      } else {
        hist.push(b)
      }
    }

    // add competition fees to totalSpent
    for (const c of comps) {
      spent += c.entry_fee_paid || 0
    }

    return { upcoming: up, historyEvents: hist, totalSpent: spent }
  }, [bookings, comps])

  // Split into upcoming vs past for competitions
  const { upcomingComps, historyComps } = useMemo(() => {
    const up: any[] = []
    const hist: any[] = []
    for (const c of comps) {
      const comp = c.competition || {}
      if (isEventActive({ start_date: comp.start_date, end_date: comp.end_date })) {
        up.push(c)
      } else {
        hist.push(c)
      }
    }
    return { upcomingComps: up, historyComps: hist }
  }, [comps])

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id)
  }

  // ─── Loading Skeleton ─────────────────────────
  if (isLoading) {
    return (
      <div className="container dashboard-container" style={{ maxWidth: '1140px', margin: '0 auto' }}>
        {/* ─── Header ───────────────────────── */}
        <motion.div
          className="dashboard-header"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="header-icon-wrap">
            <Ticket size={22} color="#a78bfa" />
          </div>
          <div>
            <h1>My Applications</h1>
            <p>Manage your tickets and history</p>
          </div>
        </motion.div>

        {/* Stats skeleton */}
        <div className="dashboard-stats">
          {[1, 2, 3].map(i => (
            <div key={i} className="dstat" style={{ opacity: 0.5 }}>
              <div className="skeleton-block" style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton-block" style={{ height: 24, width: 60, borderRadius: 6, marginBottom: 6 }} />
                <div className="skeleton-block" style={{ height: 12, width: 90, borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>

        {/* Tab row skeleton */}
        <div style={{ display: 'flex', gap: 8, marginBottom: '1.25rem' }}>
          <div className="skeleton-block" style={{ height: 40, width: 180, borderRadius: 10 }} />
          <div className="skeleton-block" style={{ height: 40, width: 160, borderRadius: 10 }} />
        </div>

        {/* Booking strips skeleton */}
        <div className="booking-strips" style={{ marginTop: '0.5rem' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="booking-strip" style={{ cursor: 'default', pointerEvents: 'none' }}>
              <div className="strip-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', padding: '1rem 1.25rem' }}>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0, flex: 1.5 }}>
                  <div className="skeleton-block" style={{ width: 44, height: 44, borderRadius: 8, flexShrink: 0 }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                    <div className="skeleton-block" style={{ height: 16, width: '60%', borderRadius: 4 }} />
                    <div className="skeleton-block" style={{ height: 12, width: '35%', borderRadius: 4 }} />
                  </div>
                </div>

                <div className="strip-inline-details" style={{ flex: 2, display: 'flex', gap: '2rem' }}>
                  <div className="strip-inline-item" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span className="inline-label" style={{ fontSize: '0.65rem' }}>Tickets</span>
                    <div className="skeleton-block" style={{ height: 16, width: 20, borderRadius: 4, marginTop: 2 }} />
                  </div>
                  <div className="strip-inline-item" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span className="inline-label" style={{ fontSize: '0.65rem' }}>Total Paid</span>
                    <div className="skeleton-block" style={{ height: 16, width: 40, borderRadius: 4, marginTop: 2 }} />
                  </div>
                  <div className="strip-inline-item" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span className="inline-label" style={{ fontSize: '0.65rem' }}>Venue</span>
                    <div className="skeleton-block" style={{ height: 16, width: 80, borderRadius: 4, marginTop: 2 }} />
                  </div>
                  <div className="strip-inline-item" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span className="inline-label" style={{ fontSize: '0.65rem' }}>Category</span>
                    <div className="skeleton-block" style={{ height: 16, width: 60, borderRadius: 4, marginTop: 2 }} />
                  </div>
                </div>

                <div className="strip-right" style={{ display: 'flex', justifyContent: 'flex-end', marginLeft: 'auto' }}>
                  <div className="skeleton-block" style={{ height: 26, width: 70, borderRadius: 8 }} />
                </div>

              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>Dashboard | PLUTO</title>
      </Helmet>

      <div className="container dashboard-container" style={{ maxWidth: '1140px', margin: '0 auto' }}>
        {/* ─── Header ───────────────────────── */}
        <motion.div
          className="dashboard-header"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="header-icon-wrap">
            <Ticket size={22} color="#a78bfa" />
          </div>
          <div>
            <h1>My Applications</h1>
            <p>Manage your tickets and history</p>
          </div>
        </motion.div>

        {/* ─── Stats ────────────────────────── */}
        <motion.div
          className="dashboard-stats"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="dstat dstat-primary">
            <div className="dstat-icon"><Ticket size={22} /></div>
            <div className="dstat-info">
              <div className="dstat-value">{bookings.length}</div>
              <div className="dstat-label">Total Bookings</div>
            </div>
          </div>
          <div className="dstat dstat-secondary">
            <div className="dstat-icon"><CalendarCheck size={22} /></div>
            <div className="dstat-info">
              <div className="dstat-value">{upcoming.length}</div>
              <div className="dstat-label">Active</div>
            </div>
          </div>
          <div className="dstat dstat-success">
            <div className="dstat-icon"><IndianRupee size={22} /></div>
            <div className="dstat-info">
              <div className="dstat-value hide-mobile">{formatPrice(totalSpent)}</div>
              <div className="dstat-value hide-desktop">{formatCompactPrice(totalSpent)}</div>
              <div className="dstat-label">Total Spent</div>
            </div>
          </div>
        </motion.div>

        {/* ─── Main Toggle: Events / Competitions ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{ marginBottom: '1.25rem' }}
        >
          {/* DESKTOP MAIN TABS */}
          <div className="dashboard-tab-row hide-mobile" style={{ display: 'flex', gap: '0.5rem', background: 'var(--card-bg)', padding: '0.25rem', borderRadius: '12px', width: 'fit-content' }}>
            <button
              className={`dashboard-tab-btn ${mainTab === 'events' ? 'active' : ''}`}
              onClick={() => { setMainTab('events'); setActiveTab('upcoming'); }}
              style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '8px', border: 'none', background: mainTab === 'events' ? 'var(--primary)' : 'transparent', color: mainTab === 'events' ? '#fff' : 'var(--text-secondary)' }}
            >
              <Ticket size={16} /> Events
            </button>
            <button
              className={`dashboard-tab-btn ${mainTab === 'competitions' ? 'active' : ''}`}
              onClick={() => { setMainTab('competitions'); setActiveTab('upcoming'); }}
              style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '8px', border: 'none', background: mainTab === 'competitions' ? 'var(--primary)' : 'transparent', color: mainTab === 'competitions' ? '#fff' : 'var(--text-secondary)' }}
            >
              <Trophy size={16} /> Competitions
            </button>
          </div>

          {/* MOBILE MAIN TABS */}
          <div className="dashboard-main-tabs hide-desktop">
            <button
              className={`dashboard-main-tab-btn ${mainTab === 'competitions' ? 'active' : ''}`}
              onClick={() => { setMainTab('competitions'); setActiveTab('upcoming'); }}
            >
              <Telescope size={16} /> Competitions
              {comps.length > 0 && <span className="tab-count">{comps.length}</span>}
            </button>
            <button
              className={`dashboard-main-tab-btn ${mainTab === 'events' ? 'active' : ''}`}
              onClick={() => { setMainTab('events'); setActiveTab('upcoming'); }}
            >
              <Ticket size={16} /> Events
              {bookings.length > 0 && <span className="tab-count">{bookings.length}</span>}
            </button>
          </div>
        </motion.div>

        {/* ─── Tab Toggle: Upcoming / History ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* DESKTOP SUB TABS */}
          <div className="dashboard-tab-row hide-mobile">
            <button
              className={`dashboard-tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
              onClick={() => setActiveTab('upcoming')}
            >
              <TrendingUp size={18} /> {mainTab === 'events' ? 'Upcoming Events' : 'Upcoming Competitions'}
              {(mainTab === 'events' ? upcoming.length : upcomingComps.length) > 0 && <span className="section-count">{mainTab === 'events' ? upcoming.length : upcomingComps.length}</span>}
            </button>
            <button
              className={`dashboard-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <Ticket size={18} /> Booking History
              {bookings.length > 0 && <span className="section-count">{bookings.length}</span>}
            </button>
          </div>

          {/* MOBILE SUB TABS */}
          <div className="dashboard-sub-tabs hide-desktop" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: '12px', marginBottom: '20px' }}>
            <button
              className={`dashboard-sub-tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
              onClick={() => setActiveTab('upcoming')}
            >
              Upcoming
            </button>
            <button
              className={`dashboard-sub-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              Past
            </button>
          </div>

          {/* ─── Tab Content ───────────────────── */}
          <AnimatePresence mode="wait">
            {activeTab === 'upcoming' ? (
              <motion.div
                key="upcoming"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {mainTab === 'events' ? (
                  upcoming.length === 0 ? (
                    <div className="dashboard-empty">
                      <CalendarDays size={48} strokeWidth={1} style={{ color: 'var(--primary)', opacity: 0.6 }} />
                      <h3>No Upcoming Events</h3>
                      <p>You haven't booked any events yet</p>
                      <button className="btn btn-primary" onClick={() => navigate('/explore')}>
                        <Telescope size={16} /> Browse Events
                      </button>
                    </div>
                  ) : (
                    <div className="booking-strips">
                      {upcoming.map((b, i) => {
                        const isOpen = expandedId === b.id
                        const isRefunded = b.bookingStatus === 'refunded'
                        const isCancelled = b.bookingStatus === 'cancelled'

                        const eventStartMs = (b.eventDate && b.eventTime) ? new Date(`${b.eventDate}T${b.eventTime}`).getTime() : 0;
                        const nowMs = Date.now();
                        const hoursUntilEvent = eventStartMs ? (eventStartMs - nowMs) / (1000 * 60 * 60) : 0;
                        const isMoreThan24hBeforeEvent = hoursUntilEvent >= 24;

                        // Allow testing refunds for all confirmed paid tickets that are > 24h away
                        const isRefundable = isMoreThan24hBeforeEvent && b.totalAmount > 0 && b.bookingStatus === 'confirmed';
                        const isNonRefundable = !isRefundable && !isRefunded && !isCancelled && b.totalAmount > 0 && b.bookingStatus === 'confirmed';

                        return (
                          <React.Fragment key={b.id}>
                            {/* DESKTOP BOOKING STRIP */}
                            <motion.div
                              className="booking-strip hover-actions-enabled hide-mobile"
                              initial={{ opacity: 0, y: 12 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.04 * i }}
                            >
                              <div className="strip-header">
                                <div className="strip-thumb">
                                  {b.eventBannerUrl ? (
                                    <img src={b.eventBannerUrl} alt={b.eventTitle} />
                                  ) : (
                                    <Ticket size={18} style={{ color: 'var(--primary)', opacity: 0.6 }} />
                                  )}
                                </div>
                                <div className="strip-main">
                                  <div className="strip-title">{b.eventTitle || 'Untitled Event'}</div>
                                  <div className="strip-sub">
                                    {b.eventDate && <><CalendarDays size={11} /> {formatDate(b.eventDate)}</>}
                                    {b.eventTime && <><Clock size={11} /> {formatTime(b.eventTime)}</>}
                                  </div>
                                </div>

                                <div className="strip-inline-details">
                                  <div className="strip-inline-item">
                                    <span className="inline-label">Tickets</span>
                                    <span className="inline-value">{b.quantity}</span>
                                  </div>
                                  <div className="strip-inline-item">
                                    <span className="inline-label">Total Paid</span>
                                    <span className="inline-value amount">{formatPrice(b.totalAmount)}</span>
                                  </div>
                                  <div className="strip-inline-item">
                                    <span className="inline-label">Venue</span>
                                    <span className="inline-value">{b.venue || '—'}{b.city ? `, ${b.city}` : ''}</span>
                                  </div>
                                  <div className="strip-inline-item">
                                    <span className="inline-label">Category</span>
                                    <span className="inline-value">{b.eventCategory || 'General'}</span>
                                  </div>
                                </div>

                                <div className="strip-right">
                                  {isRefunded ? (
                                    <span className="strip-badge strip-badge-refunded">Refunded</span>
                                  ) : isCancelled ? (
                                    <span className="strip-badge strip-badge-cancelled">Cancelled</span>
                                  ) : (
                                    <span className="strip-badge strip-badge-confirmed">Confirmed</span>
                                  )}
                                  <ChevronDown size={18} className="strip-chevron" />
                                </div>
                              </div>

                              <div className="strip-hover-actions">
                                <span className="strip-booking-id">Booking ID: {b.id.toUpperCase()}</span>
                                <span className="strip-booking-cat">Category: {b.eventCategory || 'General'}</span>
                                <div className="hover-actions-spacer" />
                                {isRefunded && (
                                  <span className="badge-refund-processed">
                                    <CheckCircle2 size={13} /> Refund processed
                                  </span>
                                )}
                                {isCancelled && (
                                  <span className="badge-refund-processed" style={{ color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)' }}>
                                    <Ban size={13} /> Cancelled
                                  </span>
                                )}
                                {!isRefunded && !isCancelled && (
                                  <>
                                    <button
                                      className="strip-ticket-btn"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        sessionStorage.setItem('latestBooking', b.id)
                                        navigate('/success')
                                      }}
                                    >
                                      <QrCode size={14} /> View E-Ticket
                                    </button>
                                    {isRefundable && (
                                      <button
                                        className="btn-cancel-refund"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setCancelBookingId(b.id)
                                        }}
                                      >
                                        <Undo2 size={14} /> Cancel & Get Refund
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </motion.div>

                            {/* MOBILE BOOKING CARD */}
                            <motion.div
                              className={`booking-card hide-desktop ${expandedId === b.id ? 'expanded' : ''}`}
                              initial={{ opacity: 0, y: 12 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.04 * i }}
                              onClick={() => setExpandedId(expandedId === b.id ? null : b.id)}
                            >
                              <div className="booking-card-row">
                                <div className="booking-card-thumb">
                                  {b.eventBannerUrl ? (
                                    <img src={b.eventBannerUrl} alt={b.eventTitle} />
                                  ) : (
                                    <Ticket size={20} color="rgba(99,102,241,0.6)" />
                                  )}
                                </div>
                                <div className="booking-card-meta">
                                  <div className="booking-card-title">{b.eventTitle || 'Untitled Event'}</div>
                                  <div className="booking-card-subrow">
                                    {b.eventDate && (
                                      <div className="booking-card-chip">
                                        <CalendarDays size={11} color="#a1a1aa" />
                                        <span>{formatDate(b.eventDate)}</span>
                                      </div>
                                    )}
                                    {b.eventTime && (
                                      <div className="booking-card-chip">
                                        <Clock size={11} color="#a1a1aa" />
                                        <span>{formatTime(b.eventTime)}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className={`booking-card-badge ${isRefunded ? 'refunded' : isCancelled ? 'cancelled' : 'confirmed'}`}>
                                  {isRefunded ? 'Refunded' : isCancelled ? 'Cancelled' : 'Confirmed'}
                                </div>
                              </div>

                              <div className="booking-card-inline">
                                <div className="booking-card-inline-item">
                                  <span className="booking-card-inline-label">Tickets</span>
                                  <span className="booking-card-inline-value">{b.quantity}</span>
                                </div>
                                <div className="booking-card-inline-item">
                                  <span className="booking-card-inline-label">Total Paid</span>
                                  <span className="booking-card-inline-value" style={{ color: '#a78bfa' }}>{formatPrice(b.totalAmount)}</span>
                                </div>
                                <div className="booking-card-inline-item">
                                  <span className="booking-card-inline-label">Category</span>
                                  <span className="booking-card-inline-value">{b.eventCategory || 'General'}</span>
                                </div>
                              </div>

                              {expandedId === b.id && (
                                <div className="booking-card-expanded">
                                  <div className="booking-card-divider" />
                                  <div className="booking-card-expand-row">
                                    <span className="booking-card-expand-label">Booking ID</span>
                                    <span className="booking-card-expand-value">{b.id}</span>
                                  </div>
                                  <div className="booking-card-expand-row">
                                    <span className="booking-card-expand-label">Venue</span>
                                    <span className="booking-card-expand-value">
                                      {b.venue || '—'}{b.city ? `, ${b.city}` : ''}
                                    </span>
                                  </div>

                                  {isRefunded && (
                                    <div className="booking-card-refund-badge">
                                      <CheckCircle2 size={13} color="#34d399" />
                                      <span>Refund processed</span>
                                    </div>
                                  )}

                                  <div className="booking-card-actions">
                                    {!isRefunded && !isCancelled && (
                                      <button
                                        className="booking-card-btn-primary"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          sessionStorage.setItem('latestBooking', b.id)
                                          navigate('/success')
                                        }}
                                      >
                                        <QrCode size={16} color="#fff" />
                                        <span>View E-Ticket</span>
                                      </button>
                                    )}
                                    {b.bookingStatus === 'confirmed' && b.totalAmount > 0 && !isRefunded && !isNonRefundable && (
                                      <button
                                        className="booking-card-btn-cancel"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setCancelBookingId(b.id)
                                        }}
                                      >
                                        <XCircle size={15} color="#ff4d4d" />
                                        <span>Cancel</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}

                              <div className="booking-card-chevron-wrap">
                                <ChevronDown
                                  size={16}
                                  color="#71717a"
                                  style={{ transform: `rotate(${expandedId === b.id ? '180deg' : '0deg'})`, transition: 'transform 0.2s' }}
                                />
                              </div>
                            </motion.div>
                          </React.Fragment>
                        )
                      })}
                    </div>
                  )
                ) : (
                  upcomingComps.length === 0 ? (
                    <div className="dashboard-empty">
                      <Trophy size={48} strokeWidth={1} style={{ color: 'var(--primary)', opacity: 0.6 }} />
                      <h3>No Upcoming Competitions</h3>
                      <p>You haven't registered for any competitions yet</p>
                    </div>
                  ) : (
                    <div className="booking-strips">
                      {upcomingComps.map((c, i) => {
                        const comp = c.competition || {}
                        const isTeam = c.registration_type === 'team'
                        const status = isTeam && c.team ? (c.team.status === 'forming' || c.team.status === 'draft' ? 'draft' : c.team.status) : c.status
                        const compStage = isTeam ? c.team?.current_stage : c.current_stage

                        let statusLabel = 'Draft'
                        let badgeClass = 'strip-badge-upcoming'
                        if (status === 'draft') { statusLabel = 'Draft'; badgeClass = 'strip-badge-cancelled' }
                        else if (status === 'pending') { statusLabel = 'Pending'; badgeClass = 'strip-badge-upcoming' }
                        else if (status === 'approved' || status === 'registered') { statusLabel = 'Registered'; badgeClass = 'strip-badge-confirmed' }
                        else if (status === 'rejected') { statusLabel = 'Rejected'; badgeClass = 'strip-badge-cancelled' }
                        const isCompleted = status === 'registered' || status === 'approved'
                        const regDate = new Date(c.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) + ', ' + new Date(c.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                        const deadline = comp?.registration_deadline ? new Date(comp.registration_deadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'
                        const leaderEmail = c.team?.leader?.email
                        const byText = isTeam
                          ? (c.team_role === 'leader' ? `You (${user?.email || 'N/A'})` : `Team Leader (${leaderEmail || 'N/A'})`)
                          : `You (${user?.email || 'N/A'})`
                        const stages = [
                          { id: 1, title: 'Registration Form', completed: true },
                          { id: 2, title: isTeam ? 'Team' : 'Details', completed: isCompleted },
                          { id: 3, title: 'Extended Form', completed: false },
                          { id: 4, title: 'Submission', completed: false }
                        ]

                        return (
                          <React.Fragment key={c.id}>
                            {/* DESKTOP COMP STRIP */}
                            <motion.div
                              className="booking-strip hover-actions-enabled hide-mobile"
                              initial={{ opacity: 0, y: 12 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.04 * i }}
                              onClick={() => navigate(`/competition/${comp?.id}`)}
                              style={{ cursor: 'pointer' }}
                            >
                              <div className="strip-header">
                                <div className="strip-thumb">
                                  {comp?.banner_url ? (
                                    <img src={comp.banner_url} alt={comp.title} />
                                  ) : (
                                    <Trophy size={18} style={{ color: 'var(--primary)', opacity: 0.6 }} />
                                  )}
                                </div>
                                <div className="strip-main">
                                  <div className="strip-title">{comp?.title || 'Unknown Competition'}</div>
                                  <div className="strip-sub">
                                    {comp?.start_date && <><CalendarDays size={11} /> {formatDate(comp.start_date)}</>}
                                    {isTeam && c.team?.name && <><span style={{ margin: '0 6px', opacity: 0.5 }}>•</span>Team {c.team.name}</>}
                                  </div>
                                </div>

                                <div className="strip-inline-details">
                                  <div className="strip-inline-item">
                                    <span className="inline-label">Type</span>
                                    <span className="inline-value">{isTeam ? 'Team' : 'Individual'}</span>
                                  </div>
                                  <div className="strip-inline-item">
                                    <span className="inline-label">Total Paid</span>
                                    <span className="inline-value amount">{formatPrice(c.entry_fee_paid || 0)}</span>
                                  </div>
                                  <div className="strip-inline-item">
                                    <span className="inline-label">Stage</span>
                                    <span className="inline-value">{compStage || 'Registered'}</span>
                                  </div>
                                </div>

                                <div className="strip-right">
                                  <span className={`strip-badge ${badgeClass}`}>{statusLabel}</span>
                                  <ChevronDown size={18} className="strip-chevron" />
                                </div>
                              </div>

                              <div className="strip-hover-actions">
                                <span className="strip-booking-id">Reg ID: {c.id.substring(0, 8).toUpperCase()}</span>
                                <div className="hover-actions-spacer" />
                                <button
                                  className="strip-ticket-btn"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    navigate(`/competition/${comp?.id}`)
                                  }}
                                >
                                  <ArrowRight size={14} /> View Details
                                </button>
                              </div>
                            </motion.div>

                            {/* MOBILE COMP CARD */}
                            <div className="comp-reg-card hide-desktop" onClick={() => navigate(`/competition/${comp?.id}`)}>
                              <div className="comp-reg-card-inner">
                                <div className="comp-reg-header">
                                  <div className="comp-reg-thumb">
                                    {comp?.banner_url ? (
                                      <img src={comp.banner_url} alt={comp.title} />
                                    ) : (
                                      <Trophy size={24} color="#a78bfa" />
                                    )}
                                  </div>
                                  <div className="comp-reg-title-wrap">
                                    <div className="comp-reg-title">{comp?.title || 'Competition'}</div>
                                    <div className="comp-reg-date">Registered on: {regDate}</div>
                                  </div>
                                </div>

                                <div className="comp-reg-info">
                                  <div className="comp-reg-info-pill">
                                    <span className="comp-info-text"><span className="comp-info-label">By: </span>{byText}</span>
                                    <div className="comp-info-dot" />
                                    <span className="comp-info-text"><span className="comp-info-label">Deadline: </span>{deadline}</span>
                                  </div>
                                </div>

                                <div className="comp-reg-stepper-wrap">
                                  <div className="comp-reg-stepper">
                                    {stages.map((stage, index) => (
                                      <React.Fragment key={stage.id}>
                                        <div className="stepper-node">
                                          <div className={`stepper-circle ${stage.completed ? 'completed' : ''}`}>
                                            {stage.completed ? <CheckCircle2 size={14} color="#fff" /> : <span>{stage.id}</span>}
                                          </div>
                                          <span className={`stepper-label ${stage.completed ? 'completed' : ''}`}>{stage.title}</span>
                                        </div>
                                        {index < stages.length - 1 && (
                                          <div className={`stepper-line ${stages[index + 1].completed ? 'completed' : ''}`} />
                                        )}
                                      </React.Fragment>
                                    ))}
                                  </div>
                                </div>

                                <div className="comp-reg-divider" />

                                <div className="comp-reg-footer">
                                  <div className="comp-reg-status-left">
                                    {(status === 'shortlisted' || status === 'winner' || status === 'eliminated') && (
                                      <div className={`comp-reg-badge ${status}`}>
                                        {status}
                                      </div>
                                    )}
                                  </div>
                                  <div className="comp-reg-status-right">
                                    {isTeam && <Users size={18} color="#d4d4d8" />}
                                    <div className={`comp-reg-status ${isCompleted ? 'registered' : 'pending'}`}>
                                      {isCompleted ? (
                                        <>
                                          <CheckCircle2 size={18} color="#10b981" />
                                          <span>Registered</span>
                                        </>
                                      ) : (
                                        <>
                                          <Clock size={18} color="#fbbf24" />
                                          <span>Registration Pending</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </React.Fragment>
                        )
                      })}
                    </div>
                  )
                )}
              </motion.div>
            ) : (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {mainTab === 'events' ? (
                  historyEvents.length === 0 ? (
                    <div className="dashboard-empty" style={{ padding: '2rem' }}>
                      <Ticket size={48} strokeWidth={1} style={{ color: 'var(--primary)', opacity: 0.5 }} />
                      <p>Your past bookings will appear here</p>
                    </div>
                  ) : (
                    <div className="booking-strips">
                      {historyEvents.map((b, i) => {
                        const isUp = upcoming.includes(b)
                        const isRefunded = b.bookingStatus === 'refunded'
                        const isCancelled = b.bookingStatus === 'cancelled'

                        let statusLabel: string
                        let badgeClass: string
                        if (isRefunded) {
                          statusLabel = 'Refunded'
                          badgeClass = 'strip-badge-refunded'
                        } else if (isCancelled) {
                          statusLabel = 'Cancelled'
                          badgeClass = 'strip-badge-cancelled'
                        } else if (isUp) {
                          statusLabel = 'Upcoming'
                          badgeClass = 'strip-badge-upcoming'
                        } else {
                          statusLabel = 'Attended'
                          badgeClass = 'strip-badge-attended'
                        }

                        return (
                          <React.Fragment key={b.id}>
                            {/* DESKTOP PAST EVENT STRIP */}
                            <motion.div
                              className="booking-strip history-strip hide-mobile"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.03 * i }}
                              onClick={() => navigate(`/event/${b.eventId}`)}
                              style={{ cursor: 'pointer' }}
                            >
                              <div className="strip-header">
                                <div className="strip-thumb">
                                  {b.eventBannerUrl ? (
                                    <img src={b.eventBannerUrl} alt={b.eventTitle} />
                                  ) : (
                                    <Ticket size={18} style={{ color: 'var(--primary)', opacity: 0.5 }} />
                                  )}
                                </div>
                                <div className="strip-main">
                                  <div className="strip-title">{b.eventTitle || 'Unknown Event'}</div>
                                  <div className="strip-sub">
                                    {b.eventDate && <><CalendarDays size={11} /> {formatDate(b.eventDate)}</>}
                                    <span style={{ opacity: 0.5, margin: '0 4px' }}>•</span>
                                    {b.quantity} ticket{b.quantity > 1 ? 's' : ''}
                                  </div>
                                </div>
                                <div className="strip-right">
                                  <span className={`strip-amount ${isRefunded ? 'amount-refunded' : ''}`}>
                                    {formatPrice(b.totalAmount)}
                                  </span>
                                  <span className={`strip-badge ${badgeClass}`}>{statusLabel}</span>
                                  <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
                                </div>
                              </div>
                            </motion.div>

                            {/* MOBILE PAST EVENT CARD */}
                            <motion.div
                              className="booking-card hide-desktop"
                              initial={{ opacity: 0, y: 12 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.04 * i }}
                              onClick={() => navigate(`/event/${b.eventId}`)}
                            >
                              <div className="booking-card-row">
                                <div className="booking-card-thumb">
                                  {b.eventBannerUrl ? (
                                    <img src={b.eventBannerUrl} alt={b.eventTitle} />
                                  ) : (
                                    <Ticket size={20} color="rgba(99,102,241,0.6)" />
                                  )}
                                </div>
                                <div className="booking-card-meta">
                                  <div className="booking-card-title">{b.eventTitle || 'Untitled Event'}</div>
                                  <div className="booking-card-subrow">
                                    {b.eventDate && (
                                      <div className="booking-card-chip">
                                        <CalendarDays size={11} color="#a1a1aa" />
                                        <span>{formatDate(b.eventDate)}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className={`booking-card-badge ${isRefunded ? 'refunded' : isCancelled ? 'cancelled' : isUp ? 'upcoming' : 'confirmed'}`}>
                                  {statusLabel}
                                </div>
                              </div>

                              <div className="booking-card-inline">
                                <div className="booking-card-inline-item">
                                  <span className="booking-card-inline-label">Tickets</span>
                                  <span className="booking-card-inline-value">{b.quantity}</span>
                                </div>
                                <div className="booking-card-inline-item">
                                  <span className="booking-card-inline-label">Total Paid</span>
                                  <span className="booking-card-inline-value" style={{ color: '#a78bfa' }}>{formatPrice(b.totalAmount)}</span>
                                </div>
                                <div className="booking-card-inline-item">
                                  <span className="booking-card-inline-label">Category</span>
                                  <span className="booking-card-inline-value">{b.eventCategory || 'General'}</span>
                                </div>
                              </div>
                            </motion.div>
                          </React.Fragment>
                        )
                      })}
                    </div>
                  )
                ) : (
                  historyComps.length === 0 ? (
                    <div className="dashboard-empty" style={{ padding: '2rem' }}>
                      <Trophy size={48} strokeWidth={1} style={{ color: 'var(--primary)', opacity: 0.5 }} />
                      <p>Your past competitions will appear here</p>
                    </div>
                  ) : (
                    <div className="booking-strips">
                      {historyComps.map((c, i) => {
                        const comp = c.competition || {}
                        const isTeam = c.registration_type === 'team'
                        const status = isTeam && c.team ? (c.team.status === 'forming' || c.team.status === 'draft' ? 'draft' : c.team.status) : c.status
                        const isCompleted = status === 'registered' || status === 'approved'
                        const regDate = new Date(c.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) + ', ' + new Date(c.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                        const deadline = comp?.registration_deadline ? new Date(comp.registration_deadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'
                        const leaderEmail = c.team?.leader?.email
                        const byText = isTeam
                          ? (c.team_role === 'leader' ? `You (${user?.email || 'N/A'})` : `Team Leader (${leaderEmail || 'N/A'})`)
                          : `You (${user?.email || 'N/A'})`
                        const stages = [
                          { id: 1, title: 'Registration Form', completed: true },
                          { id: 2, title: isTeam ? 'Team' : 'Details', completed: isCompleted },
                          { id: 3, title: 'Extended Form', completed: false },
                          { id: 4, title: 'Submission', completed: false }
                        ]

                        return (
                          <React.Fragment key={c.id}>
                            {/* DESKTOP PAST COMP STRIP */}
                            <motion.div
                              className="booking-strip history-strip hide-mobile"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.03 * i }}
                              onClick={() => navigate(`/competition/${comp?.id}`)}
                              style={{ cursor: 'pointer' }}
                            >
                              <div className="strip-header">
                                <div className="strip-thumb">
                                  {comp?.banner_url ? (
                                    <img src={comp.banner_url} alt={comp.title} />
                                  ) : (
                                    <Trophy size={18} style={{ color: 'var(--primary)', opacity: 0.5 }} />
                                  )}
                                </div>
                                <div className="strip-main">
                                  <div className="strip-title">{comp?.title || 'Unknown Competition'}</div>
                                  <div className="strip-sub">
                                    {comp?.start_date && <><CalendarDays size={11} /> {formatDate(comp.start_date)}</>}
                                    {isTeam && c.team?.name && <><span style={{ margin: '0 4px', opacity: 0.5 }}>•</span>Team {c.team.name}</>}
                                  </div>
                                </div>
                                <div className="strip-right">
                                  <span className="strip-amount">
                                    {formatPrice(c.entry_fee_paid || 0)}
                                  </span>
                                  <span className="strip-badge strip-badge-attended">Completed</span>
                                  <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
                                </div>
                              </div>
                            </motion.div>

                            {/* MOBILE PAST COMP CARD */}
                            <div className="comp-reg-card hide-desktop" onClick={() => navigate(`/competition/${comp?.id}`)}>
                              <div className="comp-reg-card-inner">
                                <div className="comp-reg-header">
                                  <div className="comp-reg-thumb">
                                    {comp?.banner_url ? (
                                      <img src={comp.banner_url} alt={comp.title} />
                                    ) : (
                                      <Trophy size={24} color="#a78bfa" />
                                    )}
                                  </div>
                                  <div className="comp-reg-title-wrap">
                                    <div className="comp-reg-title">{comp?.title || 'Competition'}</div>
                                    <div className="comp-reg-date">Registered on: {regDate}</div>
                                  </div>
                                </div>

                                <div className="comp-reg-info">
                                  <div className="comp-reg-info-pill">
                                    <span className="comp-info-text"><span className="comp-info-label">By: </span>{byText}</span>
                                    <div className="comp-info-dot" />
                                    <span className="comp-info-text"><span className="comp-info-label">Deadline: </span>{deadline}</span>
                                  </div>
                                </div>

                                <div className="comp-reg-stepper-wrap">
                                  <div className="comp-reg-stepper">
                                    {stages.map((stage, index) => (
                                      <React.Fragment key={stage.id}>
                                        <div className="stepper-node">
                                          <div className={`stepper-circle ${stage.completed ? 'completed' : ''}`}>
                                            {stage.completed ? <CheckCircle2 size={14} color="#fff" /> : <span>{stage.id}</span>}
                                          </div>
                                          <span className={`stepper-label ${stage.completed ? 'completed' : ''}`}>{stage.title}</span>
                                        </div>
                                        {index < stages.length - 1 && (
                                          <div className={`stepper-line ${stages[index + 1].completed ? 'completed' : ''}`} />
                                        )}
                                      </React.Fragment>
                                    ))}
                                  </div>
                                </div>

                                <div className="comp-reg-divider" />

                                <div className="comp-reg-footer">
                                  <div className="comp-reg-status-left">
                                    {(status === 'shortlisted' || status === 'winner' || status === 'eliminated') && (
                                      <div className={`comp-reg-badge ${status}`}>
                                        {status}
                                      </div>
                                    )}
                                  </div>
                                  <div className="comp-reg-status-right">
                                    {isTeam && <Users size={18} color="#d4d4d8" />}
                                    <div className={`comp-reg-status ${isCompleted ? 'registered' : 'pending'}`}>
                                      {isCompleted ? (
                                        <>
                                          <CheckCircle2 size={18} color="#10b981" />
                                          <span>Registered</span>
                                        </>
                                      ) : (
                                        <>
                                          <Clock size={18} color="#fbbf24" />
                                          <span>Registration Pending</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </React.Fragment>
                        )
                      })}
                    </div>
                  )
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ─── Explore CTA ──────────────────── */}
        <motion.div
          className="dashboard-cta"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <button className="btn btn-outline" onClick={() => navigate('/explore')}>
            {mainTab === 'events' ? <Ticket size={16} /> : <Trophy size={16} />}
            <span>Discover More {mainTab === 'events' ? 'Events' : 'Competitions'}</span>
            <ArrowRight size={16} />
          </button>
        </motion.div>
      </div>

      {/* ─── Cancel / Refund Modal ─────────── */}
      {cancelBookingId && (
        <CancelRefundModal
          bookingId={cancelBookingId}
          onClose={() => setCancelBookingId(null)}
        />
      )}


    </>
  )
}
