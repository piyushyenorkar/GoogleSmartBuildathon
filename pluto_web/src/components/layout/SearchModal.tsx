import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Search, X, Loader2, Terminal, Wrench, Music, Paintbrush, Mic, SlidersHorizontal, ChevronDown, ChevronUp, ArrowLeft, Code, LayoutGrid, Cpu } from 'lucide-react'
import { useSearchStore } from '../../stores/searchStore'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { isEventActive, isTeamActive, isCompetitionActive } from '../../lib/utils'
import { EventCard } from '../event/EventCard'
import { TeamCard } from '../ui/TeamCard'
import { TeamDetailModal } from '../ui/TeamDetailModal'
import { TEAM_ROLES, RoleIcon } from '../ui/RoleIcon'
import { CompetitionCard } from '../competition/CompetitionCard'
import { attachAvatarsToTeams } from '../../hooks/usePortfolio'
import './SearchModal.css'

const CATEGORIES = [
  { id: 'hackathon', name: 'Hackathon', icon: Terminal },
  { id: 'workshop', name: 'Workshop', icon: Wrench },
  { id: 'music', name: 'Music', icon: Music },
  { id: 'art', name: 'Art', icon: Paintbrush },
  { id: 'orator', name: 'Orator', icon: Mic },
]

const COMPETITION_CATEGORIES = [
  { id: 'hackathon', name: 'Hackathon', icon: Terminal },
  { id: 'coding', name: 'Coding', icon: Code },
  { id: 'case_study', name: 'Case Study', icon: LayoutGrid },
  { id: 'ideathon', name: 'Ideathon', icon: Cpu },
  { id: 'design', name: 'Design', icon: Paintbrush }
]

export function SearchModal() {
  const { user } = useAuthStore()
  const {
    isSearchVisible, searchContext, query, setQuery,
    setSearchVisible, recentSearches, addRecentSearch, removeRecentSearch,
    isFreeOnly, isPaidOnly, isSeatedOnly,
    toggleFreeOnly, togglePaidOnly, toggleSeatedOnly, resetFilters
  } = useSearchStore()

  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  
  // Cached trending data per tab
  const [trendingEvents, setTrendingEvents] = useState<any[]>([])
  const [trendingCompetitions, setTrendingCompetitions] = useState<any[]>([])
  const [trendingTeams, setTrendingTeams] = useState<any[]>([])

  const [searchType, setSearchType] = useState<'events' | 'competitions' | 'teams'>('competitions')
  const trending = searchType === 'events' ? trendingEvents : searchType === 'competitions' ? trendingCompetitions : trendingTeams
  
  const [selectedTeam, setSelectedTeam] = useState<any>(null)
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isSearchVisible) {
      document.body.style.overflow = 'hidden'
      if ((searchType === 'events' && trendingEvents.length === 0) || 
          (searchType === 'competitions' && trendingCompetitions.length === 0) || 
          (searchType === 'teams' && trendingTeams.length === 0)) {
        fetchTrending(searchType)
      }
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      document.body.style.overflow = 'unset'
      setTimeout(() => {
        setSearchType('competitions')
        setQuery('')
        setSelectedRoles([])
        setSelectedCategories([])
        setResults([])
        // Intentionally NOT clearing trending states to keep them cached
      }, 300)
    }
  }, [isSearchVisible])

  const fetchTrending = async (targetType: 'events' | 'competitions' | 'teams') => {
    setLoading(true)
    try {
      if (targetType === 'teams') {
        let q = supabase.from('teams').select('*, team_members(*)').in('status', ['open', ''])

        if (searchContext === 'explore') {
          q = q.in('visibility', ['campus', 'both'])
        } else if (searchContext === 'community') {
          q = q.in('visibility', ['inter_college', 'both'])
        } else {
          q = q.in('visibility', ['campus', 'both'])
        }

        const { data } = await q.order('created_at', { ascending: false }).limit(20)
        let activeTeams = (data || []).filter((t: any) => isTeamActive(t))
        
        if (searchContext === 'explore' && user?.college_id) {
          const creatorIds = [...new Set(activeTeams.map((t: any) => t.creator_id))]
          if (creatorIds.length > 0) {
            const { data: profiles } = await supabase.from('users').select('id, college_id').in('id', creatorIds)
            const profileMap = new Map(profiles?.map(p => [p.id, p.college_id]) || [])
            activeTeams = activeTeams.filter((t: any) => profileMap.get(t.creator_id) === user.college_id)
          } else {
            activeTeams = []
          }
        }
        const teamsWithAvatars = await attachAvatarsToTeams(activeTeams.slice(0, 10))
        setTrendingTeams(teamsWithAvatars)
      } else if (targetType === 'competitions') {
        let q = supabase.from('competitions').select('*')
          .in('status', ['approved', 'live'])
          .order('created_at', { ascending: false })
          .limit(10)

        if (searchContext === 'explore') {
          if (user?.college_id) {
            q = q.eq('college_id', user.college_id)
          } else {
            q = q.eq('id', '00000000-0000-0000-0000-000000000000') // Block access if no college
          }
        } else if (searchContext === 'community') {
          q = q.eq('is_universal', true)
        } else {
          if (user?.college_id) {
            q = q.or(`college_id.eq.${user.college_id},is_universal.eq.true`)
          } else {
            q = q.eq('is_universal', true)
          }
        }
        
        const { data } = await q
        setTrendingCompetitions((data || []).filter((c: any) => isCompetitionActive(c)))
      } else {
        const SEARCH_EVENT_SELECT = 'id, title, start_date, end_date, start_time, end_time, venue, city, state, banner_url, ticket_price, ticket_type, category, type, status, is_universal, has_seating, created_at, college_id'
        let q = supabase.from('events').select(SEARCH_EVENT_SELECT)
          .in('status', ['approved', 'live'])
          .order('created_at', { ascending: false })
          .limit(10)

        if (searchContext === 'explore') {
          if (user?.college_id) {
            q = q.eq('college_id', user.college_id)
          } else {
            q = q.eq('id', '00000000-0000-0000-0000-000000000000')
          }
        } else if (searchContext === 'community') {
          q = q.eq('is_universal', true)
        } else {
          if (user?.college_id) {
            q = q.or(`college_id.eq.${user.college_id},is_universal.eq.true`)
          } else {
            q = q.eq('is_universal', true)
          }
        }

        const { data } = await q
        setTrendingEvents((data || []).filter((e: any) => isEventActive(e)))
      }
    } catch (e) {
      console.error('Error fetching trending', e)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = useCallback(async () => {
    const isFilterActive = isFreeOnly || isPaidOnly || isSeatedOnly || selectedCategories.length > 0 || selectedRoles.length > 0
    if (!query.trim() && !isFilterActive) {
      setResults([])
      return
    }
    setLoading(true)
    try {
      if (searchType === 'teams') {
        let q = supabase.from('teams').select('*, team_members(*)').in('status', ['open', ''])

        if (searchContext === 'explore') {
          q = q.in('visibility', ['campus', 'both'])
        } else if (searchContext === 'community') {
          q = q.in('visibility', ['inter_college', 'both'])
        } else {
          q = q.in('visibility', ['campus', 'both'])
        }

        if (query) {
          q = q.or(`team_name.ilike.%${query}%,purpose.ilike.%${query}%,competition_name.ilike.%${query}%`)
        }
        if (selectedRoles.length > 0) {
          q = q.contains('roles', selectedRoles)
        }
        
        const { data } = await q.order('created_at', { ascending: false }).limit(20)
        let activeTeams = (data || []).filter((t: any) => isTeamActive(t))
        
        if (searchContext === 'explore' && user?.college_id) {
          const creatorIds = [...new Set(activeTeams.map((t: any) => t.creator_id))]
          if (creatorIds.length > 0) {
            const { data: profiles } = await supabase.from('users').select('id, college_id').in('id', creatorIds)
            const profileMap = new Map(profiles?.map(p => [p.id, p.college_id]) || [])
            activeTeams = activeTeams.filter((t: any) => profileMap.get(t.creator_id) === user.college_id)
          } else {
            activeTeams = []
          }
        }
        const teamsWithAvatars = await attachAvatarsToTeams(activeTeams)
        setResults(teamsWithAvatars)
      } else if (searchType === 'competitions') {
        let q = supabase.from('competitions').select('*').in('status', ['approved', 'live'])

        if (searchContext === 'explore') {
          if (user?.college_id) {
            q = q.eq('college_id', user.college_id)
          } else {
            q = q.eq('id', '00000000-0000-0000-0000-000000000000') // Block if no college
          }
        } else if (searchContext === 'community') {
          q = q.eq('is_universal', true)
        } else {
          if (user?.college_id) {
            q = q.or(`college_id.eq.${user.college_id},is_universal.eq.true`)
          } else {
            q = q.eq('is_universal', true)
          }
        }

        if (query) {
          q = q.ilike('title', `%${query}%`)
        }
        if (selectedCategories.length > 0) {
          q = q.in('category', selectedCategories)
        }
        if (isFreeOnly) {
          q = q.eq('fee_type', 'free')
        }
        if (isPaidOnly) {
          q = q.eq('fee_type', 'paid')
        }

        const { data } = await q.order('created_at', { ascending: false }).limit(20)
        setResults(data || [])
      } else {
        const SEARCH_EVENT_SELECT = 'id, title, start_date, end_date, start_time, end_time, venue, city, state, banner_url, ticket_price, ticket_type, category, type, status, is_universal, has_seating, created_at, college_id'
        let q = supabase.from('events').select(SEARCH_EVENT_SELECT).in('status', ['approved', 'live'])

        if (searchContext === 'explore') {
          if (user?.college_id) {
            q = q.eq('college_id', user.college_id)
          } else {
            q = q.eq('id', '00000000-0000-0000-0000-000000000000') // Block if no college
          }
        } else if (searchContext === 'community') {
          q = q.eq('is_universal', true)
        } else {
          if (user?.college_id) {
            q = q.or(`college_id.eq.${user.college_id},is_universal.eq.true`)
          } else {
            q = q.eq('is_universal', true)
          }
        }

        if (query) {
          q = q.ilike('title', `%${query}%`)
        }
        if (selectedCategories.length > 0) {
          q = q.in('category', selectedCategories)
        }
        if (isFreeOnly) {
          q = q.eq('ticket_price', 0).eq('ticket_type', 'free')
        }
        if (isPaidOnly) {
          q = q.gt('ticket_price', 0)
        }
        if (isSeatedOnly) {
          q = q.eq('has_seating', true)
        }

        const { data } = await q.order('created_at', { ascending: false }).limit(20)
        setResults((data || []).filter((e: any) => isEventActive(e)))
      }
    } catch (e) {
      console.error('Error searching', e)
    } finally {
      setLoading(false)
    }
  }, [query, searchType, searchContext, user, selectedCategories, selectedRoles, isFreeOnly, isPaidOnly, isSeatedOnly])

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      handleSearch()
    }, 300)
    return () => clearTimeout(delayDebounce)
  }, [query, handleSearch, selectedCategories, selectedRoles, isFreeOnly, isPaidOnly, isSeatedOnly])

  const isFilterActive = isFreeOnly || isPaidOnly || isSeatedOnly || selectedCategories.length > 0 || selectedRoles.length > 0
  const isSearching = query.length > 0 || isFilterActive

  const filteredData = useMemo(() => {
    let baseData = isSearching ? results : trending
    if (searchType === 'teams' && selectedRoles.length > 0) {
      baseData = baseData.filter((t: any) => t.roles?.some((r: string) => selectedRoles.includes(r)))
    } else if ((searchType === 'events' || searchType === 'competitions') && selectedCategories.length > 0) {
      baseData = baseData.filter((e: any) => selectedCategories.includes(e.category) || (e.category && selectedCategories.some(c => e.category.toLowerCase().includes(c.toLowerCase()))))
    }
    return loading && !isFilterActive ? [] : baseData
  }, [isSearching, results, trending, searchType, selectedRoles, selectedCategories, loading, isFilterActive])

  const handleRecentPress = (item: any) => {
    setQuery(item.title)
    if (item.type === 'team') setSearchType('teams')
    else if (item.type === 'competition') setSearchType('competitions')
    else setSearchType('events')
  }

  const handleItemPress = (item: any) => {
    addRecentSearch({
      id: item.id,
      title: item.title || item.team_name,
      type: searchType === 'teams' ? 'team' : searchType === 'competitions' ? 'competition' : 'event'
    })
    
    if (searchType === 'teams') {
      setSelectedTeam(item)
    } else if (searchType === 'competitions') {
      setSearchVisible(false)
      window.location.href = `/competition/${item.id}`
    } else {
      setSearchVisible(false)
      window.location.href = `/event/${item.id}`
    }
  }

  if (!isSearchVisible) return null

  return (
    <>
      <div className="search-modal-container">
        <div className="search-modal-header">
          <div className="search-input-container">
            <button className="search-back-btn" onClick={() => setSearchVisible(false)}>
              <ArrowLeft size={24} color="#a1a1aa" />
            </button>
            <input
              ref={inputRef}
              type="text"
              className="search-input"
              placeholder="Search events, workshops..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query.length > 0 && (
              <button 
                onClick={() => setQuery('')} 
                className="search-clear-btn"
              >
                <X size={16} color="#fff" />
              </button>
            )}
          </div>
        </div>

        <div className="search-scroll-area">
          <div className="search-tabs">
            <button 
              className={`search-tab-pill ${searchType === 'competitions' ? 'active' : ''}`}
              onClick={() => { setSearchType('competitions'); setQuery(''); setSelectedCategories([]); if (trendingCompetitions.length === 0) fetchTrending('competitions'); }}
            >
              Competitions
            </button>
            <button 
              className={`search-tab-pill ${searchType === 'events' ? 'active' : ''}`}
              onClick={() => { setSearchType('events'); setQuery(''); setSelectedCategories([]); if (trendingEvents.length === 0) fetchTrending('events'); }}
            >
              Events
            </button>
            <button 
              className={`search-tab-pill ${searchType === 'teams' ? 'active' : ''}`}
              onClick={() => { setSearchType('teams'); setQuery(''); setSelectedRoles([]); if (trendingTeams.length === 0) fetchTrending('teams'); }}
            >
              Teams
            </button>
          </div>

          {!isSearching && recentSearches.filter((r: any) => r.type !== 'project' && (searchType === 'teams' ? r.type === 'team' : searchType === 'competitions' ? r.type === 'competition' : (r.type === 'event' || r.type !== 'team' && r.type !== 'competition'))).length > 0 && (
            <div className="search-section" style={{ marginBottom: '10px' }}>
              <div className="search-section-title">Recent Searches</div>
              <div className="recent-searches">
                {recentSearches.filter((r: any) => r.type !== 'project' && (searchType === 'teams' ? r.type === 'team' : searchType === 'competitions' ? r.type === 'competition' : (r.type === 'event' || r.type !== 'team' && r.type !== 'competition'))).map((item) => (
                  <div key={item.id} className="recent-search-pill">
                    <span 
                      className="recent-search-text" 
                      onClick={() => handleRecentPress(item)}
                      style={{ cursor: 'pointer' }}
                    >
                      {item.title}
                    </span>
                    <button 
                      onClick={() => removeRecentSearch(item.id)}
                      style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="category-scroll-container">
            {searchType === 'teams' ? TEAM_ROLES.filter(r => r !== 'All').map((role) => {
              const isSelected = selectedRoles.includes(role)
              return (
                <div 
                  key={role} 
                  className={`category-box ${isSelected ? 'active' : ''}`}
                  onClick={() => setSelectedRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role])}
                >
                  <RoleIcon role={role} size={24} />
                  <span className="category-text" style={{ marginTop: '4px' }}>{role}</span>
                </div>
              )
            }) : searchType === 'competitions' ? COMPETITION_CATEGORIES.map((cat) => {
              const isSelected = selectedCategories.includes(cat.id)
              const Icon = cat.icon
              return (
                <div 
                  key={cat.id} 
                  className={`category-box ${isSelected ? 'active' : ''}`}
                  onClick={() => setSelectedCategories(prev => prev.includes(cat.id) ? prev.filter(c => c !== cat.id) : [...prev, cat.id])}
                >
                  <Icon color={isSelected ? '#fff' : '#a1a1aa'} size={24} />
                  <span className="category-text">{cat.name}</span>
                </div>
              )
            }) : CATEGORIES.map((cat) => {
              const isSelected = selectedCategories.includes(cat.id)
              const Icon = cat.icon
              return (
                <div 
                  key={cat.id} 
                  className={`category-box ${isSelected ? 'active' : ''}`}
                  onClick={() => setSelectedCategories(prev => prev.includes(cat.id) ? prev.filter(c => c !== cat.id) : [...prev, cat.id])}
                >
                  <Icon color={isSelected ? '#fff' : '#a1a1aa'} size={24} />
                  <span className="category-text">{cat.name}</span>
                </div>
              )
            })}
          </div>

          <div className="search-section-title" style={{ marginTop: '4px' }}>
            {isSearching ? 'Search Results' : (searchType === 'teams' ? 'Open Teams' : searchType === 'competitions' ? 'Trending Competitions' : 'Trending Events')}
          </div>

          <div className="search-list">
            {loading && !isFilterActive ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                <Loader2 size={24} color="#a78bfa" className="spin" style={{ animation: 'spin 1s linear infinite' }} />
              </div>
            ) : filteredData.length > 0 ? (
              filteredData.map((item: any) => (
                <div key={item.id} onClick={() => handleItemPress(item)} style={{ cursor: 'pointer', marginBottom: '12px' }}>
                  {searchType === 'teams' ? (
                    <TeamCard team={item} index={0} onApply={() => handleItemPress(item)} />
                  ) : searchType === 'competitions' ? (
                    <CompetitionCard item={item} />
                  ) : (
                    <EventCard event={item} index={0} />
                  )}
                </div>
              ))
            ) : (
              <div className="search-no-results">
                {searchType === 'teams' ? 'No teams found' : searchType === 'competitions' ? 'No competitions found' : 'No events found'}
                <div style={{ color: '#a1a1aa', fontSize: '13px', marginTop: '6px' }}>Try adjusting your filters or search terms</div>
              </div>
            )}
          </div>
        </div>

        {/* Floating Action Button for Filters */}
        {!isFilterSheetOpen && searchType !== 'teams' && (
          <div className="filter-peek-bar" onClick={() => setIsFilterSheetOpen(true)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <SlidersHorizontal color="#fff" size={20} />
              <span style={{ color: '#fff', fontSize: '16px', fontWeight: 700 }}>Filters</span>
              {isFilterActive && (
                <div className="peek-bar-badge">ACTIVE</div>
              )}
            </div>
            <ChevronUp color="#a1a1aa" size={20} />
          </div>
        )}
      </div>

      {isFilterSheetOpen && (
        <div className="filter-sheet-overlay">
          <div style={{ position: 'absolute', inset: 0 }} onClick={() => setIsFilterSheetOpen(false)} />
          <div className="filter-sheet-content">
            <div className="filter-sheet-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <SlidersHorizontal color="#fff" size={20} />
                <span style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>Filters</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button 
                  onClick={() => { resetFilters(); setSelectedCategories([]); setSelectedRoles([]); }}
                  style={{ background: 'transparent', border: 'none', color: '#a1a1aa', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Clear All
                </button>
                <button 
                  onClick={() => setIsFilterSheetOpen(false)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', padding: '4px' }}
                >
                  <ChevronDown color="#fff" size={24} />
                </button>
              </div>
            </div>

            <div className="filter-label">{searchType === 'competitions' ? 'Fee Type' : 'Event Type'}</div>
            <div className="filter-row">
              <div className={`filter-pill ${isFreeOnly ? 'active' : ''}`} onClick={toggleFreeOnly}>
                <span className="filter-pill-text">Free</span>
              </div>
              <div className={`filter-pill ${isPaidOnly ? 'active' : ''}`} onClick={togglePaidOnly}>
                <span className="filter-pill-text">Paid</span>
              </div>
              {searchType !== 'competitions' && (
                <div className={`filter-pill ${isSeatedOnly ? 'active' : ''}`} onClick={toggleSeatedOnly}>
                  <span className="filter-pill-text">Seated</span>
                </div>
              )}
            </div>
            
            {/* We could add Location dropdowns here if needed, omitted for exact feature parity minus native UI bugs */}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {selectedTeam && (
        <TeamDetailModal
          team={selectedTeam}
          open={true}
          onClose={() => setSelectedTeam(null)}
        />
      )}
    </>
  )
}
