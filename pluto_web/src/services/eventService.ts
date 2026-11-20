/**
 * eventService.ts — PLUTO
 * Full 1:1 port of eventService.js
 * Wraps all event DB operations against the production Supabase schema.
 */

import { supabase } from '@/lib/supabase'
import { getCdnUrl } from '@/utils/cdn'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface EventFrontend {
  id: string
  ownerEmail: string
  college: string
  title: string
  description: string
  category: string
  type: string
  bannerUrl: string
  status: string
  date: string
  endDate: string
  time: string
  endTime: string
  venue: string
  isUniversal: boolean
  city: string
  state: string
  price: number
  ticketLimit: number
  refundPolicy: string
  hasSeating: boolean
  layout: Record<string, unknown> | null
  createdAt: string
  speakerName?: string
  speakerOrg?: string
  department?: string | null
  target_years?: string[] | string | null
  target_sections?: any
  target_departments?: any[] | null
  course?: string | null
}

export interface EventCreateInput {
  title: string
  description?: string
  category?: string
  type?: string
  bannerUrl?: string
  status?: string
  date?: string
  endDate?: string
  time?: string
  endTime?: string
  venue?: string
  isUniversal?: boolean
  city?: string
  state?: string
  price?: number
  ticketLimit?: number
  refundPolicy?: string
  hasSeating?: boolean
  layout?: Record<string, unknown> | null
  college?: string
  department?: string | null
  target_years?: string[] | string | null
  target_sections?: Record<string, string[]> | any
  target_departments?: any[] | null
  speakerName?: string
  speakerOrg?: string
  course?: string | null
}

// ─── Constants ───────────────────────────────────────────────────────────────

const EVENT_TABLE = 'events'
const COLLEGE_TABLE = 'colleges'
const USER_TABLE = 'users'

const EVENT_SELECT = `
  *,
  creator:${USER_TABLE}!created_by ( id, email, name ),
  college_info:${COLLEGE_TABLE}!college_id ( id, name )
`.trim()

const EVENT_LIST_SELECT = `
  id, title, start_date, end_date, start_time, end_time,
  venue, city, state, banner_url, ticket_price, ticket_limit,
  has_seating, category, type, status, is_universal, refund_policy,
  created_at, college_id, created_by, department, target_years, target_sections, target_departments, course
`.trim()

// ─── Internal Helpers ────────────────────────────────────────────────────────

function _rowToEvent(row: any): EventFrontend {
  return {
    id: row.id,
    ownerEmail: row.creator?.email ?? '',
    college: row.college_info?.name ?? '',
    title: row.title,
    description: row.description || '',
    category: row.category || '',
    type: row.type || 'event',
    bannerUrl: getCdnUrl(row.banner_url) || '',
    status: row.status || 'pending',
    date: row.start_date || '',
    endDate: row.end_date || '',
    time: row.start_time || '',
    endTime: row.end_time || '',
    venue: row.venue || '',
    isUniversal: row.is_universal || false,
    city: row.city || '',
    state: row.state || '',
    price: Number(row.ticket_price ?? 0),
    ticketLimit: row.ticket_limit || 100,
    refundPolicy: row.refund_policy || '',
    hasSeating: row.has_seating || false,
    layout: row.seat_layout || null,
    createdAt: row.created_at || '',
    speakerName: row.speaker_name || '',
    speakerOrg: row.speaker_org || '',
    department: row.department || undefined,
    target_years: row.target_years || undefined,
    target_sections: row.target_sections || undefined,
    course: row.course || undefined,
  }
}

function _rowToEventLite(row: any): EventFrontend {
  return {
    id: row.id,
    ownerEmail: '',
    college: '',
    title: row.title,
    description: row.description || '',
    category: row.category || '',
    type: row.type || 'event',
    bannerUrl: row.banner_url || '',
    status: row.status || 'pending',
    date: row.start_date || '',
    endDate: row.end_date || '',
    time: row.start_time || '',
    endTime: row.end_time || '',
    venue: row.venue || '',
    isUniversal: row.is_universal || false,
    city: row.city || '',
    state: row.state || '',
    price: Number(row.ticket_price ?? 0),
    ticketLimit: row.ticket_limit || 100,
    refundPolicy: row.refund_policy || '',
    hasSeating: row.has_seating || false,
    layout: null,
    createdAt: row.created_at || '',
    speakerName: row.speaker_name || '',
    speakerOrg: row.speaker_org || '',
    department: row.department || undefined,
    target_years: row.target_years || undefined,
    target_sections: row.target_sections || undefined,
    target_departments: row.target_departments || undefined,
    course: row.course || undefined,
  }
}

function _eventToRow(event: EventCreateInput, createdBy: string | null, collegeId: string | null) {
  let ticketType = 'simple'
  if (event.hasSeating) ticketType = 'seated'
  else if (!event.price) ticketType = 'free'

  return {
    title: event.title,
    description: event.description || null,
    category: event.category || null,
    type: event.type || 'event',
    banner_url: event.bannerUrl || null,
    status: event.status || 'pending',
    created_by: createdBy,
    college_id: collegeId,
    start_date: event.date || null,
    end_date: event.endDate || null,
    start_time: event.time || null,
    end_time: event.endTime || null,
    venue: event.venue || null,
    is_universal: event.isUniversal || false,
    city: event.city || null,
    state: event.state || null,
    ticket_price: event.price ?? 0,
    ticket_limit: event.ticketLimit || 100,
    ticket_type: ticketType,
    refund_policy: event.refundPolicy || null,
    has_seating: event.hasSeating || false,
    seat_layout: event.layout || null,
    department: event.department || null,
    target_years: event.target_years || null,
    target_sections: event.target_sections || null,
    target_departments: event.target_departments || null,
    speaker_name: event.speakerName || null,
    speaker_org: event.speakerOrg || null,
    course: event.course || null,
  }
}

async function _resolveCollegeId(collegeName: string): Promise<string | null> {
  if (!collegeName) return null
  const { data, error } = await supabase
    .from(COLLEGE_TABLE)
    .select('id')
    .ilike('name', collegeName.trim())
    .maybeSingle()

  if (error || !data) return null
  return data.id
}

function _getCachedCollegeId(): string | null {
  try {
    const lsUser = JSON.parse(localStorage.getItem('pluto-auth') || '{}')
    return lsUser?.state?.user?.college_id || null
  } catch { return null }
}

async function _getCurrentUserIds() {
  let userId: string | null = null
  let email: string | null = null
  let collegeName: string | null = null

  // Stage 1: cached session
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      userId = session.user.id
      email = session.user.email ?? null
      collegeName = (session.user.user_metadata as any)?.college || null
    }
  } catch { /* */ }

  // Stage 2: network call
  if (!userId) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        userId = user.id
        email = user.email ?? null
        collegeName = (user.user_metadata as any)?.college || null
      }
    } catch { /* */ }
  }

  if (!userId) return null

  // Fetch profile for college_id
  const { data: profile } = await supabase
    .from(USER_TABLE)
    .select('id, college_id')
    .eq('id', userId)
    .maybeSingle()

  let collegeId = profile?.college_id ?? null

  if (!collegeId && collegeName) {
    const resolved = await _resolveCollegeId(collegeName)
    if (resolved) {
      collegeId = resolved
      await supabase.from(USER_TABLE).update({ college_id: resolved }).eq('id', userId)
    }
  }

  return { userId, collegeId, email, collegeName }
}

// ─── Public API ──────────────────────────────────────────────────────────────

export const eventService = {

  async getEvents({ page = 0, limit = 50 } = {}): Promise<EventFrontend[]> {
    const from = page * limit
    const { data, error } = await supabase
      .from(EVENT_TABLE)
      .select(EVENT_LIST_SELECT)
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1)

    if (error) { console.error('[eventService.getEvents]', error.message); return [] }
    return (data || []).map(_rowToEventLite)
  },

  async getEventById(id: string): Promise<EventFrontend | null> {
    const { data, error } = await supabase
      .from(EVENT_TABLE)
      .select(EVENT_SELECT)
      .eq('id', id)
      .maybeSingle()

    if (error) { console.error('[eventService.getEventById]', error.message); return null }
    return data ? _rowToEvent(data) : null
  },

  async getEventsByCollege(collegeName: string): Promise<EventFrontend[]> {
    if (!collegeName) return []

    let collegeId = _getCachedCollegeId()
    if (!collegeId) {
      collegeId = await _resolveCollegeId(collegeName)
    }
    if (!collegeId) return []

    const { data, error } = await supabase
      .from(EVENT_TABLE)
      .select(EVENT_LIST_SELECT)
      .eq('college_id', collegeId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) { console.error('[eventService.getEventsByCollege]', error.message); return [] }
    return (data || []).map(_rowToEventLite)
  },

  async getEventsByCurrentUserCollege(): Promise<EventFrontend[]> {
    let collegeId = _getCachedCollegeId()

    if (!collegeId) {
      try {
        const ids = await _getCurrentUserIds()
        if (ids?.collegeId) collegeId = ids.collegeId
      } catch { /* */ }
    }

    if (!collegeId) return []

    const { data, error } = await supabase
      .from(EVENT_TABLE)
      .select(EVENT_LIST_SELECT)
      .eq('college_id', collegeId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) { console.error('[getEventsByCurrentUserCollege]', error.message); return [] }
    return (data || []).map(_rowToEventLite)
  },

  async getEventsByOwner(ownerEmail: string): Promise<EventFrontend[]> {
    const { data: userRow } = await supabase
      .from(USER_TABLE)
      .select('id')
      .eq('email', ownerEmail)
      .maybeSingle()

    if (!userRow) return []

    const { data, error } = await supabase
      .from(EVENT_TABLE)
      .select(EVENT_SELECT)
      .eq('created_by', userRow.id)
      .order('created_at', { ascending: false })

    if (error) { console.error('[eventService.getEventsByOwner]', error.message); return [] }
    return (data || []).map(_rowToEvent)
  },

  async getUniversalEvents(): Promise<EventFrontend[]> {
    const { data, error } = await supabase
      .from(EVENT_TABLE)
      .select(EVENT_LIST_SELECT)
      .eq('is_universal', true)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) { console.error('[eventService.getUniversalEvents]', error.message); return [] }
    return (data || []).map(_rowToEventLite)
  },

  async createEvent(eventData: EventCreateInput): Promise<EventFrontend | null> {
    let userId: string | null = null
    let collegeId: string | null = null

    try {
      const ids = await _getCurrentUserIds()
      if (ids) {
        userId = ids.userId
        collegeId = ids.collegeId
      }
    } catch { /* */ }

    if (!collegeId && eventData.college) {
      collegeId = await _resolveCollegeId(eventData.college)
    }

    if (eventData.type === 'announcement') {
      const annRow = {
        title: eventData.title,
        description: eventData.description || null,
        category: eventData.category || null,
        banner_url: eventData.bannerUrl || null,
        created_by: userId,
        college_id: collegeId,
        is_universal: eventData.isUniversal || false,
        venue: eventData.venue || null,
        state: eventData.state || null,
        city: eventData.city || null,
        start_date: eventData.date || null,
        end_date: eventData.endDate || null,
        start_time: eventData.time || null,
        end_time: eventData.endTime || null,
        department: eventData.department || null,
        target_years: eventData.target_years || null,
        target_sections: eventData.target_sections || null,
        target_departments: eventData.target_departments || null,
        course: eventData.course || null,
      }
      const { data, error } = await supabase
        .from('announcements')
        .insert(annRow)
        .select('*')
        .single()

      if (error) {
        console.error('[eventService.createEvent] Announcement Error:', error.message)
        return null
      }
      return _rowToEventLite({ ...data, type: 'announcement', status: 'published' })
    }

    const row = _eventToRow(eventData, userId, collegeId)

    const { data, error } = await supabase
      .from(EVENT_TABLE)
      .insert(row)
      .select(EVENT_SELECT)
      .single()

    if (error) {
      console.error('[eventService.createEvent]', error.message)
      return null
    }

    return _rowToEvent(data)
  },

  async updateEvent(id: string, updatedFields: Partial<EventCreateInput>): Promise<EventFrontend | null> {
    const patch: Record<string, unknown> = {}

    const fieldMap: Record<string, string> = {
      title: 'title',
      description: 'description',
      category: 'category',
      type: 'type',
      bannerUrl: 'banner_url',
      status: 'status',
      date: 'start_date',
      endDate: 'end_date',
      time: 'start_time',
      endTime: 'end_time',
      venue: 'venue',
      isUniversal: 'is_universal',
      city: 'city',
      state: 'state',
      price: 'ticket_price',
      ticketLimit: 'ticket_limit',
      refundPolicy: 'refund_policy',
      hasSeating: 'has_seating',
      layout: 'seat_layout',
      department: 'department',
      target_years: 'target_years',
      target_sections: 'target_sections',
      target_departments: 'target_departments',
      speakerName: 'speaker_name',
      speakerOrg: 'speaker_org',
      course: 'course',
    }

    for (const [frontendKey, dbCol] of Object.entries(fieldMap)) {
      if ((updatedFields as any)[frontendKey] !== undefined) {
        patch[dbCol] = (updatedFields as any)[frontendKey]
      }
    }

    if (updatedFields.college) {
      patch.college_id = await _resolveCollegeId(updatedFields.college)
    }

    if (updatedFields.type === 'announcement' || patch.type === 'announcement') {
      const annPatch: Record<string, unknown> = {}
      const allowedAnnCols = [
        'title', 'description', 'category', 'banner_url', 'college_id',
        'is_universal', 'venue', 'state', 'city',
        'start_date', 'end_date', 'start_time', 'end_time', 'department',
        'target_years', 'target_sections', 'target_departments', 'course'
      ]
      for (const key of allowedAnnCols) {
        if (patch[key] !== undefined) {
          annPatch[key] = patch[key]
        }
      }

      const { data, error } = await supabase
        .from('announcements')
        .update(annPatch)
        .eq('id', id)
        .select('*')
        .single()

      if (error) {
        console.error('[eventService.updateEvent Announcement]', error.message)
        throw new Error(error.message)
      }
      return _rowToEventLite({ ...data, type: 'announcement', status: 'published' })
    }

    const { data, error } = await supabase
      .from(EVENT_TABLE)
      .update(patch)
      .eq('id', id)
      .select(EVENT_SELECT)
      .single()

    if (error) {
      console.error('[eventService.updateEvent]', error.message)
      throw new Error(error.message)
    }
    return _rowToEvent(data)
  },

  async deleteEvent(id: string): Promise<boolean> {
    // Attempt delete from both tables since we don't strictly know the type here
    const { error: e1 } = await supabase.from(EVENT_TABLE).delete().eq('id', id)
    const { error: e2 } = await supabase.from('announcements').delete().eq('id', id)

    if (e1 && e2) {
      console.error('[eventService.deleteEvent] failed for both:', e1.message, e2.message)
      return false
    }
    return true
  },

  async setEventStatus(id: string, status: 'approved' | 'rejected' | 'live'): Promise<EventFrontend | null> {
    return this.updateEvent(id, { status })
  },
}
