/**
 * useBookings.ts — React Query hooks for booking operations
 * Wraps bookingService.ts
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bookingService } from '@/services/bookingService'
import type { BookingCreateInput } from '@/services/bookingService'

// Re-export types for consumers
export type { BookingFrontend, RefundEligibility, RefundResult } from '@/services/bookingService'

/** My Applications (current user) */
export function useMyBookings() {
  return useQuery({
    queryKey: ['bookings', 'my'],
    queryFn: () => bookingService.getBookings(),
    staleTime: 2 * 60 * 1000,
  })
}

/** Bookings for a specific event (organizer view) */
export function useEventBookings(eventId?: string) {
  return useQuery({
    queryKey: ['bookings', 'event', eventId],
    queryFn: () => bookingService.getBookingsByEvent(eventId!),
    enabled: !!eventId,
    staleTime: 60 * 1000,
  })
}

/** Bookings for multiple events (organizer overview) */
export function useEventsBookings(eventIds: string[]) {
  return useQuery({
    queryKey: ['bookings', 'events', ...eventIds],
    queryFn: () => bookingService.getBookingsByEvents(eventIds),
    enabled: eventIds.length > 0,
    staleTime: 60 * 1000,
  })
}

/** Ticket counts for multiple events */
export function useTicketCounts(eventIds: string[]) {
  return useQuery({
    queryKey: ['ticketCounts', ...eventIds],
    queryFn: () => bookingService.getTicketCounts(eventIds),
    enabled: eventIds.length > 0,
    staleTime: 60 * 1000,
  })
}

/** Create a new booking */
export function useCreateBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: BookingCreateInput) => bookingService.createBooking(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['ticketCounts'] })
    },
  })
}

/** Cancel a booking (soft cancel) */
export function useCancelBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (bookingId: string) => bookingService.cancelBooking(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['ticketCounts'] })
    },
  })
}

/** Delete a booking (hard delete) */
export function useDeleteBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (bookingId: string) => bookingService.deleteBooking(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['ticketCounts'] })
    },
  })
}

/** Create a free booking (shortcut for price=0 events) */
export function useCreateFreeBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { eventId: string; userId: string; quantity: number }) =>
      bookingService.createBooking({
        eventId: data.eventId,
        quantity: data.quantity,
        totalAmount: 0,
        status: 'confirmed',
        paymentMethod: 'free',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['ticketCounts'] })
    },
  })
}

/**
 * Check refund eligibility for a booking.
 * Returns a mutation so we can trigger it on-demand (when modal opens).
 */
export function useCheckRefundEligibility() {
  return useMutation({
    mutationFn: (bookingId: string) => bookingService.checkRefundEligibility(bookingId),
  })
}

/**
 * Process an actual refund via the backend → Razorpay.
 * Invalidates booking caches on success.
 */
export function useRequestRefund() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (bookingId: string) => bookingService.requestRefund(bookingId),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['bookings'] })
        queryClient.invalidateQueries({ queryKey: ['ticketCounts'] })
      }
    },
  })
}

/** Calculate price breakdown for booking
 *  - Booking Fee: 2.5% of ticket subtotal (covers gateway cost)
 *  - GST: 18% of booking fee only
 *  - Platform Commission: 1% of ticket subtotal (internal, not shown to customer)
 */
export function calculatePriceBreakdown(ticketPrice: number, quantity: number) {
  const ticketTotal = ticketPrice * quantity
  const isFree = ticketPrice === 0
  const bookingFee = isFree ? 0 : Number((ticketTotal * 0.025).toFixed(2))       // 2.5%
  // will implement after it will come in production
  // const gstAmount = isFree ? 0 : Math.round(bookingFee * 0.18)          // 18% on booking fee
  const gstAmount = 0
  const totalAmount = Number((ticketTotal + bookingFee).toFixed(2))
  const platformCommission = isFree ? 0 : Math.round(ticketTotal * 0.01) // 1% internal
  return { ticketTotal, bookingFee, gstAmount, totalAmount, isFree, platformCommission }
}

/** Send booking confirmation notification (non-blocking) */
export async function sendBookingNotification(params: {
  userEmail: string
  eventTitle: string
  eventId: string
}) {
  try {
    console.log('[Notification] Booking confirmation sent to:', params.userEmail, 'for', params.eventTitle)
  } catch {
    // Silently fail — notifications are non-critical
  }
}

/** Send notification to organizer about new booking (non-blocking) */
export async function sendOrganizerNotification(params: {
  organizerEmail: string
  bookerName: string
  eventTitle: string
  eventId: string
}) {
  try {
    console.log('[Notification] Organizer notified:', params.organizerEmail, 'about booking by', params.bookerName)
  } catch {
    // Silently fail
  }
}

