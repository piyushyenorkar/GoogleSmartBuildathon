/**
 * bookingService.ts — PLUTO
 * Full 1:1 port of bookingService.js
 * Handles all booking operations via Supabase.
 */

import { supabase } from '@/lib/supabase'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BookingFrontend {
  id: string
  eventId: string
  eventTitle: string
  eventDate: string
  eventTime: string
  endDate: string
  endTime: string
  venue: string
  city: string
  eventBannerUrl: string
  eventCategory: string
  userEmail: string
  userName: string
  quantity: number
  ticketPrice: number
  bookingFee: number
  gstAmount: number
  totalAmount: number
  bookingDate: string
  status: string
  bookingStatus: string
  refundPolicy: string
  selectedSeats: string[] | null
  paymentMethod: string | null
  paymentReference: string | null
}

export interface RefundEligibility {
  eligible: boolean
  reason: string
  deadlineHours?: number
  eventTitle?: string
  refundBreakdown?: {
    originalAmount: number
    ticketPrice: number
    bookingFee: number
    cancellationPenalty: number
    totalDeductions: number
    refundAmount: number
  }
}

export interface RefundResult {
  success: boolean
  refundId?: string
  refundAmount?: number
  cancellationFee?: number
  message?: string
  error?: string
}

export interface BookingCreateInput {
  eventId: string
  quantity?: number
  ticketPrice?: number
  bookingFee?: number
  gstAmount?: number
  totalAmount?: number
  selectedSeats?: string[] | null
  status?: string
  paymentMethod?: string
  paymentReference?: string | null
}

// ─── Internal Helpers ────────────────────────────────────────────────────────

let _cachedUserId: string | null = null

async function _getUserId(): Promise<string | null> {
  if (_cachedUserId) return _cachedUserId

  // Try zustand persisted store
  try {
    const storeData = JSON.parse(localStorage.getItem('pluto-auth') || '{}')
    const email = storeData?.state?.user?.email
    if (email) {
      const { data: userRow } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle()
      if (userRow?.id) {
        _cachedUserId = userRow.id
        return _cachedUserId
      }
    }
  } catch { /* */ }

  // Fallback: JWT session
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.id) {
      _cachedUserId = user.id
      return _cachedUserId
    }
  } catch { /* */ }

  console.warn('[bookingService] _getUserId: could not resolve user id')
  return null
}

function _toFrontend(row: any): BookingFrontend {
  const ev = row.events || {}
  const bookerUser = row.users || {}

  return {
    id: row.id,
    eventId: row.event_id,
    eventTitle: ev.title || '',
    eventDate: ev.start_date || '',
    eventTime: ev.start_time || '',
    endDate: ev.end_date || ev.start_date || '',
    endTime: ev.end_time || '',
    venue: ev.venue || '',
    city: ev.city || '',
    eventBannerUrl: ev.banner_url || '',
    eventCategory: ev.category || '',
    userEmail: bookerUser.email || '',
    userName: bookerUser.name || '',
    quantity: row.quantity ?? 0,
    ticketPrice: row.ticket_price ?? 0,
    bookingFee: row.booking_fee ?? 0,
    gstAmount: row.gst_amount ?? 0,
    totalAmount: row.total_amount ?? 0,
    bookingDate: row.created_at,
    status: row.booking_status || 'confirmed',
    bookingStatus: row.booking_status || 'confirmed',
    refundPolicy: ev.refund_policy || 'no_refund',
    selectedSeats: row.selected_seats || null,
    paymentMethod: row.payment_method || null,
    paymentReference: row.payment_reference || null,
  }
}

async function _toSupabase(bookingData: BookingCreateInput) {
  const userId = await _getUserId()

  return {
    event_id: bookingData.eventId,
    user_id: userId,
    quantity: bookingData.quantity ?? 1,
    ticket_price: bookingData.ticketPrice ?? 0,
    booking_fee: bookingData.bookingFee ?? 0,
    gst_amount: bookingData.gstAmount ?? 0,
    total_amount: bookingData.totalAmount ?? 0,
    selected_seats: bookingData.selectedSeats || null,
    booking_status: bookingData.status || 'confirmed',
    payment_method: bookingData.paymentMethod || 'online',
    payment_reference: bookingData.paymentReference || null,
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

export const bookingService = {

  async getBookings(): Promise<BookingFrontend[]> {
    const userId = await _getUserId()
    if (!userId) return []

    const { data, error } = await supabase
      .from('bookings')
      .select('*, events(title, start_date, start_time, end_date, end_time, venue, city, banner_url, category, refund_policy)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) { console.error('bookingService.getBookings error:', error.message); return [] }
    return (data || []).map(_toFrontend)
  },

  async getBookingsByEvent(eventId: string): Promise<BookingFrontend[]> {
    if (!eventId) return []

    const { data, error } = await supabase
      .from('bookings')
      .select('*, events(title, start_date, start_time, end_date, end_time, venue, city), users(name, email)')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })

    if (error) { console.error('bookingService.getBookingsByEvent error:', error.message); return [] }
    return (data || []).map(_toFrontend)
  },

  async getBookingsByEvents(eventIds: string[]): Promise<BookingFrontend[]> {
    if (!eventIds?.length) return []

    const { data, error } = await supabase
      .from('bookings')
      .select('*, events(title, start_date, start_time, end_date, end_time, venue, city), users(name, email)')
      .in('event_id', eventIds)
      .order('created_at', { ascending: false })

    if (error) { console.error('bookingService.getBookingsByEvents error:', error.message); return [] }
    return (data || []).map(_toFrontend)
  },

  async createBooking(bookingData: BookingCreateInput): Promise<BookingFrontend> {
    const supabaseData = await _toSupabase(bookingData)

    const { data, error } = await supabase
      .from('bookings')
      .insert([supabaseData])
      .select('*, events(title, start_date, start_time, end_date, end_time, venue, city)')
      .single()

    if (error) {
      console.error('bookingService.createBooking error:', error.message)
      throw error
    }

    return _toFrontend(data)
  },

  async cancelBooking(id: string): Promise<BookingFrontend> {
    const { data, error } = await supabase
      .from('bookings')
      .update({ booking_status: 'cancelled' })
      .eq('id', id)
      .select('*, events(title, start_date, start_time, end_date, end_time, venue, city)')
      .single()

    if (error) {
      console.error('bookingService.cancelBooking error:', error.message)
      throw error
    }

    return _toFrontend(data)
  },

  async deleteBooking(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('bookingService.deleteBooking error:', error.message)
      throw error
    }

    return true
  },

  async getTicketCounts(eventIds: string[]): Promise<Record<string, number>> {
    if (!eventIds?.length) return {}

    const { data, error } = await supabase
      .from('bookings')
      .select('event_id, quantity')
      .in('event_id', eventIds)
      .neq('booking_status', 'cancelled')

    if (error) { console.error('bookingService.getTicketCounts error:', error.message); return {} }

    const counts: Record<string, number> = {}
      ; (data || []).forEach((row: any) => {
        counts[row.event_id] = (counts[row.event_id] || 0) + (row.quantity || 0)
      })
    return counts
  },

  /**
   * Check refund eligibility for a booking.
   * Calls the backend API (server.js Route 13).
   */
  async checkRefundEligibility(bookingId: string): Promise<RefundEligibility> {
    const userEmail = _getUserEmail()
    if (!userEmail) {
      return { eligible: false, reason: 'Not logged in.' }
    }

    const BACKEND = _getBackendUrl()

    try {
      const res = await fetch(
        `${BACKEND}/api/payment/refund-eligibility?bookingId=${encodeURIComponent(bookingId)}&userEmail=${encodeURIComponent(userEmail)}`
      )
      const text = await res.text()
      try {
        return JSON.parse(text)
      } catch {
        return { eligible: false, reason: 'Server error: ' + text.substring(0, 50) }
      }
    } catch (err: any) {
      console.error('bookingService.checkRefundEligibility error:', err)
      return { eligible: false, reason: 'Network error: ' + err.message }
    }
  },

  /**
   * Process the actual refund via Razorpay.
   * Calls the backend API (server.js Route 14).
   */
  async requestRefund(bookingId: string): Promise<RefundResult> {
    const userEmail = _getUserEmail()
    if (!userEmail) {
      return { success: false, error: 'Not logged in.' }
    }

    const BACKEND = _getBackendUrl()

    try {
      const res = await fetch(`${BACKEND}/api/payment/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, userEmail }),
      })
      const text = await res.text()
      try {
        return JSON.parse(text)
      } catch {
        return { success: false, error: 'Server crashed: ' + text.substring(0, 100) }
      }
    } catch (err: any) {
      console.error('bookingService.requestRefund error:', err)
      return { success: false, error: 'Network error: ' + err.message }
    }
  },
}

// ─── Private helpers for refund flow ─────────────────────────────────────────

function _getUserEmail(): string | null {
  try {
    const storeData = JSON.parse(localStorage.getItem('pluto-auth') || '{}')
    return storeData?.state?.user?.email || null
  } catch {
    return null
  }
}

function _getBackendUrl(): string {
  // Use env variable if set, otherwise use relative path (works with Vite proxy in dev, same-origin in prod)
  if (import.meta.env.VITE_API_BASE) return import.meta.env.VITE_API_BASE
  return ''
}
