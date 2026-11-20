// ============================================================
// PLUTO Payment Backend Server (TypeScript)
// ============================================================
// Run: npm run dev (tsx watch)
// Port: 3001 (configurable via .env PORT)
//
// Payment Model: Option A — Collect All, Payout Later
//   All money goes to YOUR Razorpay account.
//   You manually/automatically transfer organizer's share.
//
// Endpoints:
//   GET  /api/payment/config        → Returns public Razorpay key
//   POST /api/payment/create-order  → Creates Razorpay order
//   POST /api/payment/verify        → Verifies signature + creates booking
//   GET  /health                    → Health check
// ============================================================

import 'dotenv/config'
import express, { Request, Response } from 'express'
import cors from 'cors'
import crypto from 'crypto'
import Razorpay from 'razorpay'
import { createClient } from '@supabase/supabase-js'
import * as admin from 'firebase-admin'
import rateLimit from 'express-rate-limit'

const app = express()

// ── Firebase Admin Initialization ──────────────────────────
try {
  let serviceAccount: any;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    // Fallback for local development
    serviceAccount = require('../firebase-service-account.json');
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    })
    console.log('[Firebase Admin] Initialized successfully')
  }
} catch (error) {
  console.error('[Firebase Admin] Initialization failed! Add FIREBASE_SERVICE_ACCOUNT to env or firebase-service-account.json to backend.', error)
}

// ── Middleware ─────────────────────────────────────────────
app.use(express.json())
app.use(cors())

// ── Razorpay Instance ──────────────────────────────────────
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

// ── Supabase Client (Service Role — bypasses RLS) ──────────
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PORT = process.env.PORT || 3001

// ── Rate Limiters ─────────────────────────────────────────
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many AI requests. Please wait a minute before trying again.' },
})

const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many payment requests. Please slow down.' },
})

// ── Types ──────────────────────────────────────────────────

interface CreateOrderBody {
  amount: number
  eventId: string
  userEmail: string
  selectedSeats?: any[]
  quantity?: number
}

interface VerifyPaymentBody {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
  eventId: string
  userEmail: string
  quantity?: number
  ticketPrice?: number
  bookingFee?: number
  gstAmount?: number
  totalAmount?: number
  selectedSeats?: string[] | null
  paymentMethod?: string
}

// ============================================================
// HELPER: Get Supabase user ID from email (or create if missing)
// ============================================================
async function getUserIdByEmail(email: string): Promise<string | null> {
  if (!email) return null

  const { data } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (data?.id) return data.id

  // User not found in public users table — create them
  console.log(`[getUserIdByEmail] User not found for ${email}. Creating record.`)
  const { data: newUser, error: insertError } = await supabase
    .from('users')
    .insert({
      name: email.split('@')[0],
      email: email,
      roles: ['student'],
    })
    .select('id')
    .single()

  if (insertError) {
    console.error('[getUserIdByEmail] Error creating user:', insertError.message)
    return null
  }

  return newUser?.id || null
}


// ============================================================
// ROUTE: GET /api/payment/config
// Returns the public Razorpay Key ID to the frontend.
// The Key Secret NEVER leaves the server.
// ============================================================
app.get('/api/payment/config', (_req: Request, res: Response) => {
  res.json({
    key_id: process.env.RAZORPAY_KEY_ID,
    currency: 'INR',
  })
})


// ============================================================
// ROUTE: POST /api/payment/create-order
// Body: { amount, eventId, userEmail, selectedSeats?, quantity? }
//
// Flow:
//   1. Validates input
//   2. Creates Razorpay order (amount in paise)
//   3. Stores order in razorpay_orders table (status: 'created')
//   4. Returns order_id + key_id to frontend
// ============================================================
app.post('/api/payment/create-order', paymentLimiter, async (req: Request<{}, {}, CreateOrderBody>, res: Response) => {
  try {
    const { amount, eventId, userEmail, selectedSeats, quantity } = req.body

    // ── Validation ──────────────────────────────────────
    if (!amount || amount < 1) {
      return res.status(400).json({ error: 'Invalid amount. Minimum is ₹1.' })
    }
    if (!eventId) {
      return res.status(400).json({ error: 'eventId is required.' })
    }
    if (!userEmail) {
      return res.status(400).json({ error: 'userEmail is required.' })
    }

    // ── Convert ₹ to paise (1 ₹ = 100 paise) ──────────
    const amountPaise = Math.round(amount * 100)

    // ── Create Razorpay Order ──────────────────────────
    const razorpayOrder = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: `pluto_${eventId.slice(0, 8)}_${Date.now()}`,
      notes: {
        event_id: eventId,
        user_email: userEmail,
        platform: 'PLUTO',
        payment_model: 'collect_all',
      },
    })

    // ── Resolve user ID ────────────────────────────────
    const userId = await getUserIdByEmail(userEmail)

    // ── Store order in Supabase ────────────────────────
    const { data: orderRow, error: dbError } = await supabase
      .from('razorpay_orders')
      .insert({
        razorpay_order_id: razorpayOrder.id,
        event_id: eventId,
        user_id: userId,
        amount_paise: amountPaise,
        currency: 'INR',
        order_status: 'created',
        selected_seats: selectedSeats || null,
      })
      .select('id')
      .single()

    if (dbError) {
      console.error('[create-order] DB insert error:', dbError.message)
      // Non-fatal: order still created in Razorpay, proceed
    }

    console.log(`[create-order] ✅ Razorpay order created: ${razorpayOrder.id} | ₹${amount}`)

    res.json({
      order_id: razorpayOrder.id,
      amount: amountPaise,
      currency: 'INR',
      key_id: process.env.RAZORPAY_KEY_ID,
      db_order_id: orderRow?.id || null,
    })

  } catch (err: any) {
    console.error('[create-order] ❌ Error:', err.message || err)
    res.status(500).json({ error: 'Failed to create payment order. Please try again.' })
  }
})


// ============================================================
// ROUTE: POST /api/payment/verify
// Verifies HMAC SHA256 signature → creates booking → updates order
// ============================================================
app.post('/api/payment/verify', paymentLimiter, async (req: Request<{}, {}, VerifyPaymentBody>, res: Response) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      eventId,
      userEmail,
      quantity,
      ticketPrice,
      bookingFee,
      gstAmount,
      totalAmount,
      selectedSeats,
      paymentMethod,
    } = req.body

    // ── Step 1: Verify HMAC SHA256 Signature ───────────
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    const isSignatureValid = expectedSignature === razorpay_signature

    if (!isSignatureValid) {
      console.warn('[verify] ❌ Signature MISMATCH for order:', razorpay_order_id)

      // Mark order as failed in DB
      await supabase
        .from('razorpay_orders')
        .update({ order_status: 'failed' })
        .eq('razorpay_order_id', razorpay_order_id)

      return res.status(400).json({
        success: false,
        error: 'Payment verification failed. Invalid signature.',
      })
    }

    console.log(`[verify] ✅ Signature VALID for order: ${razorpay_order_id}`)

    // ── Step 2a: Resolve User ID ───────────────────────
    const userId = await getUserIdByEmail(userEmail)

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User not found. Cannot create booking.',
      })
    }

    // ── Step 2b: Create Booking in Supabase ────────────
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        event_id: eventId,
        user_id: userId,
        quantity: quantity || 1,
        ticket_price: ticketPrice || 0,
        booking_fee: bookingFee || 0,
        gst_amount: gstAmount || 0,
        total_amount: totalAmount || 0,
        selected_seats: selectedSeats || null,
        booking_status: 'confirmed',
        payment_method: paymentMethod || 'razorpay',
        payment_reference: razorpay_payment_id,
      })
      .select('id')
      .single()

    if (bookingError) {
      // Check for duplicate booking constraint
      if (bookingError.message?.includes('idx_bookings_user_event')) {
        console.warn('[verify] ⚠️ Duplicate booking:', userEmail, eventId)
        return res.status(409).json({
          success: false,
          error: 'duplicate_booking',
          message: 'You already have a booking for this event.',
        })
      }
      console.error('[verify] ❌ Booking insert error:', bookingError.message)
      return res.status(500).json({
        success: false,
        error: `Payment received but booking creation failed. Contact support with payment ID: ${razorpay_payment_id}`,
      })
    }

    console.log(`[verify] ✅ Booking created: ${booking.id} for event: ${eventId}`)

    // ── Step 2c: Update Razorpay Order Record ──────────
    await supabase
      .from('razorpay_orders')
      .update({
        razorpay_payment_id,
        razorpay_signature,
        order_status: 'paid',
        booking_id: booking.id,
      })
      .eq('razorpay_order_id', razorpay_order_id)

    // ── Step 2d: Insert booking_financials (fee split ledger) ───────
    // IMPORTANT: For seated events, ticketPrice is already the total subtotal
    // (sum of all individual seat prices), so we must NOT multiply by quantity.
    // For non-seated events, ticketPrice is the per-ticket price, so we DO multiply.
    const isSeatedBooking = selectedSeats && Array.isArray(selectedSeats) && selectedSeats.length > 0
    const ticketSubtotal = isSeatedBooking
      ? (ticketPrice || 0)                          // Already the sum of seat prices
      : (ticketPrice || 0) * (quantity || 1)         // Per-ticket price × quantity
    const totalPaidNum = totalAmount || 0

    // Only create financial record for paid bookings
    if (totalPaidNum > 0) {
      const razorpayFeeCalc = Number((ticketSubtotal * 0.0236).toFixed(2))
      const plutoCommission = Number((ticketSubtotal * 0.0114).toFixed(2)) // 1% + 0.14%
      const organizerNet = Number((totalPaidNum - razorpayFeeCalc - plutoCommission).toFixed(2))

      // Get event's organizer ID
      const { data: eventData } = await supabase
        .from('events')
        .select('created_by')
        .eq('id', eventId)
        .single()

      if (eventData?.created_by) {
        const { error: bfError } = await supabase.from('booking_financials').insert({
          booking_id: booking.id,
          event_id: eventId,
          organizer_id: eventData.created_by,
          ticket_subtotal: ticketSubtotal,
          booking_fee: bookingFee || 0,
          total_paid: totalPaidNum,
          razorpay_fee: razorpayFeeCalc,
          pluto_commission: plutoCommission,
          organizer_net: organizerNet,
          payout_status: 'unsettled',
        })
        if (bfError) {
          console.error('[verify] booking_financials insert error (non-fatal):', bfError.message)
        } else {
          console.log(`[verify] 💰 Financial record: Total ₹${totalPaidNum} | Organizer ₹${organizerNet} | Pluto ₹${plutoCommission} | Razorpay ₹${razorpayFeeCalc}`)
        }
      }
    } else {
      console.log('[verify] Free booking — skipping booking_financials.')
    }

    res.json({
      success: true,
      booking_id: booking.id,
      payment_id: razorpay_payment_id,
      message: 'Payment verified and booking confirmed!',
    })

  } catch (err: any) {
    console.error('[verify] ❌ Error:', err.message || err)
    res.status(500).json({
      success: false,
      error: 'Verification failed. Please contact support.',
    })
  }
})

// ============================================================
// ROUTE: POST /api/payment/verify-signature-only
// Verifies HMAC SHA256 signature and returns success to let the
// frontend handle complex database insertions (e.g. competitions)
// ============================================================
app.post('/api/payment/verify-signature-only', paymentLimiter, async (req: Request, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      await supabase
        .from('razorpay_orders')
        .update({ order_status: 'failed' })
        .eq('razorpay_order_id', razorpay_order_id)

      return res.status(400).json({ success: false, error: 'Invalid signature.' })
    }

    // Update order status to paid
    await supabase
      .from('razorpay_orders')
      .update({
        razorpay_payment_id,
        razorpay_signature,
        order_status: 'paid',
      })
      .eq('razorpay_order_id', razorpay_order_id)

    res.json({ success: true, payment_id: razorpay_payment_id })
  } catch (err: any) {
    console.error('[verify-signature-only] ❌ Error:', err.message || err)
    res.status(500).json({ success: false, error: 'Signature verification failed.' })
  }
})


// ============================================================
// ROUTE: GET /api/payment/refund-eligibility
// Checks if a booking is eligible for cancellation & refund.
// Query: ?bookingId=xxx&userEmail=xxx
// Returns: { eligible, reason, refundBreakdown }
// ============================================================
app.get('/api/payment/refund-eligibility', async (req: Request, res: Response) => {
  try {
    const { bookingId, userEmail } = req.query as { bookingId?: string; userEmail?: string }

    if (!bookingId || !userEmail) {
      return res.status(400).json({ eligible: false, reason: 'bookingId and userEmail are required.' })
    }

    const userId = await getUserIdByEmail(userEmail)
    if (!userId) {
      return res.status(404).json({ eligible: false, reason: 'User not found.' })
    }

    // 1. Fetch booking with event data
    const { data: booking, error: bErr } = await supabase
      .from('bookings')
      .select('*, events(id, title, start_date, start_time, refund_policy, ticket_price, has_seating, seat_layout)')
      .eq('id', bookingId)
      .eq('user_id', userId)
      .maybeSingle()

    if (bErr || !booking) {
      return res.json({ eligible: false, reason: 'Booking not found or does not belong to this user.' })
    }

    const event = booking.events as any

    // 2. Check booking status
    if (booking.booking_status !== 'confirmed') {
      return res.json({ eligible: false, reason: `Booking is already ${booking.booking_status}. Only confirmed bookings can be refunded.` })
    }

    // 3. Check refund policy
    if (event.refund_policy !== '24_hours') {
      return res.json({ eligible: false, reason: 'This event has a non-refundable ticket policy.' })
    }

    // 4. Check if it's a paid event
    if (Number(event.ticket_price) === 0 || Number(booking.total_amount) === 0) {
      return res.json({ eligible: false, reason: 'Free event bookings cannot be refunded.' })
    }

    // 5. Check 24-hour window before event start
    const eventStartStr = `${event.start_date}T${event.start_time || '00:00'}:00+05:30`
    const eventStart = new Date(eventStartStr)
    const now = new Date()
    const hoursUntilEvent = (eventStart.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (hoursUntilEvent < 24) {
      const hoursLeft = Math.max(0, Math.floor(hoursUntilEvent))
      return res.json({
        eligible: false,
        reason: `Cancellation window has closed. Refunds must be requested at least 24 hours before the event. Only ${hoursLeft}h remaining.`
      })
    }

    // 6. Check for existing cancellation
    const { data: existingCancel } = await supabase
      .from('cancellations')
      .select('id, refund_status')
      .eq('booking_id', bookingId)
      .maybeSingle()

    if (existingCancel) {
      return res.json({ eligible: false, reason: `A cancellation request already exists (status: ${existingCancel.refund_status}).` })
    }

    // 7. Check razorpay payment reference exists
    const { data: rzpOrder } = await supabase
      .from('razorpay_orders')
      .select('razorpay_payment_id')
      .eq('booking_id', bookingId)
      .eq('order_status', 'paid')
      .maybeSingle()

    const paymentId = rzpOrder?.razorpay_payment_id || booking.payment_reference
    if (!paymentId) {
      return res.json({ eligible: false, reason: 'Payment reference not found. Please contact support.' })
    }

    // 8. Calculate refund breakdown
    const originalAmount = Number(booking.total_amount)
    const bookingFee = Number(booking.booking_fee) || 0
    const gstAmount = Number(booking.gst_amount) || 0

    // Platform Policy:
    // - Booking fees and GST are strictly non-refundable
    // - Flat ₹30 cancellation penalty is deducted from the base ticket price
    const cancellationPenalty = 30
    const nonRefundableFees = bookingFee + gstAmount
    const totalDeductions = nonRefundableFees + cancellationPenalty

    // Calculate the actual ticket amount paid, ignoring abstract ticket_price which might not account for discounts
    const actualTicketAmountPaid = originalAmount - nonRefundableFees
    const refundAmount = Math.max(0, actualTicketAmountPaid - cancellationPenalty)

    res.json({
      eligible: true,
      reason: 'Booking is eligible for cancellation and refund.',
      deadlineHours: Math.floor(hoursUntilEvent),
      eventTitle: event.title,
      refundBreakdown: {
        originalAmount,
        ticketPrice: actualTicketAmountPaid,
        bookingFee: nonRefundableFees,
        cancellationPenalty,
        totalDeductions,
        refundAmount
      }
    })

  } catch (err: any) {
    console.error('[refund-eligibility] Error:', err)
    res.status(500).json({ eligible: false, reason: 'Internal server error.' })
  }
})


// ============================================================
// ROUTE: POST /api/payment/refund
// Processes actual refund via Razorpay + updates DB.
// Body: { bookingId, userEmail }
// ============================================================
app.post('/api/payment/refund', paymentLimiter, async (req: Request, res: Response) => {
  try {
    const { bookingId, userEmail } = req.body

    if (!bookingId || !userEmail) {
      return res.status(400).json({ success: false, error: 'bookingId and userEmail are required.' })
    }

    const userId = await getUserIdByEmail(userEmail)
    if (!userId) {
      return res.status(404).json({ success: false, error: 'User not found.' })
    }

    // ── Re-validate eligibility (never trust frontend) ──────────
    const { data: booking, error: bErr } = await supabase
      .from('bookings')
      .select('*, events(id, title, start_date, start_time, refund_policy, ticket_price, has_seating, seat_layout, created_by)')
      .eq('id', bookingId)
      .eq('user_id', userId)
      .maybeSingle()

    if (bErr || !booking) {
      return res.status(404).json({ success: false, error: 'Booking not found.' })
    }

    const event = booking.events as any

    if (booking.booking_status !== 'confirmed') {
      return res.status(400).json({ success: false, error: `Booking is ${booking.booking_status}, not eligible for refund.` })
    }
    if (event.refund_policy !== '24_hours') {
      return res.status(400).json({ success: false, error: 'Event has non-refundable policy.' })
    }
    if (Number(booking.total_amount) === 0) {
      return res.status(400).json({ success: false, error: 'Free event bookings cannot be refunded.' })
    }

    const eventStartStr = `${event.start_date}T${event.start_time || '00:00'}:00+05:30`
    const eventStart = new Date(eventStartStr)
    const now = new Date()
    if ((eventStart.getTime() - now.getTime()) / (1000 * 60 * 60) < 24) {
      return res.status(400).json({ success: false, error: 'Cancellation window has closed (less than 24 hours before event).' })
    }

    // Check duplicate cancellation
    const { data: existingCancel } = await supabase
      .from('cancellations')
      .select('id')
      .eq('booking_id', bookingId)
      .maybeSingle()

    if (existingCancel) {
      return res.status(409).json({ success: false, error: 'Cancellation already exists for this booking.' })
    }

    // ── Get Razorpay payment ID ─────────────────────────────────
    const { data: rzpOrder } = await supabase
      .from('razorpay_orders')
      .select('razorpay_payment_id')
      .eq('booking_id', bookingId)
      .eq('order_status', 'paid')
      .maybeSingle()

    const paymentId = rzpOrder?.razorpay_payment_id || booking.payment_reference
    if (!paymentId) {
      return res.status(400).json({ success: false, error: 'Payment reference not found. Contact support.' })
    }

    // ── Calculate refund amounts ────────────────────────────────
    const originalAmount = Number(booking.total_amount)
    const bookingFee = Number(booking.booking_fee) || 0
    const gstAmount = Number(booking.gst_amount) || 0

    const cancellationPenalty = 30
    const nonRefundableFees = bookingFee + gstAmount
    const cancellationFee = nonRefundableFees + cancellationPenalty

    const actualTicketAmountPaid = originalAmount - nonRefundableFees

    const refundAmount = Math.max(0, actualTicketAmountPaid - cancellationPenalty)
    const refundAmountPaise = Math.round(refundAmount * 100)

    if (refundAmountPaise <= 0) {
      return res.status(400).json({ success: false, error: 'Refund amount is too small after deducting fees.' })
    }

    console.log(`[refund] Processing refund for booking ${bookingId}: ₹${refundAmount} (from ₹${originalAmount})`)

    // ── Call Razorpay Refund API ────────────────────────────────
    let razorpayRefund: any
    try {
      razorpayRefund = await razorpay.payments.refund(paymentId, {
        amount: refundAmountPaise,
        speed: 'normal',
        notes: {
          booking_id: bookingId,
          platform: 'PLUTO',
          reason: 'User-initiated cancellation within 24hr window'
        },
        receipt: `refund_${bookingId.slice(0, 8)}_${Date.now()}`
      })
    } catch (rzpErr: any) {
      console.error('[refund] Razorpay refund failed:', rzpErr)

      // Record failed cancellation
      await supabase.from('cancellations').insert({
        booking_id: bookingId,
        event_id: event.id,
        user_id: userId,
        razorpay_payment_id: paymentId,
        original_amount: originalAmount,
        ticket_price: actualTicketAmountPaid,
        gateway_fee: nonRefundableFees,
        platform_fee: cancellationPenalty,
        cancellation_fee: cancellationFee,
        refund_amount: refundAmount,
        refund_status: 'failed',
        failure_reason: rzpErr.error?.description || rzpErr.message || 'Unknown Razorpay error',
        requested_at: new Date().toISOString(),
        processed_at: new Date().toISOString()
      })

      return res.status(500).json({
        success: false,
        error: 'Razorpay refund failed: ' + (rzpErr.error?.description || rzpErr.message || 'Unknown error')
      })
    }

    console.log(`[refund] Razorpay refund successful: ${razorpayRefund.id}`)

    // ── Record cancellation in DB ───────────────────────────────
    await supabase.from('cancellations').insert({
      booking_id: bookingId,
      event_id: event.id,
      user_id: userId,
      razorpay_payment_id: paymentId,
      razorpay_refund_id: razorpayRefund.id,
      original_amount: originalAmount,
      ticket_price: actualTicketAmountPaid,
      gateway_fee: nonRefundableFees,
      platform_fee: cancellationPenalty,
      cancellation_fee: cancellationFee,
      refund_amount: refundAmount,
      refund_status: 'refunded',
      requested_at: new Date().toISOString(),
      processed_at: new Date().toISOString()
    })

    // ── Update booking status ───────────────────────────────────
    await supabase
      .from('bookings')
      .update({ booking_status: 'refunded' })
      .eq('id', bookingId)

    // ── Release seats if seated event ───────────────────────────
    if (event.has_seating && booking.selected_seats && event.seat_layout) {
      try {
        const layout = typeof event.seat_layout === 'string'
          ? JSON.parse(event.seat_layout)
          : event.seat_layout

        const cancelledSeatIds = (booking.selected_seats as any[]).map((s: any) => s.id || s.label)

        if (layout.seats) {
          layout.seats = layout.seats.map((seat: any) => {
            if (cancelledSeatIds.includes(seat.id) || cancelledSeatIds.includes(seat.label)) {
              return { ...seat, status: 'available' }
            }
            return seat
          })
        }
        if (layout.tables) {
          layout.tables = layout.tables.map((table: any) => {
            if (table.seats) {
              table.seats = table.seats.map((seat: any) => {
                if (cancelledSeatIds.includes(seat.id) || cancelledSeatIds.includes(seat.label)) {
                  return { ...seat, status: 'available' }
                }
                return seat
              })
            }
            return table
          })
        }

        await supabase
          .from('events')
          .update({ seat_layout: layout })
          .eq('id', event.id)

        console.log(`[refund] Released ${cancelledSeatIds.length} seats for event ${event.id}`)
      } catch (seatErr: any) {
        console.error('[refund] Seat release failed (non-fatal):', seatErr.message)
      }
    }

    res.json({
      success: true,
      refundId: razorpayRefund.id,
      refundAmount,
      cancellationFee,
      message: `Refund of ₹${refundAmount} initiated successfully. It will be credited within 5-10 business days.`
    })

  } catch (err: any) {
    console.error('[refund] Error:', err)
    res.status(500).json({ success: false, error: 'Internal server error during refund processing.' })
  }
})


// ============================================================
// POST /api/notification/send
// Send Firebase Push Notification
// ============================================================
app.post('/api/notification/send', async (req: Request, res: Response) => {
  try {
    const { organizerId, userIds, title, body, data } = req.body;

    // Support either a single organizerId (legacy) or an array of userIds
    let targetUserIds: string[] = [];
    if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      targetUserIds = userIds;
    } else if (organizerId) {
      targetUserIds = [organizerId];
    }

    if (targetUserIds.length === 0 || !title || !body) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Fetch all FCM tokens for these users
    const { data: tokens, error: tokensError } = await supabase
      .from('push_tokens')
      .select('token')
      .in('user_id', targetUserIds);

    if (tokensError || !tokens || tokens.length === 0) {
      console.log(`[Notification] No FCM tokens found for target users`);
      return res.status(404).json({ error: 'No tokens found' });
    }

    // Send via Firebase Admin
    if (admin.apps.length) {
      const messages = tokens.map((t) => ({
        notification: { title, body },
        data: data || {}, // Attach the optional deep link payload
        token: t.token,
      }));

      const response = await admin.messaging().sendEach(messages);
      console.log(`[Notification] Successfully sent ${response.successCount} messages to target users`);
      return res.json({ success: true, count: response.successCount });
    } else {
      console.error('[Notification] Firebase Admin is not initialized!');
      return res.status(500).json({ error: 'Firebase Admin not initialized' });
    }

  } catch (err: any) {
    console.error('[Notification] Error sending push:', err.message);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// ============================================================
// ROUTE: POST /api/match-event
// Finds users whose roles overlap with the event and notifies them.
// ============================================================
app.post('/api/match-event', async (req: Request, res: Response) => {
  try {
    const { eventId, title, category } = req.body;
    if (!eventId || !title) {
      return res.status(400).json({ error: 'Missing event details' });
    }

    const { data: users, error } = await supabase.from('users').select('id, roles');

    if (error || !users) {
      return res.status(500).json({ error: 'Failed to fetch users' });
    }

    const keywords = [category, ...title.split(' ')].filter(Boolean).map((k: string) => k.toLowerCase());

    const matchedUserIds = users.filter((u: any) => {
      if (!u.roles || !Array.isArray(u.roles)) return false;
      return u.roles.some((role: string) =>
        keywords.some((k: string) => role.toLowerCase().includes(k))
      );
    }).map((u: any) => u.id);

    if (matchedUserIds.length === 0) {
      return res.json({ success: true, count: 0, message: 'No matches found' });
    }

    const { data: tokens, error: tokensError } = await supabase
      .from('push_tokens')
      .select('token')
      .in('user_id', matchedUserIds);

    if (tokensError || !tokens || tokens.length === 0) {
      return res.json({ success: true, count: 0, message: 'No tokens found for matches' });
    }

    if (admin.apps.length) {
      const messages = tokens.map((t) => ({
        notification: {
          title: '🤖 Pluto AI found a match!',
          body: `I noticed a new ${category || 'Event'} just got listed that perfectly matches your skills. Tap to view.`
        },
        token: t.token,
      }));

      const response = await admin.messaging().sendEach(messages);
      console.log(`[AI Match] Sent ${response.successCount} proactive pings for event ${title}`);
      return res.json({ success: true, count: response.successCount });
    } else {
      return res.status(500).json({ error: 'Firebase Admin not initialized' });
    }

  } catch (err: any) {
    console.error('[AI Match] Error:', err.message);
    res.status(500).json({ error: 'Failed to match event' });
  }
});

// ============================================================
// ROUTE: POST /api/notification/broadcast
// Broadcasts an announcement to all members of a college
// If isUniversal=true, broadcasts to ALL users app-wide
// ============================================================
app.post('/api/notification/broadcast', async (req: Request, res: Response) => {
  try {
    const { title, body, collegeId, isUniversal, department, target_years, target_sections } = req.body;
    if (!title || !body) {
      return res.status(400).json({ error: 'Missing required fields (title, body)' });
    }

    let userIds: string[] = [];

    if (isUniversal) {
      // Send to ALL users app-wide
      const { data: users, error } = await supabase
        .from('users')
        .select('id');
      if (error || !users) {
        return res.json({ success: true, count: 0, message: 'No users found' });
      }
      userIds = users.map((u: any) => u.id);
    } else if (collegeId) {
      // Send to specific college members only
      let query = supabase.from('users').select('id, year, section').eq('college_id', collegeId);

      if (department && department !== 'All') {
        query = query.eq('department', department);
      }

      const { data: users, error } = await query;
      if (error || !users || users.length === 0) {
        return res.json({ success: true, count: 0, message: 'No users found' });
      }

      const filteredUsers = users.filter((u: any) => {
        const userNumYear = String(u.year || '').match(/\d+/)?.[0];
        if (target_years && target_years.length > 0) {
          if (!userNumYear || !target_years.includes(userNumYear)) return false;

          if (target_sections && target_sections[userNumYear] && target_sections[userNumYear].length > 0) {
            if (!u.section || !target_sections[userNumYear].includes(u.section)) return false;
          }
        }
        return true;
      });

      userIds = filteredUsers.map((u: any) => u.id);
    } else {
      return res.status(400).json({ error: 'Missing collegeId for non-universal broadcast' });
    }

    if (userIds.length === 0) {
      return res.json({ success: true, count: 0, message: 'No users found' });
    }

    const { data: tokens, error: tokensError } = await supabase
      .from('push_tokens')
      .select('token')
      .in('user_id', userIds);

    if (tokensError || !tokens || tokens.length === 0) {
      return res.json({ success: true, count: 0, message: 'No tokens found' });
    }

    if (admin.apps.length) {
      const messages = tokens.map((t) => ({
        notification: { title, body },
        token: t.token,
      }));

      const response = await admin.messaging().sendEach(messages);
      console.log(`[Broadcast] Sent ${response.successCount} announcements`);
      return res.json({ success: true, count: response.successCount });
    } else {
      return res.status(500).json({ error: 'Firebase Admin not initialized' });
    }

  } catch (err: any) {
    console.error('[Broadcast] Error:', err.message);
    res.status(500).json({ error: 'Failed to broadcast' });
  }
});

// ============================================================
// PAYOUT SYSTEM — Organizer Earnings & Withdrawals
// ============================================================

// ── GET /api/payouts/summary ─────────────────────────────────
// Returns aggregated financial summary for an organizer.
// Query: ?userEmail=xxx
app.get('/api/payouts/summary', async (req: Request, res: Response) => {
  try {
    const { userEmail } = req.query as { userEmail?: string }
    if (!userEmail) return res.status(400).json({ error: 'userEmail is required.' })

    const userId = await getUserIdByEmail(userEmail)
    if (!userId) return res.status(404).json({ error: 'User not found.' })

    // 1. Unsettled balance from booking_financials
    const { data: unsettledRows } = await supabase
      .from('booking_financials')
      .select('organizer_net, created_at, bookings(booking_status), competition_registrations(status), source_type')
      .eq('organizer_id', userId)
      .eq('payout_status', 'unsettled')



    // Apply 24-hour hold: only count bookings older than 24 hours
    const now = Date.now()
    const HOLD_MS = 24 * 60 * 60 * 1000
    let availableBalance = 0
    let heldBalance = 0
    for (const row of (unsettledRows || [])) {
      // Ignore cancelled or refunded transactions
      const isCompetition = row.source_type === 'competition';
      const compReg = row.competition_registrations as any;
      const booking = row.bookings as any;

      const isCancelled = isCompetition
        ? (compReg?.status === 'cancelled' || compReg?.status === 'refunded')
        : (booking?.booking_status === 'cancelled' || booking?.booking_status === 'refunded');

      if (isCancelled) continue;

      const age = now - new Date(row.created_at).getTime()
      if (age >= HOLD_MS) {
        availableBalance += Number(row.organizer_net)
      } else {
        heldBalance += Number(row.organizer_net)
      }
    }

    // 2. In-transit (requested or processing payouts)
    const { data: transitRows } = await supabase
      .from('payouts')
      .select('amount')
      .eq('organizer_id', userId)
      .in('status', ['requested', 'processing'])

    const inTransit = (transitRows || []).reduce((sum, r) => sum + Number(r.amount), 0)

    // 3. Total withdrawn (completed payouts)
    const { data: completedRows } = await supabase
      .from('payouts')
      .select('amount')
      .eq('organizer_id', userId)
      .eq('status', 'completed')

    const totalWithdrawn = (completedRows || []).reduce((sum, r) => sum + Number(r.amount), 0)

    // 4. Lifetime earnings
    const { data: allFinancials } = await supabase
      .from('booking_financials')
      .select('organizer_net, bookings(booking_status), competition_registrations(status), source_type')
      .eq('organizer_id', userId)



    const lifetimeEarnings = (allFinancials || []).filter(((r: any) => { if (r.source_type === 'competition') return r.competition_registrations?.status !== 'cancelled' && r.competition_registrations?.status !== 'refunded'; return r.bookings?.booking_status !== 'cancelled' && r.bookings?.booking_status !== 'refunded'; })).reduce((sum, r) => sum + Number(r.organizer_net), 0)

    // 5. Check if bank account is linked
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('bank_name, account_name, account_number, ifsc_code, upi_id')
      .eq('id', userId)
      .single()

    if (userError) {
      console.error('[payouts/summary] Error fetching user bank info:', userError)
    }

    const hasBankAccount = !!(userData?.account_number && userData?.ifsc_code)
    const hasUpi = !!userData?.upi_id
    const bankLinked = hasBankAccount || hasUpi

    res.json({
      availableBalance: Number(availableBalance.toFixed(2)),
      heldBalance: Number(heldBalance.toFixed(2)),
      inTransit: Number(inTransit.toFixed(2)),
      totalWithdrawn: Number(totalWithdrawn.toFixed(2)),
      lifetimeEarnings: Number(lifetimeEarnings.toFixed(2)),
      bankLinked,
      bankInfo: bankLinked ? {
        bank_name: userData?.bank_name || null,
        account_number: userData?.account_number ? '****' + (userData.account_number as string).slice(-4) : null,
        upi_id: userData?.upi_id || null,
        account_holder_name: userData?.account_name || null,
      } : null,
    })
  } catch (err: any) {
    console.error('[payouts/summary] Error:', err.message)
    res.status(500).json({ error: 'Failed to fetch payout summary.' })
  }
})


// ── GET /api/payouts/transactions ────────────────────────────
// Returns the booking_financials ledger for an organizer.
// Query: ?userEmail=xxx
app.get('/api/payouts/transactions', async (req: Request, res: Response) => {
  try {
    const { userEmail } = req.query as { userEmail?: string }
    if (!userEmail) return res.status(400).json({ error: 'userEmail is required.' })

    const userId = await getUserIdByEmail(userEmail)
    if (!userId) return res.status(404).json({ error: 'User not found.' })

    const { data, error } = await supabase
      .from('booking_financials')
      .select(`
        id, source_type, booking_id, event_id, competition_registration_id, competition_id,
        ticket_subtotal, booking_fee, total_paid,
        razorpay_fee, pluto_commission, organizer_net,
        payout_status, created_at,
        bookings(id, user_id, quantity, selected_seats, booking_status, created_at, users(name, email)),
        events(title, banner_url),
        competitions(title, banner_url),
        competition_registrations(registration_type, competition_teams(name, team_size), users(name, email))
      `)
      .eq('organizer_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[payouts/transactions] Query error:', error.message)
      // Fallback: simpler query without joins
      const { data: fallback } = await supabase
        .from('booking_financials')
        .select('*')
        .eq('organizer_id', userId)
        .order('created_at', { ascending: false })

      return res.json({ transactions: fallback || [] })
    }

    res.json({ transactions: data || [] })
  } catch (err: any) {
    console.error('[payouts/transactions] Error:', err.message)
    res.status(500).json({ error: 'Failed to fetch transactions.' })
  }
})


// ── GET /api/payouts/history ─────────────────────────────────
// Returns payout history (actual bank transfers) for an organizer.
// Query: ?userEmail=xxx
app.get('/api/payouts/history', async (req: Request, res: Response) => {
  try {
    const { userEmail } = req.query as { userEmail?: string }
    if (!userEmail) return res.status(400).json({ error: 'userEmail is required.' })

    const userId = await getUserIdByEmail(userEmail)
    if (!userId) return res.status(404).json({ error: 'User not found.' })

    const { data, error } = await supabase
      .from('payouts')
      .select('*')
      .eq('organizer_id', userId)
      .order('requested_at', { ascending: false })

    if (error) {
      console.error('[payouts/history] Error:', error.message)
      return res.status(500).json({ error: 'Failed to fetch payout history.' })
    }

    res.json({ payouts: data || [] })
  } catch (err: any) {
    console.error('[payouts/history] Error:', err.message)
    res.status(500).json({ error: 'Failed to fetch payout history.' })
  }
})


// ── POST /api/payouts/request ────────────────────────────────
// Organizer requests a withdrawal of their available balance.
// Body: { userEmail }
app.post('/api/payouts/request', async (req: Request, res: Response) => {
  try {
    const { userEmail } = req.body
    if (!userEmail) return res.status(400).json({ error: 'userEmail is required.' })

    const userId = await getUserIdByEmail(userEmail)
    if (!userId) return res.status(404).json({ error: 'User not found.' })

    // 1. Check bank account is linked
    const { data: userData } = await supabase
      .from('users')
      .select('bank_name, account_number, ifsc_code, upi_id')
      .eq('id', userId)
      .single()

    const hasBankAccount = !!(userData?.account_number && userData?.ifsc_code)
    const hasUpi = !!userData?.upi_id
    if (!hasBankAccount && !hasUpi) {
      return res.status(400).json({ error: 'No bank account or UPI linked. Go to Settings → Payouts to add one.' })
    }

    // 2. Get all unsettled bookings older than 24 hours
    const { data: unsettledRows } = await supabase
      .from('booking_financials')
      .select('id, organizer_net, created_at, bookings(booking_status), competition_registrations(status), source_type')
      .eq('organizer_id', userId)
      .eq('payout_status', 'unsettled')



    const HOLD_MS = 24 * 60 * 60 * 1000
    const now = Date.now()
    const eligibleRows = (unsettledRows || []).filter(((r: any) => { if (r.source_type === 'competition') return r.competition_registrations?.status !== 'cancelled' && r.competition_registrations?.status !== 'refunded'; return r.bookings?.booking_status !== 'cancelled' && r.bookings?.booking_status !== 'refunded'; })).filter(
      r => (now - new Date(r.created_at).getTime()) >= HOLD_MS
    )

    if (eligibleRows.length === 0) {
      return res.status(400).json({ error: 'No available balance to withdraw. Funds are held for 24 hours after each booking.' })
    }

    const totalAmount = eligibleRows.reduce((sum, r) => sum + Number(r.organizer_net), 0)
    const roundedAmount = Number(totalAmount.toFixed(2))

    // 3. Check for existing pending payout
    const { data: existingPayout } = await supabase
      .from('payouts')
      .select('id')
      .eq('organizer_id', userId)
      .in('status', ['requested', 'processing'])
      .maybeSingle()

    if (existingPayout) {
      return res.status(409).json({ error: 'You already have a pending payout request. Please wait for it to be processed.' })
    }

    // 4. Create payout record
    const { data: payout, error: payoutError } = await supabase
      .from('payouts')
      .insert({
        organizer_id: userId,
        amount: roundedAmount,
        booking_count: eligibleRows.length,
        status: 'requested',
        payout_method: hasBankAccount ? 'bank_transfer' : 'upi',
        requested_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (payoutError || !payout) {
      console.error('[payouts/request] Insert error:', payoutError?.message)
      return res.status(500).json({ error: 'Failed to create payout request.' })
    }

    // 5. Mark eligible booking_financials as 'included' and link to payout
    const eligibleIds = eligibleRows.map(r => r.id)
    await supabase
      .from('booking_financials')
      .update({ payout_status: 'included', payout_id: payout.id })
      .in('id', eligibleIds)

    console.log(`[payouts/request] ✅ Payout requested: ₹${roundedAmount} (${eligibleRows.length} bookings) for user ${userEmail}`)

    res.json({
      success: true,
      payout_id: payout.id,
      amount: roundedAmount,
      booking_count: eligibleRows.length,
      message: `Withdrawal of ₹${roundedAmount} requested successfully. You will receive it within 3-5 business days.`,
    })
  } catch (err: any) {
    console.error('[payouts/request] Error:', err.message)
    res.status(500).json({ error: 'Failed to process payout request.' })
  }
})


// ============================================================
// ROUTE: GET /health
// ============================================================
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'PLUTO Payment Backend',
    timestamp: new Date().toISOString(),
    razorpay_configured: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
  })
})

// ============================================================
// ROUTE: GET /api/cron/ping
// Used by Cron-Job.org to keep the Render backend awake
// ============================================================
app.get('/api/cron/ping', (_req: Request, res: Response) => {
  res.json({ success: true, message: 'Backend is awake!' });
});

// ============================================================
// ROUTE: GET /api/cron/event-reminders
// Finds events starting in the next 2 hours and sends push
// notifications to all users who have confirmed bookings.
// Should be called every 30 minutes by Cron-Job.org.
// ============================================================
const sentReminders = new Set<string>(); // Track sent reminders in memory

app.get('/api/cron/event-reminders', async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    // Format dates for Supabase comparison (IST offset: +05:30)
    const todayStr = now.toISOString().split('T')[0];
    const tomorrowStr = twoHoursLater.toISOString().split('T')[0];

    // Fetch events happening today or tomorrow that are approved/live
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, title, start_date, start_time, venue, status')
      .in('status', ['approved', 'live'])
      .in('start_date', [todayStr, tomorrowStr]);

    if (eventsError || !events || events.length === 0) {
      return res.json({ success: true, count: 0, message: 'No upcoming events found' });
    }

    let totalSent = 0;

    for (const event of events) {
      // Skip if we already sent a reminder for this event
      const reminderKey = `${event.id}_${todayStr}`;
      if (sentReminders.has(reminderKey)) continue;

      // Parse event start time in IST
      const eventStartStr = `${event.start_date}T${event.start_time || '00:00'}:00+05:30`;
      const eventStart = new Date(eventStartStr);

      // Check if event starts within the next 2 hours
      const diffMs = eventStart.getTime() - now.getTime();
      if (diffMs < 0 || diffMs > 2 * 60 * 60 * 1000) continue;

      const hoursUntil = Math.round(diffMs / (1000 * 60 * 60) * 10) / 10;
      const timeLabel = hoursUntil <= 1 ? `${Math.round(diffMs / (1000 * 60))} minutes` : `${hoursUntil} hours`;

      // Fetch all confirmed bookings for this event
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('user_id')
        .eq('event_id', event.id)
        .eq('booking_status', 'confirmed');

      if (bookingsError || !bookings || bookings.length === 0) continue;

      const userIds = [...new Set(bookings.map((b: any) => b.user_id))];

      // Fetch FCM tokens for these users
      const { data: tokens, error: tokensError } = await supabase
        .from('push_tokens')
        .select('token')
        .in('user_id', userIds);

      if (tokensError || !tokens || tokens.length === 0) continue;

      if (admin.apps.length) {
        const venueText = event.venue ? ` at ${event.venue}` : '';
        const messages = tokens.map((t) => ({
          notification: {
            title: '⏰ Almost time!',
            body: `${event.title} kicks off in ${timeLabel}${venueText}. Don't forget your ID card!`
          },
          data: { route: 'EventDetails', eventId: event.id },
          token: t.token,
        }));

        const response = await admin.messaging().sendEach(messages);
        totalSent += response.successCount;
        sentReminders.add(reminderKey);
        console.log(`[Event Reminder] Sent ${response.successCount} reminders for "${event.title}"`);
      }
    }

    res.json({ success: true, count: totalSent });
  } catch (err: any) {
    console.error('[Event Reminder] Error:', err.message);
    res.status(500).json({ error: 'Failed to process event reminders' });
  }
});

// ============================================================
// PLUTO OWNER HQ — Internal Platform Dashboard APIs
// All routes require x-pluto-pin header for authentication
// ============================================================

const OWNER_PIN = process.env.PLUTO_OWNER_PIN || '142857'

// PIN Authentication Middleware
function requireOwnerPin(req: Request, res: Response, next: Function) {
  const pin = req.headers['x-pluto-pin'] as string
  if (!pin || pin !== OWNER_PIN) {
    return res.status(401).json({ error: 'Unauthorized. Invalid PIN.' })
  }
  next()
}

// ── GET /api/pluto-hq/verify-pin ─────────────────────────────
app.get('/api/pluto-hq/verify-pin', (req: Request, res: Response) => {
  const pin = req.headers['x-pluto-pin'] as string
  res.json({ valid: pin === OWNER_PIN })
})

// ── GET /api/pluto-hq/overview ───────────────────────────────
// Platform-wide KPIs and financial summary
app.get('/api/pluto-hq/overview', requireOwnerPin, async (_req: Request, res: Response) => {
  try {
    // Parallel fetch all counts and aggregates
    const [
      usersRes, eventsRes, compsRes, bookingsRes, compRegRes, financialsRes,
      payoutsRequestedRes, payoutsCompletedRes, pendingApprovalsRes, pendingCompsRes
    ] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('events').select('id', { count: 'exact', head: true }),
      supabase.from('competitions').select('id', { count: 'exact', head: true }),
      supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('booking_status', 'confirmed'),
      supabase.from('competition_registrations').select('id', { count: 'exact', head: true }).in('status', ['confirmed', 'registered']),
      supabase.from('booking_financials').select('ticket_subtotal, total_paid, booking_fee, razorpay_fee, pluto_commission, organizer_net, events(id, title), competitions(id, title), bookings(users(id), booking_status), competition_registrations(users(id), status), source_type'),
      supabase.from('payouts').select('id, amount', { count: 'exact' }).in('status', ['requested', 'processing']),
      supabase.from('payouts').select('amount').eq('status', 'completed'),
      supabase.from('events').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('competitions').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    ])

    // Count organizers (users who have created at least one event)
    const { data: organizerRows } = await supabase
      .from('events')
      .select('created_by')
    const { data: compOrgRows } = await supabase
      .from('competitions')
      .select('created_by')
    const uniqueOrganizers = new Set([
      ...(organizerRows || []).map(r => r.created_by),
      ...(compOrgRows || []).map(r => r.created_by)
    ]).size

    // Active events (approved/live)
    const { count: activeEvents } = await supabase
      .from('events')
      .select('id', { count: 'exact', head: true })
      .in('status', ['approved', 'live'])
    
    const { count: activeComps } = await supabase
      .from('competitions')
      .select('id', { count: 'exact', head: true })
      .in('status', ['approved', 'live'])

    // Financial aggregates
    const allFinancials = (financialsRes.data || []).filter(((r: any) => { if (r.source_type === 'competition') return r.competition_registrations?.status !== 'cancelled' && r.competition_registrations?.status !== 'refunded'; return r.bookings?.booking_status !== 'cancelled' && r.bookings?.booking_status !== 'refunded'; }))
    const totalGMV = allFinancials.reduce((s, r) => s + Number(r.total_paid), 0)
    const totalTicketRevenue = allFinancials.reduce((s, r) => s + Number(r.ticket_subtotal), 0)
    const totalBookingFees = allFinancials.reduce((s, r) => s + Number(r.booking_fee), 0)
    const totalRazorpayFees = allFinancials.reduce((s, r) => s + Number(r.razorpay_fee), 0)
    const totalPlutoCommission = allFinancials.reduce((s, r) => s + Number(r.pluto_commission), 0)
    const totalOrganizerNet = allFinancials.reduce((s, r) => s + Number(r.organizer_net), 0)
    const totalPaidOut = (payoutsCompletedRes.data || []).reduce((s, r) => s + Number(r.amount), 0)

    const pendingPayouts = payoutsRequestedRes.data || []
    const pendingPayoutAmount = pendingPayouts.reduce((s, r) => s + Number(r.amount), 0)

    // This month vs last month growth
    const now = new Date()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString()

    const { count: thisMonthBookings } = await supabase
      .from('bookings').select('id', { count: 'exact', head: true })
      .gte('created_at', thisMonthStart).eq('booking_status', 'confirmed')

    const { count: thisMonthRegs } = await supabase
      .from('competition_registrations').select('id', { count: 'exact', head: true })
      .gte('created_at', thisMonthStart).in('status', ['confirmed', 'registered'])

    const { count: lastMonthBookings } = await supabase
      .from('bookings').select('id', { count: 'exact', head: true })
      .gte('created_at', lastMonthStart).lte('created_at', lastMonthEnd).eq('booking_status', 'confirmed')

    const { count: lastMonthRegs } = await supabase
      .from('competition_registrations').select('id', { count: 'exact', head: true })
      .gte('created_at', lastMonthStart).lte('created_at', lastMonthEnd).in('status', ['confirmed', 'registered'])

    res.json({
      totalUsers: usersRes.count || 0,
      totalOrganizers: uniqueOrganizers,
      totalEvents: (eventsRes.count || 0) + (compsRes.count || 0),
      activeEvents: (activeEvents || 0) + (activeComps || 0),
      totalBookings: (bookingsRes.count || 0) + (compRegRes.count || 0),
      pendingApprovals: (pendingApprovalsRes.count || 0) + (pendingCompsRes.count || 0),
      pendingPayoutCount: pendingPayouts.length,
      pendingPayoutAmount: Number(pendingPayoutAmount.toFixed(2)),

      // Financial
      totalGMV: Number(totalGMV.toFixed(2)),
      totalTicketRevenue: Number(totalTicketRevenue.toFixed(2)),
      totalBookingFees: Number(totalBookingFees.toFixed(2)),
      totalRazorpayFees: Number(totalRazorpayFees.toFixed(2)),
      totalPlutoCommission: Number(totalPlutoCommission.toFixed(2)),
      totalOrganizerNet: Number(totalOrganizerNet.toFixed(2)),
      totalPaidOut: Number(totalPaidOut.toFixed(2)),
      platformRevenue: Number(totalPlutoCommission.toFixed(2)),

      // Growth
      thisMonthBookings: (thisMonthBookings || 0) + (thisMonthRegs || 0),
      lastMonthBookings: (lastMonthBookings || 0) + (lastMonthRegs || 0),
    })
  } catch (err: any) {
    console.error('[pluto-hq/overview] Error:', err.message)
    res.status(500).json({ error: 'Failed to fetch overview.' })
  }
})


// ── GET /api/pluto-hq/organizers ─────────────────────────────
// Returns all organizers with their financial summaries
app.get('/api/pluto-hq/organizers', requireOwnerPin, async (_req: Request, res: Response) => {
  try {
    // Get all users who have created at least one event
    const { data: events } = await supabase
      .from('events')
      .select('created_by, id')

    const organizerIds = [...new Set((events || []).map(e => e.created_by))]

    if (organizerIds.length === 0) {
      return res.json({ organizers: [] })
    }

    // Fetch organizer user profiles
    const { data: users } = await supabase
      .from('users')
      .select('id, name, email, college_id, roles, bank_name, account_number, ifsc_code, upi_id, created_at, profile_avatar')
      .in('id', organizerIds)

    // Fetch all booking_financials for these organizers
    const { data: financials } = await supabase
      .from('booking_financials')
      .select('organizer_id, organizer_net, payout_status, bookings(booking_status), competition_registrations(status), source_type')
      .in('organizer_id', organizerIds)



    // Fetch all payouts for these organizers
    const { data: allPayouts } = await supabase
      .from('payouts')
      .select('organizer_id, amount, status')
      .in('organizer_id', organizerIds)

    // Fetch college names
    const collegeIds = [...new Set((users || []).filter(u => u.college_id).map(u => u.college_id))]
    let colleges: Record<string, string> = {}
    if (collegeIds.length > 0) {
      const { data: collegeRows } = await supabase
        .from('colleges')
        .select('id, name')
        .in('id', collegeIds)
      for (const c of (collegeRows || [])) {
        colleges[c.id] = c.name
      }
    }

    // Aggregate per organizer
    const organizers = (users || []).map(user => {
      const userEvents = (events || []).filter(e => e.created_by === user.id)
      const userFinancials = (financials || []).filter(((r: any) => { if (r.source_type === 'competition') return r.competition_registrations?.status !== 'cancelled' && r.competition_registrations?.status !== 'refunded'; return r.bookings?.booking_status !== 'cancelled' && r.bookings?.booking_status !== 'refunded'; })).filter(f => f.organizer_id === user.id)
      const userPayouts = (allPayouts || []).filter(p => p.organizer_id === user.id)

      const totalEarnings = userFinancials.reduce((s, f) => s + Number(f.organizer_net), 0)
      const unsettledBalance = userFinancials.filter(f => f.payout_status === 'unsettled').reduce((s, f) => s + Number(f.organizer_net), 0)
      const pendingPayouts = userPayouts.filter(p => p.status === 'requested' || p.status === 'processing')
      const pendingPayoutAmount = pendingPayouts.reduce((s, p) => s + Number(p.amount), 0)
      const totalPaidOut = userPayouts.filter(p => p.status === 'completed').reduce((s, p) => s + Number(p.amount), 0)

      const hasBankAccount = !!(user.account_number && user.ifsc_code)
      const hasUpi = !!user.upi_id

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        photo_url: user.profile_avatar || null,
        college: user.college_id ? (colleges[user.college_id] || 'Unknown') : null,
        college_id: user.college_id,
        roles: user.roles,
        type: user.college_id ? 'college' : '3rd_party',
        created_at: user.created_at,
        eventCount: userEvents.length,
        bookingCount: userFinancials.length,
        totalEarnings: Number(totalEarnings.toFixed(2)),
        unsettledBalance: Number(unsettledBalance.toFixed(2)),
        pendingPayoutAmount: Number(pendingPayoutAmount.toFixed(2)),
        totalPaidOut: Number(totalPaidOut.toFixed(2)),
        bankLinked: hasBankAccount || hasUpi,
        bankDetails: {
          bank_name: user.bank_name || null,
          account_number: user.account_number || null,
          ifsc_code: user.ifsc_code || null,
          upi_id: user.upi_id || null,
        },
      }
    })

    // Sort: college organizers first, then 3rd party, then by earnings desc
    organizers.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'college' ? -1 : 1
      return b.totalEarnings - a.totalEarnings
    })

    res.json({ organizers })
  } catch (err: any) {
    console.error('[pluto-hq/organizers] Error:', err.message)
    res.status(500).json({ error: 'Failed to fetch organizers.' })
  }
})


// ── GET /api/pluto-hq/payouts ────────────────────────────────
// Returns all payout requests across all organizers with bank details
app.get('/api/pluto-hq/payouts', requireOwnerPin, async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined

    let query = supabase
      .from('payouts')
      .select('*')
      .order('requested_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data: payouts, error } = await query

    if (error) {
      console.error('[pluto-hq/payouts] Query error:', error.message)
      return res.status(500).json({ error: 'Failed to fetch payouts.' })
    }

    // Enrich with organizer details
    const organizerIds = [...new Set((payouts || []).map(p => p.organizer_id))]
    let usersMap: Record<string, any> = {}

    if (organizerIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, name, email, bank_name, account_number, account_name, ifsc_code, upi_id, college_id, profile_avatar')
        .in('id', organizerIds)

      for (const u of (users || [])) {
        usersMap[u.id] = u
      }
    }

    const enrichedPayouts = (payouts || []).map(p => {
      const user = usersMap[p.organizer_id] || {}
      return {
        ...p,
        organizer: {
          name: user.name || 'Unknown',
          email: user.email || '',
          college_id: user.college_id || null,
          bank_name: user.bank_name || null,
          account_name: user.account_name || null,
          account_number: user.account_number || null,
          ifsc_code: user.ifsc_code || null,
          upi_id: user.upi_id || null,
          photo_url: user.profile_avatar || null,
        }
      }
    })

    res.json({ payouts: enrichedPayouts })
  } catch (err: any) {
    console.error('[pluto-hq/payouts] Error:', err.message)
    res.status(500).json({ error: 'Failed to fetch payouts.' })
  }
})


// ── POST /api/pluto-hq/payouts/:id/process ───────────────────
// Process a payout request: approve, mark completed, or reject
app.post('/api/pluto-hq/payouts/:id/process', requireOwnerPin, async (req: Request, res: Response) => {
  try {
    const payoutId = req.params.id
    const { action, referenceNumber, failureReason } = req.body as {
      action: 'approve' | 'complete' | 'reject'
      referenceNumber?: string
      failureReason?: string
    }

    if (!payoutId || !action) {
      return res.status(400).json({ error: 'payoutId and action are required.' })
    }

    // Fetch the payout
    const { data: payout, error: fetchError } = await supabase
      .from('payouts')
      .select('*')
      .eq('id', payoutId)
      .single()

    if (fetchError || !payout) {
      return res.status(404).json({ error: 'Payout not found.' })
    }

    if (action === 'approve') {
      // Move from 'requested' → 'processing'
      if (payout.status !== 'requested') {
        return res.status(400).json({ error: `Cannot approve a payout with status: ${payout.status}` })
      }

      await supabase
        .from('payouts')
        .update({ status: 'processing', processed_at: new Date().toISOString() })
        .eq('id', payoutId)

      console.log(`[pluto-hq] Payout ${payoutId} approved → processing`)
      return res.json({ success: true, message: 'Payout approved and moved to processing.' })
    }

    if (action === 'complete') {
      // Move from 'processing' → 'completed'
      if (payout.status !== 'processing' && payout.status !== 'requested') {
        return res.status(400).json({ error: `Cannot complete a payout with status: ${payout.status}` })
      }

      await supabase
        .from('payouts')
        .update({
          status: 'completed',
          reference_number: referenceNumber || null,
          payout_method: payout.payout_method || 'bank_transfer',
          processed_at: new Date().toISOString(),
        })
        .eq('id', payoutId)

      // Mark all linked booking_financials as 'settled'
      await supabase
        .from('booking_financials')
        .update({ payout_status: 'settled' })
        .eq('payout_id', payoutId)

      console.log(`[pluto-hq] Payout ${payoutId} completed (UTR: ${referenceNumber || 'N/A'})`)
      return res.json({ success: true, message: 'Payout marked as completed. All linked bookings settled.' })
    }

    if (action === 'reject') {
      // Move to 'failed', release booking_financials back to 'unsettled'
      await supabase
        .from('payouts')
        .update({
          status: 'failed',
          failure_reason: failureReason || 'Rejected by admin',
          processed_at: new Date().toISOString(),
        })
        .eq('id', payoutId)

      // Release booking_financials back to unsettled
      await supabase
        .from('booking_financials')
        .update({ payout_status: 'unsettled', payout_id: null })
        .eq('payout_id', payoutId)

      console.log(`[pluto-hq] Payout ${payoutId} rejected: ${failureReason || 'No reason'}`)
      return res.json({ success: true, message: 'Payout rejected. Funds released back to organizer.' })
    }

    return res.status(400).json({ error: 'Invalid action. Use: approve, complete, or reject.' })
  } catch (err: any) {
    console.error('[pluto-hq/process] Error:', err.message)
    res.status(500).json({ error: 'Failed to process payout.' })
  }
})


// ── GET /api/pluto-hq/revenue ────────────────────────────────
// Pluto's revenue breakdown — commissions, fees, costs
app.get('/api/pluto-hq/revenue', requireOwnerPin, async (_req: Request, res: Response) => {
  try {
    // Fetch all booking_financials with event + organizer info
    const { data: financials, error } = await supabase
      .from('booking_financials')
      .select(`
        id, event_id, competition_id, organizer_id,
        ticket_subtotal, booking_fee, total_paid,
        razorpay_fee, pluto_commission, organizer_net,
        payout_status, created_at,
        events(title), competitions(title),
        bookings(users(name, email), booking_status), competition_registrations(users(name, email), status), source_type
      `)


      .order('created_at', { ascending: false })

    if (error) {
      console.error('[pluto-hq/revenue] Query error:', error.message)
      // Fallback without joins
      const { data: fallback } = await supabase
        .from('booking_financials')
        .select('*')
        .order('created_at', { ascending: false })

      const all = (fallback || []).filter(((r: any) => { if (r.source_type === 'competition') return r.competition_registrations?.status !== 'cancelled' && r.competition_registrations?.status !== 'refunded'; return r.bookings?.booking_status !== 'cancelled' && r.bookings?.booking_status !== 'refunded'; }))
      const totalCommission = all.reduce((s, r) => s + Number(r.pluto_commission), 0)
      const totalBookingFees = all.reduce((s, r) => s + Number(r.booking_fee), 0)
      const totalRazorpayFees = all.reduce((s, r) => s + Number(r.razorpay_fee), 0)

      return res.json({
        transactions: all,
        summary: {
          totalCommission: Number(totalCommission.toFixed(2)),
          totalBookingFees: Number(totalBookingFees.toFixed(2)),
          totalRazorpayFees: Number(totalRazorpayFees.toFixed(2)),
          netPlatformProfit: Number(totalCommission.toFixed(2)),
          totalTransactions: all.length,
        }
      })
    }

    const all = (financials || []).filter(((r: any) => { if (r.source_type === 'competition') return r.competition_registrations?.status !== 'cancelled' && r.competition_registrations?.status !== 'refunded'; return r.bookings?.booking_status !== 'cancelled' && r.bookings?.booking_status !== 'refunded'; }))
    const totalCommission = all.reduce((s, r) => s + Number(r.pluto_commission), 0)
    const totalBookingFees = all.reduce((s, r) => s + Number(r.booking_fee), 0)
    const totalRazorpayFees = all.reduce((s, r) => s + Number(r.razorpay_fee), 0)
    const totalGMV = all.reduce((s, r) => s + Number(r.total_paid), 0)
    const totalOrganizerNet = all.reduce((s, r) => s + Number(r.organizer_net), 0)

    // Per-event breakdown
    const eventMap: Record<string, any> = {}
    for (const row of all) {
      const isComp = row.source_type === 'competition'
      const eid = isComp ? row.competition_id : row.event_id
      if (!eid) continue // Skip if null
      if (!eventMap[eid]) {
        eventMap[eid] = {
          event_id: eid,
          source_type: row.source_type || 'event',
          event_title: isComp ? ((row as any).competitions?.title || 'Unknown') : ((row as any).events?.title || 'Unknown'),
          bookings: 0,
          ticket_revenue: 0,
          booking_fees: 0,
          commission: 0,
          razorpay_cost: 0,
          organizer_net: 0,
          net_profit: 0,
        }
      }
      eventMap[eid].bookings += 1
      eventMap[eid].ticket_revenue += Number(row.ticket_subtotal)
      eventMap[eid].booking_fees += Number(row.booking_fee)
      eventMap[eid].commission += Number(row.pluto_commission)
      eventMap[eid].razorpay_cost += Number(row.razorpay_fee)
      eventMap[eid].organizer_net += Number(row.organizer_net)
      eventMap[eid].net_profit += Number(row.pluto_commission)
    }

    const eventBreakdown = Object.values(eventMap).sort((a: any, b: any) => b.net_profit - a.net_profit)

    // Round all values
    for (const e of eventBreakdown) {
      for (const key of Object.keys(e)) {
        if (typeof (e as any)[key] === 'number') {
          (e as any)[key] = Number(((e as any)[key] as number).toFixed(2))
        }
      }
    }

    res.json({
      transactions: all,
      eventBreakdown,
      summary: {
        totalGMV: Number(totalGMV.toFixed(2)),
        totalCommission: Number(totalCommission.toFixed(2)),
        totalBookingFees: Number(totalBookingFees.toFixed(2)),
        totalRazorpayFees: Number(totalRazorpayFees.toFixed(2)),
        totalOrganizerNet: Number(totalOrganizerNet.toFixed(2)),
        netPlatformProfit: Number(totalCommission.toFixed(2)),
        totalTransactions: all.length,
      }
    })
  } catch (err: any) {
    console.error('[pluto-hq/revenue] Error:', err.message)
    res.status(500).json({ error: 'Failed to fetch revenue data.' })
  }
})


// ============================================================
// PLUTO OWNER HQ — College Request Management
// Endpoints for reviewing and approving college registrations
// ============================================================

// ── GET /api/pluto-hq/college-requests ───────────────────────
// List all college requests with optional status filter
app.get('/api/pluto-hq/college-requests', requireOwnerPin, async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined
    let query = supabase
      .from('college_requests')
      .select('*')
      .order('submitted_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query
    if (error) throw error

    res.json({ requests: data || [] })
  } catch (err: any) {
    console.error('[pluto-hq/college-requests] Error:', err.message)
    res.status(500).json({ error: 'Failed to fetch college requests.' })
  }
})

// ── GET /api/pluto-hq/college-requests/:id ───────────────────
// Get single college request detail
app.get('/api/pluto-hq/college-requests/:id', requireOwnerPin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { data, error } = await supabase
      .from('college_requests')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    res.json(data)
  } catch (err: any) {
    console.error('[pluto-hq/college-requests/:id] Error:', err.message)
    res.status(500).json({ error: 'Failed to fetch college request.' })
  }
})

// ── Utility: Generate slug from college name ─────────────────
function collegeSlug(name: string): string {
  // "Saraswati College of Engineering, Kharghar" → "scoe"
  // Take first letter of each significant word
  const words = name.replace(/,.*$/, '').trim().split(/\s+/)
  const skipWords = ['of', 'and', 'the', 'for', 'in', 'at', 'by']
  const slug = words
    .filter(w => !skipWords.includes(w.toLowerCase()))
    .map(w => w[0]?.toLowerCase() || '')
    .join('')
  return slug || 'college'
}

function deptSlug(dept: string): string {
  // "Computer Engineering" → "ce"
  // "Information Technology" → "it"
  // "CSE AI & ML" → "cseaiml"
  const words = dept.split(/[\s&]+/)
  const skipWords = ['of', 'and', 'the', 'for', 'in', 'at', 'by']
  if (words.length === 1) return words[0].toLowerCase().slice(0, 4)
  return words
    .filter(w => !skipWords.includes(w.toLowerCase()))
    .map(w => w[0]?.toLowerCase() || '')
    .join('')
}

function generatePassword(length: number = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$'
  let pwd = ''
  for (let i = 0; i < length; i++) {
    pwd += chars[Math.floor(Math.random() * chars.length)]
  }
  return pwd
}

// ── POST /api/pluto-hq/college-requests/:id/approve ──────────
// Approves a college request:
// 1. Creates college in colleges table
// 2. Populates college_departments
// 3. Generates admin credentials (ce.scoe@plutocampus format)
// 4. Creates Supabase auth accounts
// 5. Returns generated credentials
app.post('/api/pluto-hq/college-requests/:id/approve', requireOwnerPin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // 1. Fetch the request
    const { data: request, error: fetchErr } = await supabase
      .from('college_requests')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchErr || !request) {
      return res.status(404).json({ error: 'College request not found.' })
    }

    if (request.status === 'approved') {
      return res.status(400).json({ error: 'This request is already approved.' })
    }

    const slug = collegeSlug(request.college_name)

    // 2. Create college in colleges table
    const { data: college, error: collegeErr } = await supabase
      .from('colleges')
      .insert({
        name: request.college_name,
        city: request.city,
        state: request.state,
        contact_email: request.college_email,
        contact_phone: request.contact_phone,
        website_url: request.website_url,
        affiliation: request.affiliation,
        student_count: request.student_count,
        logo_url: request.logo_url,
        is_verified: true,
      })
      .select('id')
      .single()

    if (collegeErr || !college) {
      console.error('[approve] Failed to create college:', collegeErr?.message)
      throw new Error('Failed to create college record.')
    }

    const collegeId = college.id

    // 3. Populate college_departments
    const courses: { name: string; departments: string[]; duration_years?: number; enableSections?: boolean; departmentSections?: Record<string, Record<string, string[]>> }[] = request.courses || []
    const deptRows: { college_id: string; course: string; department: string; duration_years: number; sections: Record<string, string[]> }[] = []

    for (const course of courses) {
      const duration = course.duration_years || 4
      for (const dept of course.departments) {
        // Get sections for this department if sections are enabled
        const sections: Record<string, string[]> = (course.enableSections !== false && course.departmentSections?.[dept])
          ? course.departmentSections[dept]
          : {}
        deptRows.push({ college_id: collegeId, course: course.name, department: dept, duration_years: duration, sections })
      }
    }

    if (deptRows.length > 0) {
      const { error: deptErr } = await supabase.from('college_departments').insert(deptRows)
      if (deptErr) {
        console.error('[approve] Failed to insert departments:', deptErr.message)
        // Non-fatal, continue
      }
    }

    // 4. Generate admin credentials
    const credentials: { username: string; password: string; admin_type: string; department?: string; course?: string }[] = []

    // College Admin
    const collegeAdminUsername = `admin.${slug}@plutocampus`
    const collegeAdminPassword = generatePassword()
    credentials.push({
      username: collegeAdminUsername,
      password: collegeAdminPassword,
      admin_type: 'college_admin',
    })

    // Department Admins (one per unique department across all courses)
    const seenDepts = new Set<string>()
    for (const course of courses) {
      for (const dept of course.departments) {
        let dSlug = deptSlug(dept)
        let key = `${dSlug}.${slug}`

        let counter = 1
        while (seenDepts.has(key)) {
          dSlug = `${deptSlug(dept)}${counter}`
          key = `${dSlug}.${slug}`
          counter++
        }
        seenDepts.add(key)

        const deptUsername = `${dSlug}.${slug}@plutocampus`
        const deptPassword = generatePassword()
        credentials.push({
          username: deptUsername,
          password: deptPassword,
          admin_type: 'department_admin',
          department: dept,
          course: course.name,
        })
      }
    }

    // 5. Create Supabase auth accounts + insert credential records
    const credentialRecords: any[] = []

    for (const cred of credentials) {
      // Create auth user
      const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
        email: cred.username,
        password: cred.password,
        email_confirm: true,
        user_metadata: {
          name: cred.admin_type === 'college_admin'
            ? `${request.college_name} Admin`
            : `${cred.department} Admin`,
          admin_type: cred.admin_type,
          college_name: request.college_name,
        },
      })

      let userId = authUser?.user?.id || null

      // If auth user was created, update the public.users row
      if (userId) {
        await supabase.from('users').update({
          college_id: collegeId,
          admin_type: cred.admin_type,
          department: cred.department || null,
          course: cred.course || null,
          roles: ['admin'],
        }).eq('id', userId)
      }

      credentialRecords.push({
        college_id: collegeId,
        admin_type: cred.admin_type,
        department: cred.department || null,
        course: cred.course || null,
        username: cred.username,
        password: cred.password,
        user_id: userId,
        is_active: true,
      })
    }

    // Insert credential records
    if (credentialRecords.length > 0) {
      const { error: credErr } = await supabase.from('admin_credentials').insert(credentialRecords)
      if (credErr) {
        console.error('[approve] Failed to insert credentials:', credErr.message)
      }
    }

    // 6. Update the request status
    await supabase
      .from('college_requests')
      .update({ status: 'approved', reviewed_at: new Date().toISOString() })
      .eq('id', id)

    console.log(`[pluto-hq] College "${request.college_name}" approved. ${credentials.length} admin credentials generated.`)

    res.json({
      success: true,
      college_id: collegeId,
      credentials: credentials.map(c => ({
        username: c.username,
        password: c.password,
        admin_type: c.admin_type,
        department: c.department || null,
      })),
    })
  } catch (err: any) {
    console.error('[pluto-hq/approve] Error:', err.message)
    res.status(500).json({ error: err.message || 'Failed to approve college request.' })
  }
})

// ── POST /api/pluto-hq/college-requests/:id/reject ──────────
app.post('/api/pluto-hq/college-requests/:id/reject', requireOwnerPin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { reason } = req.body

    const { error } = await supabase
      .from('college_requests')
      .update({
        status: 'rejected',
        rejection_reason: reason || 'No reason provided.',
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) throw error

    console.log(`[pluto-hq] College request ${id} rejected.`)
    res.json({ success: true, message: 'Request rejected.' })
  } catch (err: any) {
    console.error('[pluto-hq/reject] Error:', err.message)
    res.status(500).json({ error: 'Failed to reject request.' })
  }
})

// ── GET /api/pluto-hq/colleges ──────────────────────────────
// List all onboarded colleges with stats
app.get('/api/pluto-hq/colleges', requireOwnerPin, async (_req: Request, res: Response) => {
  try {
    const { data: colleges, error } = await supabase
      .from('colleges')
      .select('id, name, city, state, contact_email, is_verified, logo_url, created_at')
      .order('created_at', { ascending: false })

    if (error) throw error

    // Get stats per college
    const collegesWithStats = await Promise.all(
      (colleges || []).map(async (col) => {
        const [usersRes, eventsRes, compsRes] = await Promise.all([
          supabase.from('users').select('id', { count: 'exact', head: true }).eq('college_id', col.id),
          supabase.from('events').select('id', { count: 'exact', head: true }).eq('college_id', col.id),
          supabase.from('competitions').select('id', { count: 'exact', head: true }).eq('college_id', col.id),
        ])

        return {
          ...col,
          user_count: usersRes.count || 0,
          event_count: eventsRes.count || 0,
          competition_count: compsRes.count || 0,
        }
      })
    )

    res.json({ colleges: collegesWithStats })
  } catch (err: any) {
    console.error('[pluto-hq/colleges] Error:', err.message)
    res.status(500).json({ error: 'Failed to fetch colleges.' })
  }
})


// ============================================================
// AI PROXY ENDPOINTS — Securely proxy Groq API calls
// Supports multiple API keys with automatic rotation on rate limits.
// The keys never leave the server.
// ============================================================

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

// Load keys: supports both GROQ_API_KEYS (comma-separated) and single GROQ_API_KEY
const GROQ_API_KEYS: string[] = (
  process.env.GROQ_API_KEYS
    ? process.env.GROQ_API_KEYS.split(',').map(k => k.trim()).filter(Boolean)
    : process.env.GROQ_API_KEY
      ? [process.env.GROQ_API_KEY.trim()]
      : []
)

let groqKeyIndex = 0 // Round-robin index for spreading load across keys

if (GROQ_API_KEYS.length === 0) {
  console.warn('[AI] ⚠️ No GROQ API keys configured. Set GROQ_API_KEYS or GROQ_API_KEY in .env')
} else {
  console.log(`[AI] 🔑 Loaded ${GROQ_API_KEYS.length} Groq API key(s) with auto-rotation`)
}

/**
 * Shared helper: proxies a request to Groq with automatic key rotation.
 * On a 429 (rate limit), it retries with the next key in the pool.
 * Cycles through all keys before giving up.
 */
async function proxyToGroq(body: any): Promise<{ status: number; data: any }> {
  if (GROQ_API_KEYS.length === 0) {
    return { status: 503, data: { error: 'AI service is not configured.' } }
  }

  const totalKeys = GROQ_API_KEYS.length
  const startIndex = groqKeyIndex

  for (let attempt = 0; attempt < totalKeys; attempt++) {
    const keyIdx = (startIndex + attempt) % totalKeys
    const apiKey = GROQ_API_KEYS[keyIdx]

    const groqRes = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    })

    const data: any = await groqRes.json()

    if (groqRes.status === 429) {
      // Rate limited — rotate to the next key and retry
      console.warn(`[AI Proxy] Key #${keyIdx + 1}/${totalKeys} rate-limited. Rotating to next key...`)
      continue
    }

    // Advance the round-robin index for the next request (spreads load evenly)
    groqKeyIndex = (keyIdx + 1) % totalKeys

    if (!groqRes.ok) {
      console.error('[AI Proxy] Groq API error:', data?.error?.message || groqRes.status)
      return { status: groqRes.status, data: { error: data?.error?.message || 'AI service error.' } }
    }

    return { status: 200, data }
  }

  // All keys exhausted
  console.error(`[AI Proxy] All ${totalKeys} Groq keys are rate-limited.`)
  groqKeyIndex = (startIndex + 1) % totalKeys // Advance for the next request
  return { status: 429, data: { error: 'All AI keys are currently rate-limited. Please wait a moment and try again.' } }
}

// ── POST /api/ai/chat ────────────────────────────────────────
// General-purpose AI chat proxy (portfolio insights, AI mentor)
// Supports tool calling (passes tools/tool_choice through transparently)
app.post('/api/ai/chat', aiLimiter, async (req: Request, res: Response) => {
  try {
    const { messages, model, max_tokens, temperature, tools, tool_choice } = req.body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required.' })
    }
    if (max_tokens && max_tokens > 1200) {
      return res.status(400).json({ error: 'max_tokens cannot exceed 1200.' })
    }

    const body: any = {
      model: model || 'qwen/qwen3.8-27b',
      messages,
      max_tokens: max_tokens || 600,
      temperature: temperature ?? 0.5,
    }

    // Pass through tool calling if provided
    if (tools) body.tools = tools
    if (tool_choice) body.tool_choice = tool_choice

    const { status, data } = await proxyToGroq(body)
    res.status(status).json(data)
  } catch (err: any) {
    console.error('[/api/ai/chat] Error:', err.message)
    res.status(500).json({ error: 'AI request failed.' })
  }
})

// ── POST /api/ai/evaluate ────────────────────────────────────
// Event journal AI evaluation (returns bonusPoints + aiInsight)
app.post('/api/ai/evaluate', aiLimiter, async (req: Request, res: Response) => {
  try {
    const { messages, max_tokens, temperature } = req.body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required.' })
    }

    const { status, data } = await proxyToGroq({
      model: 'qwen/qwen3.8-27b',
      messages,
      max_tokens: max_tokens || 600,
      temperature: temperature ?? 0.6,
    })

    res.status(status).json(data)
  } catch (err: any) {
    console.error('[/api/ai/evaluate] Error:', err.message)
    res.status(500).json({ error: 'AI evaluation failed.' })
  }
})

// ── POST /api/ai/recommend ───────────────────────────────────
// AI event recommendations based on portfolio profile
app.post('/api/ai/recommend', aiLimiter, async (req: Request, res: Response) => {
  try {
    const { messages, temperature, response_format } = req.body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required.' })
    }

    const body: any = {
      model: 'qwen/qwen3.8-27b',
      messages,
      temperature: temperature ?? 0.2,
    }

    if (response_format) body.response_format = response_format

    const { status, data } = await proxyToGroq(body)
    res.status(status).json(data)
  } catch (err: any) {
    console.error('[/api/ai/recommend] Error:', err.message)
    res.status(500).json({ error: 'AI recommendation failed.' })
  }
})


// ============================================================
// INITIALIZE CRON JOBS
// ============================================================
import { initCronJobs } from './cron';
initCronJobs();

// ============================================================
// START SERVER
// ============================================================
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log('')
  console.log('  ╔═══════════════════════════════════════════════╗')
  console.log('  ║         PLUTO Payment Backend                 ║')
  console.log('  ║─────────────────────────────────────────────  ║')
  console.log(`  ║  🚀 Server running on port ${PORT}              ║`)
  console.log(`  ║  🔑 Razorpay Key: ${(process.env.RAZORPAY_KEY_ID || '').slice(0, 18)}...  ║`)
  console.log('  ║  📦 Payment Model: Option A (Collect All)     ║')
  console.log('  ╚═══════════════════════════════════════════════╝')
  console.log('')
  console.log('  Endpoints:')
  console.log('    GET  /api/payment/config              → Public Razorpay key')
  console.log('    POST /api/payment/create-order        → Create Razorpay order')
  console.log('    POST /api/payment/verify              → Verify payment + create booking')
  console.log('    GET  /api/payment/refund-eligibility  → Check refund eligibility')
  console.log('    POST /api/payment/refund              → Process Razorpay refund')
  console.log('    GET  /api/payouts/summary             → Organizer payout summary')
  console.log('    GET  /api/payouts/transactions        → Booking financials ledger')
  console.log('    GET  /api/payouts/history             → Payout history')
  console.log('    POST /api/payouts/request             → Request withdrawal')
  console.log('    GET  /health                          → Health check')
  console.log('    POST /api/ai/chat                     → AI chat proxy (rate-limited)')
  console.log('    POST /api/ai/evaluate                 → AI event eval proxy (rate-limited)')
  console.log('    POST /api/ai/recommend                → AI recommendation proxy (rate-limited)')
  console.log(`    🤖 Groq AI: ${GROQ_API_KEYS.length > 0 ? `${GROQ_API_KEYS.length} key(s) loaded ✅` : 'NOT CONFIGURED ❌'}`)
  console.log('')
})
