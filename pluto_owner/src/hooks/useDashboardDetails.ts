import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export function useDetailedUsers(searchQuery: string = '', collegeId?: string | null) {
  return useQuery({
    queryKey: ['hq-detailed-users', searchQuery, collegeId],
    queryFn: async () => {
      let query = supabase
        .from('users')
        .select(`
          id, name, email, profile_avatar, roles, created_at, college_id,
          colleges ( id, name )
        `)
        .order('created_at', { ascending: false })
      
      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`)
      } else {
        query = query.limit(100)
      }

      if (collegeId) {
        if (collegeId === 'all_colleges') {
          query = query.not('college_id', 'is', null)
        } else {
          query = query.eq('college_id', collegeId)
        }
      }

      const { data, error } = await query
      if (error) throw error
      return data
    }
  })
}

export function useDetailedOrganizers(searchQuery: string = '') {
  return useQuery({
    queryKey: ['hq-detailed-organizers', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('users')
        .select(`
          id, name, email, profile_avatar, roles, college_id,
          colleges ( name )
        `)
        .contains('roles', ['organizer'])
        .order('created_at', { ascending: false })
      
      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`)
      } else {
        query = query.limit(100)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    }
  })
}

export function useDetailedColleges(searchQuery: string = '') {
  return useQuery({
    queryKey: ['hq-detailed-colleges', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('colleges')
        .select('id, name, city, state, created_at')
        .order('name', { ascending: true })
      
      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`)
      } else {
        query = query.limit(100)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    }
  })
}

export function useDetailedBookings(searchQuery: string = '', eventId?: string, collegeId?: string, sourceType?: string) {
  return useQuery({
    queryKey: ['hq-detailed-bookings', searchQuery, eventId, collegeId, sourceType],
    queryFn: async () => {
      let bookingsQuery = supabase
        .from('bookings')
        .select(`
          id, quantity, total_amount, booking_status, payment_method, created_at, event_id,
          user:users ( name, email, profile_avatar, college_id ),
          event:events ( id, title, banner_url, college_id )
        `)
        .order('created_at', { ascending: false })
        .limit(300)
        
      let compsQuery = supabase
        .from('competition_registrations')
        .select(`
          id, total_paid, status, payment_method, created_at, competition_id,
          user:users ( name, email, profile_avatar, college_id ),
          event:competitions ( id, title, banner_url, college_id )
        `)
        .order('created_at', { ascending: false })
        .limit(300)

      const [bookingsRes, compsRes] = await Promise.all([bookingsQuery, compsQuery])
      
      let allData = [
        ...(bookingsRes.data || []).map(b => ({ ...b, _sourceTable: 'bookings' })),
        ...(compsRes.data || []).map(c => ({ 
          ...c, 
          quantity: 1, 
          total_amount: c.total_paid, 
          booking_status: c.status, 
          event_id: c.competition_id,
          _sourceTable: 'competitions'
        }))
      ]

      if (sourceType === 'events') allData = allData.filter(d => d._sourceTable === 'bookings')
      if (sourceType === 'competitions') allData = allData.filter(d => d._sourceTable === 'competitions')

      let filteredData = allData;

      if (filteredData && eventId) {
        filteredData = filteredData.filter((b: any) => b.event_id === eventId || b.event?.id === eventId)
      }

      if (filteredData && collegeId) {
        filteredData = filteredData.filter((b: any) => 
          b.user?.college_id === collegeId || b.event?.college_id === collegeId
        )
      }

      if (searchQuery && filteredData) {
        const q = searchQuery.toLowerCase()
        filteredData = filteredData.filter((b: any) => 
          b.user?.name?.toLowerCase().includes(q) || 
          b.user?.email?.toLowerCase().includes(q) ||
          b.event?.title?.toLowerCase().includes(q)
        )
      }
      
      filteredData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      return filteredData
    }
  })
}

export function useDetailedEvents(searchQuery: string = '', collegeId?: string, isIndependent?: boolean, status?: string, sourceType?: string) {
  return useQuery({
    queryKey: ['hq-detailed-events', searchQuery, collegeId, isIndependent, status, sourceType],
    queryFn: async () => {
      let eventsQuery = supabase
        .from('events')
        .select(`
          id, title, category, type, status, start_date, ticket_price, banner_url, created_at, college_id,
          organizer:users!created_by ( name, email, profile_avatar, college_id ),
          college:colleges ( id, name )
        `)
        .order('created_at', { ascending: false })
        .limit(300)
        
      let compsQuery = supabase
        .from('competitions')
        .select(`
          id, title, category, type, status, start_date, entry_fee, banner_url, created_at, college_id,
          organizer:users!created_by ( name, email, profile_avatar, college_id ),
          college:colleges ( id, name )
        `)
        .order('created_at', { ascending: false })
        .limit(300)
      
      if (status) {
        eventsQuery = eventsQuery.eq('status', status)
        compsQuery = compsQuery.eq('status', status)
      }

      const [eventsRes, compsRes] = await Promise.all([eventsQuery, compsQuery])
      
      let allData = [
        ...(eventsRes.data || []).map(e => ({ ...e, _sourceTable: 'events' })),
        ...(compsRes.data || []).map(c => ({ ...c, _sourceTable: 'competitions', ticket_price: c.entry_fee }))
      ]

      if (sourceType === 'events') allData = allData.filter(d => d._sourceTable === 'events')
      if (sourceType === 'competitions') allData = allData.filter(d => d._sourceTable === 'competitions')

      let filteredData = allData;

      if (filteredData && collegeId) {
        filteredData = filteredData.filter((e: any) => e.college_id === collegeId || e.college?.id === collegeId)
      }

      if (filteredData && isIndependent) {
        filteredData = filteredData.filter((e: any) => !e.college_id)
      }

      if (searchQuery && filteredData) {
        const q = searchQuery.toLowerCase()
        filteredData = filteredData.filter((e: any) => 
          e.title?.toLowerCase().includes(q) ||
          e.organizer?.name?.toLowerCase().includes(q) ||
          e.college?.name?.toLowerCase().includes(q)
        )
      }

      filteredData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      return filteredData
    }
  })
}

export function useDetailedPayouts(searchQuery: string = '') {
  return useQuery({
    queryKey: ['hq-detailed-payouts', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('payouts')
        .select(`
          id, amount, status, reference_number, requested_at, processed_at,
          organizer:users ( name, email, profile_avatar )
        `)
        .order('requested_at', { ascending: false })
        .limit(300)

      const { data, error } = await query
      if (error) throw error
      
      if (searchQuery && data) {
        const q = searchQuery.toLowerCase()
        return data.filter((p: any) => 
          p.organizer?.name?.toLowerCase().includes(q) || 
          p.organizer?.email?.toLowerCase().includes(q) ||
          p.reference_number?.toLowerCase().includes(q)
        )
      }
      return data
    }
  })
}
