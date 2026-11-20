import { useState, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { useCommunityEvents, useTicketCounts } from '@/hooks/useEvents'
import { useTeamsByVisibility, type Team } from '@/hooks/usePortfolio'
import { EventCard } from '@/components/event/EventCard'
import { CompetitionCard } from '@/components/competition/CompetitionCard'
import { TeamCard } from '@/components/ui/TeamCard'
import { TeamDetailModal } from '@/components/ui/TeamDetailModal'
import { isEventActive, isTeamActive, sortTeamsByPriority } from '@/lib/utils'
import { useCompetitions } from '@/hooks/useCompetitions'
import { Filter, Star, Sparkles, MapPin, CalendarDays, ArrowRight, ArrowLeft, Send, Search, ChevronDown, Globe, Users } from 'lucide-react'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { INDIAN_STATES_CITIES } from '@/lib/constants'
import { TEAM_ROLES, RoleIcon } from '@/components/ui/RoleIcon'
import { CategorySidebar } from '@/components/layout/CategorySidebar'
import { Footer } from '@/components/layout/Footer'
import { EventSkeletonGrid, TeamCardSkeleton } from '@/components/ui/Skeletons'
import './Explore.css'
import './Community.css'

const ALL_STATES = Object.keys(INDIAN_STATES_CITIES).sort()

export default function Community() {
  const { user } = useAuthStore()
  const isPureOrganizer = user?.roles?.includes('organizer') && !user?.roles?.includes('user') && !user?.roles?.includes('student') && !user?.roles?.includes('admin') && !user?.roles?.includes('staff')
  const { openAuthModal } = useUIStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [stateFilter, setStateFilter] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [searchParams] = useSearchParams()
  const activeCategory = searchParams.get('category')

  const availableCities = stateFilter ? (INDIAN_STATES_CITIES[stateFilter] ?? []) : []

  const { data: allEvents = [], isLoading: isLoadingEvents } = useCommunityEvents(!!user)
  const eventIds = useMemo(() => allEvents.map((e) => e.id), [allEvents])
  const { data: ticketCounts = {} } = useTicketCounts(eventIds)
  const { data: allCompetitions = [], isLoading: isLoadingComps } = useCompetitions()
  const isLoading = isLoadingEvents || isLoadingComps

  // Fetch inter-college teams
  const { data: rawInterCollegeTeams = [] } = useTeamsByVisibility('inter_college')
  const interCollegeTeams = useMemo(() => {
    return sortTeamsByPriority(rawInterCollegeTeams.filter(isTeamActive))
  }, [rawInterCollegeTeams])

  // Filter active, approved universal events — exact port of legacy community.html
  const communityEvents = useMemo(() => {
    let events = allEvents.filter((e) => {
      const isTypeEvent = !e.type || e.type === 'event'
      const matchesCategory = activeCategory ? e.category === activeCategory : true
      return isTypeEvent
        && isEventActive(e)
        && ((e.status as string) === 'approved' || (e.status as string) === 'live' || (e.status as string) === 'published')
        && matchesCategory
    })

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      events = events.filter((e) =>
        e.title.toLowerCase().includes(q) ||
        (e.description && e.description.toLowerCase().includes(q)) ||
        (e.venue && e.venue.toLowerCase().includes(q))
      )
    }

    // State filter
    if (stateFilter) {
      events = events.filter((e) => e.state === stateFilter)
    }

    // City filter
    if (cityFilter) {
      events = events.filter((e) => e.city === cityFilter)
    }

    return events
  }, [allEvents, searchQuery, stateFilter, cityFilter, activeCategory])

  // Universal Competitions
  const communityCompetitions = useMemo(() => {
    let comps = allCompetitions.filter((c) => {
      const isUniversal = c.is_universal === true
      if (!isUniversal) return false
      if (c.status !== 'approved' && c.status !== 'live') return false
      const matchesCategory = activeCategory ? c.category === activeCategory : true
      return matchesCategory
    })

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      comps = comps.filter((c) => c.title.toLowerCase().includes(q) || (c.description && c.description.toLowerCase().includes(q)))
    }
    if (stateFilter) comps = comps.filter((c) => c.state === stateFilter)
    if (cityFilter) comps = comps.filter((c) => c.city === cityFilter)

    return comps
  }, [allCompetitions, searchQuery, stateFilter, cityFilter, activeCategory])

  // Filter inter-college teams
  const filteredTeams = useMemo(() => {
    if (selectedRoles.length === 0) return interCollegeTeams
    return interCollegeTeams.filter((team: any) => {
      let matchesRole = true
      if (selectedRoles.length > 0) {
        const hasRole = team.roles?.some((r: any) => {
          const roleName = typeof r === 'string' ? r : r.name
          return selectedRoles.includes(roleName)
        })
        if (!hasRole) matchesRole = false
      }
      return matchesRole
    })
  }, [interCollegeTeams, selectedRoles])

  // Nearby Events
  const nearbyEvents = useMemo(() => {
    if (!user || (!user.city && !user.state)) return []
    return allEvents.filter(e => {
      const isTypeEvent = !e.type || e.type === 'event'
      const isActive = isEventActive(e) && ((e.status as string) === 'approved' || (e.status as string) === 'live' || (e.status as string) === 'published')
      if (!isTypeEvent || !isActive) return false
      
      const eventCity = e.city || (e as any).college_ref?.city
      const eventState = e.state || (e as any).college_ref?.state

      if (user.city && eventCity === user.city) return true
      if (user.state && eventState === user.state) return true
      return false
    })
  }, [allEvents, user])

  // Nearby Teams (Unfiltered)
  const baseNearbyTeams = useMemo(() => {
    if (!user || (!user.city && !user.state)) return []
    return interCollegeTeams.filter(t => {
      const teamCity = t.location || (t as any).creator_college_city
      const teamState = (t as any).creator_college_state

      if (user.city && teamCity?.includes(user.city)) return true
      if (user.state && (teamCity?.includes(user.state) || teamState?.includes(user.state))) return true
      return false
    })
  }, [interCollegeTeams, user])

  // Nearby Teams (Filtered)
  const filteredNearbyTeams = useMemo(() => {
    if (selectedRoles.length === 0) return baseNearbyTeams
    return baseNearbyTeams.filter((team: any) => {
      let matchesRole = true
      if (selectedRoles.length > 0) {
        const hasRole = team.roles?.some((r: any) => {
          const roleName = typeof r === 'string' ? r : r.name
          return selectedRoles.includes(roleName)
        })
        if (!hasRole) matchesRole = false
      }
      return matchesRole
    })
  }, [baseNearbyTeams, selectedRoles])

  // DEBUG: Check what data is actually inside the community events
  console.log('[DEBUG Community] Events:', communityEvents.slice(0, 2).map(e => ({ title: e.title, venue: e.venue, city: e.city, state: e.state })))

  if (!user) {
    return (
      <div className="container">
        <Helmet><title>Community - PLUTO</title></Helmet>
        <motion.div
          className="explore-login-prompt"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
            <Globe size={72} strokeWidth={1.5} style={{ color: 'var(--primary)' }} />
          </div>
          <h1>Community Events</h1>
          <p>Login to discover universal events open to all colleges.</p>
          <button className="btn btn-primary" onClick={() => openAuthModal('login')}>
            Login to Explore
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <>
      <div className="container">
        <Helmet>
          <title>Community - PLUTO</title>
          <meta name="description" content="Discover universal campus events open to students from all colleges." />
        </Helmet>

        <div className="explore-layout">
          <main className="main-content">

            {/* Header — exact match of legacy community.html */}
            <motion.div
              className="explore-header hide-mobile"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ textAlign: 'center', margin: 0, padding: '0 0 2rem 0' }}
            >
              <h1 style={{ color: 'var(--white)' }}>INTER-COLLEGE COMMUNITY</h1>

              {/* Search & Filter Bar */}
              <div className="community-search-row">
                <div className="community-search-input">
                  <Search size={18} className="community-search-icon" />
                  <input
                    type="text"
                    placeholder="Search events or colleges"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger className={`sp-filter-select ${stateFilter ? 'active-filter' : ''}`}>
                    {stateFilter || 'All States'}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => { setStateFilter(''); setCityFilter('') }}>All States</DropdownMenuItem>
                    {ALL_STATES.map(s => (
                      <DropdownMenuItem key={s} onClick={() => { setStateFilter(s); setCityFilter('') }}>{s}</DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger disabled={!stateFilter} className={`sp-filter-select ${cityFilter ? 'active-filter' : ''}`} style={{ opacity: !stateFilter ? 0.5 : 1 }}>
                    {cityFilter || (stateFilter ? 'All Cities' : 'Select state first')}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setCityFilter('')}>All Cities</DropdownMenuItem>
                    {availableCities.map(c => (
                      <DropdownMenuItem key={c} onClick={() => setCityFilter(c)}>{c}</DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </motion.div>

            {/* Competitions Section */}
            {communityCompetitions.length > 0 && (
              <section className="explore-section">
                <h2 className="explore-section-title" style={{ marginBottom: '1rem' }}>
                  Global Competitions
                </h2>
                <div className="horizontal-scroll">
                  {communityCompetitions.map((comp) => (
                    <CompetitionCard key={comp.id} item={comp} />
                  ))}
                </div>
              </section>
            )}

            {/* Events Section */}
            <section className="explore-section">
              <h2 className="explore-section-title" style={{ marginBottom: '1rem' }}>
                Global Events
              </h2>

              {isLoading ? (
                <>
                  <div className="events-grid">
                    <EventSkeletonGrid count={4} />
                  </div>
                  
                  {!isPureOrganizer && (
                    <section className="explore-section" style={{ marginTop: '2rem' }}>
                      <h2 className="explore-section-title" style={{ marginBottom: '1rem' }}>
                        Inter-College Teams
                      </h2>
                      <div className="team-scroll-section">
                        <div className="team-scroll">
                          {[1, 2, 3, 4, 5].map(i => <TeamCardSkeleton key={i} />)}
                        </div>
                      </div>
                    </section>
                  )}
                </>
              ) : communityEvents.length === 0 ? (
                <div className="explore-empty">
                  <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
                    <Sparkles size={56} strokeWidth={1} style={{ color: 'var(--primary)', opacity: 0.8 }} />
                  </div>
                  <p>No community events right now. Check back soon!</p>
                </div>
              ) : (
                <div className="horizontal-scroll">
                  {communityEvents.map((event, i) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      ticketsSold={ticketCounts[event.id] || 0}
                      index={i}
                      showCityState={true}
                    />
                  ))}
                </div>
              )}
            </section>


            {/* Inter-College Team Cards Section */}
            {(!isPureOrganizer && interCollegeTeams.length > 0) && (
              <section className="explore-section">
                <h2 className="explore-section-title" style={{ marginBottom: '1rem' }}>
                  Inter-College Teams
                </h2>
                
                <div className="role-filter-scroll">
                  {TEAM_ROLES.map(role => {
                    const isSelected = selectedRoles.includes(role)
                    return (
                      <div 
                        key={role}
                        className={`role-filter-chip ${isSelected ? 'active' : ''}`}
                        onClick={() => setSelectedRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role])}
                      >
                        <RoleIcon role={role} size={14} />
                        <span>{role}</span>
                      </div>
                    )
                  })}
                </div>

                {filteredTeams.length === 0 ? (
                  <div className="explore-empty" style={{ padding: '2rem' }}>
                    <p>{selectedRoles.length > 0 ? 'No teams looking for selected roles right now.' : 'No teams are currently looking for members.'}</p>
                  </div>
                ) : (
                  <div className="team-scroll-section">
                    <div className="horizontal-scroll">
                      {filteredTeams.map((team, i) => (
                        <TeamCard key={team.id} team={team} index={i} onApply={t => setSelectedTeam(t)} />
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Nearby Events */}
            {nearbyEvents.length > 0 && (
              <section className="explore-section">
                <h2 className="explore-section-title" style={{ marginBottom: '1rem' }}>
                  Events Nearby
                </h2>
                <div className="horizontal-scroll">
                  {nearbyEvents.map((event, i) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      ticketsSold={ticketCounts[event.id] || 0}
                      index={i}
                      showCityState={true}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Nearby Teams */}
            {(!isPureOrganizer && baseNearbyTeams.length > 0) && (
              <section className="explore-section">
                <h2 className="explore-section-title" style={{ marginBottom: '1rem' }}>
                  Teams Nearby
                </h2>

                <div className="role-filter-scroll">
                  {TEAM_ROLES.map(role => {
                    const isSelected = selectedRoles.includes(role)
                    return (
                      <div 
                        key={role}
                        className={`role-filter-chip ${isSelected ? 'active' : ''}`}
                        onClick={() => setSelectedRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role])}
                      >
                        <RoleIcon role={role} size={14} />
                        <span>{role}</span>
                      </div>
                    )
                  })}
                </div>

                {filteredNearbyTeams.length === 0 ? (
                  <div className="explore-empty" style={{ padding: '2rem' }}>
                    <p>{selectedRoles.length > 0 ? 'No nearby teams looking for selected roles right now.' : 'No teams are currently looking for members.'}</p>
                  </div>
                ) : (
                  <div className="team-scroll-section">
                    <div className="horizontal-scroll">
                      {filteredNearbyTeams.map((team, i) => (
                        <TeamCard key={team.id} team={team} index={i} onApply={t => setSelectedTeam(t)} />
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}
            
            {/* End of Feed */}
            <div style={{ textAlign: 'center', marginTop: '3.5rem', marginBottom: '2.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', margin: 0 }}>You're all caught up!</h3>
              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', marginTop: '6px' }}>End of Community feed</p>
            </div>

            <Footer />
          </main>

          <CategorySidebar />
        </div>
      </div>

      {/* Team Detail Modal */}
      <TeamDetailModal team={selectedTeam} open={!!selectedTeam} onClose={() => setSelectedTeam(null)} />
    </>
  )
}
