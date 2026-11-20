import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Image as ImageIcon, Calendar, Clock, MapPin, Users, ChevronRight } from 'lucide-react'
import type { Event } from '@/types'
import { formatEventDate, formatTime, formatPrice, truncate, formatTargetAudience } from '@/lib/utils'
import { getCdnUrl } from '@/utils/cdn'
import { CursorGlow } from '@/components/ui/CursorGlow'
import './EventCard.css'

interface EventCardProps {
  event: Event
  ticketsSold?: number
  index?: number
  showCityState?: boolean
}

/**
 * Glass-morphism event card — exact port of curated-card from explore.html
 */
export function EventCard({ event, ticketsSold = 0, index = 0, showCityState = false }: EventCardProps) {
  const cardRef = useRef<HTMLAnchorElement>(null)
  const price = event.price ?? event.ticket_price ?? 0
  const isFree = price === 0
  const limit = event.max_tickets ?? event.ticket_limit ?? 0
  const available = limit > 0 ? limit - ticketsSold : null
  const isSeated = event.has_seating

  // Footer content — dynamically handle price, availability, and seated layout text
  const renderFooter = () => {
    const basePriceDisplay = isFree ? 'Free' : formatPrice(price)
    
    let availabilityBadge = null
    if (available !== null) {
      if (available > 0) {
        availabilityBadge = <span className="badge badge-success">{available} left</span>
      } else {
        availabilityBadge = <span className="badge badge-warning">Sold Out</span>
      }
    }

    return (
      <div className="event-card-footer">
        <span className="event-card-price">{basePriceDisplay}</span>
        {availabilityBadge}
      </div>
    )
  }

  const dateStr = event.start_date
    ? `${new Date(event.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}${event.end_date ? ` - ${new Date(event.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : ''}`
    : '';

  const timeStr = (event.time || event.start_time)
    ? `${formatTime(event.time || event.start_time || '')}${event.end_time ? ` - ${formatTime(event.end_time)}` : ''}`
    : '';

  const city = event.city || (event as any).college_ref?.city;
  const state = event.state || (event as any).college_ref?.state;
  const locationStr = showCityState 
    ? [event.venue, city, state].filter(Boolean).join(', ')
    : event.venue || '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <Link ref={cardRef} to={`/event/${event.id}`} className="event-card-container glow-card-container" id={`event-card-${event.id}`}>
        
        {/* DESKTOP VIEW */}
        <div className="event-card desktop-card">
          {/* Banner Image — 140px, matching legacy */}
          <div className="event-card-image-wrapper">
            {event.banner_url ? (
              <img
                src={getCdnUrl(event.banner_url)}
                alt={event.title}
                className="event-card-image"
                loading="lazy"
              />
            ) : (
              <div className="event-card-placeholder">
                <ImageIcon size={32} style={{ color: 'var(--gray)', opacity: 0.8 }} />
              </div>
            )}
            {/* Live badge */}
            {event.status === 'live' && (
              <div className="event-live-badge">
                <div className="live-dot" />
                LIVE
              </div>
            )}

            {/* Target Audience Badge */}
            {(() => {
              const audience = formatTargetAudience(event)
              if (!audience) return null
              return (
                <div style={{
                  position: 'absolute', bottom: 10, right: 10,
                  display: 'flex', alignItems: 'center', gap: '4px',
                  background: 'rgba(0, 0, 0, 0.6)', color: '#fff',
                  padding: '4px 10px', borderRadius: '20px',
                  fontSize: '0.65rem', fontWeight: 600,
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <Users size={12} />
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>{audience}</span>
                </div>
              )
            })()}
          </div>

          {/* Content — compact padding matching legacy */}
          <div className="event-card-body">
            <h3 className="event-card-title">{truncate(event.title, 45)}</h3>

            {/* Description — 2-line clamp, matching legacy curated-description */}
            {event.description && (
              <p className="event-card-description">{event.description}</p>
            )}

            <div className="event-card-meta" style={{ gap: '0.5rem' }}>
              <div className="event-card-meta-item">
                <div style={{ background: 'rgba(255, 255, 255, 0.1)', borderRadius: '6px', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={14} color="#38bdf8" />
                </div>
                <span>{formatEventDate(event.start_date, event.end_date)}</span>
              </div>
              {(event.time || event.start_time) && (
                <div className="event-card-meta-item">
                  <div style={{ background: 'rgba(255, 255, 255, 0.1)', borderRadius: '6px', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Clock size={14} color="#38bdf8" />
                  </div>
                  <span>
                    {formatTime(event.time || event.start_time || '')}
                    {event.end_time ? ` - ${formatTime(event.end_time)}` : ''}
                  </span>
                </div>
              )}
              {(() => {
                const city = event.city || (event as any).college_ref?.city
                const state = event.state || (event as any).college_ref?.state
                const hasLocation = event.venue || (showCityState && (city || state))
                
                if (!hasLocation) return null

                return (
                  <div className="event-card-meta-item" style={{ overflow: 'hidden' }}>
                    <div style={{ background: 'rgba(255, 255, 255, 0.1)', borderRadius: '6px', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <MapPin size={14} color="#38bdf8" />
                    </div>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                      {showCityState 
                        ? [event.venue, city, state].filter(Boolean).join(', ')
                        : event.venue || ''}
                    </span>
                  </div>
                )
              })()}
            </div>

            {/* Footer — border-top separator + 3-mode layout */}
            <div className="event-card-footer-wrapper">
              {renderFooter()}
            </div>
          </div>
        </div>

        {/* MOBILE VIEW (React Native Port) */}
        <div className="event-card-mobile mobile-card">
          {event.banner_url ? (
            <img src={event.banner_url} className="ecm-image" alt="" loading="lazy" />
          ) : (
            <div className="ecm-placeholder"><Calendar color="rgba(255,255,255,0.3)" size={32} /></div>
          )}
          
          <div className="ecm-overlay"></div>
          
          <div className="ecm-content">
            <div className="ecm-info-left">
              <h3 className="ecm-title">{event.title}</h3>
              {dateStr && (
                <div className="ecm-meta-row">
                  <Calendar color="#a1a1aa" size={10} />
                  <span>{dateStr}</span>
                </div>
              )}
              {timeStr && (
                <div className="ecm-meta-row">
                  <Clock color="#a1a1aa" size={10} />
                  <span>{timeStr}</span>
                </div>
              )}
              {locationStr && (
                <div className="ecm-meta-row">
                  <MapPin color="#a1a1aa" size={10} />
                  <span className="ecm-meta-text-truncate">{locationStr}</span>
                </div>
              )}
            </div>
            
            <div className="ecm-info-right">
              <div className="ecm-price-badge">
                <span>{isFree ? 'Free' : formatPrice(price)}</span>
              </div>
              <div className="ecm-action-btn">
                <span>View</span>
                <ChevronRight color="#818cf8" size={12} style={{marginLeft: 2}} />
              </div>
            </div>
          </div>

          {event.status === 'live' && (
            <div className="ecm-live-badge">
              <div className="ecm-live-dot" />
              <span>LIVE</span>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  )
}
