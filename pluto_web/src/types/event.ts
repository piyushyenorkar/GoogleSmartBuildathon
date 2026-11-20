import type { EventCategory } from '@/lib/constants'
import type { CustomFormConfig } from './form'

export interface Event {
  id: string
  title: string
  description?: string
  category: EventCategory
  type?: 'event' | 'announcement'

  // Dates & Times
  start_date: string
  end_date?: string
  start_time?: string
  end_time?: string
  /** @deprecated — use start_time */
  time?: string

  // Location
  venue?: string
  city?: string
  state?: string
  department?: string
  target_years?: string[]
  target_sections?: Record<string, string[]>
  course?: string
  target_departments?: Array<{ department: string, course?: string, years?: string[], sections?: Record<string, string[]> }>


  // Media
  banner_url?: string
  poster_url?: string

  // Pricing & Tickets
  price?: number
  ticket_price?: number
  max_tickets?: number
  ticket_limit?: number
  ticket_type?: 'free' | 'simple' | 'seated'
  has_seating?: boolean
  seat_layout?: Record<string, unknown>
  refund_policy?: string

  // Visibility
  is_universal?: boolean
  /** @deprecated — use is_universal */
  isUniversal?: boolean

  // Status
  status: 'pending' | 'approved' | 'live' | 'rejected' | 'completed'

  // Relations
  college_id?: string
  created_by?: string
  organizer_id?: string
  organizer_name?: string
  organizer_email?: string
  speaker_name?: string
  speaker_org?: string
  college_name?: string

  // Timestamps
  created_at: string
  updated_at?: string
}

export interface EventCreate {
  title: string
  description?: string
  category: EventCategory
  type?: 'event' | 'announcement'
  start_date: string
  end_date?: string
  start_time?: string
  end_time?: string
  venue?: string
  city?: string
  state?: string
  department?: string
  target_years?: string[]
  target_sections?: Record<string, string[]>
  course?: string
  target_departments?: Array<{ department: string, course?: string, years?: string[], sections?: Record<string, string[]> }>
  banner_url?: string
  price?: number
  ticket_price?: number
  max_tickets?: number
  ticket_limit?: number
  ticket_type?: 'free' | 'simple' | 'seated'
  has_seating?: boolean
  seat_layout?: Record<string, unknown>
  is_universal?: boolean
  refund_policy?: string
  speaker_name?: string
  speaker_org?: string
}

// ── Competition Types ──────────────────────────────────────

export interface CompetitionStage {
  name: string
  description?: string
  start_date: string
  end_date: string
  submission_types?: ('ppt' | 'github' | 'video' | 'link' | 'none')[]
  order: number
}

export interface CompetitionPrize {
  rank: string
  title: string
  amount: number
  description?: string
  certificate?: boolean
}

export interface CompetitionAboutSection {
  subtitle: string
  description: string
}

export interface CompetitionEligibility {
  open_to_all: boolean
  year_of_study?: string[]
  branches?: string[]
  min_cgpa?: number | null
  custom_form?: CustomFormConfig | null
}

export type CompetitionCategory = 'hackathon' | 'coding_competition' | 'case_study' | 'ideathon'

export interface Competition {
  id: string
  title: string
  description?: string
  short_description?: string
  category: CompetitionCategory
  banner_url?: string
  status: 'pending' | 'approved' | 'live' | 'completed' | 'rejected'

  start_date: string
  end_date: string
  registration_deadline?: string

  venue?: string
  city?: string
  state?: string
  is_online?: boolean

  registration_type: 'individual' | 'team' | 'both'
  team_size_min: number
  team_size_max: number
  max_participants: number
  entry_fee: number

  eligibility: CompetitionEligibility
  custom_form?: CustomFormConfig | null
  stages: CompetitionStage[]
  prizes: CompetitionPrize[]
  themes: string[]
  rules?: string

  contact_email?: string
  contact_whatsapp?: string
  contact_phone?: string

  about_sections?: CompetitionAboutSection[]
  require_resume?: boolean

  is_universal?: boolean
  college_id?: string
  department?: string
  target_years?: string[]
  target_sections?: Record<string, string[]>
  target_departments?: Array<{ department: string, course?: string, years?: string[], sections?: Record<string, string[]> }>
  course?: string
  created_by?: string
  organizer_name?: string
  organizer_email?: string
  speaker_name?: string
  speaker_org?: string
  created_at: string
  updated_at?: string
}

export interface CompetitionCreate {
  title: string
  description?: string
  short_description?: string
  category: CompetitionCategory
  banner_url?: string
  status?: string

  start_date: string
  end_date: string
  registration_deadline?: string

  venue?: string
  city?: string
  state?: string
  is_online?: boolean

  registration_type?: string
  team_size_min?: number
  team_size_max?: number
  max_participants?: number
  entry_fee?: number

  eligibility?: CompetitionEligibility
  custom_form?: CustomFormConfig | null
  stages?: CompetitionStage[]
  prizes?: CompetitionPrize[]
  themes?: string[]
  rules?: string

  contact_email?: string
  contact_whatsapp?: string
  contact_phone?: string

  about_sections?: CompetitionAboutSection[]

  is_universal?: boolean
  college?: string
  department?: string | null
  target_years?: string[] | string | null
  target_sections?: Record<string, string[]> | any
  target_departments?: Array<{ department: string, course?: string, years?: string[], sections?: Record<string, string[]> }> | any
  course?: string | null
  speaker_name?: string
  speaker_org?: string
}

// ─── Competition Registration & Team Types ──────────────────────────────

export interface CompetitionTeam {
  id: string
  competition_id: string
  name: string
  leader_id: string
  team_size: number
  invite_code: string
  status: 'forming' | 'complete' | 'registered' | 'disqualified'
  looking_for_teammates?: boolean
  created_at: string
  members?: CompetitionRegistration[]
  leader?: { id?: string; name: string; email: string; profile_avatar?: string }
  submissions?: Record<number, any>
}

export interface CompetitionRegistration {
  id: string
  competition_id: string
  user_id: string
  registration_type: 'individual' | 'team'
  team_id?: string
  team_role?: 'leader' | 'member'
  status: 'draft' | 'registered' | 'confirmed' | 'shortlisted' | 'eliminated' | 'winner' | 'withdrawn'
  current_stage: number
  entry_fee_paid: number
  payment_method?: string
  payment_reference?: string
  verified?: boolean
  created_at: string
  user?: { id: string; name: string; email: string; profile_avatar?: string }
  team?: CompetitionTeam
  competition?: Competition
  submissions?: Record<number, any>
}

export interface TeamJoinRequest {
  id: string
  competition_id: string
  team_id: string
  user_id: string
  message?: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at?: string
  user?: { id: string; name: string; email: string; profile_avatar?: string }
  team?: CompetitionTeam
}

