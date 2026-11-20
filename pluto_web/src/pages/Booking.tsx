import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { CalendarDays, Clock, MapPin, Building2, Minus, Plus, AlertTriangle, ArrowLeft, Ticket, ShieldCheck, RefreshCw } from 'lucide-react'
import { useEvent, useTicketCounts } from '@/hooks/useEvents'
import { useEventBookings, useCreateFreeBooking, calculatePriceBreakdown, sendBookingNotification, sendOrganizerNotification } from '@/hooks/useBookings'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { formatDate, formatTime, formatPrice, isEventActive } from '@/lib/utils'

import './Booking.css'

export default function Booking() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { openAuthModal } = useUIStore()

  // Data
  const { data: event, isLoading: eventLoading } = useEvent(id)
  const { data: eventBookings } = useEventBookings(id)
  const createFreeBooking = useCreateFreeBooking()

  // Local state
  const [quantity, setQuantity] = useState(1)
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState(false)

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      openAuthModal('login')
    }
  }, [user, openAuthModal])

  // Calculate availability
  const ticketsSold = (eventBookings || []).reduce(
    (sum: number, b: any) => sum + (b.quantity || 1), 0
  )
  const maxTickets = event?.max_tickets || 0
  const availableTickets = maxTickets > 0 ? maxTickets - ticketsSold : Infinity

  // Price calculation
  const ticketPrice = event?.price ?? event?.ticket_price ?? 0
  const { ticketTotal, bookingFee, gstAmount, totalAmount, isFree } = calculatePriceBreakdown(ticketPrice, quantity)

  const isOverLimit = availableTickets !== Infinity && quantity > availableTickets

  const increaseQuantity = useCallback(() => {
    const maxAllowed = availableTickets !== Infinity ? availableTickets + 5 : 100
    if (quantity < maxAllowed) setQuantity(q => q + 1)
  }, [quantity, availableTickets])

  const decreaseQuantity = useCallback(() => {
    if (quantity > 1) setQuantity(q => q - 1)
  }, [quantity])

  // Handle free event registration
  const handleFreeRegistration = async () => {
    if (!user) {
      openAuthModal('login')
      return
    }

    setError('')
    setProcessing(true)

    try {
      const booking = await createFreeBooking.mutateAsync({
        eventId: id!,
        userId: user.id,
        quantity,
      })

      // Send notifications (non-blocking)
      sendBookingNotification({
        userEmail: user.email,
        eventTitle: event!.title,
        eventId: id!,
      })
      if (event?.organizer_email) {
        sendOrganizerNotification({
          organizerEmail: event.organizer_email,
          bookerName: user.name || user.email,
          eventTitle: event.title,
          eventId: id!,
        })
      }

      sessionStorage.setItem('latestBooking', booking.id)
      navigate('/success')
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.')
      setProcessing(false)
    }
  }

  // Handle paid event — store details and navigate to payment
  const handleProceedToPayment = () => {
    if (!user) {
      openAuthModal('login')
      return
    }
    if (isOverLimit) return

    const bookingDetails = {
      eventId: id,
      quantity,
      ticketPrice,
      bookingFee,
      gstAmount,
      totalAmount,
      eventTitle: event?.title,
      organizerEmail: event?.organizer_email,
    }

    sessionStorage.setItem('currentBooking', JSON.stringify(bookingDetails))
    navigate(`/payment/${id}`)
  }

  // ─── Loading ────────────────────────────────────
  if (eventLoading) {
    return (
      <div className="container booking-container">
        <div className="booking-skeleton">
          <div className="skeleton-block" style={{ height: 32, width: '60%', marginBottom: 32 }} />
          <div className="skeleton-block" style={{ height: 200 }} />
          <div className="skeleton-block" style={{ height: 300, marginTop: 24 }} />
        </div>
      </div>
    )
  }

  // ─── Event not found / expired ──────────────────
  if (!event) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '4rem' }}>
        <AlertTriangle size={72} strokeWidth={1} style={{ color: 'var(--primary)', opacity: 0.8 }} />
        <h2 style={{ marginTop: '1rem' }}>Event Not Found</h2>
        <button className="btn btn-primary" onClick={() => navigate('/explore')} style={{ marginTop: '1.5rem' }}>
          <ArrowLeft size={16} /> Back to Explore
        </button>
      </div>
    )
  }

  if (!isEventActive(event)) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '4rem' }}>
        <AlertTriangle size={72} strokeWidth={1} style={{ color: 'var(--danger, #ef4444)', opacity: 0.8 }} />
        <h2 style={{ marginTop: '1rem' }}>Event Has Ended</h2>
        <p style={{ color: 'var(--text-secondary)' }}>This event has ended and can no longer be booked.</p>
        <button className="btn btn-primary" onClick={() => navigate('/explore')} style={{ marginTop: '1.5rem' }}>
          <ArrowLeft size={16} /> Back to Explore
        </button>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>Book Tickets — {event.title} | PLUTO</title>
      </Helmet>

      <div className="container booking-container">
        <motion.div
          className="booking-header"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button className="booking-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          <h1 className="booking-page-title">Complete Your Booking</h1>
        </motion.div>

        {/* ─── Event Summary ──────────────────── */}
        <motion.div
          className="booking-card summary-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="summary-content">
            <div className="summary-icon">
              <Ticket size={24} color="#a78bfa" />
            </div>
            <div className="summary-details">
              <h2 className="summary-title">{event.title}</h2>
              <div className="summary-meta">
                {event.start_date && (
                  <div className="summary-meta-row">
                    <CalendarDays size={13} color="#a1a1aa" />
                    <span>{formatDate(event.start_date)}{event.end_date && event.end_date !== event.start_date ? ` — ${formatDate(event.end_date)}` : ''}</span>
                  </div>
                )}
                {event.time && (
                  <div className="summary-meta-row">
                    <Clock size={13} color="#a1a1aa" />
                    <span>{formatTime(event.time)}</span>
                  </div>
                )}
                {(event.venue || event.college_name) && (
                  <div className="summary-meta-row">
                    <MapPin size={13} color="#a1a1aa" />
                    <span>{event.venue || 'TBA'} {event.college_name ? `• ${event.college_name}` : ''}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ─── Ticket Selection ────────────────── */}
        <motion.div
          className="booking-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="booking-card-title">Select Tickets</h2>

          <div className="ticket-stub">
            <div className="stub-top">
              <div className="stub-top-left">
                <div className="stub-icon">
                  <Ticket size={18} color="#a78bfa" />
                </div>
                <div>
                  <h3 className="stub-label">General Admission</h3>
                  <div className="stub-price">
                    {formatPrice(ticketPrice)} <span className="stub-price-sub">/ ticket</span>
                  </div>
                </div>
              </div>
              {availableTickets !== Infinity && (
                <div className="avail-pill">
                  {Math.max(0, availableTickets)} left
                </div>
              )}
            </div>

            <div className="stub-bottom">
              <span className="qty-label">How many?</span>
              <div className="qty-row">
                <button className={`qty-btn ${quantity <= 1 ? 'qty-btn-off' : ''}`} onClick={decreaseQuantity} disabled={quantity <= 1}>
                  <Minus size={18} color={quantity <= 1 ? '#3f3f46' : '#fff'} />
                </button>
                <div className="qty-bubble">
                  {quantity}
                </div>
                <button className="qty-btn" onClick={increaseQuantity}>
                  <Plus size={18} color="#fff" />
                </button>
              </div>
            </div>

            {isOverLimit && (
              <div className="warn-row">
                <AlertTriangle size={14} color="#ef4444" />
                <span>Cannot book more than available tickets</span>
              </div>
            )}
          </div>

          {/* ─── Price Breakdown ────────────────── */}
          {!isFree && (
            <div className="price-breakdown">
              <h3 className="price-breakdown-title">Price Breakdown</h3>
              <div className="price-row">
                <span>Ticket Price ({quantity}x)</span>
                <span className="price-value">{formatPrice(ticketTotal)}</span>
              </div>
              <div className="price-row">
                <span>Booking Fee (2.5%)</span>
                <span className="price-value">{formatPrice(bookingFee)}</span>
              </div>
              <div className="price-row price-row-total">
                <span>Total Amount</span>
                <span className="price-total-value">{formatPrice(totalAmount)}</span>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="booking-error">
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          {/* Desktop Action Button (hidden on mobile) */}
          <button
            className="btn btn-primary booking-submit-btn hide-mobile"
            onClick={isFree ? handleFreeRegistration : handleProceedToPayment}
            disabled={isOverLimit || processing}
          >
            {processing ? (
              <><RefreshCw size={18} className="spin" /> Registering...</>
            ) : isFree ? (
              <><Ticket size={18} /> Register Now</>
            ) : (
              <><ShieldCheck size={18} /> Proceed to Payment — {formatPrice(totalAmount)}</>
            )}
          </button>
        </motion.div>
      </div>

      {/* ─── Mobile Sticky Booking Dock ────────────────── */}
      <div className="mobile-booking-dock hide-desktop">
        <div className="dock-price-col">
          <span className="dock-price-label">{isFree ? 'Free Event' : 'Total'}</span>
          <span className="dock-price-value">{formatPrice(totalAmount)}</span>
        </div>
        <button
          className={`dock-submit-btn ${isOverLimit || processing ? 'disabled' : ''}`}
          onClick={isFree ? handleFreeRegistration : handleProceedToPayment}
          disabled={isOverLimit || processing}
        >
          {processing ? (
            <RefreshCw size={18} className="spin" />
          ) : isFree ? (
            <><Ticket size={18} /> Register Now</>
          ) : (
            <><ShieldCheck size={18} /> Pay {formatPrice(totalAmount)}</>
          )}
        </button>
      </div>

      
    </>
  )
}
