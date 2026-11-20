/**
 * competitionService.ts — PLUTO Web
 * CRUD operations for the competitions table.
 * Standalone service — does NOT touch eventService.ts.
 * Ported from pluto_app/src/services/competitionService.ts with web adaptations.
 */

import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import type { Competition, CompetitionCreate } from '@/types'
import { getCdnUrl } from '@/utils/cdn'

const TABLE = 'competitions'
const USER_TABLE = 'users'
const COLLEGE_TABLE = 'colleges'

const COMPETITION_SELECT = `
  *,
  creator:${USER_TABLE}!created_by ( id, email, name, profile_avatar ),
  college_info:${COLLEGE_TABLE}!college_id ( id, name )
`.trim()

const COMPETITION_LIST_SELECT = `
  id, title, start_date, end_date, registration_deadline, banner_url,
  category, status, registration_type, team_size_min, team_size_max,
  max_participants, entry_fee, prizes, is_universal, is_online,
  venue, city, state, college_id, department, target_years, target_sections, target_departments, course,
  created_by, created_at, updated_at
`.trim()

// ─── Internal Helpers ────────────────────────────────────────

function _rowToCompetition(row: any): Competition {
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    category: row.category || 'hackathon',
    banner_url: getCdnUrl(row.banner_url) || '',
    status: row.status || 'pending',

    start_date: row.start_date || '',
    end_date: row.end_date || '',
    registration_deadline: row.registration_deadline || '',

    venue: row.venue || '',
    city: row.city || '',
    state: row.state || '',
    is_online: row.is_online || false,

    registration_type: row.registration_type || 'team',
    team_size_min: row.team_size_min ?? 1,
    team_size_max: row.team_size_max ?? 5,
    max_participants: row.max_participants ?? 500,
    entry_fee: Number(row.entry_fee ?? 0),

    eligibility: row.eligibility || { open_to_all: true },
    custom_form: row.custom_form || row.eligibility?.custom_form || null,
    stages: row.stages || [],
    prizes: row.prizes || [],
    themes: row.themes || [],
    rules: row.rules || '',

    contact_email: row.contact_email || '',
    contact_whatsapp: row.contact_whatsapp || '',
    contact_phone: row.contact_phone || '',

    about_sections: row.about_sections || [],

    is_universal: row.is_universal || false,
    college_id: row.college_id || '',
    created_by: row.created_by || '',
    organizer_name: row.creator?.name || '',
    organizer_email: row.creator?.email || '',
    created_at: row.created_at || '',
    updated_at: row.updated_at || '',
    department: row.department || undefined,
    target_years: row.target_years || undefined,
    target_sections: row.target_sections || undefined,
    target_departments: row.target_departments || undefined,
    course: row.course || undefined,
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

async function _getCurrentUserIds() {
  // Web: prefer Supabase session, then fall back to authStore
  let userId: string | null = null
  let collegeName: string | null = null

  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      userId = session.user.id
      collegeName = (session.user.user_metadata as any)?.college || null
    }
  } catch { /* */ }

  if (!userId) {
    const authUser = useAuthStore.getState().user
    if (authUser) {
      userId = authUser.id
      collegeName = authUser.college || null
    }
  }

  if (!userId) return null

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

  return { userId, collegeId, collegeName }
}

// ─── Public API ──────────────────────────────────────────────

export const competitionService = {

  async createCompetition(input: CompetitionCreate): Promise<Competition | null> {
    const ids = await _getCurrentUserIds()
    if (!ids?.userId) throw new Error('User ID could not be verified. Please log in again.')

    let collegeId = ids.collegeId
    if (!collegeId && input.college) {
      collegeId = await _resolveCollegeId(input.college)
    }

    const row = {
      title: input.title,
      description: input.description || null,
      category: input.category || 'hackathon',
      banner_url: input.banner_url || null,
      status: input.status || 'pending',

      start_date: input.start_date || null,
      end_date: input.end_date || null,
      registration_deadline: input.registration_deadline || null,

      venue: input.venue || null,
      city: input.city || null,
      state: input.state || null,
      is_online: input.is_online || false,

      registration_type: input.registration_type || 'team',
      team_size_min: input.team_size_min ?? 1,
      team_size_max: input.team_size_max ?? 5,
      max_participants: input.max_participants ?? 500,
      entry_fee: input.entry_fee ?? 0,

      eligibility: {
        ...(input.eligibility || { open_to_all: true }),
        ...(input.custom_form ? { custom_form: input.custom_form } : {}),
      },
      stages: input.stages || [],
      prizes: input.prizes || [],
      themes: input.themes || [],
      rules: input.rules || null,

      contact_email: input.contact_email || null,
      contact_whatsapp: input.contact_whatsapp || null,
      contact_phone: input.contact_phone || null,

      about_sections: input.about_sections || [],

      is_universal: input.is_universal || false,
      college_id: collegeId,
      created_by: ids.userId,
      department: input.department || null,
      target_years: input.target_years || null,
      target_sections: input.target_sections || null,
      target_departments: input.target_departments || null,
      course: input.course || null,
    }

    const { data, error } = await supabase
      .from(TABLE)
      .insert(row)
      .select(COMPETITION_SELECT)
      .single()

    if (error) {
      console.error('[competitionService.create]', error.message)
      throw new Error(error.message)
    }

    return data ? _rowToCompetition(data) : null
  },

  async getCompetitionById(id: string): Promise<Competition | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .select(COMPETITION_SELECT)
      .eq('id', id)
      .single()

    if (error || !data) return null
    return _rowToCompetition(data)
  },

  async getApprovedCompetitions(): Promise<Competition[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select(COMPETITION_LIST_SELECT)
      .eq('is_universal', true)
      .in('status', ['approved', 'live'])
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) { console.error('[competitionService.getApproved]', error.message); return [] }
    return (data || []).map(_rowToCompetition)
  },

  async getCompetitionsByCollege(collegeId: string): Promise<Competition[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select(COMPETITION_LIST_SELECT)
      .eq('college_id', collegeId)
      .in('status', ['approved', 'live'])
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) { console.error('[competitionService.getByCollege]', error.message); return [] }
    return (data || []).map(_rowToCompetition)
  },

  async getCompetitionsByOrganizer(userId: string): Promise<Competition[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select(COMPETITION_LIST_SELECT)
      .eq('created_by', userId)
      .order('created_at', { ascending: false })

    if (error) { console.error('[competitionService.getByOrganizer]', error.message); return [] }
    return (data || []).map(_rowToCompetition)
  },

  async updateCompetition(id: string, updates: Partial<CompetitionCreate>): Promise<Competition | null> {
    const updateRow: any = {}
    if (updates.title !== undefined) updateRow.title = updates.title
    if (updates.description !== undefined) updateRow.description = updates.description
    if (updates.category !== undefined) updateRow.category = updates.category
    if (updates.banner_url !== undefined) updateRow.banner_url = updates.banner_url
    if (updates.start_date !== undefined) updateRow.start_date = updates.start_date
    if (updates.end_date !== undefined) updateRow.end_date = updates.end_date
    if (updates.registration_deadline !== undefined) updateRow.registration_deadline = updates.registration_deadline
    if (updates.venue !== undefined) updateRow.venue = updates.venue
    if (updates.city !== undefined) updateRow.city = updates.city
    if (updates.state !== undefined) updateRow.state = updates.state
    if (updates.is_online !== undefined) updateRow.is_online = updates.is_online
    if (updates.registration_type !== undefined) updateRow.registration_type = updates.registration_type
    if (updates.team_size_min !== undefined) updateRow.team_size_min = updates.team_size_min
    if (updates.team_size_max !== undefined) updateRow.team_size_max = updates.team_size_max
    if (updates.max_participants !== undefined) updateRow.max_participants = updates.max_participants
    if (updates.entry_fee !== undefined) updateRow.entry_fee = updates.entry_fee
    if (updates.eligibility !== undefined || updates.custom_form !== undefined) {
      const existingElig: any = updates.eligibility ? { ...updates.eligibility } : {}
      if (updates.custom_form !== undefined) {
        existingElig.custom_form = updates.custom_form
      }
      updateRow.eligibility = existingElig
    }
    if (updates.stages !== undefined) updateRow.stages = updates.stages
    if (updates.prizes !== undefined) updateRow.prizes = updates.prizes
    if (updates.themes !== undefined) updateRow.themes = updates.themes
    if (updates.rules !== undefined) updateRow.rules = updates.rules
    if (updates.contact_email !== undefined) updateRow.contact_email = updates.contact_email
    if (updates.contact_whatsapp !== undefined) updateRow.contact_whatsapp = updates.contact_whatsapp
    if (updates.contact_phone !== undefined) updateRow.contact_phone = updates.contact_phone
    if (updates.about_sections !== undefined) updateRow.about_sections = updates.about_sections
    if (updates.is_universal !== undefined) updateRow.is_universal = updates.is_universal
    if (updates.status !== undefined) updateRow.status = updates.status
    if (updates.department !== undefined) updateRow.department = updates.department
    if (updates.target_years !== undefined) updateRow.target_years = updates.target_years
    if (updates.target_sections !== undefined) updateRow.target_sections = updates.target_sections
    if (updates.target_departments !== undefined) updateRow.target_departments = updates.target_departments
    if (updates.course !== undefined) updateRow.course = updates.course

    if (updates.college !== undefined) {
      const collegeId = await _resolveCollegeId(updates.college)
      if (collegeId) updateRow.college_id = collegeId
    }

    updateRow.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from(TABLE)
      .update(updateRow)
      .eq('id', id)
      .select(COMPETITION_SELECT)
      .single()

    if (error) {
      console.error('[competitionService.update]', error.message)
      throw new Error(error.message)
    }
    return data ? _rowToCompetition(data) : null
  },

  async deleteCompetition(id: string): Promise<void> {
    const { error } = await supabase.from(TABLE).delete().eq('id', id)
    if (error) throw new Error(error.message)
  },

  /** Upload competition banner to Supabase storage (web: uses File object) */
  async uploadBanner(file: File): Promise<string> {
    try {
      const ext = file.name.split('.').pop() || 'jpg'
      const fileName = `comp_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`

      const { data, error } = await supabase.storage
        .from('events')
        .upload(fileName, file, {
          contentType: file.type || 'image/jpeg',
          upsert: false,
        })

      if (error) throw error

      const { data: publicData } = supabase.storage.from('events').getPublicUrl(fileName)
      return publicData.publicUrl
    } catch (error: any) {
      console.error('[competitionService.uploadBanner]', error.message)
      throw new Error(`Image upload failed: ${error.message}`)
    }
  },
}
