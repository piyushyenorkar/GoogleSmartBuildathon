/**
 * Payout Service — API calls for the organizer payout system.
 * Uses the shared api() wrapper from lib/api.ts
 */

import { api } from '@/lib/api'

// ── Types ────────────────────────────────────────────────────

export interface PayoutSummary {
  availableBalance: number
  heldBalance: number
  inTransit: number
  totalWithdrawn: number
  lifetimeEarnings: number
  bankLinked: boolean
  bankInfo: {
    bank_name: string | null
    account_number: string | null  // masked: ****1234
    upi_id: string | null
    account_holder_name: string | null
  } | null
}

export interface PayoutTransaction {
  id: string
  booking_id: string
  event_id: string
  ticket_subtotal: number
  booking_fee: number
  total_paid: number
  razorpay_fee: number
  pluto_commission: number
  organizer_net: number
  net_payout?: number // added based on usage
  payout_status: 'unsettled' | 'included' | 'settled'
  created_at: string
  source_type?: 'event' | 'competition'
  competitions?: {
    id: string
    title: string
  }
  competition_registrations?: {
    id: string
    status: string
    registration_type?: string
    competition_teams?: {
      name: string
      team_size?: number
    }
    users?: {
      name: string
      email: string
    }
  }
  bookings?: {
    id: string
    user_id: string
    quantity: number
    booking_status: string
    created_at: string
    selected_seats?: any[]
    users?: {
      name: string
      email: string
    }
  }
  events?: {
    id: string
    title: string
  }
}

export interface Payout {
  id: string
  organizer_id: string
  amount: number
  booking_count: number
  status: 'requested' | 'processing' | 'completed' | 'failed'
  payout_method: string | null
  reference_number: string | null
  failure_reason: string | null
  processed_by: string | null
  requested_at: string
  processed_at: string | null
  created_at: string
}

export interface RequestPayoutResponse {
  success: boolean
  payout_id: string
  amount: number
  booking_count: number
  message: string
}

// ── API Calls ────────────────────────────────────────────────

export async function fetchPayoutSummary(userEmail: string): Promise<PayoutSummary> {
  return api<PayoutSummary>(`/api/payouts/summary?userEmail=${encodeURIComponent(userEmail)}`)
}

export async function fetchPayoutTransactions(userEmail: string): Promise<{ transactions: PayoutTransaction[] }> {
  return api<{ transactions: PayoutTransaction[] }>(`/api/payouts/transactions?userEmail=${encodeURIComponent(userEmail)}`)
}

export async function fetchPayoutHistory(userEmail: string): Promise<{ payouts: Payout[] }> {
  return api<{ payouts: Payout[] }>(`/api/payouts/history?userEmail=${encodeURIComponent(userEmail)}`)
}

export async function requestPayout(userEmail: string): Promise<RequestPayoutResponse> {
  return api<RequestPayoutResponse>('/api/payouts/request', {
    method: 'POST',
    body: { userEmail },
  })
}
