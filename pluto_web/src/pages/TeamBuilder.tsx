import { useState, useRef, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, MapPin, CalendarDays, Rocket, Shield, Plus, Inbox, Send, CheckCircle2, XCircle, MessageCircle, Clock, Globe, School, Map, Building2, Info, Search, X, Crown, CircleDashed, ChevronDown, Edit3, Trash2 } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { useMyCreatedTeams, useMyApplications, useCreateTeam, useUpdateTeam, useDeleteTeam, useUpdateMemberStatus, useChatMessages, useSendChatMessage } from '@/hooks/usePortfolio'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { TeamCard, formatEventDate, formatEventTime } from '@/components/ui/TeamCard'
import { isTeamActive } from '@/lib/utils'
import { INDIAN_STATES_CITIES } from '@/lib/constants'

import type { Event } from '@/types'
import './TeamBuilder.css'

type Tab = 'create' | 'my-teams' | 'received' | 'applied'
type Visibility = 'campus' | 'inter_college' | 'both'
type EventSource = 'pluto' | 'custom'

const DOMAIN_ROLES = [
  'Frontend', 'Backend', 'Full Stack', 'AI/ML', 'Data Science',
  'UI/UX Designer', 'DevOps', 'Mobile Dev', 'Blockchain',
  'Cybersecurity', 'Cloud', 'Game Dev', 'IoT', 'AR/VR',
  'Project Manager', 'Content Writer', 'Video Editor', 'Marketing'
]


// ─── Event Fetch Functions ──────────────────────────────────────────────────

async function fetchCommunityEventsForTeamBuilder(): Promise<Event[]> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('is_universal', 'true')
      .order('start_date', { ascending: false })
      .limit(100)

    if (error) throw error
    return (data as Event[]) || []
  } catch (err) {
    console.error('[TeamBuilder] Error fetching community events:', err)
    return []
  }
}

async function fetchCollegeEventsForTeamBuilder(collegeId?: string, collegeName?: string): Promise<Event[]> {
  try {
    let resolvedId = collegeId

    // If we only have the name, resolve the ID
    if (!resolvedId && collegeName) {
      const normalizedName = collegeName.split(',')[0].trim()
      const { data: collegeRow, error: collegeError } = await supabase
        .from('colleges')
        .select('id')
        .ilike('name', normalizedName)
        .maybeSingle()

      if (collegeError) {
        console.error('[TeamBuilder] Error fetching college ID:', collegeError.message)
        return []
      }
      resolvedId = collegeRow?.id
    }

    if (!resolvedId) return []

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('college_id', resolvedId)
      .order('start_date', { ascending: false })
      .limit(100)

    if (error) throw error
    return (data as Event[]) || []
  } catch (err) {
    console.error('[TeamBuilder] Error fetching college events:', err)
    return []
  }
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function TeamBuilder() {
  const { user } = useAuthStore()
  const { openAuthModal } = useUIStore()

  // Queries
  const queryClient = useQueryClient()
  const { data: myTeams = [], isLoading: teamsLoading } = useMyCreatedTeams(user?.id)
  const { data: myApps = [], isLoading: appsLoading } = useMyApplications(user?.id)

  // Fetch community events (Explore)
  const { data: communityEvents = [] } = useQuery({
    queryKey: ['events', 'community-teambuilder'],
    queryFn: fetchCommunityEventsForTeamBuilder,
    staleTime: 5 * 60 * 1000,
  })

  const collegeQueryKey = user?.college_id || user?.college || ''

  // Fetch college events (Campus)
  const { data: collegeEvents = [] } = useQuery({
    queryKey: ['events', 'college-teambuilder', collegeQueryKey],
    queryFn: () => fetchCollegeEventsForTeamBuilder(user?.college_id, user?.college),
    enabled: !!collegeQueryKey,
    staleTime: 5 * 60 * 1000,
  })

  // Merge all events and deduplicate
  const eventMap: { [key: string]: Event } = {}
    ;[...communityEvents, ...collegeEvents].forEach(event => {
      eventMap[event.id] = event
    })
  const allEvents: Event[] = Object.values(eventMap)

  const createTeam = useCreateTeam()
  const updateTeam = useUpdateTeam()
  const deleteTeam = useDeleteTeam()
  const updateStatus = useUpdateMemberStatus()

  const [activeTab, setActiveTab] = useState<Tab>('my-teams')
  const [editTeamId, setEditTeamId] = useState<string | null>(null)
  const [deleteTeamConfirmId, setDeleteTeamConfirmId] = useState<string | null>(null)

  // ─── Event Selection Flow ────────────────────────────────────────────────
  const [eventSource, setEventSource] = useState<EventSource>('custom')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [showEventSearch, setShowEventSearch] = useState(false)
  const [teamName, setTeamName] = useState('')
  const [purpose, setPurpose] = useState('')
  const [roles, setRoles] = useState<string[]>([])
  const [roleInput, setRoleInput] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [venue, setVenue] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [visibility, setVisibility] = useState<Visibility | null>(null)

  const [showSuccess, setShowSuccess] = useState(false)

  // Sub-tab state for Received and Applied
  const [myTeamsSubTab, setMyTeamsSubTab] = useState<'active' | 'past'>('active')
  const [receivedSubTab, setReceivedSubTab] = useState<'pending' | 'past'>('pending')
  const [appliedSubTab, setAppliedSubTab] = useState<'pending' | 'past'>('pending')

  // Chat State
  const [chatOpen, setChatOpen] = useState(false)
  const [chatTeamId, setChatTeamId] = useState('')
  const [chatApplicantEmail, setChatApplicantEmail] = useState('')
  const [chatInput, setChatInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const { data: chatMessages = [], refetch: refetchChat, isLoading: isChatLoading } = useChatMessages(chatTeamId, chatApplicantEmail)
  const sendMessage = useSendChatMessage()

  // Auto-scroll chat
  useEffect(() => {
    if (chatOpen && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatMessages, chatOpen])

  // ─── Event Selection Handler ────────────────────────────────────────────
  const handleEventSelect = (event: Event) => {
    setSelectedEvent(event)
    setShowEventSearch(false)
    setEventSource('pluto')

    // Prefill form with event data
    setStartDate(event.start_date || '')
    setEndDate(event.end_date || '')
    setStartTime(event.start_time || '')
    setEndTime(event.end_time || '')
    setVenue(event.venue || '')
    setCity(event.city || '')
    setState(event.state || '')

    // Set visibility based on event type
    const isCampusEvent = !event.is_universal
    if (isCampusEvent) {
      setVisibility('campus')
    } else {
      setVisibility('inter_college')
    }
  }

  const handleClearEventSelection = () => {
    setSelectedEvent(null)
    setEventSource('custom')
    setPurpose('')
    setStartDate('')
    setEndDate('')
    setStartTime('')
    setEndTime('')
    setVenue('')
    setCity('')
    setState('')
    setVisibility(null)
  }

  // Filter events based on search (only upcoming)
  const today = new Date().toISOString().split('T')[0]
  const filteredEvents: Event[] = searchQuery.trim()
    ? allEvents.filter((e: Event) => {
      const eventDate = e.end_date || e.start_date || ''
      const isUpcoming = eventDate >= today
      return isUpcoming && (
        e.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }).slice(0, 8)
    : []

  const ROLE_ICONS: Record<string, React.ReactNode> = {
    'Frontend': <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" alt="Frontend" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />,
    'Backend': <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" alt="Backend" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />,
    'Full Stack': <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg" alt="Full Stack" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />,
    'AI/ML': <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tensorflow/tensorflow-original.svg" alt="AI/ML" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />,
    'Data Science': <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/pandas/pandas-original.svg" alt="Data Science" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />,
    'UI/UX Designer': <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/figma/figma-original.svg" alt="UI/UX" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />,
    'DevOps': <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg" alt="DevOps" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />,
    'Mobile Dev': <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flutter/flutter-original.svg" alt="Mobile" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />,
    'Blockchain': <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/solidity/solidity-original.svg" alt="Blockchain" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />,
    'Cybersecurity': <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg" alt="Cybersecurity" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />,
    'Cloud': <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/googlecloud/googlecloud-original.svg" alt="Cloud" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />,
    'Game Dev': <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/unity/unity-original.svg" alt="Game Dev" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />,
    'IoT': <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/arduino/arduino-original.svg" alt="IoT" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />,
    'AR/VR': <span style={{ fontSize: '16px', lineHeight: 1 }}>🥽</span>,
    'Project Manager': <span style={{ fontSize: '16px', lineHeight: 1 }}>📊</span>,
    'Content Writer': <span style={{ fontSize: '16px', lineHeight: 1 }}>✍️</span>,
    'Video Editor': <span style={{ fontSize: '16px', lineHeight: 1 }}>🎬</span>,
    'Marketing': <span style={{ fontSize: '16px', lineHeight: 1 }}>📈</span>
  }

  const filteredRoles = roleInput.trim() ? DOMAIN_ROLES.filter(r => r.toLowerCase().includes(roleInput.toLowerCase()) && !roles.includes(r)) : []

  const addRole = (r: string) => { if (!roles.includes(r)) setRoles([...roles, r]); setRoleInput('') }
  const removeRole = (r: string) => setRoles(roles.filter(x => x !== r))

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !teamName.trim() || roles.length === 0 || !visibility) {
      if (!visibility) alert("Please select a team visibility option")
      if (!teamName.trim()) alert("Please enter a team name")
      if (roles.length === 0) alert("Please select at least one required role")
      return
    }

    try {
      const combinedLocation = [venue, city, state].filter(Boolean).join(', ')
      const combinedDate = [startDate, endDate].filter(Boolean).join(' to ')
      const combinedTime = [startTime, endTime].filter(Boolean).join(' to ')

      if (editTeamId) {
        await updateTeam.mutateAsync({
          teamId: editTeamId,
          teamName,
          competitionName: selectedEvent?.title || 'Custom Event',
          purpose,
          roles,
          teamSize: roles.length + 1,
          location: combinedLocation,
          eventDate: combinedDate,
          eventTime: combinedTime,
          visibility,
          eventId: selectedEvent?.id
        })
      } else {
        await createTeam.mutateAsync({
          creatorId: user.id,
          creatorName: user.name || user.email?.split('@')[0] || 'Anonymous',
          teamName,
          competitionName: selectedEvent?.title || 'Custom Event',
          purpose,
          roles,
          teamSize: roles.length + 1,
          eventDate: combinedDate,
          eventTime: combinedTime,
          location: combinedLocation,
          visibility,
          eventId: selectedEvent?.id
        })
      }

      setTeamName('')
      setPurpose('')
      setRoles([])
      setStartDate(''); setEndDate(''); setStartTime(''); setEndTime('')
      setVenue(''); setCity(''); setState('')
      setVisibility(null)
      setSelectedEvent(null)
      setEventSource('custom')
      setEditTeamId(null)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 4000)
      setTimeout(() => setActiveTab('my-teams'), 1000)
    } catch (error: any) {
      console.error('[TeamBuilder] Error creating team:', error)
      const msg = error?.message || 'Failed to save team. Please try again.'
      alert(msg)
    }
  }

  const resetForm = () => {
    setEditTeamId(null)
    setTeamName('')
    setPurpose('')
    setRoles([])
    setRoleInput('')
    setSelectedEvent(null)
    setEventSource('custom')
    setStartDate('')
    setEndDate('')
    setStartTime('')
    setEndTime('')
    setVenue('')
    setCity('')
    setState('')
    setVisibility(null)
  }

  const openEditTeam = (team: any) => {
    setEditTeamId(team.id)
    setTeamName(team.team_name || team.competition_name || '')
    setPurpose(team.purpose || '')
    setRoles(team.roles || [])
    if (team.event_date) {
      const parts = team.event_date.split(' to ')
      setStartDate(parts[0] || '')
      setEndDate(parts[1] || '')
    } else {
      setStartDate('')
      setEndDate('')
    }
    if (team.event_time) {
      const parts = team.event_time.split(' to ')
      setStartTime(parts[0] || '')
      setEndTime(parts[1] || '')
    } else {
      setStartTime('')
      setEndTime('')
    }
    setVisibility(team.visibility)
    
    // Attempt to split location
    if (team.location && !team.event_id) {
      const parts = team.location.split(',').map((s: string) => s.trim())
      if (parts.length === 3) {
        setVenue(parts[0])
        setCity(parts[1])
        setState(parts[2])
      }
    }
    
    if (team.event_id) {
      const event = allEvents.find(e => e.id === team.event_id)
      if (event) {
        setEventSource('pluto')
        setSelectedEvent(event)
      }
    } else {
      setEventSource('custom')
      setSelectedEvent(null)
    }
    
    setActiveTab('create')
  }

  const openChat = (teamId: string, applicantEmail: string) => {
    setChatTeamId(teamId)
    setChatApplicantEmail(applicantEmail)
    setChatOpen(true)
  }

  const handleSendMessage = async () => {
    const text = chatInput.trim()
    if (!text || !user || isSending) return
    setIsSending(true)
    setChatInput('')
    try {
      await sendMessage.mutateAsync({
        teamId: chatTeamId,
        applicantEmail: chatApplicantEmail,
        senderEmail: user.email || '',
        senderName: user.name || '',
        text,
      })
      // Force an immediate refetch so the message shows up instantly
      await refetchChat()
    } catch (error) {
      console.error('[TeamBuilder] Error sending message:', error)
      setChatInput(text) // Restore the text on failure so user doesn't lose it
    } finally {
      setIsSending(false)
    }
  }

  const formatChatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch { return '' }
  }

  // Count pending applications received across all my teams
  const pendingReceivedCount = myTeams.reduce((acc: number, t: any) => acc + (t.team_members?.filter((m: any) => m.status === 'pending').length || 0), 0)

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'my-teams', label: 'My Teams', icon: <Shield size={16} />, count: myTeams.length },
    { id: 'received', label: 'Received', icon: <Inbox size={16} />, count: pendingReceivedCount },
    { id: 'applied', label: 'Applied', icon: <Send size={16} />, count: myApps.length },
    { id: 'create', label: 'Create', icon: <Plus size={16} /> },
  ]

  if (!user) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '6rem 2rem' }}>
        <Helmet><title>Team Builder | PLUTO</title></Helmet>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Users size={72} strokeWidth={1.2} style={{ color: 'var(--primary)', opacity: 0.6, marginBottom: '1.5rem' }} />
          <h2 style={{ color: 'var(--white)', marginBottom: '0.5rem' }}>Team Builder</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Create teams for hackathons, find collaborators, and build something great.
          </p>
          <button className="btn btn-primary" onClick={() => openAuthModal('login')}>Login to Get Started</button>
        </motion.div>
      </div>
    )
  }

  return (
    <>
      <Helmet><title>Team Builder | PLUTO</title></Helmet>

      {/* Success Toast (fixed, outside flow) */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            className="tb-toast"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <CheckCircle2 size={18} /> Team created successfully! It will appear on Explore & Community.
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`container tb-container ${activeTab === 'create' ? 'create-mode' : ''}`}>
        {/* Main Layout Grid */}
        <div className="tb-layout-grid">
          {/* Left Sidebar (Tabs) */}
          <div className="tb-sidebar">
            <div className="tb-tabs">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`tb-tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {(tab.count ?? 0) > 0 && <span className="tb-tab-badge">{tab.count}</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Right Content Area */}
          <div className="tb-main-content">
            <AnimatePresence mode="wait">
              {/* ─── CREATE TEAM TAB ─── */}
              {activeTab === 'create' && (
                <motion.div key="create" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <div className="tb-split-card">
                    {/* Left Panel: Branding + Visibility + Dates */}
                    <div className="tb-split-left">
                      <div className="tb-split-left-content">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'center', marginBottom: '2rem' }}>
                          <div className="tb-logo-wrap" style={{ margin: 0 }}>
                            {editTeamId ? <Edit3 size={24} color="#f97316" /> : <Users size={24} fill="#000" color="#000" />}
                          </div>
                          <h1 className="tb-split-title" style={{ margin: 0 }}>
                            {editTeamId ? 'EDIT TEAM' : 'TEAM BUILDER'}
                          </h1>
                        </div>
                        {!editTeamId && <p className="tb-split-subtitle">Create Teams & Collaborate</p>}

                        {/* Visibility */}
                        <div className="tb-left-section">
                          <label className="tb-left-label">Team Visibility <span className="req">*</span></label>
                          <div className="tb-vis-circles">
                            <button type="button" className={`tb-vis-circle ${visibility === 'campus' ? 'selected' : ''}`} onClick={() => setVisibility('campus')}>
                              <School size={16} />
                              <span className="tb-vis-name">Campus</span>
                              {visibility === 'campus' && <CheckCircle2 size={14} className="tb-vis-check" />}
                            </button>
                            <button type="button" className={`tb-vis-circle ${visibility === 'inter_college' ? 'selected' : ''}`} onClick={() => setVisibility('inter_college')}>
                              <Globe size={16} />
                              <span className="tb-vis-name">Inter-College</span>
                              {visibility === 'inter_college' && <CheckCircle2 size={14} className="tb-vis-check" />}
                            </button>
                            <button type="button" className={`tb-vis-circle ${visibility === 'both' ? 'selected' : ''}`} onClick={() => setVisibility('both')}>
                              <Rocket size={16} />
                              <span className="tb-vis-name">Both</span>
                              {visibility === 'both' && <CheckCircle2 size={14} className="tb-vis-check" />}
                            </button>
                          </div>
                        </div>

                        {/* Date */}
                        <div className="tb-left-section">
                          <label className="tb-left-label"><CalendarDays size={14} color="#a78bfa" fill="rgba(167,139,250,0.25)" /> Date</label>
                          <div className="tb-left-stack">
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} disabled={!!selectedEvent} style={{ opacity: selectedEvent ? 0.6 : 1, cursor: selectedEvent ? 'not-allowed' : 'text' }} placeholder="mm/dd/yyyy" />
                            <span className="tb-to">to</span>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} disabled={!!selectedEvent} style={{ opacity: selectedEvent ? 0.6 : 1, cursor: selectedEvent ? 'not-allowed' : 'text' }} placeholder="mm/dd/yyyy" />
                          </div>
                        </div>

                        {/* Time */}
                        <div className="tb-left-section">
                          <label className="tb-left-label"><Clock size={14} color="#a78bfa" fill="rgba(167,139,250,0.25)" /> Time</label>
                          <div className="tb-left-stack">
                            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} disabled={!!selectedEvent} style={{ opacity: selectedEvent ? 0.6 : 1, cursor: selectedEvent ? 'not-allowed' : 'text' }} placeholder="hh:mm" />
                            <span className="tb-to">to</span>
                            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} disabled={!!selectedEvent} style={{ opacity: selectedEvent ? 0.6 : 1, cursor: selectedEvent ? 'not-allowed' : 'text' }} placeholder="hh:mm" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Form Panel */}
                    <div className="tb-split-right">
                      <form id="create-team-form" onSubmit={handleCreateTeam}>
                        {/* ─── Event Selection Flow ─── */}
                        <div className="form-group">
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Search size={14} color="#a78bfa" /> Find a PLUTO Event (Optional)
                          </label>
                          <div style={{ position: 'relative' }}>
                            <input
                              type="text"
                              value={searchQuery}
                              onChange={e => setSearchQuery(e.target.value)}
                              onFocus={() => setShowEventSearch(true)}
                              placeholder="Search events by name..."
                              style={{
                                width: '100%',
                                padding: '0.85rem',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '20px',
                                background: 'rgba(0,0,0,0.25)',
                                color: 'var(--white)',
                                fontSize: '14px',
                                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                              }}
                            />
                            {showEventSearch && filteredEvents.length > 0 && (
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="tb-event-dropdown"
                                style={{
                                  position: 'absolute',
                                  top: '100%',
                                  left: 0,
                                  right: 0,
                                  background: 'rgba(20, 20, 40, 0.95)',
                                  border: '1px solid rgba(99, 102, 241, 0.3)',
                                  borderRadius: '8px',
                                  marginTop: '8px',
                                  maxHeight: '300px',
                                  overflowY: 'auto',
                                  zIndex: 1000,
                                  backdropFilter: 'blur(10px)'
                                }}
                              >
                                {filteredEvents.map((event, idx) => (
                                  <motion.button
                                    key={event.id}
                                    type="button"
                                    onClick={() => handleEventSelect(event)}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.02 }}
                                    style={{
                                      width: '100%',
                                      padding: '12px',
                                      textAlign: 'left',
                                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                                      background: 'transparent',
                                      color: 'var(--white)',
                                      cursor: 'pointer',
                                      fontSize: '13px',
                                      transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                  >
                                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>{event.title}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                      {event.start_date} • {event.is_universal ? 'Inter-College' : 'Campus'}
                                    </div>
                                  </motion.button>
                                ))}
                              </motion.div>
                            )}
                          </div>
                          {showEventSearch && searchQuery.trim() && filteredEvents.length === 0 && (
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                              No events found. You can still create a custom team below.
                            </p>
                          )}
                        </div>

                        {/* ─── Selected Event Info ─── */}
                        {selectedEvent && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                              padding: '12px',
                              background: 'rgba(34, 197, 94, 0.1)',
                              border: '1px solid rgba(34, 197, 94, 0.3)',
                              borderRadius: '8px',
                              marginBottom: '16px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start'
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--white)', marginBottom: '4px' }}>
                                ✓ {selectedEvent.title}
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                {selectedEvent.is_universal ? 'Inter-College Event' : 'Campus Event'} • {selectedEvent.start_date}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={handleClearEventSelection}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                            >
                              <X size={16} />
                            </button>
                          </motion.div>
                        )}

                        {/* ─── Team Name Input ─── */}
                        <div className="form-group">
                          <label><Shield size={14} color="#a78bfa" fill="rgba(167,139,250,0.25)" /> Team Name *</label>
                          <input
                            type="text"
                            value={teamName}
                            onChange={e => setTeamName(e.target.value)}
                            placeholder="Enter your team's name"
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label><MessageCircle size={14} color="#a78bfa" fill="rgba(167,139,250,0.25)" /> Purpose of Team</label>
                          <textarea value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="Describe what your team will build or achieve" rows={2} />
                        </div>

                        <div className="form-group">
                          <div className="tb-roles-header">
                            <label><Users size={14} color="#a78bfa" fill="rgba(167,139,250,0.25)" /> Required Domain Roles *</label>
                            <div className="tb-team-size-inline">
                              <span>Team Size: <strong>{roles.length + 1}</strong></span>
                              <div className="tb-info-wrap">
                                <Info size={13} className="tb-info-icon" />
                                <div className="tb-info-tooltip">
                                  Team size is auto-calculated:<br />
                                  <strong>{roles.length}</strong> selected role{roles.length !== 1 ? 's' : ''} + <strong>1</strong> (you as leader) = <strong>{roles.length + 1}</strong> members.
                                  <br /><br />Just add the domain roles you need — size updates automatically.
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="tb-tags-wrap">
                            {roles.map(r => (
                              <span key={r} className="tb-role-tag">
                                {ROLE_ICONS[r]} <span>{r}</span>
                                <button type="button" onClick={() => removeRole(r)}>&times;</button>
                              </span>
                            ))}
                            <input
                              type="text"
                              value={roleInput}
                              onChange={e => setRoleInput(e.target.value)}
                              placeholder={roles.length === 0 ? 'Type to search roles' : 'Add more'}
                              onKeyDown={e => {
                                if (e.key === 'Enter' && roleInput.trim()) {
                                  e.preventDefault()
                                  addRole(roleInput.trim())
                                }
                              }}
                            />
                          </div>
                          {filteredRoles.length > 0 && (
                            <div className="tb-role-dropdown">
                              {filteredRoles.map(r => (
                                <div key={r} className="tb-role-option" onClick={() => addRole(r)}>
                                  {ROLE_ICONS[r]} <span>{r}</span>
                                </div>
                              ))}
                            </div>
                          )}

                        </div>

                        {/* ─── Location Section: Conditional based on Event Type ─── */}
                        {selectedEvent ? (
                          <>
                            {/* Campus Event: Only Venue (City & State hidden) */}
                            {!selectedEvent.is_universal && (
                              <>
                                <div className="form-group">
                                  <label><MapPin size={14} color="#10b981" fill="rgba(16,185,129,0.25)" /> Venue (Read-only)</label>
                                  <input
                                    type="text"
                                    value={venue}
                                    disabled
                                    style={{ opacity: 0.7, cursor: 'not-allowed' }}
                                  />
                                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                    Locked from campus event
                                  </div>
                                </div>
                              </>
                            )}

                            {/* Inter-College Event: Venue, City, State (all read-only) */}
                            {selectedEvent.is_universal && (
                              <>
                                <div className="form-group">
                                  <label><MapPin size={14} color="#10b981" fill="rgba(16,185,129,0.25)" /> Venue (Read-only)</label>
                                  <input
                                    type="text"
                                    value={venue}
                                    disabled
                                    style={{ opacity: 0.7, cursor: 'not-allowed' }}
                                  />
                                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                    Locked from intercollege event
                                  </div>
                                </div>
                                <div className="form-row-2">
                                  <div className="form-group">
                                    <label><Map size={14} color="#8b5cf6" fill="rgba(139,92,246,0.25)" /> State (Read-only)</label>
                                    <input
                                      type="text"
                                      value={state}
                                      disabled
                                      style={{ opacity: 0.7, cursor: 'not-allowed' }}
                                    />
                                  </div>
                                  <div className="form-group">
                                    <label><Building2 size={14} color="#f59e0b" fill="rgba(245,158,11,0.25)" /> City (Read-only)</label>
                                    <input
                                      type="text"
                                      value={city}
                                      disabled
                                      style={{ opacity: 0.7, cursor: 'not-allowed' }}
                                    />
                                  </div>
                                </div>
                              </>
                            )}
                          </>
                        ) : (
                          <>
                            {/* No Event Selected: Full Location Form */}
                            <div className="form-group">
                              <label><MapPin size={14} color="#a78bfa" fill="rgba(167,139,250,0.25)" /> Venue</label>
                              <input
                                type="text"
                                value={venue}
                                onChange={e => setVenue(e.target.value)}
                                placeholder="Specific venue or hall name"
                              />
                            </div>
                            <div className="form-row-2">
                              <div className="form-group">
                                <label><Map size={14} color="#a78bfa" fill="rgba(167,139,250,0.25)" /> State</label>
                                <DropdownMenu>
                                  <DropdownMenuTrigger className="create-input" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', color: 'white', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' }}>
                                    {state || 'Select State'}
                                    <ChevronDown size={14} />
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => { setState(''); setCity('') }}>Select State</DropdownMenuItem>
                                    {Object.keys(INDIAN_STATES_CITIES).map(s => (
                                      <DropdownMenuItem key={s} onClick={() => { setState(s); setCity('') }}>{s}</DropdownMenuItem>
                                    ))}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                              <div className="form-group">
                                <label><Building2 size={14} color="#a78bfa" fill="rgba(167,139,250,0.25)" /> City</label>
                                <DropdownMenu>
                                  <DropdownMenuTrigger disabled={!state} className="create-input" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', opacity: !state ? 0.5 : 1, color: 'white', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' }}>
                                    {city || (state ? 'Select City' : 'Select state first')}
                                    <ChevronDown size={14} />
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => setCity('')}>Select City</DropdownMenuItem>
                                    {state && INDIAN_STATES_CITIES[state]?.map(c => (
                                      <DropdownMenuItem key={c} onClick={() => setCity(c)}>{c}</DropdownMenuItem>
                                    ))}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </>
                        )}
                        <button type="submit" className="tb-submit-split-btn" disabled={createTeam.isPending || updateTeam.isPending || !teamName.trim() || roles.length === 0 || !visibility}>
                          {createTeam.isPending || updateTeam.isPending ? <><span className="spinner" /> Saving...</> : editTeamId ? 'Save Changes' : 'Create My Team'}
                        </button>
                        {editTeamId && (
                          <button type="button" onClick={resetForm} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--white)', padding: '0.75rem', borderRadius: '50px', width: '100%', marginTop: '0.5rem', cursor: 'pointer' }}>
                            Cancel Edit
                          </button>
                        )}
                      </form>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ─── MY TEAMS TAB ─── */}
              {activeTab === 'my-teams' && (
                <motion.div key="my-teams" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>

                  <div className="tb-sub-tabs-wrap">
                    <button className={`tb-sub-tab ${myTeamsSubTab === 'active' ? 'active' : ''}`} onClick={() => setMyTeamsSubTab('active')}>
                      <Clock size={15} className="tb-sub-icon" /> Active <span className="tb-sub-text-extra">Teams</span>
                    </button>
                    <button className={`tb-sub-tab ${myTeamsSubTab === 'past' ? 'active' : ''}`} onClick={() => setMyTeamsSubTab('past')}>
                      <CheckCircle2 size={15} className="tb-sub-icon" /> Past <span className="tb-sub-text-extra">Teams</span>
                    </button>
                  </div>

                  {(() => {
                    const filteredMyTeams = myTeams.filter((team: any) => myTeamsSubTab === 'active' ? isTeamActive(team) : !isTeamActive(team))
                    
                    return teamsLoading ? (
                      <div className="tb-skeleton-list">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="tb-skeleton-team-card">
                            <div className="tb-skel-team-top">
                              <div className="tb-skel-team-name tb-shimmer-base" />
                              <div className="tb-skel-team-badges">
                                <div className="tb-skel-badge tb-shimmer-base" />
                                <div className="tb-skel-badge-sm tb-shimmer-base" />
                              </div>
                            </div>
                            <div className="tb-skel-team-sub">
                              <div className="tb-skel-event tb-shimmer-base" />
                              <div className="tb-skel-desc tb-shimmer-base" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : filteredMyTeams.length === 0 ? (
                      <div className="tb-empty">
                        <Shield size={56} strokeWidth={1} style={{ color: 'var(--primary)', opacity: 0.5 }} />
                        <h3>{myTeamsSubTab === 'active' ? 'No Active Teams' : 'No Past Teams'}</h3>
                        <p>{myTeamsSubTab === 'active' ? "You haven't built or joined any active teams yet." : "You have no past teams."}</p>
                        {myTeamsSubTab === 'active' && (
                          <button className="btn btn-primary" style={{ marginTop: '1.5rem', borderRadius: 12 }} onClick={() => setActiveTab('create')}>
                            <Plus size={16} /> Create Your First Team
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="tb-my-teams-list">
                        {filteredMyTeams.map((team: any, idx: number) => {
                        const requiredRoles = team.roles || []
                        const approvedMembers = team.team_members?.filter((m: any) => m.status === 'approved') || []
                        const pendingMembers = team.team_members?.filter((m: any) => m.status === 'pending') || []
                        const approvedRoles = approvedMembers.map((m: any) => m.role)
                        const pendingRoles = pendingMembers.map((m: any) => m.role)
                        const isTeamConfirmed = requiredRoles.length > 0 && requiredRoles.every((r: string) => approvedRoles.includes(r))

                        return (
                          <motion.div
                            key={team.id}
                            className="tb-my-team-card"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                          >
                            <div className="tb-my-team-header-top">
                              <div className="tb-team-name-group">
                                <h3 className="tb-team-name">{team.team_name || team.competition_name}</h3>
                                <div className="tb-header-quick-meta">
                                  {team.event_date && <span><CalendarDays size={13} /> {formatEventDate(team.event_date)}</span>}
                                  {team.event_time && <span><Clock size={13} /> {formatEventTime(team.event_time)}</span>}
                                  <span><Globe size={13} /> {team.visibility === 'inter_college' ? 'Inter-College' : team.visibility === 'campus' ? 'Campus Only' : 'Both'}</span>
                                </div>
                              </div>
                              <div className="tb-header-right-badges">
                                <button
                                  className="tb-action-btn tb-chat-btn"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    openChat(team.id, 'GROUP')
                                  }}
                                  title="Group Chat"
                                  style={{ marginRight: '0.5rem', background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '6px 14px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, border: 'none', cursor: 'pointer', height: 'auto', width: 'auto' }}
                                >
                                  <MessageCircle size={14} color="#3b82f6" /> Group Chat
                                </button>
                                <span className="tb-members-count"><Users size={13} /> {(approvedMembers.length + 1)}/{team.team_size} members</span>
                                <span className={`tb-status-badge ${isTeamConfirmed ? 'confirmed' : team.status}`}>{isTeamConfirmed ? 'CONFIRMED' : team.status}</span>
                              </div>
                            </div>
                            <div className="tb-my-team-header-sub">
                              <span className="tb-event-name">{team.competition_name}</span>
                              {team.purpose && <span className="tb-team-desc">&bull; {team.purpose}</span>}
                            </div>

                            <div className="tb-my-team-card-expanded">
                              <div className="tb-my-team-card-expanded-inner">
                                <div className="tb-team-meta tb-team-meta-expanded" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                  {team.location && (
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                                      <MapPin size={14} color="#a1a1aa" style={{ marginTop: 2, flexShrink: 0 }} />
                                      <span style={{ color: '#a1a1aa', fontSize: '13px', lineHeight: '1.4' }}>{team.location}</span>
                                    </div>
                                  )}
                                  
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    {team.event_date ? (
                                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#a1a1aa' }}>
                                        <CalendarDays size={13} color="#a1a1aa" /> {formatEventDate(team.event_date)}
                                      </span>
                                    ) : <div></div>}
                                    
                                    {team.creator_id === user?.id && (
                                      <div style={{ display: 'flex', gap: '8px' }}>
                                        {isTeamActive(team) && (
                                          <button 
                                            style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }} 
                                            onClick={(e) => { e.stopPropagation(); openEditTeam(team); }}
                                          >
                                            <Edit3 size={12} color="#fff" /> Edit
                                          </button>
                                        )}
                                        <button 
                                          style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }} 
                                          onClick={(e) => { e.stopPropagation(); setDeleteTeamConfirmId(team.id); }}
                                        >
                                          <Trash2 size={12} color="#ef4444" /> Delete
                                        </button>
                                      </div>
                                    )}
                                  </div>

                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    {team.event_time ? (
                                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#a1a1aa' }}>
                                        <Clock size={13} color="#a1a1aa" /> {formatEventTime(team.event_time)}
                                      </span>
                                    ) : <div></div>}
                                    
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#a1a1aa' }}>
                                      <Globe size={13} color="#a1a1aa" /> <span>{team.visibility === 'inter_college' ? 'Inter-College' : team.visibility === 'campus' ? 'Campus Only' : 'Both'}</span>
                                    </span>
                                  </div>
                                </div>
                                <div className="tb-my-team-roster-grid">
                                  <div className="tb-my-team-roster-column">
                                    <h4 className="tb-roster-title">Team Roster</h4>
                                    <div className="tb-roster-members">
                                      {/* Team Leader */}
                                      <div className="tb-roster-item leader">
                                        {team.creator_avatar ? (
                                          <img src={team.creator_avatar} alt="leader" className="tb-roster-avatar" />
                                        ) : (
                                          <div className="tb-roster-avatar fallback">{(team.creator_name || '?')[0].toUpperCase()}</div>
                                        )}
                                        <div className="tb-roster-info">
                                          <span className="tb-roster-name">{team.creator_name} <Crown size={12} style={{ color: 'var(--primary)', marginLeft: 4 }} /></span>
                                          <span className="tb-roster-role">Team Leader</span>
                                        </div>
                                        {team.creator_id !== user?.id && user?.email && (
                                          <button
                                            className="tb-action-btn tb-chat-btn"
                                            style={{ marginLeft: 'auto' }}
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              openChat(team.id, user.email!)
                                            }}
                                            title="Message Leader"
                                          >
                                            <MessageCircle size={14} />
                                          </button>
                                        )}
                                      </div>

                                      {/* Approved Members */}
                                      {approvedMembers.map((m: any) => (
                                        <div className="tb-roster-item" key={m.id}>
                                          {m.avatar ? (
                                            <img src={m.avatar} alt={m.name} className="tb-roster-avatar" />
                                          ) : (
                                            <div className="tb-roster-avatar fallback">{(m.name || '?')[0].toUpperCase()}</div>
                                          )}
                                          <div className="tb-roster-info">
                                            <span className="tb-roster-name">{m.name}</span>
                                            <span className="tb-roster-role">{m.role}</span>
                                          </div>
                                          {m.email && m.user_id !== user?.id && team.creator_id === user?.id && (
                                            <button
                                              className="tb-action-btn tb-chat-btn"
                                              style={{ marginLeft: 'auto' }}
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                openChat(team.id, m.email)
                                              }}
                                              title={`Message ${m.name}`}
                                            >
                                              <MessageCircle size={14} />
                                            </button>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="tb-my-team-roster-column">
                                    <h4 className="tb-roster-title">Required Roles</h4>
                                    <div className="tb-roster-roles">
                                      {requiredRoles.map((role: string) => {
                                        const isApproved = approvedRoles.includes(role)
                                        const isPending = pendingRoles.includes(role)

                                        return (
                                          <span key={role} className={`tb-role-status-chip ${isApproved ? 'filled' : isPending ? 'pending' : 'open'}`}>
                                            {isApproved && <CheckCircle2 size={14} />}
                                            {isPending && !isApproved && <Clock size={14} />}
                                            {!isApproved && !isPending && <CircleDashed size={14} />}
                                            {ROLE_ICONS[role]}
                                            {role}
                                          </span>
                                        )
                                      })}
                                    </div>

                                    {isTeamConfirmed && (
                                      <div className="tb-team-confirmed-banner">
                                        <CheckCircle2 size={16} /> Team Confirmed! All roles are filled.
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  )
                })()}
                </motion.div>
              )}

              {/* ─── RECEIVED APPLICATIONS TAB ─── */}
              {activeTab === 'received' && (
                <motion.div key="received" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  {teamsLoading ? (
                    <div className="tb-skeleton-list">
                      {[1, 2].map(i => (
                        <div key={i} className="tb-skeleton-block">
                          <div className="tb-skel-block-header">
                            <div className="tb-skel-block-title tb-shimmer-base" />
                            <div className="tb-skel-block-badge tb-shimmer-base" />
                          </div>
                          {[1, 2].map(j => (
                            <div key={j} className="tb-skel-applicant">
                              <div className="tb-skel-applicant-left">
                                <div className="tb-skel-avatar tb-shimmer-base" />
                                <div className="tb-skel-text-group">
                                  <div className="tb-skel-name tb-shimmer-base" />
                                  <div className="tb-skel-role tb-shimmer-base" />
                                </div>
                              </div>
                              <div className="tb-skel-applicant-right">
                                <div className="tb-skel-btn tb-shimmer-base" />
                                <div className="tb-skel-btn tb-shimmer-base" />
                                <div className="tb-skel-btn-sm tb-shimmer-base" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className="tb-sub-tabs-wrap">
                        <button className={`tb-sub-tab ${receivedSubTab === 'pending' ? 'active' : ''}`} onClick={() => setReceivedSubTab('pending')}>
                          <Clock size={15} className="tb-sub-icon" /> Pending
                        </button>
                        <button className={`tb-sub-tab ${receivedSubTab === 'past' ? 'active' : ''}`} onClick={() => setReceivedSubTab('past')}>
                          <CheckCircle2 size={15} className="tb-sub-icon" /> Past
                        </button>
                      </div>

                      {(() => {
                        const createdTeams = myTeams.filter((t: any) => t.creator_id === user?.id)
                        const filtered = createdTeams.map((team: any) => {
                          const members = team.team_members || []
                          const filteredMembers = receivedSubTab === 'pending'
                            ? members.filter((m: any) => m.status === 'pending')
                            : members.filter((m: any) => m.status === 'approved' || m.status === 'rejected')
                          return { ...team, filteredMembers }
                        }).filter((t: any) => t.filteredMembers.length > 0)

                        if (filtered.length === 0) {
                          return (
                            <div className="tb-empty">
                              <Inbox size={56} strokeWidth={1} style={{ color: 'var(--primary)', opacity: 0.5 }} />
                              <h3>{receivedSubTab === 'pending' ? 'No Pending Applications' : 'No Past Applications'}</h3>
                              <p>{receivedSubTab === 'pending' ? 'You have caught up with all applications.' : 'Accepted or rejected applications will appear here.'}</p>
                            </div>
                          )
                        }

                        return (
                          <div className="tb-teams-list">
                            {filtered.map((team: any, idx: number) => (
                              <motion.div
                                key={team.id}
                                className="tb-team-block"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                              >
                                <div className="tb-team-block-header">
                                  <h3>{team.competition_name}</h3>
                                  <span className={`tb-status-badge ${team.status}`}>{team.status}</span>
                                </div>

                                <div className="tb-applicants">
                                  <h4>{receivedSubTab === 'pending' ? 'Pending' : 'Past'} Applications ({team.filteredMembers.length})</h4>
                                  {team.filteredMembers.map((member: any) => (
                                    <motion.div
                                      key={member.id}
                                      className="tb-applicant-card"
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                    >
                                      <div className="tb-applicant-info">
                                        {member.avatar ? (
                                          <img src={member.avatar} alt={member.name} className="tb-applicant-avatar" style={{ objectFit: 'cover' }} />
                                        ) : (
                                          <div className="tb-applicant-avatar fallback">{(member.name || '?')[0].toUpperCase()}</div>
                                        )}
                                        <div>
                                          <div className="tb-applicant-name">{member.name}</div>
                                          <div className="tb-applicant-role">Applied for: <strong>{member.role}</strong></div>
                                          {member.intro && <div className="tb-applicant-intro">"{member.intro}"</div>}
                                        </div>
                                      </div>
                                      <div className="tb-applicant-actions">
                                        {member.status === 'pending' ? (
                                          <>
                                            <button
                                              className="tb-action-btn tb-accept"
                                              onClick={() => updateStatus.mutate({ memberId: member.id, status: 'approved' })}
                                              disabled={updateStatus.isPending && updateStatus.variables?.memberId === member.id}
                                              style={{ opacity: (updateStatus.isPending && updateStatus.variables?.memberId === member.id) ? 0.5 : 1 }}
                                            >
                                              {updateStatus.isPending && updateStatus.variables?.memberId === member.id && updateStatus.variables?.status === 'approved' ? '...' : <><CheckCircle2 size={14} /> Accept</>}
                                            </button>
                                            <button
                                              className="tb-action-btn tb-reject"
                                              onClick={() => updateStatus.mutate({ memberId: member.id, status: 'rejected' })}
                                              disabled={updateStatus.isPending && updateStatus.variables?.memberId === member.id}
                                              style={{ opacity: (updateStatus.isPending && updateStatus.variables?.memberId === member.id) ? 0.5 : 1 }}
                                            >
                                              {updateStatus.isPending && updateStatus.variables?.memberId === member.id && updateStatus.variables?.status === 'rejected' ? '...' : <><XCircle size={14} /> Reject</>}
                                            </button>
                                          </>
                                        ) : (
                                          <span className={`tb-status-chip ${member.status}`} style={{ marginRight: '0.5rem', padding: '4px 10px' }}>
                                            {member.status === 'approved' && <CheckCircle2 size={13} />}
                                            {member.status === 'rejected' && <XCircle size={13} />}
                                            {member.status}
                                          </span>
                                        )}
                                        <button className="tb-action-btn tb-chat-btn" onClick={() => openChat(team.id, member.email)}>
                                          <MessageCircle size={14} />
                                        </button>
                                      </div>
                                    </motion.div>
                                  ))}
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        )
                      })()}
                    </>
                  )}
                </motion.div>
              )}

              {/* ─── MY APPLICATIONS TAB ─── */}
              {activeTab === 'applied' && (
                <motion.div key="applied" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  {appsLoading ? (
                    <div className="tb-skeleton-list">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="tb-skeleton-app-card">
                          <div className="tb-skel-app-left">
                            <div className="tb-skel-app-title tb-shimmer-base" />
                            <div className="tb-skel-app-role tb-shimmer-base" />
                            <div className="tb-skel-app-leader tb-shimmer-base" />
                          </div>
                          <div className="tb-skel-app-right">
                            <div className="tb-skel-chip tb-shimmer-base" />
                            <div className="tb-skel-btn-sm tb-shimmer-base" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className="tb-sub-tabs-wrap">
                        <button className={`tb-sub-tab ${appliedSubTab === 'pending' ? 'active' : ''}`} onClick={() => setAppliedSubTab('pending')}>
                          <Clock size={15} className="tb-sub-icon" /> Pending
                        </button>
                        <button className={`tb-sub-tab ${appliedSubTab === 'past' ? 'active' : ''}`} onClick={() => setAppliedSubTab('past')}>
                          <CheckCircle2 size={15} className="tb-sub-icon" /> Past
                        </button>
                      </div>

                      {(() => {
                        const filteredApps = appliedSubTab === 'pending'
                          ? myApps.filter((a: any) => a.status === 'pending')
                          : myApps.filter((a: any) => a.status === 'approved' || a.status === 'rejected')

                        if (filteredApps.length === 0) {
                          return (
                            <div className="tb-empty">
                              <Send size={56} strokeWidth={1} style={{ color: 'var(--primary)', opacity: 0.5 }} />
                              <h3>{appliedSubTab === 'pending' ? 'No Pending Applications' : 'No Past Applications'}</h3>
                              <p>{appliedSubTab === 'pending' ? 'All your applications have been reviewed.' : 'Your reviewed applications will appear here.'}</p>
                            </div>
                          )
                        }

                        return (
                          <div className="tb-apps-list">
                            {filteredApps.map((app: any, idx: number) => (
                              <motion.div
                                key={app.id}
                                className="tb-team-block tb-mobile-card"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.04 }}
                              >
                                <div className="tb-team-block-header">
                                  <h3>{app.teams?.competition_name || 'Team'}</h3>
                                </div>
                                <h4 className="tb-mobile-section-title" style={{ marginTop: 0, marginBottom: '0.75rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                  Your Application
                                </h4>
                                
                                <div className="tb-applicant-card">
                                  <div className="tb-applicant-info">
                                    {app.teams?.creator_avatar ? (
                                      <img src={app.teams.creator_avatar} alt={app.teams.creator_name} className="tb-applicant-avatar" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                                    ) : (
                                      <div className="tb-applicant-avatar fallback" style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600 }}>
                                        {(app.teams?.creator_name || '?')[0].toUpperCase()}
                                      </div>
                                    )}
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                      <span style={{ fontSize: '0.9rem', color: 'var(--white)', fontWeight: 500 }}>Leader: {app.teams?.creator_name}</span>
                                      <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                                        Applied for: <strong style={{ color: '#fff' }}>{app.role}</strong>
                                      </span>
                                      {app.intro && <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', fontStyle: 'italic', marginTop: '6px' }}>"{app.intro}"</span>}
                                    </div>
                                  </div>
                                  <div className="tb-applicant-actions">
                                    <span className={`tb-status-chip ${app.status}`} style={{ flex: 1, textAlign: 'center', padding: '6px 12px', borderRadius: '16px', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', background: 'rgba(255,255,255,0.05)' }}>
                                      {app.status === 'pending' && <Clock size={13} />}
                                      {app.status === 'approved' && <CheckCircle2 size={13} color="#34d399" />}
                                      {app.status === 'rejected' && <XCircle size={13} color="#f87171" />}
                                      <span style={{ textTransform: 'capitalize', color: app.status === 'approved' ? '#34d399' : app.status === 'rejected' ? '#f87171' : '#fcd34d' }}>{app.status}</span>
                                    </span>
                                    <button className="tb-action-btn tb-chat-btn" onClick={() => openChat(app.team_id, app.email)} style={{ padding: '8px', borderRadius: '16px', background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <MessageCircle size={16} color="#60a5fa" />
                                    </button>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        )
                      })()}
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ─── CHAT OVERLAY ─── */}
      <AnimatePresence>
        {chatOpen && (() => {
          let chatPartnerName = 'Chat'
          let chatPartnerAvatar = ''
          let groupAvatars: string[] = []

          if (chatTeamId && chatApplicantEmail) {
            if (chatApplicantEmail === 'GROUP') {
              const team = myTeams.find((t: any) => t.id === chatTeamId)
              if (team) {
                chatPartnerName = team.team_name || team.competition_name || 'Group Chat'
                const members = team.team_members?.filter((m: any) => m.status === 'approved').map((m: any) => m.avatar).filter(Boolean) || []
                if (team.creator_avatar) members.unshift(team.creator_avatar)
                groupAvatars = members.slice(0, 3)
              }
            } else if (activeTab === 'my-teams' || activeTab === 'received') {
              const team = myTeams.find((t: any) => t.id === chatTeamId)
              if (team) {
                if (team.creator_id === user?.id) {
                  const member = team.team_members?.find((m: any) => m.email === chatApplicantEmail)
                  if (member) {
                    chatPartnerName = member.name
                    chatPartnerAvatar = member.avatar || ''
                  }
                } else {
                  chatPartnerName = team.creator_name
                  chatPartnerAvatar = team.creator_avatar || ''
                }
              }
            } else if (activeTab === 'applied') {
              const app = myApps.find((a: any) => a.team_id === chatTeamId && a.email === chatApplicantEmail)
              if (app && app.teams) {
                chatPartnerName = app.teams.creator_name
                chatPartnerAvatar = app.teams.creator_avatar || ''
              }
            }
          }

          return (
            <motion.div
              className="tb-chat-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setChatOpen(false)}
            >
              <motion.div
                className="tb-chat-popup"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={e => e.stopPropagation()}
              >
                <div className="tb-chat-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {chatApplicantEmail === 'GROUP' && groupAvatars.length > 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        {groupAvatars.map((ava, i) => (
                          <img key={i} src={ava} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', marginLeft: i > 0 ? '-12px' : '0', zIndex: 10 - i, position: 'relative' }} />
                        ))}
                      </div>
                    ) : chatPartnerAvatar ? (
                      <img src={chatPartnerAvatar} alt={chatPartnerName} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #00a884, #005c4b)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>
                        {(chatPartnerName || '?')[0].toUpperCase()}
                      </div>
                    )}
                    <h4 style={{ margin: 0 }}>{chatPartnerName}</h4>
                  </div>
                  <button className="tb-chat-close" onClick={() => setChatOpen(false)}>&times;</button>
                </div>
                <div className="tb-chat-messages">
                  {isChatLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
                      <span className="tb-spinner" style={{ marginRight: '8px' }} /> Loading chat...
                    </div>
                  ) : chatMessages.length === 0 ? (
                    <p className="tb-chat-empty">No messages yet. Start the conversation!</p>
                  ) : (
                    chatMessages.map((msg: any, i: number) => {
                      const isConsecutive = i > 0 && chatMessages[i - 1]?.sender_email === msg.sender_email;
                      const showName = chatApplicantEmail === 'GROUP' &&
                        msg.sender_email !== user?.email &&
                        !isConsecutive;

                      return (
                        <div key={msg.id || i} className={`tb-chat-msg ${msg.sender_email === user?.email ? 'mine' : 'theirs'} ${isConsecutive ? 'consecutive' : ''}`}>
                          {showName && (
                            <div className="tb-chat-sender">{msg.sender_name}</div>
                          )}
                          <div className="tb-chat-text">{msg.message}</div>
                          <div className="tb-chat-time">{formatChatTime(msg.sent_at)}</div>
                        </div>
                      )
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>
                <div className="tb-chat-input-bar">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    placeholder="Type a message..."
                    onKeyDown={e => { if (e.key === 'Enter' && !isSending) handleSendMessage() }}
                    disabled={isSending}
                  />
                  <button onClick={handleSendMessage} disabled={isSending || !chatInput.trim()}>
                    <Send size={16} />
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )
        })()}
      </AnimatePresence>

      {/* ─── Delete Confirmation Modal ─── */}
      <AnimatePresence>
        {deleteTeamConfirmId && (
          <motion.div
            className="tb-form-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ zIndex: 9999, position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              style={{ maxWidth: '400px', width: '100%', padding: '2rem', textAlign: 'center', background: '#1e1e1e', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <Trash2 size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ color: '#fff', fontSize: '1.25rem', marginBottom: '0.5rem' }}>Delete Team?</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>This action cannot be undone.</p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button 
                  style={{ background: 'transparent', color: 'var(--text-secondary)', border: '1px solid transparent', padding: '0.6rem 1.2rem', borderRadius: '20px', cursor: 'pointer', transition: 'all 0.2s' }} 
                  onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent' }}
                  onClick={() => setDeleteTeamConfirmId(null)}
                >
                  Cancel
                </button>
                <button 
                  style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '20px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)' }} 
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.3)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.2)' }}
                  onClick={async () => {
                    try {
                      await deleteTeam.mutateAsync(deleteTeamConfirmId)
                    } catch (err: any) {
                      alert('Failed to delete team: ' + err.message)
                    } finally {
                      setDeleteTeamConfirmId(null)
                    }
                  }}
                >
                  Yes, Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </>
  )
}
