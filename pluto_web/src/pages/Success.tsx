import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { CalendarDays, MapPin, Ticket, Download, LayoutDashboard, Mail, Hash, Calendar, Type } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useMyBookings, type BookingFrontend } from '@/hooks/useBookings'
import { useAuthStore } from '@/stores/authStore'
import { formatDate, formatPrice } from '@/lib/utils'

import './Success.css'

export default function Success() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { data: bookings } = useMyBookings()
  const [booking, setBooking] = useState<BookingFrontend | null>(null)

  const bookingId = sessionStorage.getItem('latestBooking')

  useEffect(() => {
    if (!bookingId) {
      navigate('/explore')
      return
    }
    if (bookings) {
      const found = bookings.find((b) => b.id === bookingId)
      if (found) setBooking(found)
    }
  }, [bookingId, bookings, navigate])

  const handleDownload = () => {
    // Future: generate PDF ticket
    alert('Your ticket PDF will be available in the next update!')
  }

  const isFree = booking ? booking.totalAmount === 0 : false

  return (
    <>
      <Helmet>
        <title>Booking Confirmed | PLUTO</title>
      </Helmet>

      <div className="booking-page-wrap success-page-wrap">
        {/* Mobile Header (Hidden on Desktop) */}
        <div className="success-mobile-header hide-desktop">
          <button className="success-back-btn" onClick={() => navigate('/explore')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <h2>Booking Confirmation</h2>
          <div style={{ width: 40 }} />
        </div>

        <div className="container success-main-container" style={{ maxWidth: '750px' }}>
          <div className="success-container-box">
            <div className="success-container">
              <div className="success-content-wrapper">
                {/* 1. Animated Checkmark */}
                <div className="success-section-checkmark">
                  <div className="success-icon-wrap">
                    <div className="success-glow-ring" />
                    <div className="success-3d-circle">
                      <svg viewBox="0 0 52 52" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M10 27 L20 38 L42 14"
                          stroke="#ffffff"
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          fill="none"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* 2. Title */}
                <div className="success-section-title">
                  <h1 className="success-title" style={{ marginBottom: '1rem', color: 'var(--success)' }}>
                    Booking Confirmed!
                  </h1>
                  <p style={{ fontSize: '1.1rem', color: 'var(--gray)', marginBottom: '2rem' }}>
                    Your tickets have been successfully booked
                  </p>
                </div>

                {/* 3. Booking Details (Desktop Order 3, Mobile Order 6) */}
                <div className="success-section-details">
                  {booking && (
                    <div className="success-details-card">
                      <h3 className="success-details-title" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                        Booking Details
                      </h3>
                      <div className="success-detail-grid">
                        <div className="success-detail-box">
                          <span><Hash size={14} /> Booking ID</span>
                          <strong className="booking-id-text">{booking.id.toUpperCase()}</strong>
                        </div>
                        {booking.eventTitle && (
                          <div className="success-detail-box">
                            <span><Type size={14} /> Event</span>
                            <strong>{booking.eventTitle}</strong>
                          </div>
                        )}
                        {booking.eventDate && (
                          <div className="success-detail-box">
                            <span><Calendar size={14} /> Date</span>
                            <strong>
                              {booking.endDate && booking.eventDate !== booking.endDate
                                ? `${formatDate(booking.eventDate)} - ${formatDate(booking.endDate)}`
                                : formatDate(booking.eventDate)}
                            </strong>
                          </div>
                        )}
                        {(booking.venue || booking.city) && (
                          <div className="success-detail-box">
                            <span><MapPin size={14} /> Venue</span>
                            <strong>{[booking.venue, booking.city].filter(Boolean).join(', ')}</strong>
                          </div>
                        )}
                        {booking.selectedSeats && booking.selectedSeats.length > 0 ? (
                          <div className="success-seats-container">
                            <div className="success-detail-box-header">
                              <span><Ticket size={14} /> Selected Seats</span>
                            </div>
                            <div className="seats-grid">
                              {booking.selectedSeats.map((seat: any, index: number) => {
                                const seatLabel = typeof seat === 'string' ? seat : (seat?.label || seat?.id || `Seat ${index + 1}`)
                                const seatKey = typeof seat === 'string' ? seat : (seat?.id || index)
                                return <div key={seatKey} className="seat-badge">{seatLabel}</div>
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="success-detail-box full-width">
                            <span><Ticket size={14} /> Tickets</span>
                            <strong>{booking.quantity} x General Admission</strong>
                          </div>
                        )}
                        <div className="success-detail-box full-width success-detail-total">
                          <span>{isFree ? 'Access' : 'Total Paid'}</span>
                          <strong className={isFree ? 'text-success' : 'text-primary'}>
                            {isFree ? 'Free Ticket' : formatPrice(booking.totalAmount)}
                          </strong>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. QR Code Placeholder (Desktop Order 4, Mobile Order 3) */}
                <div className="success-section-qr">
                  <h3 className="qr-header" style={{ marginBottom: '1rem', color: 'var(--white)' }}>Your E-Ticket</h3>
                  <div className="qr-code qr-container" style={{ marginBottom: '0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div className="qr-box" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center', background: 'var(--white)', padding: '16px', borderRadius: '12px' }}>
                        <QRCodeSVG value={bookingId || ''} size={160} level="H" />
                      </div>
                      <div className="qr-label" style={{ color: 'var(--white)', fontWeight: 600, fontSize: '1.2rem' }}>Scan at Entry</div>
                      {bookingId && (
                        <div className="qr-id" style={{ fontSize: '0.75rem', marginTop: '0.5rem', fontFamily: 'monospace', color: 'var(--gray)', wordBreak: 'break-all', maxWidth: '250px', margin: '0.5rem auto 0' }}>
                          {bookingId.toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="qr-desc" style={{ color: 'var(--gray)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                    Show this QR code at the venue entrance
                  </p>
                </div>

                {/* 5. Action Buttons (Desktop Order 5, Mobile Order 4) */}
                <div className="success-section-actions">
                  <div className="action-row success-actions" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button className="btn btn-primary" onClick={handleDownload} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Download size={16} /> Download Ticket
                    </button>
                    <button className="btn btn-outline" onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <LayoutDashboard size={16} /> Go to Dashboard
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
