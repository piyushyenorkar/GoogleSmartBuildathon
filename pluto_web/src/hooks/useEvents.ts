import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { eventService } from '@/services/eventService'
import type { EventCreateInput } from '@/services/eventService'
import type { Event } from '@/types'
import { CACHE_DURATIONS } from '@/lib/constants'
import { getCdnUrl } from '@/utils/cdn'

const EVENT_LEAN_SELECT = 'id, title, start_date, end_date, start_time, end_time, venue, city, state, banner_url, ticket_price, ticket_limit, has_seating, category, type, status, is_universal, refund_policy, created_at, college_id, created_by, department, target_years, target_sections, target_departments, course';
const ANN_LEAN_SELECT = 'id, title, start_date, end_date, start_time, end_time, venue, banner_url, category, is_universal, created_at, college_id, department, target_years, target_sections, target_departments, course';

/**
 * Fetch events by college id or name.
 * Priority: collegeId (exact), then collegeName (partial).
 */
async function fetchEventsByCollege(collegeId?: string, collegeName?: string): Promise<Event[]> {
  try {
    let resolvedId = collegeId

    // If we only have the name, resolve the ID unconditionally
    if (!resolvedId && collegeName) {
      const normalizedName = collegeName.split(',')[0].trim()
      const { data: collegeRow, error: collegeError } = await supabase
        .from('colleges')
        .select('id')
        .ilike('name', normalizedName)
        .maybeSingle()

      if (collegeError) {
        console.error('[useEvents] Error fetching college ID:', collegeError.message)
        throw collegeError
      }
      resolvedId = collegeRow?.id
    }

    if (!resolvedId) return []

    const [eventsRes, annRes] = await Promise.all([
      supabase.from('events').select(EVENT_LEAN_SELECT).eq('college_id', resolvedId).order('created_at', { ascending: false }).limit(100),
      supabase.from('announcements').select(ANN_LEAN_SELECT).eq('college_id', resolvedId).order('created_at', { ascending: false }).limit(50)
    ])

    if (eventsRes.error) {
      console.error('[useEvents] Error fetching events:', eventsRes.error.message)
      throw eventsRes.error
    }
    if (annRes.error) {
      console.error('[useEvents] Error fetching announcements:', annRes.error.message)
      // don't throw for announcements if table doesn't exist yet, just fall back
    }

    const eventsData = (eventsRes.data || []).map(e => ({ ...e, type: 'event' }))
    const annData = (annRes.data || []).map(a => ({ ...a, type: 'announcement', status: 'published' })) // Announcements don't have status

    const combined = [...eventsData, ...annData].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    return combined as Event[]
  } catch (err) {
    console.error('[useEvents] fetchEventsByCollege failed:', err)
    throw err
  }
}

/**
 * Fetch universal/community events.
 */
async function fetchCommunityEvents(): Promise<Event[]> {
  try {
    const [eventsRes, annRes] = await Promise.all([
      supabase.from('events').select(`${EVENT_LEAN_SELECT}, college_ref:colleges!college_id(city, state)`).eq('is_universal', 'true').order('created_at', { ascending: false }).limit(100),
      supabase.from('announcements').select(ANN_LEAN_SELECT).eq('is_universal', 'true').order('created_at', { ascending: false }).limit(50)
    ])

    if (eventsRes.error) {
      console.error('[useEvents] Error fetching community events:', eventsRes.error.message)
      throw eventsRes.error
    }

    const eventsData = (eventsRes.data || []).map(e => ({ ...e, type: 'event' }))
    const annData = (annRes.data || []).map(a => ({ ...a, type: 'announcement', status: 'published' }))

    const combined = [...eventsData, ...annData].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    return combined as Event[]
  } catch (err) {
    console.error('[useEvents] fetchCommunityEvents failed:', err)
    throw err
  }
}

/**
 * Fetch a single event by ID.
 */
async function fetchEventById(eventId: string): Promise<Event | null> {
  // Try events table first — include creator join for organizer info
  let { data, error } = await supabase
    .from('events')
    .select('*, creator:users!created_by ( id, email, name )')
    .eq('id', eventId)
    .maybeSingle()

  if (data) {
    const creator = (data as any).creator
    return {
      ...data,
      type: 'event',
      organizer_name: creator?.name || '',
      organizer_email: creator?.email || '',
    } as Event
  }

  if (error && error.code !== 'PGRST116') { // Ignore "no rows returned" error
    throw error
  }

  // If not found, try announcements table
  const { data: annData, error: annError } = await supabase
    .from('announcements')
    .select('*')
    .eq('id', eventId)
    .maybeSingle()

  if (annError) throw annError
  if (annData) {
    return { ...annData, type: 'announcement', status: 'published' } as Event
  }

  return null
}

/**
 * Fetch ticket counts for a list of event IDs.
 */
async function fetchTicketCounts(eventIds: string[]): Promise<Record<string, number>> {
  if (eventIds.length === 0) return {}

  const { data, error } = await supabase
    .from('bookings')
    .select('event_id, quantity')
    .in('event_id', eventIds)
    .neq('booking_status', 'cancelled')

  if (error) throw error

  const counts: Record<string, number> = {}
  for (const row of data || []) {
    counts[row.event_id] = (counts[row.event_id] || 0) + (row.quantity || 1)
  }
  return counts
}

/**
 * Fetch events created by a specific organizer.
 */
async function fetchOrganizerEvents(userId: string): Promise<Event[]> {
  const [eventsRes, annRes] = await Promise.all([
    supabase.from('events').select(`${EVENT_LEAN_SELECT}, bookings(count)`).eq('created_by', userId).order('start_date', { ascending: false }),
    supabase.from('announcements').select(ANN_LEAN_SELECT).eq('created_by', userId).order('created_at', { ascending: false })
  ])

  if (eventsRes.error) throw eventsRes.error

  const eventsData = (eventsRes.data || []).map((e: any) => ({
    ...e,
    type: 'event',
    ticket_count: e.bookings?.[0]?.count || 0,
  }))

  const annData = (annRes.data || []).map((a: any) => ({
    ...a,
    type: 'announcement',
    status: 'published',
    ticket_count: 0
  }))

  return [...eventsData, ...annData].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) as Event[]
}

// ─── React Query hooks ───────────────────────────────────────────────────────

export function useCollegeEvents(collegeId?: string, collegeName?: string) {
  return useQuery({
    queryKey: ['events', 'college', collegeId || collegeName],
    queryFn: () => fetchEventsByCollege(collegeId, collegeName),
    enabled: !!collegeId || !!collegeName,
    staleTime: CACHE_DURATIONS.events,
  })
}

export function useCommunityEvents(enabled = true) {
  return useQuery({
    queryKey: ['events', 'community'],
    queryFn: fetchCommunityEvents,
    enabled,
    staleTime: CACHE_DURATIONS.events,
  })
}

export function useEvent(eventId?: string) {
  return useQuery({
    queryKey: ['event', eventId],
    queryFn: () => fetchEventById(eventId!),
    enabled: !!eventId,
  })
}

export function useTicketCounts(eventIds: string[]) {
  return useQuery({
    queryKey: ['ticketCounts', ...eventIds],
    queryFn: () => fetchTicketCounts(eventIds),
    enabled: eventIds.length > 0,
    staleTime: 60 * 1000,
  })
}

export function useOrganizerEvents(userId?: string) {
  return useQuery({
    queryKey: ['events', 'organizer', userId],
    queryFn: () => fetchOrganizerEvents(userId!),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  })
}

// ─── Mutation hooks ──────────────────────────────────────────────────────────

export function useCreateEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (eventData: EventCreateInput) => eventService.createEvent(eventData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })
}

export function useUpdateEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EventCreateInput> }) =>
      eventService.updateEvent(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['event', variables.id] })
    },
  })
}

export function useDeleteEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => eventService.deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })
}

export function useSetEventStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'approved' | 'rejected' | 'live' }) =>
      eventService.setEventStatus(id, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['event', variables.id] })
    },
  })
}
