/**
 * Pluto Owner HQ — API Service Layer
 * All calls inject x-pluto-pin header for authentication.
 * Talks to the same shared backend as pluto_web.
 */

const API_BASE = import.meta.env.VITE_API_BASE || ''

function getStoredPin(): string {
  return sessionStorage.getItem('pluto-owner-pin') || ''
}

async function hqApi<T = unknown>(endpoint: string, options: {
  method?: string
  body?: Record<string, unknown>
} = {}): Promise<T> {
  const { method = 'GET', body } = options
  const pin = getStoredPin()

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-pluto-pin': pin,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || `API Error ${res.status}`)
  }

  return res.json()
}

// ── Types ────────────────────────────────────────────────────

export interface HQOverview {
  totalUsers: number
  totalOrganizers: number
  totalEvents: number
  activeEvents: number
  totalBookings: number
  pendingApprovals: number
  pendingPayoutCount: number
  pendingPayoutAmount: number
  totalGMV: number
  totalTicketRevenue: number
  totalBookingFees: number
  totalRazorpayFees: number
  totalPlutoCommission: number
  totalOrganizerNet: number
  totalPaidOut: number
  platformRevenue: number
  thisMonthBookings: number
  lastMonthBookings: number
}

export interface HQOrganizer {
  id: string
  name: string
  email: string
  photo_url: string | null
  college: string | null
  college_id: string | null
  roles: string[]
  type: 'college' | '3rd_party'
  created_at: string
  eventCount: number
  bookingCount: number
  totalEarnings: number
  unsettledBalance: number
  pendingPayoutAmount: number
  totalPaidOut: number
  bankLinked: boolean
  bankDetails: {
    bank_name: string | null
    account_number: string | null
    ifsc_code: string | null
    upi_id: string | null
  }
}

export interface HQPayout {
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
  organizer: {
    name: string
    email: string
    college_id: string | null
    bank_name: string | null
    account_name: string | null
    account_number: string | null
    ifsc_code: string | null
    upi_id: string | null
    photo_url?: string | null
  }
}

export interface HQRevenueEvent {
  event_id: string
  source_type: 'event' | 'competition'
  event_title: string
  bookings: number
  ticket_revenue: number
  booking_fees: number
  commission: number
  razorpay_cost: number
  organizer_net: number
  net_profit: number
}

export interface HQRevenueSummary {
  totalGMV: number
  totalCommission: number
  totalBookingFees: number
  totalRazorpayFees: number
  totalOrganizerNet: number
  netPlatformProfit: number
  totalTransactions: number
}

// ── API Calls ────────────────────────────────────────────────

export async function verifyPin(pin: string): Promise<{ valid: boolean }> {
  const res = await fetch(`${API_BASE}/api/pluto-hq/verify-pin`, {
    headers: { 'x-pluto-pin': pin },
  })
  return res.json()
}

export function fetchHQOverview() {
  return hqApi<HQOverview>('/api/pluto-hq/overview')
}

export function fetchHQOrganizers() {
  return hqApi<{ organizers: HQOrganizer[] }>('/api/pluto-hq/organizers')
}

export function fetchHQPayouts(status?: string) {
  const url = status
    ? `/api/pluto-hq/payouts?status=${status}`
    : '/api/pluto-hq/payouts'
  return hqApi<{ payouts: HQPayout[] }>(url)
}

export function processHQPayout(payoutId: string, data: {
  action: 'approve' | 'complete' | 'reject'
  referenceNumber?: string
  failureReason?: string
}) {
  return hqApi<{ success: boolean; message: string }>(
    `/api/pluto-hq/payouts/${payoutId}/process`,
    { method: 'POST', body: data as any }
  )
}

export function fetchHQRevenue() {
  return hqApi<{
    transactions: any[]
    eventBreakdown: HQRevenueEvent[]
    summary: HQRevenueSummary
  }>('/api/pluto-hq/revenue')
}

// ── College Requests ─────────────────────────────────────────

export interface CollegeRequest {
  id: string
  college_name: string
  college_email: string
  contact_phone: string
  city: string | null
  state: string | null
  address: string | null
  website_url: string | null
  affiliation: string | null
  established_year: number | null
  student_count: number | null
  logo_url: string | null
  courses: { name: string; departments: string[] }[]
  status: 'pending' | 'under_review' | 'approved' | 'rejected'
  rejection_reason: string | null
  reviewed_at: string | null
  submitted_at: string
  updated_at: string
}

export interface CollegeWithStats {
  id: string
  name: string
  city: string | null
  state: string | null
  contact_email: string | null
  logo_url: string | null
  is_verified: boolean
  created_at: string
  user_count: number
  event_count: number
  competition_count: number
}

export interface ApproveResult {
  success: boolean
  college_id: string
  credentials: {
    username: string
    password: string
    admin_type: string
    department: string | null
  }[]
}

export function fetchCollegeRequests(status?: string) {
  const url = status
    ? `/api/pluto-hq/college-requests?status=${status}`
    : '/api/pluto-hq/college-requests'
  return hqApi<{ requests: CollegeRequest[] }>(url)
}

export function fetchCollegeRequestDetail(id: string) {
  return hqApi<CollegeRequest>(`/api/pluto-hq/college-requests/${id}`)
}

export function approveCollegeRequest(id: string) {
  return hqApi<ApproveResult>(
    `/api/pluto-hq/college-requests/${id}/approve`,
    { method: 'POST' }
  )
}

export function rejectCollegeRequest(id: string, reason: string) {
  return hqApi<{ success: boolean; message: string }>(
    `/api/pluto-hq/college-requests/${id}/reject`,
    { method: 'POST', body: { reason } }
  )
}

export function fetchAllColleges() {
  return hqApi<{ colleges: CollegeWithStats[] }>('/api/pluto-hq/colleges')
}
