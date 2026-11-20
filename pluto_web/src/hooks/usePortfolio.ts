import { useRef, useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// ─── Types ────────────────────────────────────────

export interface Portfolio {
  id: string
  user_id: string
  course: string
  department: string
  hobbies: string[]
  interests: string[]
  skills: string[]
  skill_levels: Record<string, number>
  want_to_learn: string[]
  events_attended: string[]
  score: number
  ai_insights: string
  profile_builder: any
  created_at: string
  updated_at: string
}

export interface Collaborator {
  user_id: string
  name: string
  avatar_url?: string
}

export interface Project {
  id: string
  user_id: string
  name: string
  description: string
  tech_stack: string[]
  github: string
  deployed: string
  media: any[]
  visibility: 'public' | 'personal'
  collaborators: Collaborator[]
  owner_name?: string
  owner_avatar?: string
  created_at: string
}

export interface Team {
  id: string
  team_name: string
  competition_name: string
  purpose: string
  roles: string[]
  team_size: number
  location: string
  event_date: string
  creator_id: string
  creator_name: string
  status: 'open' | 'closed' | 'full'
  visibility: 'campus' | 'inter_college' | 'both'
  created_at: string
  team_members?: TeamMember[]
  creator_avatar?: string
}

export interface TeamMember {
  id: string
  team_id: string
  user_id: string
  email: string
  name: string
  role: string
  status: 'pending' | 'approved' | 'rejected'
  intro: string
  applied_at: string
  avatar?: string
  teams?: any
}

export interface ChatMessage {
  id: string
  team_id: string
  applicant_email: string
  sender_email: string
  sender_name: string
  message: string
  sent_at: string
}

// ─── Portfolio Fetchers ───────────────────────────

async function fetchPortfolio(userId: string): Promise<Portfolio | null> {
  const { data, error } = await supabase
    .from('portfolios')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data as Portfolio | null
}

// ─── Project Fetchers ─────────────────────────────

async function fetchMyProjects(userId: string): Promise<Project[]> {
  console.log('[fetchMyProjects] Fetching for userId:', userId)

  // Query 1: Projects I own (simple, no join needed)
  const { data: owned, error: e1 } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  console.log('[fetchMyProjects] Owned:', owned?.length, 'Error:', e1)
  if (e1) throw e1

  // Fetch the owner details separately to avoid Supabase relation errors
  let ownerInfo: { name: string, profile_avatar: string } | null = null
  try {
    const { data: ownerData } = await supabase.from('users').select('name, profile_avatar').eq('id', userId).single()
    if (ownerData) {
      ownerInfo = ownerData
    }
  } catch (e) {
    console.warn('Failed to fetch owner details:', e)
  }

  // Attach owner info to owned projects
  const ownedWithOwner = (owned || []).map(p => ({
    ...p,
    owner: ownerInfo
  }))

  // Query 2: Projects where I'm a collaborator
  let collab: any[] = []
  try {
    const { data, error: e2 } = await supabase
      .from('projects')
      .select('*')
      .contains('collaborators', `[{"user_id": "${userId}"}]`)
      .order('created_at', { ascending: false })

    if (e2) throw e2

    if (data && data.length > 0) {
      // Fetch owners for these collab projects safely
      const ownerIds = [...new Set(data.map(p => p.user_id))]
      const { data: ownersData } = await supabase
        .from('users')
        .select('id, name, profile_avatar')
        .in('id', ownerIds)

      const ownersMap = new Map(ownersData?.map(u => [u.id, u]) || [])

      collab = data.map(p => ({
        ...p,
        owner: ownersMap.get(p.user_id)
      }))
    }
  } catch (e) {
    console.warn('[fetchMyProjects] Collab query failed:', e)
  }

  // Merge & deduplicate
  const allProjects = [...(ownedWithOwner || []), ...collab]
  const seen = new Set<string>()
  const unique = allProjects.filter(p => {
    if (seen.has(p.id)) return false
    seen.add(p.id)
    return true
  })

  return unique.map((p: any) => ({
    ...p,
    collaborators: p.collaborators || [],
    owner_name: p.owner?.name || '',
    owner_avatar: p.owner?.profile_avatar || '',
  })) as Project[]
}

async function fetchPublicProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error

  // Fetch owner info for each unique user_id
  const ownerIds = [...new Set((data || []).map((p: any) => p.user_id))]
  let ownerMap: Record<string, { name: string; avatar: string }> = {}

  if (ownerIds.length > 0) {
    const { data: owners } = await supabase
      .from('users')
      .select('id, name, profile_avatar')
      .in('id', ownerIds)

    if (owners) {
      for (const o of owners) {
        ownerMap[o.id] = { name: o.name || '', avatar: o.profile_avatar || '' }
      }
    }
  }

  return (data || []).map((p: any) => ({
    ...p,
    collaborators: p.collaborators || [],
    owner_name: ownerMap[p.user_id]?.name || '',
    owner_avatar: ownerMap[p.user_id]?.avatar || '',
  })) as Project[]
}

// ─── Team Fetchers ────────────────────────────────

export async function attachAvatarsToTeams(teams: any[]): Promise<Team[]> {
  if (!teams || teams.length === 0) return []

  const userIds = new Set<string>()
  teams.forEach(t => {
    userIds.add(t.creator_id)
    if (t.team_members) {
      t.team_members.forEach((m: any) => userIds.add(m.user_id))
    }
  })

  const { data: users } = await supabase
    .from('users')
    .select('id, profile_avatar, college_id, college_ref:colleges!college_id(city, state)')
    .in('id', Array.from(userIds))

  const avatarMap = new Map()
  const collegeMap = new Map()
  const collegeLocationMap = new Map()
  console.log('[DEBUG attachAvatarsToTeams] Users fetched:', users?.map(u => ({ id: u.id, college_id: u.college_id })))

  if (users) {
    users.forEach(u => {
      avatarMap.set(u.id, u.profile_avatar)
      collegeMap.set(u.id, u.college_id)
      collegeLocationMap.set(u.id, (u as any).college_ref)
    })
  }

  return teams.map(t => ({
    ...t,
    creator_avatar: avatarMap.get(t.creator_id) || '',
    creator_college_id: collegeMap.get(t.creator_id) || null,
    creator_college_city: collegeLocationMap.get(t.creator_id)?.city || null,
    creator_college_state: collegeLocationMap.get(t.creator_id)?.state || null,
    team_members: t.team_members?.map((m: any) => ({
      ...m,
      avatar: avatarMap.get(m.user_id) || ''
    }))
  })) as Team[]
}

async function fetchAllTeams(): Promise<Team[]> {
  const { data, error } = await supabase
    .from('teams')
    .select('*, team_members(*)')
    .order('created_at', { ascending: false })

  if (error) throw error
  return attachAvatarsToTeams(data)
}

async function fetchTeamsByVisibility(visibility: 'campus' | 'inter_college' | 'both'): Promise<Team[]> {
  const { data, error } = await supabase
    .from('teams')
    .select('*, team_members(*)')
    .or(`visibility.eq.${visibility},visibility.eq.both`)
    .in('status', ['open', 'full'])
    .order('created_at', { ascending: false })

  if (error) throw error

  // Filter out teams whose event date has passed
  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  const validTeams = (data || []).filter((t: any) => {
    if (!t.event_date) return true
    return t.event_date >= todayStr
  })

  return attachAvatarsToTeams(validTeams)
}

async function fetchMyCreatedTeams(userId: string): Promise<Team[]> {
  const { data: memberData } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', userId)
    .eq('status', 'approved')

  const approvedTeamIds = memberData?.map((m: any) => m.team_id) || []

  let query = supabase
    .from('teams')
    .select('*, team_members(*)')
    .order('created_at', { ascending: false })

  if (approvedTeamIds.length > 0) {
    query = query.or(`creator_id.eq.${userId},id.in.(${approvedTeamIds.join(',')})`)
  } else {
    query = query.eq('creator_id', userId)
  }

  const { data, error } = await query

  if (error) throw error
  return attachAvatarsToTeams(data)
}

async function fetchMyApplications(userId: string): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from('team_members')
    .select('*, teams!inner(competition_name, purpose, creator_name, status, creator_id)')
    .eq('user_id', userId)
    .order('applied_at', { ascending: false })

  if (error) throw error
  if (!data || data.length === 0) return []

  const creatorIds = new Set(data.map((d: any) => d.teams.creator_id).filter(Boolean))
  const { data: users } = await supabase
    .from('users')
    .select('id, profile_avatar')
    .in('id', Array.from(creatorIds))

  const avatarMap = new Map(users?.map(u => [u.id, u.profile_avatar]) || [])

  return data.map((d: any) => ({
    ...d,
    teams: {
      ...d.teams,
      creator_avatar: avatarMap.get(d.teams.creator_id) || ''
    }
  })) as any[]
}

// ─── Student Fetchers ─────────────────────────────

async function fetchAllStudents(): Promise<any[]> {
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*, college_ref:colleges!college_id(name, state)')
    .not('email', 'like', '%@admin.com')
    .not('college_id', 'is', null)

  if (usersError) throw usersError

  // Filter out any admin users that might have slipped through the email check
  const baseStudentUsers = users?.filter(u => {
    if (u.email?.endsWith('@admin.com')) return false;
    if (u.roles?.includes('admin') || u.roles?.includes('college_admin')) return false;
    if (u.admin_type) return false;
    return true;
  }) || []

  // Fetch full portfolio data (not just score) so we can compute it properly
  const { data: portfolios, error: portError } = await supabase
    .from('portfolios')
    .select('user_id, department, course, skills, hobbies, interests, events_attended, score')

  if (portError) throw portError

  // Fetch project counts per user
  const { data: projects, error: projError } = await supabase
    .from('projects')
    .select('user_id, collaborators')

  if (projError) throw projError

  const portfolioMap = new Map()
  if (portfolios) {
    portfolios.forEach(p => portfolioMap.set(p.user_id, p))
  }

  // Count projects per user
  const projectCountMap = new Map<string, number>()
  if (projects) {
    projects.forEach((p: any) => {
      // Increment for owner
      projectCountMap.set(p.user_id, (projectCountMap.get(p.user_id) || 0) + 1)

      // Increment for collaborators
      if (Array.isArray(p.collaborators)) {
        p.collaborators.forEach((c: any) => {
          if (c.user_id && c.user_id !== p.user_id) {
            projectCountMap.set(c.user_id, (projectCountMap.get(c.user_id) || 0) + 1)
          }
        })
      }
    })
  }

  // Filter out pure organizers
  const studentUsers = baseStudentUsers.filter((u: any) => {
    const isPureOrganizer = u.roles?.includes('organizer') && !u.roles?.includes('user') && !u.roles?.includes('student') && !u.roles?.includes('admin')
    return !isPureOrganizer
  })

  return studentUsers.map((u: any) => {
    const port = portfolioMap.get(u.id)
    const projectCount = projectCountMap.get(u.id) || 0

    // Compute score from real data
    const skillsCount = Array.isArray(port?.skills) ? port.skills.length : 0
    const hobbiesCount = Array.isArray(port?.hobbies) ? port.hobbies.length : 0
    const interestsCount = Array.isArray(port?.interests) ? port.interests.length : 0
    const eventsCount = Array.isArray(port?.events_attended) ? port.events_attended.filter((e: any) => !e?.hidden).length : 0
    const profilePts = ((u.course || port?.course) ? 5 : 0) + ((u.department || port?.department) ? 5 : 0)
    const computedScore = (skillsCount * 5) + (projectCount * 20) + (eventsCount * 8) + profilePts + (hobbiesCount * 2) + (interestsCount * 2)

    return {
      id: u.id,
      email: u.email,
      name: u.name || u.username || (u.email || '').split('@')[0],
      college: u.college_ref?.name || u.colleges?.name || '',
      state: u.college_ref?.state || u.colleges?.state || '',
      college_id: u.college_id || '',
      department: u.department || port?.department || '',
      score: port?.score || computedScore || 0,
      roles: u.roles || ['student'],
      avatar_url: u.profile_avatar || u.avatar_url || '',
      bio: u.bio || '',
      username: u.username || '',
      socials: {
        instagram: u.instagram || '',
        twitter: u.twitter || '',
        linkedin: u.linkedin || '',
        github: u.github || '',
        portfolio: u.portfolio || '',
      },
    }
  })
}

async function updateTeamFn(params: {
  teamId: string;
  teamName: string;
  competitionName: string;
  purpose: string;
  roles: string[];
  teamSize: number;
  location: string;
  eventDate: string;
  eventTime?: string;
  visibility: 'campus' | 'inter_college' | 'both';
  eventId?: string;
}): Promise<Team> {
  const row = {
    team_name: params.teamName,
    competition_name: params.competitionName,
    purpose: params.purpose,
    roles: params.roles,
    team_size: params.teamSize,
    location: params.location,
    event_date: params.eventDate,
    event_time: params.eventTime || null,
    visibility: params.visibility,
    event_id: params.eventId || null,
  };
  const { data, error } = await supabase.from('teams').update(row).eq('id', params.teamId).select().single();
  if (error) throw error;
  return data as Team;
}

async function deleteTeamFn(teamId: string): Promise<void> {
  const { error } = await supabase.from('teams').delete().eq('id', teamId);
  if (error) throw error;
}

export function useUpdateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTeamFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
}

export function useDeleteTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTeamFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
}

// ─── Teams Methods ─────────────────────────────────────────────────────────

async function fetchChatMessages(teamId: string, applicantEmail: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('team_chats')
    .select('*')
    .eq('team_id', teamId)
    .eq('applicant_email', applicantEmail)
    .order('sent_at', { ascending: true })

  if (error) throw error
  return (data || []) as ChatMessage[]
}

// ─── Mutations ────────────────────────────────────

async function savePortfolio(params: { userId: string; data: Partial<Portfolio> }): Promise<Portfolio> {
  const row = {
    user_id: params.userId,
    ...params.data,
    updated_at: new Date().toISOString(),
  }

  console.log('[savePortfolio] Attempting upsert for user:', params.userId)
  console.log('[savePortfolio] Payload:', JSON.stringify(row, null, 2))

  // Check if we have an active auth session
  const { data: sessionData } = await supabase.auth.getSession()
  console.log('[savePortfolio] Auth session exists:', !!sessionData.session)
  if (!sessionData.session) {
    throw new Error('No active auth session. Please log in again.')
  }

  // Wrap the upsert in a timeout to prevent infinite hang
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Database request timed out after 15 seconds. Check your network or Supabase dashboard.')), 15000)
  )

  const upsertPromise = supabase
    .from('portfolios')
    .upsert(row, { onConflict: 'user_id' })
    .select()
    .single()

  const { data, error } = await Promise.race([upsertPromise, timeoutPromise])

  console.log('[savePortfolio] Response data:', data)
  console.log('[savePortfolio] Response error:', error)

  if (error) throw error
  return data as Portfolio
}

async function saveProject(params: { userId: string; project: Partial<Project> & { id?: string } }): Promise<Project> {
  const row = {
    user_id: params.userId,
    name: params.project.name,
    description: params.project.description || '',
    tech_stack: params.project.tech_stack || [],
    github: params.project.github || '',
    deployed: params.project.deployed || '',
    media: params.project.media || [],
    visibility: params.project.visibility || 'public',
    collaborators: params.project.collaborators || [],
  }

  if (params.project.id) {
    const { data, error } = await supabase
      .from('projects')
      .update(row)
      .eq('id', params.project.id)
      .select()
      .single()
    if (error) throw error
    return data as Project
  } else {
    const { data, error } = await supabase
      .from('projects')
      .insert(row)
      .select()
      .single()
    if (error) throw error
    return data as Project
  }
}

/**
 * Fetch all searchable users once (preloaded, cached by React Query).
 * Excludes admin accounts.
 */
async function fetchAllSearchableUsers(): Promise<Array<{ id: string; name: string; avatar_url: string; email: string }>> {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, profile_avatar, email, roles, admin_type')
    .not('email', 'like', '%@admin.com')
    .not('college_id', 'is', null)
    .is('admin_type', null)
    .order('name')

  if (error) throw error

  return (data || [])
    .filter((u: any) => {
      const roles = u.roles || []
      if (roles.includes('admin') || roles.includes('staff') || roles.includes('organizer')) return false
      return true
    })
    .map((u: any) => ({
      id: u.id,
      name: u.name || u.email.split('@')[0],
      avatar_url: u.profile_avatar || '',
      email: u.email,
    }))
}

async function deleteProject(projectId: string): Promise<void> {
  const { error } = await supabase.from('projects').delete().eq('id', projectId)
  if (error) throw error
}

async function createTeam(params: {
  creatorId: string
  creatorName: string
  teamName: string
  competitionName: string
  purpose: string
  roles: string[]
  teamSize: number
  location: string
  eventDate: string
  eventTime?: string
  visibility: 'campus' | 'inter_college' | 'both'
  eventId?: string
}): Promise<Team> {
  const row = {
    creator_id: params.creatorId,
    creator_name: params.creatorName,
    team_name: params.teamName,
    competition_name: params.competitionName,
    purpose: params.purpose,
    roles: params.roles,
    team_size: params.teamSize,
    location: params.location,
    event_date: params.eventDate,
    event_time: params.eventTime || null,
    visibility: params.visibility,
    event_id: params.eventId || null,
    status: 'open',
  }

  console.log('[createTeam] Sending payload:', row)

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Database request timed out after 10 seconds. Check your network or if the database schema is fully updated.')), 10000)
  )

  const insertPromise = supabase
    .from('teams')
    .insert(row)
    .select()
    .single()

  const { data, error } = await Promise.race([insertPromise, timeoutPromise]) as any

  console.log('[createTeam] Response error:', error)
  if (error) {
    if (error.code === 'PGRST204' || error.code === '42703') {
      throw new Error(`Database Schema Error: ${error.message}. Please run the ALTER TABLE commands in Supabase SQL Editor to add 'team_name', 'visibility', and 'event_id'.`)
    }
    throw error
  }
  return data as Team
}

async function applyToTeam(params: {
  teamId: string
  userId: string
  email: string
  name: string
  role: string
  intro: string
}): Promise<TeamMember> {
  const row = {
    team_id: params.teamId,
    user_id: params.userId,
    email: params.email,
    name: params.name,
    role: params.role,
    status: 'pending',
    intro: params.intro,
  }

  const { data, error } = await supabase
    .from('team_members')
    .insert(row)
    .select()
    .single()

  if (error) throw error

  if (params.intro && params.intro.trim()) {
    await supabase.from('team_chats').insert({
      team_id: params.teamId,
      applicant_email: params.email,
      sender_email: params.email,
      sender_name: params.name,
      message: params.intro.trim(),
    })
  }

  return data as TeamMember
}

async function updateMemberStatus(params: { memberId: string; status: 'approved' | 'rejected' }): Promise<void> {
  const { error } = await supabase
    .from('team_members')
    .update({ status: params.status })
    .eq('id', params.memberId)

  if (error) throw error
}

async function sendChatMessage(params: {
  teamId: string
  applicantEmail: string
  senderEmail: string
  senderName: string
  text: string
}): Promise<void> {
  const { error } = await supabase.from('team_chats').insert({
    team_id: params.teamId,
    applicant_email: params.applicantEmail,
    sender_email: params.senderEmail,
    sender_name: params.senderName,
    message: params.text,
  })

  if (error) throw error
}

// ─── React Query Hooks ────────────────────────────

// Portfolio
export function usePortfolio(userId?: string) {
  return useQuery({
    queryKey: ['portfolio', userId],
    queryFn: () => fetchPortfolio(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useSavePortfolio() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: savePortfolio,
    onSuccess: (data, vars) => {
      // Use the returned data from DB instead of re-fetching (avoids race conditions)
      queryClient.setQueryData(['portfolio', vars.userId], data)
      queryClient.invalidateQueries({ queryKey: ['students'] })
    },
  })
}

// Projects
export function useMyProjects(userId?: string) {
  return useQuery({
    queryKey: ['projects', 'mine', userId],
    queryFn: () => fetchMyProjects(userId!),
    enabled: !!userId,
    staleTime: 30_000,
    retry: 2,
    refetchOnWindowFocus: true,
  })
}

export function usePublicProjects() {
  return useQuery({
    queryKey: ['projects', 'public'],
    queryFn: fetchPublicProjects,
    staleTime: 30_000,
    retry: 2,
    refetchOnWindowFocus: true,
  })
}

export function useSaveProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: saveProject,
    onSuccess: (savedProject, vars) => {
      // Instantly inject the returned data into the cache so the UI updates immediately
      // without waiting for a network refetch
      queryClient.setQueryData(
        ['projects', 'mine', vars.userId],
        (old: Project[] | undefined) => {
          if (!old) return [savedProject]
          // If editing, replace the old entry; if new, prepend it
          const exists = old.some(p => p.id === savedProject.id)
          if (exists) {
            return old.map(p => p.id === savedProject.id ? { ...savedProject, collaborators: savedProject.collaborators || [] } : p)
          }
          return [{ ...savedProject, collaborators: savedProject.collaborators || [] }, ...old]
        }
      )
      // Also invalidate public projects so Browse tab updates
      queryClient.invalidateQueries({ queryKey: ['projects', 'public'] })
      queryClient.invalidateQueries({ queryKey: ['students'] })
    },
    onSettled: (_data, _error, vars) => {
      // Safety net: always refetch in background to sync with DB truth
      queryClient.invalidateQueries({ queryKey: ['projects', 'mine', vars.userId] })
      if (vars.project.collaborators) {
        vars.project.collaborators.forEach((c: any) => {
          queryClient.invalidateQueries({ queryKey: ['projects', 'mine', c.user_id] })
        })
      }
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteProject,
    onSettled: () => {
      // Always invalidate — even on failure — so the UI stays in sync
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

/**
 * Preloads all users once (cached 10 min by React Query).
 * Exposes a synchronous `filterUsers(query)` that does instant
 * client-side filtering — zero network calls per keystroke.
 *
 * This is the pattern used by Slack, Linear, and Notion for
 * small-to-medium user pools (< 10k users).
 */
export function useSearchUsers() {
  const { data: allUsers = [] } = useQuery({
    queryKey: ['users', 'searchable'],
    queryFn: fetchAllSearchableUsers,
    staleTime: 10 * 60 * 1000, // 10 min cache
    retry: 2,
  })

  const filterUsers = useCallback((query: string): Array<{ id: string; name: string; avatar_url: string; email: string }> => {
    if (!query || query.trim().length < 1) return []
    const q = query.trim().toLowerCase()
    return allUsers
      .filter(u =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      )
      .slice(0, 8)
  }, [allUsers])

  return { filterUsers }
}

// Teams
export function useAllTeams() {
  return useQuery({
    queryKey: ['teams'],
    queryFn: fetchAllTeams,
    staleTime: 2 * 60 * 1000,
  })
}

export function useTeamsByVisibility(visibility: 'campus' | 'inter_college') {
  return useQuery({
    queryKey: ['teams', 'visibility', visibility],
    queryFn: () => fetchTeamsByVisibility(visibility),
    staleTime: 2 * 60 * 1000,
  })
}

export function useMyCreatedTeams(userId?: string) {
  return useQuery({
    queryKey: ['teams', 'created', userId],
    queryFn: () => fetchMyCreatedTeams(userId!),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  })
}

export function useMyApplications(userId?: string) {
  return useQuery({
    queryKey: ['teams', 'applications', userId],
    queryFn: () => fetchMyApplications(userId!),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  })
}

export function useCreateTeam() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
    },
  })
}

export function useApplyToTeam() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: applyToTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
    },
  })
}

export function useUpdateMemberStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateMemberStatus,
    onMutate: async ({ memberId, status }) => {
      await queryClient.cancelQueries({ queryKey: ['teams'] })
      const previousQueries = queryClient.getQueriesData<Team[]>({ queryKey: ['teams'] })

      previousQueries.forEach(([queryKey, oldData]) => {
        if (!oldData) return
        queryClient.setQueryData(queryKey, oldData.map(team => ({
          ...team,
          team_members: team.team_members?.map(m =>
            m.id === memberId ? { ...m, status } : m
          )
        })))
      })

      return { previousQueries }
    },
    onError: (err, variables, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, oldData]) => {
          queryClient.setQueryData(queryKey, oldData)
        })
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
    },
  })
}

// Students
export function useAllStudents() {
  return useQuery({
    queryKey: ['students'],
    queryFn: fetchAllStudents,
    staleTime: 5 * 60 * 1000,
  })
}

// Chat
export function useChatMessages(teamId: string | null, applicantEmail: string | null) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!teamId || !applicantEmail) return

    const channel = supabase
      .channel(`chat_${teamId}_${applicantEmail}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'team_chats',
          filter: `team_id=eq.${teamId}`,
        },
        (payload) => {
          if (payload.new.applicant_email === applicantEmail) {
            queryClient.invalidateQueries({ queryKey: ['chat', teamId, applicantEmail] })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [teamId, applicantEmail, queryClient])

  return useQuery({
    queryKey: ['chat', teamId, applicantEmail],
    queryFn: () => fetchChatMessages(teamId!, applicantEmail!),
    enabled: !!teamId && !!applicantEmail,
    staleTime: 10 * 1000,
    refetchOnWindowFocus: true,
    retry: 2,
  })
}

export function useSendChatMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: sendChatMessage,
    onMutate: async (vars) => {
      const queryKey = ['chat', vars.teamId, vars.applicantEmail]
      await queryClient.cancelQueries({ queryKey })

      const previousMessages = queryClient.getQueryData(queryKey)

      const optimisticMsg = {
        id: Math.random().toString(),
        team_id: vars.teamId,
        applicant_email: vars.applicantEmail,
        sender_email: vars.senderEmail,
        sender_name: vars.senderName,
        message: vars.text,
        sent_at: new Date().toISOString()
      }

      queryClient.setQueryData(queryKey, (old: any) => {
        return old ? [...old, optimisticMsg] : [optimisticMsg]
      })

      return { previousMessages, queryKey }
    },
    onError: (err, _, context: any) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(context.queryKey, context.previousMessages)
      }
    },
    onSettled: (_, __, vars) => {
      queryClient.invalidateQueries({ queryKey: ['chat', vars.teamId, vars.applicantEmail] })
    },
  })
}
