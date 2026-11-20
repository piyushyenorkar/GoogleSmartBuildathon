/**
 * competitionRegistrationService.ts — PLUTO Web
 * Handles competition registrations, team creation/joining, and participant management.
 * Standalone service — does NOT touch bookingService.ts.
 * Ported from pluto_app/src/services/competitionRegistrationService.ts with web adaptations.
 */

import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import type { CompetitionRegistration, CompetitionTeam, TeamJoinRequest } from '@/types'

// ─── Internal Helpers ────────────────────────────────────────────────────────

async function _getUserId(): Promise<string | null> {
  // Web: prefer authStore, then fall back to session
  const authUser = useAuthStore.getState().user
  if (authUser?.id) return authUser.id

  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user?.id) return session.user.id
  } catch { /* */ }

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.id) return user.id
  } catch { /* */ }

  return null
}

function _toRegistration(row: any): CompetitionRegistration {
  const u = row.users || row.user || {}
  const t = row.competition_teams || row.team || null
  const c = row.competitions || row.competition || null
  return {
    id: row.id,
    competition_id: row.competition_id,
    user_id: row.user_id,
    registration_type: row.registration_type || 'individual',
    team_id: row.team_id || null,
    team_role: row.team_role || 'member',
    status: row.status || 'registered',
    current_stage: row.current_stage ?? 1,
    entry_fee_paid: row.entry_fee_paid ?? 0,
    payment_method: row.payment_method || null,
    payment_reference: row.payment_reference || null,
    verified: row.verified,
    created_at: row.created_at,
    user: u?.id ? { id: u.id, name: u.name || '', email: u.email || '', profile_avatar: u.profile_avatar } : undefined,
    team: t ? _toTeam(t) : undefined,
    competition: c || undefined,
    submissions: row.submissions || undefined,
  } as CompetitionRegistration
}

function _toTeam(row: any): CompetitionTeam {
  return {
    id: row.id,
    competition_id: row.competition_id,
    name: row.name,
    leader_id: row.leader_id,
    team_size: row.team_size ?? 1,
    invite_code: row.invite_code || '',
    status: row.status || 'forming',
    looking_for_teammates: row.looking_for_teammates,
    created_at: row.created_at,
    leader: row.leader || row.users || undefined,
    members: row.members || undefined,
    submissions: row.submissions || undefined,
  }
}

// ─── Validation ──────────────────────────────────────────────────────────────

async function _validateRegistration(competitionId: string, userId: string): Promise<{ valid: boolean; error?: string }> {
  const { data: comp } = await supabase
    .from('competitions').select('*').eq('id', competitionId).single()
  if (!comp) return { valid: false, error: 'Competition not found' }

  if (comp.status !== 'approved' && comp.status !== 'live')
    return { valid: false, error: 'Competition is not accepting registrations' }

  if (comp.registration_deadline) {
    const deadline = new Date(comp.registration_deadline)
    if (new Date() > deadline) return { valid: false, error: 'Registration deadline has passed' }
  }

  const { data: existing } = await supabase
    .from('competition_registrations')
    .select('id, status')
    .eq('competition_id', competitionId)
    .eq('user_id', userId)
    .limit(1)
  if (existing && existing.length > 0 && existing[0].status !== 'draft')
    return { valid: false, error: 'You are already registered for this competition' }

  if (comp.max_participants && comp.max_participants > 0) {
    const { count } = await supabase
      .from('competition_registrations')
      .select('id', { count: 'exact', head: true })
      .eq('competition_id', competitionId)
      .neq('status', 'withdrawn')
    if ((count || 0) >= comp.max_participants)
      return { valid: false, error: 'This competition has reached maximum registrations' }
  }

  return { valid: true }
}

// ─── Public API ──────────────────────────────────────────────────────────────

export const competitionRegistrationService = {

  // ── Individual Registration ─────────────────────────────────────────────
  async registerIndividual(competitionId: string, paymentData?: {
    entryFee?: number; paymentMethod?: string; paymentReference?: string
  }): Promise<CompetitionRegistration | null> {
    const userId = await _getUserId()
    if (!userId) throw new Error('Not authenticated')

    const validation = await _validateRegistration(competitionId, userId)
    if (!validation.valid) throw new Error(validation.error)

    const { data, error } = await supabase
      .from('competition_registrations')
      .insert({
        competition_id: competitionId,
        user_id: userId,
        registration_type: 'individual',
        team_id: null,
        team_role: null,
        status: 'registered',
        current_stage: 1,
        entry_fee_paid: paymentData?.entryFee ?? 0,
        payment_method: paymentData?.paymentMethod || 'free',
        payment_reference: paymentData?.paymentReference || null,
      })
      .select('*, users:user_id(id, name, email, profile_avatar)')
      .single()

    if (error) throw new Error(error.message)
    const registration = data ? _toRegistration(data) : null

    if (registration && paymentData?.entryFee && paymentData.entryFee > 0) {
      try {
        await this._recordCompetitionFinancials(registration.id, competitionId, paymentData)
      } catch (e) {
        console.warn('[registerIndividual] Ledger recording failed (non-blocking):', e)
      }
    }

    return registration
  },

  // ── Create Team & Register Leader ───────────────────────────────────────
  async createTeamAndRegister(competitionId: string, teamName: string): Promise<{ team: CompetitionTeam; registration: CompetitionRegistration }> {
    const userId = await _getUserId()
    if (!userId) throw new Error('Not authenticated')

    const validation = await _validateRegistration(competitionId, userId)
    if (!validation.valid) throw new Error(validation.error)

    const { data: teamData, error: teamError } = await supabase
      .from('competition_teams')
      .insert({
        competition_id: competitionId,
        name: teamName,
        leader_id: userId,
        team_size: 1,
        status: 'forming',
      })
      .select('*')
      .single()

    if (teamError) throw new Error(teamError.message)

    const { data: regData, error: regError } = await supabase
      .from('competition_registrations')
      .insert({
        competition_id: competitionId,
        user_id: userId,
        registration_type: 'team',
        team_id: teamData.id,
        team_role: 'leader',
        status: 'draft',
        current_stage: 1,
        entry_fee_paid: 0,
        payment_method: 'pending',
        payment_reference: null,
        verified: true,
      })
      .select('*, users:user_id(id, name, email, profile_avatar)')
      .single()

    if (regError) throw new Error(regError.message)

    return { team: _toTeam(teamData), registration: _toRegistration(regData) }
  },

  // ── Join Team by Invite Code ────────────────────────────────────────────
  async joinTeamByCode(competitionId: string, inviteCode: string): Promise<TeamJoinRequest | null> {
    const userId = await _getUserId()
    if (!userId) throw new Error('Not authenticated')

    const validation = await _validateRegistration(competitionId, userId)
    if (!validation.valid) throw new Error(validation.error)

    const { data: teamData, error: rpcError } = await supabase
      .rpc('get_team_by_invite_code', {
        p_invite_code: inviteCode.trim().toLowerCase(),
        p_competition_id: competitionId
      })
      .single()

    if (rpcError || !teamData) throw new Error('Invalid invite code or team not found')

    const { data: compData } = await supabase
      .from('competitions')
      .select('team_size_max')
      .eq('id', competitionId)
      .single()

    const team: any = { ...(teamData as any), competitions: compData }

    if (team.status === 'disqualified') throw new Error('This team has been disqualified')
    if (team.status === 'registered' || team.status === 'approved' || team.status === 'complete') {
      throw new Error('This team is already registered and locked. No new members can join.')
    }

    const maxSize = team.competitions?.team_size_max || 5
    if (team.team_size >= maxSize) throw new Error(`Team is full (max ${maxSize} members)`)

    return await this.sendJoinRequest(competitionId, team.id, 'Joined via Invite Code')
  },

  // ── Get Team by Invite Code (preview) ──────────────────────────────────
  async getTeamByInviteCode(inviteCode: string, competitionId: string): Promise<CompetitionTeam | null> {
    const { data: teamData } = await supabase
      .rpc('get_team_by_invite_code', {
        p_invite_code: inviteCode.trim().toLowerCase(),
        p_competition_id: competitionId
      })
      .single()

    if (!teamData) return null

    const { data: leaderData } = await supabase
      .from('users')
      .select('id, name, email, profile_avatar')
      .eq('id', (teamData as any).leader_id)
      .single()

    const data: any = { ...(teamData as any), leader: leaderData }

    const { data: members } = await supabase
      .from('competition_registrations')
      .select('*, users:user_id(id, name, email, profile_avatar)')
      .eq('team_id', data.id)

    const team = _toTeam(data)
    team.members = (members || []).map(_toRegistration)
    return team
  },

  // ── My Registrations ───────────────────────────────────────────────────
  async getMyRegistrations(): Promise<CompetitionRegistration[]> {
    const userId = await _getUserId()
    if (!userId) return []

    const { data, error } = await supabase
      .from('competition_registrations')
      .select('*, users:user_id(id, name, email, profile_avatar), competitions:competition_id(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) console.error('getMyRegistrations error:', error)
    if (!data) return []

    const teamIds = data.map((d: any) => d.team_id).filter(Boolean)
    if (teamIds.length > 0) {
      const { data: teamsData } = await supabase
        .from('competition_teams')
        .select('*, leader:users!competition_teams_leader_id_fkey(id, email, name, profile_avatar)')
        .in('id', teamIds)

      const teamMap = new Map((teamsData || []).map((t: any) => [t.id, t]))
      for (const row of data) {
        if (row.team_id && teamMap.has(row.team_id)) {
          row.team = teamMap.get(row.team_id)
        }
      }
    }

    return data.map(_toRegistration)
  },

  // ── My Registration for a Specific Competition ─────────────────────────
  async getMyRegistrationForCompetition(competitionId: string): Promise<CompetitionRegistration | null> {
    const userId = await _getUserId()
    if (!userId) return null

    const { data, error } = await supabase
      .from('competition_registrations')
      .select('*, users:user_id(id, name, email, profile_avatar)')
      .eq('competition_id', competitionId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) console.error('getMyRegistrationForCompetition error:', error)
    if (!data || data.length === 0) return null

    const row = data[0]
    if (row.team_id) {
      const { data: teamData } = await supabase
        .from('competition_teams')
        .select('*, leader:users!leader_id(id, name, email, profile_avatar)')
        .eq('id', row.team_id)
        .single()
      if (teamData) row.team = teamData
    }

    return _toRegistration(row)
  },

  // ── All Participants for Multiple Competitions (organizer stats) ────────
  async getRegistrationsByCompetitions(competitionIds: string[]): Promise<CompetitionRegistration[]> {
    if (!competitionIds || competitionIds.length === 0) return []
    const { data, error } = await supabase
      .from('competition_registrations')
      .select('*, users:user_id(id, name, email, profile_avatar)')
      .in('competition_id', competitionIds)
      .neq('status', 'draft')

    if (error) console.error('getRegistrationsByCompetitions error:', error)
    if (!data) return []

    const teamIds = data.map((d: any) => d.team_id).filter(Boolean)
    if (teamIds.length > 0) {
      const { data: teamsData } = await supabase
        .from('competition_teams')
        .select('*, leader:users!leader_id(id, name, email, profile_avatar)')
        .in('id', teamIds)

      const teamMap = new Map((teamsData || []).map((t: any) => [t.id, t]))
      for (const row of data) {
        if (row.team_id && teamMap.has(row.team_id)) {
          row.team = teamMap.get(row.team_id)
        }
      }
    }

    return data.map(_toRegistration)
  },

  // ── All Participants for a Competition (organizer view) ─────────────────
  async getCompetitionParticipants(competitionId: string): Promise<CompetitionRegistration[]> {
    const { data, error } = await supabase
      .from('competition_registrations')
      .select('*, users:user_id(id, name, email, profile_avatar)')
      .eq('competition_id', competitionId)
      .neq('status', 'draft')

    if (error) console.error('getCompetitionParticipants error:', error)
    if (!data) return []

    const teamIds = data.map((d: any) => d.team_id).filter(Boolean)
    if (teamIds.length > 0) {
      const { data: teamsData } = await supabase
        .from('competition_teams')
        .select('*, leader:users!leader_id(id, name, email, profile_avatar)')
        .in('id', teamIds)

      const teamMap = new Map((teamsData || []).map((t: any) => [t.id, t]))
      for (const row of data) {
        if (row.team_id && teamMap.has(row.team_id)) {
          row.team = teamMap.get(row.team_id)
        }
      }
    }

    return data.map(_toRegistration)
  },

  // ── Get Teams for a Competition ────────────────────────────────────────
  async getCompetitionTeams(competitionId: string): Promise<CompetitionTeam[]> {
    const { data: teams } = await supabase
      .from('competition_teams')
      .select('*, leader:users!leader_id(id, name, email, profile_avatar)')
      .eq('competition_id', competitionId)
      .order('created_at', { ascending: true })

    if (!teams) return []

    const enriched = await Promise.all(
      teams.map(async (t: any) => {
        const { data: members } = await supabase
          .from('competition_registrations')
          .select('*, users:user_id(id, name, email, profile_avatar)')
          .eq('team_id', t.id)
        const team = _toTeam(t)
        team.members = (members || []).map(_toRegistration)
        return team
      })
    )
    return enriched
  },

  // ── Team Members ─────────────────────────────────────────────────────────
  async getTeamMembers(teamId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('competition_registrations')
      .select('*, user:user_id(id, name, email, profile_avatar)')
      .eq('team_id', teamId)
      .order('team_role', { ascending: false })

    if (error) { console.error('getTeamMembers error:', error); return [] }
    return data || []
  },

  // ── Registration Count ─────────────────────────────────────────────────
  async getRegistrationCount(competitionId: string): Promise<number> {
    const { count } = await supabase
      .from('competition_registrations')
      .select('id', { count: 'exact', head: true })
      .eq('competition_id', competitionId)
      .neq('status', 'withdrawn')
      .neq('status', 'draft')
    return count || 0
  },

  // ── Withdraw Registration ──────────────────────────────────────────────
  async withdrawRegistration(registrationId: string): Promise<void> {
    const { error } = await supabase
      .from('competition_registrations')
      .update({ status: 'withdrawn', updated_at: new Date().toISOString() })
      .eq('id', registrationId)
    if (error) throw new Error(error.message)
  },

  // ── Update Participant Status ─────────────────────────────────────────
  async updateParticipantStatus(
    registrationId: string,
    status: 'registered' | 'confirmed' | 'shortlisted' | 'eliminated' | 'winner',
    currentStage?: number
  ): Promise<void> {
    const updates: any = { status, updated_at: new Date().toISOString() }
    if (currentStage !== undefined) updates.current_stage = currentStage

    const { error } = await supabase
      .from('competition_registrations')
      .update(updates)
      .eq('id', registrationId)
    if (error) throw new Error(error.message)
  },

  // ── Bulk Update Status ────────────────────────────────────────────────
  async bulkUpdateStatus(
    competitionId: string,
    registrationIds: string[],
    status: 'shortlisted' | 'eliminated' | 'winner',
    nextStage?: number
  ): Promise<void> {
    const updates: any = { status, updated_at: new Date().toISOString() }
    if (nextStage !== undefined) updates.current_stage = nextStage

    const { error } = await supabase
      .from('competition_registrations')
      .update(updates)
      .in('id', registrationIds)
      .eq('competition_id', competitionId)
    if (error) throw new Error(error.message)
  },

  // ── Open Teams ────────────────────────────────────────────────────────
  async getOpenTeams(competitionId: string): Promise<CompetitionTeam[]> {
    const { data: teams } = await supabase
      .from('competition_teams')
      .select('*, leader:users!leader_id(id, name, email, profile_avatar), competitions!competition_id(team_size_max)')
      .eq('competition_id', competitionId)
      .eq('looking_for_teammates', true)
      .in('status', ['forming', 'draft'])
      .order('created_at', { ascending: false })

    if (!teams) return []

    return teams
      .filter((t: any) => {
        const maxSize = t.competitions?.team_size_max || 5
        return t.team_size < maxSize
      })
      .map((t: any) => _toTeam(t))
  },

  // ── Send Join Request ─────────────────────────────────────────────────
  async sendJoinRequest(competitionId: string, teamId: string, message?: string): Promise<TeamJoinRequest> {
    const userId = await _getUserId()
    if (!userId) throw new Error('Not authenticated')

    const { data: existing } = await supabase
      .from('competition_registrations')
      .select('id').eq('competition_id', competitionId).eq('user_id', userId).maybeSingle()
    if (existing) throw new Error('You are already in a team or registered for this competition')

    const { data: existingReq } = await supabase
      .from('team_join_requests')
      .select('id').eq('team_id', teamId).eq('user_id', userId).eq('status', 'pending').maybeSingle()
    if (existingReq) throw new Error('You already have a pending request for this team')

    const { data, error } = await supabase
      .from('team_join_requests')
      .insert({
        competition_id: competitionId,
        team_id: teamId,
        user_id: userId,
        message: message || null,
        status: 'pending',
      })
      .select('*, users:user_id(id, name, email, profile_avatar)')
      .single()

    if (error) throw new Error(error.message)
    return data as TeamJoinRequest
  },

  // ── My Join Requests ──────────────────────────────────────────────────
  async getMyJoinRequests(competitionId: string): Promise<TeamJoinRequest[]> {
    const userId = await _getUserId()
    if (!userId) return []

    const { data } = await supabase
      .from('team_join_requests')
      .select('*')
      .eq('competition_id', competitionId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (!data || data.length === 0) return []

    const teamIds = Array.from(new Set(data.map((req: any) => req.team_id)))
    if (teamIds.length > 0) {
      const { data: teamsData } = await supabase
        .from('competition_teams')
        .select('*, leader:users!leader_id(id, name, email, profile_avatar)')
        .in('id', teamIds)

      if (teamsData) {
        data.forEach((req: any) => {
          req.competition_teams = teamsData.find((t: any) => t.id === req.team_id)
        })
      }
    }

    return data as TeamJoinRequest[]
  },

  // ── Team Join Requests (leader view) ──────────────────────────────────
  async getTeamJoinRequests(teamId: string): Promise<TeamJoinRequest[]> {
    const { data } = await supabase
      .from('team_join_requests')
      .select('*, users:user_id(id, name, email, profile_avatar)')
      .eq('team_id', teamId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    return (data || []) as TeamJoinRequest[]
  },

  // ── Respond to Join Request ───────────────────────────────────────────
  async respondToJoinRequest(requestId: string, approve: boolean): Promise<void> {
    const { data: request } = await supabase
      .from('team_join_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (!request) throw new Error('Request not found')

    const { data: teamData } = await supabase
      .from('competition_teams')
      .select('*, competitions!competition_id(team_size_max, entry_fee)')
      .eq('id', request.team_id)
      .single()

    if (approve) {
      const maxSize = teamData?.competitions?.team_size_max || 5
      if (teamData?.team_size >= maxSize) throw new Error('Team is full')

      const { data: existing } = await supabase
        .from('competition_registrations')
        .select('id').eq('competition_id', request.competition_id).eq('user_id', request.user_id).maybeSingle()
      if (existing) throw new Error('User is already in a team or registered for this competition')

      await supabase
        .from('competition_registrations')
        .insert({
          competition_id: request.competition_id,
          user_id: request.user_id,
          registration_type: 'team',
          team_id: request.team_id,
          team_role: 'member',
          status: 'registered',
          current_stage: 1,
          entry_fee_paid: 0,
          payment_method: 'free',
          verified: true,
        })

      await supabase
        .from('competition_teams')
        .update({ team_size: (teamData?.team_size || 1) + 1 })
        .eq('id', request.team_id)
    }

    await supabase
      .from('team_join_requests')
      .update({ status: approve ? 'approved' : 'rejected', updated_at: new Date().toISOString() })
      .eq('id', requestId)
  },

  // ── Add Member to Team ────────────────────────────────────────────────
  async addMemberToTeam(competitionId: string, teamId: string, userId: string): Promise<CompetitionRegistration | null> {
    const { data: team } = await supabase
      .from('competition_teams')
      .select('*, competitions!competition_id(team_size_max)')
      .eq('id', teamId)
      .single()

    if (!team) throw new Error('Team not found')
    const maxSize = team.competitions?.team_size_max || 5
    if (team.team_size >= maxSize) throw new Error(`Team is full (max ${maxSize} members)`)

    const { data: existing } = await supabase
      .from('competition_registrations')
      .select('id, status').eq('competition_id', competitionId).eq('user_id', userId).maybeSingle()
    if (existing) throw new Error('User is already registered for this competition')

    const { data: existingLeader } = await supabase
      .from('competition_teams')
      .select('id, name')
      .eq('competition_id', competitionId)
      .eq('leader_id', userId)
      .maybeSingle()
    if (existingLeader) throw new Error(`User is already leading team "${existingLeader.name}" in this competition`)

    const { data: regData, error: regError } = await supabase
      .from('competition_registrations')
      .insert({
        competition_id: competitionId,
        user_id: userId,
        registration_type: 'team',
        team_id: teamId,
        team_role: 'member',
        status: 'draft',
        current_stage: 1,
        entry_fee_paid: 0,
        payment_method: 'pending',
        verified: false,
      })
      .select('*, users:user_id(id, name, email, profile_avatar)')
      .single()

    if (regError) {
      if (regError.code === '23505' || regError.message?.includes('competition_registrations_competition_id_user_id_key')) {
        throw new Error('This candidate is already registered for this competition (in another team or as an individual).')
      }
      throw new Error(regError.message)
    }

    await supabase
      .from('competition_teams')
      .update({ team_size: team.team_size + 1 })
      .eq('id', teamId)

    return regData ? _toRegistration(regData) : null
  },

  // ── Verify Registration ───────────────────────────────────────────────
  async verifyRegistration(registrationId: string): Promise<void> {
    const userId = await _getUserId()
    if (!userId) throw new Error('Not authenticated')

    const { data: reg } = await supabase
      .from('competition_registrations')
      .select('team_id')
      .eq('id', registrationId)
      .eq('user_id', userId)
      .single()

    if (!reg) throw new Error('Registration not found')

    const { data: team } = await supabase
      .from('competition_teams')
      .select('status')
      .eq('id', reg.team_id)
      .single()

    const targetStatus = team?.status === 'registered' ? 'registered' : 'draft'

    const { error } = await supabase
      .from('competition_registrations')
      .update({ verified: true, status: targetStatus, updated_at: new Date().toISOString() })
      .eq('id', registrationId)
      .eq('user_id', userId)

    if (error) throw new Error(error.message)
  },

  // ── Import Team from Team Builder ─────────────────────────────────────
  async importTeamBuilderTeam(competitionId: string, teamBuilderId: string): Promise<{ team: CompetitionTeam; registration: CompetitionRegistration }> {
    const userId = await _getUserId()
    if (!userId) throw new Error('Not authenticated')

    const validation = await _validateRegistration(competitionId, userId)
    if (!validation.valid) throw new Error(validation.error)

    const { data: tbTeam } = await supabase
      .from('teams')
      .select('*, team_members(*)')
      .eq('id', teamBuilderId)
      .single()

    if (!tbTeam) throw new Error('Team Builder team not found')

    const { data: comp } = await supabase
      .from('competitions')
      .select('team_size_min, team_size_max, entry_fee')
      .eq('id', competitionId)
      .single()

    const maxSize = comp?.team_size_max || 5
    const approvedMembers = (tbTeam.team_members || []).filter((m: any) => m.status === 'approved')
    const totalSize = 1 + approvedMembers.length

    if (totalSize > maxSize) {
      throw new Error(`Team has ${totalSize} members but max allowed is ${maxSize}. Remove members first.`)
    }

    const { data: teamData, error: teamError } = await supabase
      .from('competition_teams')
      .insert({
        competition_id: competitionId,
        name: tbTeam.team_name,
        leader_id: userId,
        team_size: totalSize,
        status: 'forming',
        looking_for_teammates: false,
      })
      .select('*')
      .single()

    if (teamError) throw new Error(teamError.message)

    const { data: leaderReg, error: leaderError } = await supabase
      .from('competition_registrations')
      .insert({
        competition_id: competitionId,
        user_id: userId,
        registration_type: 'team',
        team_id: teamData.id,
        team_role: 'leader',
        status: 'registered',
        current_stage: 1,
        entry_fee_paid: 0,
        payment_method: 'free',
        verified: true,
      })
      .select('*, users:user_id(id, name, email, profile_avatar)')
      .single()

    if (leaderError) throw new Error(leaderError.message)

    for (const member of approvedMembers) {
      const { data: existingMember } = await supabase
        .from('competition_registrations')
        .select('id').eq('competition_id', competitionId).eq('user_id', member.user_id).maybeSingle()

      if (!existingMember) {
        await supabase
          .from('competition_registrations')
          .insert({
            competition_id: competitionId,
            user_id: member.user_id,
            registration_type: 'team',
            team_id: teamData.id,
            team_role: 'member',
            status: 'registered',
            current_stage: 1,
            entry_fee_paid: 0,
            payment_method: 'free',
            verified: false,
          })
      }
    }

    return { team: _toTeam(teamData), registration: _toRegistration(leaderReg) }
  },

  // ── Pending Invites & Join Requests ───────────────────────────────────
  async getLeaderJoinRequests(): Promise<TeamJoinRequest[]> {
    const userId = await _getUserId()
    if (!userId) return []

    // 1. Find all teams led by this user
    const { data: myTeams } = await supabase
      .from('competition_teams')
      .select('id')
      .eq('leader_id', userId)

    if (!myTeams || myTeams.length === 0) return []
    const teamIds = myTeams.map((t: any) => t.id)

    // 2. Find all pending requests for these teams
    const { data: requests } = await supabase
      .from('team_join_requests')
      .select('*, users:user_id(id, name, email, profile_avatar)')
      .in('team_id', teamIds)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (!requests || requests.length === 0) return []

    // Manually fetch team info & competition info
    const { data: teamsData } = await supabase
      .from('competition_teams')
      .select('*, competitions!competition_id(id, title, category, banner_url, registration_deadline, is_online, city, team_size_min, team_size_max, entry_fee)')
      .in('id', teamIds)
      
    if (teamsData) {
      requests.forEach((req: any) => {
        req.competition_teams = teamsData.find((t: any) => t.id === req.team_id)
      })
    }

    return requests as TeamJoinRequest[]
  },

  async getPendingInvites(): Promise<any[]> {
    return this.getMyPendingInvites()
  },

  async getMyPendingInvites(): Promise<CompetitionRegistration[]> {
    const userId = await _getUserId()
    if (!userId) return []

    const { data, error } = await supabase
      .from('competition_registrations')
      .select('*, users:user_id(id, name, email, profile_avatar), competitions:competition_id(*)')
      .eq('user_id', userId)
      .eq('verified', false)
      .eq('registration_type', 'team')
      .eq('team_role', 'member')
      .neq('status', 'withdrawn')
      .order('created_at', { ascending: false })

    if (error) console.error('getMyPendingInvites error:', error)
    if (!data) return []

    const teamIds = data.map((d: any) => d.team_id).filter(Boolean)
    if (teamIds.length > 0) {
      const { data: teamsData } = await supabase
        .from('competition_teams')
        .select('*, leader:users!leader_id(id, name, email, profile_avatar)')
        .in('id', teamIds)

      const teamMap = new Map((teamsData || []).map((t: any) => [t.id, t]))
      for (const row of data) {
        if (row.team_id && teamMap.has(row.team_id)) {
          row.team = teamMap.get(row.team_id)
        }
      }
    }

    return data.map(_toRegistration)
  },

  // ── Remove Member from Team ───────────────────────────────────────────
  async removeMemberFromTeam(registrationId: string, teamId: string): Promise<void> {
    const { error } = await supabase
      .from('competition_registrations')
      .delete()
      .eq('id', registrationId)

    if (error) throw new Error(error.message)

    const { data: team } = await supabase
      .from('competition_teams')
      .select('team_size')
      .eq('id', teamId)
      .single()

    if (team) {
      await supabase
        .from('competition_teams')
        .update({ team_size: Math.max(1, (team.team_size || 1) - 1) })
        .eq('id', teamId)
    }
  },

  // ── Update Team Details ───────────────────────────────────────────────
  async updateTeamDetails(teamId: string, updates: { name?: string; lookingForTeammates?: boolean }): Promise<void> {
    const updatePayload: any = { updated_at: new Date().toISOString() }
    if (updates.name !== undefined) updatePayload.name = updates.name
    if (updates.lookingForTeammates !== undefined) updatePayload.looking_for_teammates = updates.lookingForTeammates

    const { error } = await supabase
      .from('competition_teams')
      .update(updatePayload)
      .eq('id', teamId)

    if (error) throw new Error(error.message)
  },

  // ── Finalize Team Registration ────────────────────────────────────────
  async finalizeTeamRegistration(teamId: string, paymentData?: {
    entryFee?: number; paymentMethod?: string; paymentReference?: string
  }): Promise<void> {
    const { error: teamError } = await supabase
      .from('competition_teams')
      .update({ status: 'registered', updated_at: new Date().toISOString() })
      .eq('id', teamId)

    if (teamError) throw new Error(teamError.message)

    // Calculate per-member entry fee
    let perMemberFee = 0;
    if (paymentData?.entryFee && paymentData.entryFee > 0) {
      // Find how many draft members this team has
      const { count } = await supabase
        .from('competition_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', teamId)
        .eq('status', 'draft');
      
      const numMembers = count || 1;
      perMemberFee = paymentData.entryFee / numMembers;
    }

    const { error: regError } = await supabase
      .from('competition_registrations')
      .update({
        status: 'registered',
        entry_fee_paid: perMemberFee,
        payment_method: paymentData?.paymentMethod || 'free',
        payment_reference: paymentData?.paymentReference || null,
        updated_at: new Date().toISOString(),
      })
      .eq('team_id', teamId)
      .eq('status', 'draft')

    if (regError) throw new Error(regError.message)

    if (paymentData?.entryFee && paymentData.entryFee > 0) {
      const { data: regs } = await supabase
        .from('competition_registrations')
        .select('id, competition_id')
        .eq('team_id', teamId)
        .limit(1)
        .single()

      if (regs) {
        try {
          await this._recordCompetitionFinancials(regs.id, regs.competition_id, paymentData)
        } catch (e) {
          console.warn('[finalizeTeamRegistration] Ledger recording failed (non-blocking):', e)
        }
      }
    }
  },

  // ── Financial Ledger ──────────────────────────────────────────────────
  async _recordCompetitionFinancials(registrationId: string, competitionId: string, paymentData: {
    entryFee?: number; paymentMethod?: string; paymentReference?: string
  }) {
    try {
      if (!paymentData.entryFee || paymentData.entryFee <= 0) return

      // Fetch competition organizer
      const { data: comp } = await supabase
        .from('competitions')
        .select('organizer_id')
        .eq('id', competitionId)
        .single()

      const organizer_id = comp?.organizer_id

      const ticketSubtotal = paymentData.entryFee
      const bookingFee = Number((ticketSubtotal * 0.025).toFixed(2))
      const totalPaid = ticketSubtotal + bookingFee

      const razorpayFeeCalc = Number((ticketSubtotal * 0.0236).toFixed(2))
      const plutoCommission = Number((ticketSubtotal * 0.0114).toFixed(2))
      const organizerNet = Number((totalPaid - razorpayFeeCalc - plutoCommission).toFixed(2))

      const { error } = await supabase.from('booking_financials').insert({
        source_type: 'competition',
        competition_registration_id: registrationId,
        competition_id: competitionId,
        organizer_id: organizer_id,
        ticket_subtotal: ticketSubtotal,
        booking_fee: bookingFee,
        total_paid: totalPaid,
        razorpay_fee: razorpayFeeCalc,
        pluto_commission: plutoCommission,
        organizer_net: organizerNet,
        payout_status: 'unsettled',
      })

      if (error) {
        console.warn('[_recordCompetitionFinancials] Ledger insert failed (non-blocking):', error.message)
      }
    } catch (e) {
      console.warn('[_recordCompetitionFinancials] Unexpected error (non-blocking):', e)
    }
  },

  // ── Reject Invite ─────────────────────────────────────────────────────
  async rejectInvite(registrationId: string): Promise<void> {
    const { error } = await supabase
      .from('competition_registrations')
      .delete()
      .eq('id', registrationId)

    if (error) throw new Error(error.message)
  },

  // ── Submit Stage Deliverable ──────────────────────────────────────────
  async submitStageDeliverable(
    registrationType: 'individual' | 'team',
    id: string,
    stageIndex: number,
    submissionData: any
  ): Promise<void> {
    const table = registrationType === 'team' ? 'competition_teams' : 'competition_registrations'

    const { data: existing, error: fetchError } = await supabase
      .from(table)
      .select('submissions')
      .eq('id', id)
      .single()

    if (fetchError) throw new Error(fetchError.message)

    const currentSubmissions = existing?.submissions || {}
    const updatedSubmissions = {
      ...currentSubmissions,
      [stageIndex]: {
        ...submissionData,
        submitted_at: new Date().toISOString()
      }
    }

    const { error: updateError } = await supabase
      .from(table)
      .update({ submissions: updatedSubmissions })
      .eq('id', id)

    if (updateError) throw new Error(updateError.message)
  },

  // ── Save Custom Form Response ───────────────────────────────────────────
  async saveFormResponse(params: {
    competitionId: string
    teamId?: string | null
    registrationId?: string | null
    answers: Record<string, any>
    formConfig?: any
  }): Promise<any> {
    const userId = await _getUserId()
    let userName = 'Participant'
    let userEmail = ''

    if (userId) {
      const { data: userProfile } = await supabase.from('users').select('name, email').eq('id', userId).maybeSingle()
      if (userProfile) {
        userName = userProfile.name || userName
        userEmail = userProfile.email || ''
      }
    }

    const responsePayload = {
      form_id: params.formConfig?.id || 'custom_form',
      competition_id: params.competitionId,
      team_id: params.teamId || null,
      user_id: userId,
      submitted_by_name: userName,
      submitted_by_email: userEmail,
      submitted_at: new Date().toISOString(),
      answers: params.answers,
    }

    // 1. If teamId is provided, save into competition_teams.submissions.custom_form_response
    if (params.teamId) {
      const { data: teamData } = await supabase.from('competition_teams').select('submissions').eq('id', params.teamId).single()
      const currentSubmissions = (teamData?.submissions && typeof teamData.submissions === 'object' && !Array.isArray(teamData.submissions))
        ? teamData.submissions
        : {}
      await supabase.from('competition_teams').update({
        submissions: { ...currentSubmissions, custom_form_response: responsePayload }
      }).eq('id', params.teamId)
    }

    // 2. If registrationId or userId is provided, update registration submissions
    let regId = params.registrationId
    if (!regId && userId) {
      const { data: reg } = await supabase.from('competition_registrations')
        .select('id, submissions')
        .eq('competition_id', params.competitionId)
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle()
      if (reg) regId = reg.id
    }

    if (regId) {
      const { data: regData } = await supabase.from('competition_registrations').select('submissions').eq('id', regId).single()
      const currentSubmissions = (regData?.submissions && typeof regData.submissions === 'object' && !Array.isArray(regData.submissions))
        ? regData.submissions
        : {}
      await supabase.from('competition_registrations').update({
        submissions: { ...currentSubmissions, custom_form_response: responsePayload }
      }).eq('id', regId)
    }

    return responsePayload
  },

  // ── Get Custom Form Response ────────────────────────────────────────────
  async getFormResponse(competitionId: string, teamId?: string | null, userId?: string | null): Promise<any | null> {
    if (teamId) {
      const { data: team } = await supabase.from('competition_teams').select('submissions').eq('id', teamId).single()
      if (team?.submissions?.custom_form_response) return team.submissions.custom_form_response
    }
    const uid = userId || await _getUserId()
    if (uid) {
      const { data: reg } = await supabase.from('competition_registrations')
        .select('submissions')
        .eq('competition_id', competitionId)
        .eq('user_id', uid)
        .limit(1)
        .maybeSingle()
      if (reg?.submissions?.custom_form_response) return reg.submissions.custom_form_response
    }
    return null
  },
}
