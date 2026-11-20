/**
 * notifications.ts — PLUTO
 * Port of notification helper functions from auth.js
 */

const API_BASE = import.meta.env.VITE_API_BASE || ''

interface NotificationParams {
  type?: string
  eventId?: string
  title?: string
  body?: string
  collegeId?: string
  isUniversal?: boolean
  targetUserId?: string
}

interface BookingNotificationParams {
  userEmail: string
  eventTitle: string
  eventId: string
}

/**
 * Send a push notification via the backend API.
 */
export async function sendPlutoNotification(params: NotificationParams) {
  try {
    const resp = await fetch(`${API_BASE}/api/notifications/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    const result = await resp.json()
    console.log('[Notification] Sent:', result)
    return result
  } catch (err: any) {
    console.warn('[Notification] Failed (non-blocking):', err.message)
    return { success: false }
  }
}

/**
 * Send a booking confirmation notification.
 */
export async function sendBookingNotification(params: BookingNotificationParams) {
  try {
    const resp = await fetch(`${API_BASE}/api/notifications/booking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    const result = await resp.json()
    console.log('[Notification] Booking:', result)
    return result
  } catch (err: any) {
    console.warn('[Notification] Booking notification failed (non-blocking):', err.message)
    return { success: false }
  }
}

/**
 * Send a notification to the event organizer when someone books.
 */
export async function sendOrganizerBookingAlert(params: {
  organizerEmail: string
  bookerName: string
  eventTitle: string
  eventId: string
  quantity: number
}) {
  try {
    const resp = await fetch(`${API_BASE}/api/notifications/organizer-alert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    return await resp.json()
  } catch (err: any) {
    console.warn('[Notification] Organizer alert failed (non-blocking):', err.message)
    return { success: false }
  }
}
