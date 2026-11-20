import { useState, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Search, Calendar, MapPin, Tag, Filter, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCommunityEvents, useCollegeEvents } from '@/hooks/useEvents'
import { useAuthStore } from '@/stores/authStore'
import { isEventActive, formatDate, formatTime, formatPrice } from '@/lib/utils'
import { Footer } from '@/components/layout/Footer'
import type { Event } from '@/types'
import './Events.css'

const CATEGORIES = [
  { key: 'all', label: 'All Events', icon: '🎯' },
  { key: 'cultural', label: 'Cultural', icon: '🎭' },
  { key: 'technical', label: 'Technical', icon: '💻' },
  { key: 'workshop', label: 'Workshop', icon: '🔧' },
  { key: 'sports', label: 'Sports', icon: '⚽' },
  { key: 'hackathon', label: 'Hackathon', icon: '🚀' },
  { key: 'seminar', label: 'Seminar', icon: '📚' },
  { key: 'music', label: 'Music', icon: '🎵' },
  { key: 'other', label: 'Other', icon: '✨' },
]

function EventCard({ event }: { event: Event }) {
  const navigate = useNavigate()

  return (
    <motion.div
      className="curated-card"
      onClick={() => navigate(`/event/${event.id}`)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ y: -8 }}
      layout
    >
      <div className="curated-image-wrap">
        {event.banner_url ? (
          <img src={event.banner_url} alt={event.title} loading="lazy" />
        ) : (
          <div className="curated-image-placeholder">
            <Calendar size={32} />
          </div>
        )}
        {event.ticket_price === 0 && <span className="badge badge-success free-badge">Free</span>}
      </div>

      <div className="curated-content">
        <h3>{event.title}</h3>
        {event.description && (
          <p className="curated-description">{event.description}</p>
        )}

        <div className="featured-meta">
          <div className="meta-item">
            <Calendar size={14} className="meta-icon" />
            <span>{formatDate(event.start_date)}</span>
          </div>
          {event.start_time && (
            <div className="meta-item">
              <Clock size={14} className="meta-icon" />
              <span>{formatTime(event.start_time)}</span>
            </div>
          )}
          {(event.venue || event.city) && (
            <div className="meta-item">
              <MapPin size={14} className="meta-icon" />
              <span>{[event.venue, event.city].filter(Boolean).join(', ')}</span>
            </div>
          )}
        </div>

        <div className="featured-footer">
          <span className="featured-price">{formatPrice(event.ticket_price ?? 0)}</span>
          {event.category && (
            <span className="badge badge-primary">
              <Tag size={10} /> {event.category}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default function EventsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const user = useAuthStore((s) => s.user)

  const activeCategory = searchParams.get('category') || 'all'

  const { data: communityEvents = [], isLoading: loadingCommunity } = useCommunityEvents()
  const { data: collegeEvents = [], isLoading: loadingCollege } = useCollegeEvents(user?.college)

  // Merge and deduplicate events
  const allEvents = useMemo(() => {
    const map = new Map<string, Event>()
    ;[...communityEvents, ...collegeEvents].forEach((e) => map.set(e.id, e))
    return Array.from(map.values())
  }, [communityEvents, collegeEvents])

  // Filter events
  const filteredEvents = useMemo(() => {
    let events = allEvents.filter((e) =>
      isEventActive({ date: e.start_date, endDate: e.end_date, time: e.start_time, endTime: e.end_time })
    )

    if (activeCategory !== 'all') {
      events = events.filter((e) =>
        (e.category || '').toLowerCase() === activeCategory.toLowerCase()
      )
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      events = events.filter((e) =>
        e.title.toLowerCase().includes(q) ||
        (e.description || '').toLowerCase().includes(q) ||
        (e.venue || '').toLowerCase().includes(q) ||
        (e.city || '').toLowerCase().includes(q)
      )
    }

    return events.sort((a, b) =>
      new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    )
  }, [allEvents, activeCategory, searchQuery])

  const isLoading = loadingCommunity || loadingCollege

  const handleCategoryChange = (key: string) => {
    if (key === 'all') {
      searchParams.delete('category')
    } else {
      searchParams.set('category', key)
    }
    setSearchParams(searchParams)
  }

  return (
    <>
      <Helmet>
        <title>Events | PLUTO</title>
        <meta name="description" content="Browse campus events by category" />
      </Helmet>

      <div className="events-page">
        <div className="container">
          {/* Header */}
          <div className="events-page-header">
            <h1>Browse Events</h1>
            <p>Discover events across categories from your campus and beyond</p>
          </div>

          {/* Search */}
          <div className="events-search-wrap">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search events by name, venue, or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="search-clear" onClick={() => setSearchQuery('')}>✕</button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="events-category-tabs">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                className={`category-tab ${activeCategory === cat.key ? 'active' : ''}`}
                onClick={() => handleCategoryChange(cat.key)}
              >
                <span className="cat-icon">{cat.icon}</span>
                <span className="cat-label">{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Results */}
          <div className="events-results-header">
            <Filter size={16} />
            <span>
              {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
              {activeCategory !== 'all' && ` in ${CATEGORIES.find(c => c.key === activeCategory)?.label}`}
            </span>
          </div>

          {isLoading ? (
            <div className="events-loading">
              <div className="spinner" />
              <p>Loading events...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <h3>No events found</h3>
              <p>Try a different category or search term</p>
            </div>
          ) : (
            <motion.div className="curated-grid" layout>
              <AnimatePresence mode="popLayout">
                {filteredEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      <Footer />
    </>
  )
}
