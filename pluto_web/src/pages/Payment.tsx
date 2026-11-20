import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { ShieldCheck, AlertTriangle, ArrowLeft, Loader2, Lock, Ticket, CalendarDays, MapPin, Zap, QrCode, Users } from 'lucide-react'
import { useEvent } from '@/hooks/useEvents'
import { useCompetition } from '@/hooks/useCompetitions'
import { useMyBookings, sendBookingNotification, sendOrganizerNotification, type BookingFrontend } from '@/hooks/useBookings'
import { useAuthStore } from '@/stores/authStore'
import { formatDate, formatPrice } from '@/lib/utils'
import { useQueryClient } from '@tanstack/react-query'
import { competitionRegistrationService } from '@/services/competitionRegistrationService'
import { supabase } from '@/lib/supabase'
import { LegalModal } from '@/components/ui/LegalModal'

import './Payment.css'

// Razorpay key — fetched from backend at runtime, hardcoded fallback for dev
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_SL6Az6zRB5hRc9'

// Backend API base — proxied via Vite in dev, direct in production
const API_BASE = import.meta.env.VITE_API_BASE || ''

interface BookingDetails {
  eventId: string
  quantity: number
  ticketPrice: number
  bookingFee: number
  gstAmount: number
  totalAmount: number
  eventTitle?: string
  organizerEmail?: string
  selectedSeats?: unknown[]
}

export default function Payment() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const { data: event } = useEvent(id)
  const { data: myBookings } = useMyBookings()
  const createOrder = { mutateAsync: async (data: any) => {
    // Call backend to create Razorpay order
    const res = await fetch(`${API_BASE}/api/payment/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}))
      throw new Error(errBody.error || 'Failed to create payment order')
    }
    return res.json()
  }}
  const verifyPayment = { mutateAsync: async (data: any) => {
    const res = await fetch(`${API_BASE}/api/payment/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}))
      throw new Error(errBody.error || 'Payment verification failed')
    }
    return res.json()
  }}

  const verifySignatureOnly = { mutateAsync: async (data: any) => {
    const res = await fetch(`${API_BASE}/api/payment/verify-signature-only`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}))
      throw new Error(errBody.error || 'Payment verification failed')
    }
    return res.json()
  }}

const location = useLocation()
  const compState = location.state as {
    isCompetition?: boolean
    competitionId?: string
    competitionTitle?: string
    amount?: number
    entryFee?: number
    platformFee?: number
    registrationType?: 'individual' | 'team'
    teamId?: string
    teamName?: string
    teamInviteCode?: string
  } | null

  const isCompetition = compState?.isCompetition
  const compAmount = compState?.amount || 0
  const competitionId = compState?.competitionId
  const { data: compEvent } = useCompetition(isCompetition ? (competitionId || '') : undefined)

  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null)
  const [status, setStatus] = useState<{ type: 'error' | 'warning' | 'success'; message: string } | null>(null)
  const [phase, setPhase] = useState<'form' | 'processing' | 'verifying'>('form')
  const [activeFeature, setActiveFeature] = useState<number | null>(0)
  const [legalModalType, setLegalModalType] = useState<'terms' | 'privacy' | 'refund' | null>(null)

  const features = [
    { icon: Zap, label: 'Instant booking confirmation' },
    { icon: Lock, label: 'Secure payment processing' },
  ]
  if (!isCompetition) {
    features.splice(1, 0, { icon: QrCode, label: 'E-ticket with QR code' })
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveFeature((prev) => (prev !== null ? (prev + 1) % features.length : 0))
    }, 2500)
    return () => clearInterval(timer)
  }, [features.length])

  // Load booking details from session storage
  useEffect(() => {
    if (isCompetition) return
    const stored = sessionStorage.getItem('currentBooking')
    if (!stored) {
      navigate('/explore')
      return
    }
    try {
      setBookingDetails(JSON.parse(stored))
    } catch {
      navigate('/explore')
    }
  }, [navigate, isCompetition])

  // Check for duplicate booking
  const [hasExistingBooking, setHasExistingBooking] = useState(false)
  useEffect(() => {
    const checkDuplicate = async () => {
      if (isCompetition && competitionId && user?.id) {
        const { data: existing } = await supabase
          .from('competition_registrations').select('id')
          .eq('competition_id', competitionId)
          .eq('user_id', user.id)
          .in('status', ['registered', 'approved'])
          .maybeSingle()
        if (existing) {
          setHasExistingBooking(true)
          setStatus({
            type: 'warning',
            message: 'You have already registered for this competition! Redirecting...',
          })
          setTimeout(() => navigate('/dashboard'), 3000)
        }
      } else if (!isCompetition && bookingDetails && user?.id) {
        const isDuplicate = myBookings?.some(
          (b: BookingFrontend) => b.eventId === bookingDetails.eventId && b.bookingStatus === 'confirmed'
        )
        if (isDuplicate) {
          setHasExistingBooking(true)
          setStatus({
            type: 'warning',
            message: 'You have already booked this event! Redirecting to dashboard...',
          })
          setTimeout(() => navigate('/dashboard'), 3000)
        }
      }
    }
    checkDuplicate()
  }, [isCompetition, competitionId, user, myBookings, bookingDetails, navigate])

  // Load Razorpay SDK
  useEffect(() => {
    if (document.getElementById('razorpay-sdk')) return
    const script = document.createElement('script')
    script.id = 'razorpay-sdk'
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)
  }, [])

  const processPayment = useCallback(async () => {
    if ((!bookingDetails && !isCompetition) || !user || (!event && !compEvent)) return
    if (hasExistingBooking) return

    setStatus(null)
    setPhase('processing')

    try {
      // Step 1: Create Razorpay order via backend
      const orderData = await createOrder.mutateAsync({
        amount: isCompetition ? compAmount : bookingDetails!.totalAmount,
        eventId: isCompetition ? competitionId : bookingDetails!.eventId,
        userEmail: user.email,
        selectedSeats: isCompetition ? undefined : bookingDetails!.selectedSeats,
        quantity: isCompetition ? 1 : (bookingDetails!.quantity || 1),
      })

      // Step 2: Open Razorpay checkout modal
      const Razorpay = (window as any).Razorpay

      if (!Razorpay) {
        throw new Error('Payment gateway failed to load. Please refresh and try again.')
      }

      const activeEvent = isCompetition ? compEvent : event
      const options = {
        key: orderData.key_id || RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'Pluto Campus',
        description: activeEvent?.title || compState?.competitionTitle,
        image: '/p.png',
        order_id: orderData.order_id,
        prefill: {
          name: user.name || '',
          email: user.email || '',
        },
        notes: {
          event_id: isCompetition ? competitionId : bookingDetails!.eventId,
          platform: 'PLUTO',
        },
        theme: {
          color: '#6366f1',
        },
        handler: async (response: any) => {
          // Step 3: On success — verify signature
          await handleVerify(response, orderData.order_id)
        },
        modal: {
          ondismiss: () => {
            setPhase('form')
            setStatus({
              type: 'warning',
              message: 'Payment cancelled. You can try again.',
            })
          },
        },
      }

      const rzp = new Razorpay(options)

      rzp.on('payment.failed', (response: any) => {
        setPhase('form')
        setStatus({
          type: 'error',
          message: response.error?.description || 'Payment failed. Please try again.',
        })
      })

      rzp.open()
    } catch (err: any) {
      setPhase('form')
      setStatus({
        type: 'error',
        message: err.message || 'Something went wrong. Please try again.',
      })
    }
  }, [bookingDetails, user, event, compEvent, hasExistingBooking, createOrder, isCompetition, compAmount, competitionId, compState])

  const handleVerify = async (response: any, orderId: string) => {
    setPhase('verifying')

    try {
      if (isCompetition) {
        const verifyData = await verifySignatureOnly.mutateAsync({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        })

        if (!verifyData.success) {
          throw new Error(verifyData.error || 'Payment signature verification failed.')
        }

        const paymentData = {
          entryFee: compState?.entryFee,
          paymentMethod: 'razorpay',
          paymentReference: response.razorpay_payment_id,
        }

        let resultData: any = {}
        const registrationType = compState?.registrationType
        const teamName = compState?.teamName
        const teamInviteCode = compState?.teamInviteCode
        const teamId = compState?.teamId

        try {
          if (registrationType === 'individual') {
            await competitionRegistrationService.registerIndividual(competitionId!, paymentData)
          } else if (registrationType === 'team') {
            if (teamId) {
              await competitionRegistrationService.finalizeTeamRegistration(teamId, paymentData)
              resultData = { teamName: teamName || 'Your Team', teamId: teamId }
            } else if (teamName) {
              const res = await competitionRegistrationService.createTeamAndRegister(competitionId!, teamName)
              resultData = { teamName: res.team.name, inviteCode: res.team.invite_code, teamId: res.team.id }
            } else if (teamInviteCode) {
              await competitionRegistrationService.joinTeamByCode(competitionId!, teamInviteCode)
            }
          }
        } catch (regError: any) {
          console.error('Registration DB error (payment successful):', regError)
        }

        queryClient.invalidateQueries({ queryKey: ['comp-registrations'] })
        queryClient.invalidateQueries({ queryKey: ['comp-teams'] })

        navigate(`/competition/${competitionId}/registration-success?mode=${registrationType === 'individual' ? 'individual' : 'team-created'}`, {
          state: {
            competitionId,
            competitionTitle: compState?.competitionTitle,
            registrationType,
            teamName: resultData.teamName || teamName,
            inviteCode: resultData.inviteCode || teamInviteCode,
            teamId: resultData.teamId || teamId,
            competitionBanner: compEvent?.banner_url,
          }
        })
      } else {
        const verifyData = await verifyPayment.mutateAsync({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          eventId: bookingDetails!.eventId,
          userEmail: user!.email,
          quantity: bookingDetails!.quantity || 1,
          ticketPrice: bookingDetails!.ticketPrice || 0,
          bookingFee: bookingDetails!.bookingFee || 0,
          gstAmount: bookingDetails!.gstAmount || 0,
          totalAmount: bookingDetails!.totalAmount || 0,
          selectedSeats: bookingDetails!.selectedSeats as string[] | undefined,
          paymentMethod: 'razorpay',
        })

        if (!verifyData.success) {
          if (verifyData.error === 'duplicate_booking') {
            navigate('/dashboard')
            return
          }
          throw new Error(verifyData.error || 'Payment verification failed.')
        }

        // Success! Send notifications
        sendBookingNotification({
          userEmail: user!.email,
          eventTitle: bookingDetails!.eventTitle || 'Event',
          eventId: bookingDetails!.eventId,
        })
        if (bookingDetails!.organizerEmail) {
          sendOrganizerNotification({
            organizerEmail: bookingDetails!.organizerEmail,
            bookerName: user!.name || user!.email,
            eventTitle: bookingDetails!.eventTitle || 'Event',
            eventId: bookingDetails!.eventId,
          })
        }

        queryClient.invalidateQueries({ queryKey: ['bookings'] })
        sessionStorage.setItem('latestBooking', verifyData.booking_id)
        sessionStorage.removeItem('currentBooking')
        navigate('/success')
      }
    } catch (err: any) {
      setPhase('form')
      setStatus({
        type: 'error',
        message: `Payment received but verification pending. Payment ID: ${response.razorpay_payment_id}. Contact support if needed.`,
      })
    }
  }

  // ─── Render ─────────────────────────────────────

  if (!bookingDetails && !isCompetition) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '4rem' }}>
        <Loader2 size={48} className="spin" style={{ color: 'var(--primary)' }} />
      </div>
    )
  }

  const activeEvent = isCompetition ? compEvent : event
  const activeTitle = isCompetition ? (compEvent?.title || compState?.competitionTitle) : (event?.title || bookingDetails?.eventTitle)
  const displayAmount = isCompetition ? compAmount : bookingDetails!.totalAmount

  return (
    <>
      <Helmet>
        <title>Payment — {activeTitle || 'PLUTO'}</title>
      </Helmet>

      <div className="container payment-container">
        <motion.div
          className="payment-header"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button className="payment-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          <h1 className="payment-page-title">Complete Payment</h1>
        </motion.div>

        {/* ─── Processing / Verifying State (Overlay) ─── */}
        {phase !== 'form' && (
          <motion.div
            className="payment-processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Loader2 size={64} className="spin" style={{ color: '#a78bfa', marginBottom: '1.25rem' }} />
            <h3>{phase === 'verifying' ? 'Verifying Payment...' : 'Processing Payment...'}</h3>
            <p>
              {phase === 'verifying'
                ? 'Please do not close this screen.'
                : 'Waiting for secure gateway...'}
            </p>
          </motion.div>
        )}

        {/* ─── Payment Form ──────────────────── */}
        <motion.div
          className="payment-form-wrapper"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: phase === 'form' ? 'block' : 'none' }}
        >
          {/* Status Messages */}
          {status && (
            <div className={`payment-status payment-status-${status.type}`}>
              <AlertTriangle size={16} /> {status.message}
            </div>
          )}

          {/* Event Details Card */}
          <div className="payment-card">
            <div className="event-details-row">
              <div className="event-details-icon">
                <Ticket size={24} color="#a78bfa" />
              </div>
              <div className="event-details-info">
                <h3>{activeTitle}</h3>
                {activeEvent?.start_date && (
                  <div className="event-details-meta">
                    <CalendarDays size={14} color="#a1a1aa" />
                    <span>{formatDate(activeEvent.start_date)}</span>
                  </div>
                )}
                {activeEvent?.venue && (
                  <div className="event-details-meta">
                    <MapPin size={14} color="#a1a1aa" />
                    <span>{activeEvent.venue}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Payment Invoice Card */}
          <div className="payment-card">
            <h2 className="payment-invoice-title">Payment Invoice</h2>

            <div className="order-summary-box">
              {/* Tickets — seat layout vs general admission */}
              {!isCompetition && bookingDetails && (
                <div className="order-tickets-section">
                  <span className="order-tickets-label">Tickets ({bookingDetails.quantity})</span>
                  <div className="invoice-item-box">
                    {bookingDetails.selectedSeats && (bookingDetails.selectedSeats as any[]).length > 0 ? (
                      <div className="order-seat-list">
                        {(bookingDetails.selectedSeats as any[]).map((seat: any, i: number) => (
                          <div key={seat.id || i} className="order-seat-row">
                            <span>{seat.label}</span>
                            <span>{formatPrice(seat.price)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="order-row" style={{ padding: 0 }}>
                        <span>{bookingDetails.quantity} × General Admission</span>
                        <strong>{formatPrice(bookingDetails.ticketPrice * bookingDetails.quantity)}</strong>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Competition Registration Fee */}
              {isCompetition && compState && (() => {
                const amount = compState.amount || 0
                const entryFee = compState.entryFee || 0
                const totalEntryFee = amount - (compState.platformFee || 0)
                const multiplier = entryFee > 0 ? Math.round(totalEntryFee / entryFee) : 1
                return (
                  <div className="order-tickets-section">
                    <span className="order-tickets-label">Registration</span>
                    <div className="invoice-item-box">
                      <div className="order-row" style={{ padding: 0 }}>
                        <span>Entry Fee {multiplier > 1 ? `(x${multiplier})` : ''}</span>
                        <strong>{formatPrice(totalEntryFee)}</strong>
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* Fee breakdown */}
              {!isCompetition && bookingDetails && bookingDetails.bookingFee > 0 && (
                <div className="invoice-item-box" style={{ marginTop: '6px' }}>
                  <div className="order-row" style={{ padding: 0 }}>
                    <span>Booking Fee</span>
                    <strong>{formatPrice(bookingDetails.bookingFee)}</strong>
                  </div>
                </div>
              )}

              {isCompetition && compState && (compState.platformFee || 0) > 0 && (
                <div className="invoice-item-box" style={{ marginTop: '6px' }}>
                  <div className="order-row" style={{ padding: 0 }}>
                    <span>Platform Fee</span>
                    <strong>{formatPrice(compState.platformFee || 0)}</strong>
                  </div>
                </div>
              )}
              <div className="order-row order-row-total">
                <span>Total Amount</span>
                <strong className="order-total-amount">{formatPrice(displayAmount)}</strong>
              </div>
            </div>
          </div>

          {/* Trust Features */}
          <div className="trust-features-section">
            <div className="trust-features-icons">
              {features.map((F, i) => (
                <button
                  key={i}
                  className={`trust-feature-btn ${activeFeature === i ? 'active' : ''}`}
                  onClick={() => setActiveFeature(i)}
                >
                  <F.icon size={22} color={activeFeature === i ? '#ffffff' : '#71717a'} />
                </button>
              ))}
            </div>
            <div className="trust-feature-label">
              {activeFeature !== null && features[activeFeature] && (
                <span>{features[activeFeature].label}</span>
              )}
            </div>
          </div>

          {/* Terms */}
          <div className="payment-policies-section">
            <p>By proceeding, you agree to Pluto's policies:</p>
            <div className="payment-policies-links">
              <button onClick={() => setLegalModalType('terms')}>Terms</button>
              <span>•</span>
              <button onClick={() => setLegalModalType('refund')}>Refund Policy</button>
              <span>•</span>
              <button onClick={() => setLegalModalType('privacy')}>Privacy</button>
            </div>
          </div>

          <button
            className="btn btn-primary payment-pay-btn hide-mobile"
            onClick={processPayment}
            disabled={!!hasExistingBooking}
          >
            <ShieldCheck size={18} /> Pay {formatPrice(displayAmount)}
          </button>
        </motion.div>
      </div>

      {/* ─── Mobile Sticky Payment Dock ────────────────── */}
      {phase === 'form' && (
        <div className="mobile-payment-dock hide-desktop">
          <div className="dock-price-col">
            <span className="dock-price-label">Total Amount</span>
            <span className="dock-price-value">{formatPrice(displayAmount)}</span>
          </div>
          <button
            className={`dock-submit-btn ${hasExistingBooking ? 'disabled' : ''}`}
            onClick={processPayment}
            disabled={!!hasExistingBooking}
          >
            <ShieldCheck size={18} /> Pay Now
          </button>
        </div>
      )}

      {/* ─── Modals ────────────────── */}
      <LegalModal
        type={legalModalType}
        onClose={() => setLegalModalType(null)}
      />
    </>
  )
}
