import { useState, useEffect, useRef } from 'react'
import { Helmet } from 'react-helmet-async'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { useCollegeEvents, useTicketCounts } from '@/hooks/useEvents'
import { useTeamsByVisibility, type Team } from '@/hooks/usePortfolio'
import { EventCard } from '@/components/event/EventCard'
import { CompetitionCard } from '@/components/competition/CompetitionCard'
import { TeamCard } from '@/components/ui/TeamCard'
import { TeamDetailModal } from '@/components/ui/TeamDetailModal'
import { useCollegeCompetitions } from '@/hooks/useCompetitions'
import { getCdnUrl } from '@/utils/cdn'
import { isEventActive, checkIsLive, formatTime, isTeamActive, sortTeamsByPriority } from '@/lib/utils'
import { CategorySidebar } from '@/components/layout/CategorySidebar'
import { CursorGlow } from '@/components/ui/CursorGlow'
import { Telescope, Compass, Users, Calendar, Lock, MapPin, Clock } from 'lucide-react'
import { Footer } from '@/components/layout/Footer'
import { EventSkeletonGrid, AnnouncementSkeletonScroll, TeamCardSkeleton, MobileExploreSkeleton } from '@/components/ui/Skeletons'
import { TEAM_ROLES, RoleIcon } from '@/components/ui/RoleIcon'
import './Explore.css'

function AnnouncementCardItem({ ann }: { ann: any }) {
  const cardRef = useRef<HTMLDivElement>(null)
  
  const city = ann.city || (ann as any).college_ref?.city
  const state = ann.state || (ann as any).college_ref?.state
  const locationStr = [ann.venue, city, state].filter(Boolean).join(', ')
  const isLive = checkIsLive(ann)

  return (
    <div className="announcement-card-container glow-card-container" ref={cardRef}>
      {/* DESKTOP VIEW */}
      <div className="announcement-card desktop-card">
        {ann.banner_url && (
          <img src={getCdnUrl(ann.banner_url)} alt={ann.title} className="ann-poster" />
        )}
        <div className="ann-content">
          {(ann.time || ann.start_time) && (
            <div className="ann-time">
              {formatTime(ann.time || ann.start_time || '')}
              {((ann as any).endTime || ann.end_time) && ` - ${formatTime((ann as any).endTime || ann.end_time || '')}`}
            </div>
          )}
          <div className="ann-title">{ann.title}</div>
          {ann.department && (
            <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#ffffff', background: 'rgba(255, 255, 255, 0.1)', padding: '3px 8px', borderRadius: '12px', display: 'inline-block', marginTop: '4px' }}>
              {ann.department}
            </div>
          )}
          {ann.description && (
            <div className="ann-desc" style={{ 
              fontSize: '0.72rem', color: 'var(--text-secondary)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              marginTop: '1px', marginBottom: '4px', width: '100%'
            }}>
              {ann.description}
            </div>
          )}
          {ann.venue && <div className="ann-venue">📍 {ann.venue}</div>}
        </div>
        {isLive && (
          <div className="event-live-badge" style={{ position: 'absolute', top: 10, right: 10 }}>
            <div className="live-dot" />
            LIVE
          </div>
        )}
      </div>

      {/* MOBILE VIEW */}
      <div className="announcement-mobile mobile-card">
        {ann.banner_url ? (
          <img src={getCdnUrl(ann.banner_url)} alt={ann.title} className="annm-image" />
        ) : (
          <div className="annm-placeholder">
            <Telescope color="rgba(255,255,255,0.12)" size={56} />
          </div>
        )}
        
        <div className="annm-top-fade"></div>
        <div className="annm-bottom-fade"></div>

        <div className="annm-top-badge-row">
          <div className="annm-type-badge">
            <Telescope color="#a5b4fc" size={12} />
            <span>TODAY'S ANNOUNCEMENT</span>
          </div>
          {isLive && (
            <div className="ecm-live-badge" style={{ position: 'static' }}>
              <div className="ecm-live-dot" />
              <span>LIVE</span>
            </div>
          )}
        </div>

        <div className="annm-info-bottom">
          <div className="annm-badges">
            {ann.category && (
              <div className="annm-badge-dark">
                <span>{ann.category}</span>
              </div>
            )}
            {ann.department && ann.department !== 'All' && (
              <div className="annm-badge-primary">
                <span>{ann.department}</span>
              </div>
            )}
          </div>

          <h3 className="annm-title">{ann.title}</h3>
          
          {ann.description && (
            <p className="annm-desc">{ann.description}</p>
          )}

          <div className="annm-meta-block">
            {ann.type !== 'announcement' && ann.start_date && (
              <div className="annm-meta-row">
                <Calendar color="#818cf8" size={12} />
                <span>{new Date(ann.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
              </div>
            )}
            <div className="annm-meta-row-group">
              {ann.start_time && (
                <div className="annm-meta-row">
                  <Clock color="#818cf8" size={12} />
                  <span>{formatTime(ann.start_time)}{ann.end_time ? ` - ${formatTime(ann.end_time)}` : ''}</span>
                </div>
              )}
              {locationStr && (
                <div className="annm-meta-row">
                  <MapPin color="#818cf8" size={12} />
                  <span className="annm-meta-truncate">{locationStr}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Explore() {
  const { user, isLoading: isAuthLoading } = useAuthStore()
  const { openAuthModal } = useUIStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const activeCategory = searchParams.get('category')

  const { data: allEvents = [], isLoading: isLoadingEvents } = useCollegeEvents(user?.college_id, user?.college)
  const { data: allCompetitions = [], isLoading: isLoadingComps } = useCollegeCompetitions(user?.college_id)
  const isLoading = isLoadingEvents || isLoadingComps

  const ticketCountsMap = useTicketCounts(allEvents.map(e => e.id))
  const ticketCounts = ticketCountsMap.data || {}

  // Fetch campus teams
  const { data: allCampusTeams = [] } = useTeamsByVisibility('campus')
  
  // Strictly filter so only teams from the user's specific college are shown
  let campusTeams = allCampusTeams.filter((team: any) => {
    // If the user doesn't have a college_id, we shouldn't show them ALL campus teams.
    // They should either see none, or we need to resolve their college_id.
    if (!user?.college_id) return false 
    if (!isTeamActive(team)) return false
    
    // 'both' or 'campus' visibility teams must belong to the user's college to show on Explore
    return team.creator_college_id === user.college_id
  })

  campusTeams = sortTeamsByPriority(campusTeams)

  // ── Year/Section visibility helper ──
  const isVisibleToUser = (item: any) => {
    // If we have target_departments, evaluate those first
    if (item.target_departments && Array.isArray(item.target_departments) && item.target_departments.length > 0) {
      if (!user?.department) return false
      const deptTarget = item.target_departments.find((td: any) => td.department === user.department)
      if (!deptTarget) return false // Not targeted at user's department

      // Check year
      if (deptTarget.years && deptTarget.years.length > 0) {
        if (!user?.year || !deptTarget.years.includes(String(user.year))) return false
      }

      // Check section
      if (deptTarget.sections && user?.year && deptTarget.sections[String(user.year)] && deptTarget.sections[String(user.year)].length > 0) {
        if (!user?.section || !deptTarget.sections[String(user.year)].includes(String(user.section))) return false
      }

      return true
    }

    // Fallback to legacy department logic
    // No department targeting = visible to all
    if (!item.department || item.department === 'ALL' || item.department === 'All') return true
    // Department mismatch
    if (item.department !== user?.department) return false

    // Robustly parse target_years
    let parsedYears: string[] = []
    if (Array.isArray(item.target_years)) {
      parsedYears = item.target_years.map(String)
    } else if (typeof item.target_years === 'string') {
      try {
        parsedYears = JSON.parse(item.target_years).map(String)
      } catch {
        const clean = item.target_years.replace(/[{}]/g, '')
        if (clean) parsedYears = clean.split(',').map((s: string) => s.trim())
      }
    }

    // No year targeting = entire department
    if (parsedYears.length === 0) return true
    
    // Year check
    if (!user?.year || !parsedYears.includes(String(user.year))) return false

    let parsedSections: Record<string, string[]> = {}
    if (item.target_sections && typeof item.target_sections === 'object') {
      parsedSections = item.target_sections
    } else if (typeof item.target_sections === 'string') {
      try {
        parsedSections = JSON.parse(item.target_sections)
      } catch {
        // Fallback for weird strings if necessary, though it should be jsonb
      }
    }

    // No section targeting for this year = all sections of this year
    if (!parsedSections[String(user.year)] || parsedSections[String(user.year)].length === 0) return true
    
    // Section check (if user has a section)
    if (!user?.section) return true // No section assigned = sees everything in their year
    return parsedSections[String(user.year)].includes(String(user.section))
  }

  const isDepartmentItem = (item: any) => {
    if (item.target_departments && Array.isArray(item.target_departments) && item.target_departments.length > 0) return true
    if (item.department && item.department !== 'All' && item.department !== 'ALL') return true
    return false
  }

  // ── Filtering logic ──
  // Step 1: College-scoped events — non-universal, active, approved/live
  const relevantEvents = allEvents.filter((e) => {
    if (e.type === 'announcement') return false // handled separately
    const isUniversal = e.is_universal === true || (e as any).isUniversal === true
    return !isUniversal
      && isEventActive(e)
      && (e.status === 'approved' || e.status === 'live')
  })

  // Step 2: Announcements from the dedicated announcements table
  // + currently live events (which also show as announcements)
  const standaloneAnnouncements = allEvents.filter((e) => {
    if (e.type !== 'announcement') return false
    const isUniversal = e.is_universal === true || (e as any).isUniversal === true
    if (isUniversal) return false
    
    // Check department + year/section visibility
    if (!isVisibleToUser(e)) return false

    // If announcement has specific time data, check if it's still active
    const hasTimeData = e.start_date || (e as any).date || e.start_time || e.time

    if (hasTimeData) {
      if (!isEventActive(e)) return false
    } else {
      // For legacy announcements (or those created without an end_time):
      // Only show them if they were created on the CURRENT DAY.
      if (!e.created_at) return false

      const now = new Date()
      // Create a local date string for 'today'
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

      // Extract the date part of created_at (assuming ISO string or similar)
      const createdAtDate = new Date(e.created_at)
      const createdStr = `${createdAtDate.getFullYear()}-${String(createdAtDate.getMonth() + 1).padStart(2, '0')}-${String(createdAtDate.getDate()).padStart(2, '0')}`

      if (createdStr !== todayStr) return false
    }

    return true
  })
  const liveEvents = relevantEvents.filter((e) => checkIsLive(e))
  const announcements = [...standaloneAnnouncements, ...liveEvents]

  // Step 3: Upcoming events = type 'event' (or no type), NOT currently live
  const allUpcomingEvents = relevantEvents.filter((e) => {
    const isTypeEvent = !e.type || e.type === 'event'
    const matchesCategory = activeCategory ? e.category === activeCategory : true
    return isTypeEvent && !checkIsLive(e) && matchesCategory
  })

  // Competitions (college scoped if is_universal=false)
  const allUpcomingCompetitions = allCompetitions.filter((c) => {
    const isUniversal = c.is_universal === true
    if (isUniversal) return false // Universal goes to community
    if (user?.college_id && c.college_id && c.college_id !== user.college_id) return false
    if (c.status !== 'approved' && c.status !== 'live') return false
    const matchesCategory = activeCategory ? c.category === activeCategory : true
    return matchesCategory
  })

  // Split out Department specifics — now with year/section filtering
  const departmentEvents = allUpcomingEvents.filter(e => isDepartmentItem(e) && isVisibleToUser(e))
  const publicEvents = allUpcomingEvents.filter(e => !isDepartmentItem(e))
  
  const departmentCompetitions = allUpcomingCompetitions.filter(c => isDepartmentItem(c) && isVisibleToUser(c))
  const publicCompetitions = allUpcomingCompetitions.filter(c => !isDepartmentItem(c))

  const upcomingEvents = publicEvents
  const upcomingCompetitions = publicCompetitions

  const departmentMix = [...departmentEvents, ...departmentCompetitions].sort((a, b) => {
    const dateA = new Date(a.start_date || a.created_at).getTime()
    const dateB = new Date(b.start_date || b.created_at).getTime()
    return dateA - dateB
  })

  const filteredTeams = campusTeams.filter((team: any) => {
    if (selectedRoles.length === 0) return true
    return team.roles?.some((r: any) => {
      const roleName = typeof r === 'string' ? r : r.name
      return selectedRoles.includes(roleName)
    })
  })

  // Prevent flickering of old login UI while auth state resolves
  if (isAuthLoading || !user) {
    return null
  }

  return (
    <>
      <div className="container">
        <Helmet>
          <title>Explore Events - PLUTO</title>
          <meta name="description" content="Discover and book campus events from your college on PLUTO." />
        </Helmet>

        <div className="explore-layout">
          <main className="main-content">
            <motion.div
              className="explore-header hide-mobile"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ textAlign: 'center', margin: 0, padding: '0 0 1rem 0' }}
            >
              <h1 style={{ fontSize: '2.4rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--white)' }}>DISCOVER CAMPUS EVENTS</h1>
            </motion.div>

            {isLoading ? (
              <>
                <div className="hide-mobile">
                  <section className="explore-section">
                    <h2 className="explore-section-title" style={{ marginBottom: '1rem' }}>Today's Announcements</h2>
                    <AnnouncementSkeletonScroll count={4} />
                  </section>

                  <section className="explore-section">
                    <div className="explore-section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <h2 className="explore-section-title" style={{ margin: 0 }}>Upcoming Events</h2>
                      <button
                        className="ai-event-suggest-btn"
                        disabled
                        style={{ opacity: 0.5, cursor: 'not-allowed' }}
                        title="Loading AI..."
                      >
                        <span className="ai-orbit"></span>
                        AI
                      </button>
                    </div>
                    <div className="events-grid">
                      <EventSkeletonGrid count={4} />
                    </div>
                  </section>

                  <section className="explore-section">
                    <h2 className="explore-section-title" style={{ marginBottom: '1rem' }}>
                      Teams Looking for Members
                    </h2>
                    <div className="team-scroll-section">
                      <div className="team-scroll">
                        {[1, 2, 3, 4, 5].map(i => <TeamCardSkeleton key={i} />)}
                      </div>
                    </div>
                  </section>
                </div>
                
                <MobileExploreSkeleton />
              </>
            ) : (
              <>
                {announcements.length > 0 && (
                  <section className="explore-section">
                    <h2 className="explore-section-title hide-mobile">Today's Announcements</h2>
                    <div className="announcement-scroll">
                      {announcements.map((ann) => (
                        <AnnouncementCardItem key={ann.id} ann={ann} />
                      ))}
                    </div>
                  </section>
                )}
                
                {departmentMix.length > 0 && (
                  <section className="explore-section">
                    <h2 className="explore-section-title" style={{ color: '#fff' }}>Department's Events & Competitions</h2>
                    <div className="horizontal-scroll">
                      {departmentMix.map((item) => (
                        'themes' in item ? (
                          <CompetitionCard key={item.id} item={item as any} />
                        ) : (
                          <EventCard key={item.id} event={item as any} ticketsSold={ticketCounts[item.id] || 0} />
                        )
                      ))}
                    </div>
                  </section>
                )}




                {upcomingCompetitions.length > 0 && (
                  <section className="explore-section">
                    <h2 className="explore-section-title">Upcoming Competitions</h2>
                    <div className="horizontal-scroll">
                      {upcomingCompetitions.map((comp) => (
                        <CompetitionCard key={comp.id} item={comp} />
                      ))}
                    </div>
                  </section>
                )}

                {upcomingEvents.length > 0 && (
                  <section className="explore-section">
                    <h2 className="explore-section-title">Upcoming Events</h2>
                    <div className="horizontal-scroll">
                      {upcomingEvents.map((event, i) => (
                        <EventCard
                          key={event.id}
                          event={event}
                          ticketsSold={ticketCounts[event.id] || 0}
                          index={i}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* Global Empty State */}
                {announcements.length === 0 && departmentMix.length === 0 && upcomingCompetitions.length === 0 && upcomingEvents.length === 0 && (
                  <div className="explore-empty">
                    <div style={{ marginBottom: '1rem' }}>
                      <Compass size={56} strokeWidth={1.5} style={{ color: 'var(--primary)', opacity: 0.8 }} />
                    </div>
                    <p>No upcoming events found.</p>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      Check out the <a href="/community" style={{ color: 'var(--primary)' }}>Community</a> for universal events!
                    </p>
                  </div>
                )}

                {/* Team Cards Section */}
                {campusTeams.length > 0 && (
                  <section className="explore-section">
                    <h2 className="explore-section-title">
                      Teams Looking for Members
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
                          {filteredTeams.map((team: any, i: number) => (
                            <TeamCard key={team.id} team={team} index={i} onApply={(t: any) => setSelectedTeam(t)} />
                          ))}
                        </div>
                      </div>
                    )}
                  </section>
                )}
              </>
            )}
            
            {/* End of Feed */}
            <div style={{ textAlign: 'center', marginTop: '3.5rem', marginBottom: '2.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', margin: 0 }}>You're all caught up!</h3>
              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', marginTop: '6px' }}>End of Explore feed</p>
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
