import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import { CalendarDays, Clock, MapPin, Mail, User, Ticket, CreditCard, Shield, ArrowLeft, Tent, Compass, Sparkles, RefreshCw, Maximize, X, Share2 } from 'lucide-react'
import { useEvent, useTicketCounts } from '@/hooks/useEvents'
import { useMyBookings } from '@/hooks/useBookings'
import { useAuthStore } from '@/stores/authStore'
import { getCdnUrl } from '@/utils/cdn'
import { useEventBookings, useCreateBooking } from '@/hooks/useBookings'
import { useUIStore } from '@/stores/uiStore'
import { formatDate, formatTime, formatPrice } from '@/lib/utils'

import './EventDetails.css'

export default function EventDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { openAuthModal } = useUIStore()
  const [activeTab, setActiveTab] = useState(0)
  const [isPosterModalOpen, setIsPosterModalOpen] = useState(false)

  const isAdminUser = !!user?.admin_type || user?.roles?.includes('admin') || user?.email?.endsWith('@admin.com')
  const isPureOrganizer = user?.roles?.includes('organizer') && !user?.roles?.includes('user') && !user?.roles?.includes('student') && !user?.roles?.includes('admin') && !user?.roles?.includes('staff')
  const isStaff = user?.roles?.includes('staff')

  const { data: event, isLoading } = useEvent(id)
  const { data: ticketCounts = {} } = useTicketCounts(id ? [id] : [])
  const { data: myBookings } = useMyBookings()

  const existingBooking = useMemo(() => {
    if (!myBookings || !id) return null
    return myBookings.find(b => b.eventId === id && b.bookingStatus === 'confirmed') || null
  }, [myBookings, id])

  const ticketsSold = id ? ticketCounts[id] || 0 : 0
  // DB columns: ticket_limit, ticket_price — fallback to aliases
  const maxTickets = event?.max_tickets || event?.ticket_limit || 0
  const available = maxTickets ? maxTickets - ticketsSold : null
  const eventPrice = event?.price ?? event?.ticket_price ?? 0
  const isFree = eventPrice === 0
  const isSoldOut = available !== null && available <= 0

  // ── Seat layout price logic — extract min price for seated events ──
  const { seatPriceDisplay, hasFluctuatingPrices } = useMemo(() => {
    if (!event?.has_seating || !event.seat_layout) return { seatPriceDisplay: null, hasFluctuatingPrices: false }
    const layout = event.seat_layout as any
    let minPrice = Infinity
    let maxPrice = -Infinity
    const seats = layout.seats || []
    const tables = layout.tables || []

    seats.forEach((s: any) => {
      if (s.price < minPrice) minPrice = s.price
      if (s.price > maxPrice) maxPrice = s.price
    })
    tables.forEach((t: any) => {
      if (t.price < minPrice) minPrice = t.price
      if (t.price > maxPrice) maxPrice = t.price
    })

    if (minPrice !== Infinity && maxPrice !== -Infinity) {
      if (minPrice === 0 && maxPrice === 0) return { seatPriceDisplay: 'Free', hasFluctuatingPrices: false }
      if (minPrice === maxPrice) return { seatPriceDisplay: formatPrice(minPrice), hasFluctuatingPrices: false }
      return { seatPriceDisplay: `Starting from ${formatPrice(minPrice)}`, hasFluctuatingPrices: true }
    }
    return { seatPriceDisplay: null, hasFluctuatingPrices: false }
  }, [event])

  const handleBooking = () => {
    if (!user) {
      openAuthModal('login')
      return
    }
    if (existingBooking) {
      sessionStorage.setItem('latestBooking', existingBooking.id)
      navigate('/success')
      return
    }
    if (event?.has_seating) {
      navigate(`/seat-selection/${id}`)
    } else {
      navigate(`/book/${id}`)
    }
  }

  // Time display — DB column is start_time, fallback to time
  const startTime = event?.start_time || event?.time
  const endTime = event?.end_time
  const timeDisplay = startTime
    ? `${formatTime(startTime)}${endTime ? ' — ' + formatTime(endTime) : ''}`
    : null

  // ── Booking box price text ──
  const getBoxPrice = () => {
    if (isFree && !event?.has_seating) return 'Free'
    if (event?.has_seating) {
      if (seatPriceDisplay) return seatPriceDisplay
      return isFree ? 'Free' : formatPrice(eventPrice)
    }
    return formatPrice(eventPrice)
  }

  const getBoxSubtext = () => {
    if (isFree && !event?.has_seating) return 'Free entry'
    if (event?.has_seating) {
      // Don't show "per seat" if prices are different across seats
      if (hasFluctuatingPrices) return ''
      return 'per seat'
    }
    return 'per ticket'
  }
  if (isLoading) {
    return (
      <div className="container event-details-page" style={{ pointerEvents: 'none' }}>
        {/* ── Hero Skeleton ─────────── */}
        <motion.div
          className="event-hero"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Poster (60%) */}
          <div className="event-hero-poster skeleton-block" style={{ borderRadius: 0 }}>
             {/* Skeleton block handles the shimmer */}
          </div>

          {/* Details Panel (40%) */}
          <div className="event-hero-details">
            <div className="hero-detail-item">
              <CalendarDays size={14} className="hero-detail-icon skeleton-icon" />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="hero-detail-label">Date</span>
                <span className="skeleton-block" style={{ width: '120px', height: 16, borderRadius: 4, marginTop: 4 }} />
              </div>
            </div>
            <div className="hero-detail-item">
              <Clock size={14} className="hero-detail-icon skeleton-icon" />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="hero-detail-label">Time</span>
                <span className="skeleton-block" style={{ width: '90px', height: 16, borderRadius: 4, marginTop: 4 }} />
              </div>
            </div>
            <div className="hero-detail-item">
              <MapPin size={14} className="hero-detail-icon skeleton-icon" />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="hero-detail-label">Venue</span>
                <span className="skeleton-block" style={{ width: '150px', height: 16, borderRadius: 4, marginTop: 4 }} />
              </div>
            </div>
            <div className="hero-detail-item">
              <Mail size={14} className="hero-detail-icon skeleton-icon" />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="hero-detail-label">Contact</span>
                <span className="skeleton-block" style={{ width: '180px', height: 16, borderRadius: 4, marginTop: 4 }} />
              </div>
            </div>
            <div className="hero-detail-item">
              <User size={14} className="hero-detail-icon skeleton-icon" />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="hero-detail-label">Organizer</span>
                <span className="skeleton-block" style={{ width: '100px', height: 16, borderRadius: 4, marginTop: 4 }} />
              </div>
            </div>
            <div className="hero-detail-item">
              <Ticket size={14} className="hero-detail-icon skeleton-icon" />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="hero-detail-label">Available Tickets</span>
                <span className="skeleton-block" style={{ width: '70px', height: 16, borderRadius: 4, marginTop: 4 }} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Below Hero Skeleton ── */}
        <div className="event-details-grid">
          {/* Left: Booking Box */}
          <div className="booking-box-wrapper">
            <div className="booking-box">
              <h3 className="booking-price">
                <span className="skeleton-block" style={{ width: 120, height: 36, borderRadius: 6, display: 'inline-block', margin: '0 auto' }} />
              </h3>
              <p className="booking-subtext" style={{ marginTop: '0.5rem' }}>
                <span className="skeleton-block" style={{ width: 80, height: 14, borderRadius: 4, display: 'inline-block', margin: '0 auto' }} />
              </p>

              <span className="skeleton-block" style={{ width: '100%', height: 50, borderRadius: 24, marginTop: '2rem', display: 'block' }} />

              <div className="booking-perks" style={{ marginTop: '1.5rem' }}>
                <span className="skeleton-block" style={{ width: '100%', height: 34, borderRadius: 8, marginBottom: '0.5rem', display: 'block' }} />
                <span className="skeleton-block" style={{ width: '100%', height: 34, borderRadius: 8, marginBottom: '0.5rem', display: 'block' }} />
                <span className="skeleton-block" style={{ width: '100%', height: 34, borderRadius: 8, display: 'block' }} />
              </div>
            </div>
          </div>

          {/* Right: Tabs & Description */}
          <div className="event-info">
            <div className="tab-buttons">
              <span className="skeleton-block" style={{ width: '100%', height: 44, borderRadius: 24, display: 'block' }} />
            </div>
            
            <div className="tab-box" style={{ padding: '1.5rem' }}>
              <div className="tab-content" style={{ overflow: 'hidden' }}>
                <span className="skeleton-block" style={{ width: '40%', height: 24, borderRadius: 6, marginBottom: '1.5rem', display: 'block' }} />
                
                <span className="skeleton-block" style={{ width: '100%', height: 16, borderRadius: 4, marginBottom: '1rem', display: 'block' }} />
                <span className="skeleton-block" style={{ width: '95%', height: 16, borderRadius: 4, marginBottom: '1rem', display: 'block' }} />
                <span className="skeleton-block" style={{ width: '90%', height: 16, borderRadius: 4, marginBottom: '1rem', display: 'block' }} />
                <span className="skeleton-block" style={{ width: '85%', height: 16, borderRadius: 4, marginBottom: '1rem', display: 'block' }} />
                <span className="skeleton-block" style={{ width: '60%', height: 16, borderRadius: 4, display: 'block' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '4rem' }}>
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
          <Compass size={72} strokeWidth={1} style={{ color: 'var(--primary)', opacity: 0.8 }} />
        </div>
        <h2>Event Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          This event may have been removed or the link is invalid.
        </p>
        <button className="btn btn-primary" onClick={() => navigate('/explore')}>
          <ArrowLeft size={16} /> Back to Events
        </button>
      </div>
    )
  }

  return (
    <div className="container event-details-page">
      <Helmet>
        <title>{event.title} - PLUTO</title>
        <meta name="description" content={event.description?.slice(0, 150)} />
      </Helmet>

      {/* ── Hero: 60% Poster + 40% Details ─────────── */}
      <motion.div
        className="event-hero"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Poster (60%) */}
        <div className="event-hero-poster">
          {event.banner_url ? (
            <>
              <div className="event-banner-blur" style={{ backgroundImage: `url(${getCdnUrl(event.banner_url)})` }} />
              <img src={getCdnUrl(event.banner_url)} alt={event.title} className="event-banner-img" />
              {/* Mobile Top Actions - visible only on mobile via CSS */}
              <div className="mobile-poster-actions">
                <button 
                  className="mobile-poster-icon-btn"
                  onClick={() => navigate(-1)}
                >
                  <ArrowLeft size={20} color="#fff" />
                </button>
                <div className="mobile-poster-right-actions">
                  {available !== null && available > 0 && (
                    <div className="mobile-poster-tickets-badge">
                      <Ticket size={12} color="#a8ff83" />
                      <span>{available} left</span>
                    </div>
                  )}
                  <button 
                    className="mobile-poster-icon-btn" 
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({ title: event.title, url: window.location.href }).catch(console.error);
                      }
                    }}
                  >
                    <Share2 size={18} color="#fff" />
                  </button>
                </div>
              </div>
              <div className="desktop-poster-actions" style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 10, display: 'flex', gap: '0.75rem' }}>
                <button 
                  onClick={() => setIsPosterModalOpen(true)}
                  className="view-poster-btn"
                  style={{ position: 'relative', top: 'auto', right: 'auto' }}
                >
                  <Maximize size={16} /> View
                </button>
                <button 
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: event.title, url: window.location.href }).catch(console.error);
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                    }
                  }}
                  className="view-poster-btn"
                  style={{ position: 'relative', top: 'auto', right: 'auto', padding: '0.5rem', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', justifyContent: 'center' }}
                >
                  <Share2 size={16} />
                </button>
              </div>
            </>
          ) : (
            <div className="event-banner-placeholder-inner">
              <Tent size={80} style={{ color: 'rgba(255, 255, 255, 0.2)' }} />
            </div>
          )}
          {/* Event name overlay at bottom-right */}
          <div className="event-hero-title-overlay">
            <h1 className="event-hero-title">
              {event.title}
              {(event.isUniversal || event.is_universal) && <span className="global-badge">GLOBAL</span>}
            </h1>
          </div>
        </div>

        {/* Details Panel (40%) */}
        <div className="event-hero-details">
          <div className="hero-detail-item">
            <CalendarDays size={14} className="hero-detail-icon icon-date" />
            <div>
              <span className="hero-detail-label">Date</span>
              <span className="hero-detail-value">{formatDate(event.start_date)}{event.end_date && event.end_date !== event.start_date ? ` — ${formatDate(event.end_date)}` : ''}</span>
            </div>
          </div>
          {timeDisplay && (
            <div className="hero-detail-item">
              <Clock size={14} className="hero-detail-icon icon-time" />
              <div>
                <span className="hero-detail-label">Time</span>
                <span className="hero-detail-value">{timeDisplay}</span>
              </div>
            </div>
          )}
          {event.venue && (
            <div className="hero-detail-item">
              <MapPin size={14} className="hero-detail-icon icon-venue" />
              <div>
                <span className="hero-detail-label">Venue</span>
                <span className="hero-detail-value">
                  {event.venue}
                  {event.city ? `, ${event.city}` : ''}
                  {event.state ? `, ${event.state}` : ''}
                </span>
              </div>
            </div>
          )}
          {(event.speaker_name || event.organizer_name) && (
            <div className="hero-detail-item">
              <User size={14} className="hero-detail-icon icon-organizer" />
              <div>
                <span className="hero-detail-label">{event.speaker_name ? 'Speaker' : 'Organizer'}</span>
                <span className="hero-detail-value">
                  {event.speaker_name 
                    ? `${event.speaker_name}${event.speaker_org ? ` (${event.speaker_org})` : ''}` 
                    : event.organizer_name}
                </span>
              </div>
            </div>
          )}
          {available !== null && (
            <div className="hero-detail-item">
              <Ticket size={14} className="hero-detail-icon icon-tickets" />
              <div>
                <span className="hero-detail-label">Available Tickets</span>
                <span className="hero-detail-value">{available} tickets remaining</span>
              </div>
            </div>
          )}
          {event.organizer_email && (
            <div className="hero-detail-item">
              <Mail size={14} className="hero-detail-icon icon-contact" />
              <div>
                <span className="hero-detail-label">Contact</span>
                <span className="hero-detail-value">{event.organizer_email}</span>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Below Hero: Booking Box (left) + Tabs (right) ── */}
      <div className="event-details-grid">
        {/* ── Left: Booking Box ──────────────────────── */}
        <motion.div
          className="booking-box-wrapper"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="booking-box">
            <h3 className="booking-price">
              {getBoxPrice()}
            </h3>
            {getBoxSubtext() && (
              <p className="booking-subtext">
                {getBoxSubtext()}
              </p>
            )}
            {available !== null && available > 0 && (
              <p className="booking-available">{available} tickets available</p>
            )}

            <button
              className="booking-cta"
              onClick={handleBooking}
              disabled={(isSoldOut && !existingBooking) || isAdminUser || isPureOrganizer || isStaff}
              style={(isAdminUser || isPureOrganizer || isStaff) ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
            >
              {isStaff ? 'Staff Preview' : isPureOrganizer ? 'Organizer Preview' : isAdminUser ? 'Admin Preview' : existingBooking ? 'View E-Ticket' : isSoldOut ? 'Sold Out' : event?.has_seating ? 'Select Seats' : 'Book Now'}
            </button>

            <div className="booking-perks-container" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.25rem' }}>
              <div className="booking-perk-item">
                <div className="perk-icon-wrapper">
                  {isFree ? <Sparkles size={14} /> : <CreditCard size={14} />}
                </div>
                <span>{isFree ? 'Instant free registration' : 'Instant booking confirmation'}</span>
              </div>
              <div className="booking-perk-item">
                <div className="perk-icon-wrapper">
                  <Ticket size={14} />
                </div>
                <span>E-ticket with QR code</span>
              </div>
              {!isFree && (
                <div className="booking-perk-item">
                  <div className="perk-icon-wrapper">
                    <Shield size={14} />
                  </div>
                  <span>Secure payment processing</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Right: About / Rules / Refund Tabs ─────── */}
        <motion.div
          className="event-info"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="event-tabs">
            <div className="tab-buttons">
              <button 
                className={`tab-btn ${activeTab === 0 ? 'active' : ''}`} 
                onClick={() => setActiveTab(0)}
                style={{ position: 'relative', zIndex: 1 }}
              >
                {activeTab === 0 && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    style={{ position: 'absolute', inset: 0, background: '#2c2c2e', borderRadius: '10px', zIndex: -1, boxShadow: '0 2px 10px rgba(0,0,0,0.2)' }}
                    transition={{ type: 'spring', duration: 0.5 }}
                  />
                )}
                About
              </button>
              <button 
                className={`tab-btn ${activeTab === 1 ? 'active' : ''}`} 
                onClick={() => setActiveTab(1)}
                style={{ position: 'relative', zIndex: 1 }}
              >
                {activeTab === 1 && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    style={{ position: 'absolute', inset: 0, background: '#2c2c2e', borderRadius: '10px', zIndex: -1, boxShadow: '0 2px 10px rgba(0,0,0,0.2)' }}
                    transition={{ type: 'spring', duration: 0.5 }}
                  />
                )}
                Rules
              </button>
              {!isFree && (
                <button 
                  className={`tab-btn ${activeTab === 2 ? 'active' : ''}`} 
                  onClick={() => setActiveTab(2)}
                  style={{ position: 'relative', zIndex: 1 }}
                >
                  {activeTab === 2 && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      style={{ position: 'absolute', inset: 0, background: '#2c2c2e', borderRadius: '10px', zIndex: -1, boxShadow: '0 2px 10px rgba(0,0,0,0.2)' }}
                      transition={{ type: 'spring', duration: 0.5 }}
                    />
                  )}
                  Refund Policy
                </button>
              )}
            </div>

            {activeTab === 0 && (
              <div className="tab-box">
                <div className="tab-content">
                  <h3>About This Event</h3>
                  <p className="event-description">{event.description || 'No description provided.'}</p>
                </div>
              </div>
            )}

            {activeTab === 1 && (
              <div className="tab-box">
                <div className="tab-content">
                  <h3>Event Rules & Guidelines</h3>
                  <ul className="rules-list">
                    <li>All attendees must present a valid ticket and ID at entry</li>
                    <li>No outside food or beverages allowed</li>
                    <li>Smoking is only permitted in designated areas</li>
                    <li>No professional cameras or recording equipment</li>
                    <li>Children under 12 must be accompanied by an adult</li>
                    <li>The event organizer reserves the right to refuse entry</li>
                    <li>Follow all staff instructions for your safety</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 2 && !isFree && (
              <div className="tab-box">
                <div className="tab-content">
                  <h3>Refund & Cancellation Policy</h3>
                  {event.refund_policy === '24_hours' ? (
                    <div className="refund-text">
                      <p>
                        Tickets for this event are eligible for a refund if cancelled up to 24 hours prior to the event's start time. Cancellations made within 24 hours of the event will not be accommodated.
                      </p>
                      
                      <p style={{ marginTop: '1.5rem', fontWeight: '700', color: '#fff', marginBottom: '0.5rem' }}>
                        Refund Breakdown
                      </p>
                      <ul className="refund-fee-list">
                        <li><strong>Base Ticket Price:</strong> Refundable (subject to a ₹30 processing penalty)</li>
                        <li><strong>Platform Booking Fee:</strong> Non-refundable</li>
                      </ul>

                      <p style={{ marginTop: '1.5rem', fontWeight: '700', color: '#fff', marginBottom: '0.5rem' }}>
                        General Policies
                      </p>
                      <ul className="refund-fee-list">
                        <li><strong>Processing Timeline:</strong> Approved refunds are processed immediately and will reflect in your original payment method within 5 to 10 business days.</li>
                        <li><strong>Event Cancellation:</strong> In the unlikely event of cancellation by the organizer, a full refund will be automatically issued to all registered participants within 10 business days.</li>
                      </ul>
                    </div>
                  ) : (
                    <div className="refund-text">
                      <p>
                        Tickets for this event are strictly non-refundable. Please ensure your availability prior to completing your purchase, as cancellations will not be eligible for a refund under any circumstances.
                      </p>
                      
                      <p style={{ marginTop: '1.5rem', fontWeight: '700', color: '#fff', marginBottom: '0.5rem' }}>
                        Event Cancellation
                      </p>
                      <ul className="refund-fee-list">
                        <li>In the unlikely event of cancellation by the organizer, a full refund will be automatically issued to all registered participants within 10 business days.</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Book Button (mobile only) */}
          <div className="book-btn-mobile">
            <button
              className="btn btn-primary"
              onClick={handleBooking}
              disabled={isSoldOut && !existingBooking}
              style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
            >
              {existingBooking ? 'View E-Ticket' : isSoldOut ? 'Sold Out' : event?.has_seating ? 'Select Seats' : 'Book Tickets Now'}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Mobile Sticky Booking Dock */}
      <div className="mobile-event-dock hide-desktop cml-dock">
        <button className="cml-back-btn" onClick={() => navigate(-1)} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'rgba(255, 255, 255, 0.05)',
          border: 'none', borderRadius: '30px', padding: '12px 20px', color: '#d4d4d8', fontSize: '1rem', fontWeight: 700, cursor: 'pointer'
        }}>
          <ArrowLeft size={16} color="#d4d4d8" />
          <span>Back</span>
        </button>
        
        <div className="cml-dock-action" style={{ flex: 1, marginLeft: '8px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <button
            className={`cml-book-btn ${((isSoldOut && !existingBooking) || isAdminUser || isPureOrganizer || isStaff) ? 'disabled' : 'primary'}`}
            onClick={handleBooking}
            disabled={(isSoldOut && !existingBooking) || isAdminUser || isPureOrganizer || isStaff}
            style={{
              padding: '12px 24px', borderRadius: '30px', fontSize: '0.95rem', fontWeight: 800,
              border: 'none', cursor: ((isSoldOut && !existingBooking) || isAdminUser || isPureOrganizer || isStaff) ? 'not-allowed' : 'pointer',
              textAlign: 'center',
              background: ((isSoldOut && !existingBooking) || isAdminUser || isPureOrganizer || isStaff) ? 'rgba(255,255,255,0.1)' : '#f4f4f5',
              color: ((isSoldOut && !existingBooking) || isAdminUser || isPureOrganizer || isStaff) ? 'rgba(255,255,255,0.5)' : '#8b5cf6'
            }}
          >
            {isStaff ? 'Staff Preview' : isPureOrganizer ? 'Organizer Preview' : isAdminUser ? 'Admin Preview' : existingBooking ? 'View E-Ticket' : isSoldOut ? 'Sold Out' : event?.has_seating ? 'Select Seats' : 'Book Now'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isPosterModalOpen && (
          <motion.div 
            className="poster-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsPosterModalOpen(false)}
          >
            <button 
              className="poster-modal-close"
              onClick={(e) => {
                e.stopPropagation()
                setIsPosterModalOpen(false)
              }}
            >
              <X size={24} />
            </button>
            <motion.img 
              src={event.banner_url || ''} 
              alt={event.title} 
              className="poster-modal-img"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function InfoItem({ icon, label, value, valueColor }: { icon: React.ReactNode; label: string; value: string; valueColor?: string }) {
  return (
    <div className="info-item">
      <div className="info-icon">{icon}</div>
      <div>
        <strong>{label}</strong>
        <p style={valueColor ? { color: valueColor, fontWeight: 600 } : undefined}>{value}</p>
      </div>
    </div>
  )
}
