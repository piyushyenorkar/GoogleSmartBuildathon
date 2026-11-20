import React from 'react'
import './Skeletons.css'

export function EventCardSkeleton() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-card-banner skeleton-shimmer"></div>
      <div className="skeleton-card-body">
        <div className="skeleton-card-title skeleton-shimmer"></div>
        <div className="skeleton-card-desc skeleton-shimmer"></div>
        <div className="skeleton-card-meta">
          <div className="skeleton-meta-line skeleton-shimmer" style={{ width: '70%' }}></div>
          <div className="skeleton-meta-line skeleton-shimmer" style={{ width: '55%' }}></div>
          <div className="skeleton-meta-line skeleton-shimmer" style={{ width: '60%' }}></div>
        </div>
        <div className="skeleton-card-footer">
          <div className="skeleton-price skeleton-shimmer"></div>
          <div className="skeleton-badge skeleton-shimmer"></div>
        </div>
      </div>
    </div>
  )
}

export function EventSkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <EventCardSkeleton key={index} />
      ))}
    </>
  )
}

export function AnnouncementCardSkeleton() {
  return (
    <div className="skeleton-announcement-card">
      <div className="skeleton-ann-poster skeleton-shimmer"></div>
      <div className="skeleton-ann-body">
        <div className="skeleton-shimmer skeleton-line tiny"></div>
        <div className="skeleton-shimmer skeleton-line medium"></div>
        <div className="skeleton-shimmer skeleton-line short"></div>
      </div>
    </div>
  )
}

export function AnnouncementSkeletonScroll({ count = 3 }: { count?: number }) {
  return (
    <div className="skeleton-announcement-scroll">
      {Array.from({ length: count }).map((_, index) => (
        <AnnouncementCardSkeleton key={index} />
      ))}
    </div>
  )
}

export function TeamCardSkeleton() {
  return (
    <div className="skeleton-card" style={{ flexShrink: 0, width: 'calc((100% - 3rem) / 4)', minWidth: 'calc((100% - 3rem) / 4)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', minHeight: '160px', borderRadius: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="skeleton-shimmer" style={{ width: '50%', height: '20px', borderRadius: '4px' }}></div>
        <div className="skeleton-shimmer" style={{ width: '50px', height: '20px', borderRadius: '12px' }}></div>
      </div>
      
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.2rem' }}>
        <div className="skeleton-shimmer" style={{ width: '70%', height: '14px', borderRadius: '4px' }}></div>
      </div>
      
      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }}>
        <div className="skeleton-shimmer" style={{ width: '70px', height: '22px', borderRadius: '12px' }}></div>
        <div className="skeleton-shimmer" style={{ width: '90px', height: '22px', borderRadius: '12px' }}></div>
      </div>
      
      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.4rem' }}>
        <div className="skeleton-shimmer" style={{ width: '40px', height: '14px', borderRadius: '4px' }}></div>
        <div className="skeleton-shimmer" style={{ width: '80px', height: '14px', borderRadius: '4px' }}></div>
      </div>
      
      <div style={{ marginTop: 'auto', paddingTop: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div className="skeleton-shimmer" style={{ width: '24px', height: '24px', borderRadius: '50%' }}></div>
          <div className="skeleton-shimmer" style={{ width: '80px', height: '14px', borderRadius: '4px' }}></div>
        </div>
        <div className="skeleton-shimmer" style={{ width: '60px', height: '22px', borderRadius: '12px' }}></div>
      </div>
    </div>
  )
}

export function MobileExploreSkeleton() {
  return (
    <div className="mobile-explore-skeleton hide-desktop" style={{ width: '100%', overflow: 'hidden', paddingBottom: '120px' }}>
      
      {/* Top Announcement Block */}
      <div className="skeleton-shimmer" style={{ width: '100%', height: '280px', position: 'relative', marginBottom: '20px', borderRadius: '0' }}>
        <div style={{ position: 'absolute', top: '16px', left: '16px', width: '140px', height: '26px', borderRadius: '20px', background: 'rgba(255,255,255,0.05)' }}></div>
        <div style={{ position: 'absolute', bottom: '18px', left: '16px', right: '16px' }}>
          <div style={{ width: '60px', height: '18px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', marginBottom: '8px' }}></div>
          <div style={{ width: '80%', height: '26px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', marginBottom: '8px' }}></div>
          <div style={{ width: '95%', height: '14px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', marginBottom: '6px' }}></div>
          <div style={{ width: '60%', height: '14px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', marginBottom: '12px' }}></div>
          <div style={{ display: 'flex', gap: '14px' }}>
            <div style={{ width: '100px', height: '14px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }}></div>
            <div style={{ width: '80px', height: '14px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }}></div>
          </div>
        </div>
      </div>

      {/* Events Skeleton */}
      <section className="explore-section" style={{ marginBottom: '24px' }}>
        <h2 className="explore-section-title">Upcoming Events</h2>
        <div className="role-filter-scroll" style={{ marginBottom: '16px' }}>
          {[1,2,3,4].map(i => (
            <div key={i} className="skeleton-shimmer" style={{ width: '80px', height: '32px', borderRadius: '22px', flexShrink: 0 }}></div>
          ))}
        </div>
        <div className="horizontal-scroll">
          {[1,2,3].map(i => (
            <div key={i} style={{ width: '85%', minWidth: '85%', flexShrink: 0 }}>
              <EventCardSkeleton />
            </div>
          ))}
        </div>
      </section>

      {/* Teams Skeleton */}
      <section className="explore-section">
        <h2 className="explore-section-title">Teams Looking for Members</h2>
        <div className="role-filter-scroll" style={{ marginBottom: '16px' }}>
          {[1,2,3,4].map(i => (
            <div key={i} className="skeleton-shimmer" style={{ width: '90px', height: '32px', borderRadius: '22px', flexShrink: 0 }}></div>
          ))}
        </div>
        <div className="horizontal-scroll">
          {[1,2,3].map(i => (
            <div key={i} style={{ width: '85%', minWidth: '85%', flexShrink: 0 }}>
              <TeamCardSkeleton />
            </div>
          ))}
        </div>
      </section>
      
    </div>
  )
}
