import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useEvent } from '@/hooks/useEvents'
import { bookingService } from '@/services/bookingService'
import { PageLoader } from '@/components/ui/PageLoader'
import { isEventActive } from '@/lib/utils'
import { X } from 'lucide-react'
import './SeatStyles.css'

interface SeatSelection {
  id: string
  label: string
  price: number
  type: 'seat' | 'table-seat'
  tableId?: string
}

export default function SeatSelection() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const { data: event, isLoading: eventLoading } = useEvent(id)
  const [bookedSeatIds, setBookedSeatIds] = useState<string[]>([])
  const [loadingBookings, setLoadingBookings] = useState(true)
  const [selectedSeats, setSelectedSeats] = useState<SeatSelection[]>([])

  const BOOKING_FEE_PERCENT = 0.025
  const GST_PERCENT = 0.18

  useEffect(() => {
    async function loadBookings() {
      try {
        if (!id) return
        
        const bookingsData = await bookingService.getBookingsByEvent(id)

        const ids: string[] = []
        bookingsData.forEach((b: any) => {
          // Ignore cancelled or refunded bookings so seats become available again
          if (b.bookingStatus === 'cancelled' || b.bookingStatus === 'refunded') return;

          if (b.selectedSeats) {
            b.selectedSeats.forEach((seat: any) => {
              ids.push(seat.id || seat) // handle both object and string formats just in case
            })
          }
        })

        setBookedSeatIds(ids)
      } catch (err) {
        console.error('Failed to load bookings', err)
      } finally {
        setLoadingBookings(false)
      }
    }
    loadBookings()
  }, [id])

  useEffect(() => {
    if (eventLoading) return
    if (!event || (!(event as any).has_seating && !(event as any).hasSeating)) {
      navigate(`/book/${id}`)
      return
    }

    if (!isEventActive(event)) {
      alert('This event has ended and can no longer be booked.')
      navigate('/events')
      return
    }
  }, [event, eventLoading, id, navigate])

  const toggleSeat = (seat: any) => {
    if (bookedSeatIds.includes(seat.id)) return

    setSelectedSeats(prev => {
      const exists = prev.find(s => s.id === seat.id)
      if (exists) return prev.filter(s => s.id !== seat.id)
      return [...prev, { id: seat.id, label: seat.label, price: seat.price, type: 'seat' }]
    })
  }

  const toggleTableSeat = (seat: any, tableId: string, tablePrice: number) => {
    if (bookedSeatIds.includes(seat.id)) return

    setSelectedSeats(prev => {
      const exists = prev.find(s => s.id === seat.id)
      if (exists) return prev.filter(s => s.id !== seat.id)
      return [...prev, { id: seat.id, label: seat.label, price: tablePrice, type: 'table-seat', tableId }]
    })
  }

  const removeSeat = (id: string) => {
    setSelectedSeats(prev => prev.filter(s => s.id !== id))
  }

  const subtotal = selectedSeats.reduce((sum, s) => sum + s.price, 0)
  const bookingFee = Number((subtotal * 0.025).toFixed(2))
  // will implement after it will come in production
  // const gst = Math.round(bookingFee * GST_PERCENT)
  const gst = 0
  const total = Number((subtotal + bookingFee).toFixed(2))

  const handleProceed = () => {
    if (selectedSeats.length === 0) return

    const bookingDetails = {
      eventId: id,
      selectedSeats,
      quantity: selectedSeats.length,
      ticketPrice: subtotal,
      bookingFee,
      gstAmount: gst,
      totalAmount: total,
      eventTitle: event?.title || '',
      organizerEmail: (event as any)?.organizer_email || '',
    }

    sessionStorage.setItem('currentBooking', JSON.stringify(bookingDetails))
    navigate(`/payment/${id}`)
  }

  if (eventLoading || loadingBookings || !event) return <PageLoader />

  const layout = (event.seat_layout as any) || { stagePosition: 'top', seats: [], tables: [] }

  return (
    <div className="container" style={{ maxWidth: '1400px', padding: '2rem 2rem', paddingBottom: '6rem' }}>
      <h1 style={{ marginBottom: '0.5rem', fontSize: '2.5rem', textAlign: 'center' }}>Select Your Seats</h1>
      <p style={{ color: 'var(--gray-light)', marginBottom: '2rem', textAlign: 'center' }}>{event.title}</p>

      {/* Legend */}
      <div className="legend" style={{ justifyContent: 'center' }}>
        <div className="legend-item"><div className="legend-box available"></div><span>Available</span></div>
        <div className="legend-item"><div className="legend-box selected"></div><span>Selected</span></div>
        <div className="legend-item"><div className="legend-box booked"></div><span>Booked</span></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem', alignItems: 'start' }}>
        {/* Layout */}
        <div className="seat-canvas-wrapper" style={{ minHeight: '600px' }}>
          <div className="seat-canvas" style={{ cursor: 'default' }}>
            <div className="stage" style={{
              width: ['top', 'bottom'].includes(layout.stagePosition) ? 400 : 100,
              height: ['top', 'bottom'].includes(layout.stagePosition) ? 60 : 300,
              left: layout.stagePosition === 'top' || layout.stagePosition === 'bottom' ? 200 : layout.stagePosition === 'left' ? 20 : 'calc(100% - 120px)',
              top: layout.stagePosition === 'top' ? 20 : layout.stagePosition === 'bottom' ? 520 : 150,
            }}>
              STAGE
            </div>

            {layout.seats?.map((seat: any) => {
              const isBooked = bookedSeatIds.includes(seat.id)
              const isSelected = selectedSeats.some(s => s.id === seat.id)
              return (
                <div
                  key={seat.id}
                  className={`seat ${isBooked ? 'booked' : ''} ${isSelected ? 'user-selected' : ''}`}
                  style={{ left: seat.x, top: seat.y, cursor: isBooked ? 'not-allowed' : 'pointer' }}
                  onClick={() => toggleSeat(seat)}
                >
                  {seat.label}
                </div>
              )
            })}

            {layout.tables?.map((table: any) => (
              <div key={table.id} className="table-group" style={{ left: table.x, top: table.y }}>
                <div className="table-center">{table.label}</div>
                {table.seats.map((seat: any, index: number) => {
                  const angle = (2 * Math.PI * index) / table.seats.length
                  const radius = 60
                  const isBooked = bookedSeatIds.includes(seat.id)
                  const isSelected = selectedSeats.some(s => s.id === seat.id)
                  return (
                    <div
                      key={seat.id}
                      className={`table-seat ${isBooked ? 'booked' : ''} ${isSelected ? 'user-selected' : ''}`}
                      style={{
                        left: 40 + radius * Math.cos(angle) - 17.5,
                        top: 40 + radius * Math.sin(angle) - 17.5,
                        cursor: isBooked ? 'not-allowed' : 'pointer'
                      }}
                      onClick={() => toggleTableSeat(seat, table.id, table.price)}
                    >
                      {seat.label.split('-')[1]}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Selected Seats Panel */}
        <div className="selected-seats-panel">
          <h3>Selected Seats ({selectedSeats.length})</h3>
          
          <div style={{ minHeight: '150px', flex: 1, overflowY: 'auto' }}>
            {selectedSeats.length === 0 ? (
              <p style={{ color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center', padding: '2rem 0' }}>
                No seats selected yet
              </p>
            ) : (
              selectedSeats.map(seat => (
                <div key={seat.id} className="selected-seat-item">
                  <div>
                    <strong>{seat.label}</strong><br/>
                    <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem' }}>₹{seat.price}</span>
                  </div>
                  <button onClick={() => removeSeat(seat.id)}><X size={16} /></button>
                </div>
              ))
            )}
          </div>

          <div className="price-summary">
            <div className="price-row"><span>Subtotal</span><span>₹{subtotal}</span></div>
            <div className="price-row"><span>Booking Fee (2.5%)</span><span>₹{bookingFee}</span></div>
            {/* will implement after it will come in production */}
            {/* <div className="price-row"><span>GST (18% on fees)</span><span>₹{gst}</span></div> */}
            <div className="price-row total"><span>Total</span><span>₹{total}</span></div>
          </div>

          <button
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '2rem', padding: '1rem' }}
            disabled={selectedSeats.length === 0}
            onClick={handleProceed}
          >
            Proceed to Payment
          </button>
        </div>
      </div>
    </div>
  )
}
