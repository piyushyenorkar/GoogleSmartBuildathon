/**
 * CompetitionDetails.tsx — Competition details page (Web)
 * Ported from EventDetailsScreen.tsx competition mode
 */

import { useState, useMemo, useRef, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  CalendarDays, Clock, MapPin, Users, Trophy, Code, Terminal, FileText, Lightbulb,
  Globe, ChevronDown, ChevronUp, Shield, Award, Mail, MessageCircle, Phone, Medal,
  CheckCircle2, ArrowRight, ArrowLeft, Share2, Loader2, Wifi, ExternalLink, MousePointerClick,
  User as UserIcon, Hash, Info, X, UserPlus, Maximize, Inbox
} from 'lucide-react'
import { useCompetition } from '@/hooks/useCompetitions'
import { Trophy as TrophyIcon, Calendar, CheckCircle, ChevronRight, IndianRupee, Flag, Users2 } from 'lucide-react'
import { formatTime, formatPrice, formatYearLabel } from '@/lib/utils'
import { useCompRegistration, useRegistrationCount } from '@/hooks/useCompetitionRegistrations'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { getCdnUrl } from '@/utils/cdn'
import { SubmissionModal } from '@/components/competition/SubmissionModal'
import './CompetitionDetails.css'

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  hackathon: { label: 'Hackathon', color: '#a78bfa', bg: 'rgba(139,92,246,0.15)', icon: Code },
  coding_competition: { label: 'Coding', color: '#60a5fa', bg: 'rgba(96,165,250,0.15)', icon: Terminal },
  case_study: { label: 'Case Study', color: '#34d399', bg: 'rgba(52,211,153,0.15)', icon: FileText },
  ideathon: { label: 'Ideathon', color: '#fbbf24', bg: 'rgba(251,191,36,0.15)', icon: Lightbulb },
}

export default function CompetitionDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { data: comp, isLoading } = useCompetition(id)
  const { data: myReg, isLoading: isRegLoading } = useCompRegistration(id)
  const { data: regCount } = useRegistrationCount(id)
  const { openAuthModal } = useUIStore()

  const handleRegisterClick = (url: string) => {
    if (!user) {
      openAuthModal('login')
    } else {
      navigate(url)
    }
  }

  const isAdminUser = !!user?.admin_type || user?.roles?.includes('admin') || user?.email?.endsWith('@admin.com')
  const isPureOrganizer = user?.roles?.includes('organizer') && !user?.roles?.includes('user') && !user?.roles?.includes('student') && !user?.roles?.includes('admin') && !user?.roles?.includes('staff')
  const isStaff = user?.roles?.includes('staff')

  const [activeTab, setActiveTab] = useState(0)
  const [rulesExpanded, setRulesExpanded] = useState(false)
  const [submissionModal, setSubmissionModal] = useState<{ open: boolean; stageIndex: number; existing?: Record<string, string> }>({ open: false, stageIndex: 0 })
  const [showRegModal, setShowRegModal] = useState(false)
  const [isPosterModalOpen, setIsPosterModalOpen] = useState(false)

  const sectionRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-index'))
            setActiveTab(index)
          }
        })
      },
      { rootMargin: '-120px 0px -60% 0px' }
    )

    sectionRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref)
    })

    return () => observer.disconnect()
  }, [])

  const scrollToSection = (index: number) => {
    setActiveTab(index)
    const element = sectionRefs.current[index]
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 160 // offset for sticky tabs
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }

  const cat = CATEGORY_CONFIG[comp?.category || 'hackathon'] || CATEGORY_CONFIG.hackathon
  const CatIcon = cat.icon

  const prizePool = useMemo(() => (comp?.prizes || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0), [comp?.prizes])

  const isDeadlinePassed = comp?.registration_deadline ? new Date() > new Date(comp.registration_deadline) : false
  const canRegister = !myReg && !isDeadlinePassed && (comp?.status === 'approved' || comp?.status === 'live')
  const regStatus = myReg?.registration_type === 'team' ? (myReg.team?.status || myReg.status || 'draft') : (myReg?.status || 'draft')
  const isRegCompleted = ['registered', 'approved', 'complete', 'confirmed'].includes(regStatus)

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: comp?.title, url: window.location.href })
    } else {
      navigator.clipboard.writeText(window.location.href)
    }
  }

  // Calculate days left
  const daysLeft = useMemo(() => {
    if (!comp?.registration_deadline) return null
    const diff = new Date(comp.registration_deadline).getTime() - new Date().getTime()
    const days = Math.ceil(diff / (1000 * 3600 * 24))
    return days > 0 ? days : 0
  }, [comp?.registration_deadline])

  if (isLoading) {
    return (
      <div className="cd-container" style={{ pointerEvents: 'none', paddingTop: '2rem' }}>
        <div className="cd-banner cd-skeleton" style={{ height: 320, background: 'rgba(255,255,255,0.05)', borderRadius: 20, marginBottom: 24 }} />
        <div className="cd-main-grid">
          <div className="cd-left-col">
            <div className="cd-skeleton" style={{ width: '70%', height: 40, borderRadius: 8, marginBottom: 16 }} />
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div className="cd-skeleton" style={{ width: 120, height: 20, borderRadius: 4 }} />
              <div className="cd-skeleton" style={{ width: 150, height: 20, borderRadius: 4 }} />
            </div>
            <div className="cd-tabs" style={{ display: 'flex', gap: 12, marginTop: 24, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 16 }}>
              {[1, 2, 3, 4, 5].map(i => <div key={i} className="cd-skeleton" style={{ width: 90, height: 32, borderRadius: 16 }} />)}
            </div>
            <div style={{ marginTop: 24 }}>
              <div className="cd-skeleton" style={{ width: '100%', height: 20, borderRadius: 4, marginBottom: 16 }} />
              <div className="cd-skeleton" style={{ width: '90%', height: 20, borderRadius: 4, marginBottom: 16 }} />
              <div className="cd-skeleton" style={{ width: '95%', height: 20, borderRadius: 4, marginBottom: 16 }} />
              <div className="cd-skeleton" style={{ width: '80%', height: 20, borderRadius: 4, marginBottom: 16 }} />
            </div>
          </div>
          <div className="cd-right-col">
            <div className="cd-skeleton" style={{ width: '100%', height: 280, borderRadius: 16 }} />
          </div>
        </div>
      </div>
    )
  }

  if (!comp) {
    return <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,0.5)' }}>Competition not found</div>
  }

  const teamInfo = comp.registration_type === 'individual'
    ? '1'
    : comp.registration_type === 'both'
      ? `${comp.team_size_min || 2}-${comp.team_size_max || 5}`
      : `${comp.team_size_min || 2}-${comp.team_size_max || 5}`

  const tabs = ['Eligibility', 'Stages & Timeline', 'Details', 'Prizes', 'Rules', 'Contact']

  return (
    <>
      <Helmet><title>{comp.title} | PLUTO</title></Helmet>
      <div className="cd-container hide-mobile">
        <div className="cd-layout-grid" style={{ display: 'grid', gridTemplateColumns: '68% 32%', gap: '1.5rem 2rem', alignItems: 'start', paddingBottom: '4rem' }}>
          
          {/* Left Box: Poster + Title */}
          <div className="cd-hero-poster-box" style={{ gridColumn: '1', gridRow: '1', background: '#000', borderRadius: '24px', overflow: 'hidden', position: 'relative', border: '1px solid rgba(255, 255, 255, 0.08)', minHeight: '400px' }}>
            {comp.banner_url ? (
              <>
                <div className="event-banner-blur" style={{ backgroundImage: `url(${getCdnUrl(comp.banner_url)})`, position: 'absolute', inset: '-10%', backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(25px) opacity(0.5)', zIndex: 0 }} />
                <img src={getCdnUrl(comp.banner_url)} alt={comp.title} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0, zIndex: 1 }} />
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: 'rgba(255,255,255,0.05)', position: 'absolute', inset: 0, zIndex: 1 }}>
                <Trophy size={64} color="rgba(255,255,255,0.15)" />
              </div>
            )}
            
            {/* Top Right Poster Actions */}
            <div className="desktop-poster-actions" style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 10, display: 'flex', gap: '0.75rem' }}>
              {comp.banner_url && (
                <button onClick={() => setIsPosterModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '20px', color: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                  <Maximize size={16} /> View
                </button>
              )}
              <button onClick={handleShare} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', padding: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', color: '#fff', cursor: 'pointer' }}>
                <Share2 size={16} />
              </button>
            </div>

            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '3rem 2rem 2rem', display: 'flex', flexDirection: 'column', gap: '1rem', zIndex: 2, background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 60%, transparent 100%)' }}>
              <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 800, color: '#fff', lineHeight: 1.1, textShadow: '0 4px 16px rgba(0,0,0,0.8)' }}>
                {comp.title}
              </h1>
            </div>
          </div>

          {/* Right Column (Sticky) - Unified Card */}
          <div className="cd-right-sticky-card" style={{ 
            gridColumn: '2', 
            gridRow: '1 / span 2', 
            position: 'sticky', 
            top: 'calc(var(--navbar-height, 70px) + var(--safe-top, 0px) + 40px)', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '24px',
            background: '#1e1e1e',
            borderRadius: '24px',
            padding: '24px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            border: 'none',
            height: 'fit-content'
          }}>
            
            {/* Tags Container */}
            <div className="cd-tags-container" style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
              <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                <span className="cd-cat-badge" style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', fontWeight: 'normal', flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', textAlign: 'center', whiteSpace: 'nowrap', borderRadius: '12px', padding: '8px 4px' }}>
                  <CatIcon size={14} /> {cat.label}
                </span>
                <span className="cd-tag" style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', fontWeight: 'normal', flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', textAlign: 'center', whiteSpace: 'nowrap', borderRadius: '12px', padding: '8px 4px' }}>
                  <Users size={14} /> 
                  {comp.registration_type === 'individual' ? 'Individual' : `Team: ${comp.team_size_min}-${comp.team_size_max}`}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                {comp.is_online ? (
                  <span className="cd-tag" style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', fontWeight: 'normal', flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', textAlign: 'center', whiteSpace: 'nowrap', borderRadius: '12px', padding: '8px 4px' }}><Globe size={14} /> Online</span>
                ) : (
                  comp.venue && <span className="cd-tag" style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', fontWeight: 'normal', flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', textAlign: 'center', whiteSpace: 'nowrap', borderRadius: '12px', padding: '8px 4px' }}><MapPin size={14} /> {[comp.venue, comp.city].filter(Boolean).join(', ')}</span>
                )}
              </div>
            </div>


            {/* Stats Row */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '12px 8px' }}>
                <div style={{ background: 'rgba(255,255,255,0.1)', width: '32px', height: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '10px', flexShrink: 0 }}><Users size={16} color="#38bdf8" /></div>
                <span style={{ fontSize: '0.65rem', color: '#a1a1aa', fontWeight: 600, textTransform: 'uppercase' }}>Team Size</span>
                <span style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 700, textAlign: 'center' }}>
                  {comp.registration_type === 'individual' ? '1' : `${comp.team_size_min}-${comp.team_size_max}`}
                </span>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '12px 8px' }}>
                <div style={{ background: 'rgba(255,255,255,0.1)', width: '32px', height: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '10px', flexShrink: 0 }}><Users size={16} color="#38bdf8" /></div>
                <span style={{ fontSize: '0.65rem', color: '#a1a1aa', fontWeight: 600, textTransform: 'uppercase' }}>Registered</span>
                <span style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 700, textAlign: 'center' }}>{regCount || 0}</span>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '12px 8px' }}>
                <div style={{ background: 'rgba(255,255,255,0.1)', width: '32px', height: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '10px', flexShrink: 0 }}><CalendarDays size={16} color="#38bdf8" /></div>
                <span style={{ fontSize: '0.65rem', color: '#a1a1aa', fontWeight: 600, textTransform: 'uppercase' }}>Deadline</span>
                <span style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 700, textAlign: 'center' }}>
                  {comp.registration_deadline ? new Date(comp.registration_deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'N/A'}
                </span>
              </div>
            </div>


            {/* Registration Content */}
            <div className="cd-hero-booking-content" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              
              <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>
                  {comp.entry_fee > 0 ? `₹${comp.entry_fee}` : 'Free'}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem', marginTop: '0.5rem' }}>
                  Entry Fee
                </div>
              </div>

              {/* Status Header */}
              {!myReg && (
                <div style={{ textAlign: 'center' }}>
                  {isDeadlinePassed ? (
                    <div style={{ color: '#ef4444', fontSize: '1rem', fontWeight: 700, marginBottom: '2rem' }}>
                      Registration Closed
                    </div>
                  ) : (
                    <div style={{ color: '#10b981', fontSize: '1rem', fontWeight: 700, marginBottom: '2rem' }}>
                      {daysLeft !== null ? `${daysLeft} Days Left to Register` : 'Registration Open'}
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '2rem' }}>
                {isStaff ? (
                  <button className="cd-action-btn disabled" style={{ borderRadius: '24px' }}>Staff Preview</button>
                ) : isPureOrganizer ? (
                  <button className="cd-action-btn disabled" style={{ borderRadius: '24px' }}>Organizer Preview</button>
                ) : isAdminUser ? (
                  <button className="cd-action-btn disabled" style={{ borderRadius: '24px' }}>Admin Preview</button>
                ) : myReg ? (
                  isRegCompleted ? (
                    <button 
                      onClick={() => navigate(`/competition/${id}/register`)}
                      style={{ 
                        background: 'rgba(52, 211, 153, 0.1)', 
                        border: 'none', 
                        borderRadius: '24px', 
                        padding: '12px', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        width: '100%',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(52, 211, 153, 0.15)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(52, 211, 153, 0.1)'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', fontWeight: 700, fontSize: '1.1rem' }}>
                        <CheckCircle2 size={18} /> Registered
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)', marginTop: '-4px' }}>View Registration Details</div>
                    </button>
                  ) : (
                    <button className="cd-action-btn" onClick={() => handleRegisterClick(`/competition/${id}/register`)} style={{ borderRadius: '24px', background: '#be831e', color: '#fff', fontSize: '1.1rem', border: 'none' }}>
                      <Clock size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Registration Pending
                    </button>
                  )
                ) : canRegister ? (
                  <button className="cd-action-btn primary" onClick={() => {
                    const isIndividualOnly = comp?.registration_type === 'individual' || (comp?.team_size_max ?? 1) <= 1;
                    if (!user) {
                      handleRegisterClick(`/competition/${id}/register${isIndividualOnly ? '?mode=individual' : ''}`);
                    } else if (isIndividualOnly) {
                      navigate(`/competition/${id}/register?mode=individual`);
                    } else {
                      setShowRegModal(true);
                    }
                  }} style={{ borderRadius: '24px', background: '#fff', color: '#000', fontSize: '1.1rem' }}>
                    Register Now
                  </button>
                ) : isDeadlinePassed ? (
                  <button className="cd-action-btn disabled" style={{ borderRadius: '24px' }}>Closed</button>
                ) : null}
              </div>

              {regCount !== undefined && regCount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginTop: 'auto' }}>
                  <Users size={16} />
                  <span><strong>{regCount.toLocaleString()}</strong> already registered</span>
                </div>
              )}
            </div>
          </div>

          {/* CONTENT COLUMN */}
          <div className="cd-left-col" style={{ gridColumn: '1', gridRow: '2', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Scrollable Tabs - Sticky */}
            <div style={{ position: 'sticky', top: '80px', zIndex: 100, display: 'flex', gap: '0.5rem', background: '#1e1e1e', padding: '0.5rem', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.08)', overflowX: 'auto', width: '100%', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
              <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                {tabs.map((tab, i) => (
                  <button 
                    key={tab} 
                    onClick={() => scrollToSection(i)}
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      background: activeTab === i ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                      border: 'none',
                      padding: '0.8rem 1.25rem',
                      color: activeTab === i ? '#fff' : 'rgba(255, 255, 255, 0.6)',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      borderRadius: '20px',
                      transition: 'all 0.3s ease',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="cd-tab-content" style={{ background: '#1e1e1e', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '24px', minHeight: '400px', display: 'flex', flexDirection: 'column', gap: '40px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
              
              {/* Eligibility */}
              <div ref={el => { sectionRefs.current[0] = el; }} data-index={0} style={{ marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', marginLeft: '-24px' }}>
                  <div style={{ width: '6px', height: '20px', backgroundColor: '#8b5cf6', borderTopRightRadius: '4px', borderBottomRightRadius: '4px', marginTop: '2px' }}></div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginLeft: '18px' }}>Eligibility</h3>
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                  {comp.eligibility?.open_to_all ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ background: 'rgba(255,255,255,0.08)', padding: '6px 12px', borderRadius: '16px', color: '#fff', fontSize: '0.9rem' }}>Open to all students</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {comp.eligibility?.year_of_study && comp.eligibility.year_of_study.length > 0 && (
                        <div>
                          <h4 style={{ color: '#a1a1aa', fontSize: '0.9rem', marginBottom: '8px', marginTop: 0 }}>Year of Study</h4>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {comp.eligibility.year_of_study.map(y => (
                              <span key={y} style={{ background: 'rgba(255,255,255,0.08)', padding: '6px 12px', borderRadius: '16px', color: '#fff', fontSize: '0.85rem' }}>{formatYearLabel(y, comp.course)}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {comp.eligibility?.branches && comp.eligibility.branches.length > 0 && (
                        <div>
                          <h4 style={{ color: '#a1a1aa', fontSize: '0.9rem', marginBottom: '8px', marginTop: 0 }}>Branches</h4>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {comp.eligibility.branches.map(b => (
                              <span key={b} style={{ background: 'rgba(255,255,255,0.08)', padding: '6px 12px', borderRadius: '16px', color: '#fff', fontSize: '0.85rem' }}>{b}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {comp.eligibility?.min_cgpa && (
                        <div>
                          <h4 style={{ color: '#a1a1aa', fontSize: '0.9rem', marginBottom: '4px', marginTop: 0 }}>Minimum CGPA</h4>
                          <span style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700 }}>{comp.eligibility.min_cgpa}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Stages & Timeline */}
              <div ref={el => { sectionRefs.current[1] = el; }} data-index={1} style={{ paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', marginLeft: '-24px' }}>
                  <div style={{ width: '6px', height: '20px', backgroundColor: '#8b5cf6', borderTopRightRadius: '4px', borderBottomRightRadius: '4px', marginTop: '2px' }}></div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginLeft: '18px' }}>Stages & Timeline</h3>
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                  {(comp.stages || []).length === 0 ? (
                    <p style={{ color: 'rgba(255,255,255,0.5)' }}>No stages defined yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {comp.stages.map((stage, i) => {
                        const isLast = i === comp.stages.length - 1;
                        const startDate = stage.start_date ? new Date(stage.start_date) : null;
                        const endDate = stage.end_date ? new Date(stage.end_date) : null;
                        return (
                          <div key={i} style={{ display: 'flex', minHeight: '120px' }}>
                            <div style={{ width: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              {startDate ? (
                                <div style={{ background: '#10b981', borderRadius: '15px', width: '36px', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3px 3px 4px', zIndex: 2 }}>
                                  <div style={{ background: '#fff', width: '100%', borderRadius: '13px', textAlign: 'center', color: '#21c890', fontSize: '0.75rem', fontWeight: 800, padding: '2px 0', marginBottom: '2px' }}>
                                    {startDate.getDate()}
                                  </div>
                                  <div style={{ color: '#fff', fontSize: '0.5rem', fontWeight: 700, textTransform: 'uppercase' }}>
                                    {startDate.toLocaleString('default', { month: 'short' })}
                                  </div>
                                </div>
                              ) : (
                                <div style={{ width: '12px', height: '12px', borderRadius: '6px', background: '#52525b', zIndex: 2 }}></div>
                              )}
                              {!isLast && <div style={{ width: '1px', flex: 1, borderLeft: '1px solid #52525b', margin: '4px 0' }}></div>}
                            </div>
                            
                            <div style={{ flex: 1, paddingLeft: '12px', paddingBottom: '24px' }}>
                              <div style={{ fontSize: '0.8rem', color: '#a1a1aa', fontWeight: 600, marginBottom: '6px' }}>
                                {startDate && startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} 
                                {endDate && ` → ${endDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`}
                              </div>
                              
                              <div style={{ background: 'rgba(255, 255, 255, 0.08)', borderRadius: '20px', padding: '14px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '6px' }}>
                                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', margin: 0 }}>{stage.name}</h4>
                                  <div style={{ background: 'rgba(255, 255, 255, 0.15)', borderRadius: '16px', padding: '3px 8px', fontSize: '0.5rem', color: '#a1a1aa', display: 'flex', alignItems: 'center' }}>
                                    <span style={{ marginRight: '4px' }}>On</span>
                                    <Globe size={10} color="#a1a1aa" />
                                  </div>
                                </div>
                                {stage.description && <p style={{ fontSize: '0.85rem', color: '#d4d4d8', lineHeight: 1.5, margin: 0 }}>{stage.description}</p>}
                                
                                {stage.submission_types && stage.submission_types.length > 0 && stage.submission_types[0] !== 'none' && (
                                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                    {stage.submission_types.map(t => <span key={t} style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', color: '#fff', textTransform: 'capitalize' }}>{t}</span>)}
                                  </div>
                                )}
                                
                                {(() => {
                                  const stageSubmissions = myReg?.registration_type === 'team' ? myReg.team?.submissions : myReg?.submissions;
                                  const stageSubmission = stageSubmissions?.[i];
                                  const isSubmitted = !!stageSubmission;
                                  const isAuthorizedToSubmit = myReg && (
                                    myReg.registration_type === 'individual' ||
                                    (myReg.registration_type === 'team' && myReg.team_role === 'leader')
                                  );
                                  const hasSubmissionTypes = stage.submission_types && stage.submission_types.length > 0 && stage.submission_types[0] !== 'none';
                                  const canShowSubmitButton = hasSubmissionTypes && myReg && (isAuthorizedToSubmit || isSubmitted);
                                  
                                  if (!canShowSubmitButton) return null;
                                  
                                  return (
                                    <div style={{ marginTop: '16px' }}>
                                      {isSubmitted ? (
                                        <button style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399', fontSize: '0.85rem', fontWeight: 700, padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }} onClick={() => setSubmissionModal({ open: true, stageIndex: i, existing: stageSubmission })}>
                                          <CheckCircle2 size={16} /> {stageSubmission?.submitted_at ? `Submitted ${new Date(stageSubmission.submitted_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}` : 'Submitted (View)'}
                                        </button>
                                      ) : (
                                        <button style={{ background: '#8b5cf6', color: '#fff', fontSize: '0.85rem', fontWeight: 700, padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', alignSelf: 'flex-start' }} onClick={() => setSubmissionModal({ open: true, stageIndex: i })}>
                                          Submit Deliverable
                                        </button>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Details */}
              <div ref={el => { sectionRefs.current[2] = el; }} data-index={2} className="cml-about-sec" style={{ paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '24px', marginLeft: '-24px' }}>
                  <div style={{ width: '6px', height: '20px', backgroundColor: '#8b5cf6', borderTopRightRadius: '4px', borderBottomRightRadius: '4px', marginTop: '2px' }}></div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#fff', marginLeft: '18px', lineHeight: 1.4, flex: 1 }}>{comp.description || 'About'}</h3>
                </div>
                
                {(comp.about_sections || []).map((section, i) => (
                  <div key={i} style={{ marginBottom: '24px' }}>
                    {section.subtitle && (
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', fontWeight: 700, color: '#fff' }}>{section.subtitle}</h4>
                    )}
                    {section.description && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {section.description.split('\n').filter(l => l.trim()).map((line, j) => (
                          <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                            <div style={{ width: '4px', height: '4px', borderRadius: '2px', backgroundColor: '#8b5cf6', marginTop: '9px', flexShrink: 0 }}></div>
                            <span style={{ fontSize: '0.9rem', color: '#d4d4d8', lineHeight: 1.6 }}>{line.trim()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {comp.themes && comp.themes.length > 0 && (
                  <div style={{ marginTop: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px', marginLeft: '-24px' }}>
                      <div style={{ width: '6px', height: '20px', backgroundColor: '#8b5cf6', borderTopRightRadius: '4px', borderBottomRightRadius: '4px', marginTop: '2px' }}></div>
                      <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#fff', marginLeft: '18px' }}>Themes</h3>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {comp.themes.map(t => <span key={t} style={{ background: 'rgba(255,255,255,0.08)', padding: '6px 12px', borderRadius: '16px', color: '#fff', fontSize: '0.85rem' }}>{t}</span>)}
                    </div>
                  </div>
                )}
              </div>

              {/* Prizes */}
              <div ref={el => { sectionRefs.current[3] = el; }} data-index={3} style={{ paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', marginLeft: '-24px' }}>
                  <div style={{ width: '6px', height: '20px', backgroundColor: '#8b5cf6', borderTopRightRadius: '4px', borderBottomRightRadius: '4px', marginTop: '2px' }}></div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginLeft: '18px' }}>Prizes</h3>
                </div>
                {prizePool > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(251,191,36,0.1)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(251,191,36,0.2)', marginBottom: '24px' }}>
                    <Trophy size={24} color="#fbbf24" />
                    <span style={{ color: '#fff', fontSize: '1.1rem' }}>Prize Pool: <strong style={{ color: '#fbbf24' }}>₹{prizePool.toLocaleString('en-IN')}</strong></span>
                  </div>
                )}
                <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {(comp.prizes || []).length === 0 ? (
                    <p style={{ color: 'rgba(255,255,255,0.5)' }}>No prizes listed.</p>
                  ) : (
                    comp.prizes.map((prize, i) => {
                      let iconColor = "#a1a1aa";
                      if (i === 0) iconColor = "#fbbf24";
                      else if (i === 1) iconColor = "#9ca3af";
                      else if (i === 2) iconColor = "#b45309";
                      
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', background: 'rgba(255, 255, 255, 0.08)', padding: '16px', borderRadius: '20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Medal size={24} color={iconColor} />
                            <div style={{ width: '24px', height: '24px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ fontSize: '13px', fontWeight: 800, color: iconColor }}>{i + 1}</span>
                            </div>
                          </div>
                          
                          <div style={{ flex: 1, marginLeft: '12px' }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#e4e4e7' }}>{prize.rank}</div>
                            {prize.title && <div style={{ fontSize: '0.85rem', color: '#a1a1aa', marginTop: '4px', fontWeight: 600 }}>{prize.title}</div>}
                            {prize.description && <div style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '2px' }}>{prize.description}</div>}
                            {prize.certificate && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                <CheckCircle2 size={10} color="#34d399" />
                                <span style={{ fontSize: '10px', color: '#34d399', fontWeight: 600 }}>Certificate Included</span>
                              </div>
                            )}
                          </div>
                          
                          {Number(prize.amount) > 0 && (
                            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>
                              ₹{Number(prize.amount).toLocaleString('en-IN')}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Rules */}
              <div ref={el => { sectionRefs.current[4] = el; }} data-index={4} style={{ paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', marginLeft: '-24px' }}>
                  <div style={{ width: '6px', height: '20px', backgroundColor: '#8b5cf6', borderTopRightRadius: '4px', borderBottomRightRadius: '4px', marginTop: '2px' }}></div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginLeft: '18px' }}>Rules</h3>
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                  {(() => {
                    if (!comp.rules) {
                      return <p style={{ color: 'rgba(255,255,255,0.5)' }}>No rules specified.</p>;
                    }

                    let parsedRules: any = null;
                    try {
                      parsedRules = JSON.parse(comp.rules);
                      // Handle the double-nested JSON string issue (e.g. description is a stringified array)
                      if (Array.isArray(parsedRules)) {
                        parsedRules = parsedRules.map(r => {
                          if (typeof r.description === 'string' && r.description.startsWith('[')) {
                            try {
                              const inner = JSON.parse(r.description);
                              if (Array.isArray(inner) && inner.length > 0 && inner[0].description) {
                                r.description = inner[0].description;
                              }
                            } catch (e) {}
                          }
                          return r;
                        });
                      }
                    } catch (e) {
                      parsedRules = null;
                    }

                    if (Array.isArray(parsedRules)) {
                      const validRules = parsedRules.filter(r => r.subtitle || r.description);
                      if (validRules.length === 0) {
                        return <p style={{ color: 'rgba(255,255,255,0.5)' }}>No rules specified.</p>;
                      }
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                          {validRules.map((sec: any, idx: number) => (
                            <div key={idx}>
                              {sec.subtitle && <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem', fontWeight: 700, color: '#fff' }}>{sec.subtitle}</h4>}
                              {sec.description && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                  {sec.description.split('\n').filter((l: string) => l.trim().length > 0).map((line: string, i: number) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                      <div style={{ width: '4px', height: '4px', borderRadius: '2px', backgroundColor: '#8b5cf6', marginTop: '9px', flexShrink: 0 }}></div>
                                      <span style={{ fontSize: '0.9rem', color: '#d4d4d8', lineHeight: 1.6 }}>{line.trim()}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    }

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {comp.rules.split('\n').filter(l => l.trim()).map((line, j) => (
                          <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                            <div style={{ width: '4px', height: '4px', borderRadius: '2px', backgroundColor: '#8b5cf6', marginTop: '9px', flexShrink: 0 }}></div>
                            <span style={{ fontSize: '0.9rem', color: '#d4d4d8', lineHeight: 1.6 }}>{line.trim()}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Contact */}
              <div ref={el => { sectionRefs.current[5] = el; }} data-index={5} style={{ paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', marginLeft: '-24px' }}>
                  <div style={{ width: '6px', height: '20px', backgroundColor: '#8b5cf6', borderTopRightRadius: '4px', borderBottomRightRadius: '4px', marginTop: '2px' }}></div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginLeft: '18px' }}>Contact</h3>
                </div>
                <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {(comp.contact_email || comp.contact_phone) && (
                    <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '16px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {comp.contact_email && (
                        <a href={`mailto:${comp.contact_email}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
                          <Mail size={16} color="#8b5cf6" />
                          <span style={{ fontSize: '13px', color: '#fff', fontWeight: 500 }}>{comp.contact_email}</span>
                        </a>
                      )}
                      {comp.contact_email && comp.contact_phone && (
                        <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
                      )}
                      {comp.contact_phone && (
                        <a href={`tel:${comp.contact_phone}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
                          <Phone size={16} color="#8b5cf6" />
                          <span style={{ fontSize: '13px', color: '#fff', fontWeight: 500 }}>{comp.contact_phone}</span>
                        </a>
                      )}
                    </div>
                  )}
                  {comp.contact_whatsapp && (
                    <a href={comp.contact_whatsapp.startsWith('http') ? comp.contact_whatsapp : `https://wa.me/${comp.contact_whatsapp}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '16px', padding: '14px', textDecoration: 'none' }}>
                      <MessageCircle size={16} color="#8b5cf6" />
                      <span style={{ fontSize: '13px', color: '#fff', fontWeight: 500, flex: 1 }}>WhatsApp Group</span>
                      <ExternalLink size={14} color="#52525b" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          MOBILE LAYOUT
          ═══════════════════════════════════════════════════ */}
      <div className="competition-mobile-layout hide-desktop">
        {/* TOP NAV / BADGES */}
        <div className="cml-top-nav">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              className="cml-icon-btn" 
              onClick={() => navigate(-1)}
              style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '32px', height: '32px' }}
            >
              <ArrowLeft size={16} color="#fff" />
            </button>
            {comp.is_online ? (
              <div className="cml-badge-online">
                <Wifi size={12} color="#fff" />
                <span>Online</span>
              </div>
            ) : comp.venue ? (
              <div className="cml-badge-online">
                <MapPin size={12} color="#fff" />
                <span>{comp.venue}</span>
              </div>
            ) : null}
          </div>
          
          <div className="cml-top-actions">
            <button className="cml-icon-btn" onClick={handleShare}>
              <Share2 size={16} color="#fff" />
            </button>
          </div>
        </div>

        {/* HEADER DETAILS */}
        <div className="cml-header">
          <div className="cml-header-row">
            <div className="cml-poster-box">
              {comp.banner_url ? (
                <img src={getCdnUrl(comp.banner_url)} alt={comp.title} className="cml-poster-img" />
              ) : (
                <div className="cml-poster-placeholder">
                  <Trophy size={32} color="rgba(139,92,246,0.3)" />
                </div>
              )}
            </div>
            <div className="cml-header-info">
              <h1 className="cml-title">{comp.title}</h1>
              <div className="cml-tags">
                <div className="cml-tag">
                  {Number(comp.entry_fee) > 0 ? `₹${comp.entry_fee} per member` : 'Free'}
                </div>
                <div className="cml-tag">
                  <CatIcon size={12} color="#38bdf8" />
                  <span style={{ color: '#38bdf8' }}>{cat.label}</span>
                </div>
                <div className="cml-tag">
                  {comp.is_online ? <Wifi size={12} color="#fff" /> : <MapPin size={12} color="#fff" />}
                  <span>{comp.is_online ? 'Online' : (comp.venue || 'TBA')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* STATS ROW (Mobile only) */}
          <div className="cml-stats-row">
            <div className="cml-stat-box">
              <div className="cml-stat-icon"><Users size={16} color="#38bdf8" /></div>
              <div className="cml-stat-label">Team Size</div>
              <div className="cml-stat-value">{teamInfo}</div>
            </div>
            <div className="cml-stat-box">
              <div className="cml-stat-icon"><Users size={16} color="#38bdf8" /></div>
              <div className="cml-stat-label">Registered</div>
              <div className="cml-stat-value">{regCount || 0}</div>
            </div>
            <div className="cml-stat-box">
              <div className="cml-stat-icon"><CalendarDays size={16} color="#38bdf8" /></div>
              <div className="cml-stat-label">Deadline</div>
              <div className="cml-stat-value">{comp.registration_deadline ? new Date(comp.registration_deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}</div>
            </div>
          </div>
        </div>

        {/* ELIGIBILITY */}
        {comp.eligibility && (
          <div className="cml-section">
            <div className="cml-divider"></div>
            <div className="cml-section-header">
              <div className="cml-accent-bar"></div>
              <h2 className="cml-section-title">Eligibility</h2>
            </div>
            <div style={{ padding: '0 12px' }}>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '16px', padding: '14px' }}>
                {comp.eligibility.open_to_all ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontWeight: 600, fontSize: '14px' }}>
                    <Shield size={16} color="#34d399" /> Open to All
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {comp.eligibility.year_of_study && comp.eligibility.year_of_study.length > 0 && (
                      <div>
                        <div style={{ fontSize: '13px', color: '#d4d4d8', marginBottom: '6px' }}>Year of Study</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {comp.eligibility.year_of_study.map((y: string) => (
                            <span key={y} style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', color: '#e4e4e7' }}>{formatYearLabel(y, comp.course)}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {comp.eligibility.branches && comp.eligibility.branches.length > 0 && (
                      <div>
                        <div style={{ fontSize: '13px', color: '#d4d4d8', marginBottom: '6px' }}>Branches</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {comp.eligibility.branches.map((b: string) => (
                            <span key={b} style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', color: '#e4e4e7' }}>{b}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {comp.eligibility.min_cgpa && <div style={{ fontSize: '14px', color: '#e4e4e7' }}>Minimum CGPA: <strong style={{ color: '#fff' }}>{comp.eligibility.min_cgpa}</strong></div>}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TIMELINE */}
        {(comp.stages || []).length > 0 && (
          <div className="cml-section">
            <div className="cml-divider" />
            <div className="cml-section-header">
              <div className="cml-accent-bar"></div>
              <h2>Stages and Timelines</h2>
            </div>
            
            <div className="cml-timeline">
              {comp.stages.map((stage: any, idx: number) => {
                const isLast = idx === comp.stages.length - 1;
                const stageStart = stage.start_date ? new Date(stage.start_date) : null;
                const stageEnd = stage.end_date ? new Date(stage.end_date) : null;
                const startDay = stageStart ? stageStart.getDate() : '';
                const startMonth = stageStart ? stageStart.toLocaleString('default', { month: 'short' }) : '';
                
                const stageSubmissions = myReg?.registration_type === 'team' ? myReg.team?.submissions : myReg?.submissions;
                const stageSubmission = stageSubmissions?.[idx];
                const isSubmitted = !!stageSubmission;
                
                const isAuthorizedToSubmit = myReg && (
                  myReg.registration_type === 'individual' ||
                  (myReg.registration_type === 'team' && myReg.team_role === 'leader')
                );
                
                const hasSubmissionTypes = stage.submission_types && stage.submission_types.length > 0 && !stage.submission_types.includes('none');
                const now = new Date();
                const isTimeValid = (!stageStart || now >= stageStart) && (!stageEnd || now <= stageEnd);
                const canShowSubmitButton = hasSubmissionTypes && myReg && (isSubmitted || (isAuthorizedToSubmit && isTimeValid));

                return (
                  <div key={idx} className="cml-timeline-item">
                    <div className="cml-timeline-axis">
                      <div className="cml-date-bubble">
                        <div className="cml-date-day">{startDay}</div>
                        <div className="cml-date-month">{startMonth}</div>
                      </div>
                      {!isLast && <div className="cml-timeline-line"></div>}
                    </div>
                    <div className="cml-timeline-content">
                      <div style={{ fontSize: '0.75rem', color: '#a1a1aa', fontWeight: 600, marginBottom: '6px', paddingLeft: '4px' }}>
                        {stageStart && stageStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} 
                        {stageEnd && ` → ${stageEnd.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`}
                      </div>
                      <div className="cml-stage-card">
                        <div className="cml-stage-header">
                          <h3 className="cml-stage-name">{stage.name || `Round ${idx + 1}`}</h3>
                          <div className="cml-stage-on">
                            <span>On</span>
                            <span style={{ fontWeight: 700, marginLeft: 4 }}>Pluto</span>
                          </div>
                        </div>
                        {stage.description && <p className="cml-stage-desc">{stage.description}</p>}
                        
                        {stage.submission_types && stage.submission_types.length > 0 && !stage.submission_types.includes('none') && (
                          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                            {stage.submission_types.map((t: string) => <span key={t} style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', color: '#fff', textTransform: 'capitalize' }}>{t}</span>)}
                          </div>
                        )}
                        
                        {canShowSubmitButton && (
                          <div style={{ marginTop: '16px' }}>
                            {isSubmitted ? (
                              <button className="cml-submit-btn success" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', borderRadius: '20px', padding: '8px 16px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399', fontWeight: 700, fontSize: '0.85rem' }} onClick={() => setSubmissionModal({ open: true, stageIndex: idx, existing: stageSubmission })}>
                                <CheckCircle2 size={16} /> {stageSubmission?.submitted_at ? `Submitted ${new Date(stageSubmission.submitted_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}` : 'Submitted (View)'}
                              </button>
                            ) : (
                              <button className="cml-submit-btn" onClick={() => setSubmissionModal({ open: true, stageIndex: idx })}>
                                Submit Deliverable
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ABOUT */}
        {(comp.description || (comp.about_sections && comp.about_sections.length > 0)) && (
          <div className="cml-section">
            <div className="cml-divider"></div>
            <div className="cml-section-header">
              <div className="cml-accent-bar"></div>
              <h2 className="cml-section-title" style={{ fontSize: '18px', lineHeight: '24px' }}>{comp.description || 'About'}</h2>
            </div>
            
            {comp.about_sections && comp.about_sections.map((sec: any, idx: number) => (
              <div key={idx} className="cml-about-sec">
                {sec.subtitle && <h3>{sec.subtitle}</h3>}
                {sec.description && (
                  <div className="cml-bullet-list">
                    {sec.description.split('\n').filter((l: string) => l.trim().length > 0).map((line: string, i: number) => (
                      <div key={i} className="cml-bullet-item">
                        <div className="cml-bullet-dot"></div>
                        <span>{line.trim()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* PRIZES */}
        {(comp.prizes || []).length > 0 && (
          <div className="cml-section">
            <div className="cml-divider"></div>
            <div className="cml-section-header">
              <div className="cml-accent-bar"></div>
              <h2 className="cml-section-title">Prizes</h2>
            </div>
            <div className="cml-prize-list">
              {(comp.prizes || []).map((prize: any, idx: number) => {
                let iconColor = "#a1a1aa";
                if (idx === 0) iconColor = "#fbbf24"; // Gold
                else if (idx === 1) iconColor = "#9ca3af"; // Silver
                else if (idx === 2) iconColor = "#b45309"; // Bronze

                return (
                  <div key={idx} className="cml-prize-card">
                    <div className="cml-prize-icon-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <Medal size={24} color={iconColor} />
                      <div className="cml-prize-badge" style={{ color: iconColor, fontSize: '13px', fontWeight: 800 }}>{idx + 1}</div>
                    </div>
                    <div className="cml-prize-info" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div className="cml-prize-rank" style={{ fontSize: '14px', fontWeight: 700, color: '#e4e4e7' }}>{prize.rank}</div>
                      {prize.title && <div className="cml-prize-title" style={{ fontSize: '13px', color: '#a1a1aa', fontWeight: 600 }}>{prize.title}</div>}
                      {prize.certificate && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                          <CheckCircle2 size={12} color="#34d399" />
                          <span style={{ fontSize: '11px', color: '#34d399', fontWeight: 600 }}>Certificate Included</span>
                        </div>
                      )}
                    </div>
                    {prize.amount > 0 && (
                      <div className="cml-prize-amount" style={{ fontSize: '16px', fontWeight: 800, color: iconColor }}>
                        ₹{Number(prize.amount).toLocaleString('en-IN')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* RULES */}
        {comp.rules && comp.rules.length > 0 && (
          <div className="cml-section">
            <div className="cml-divider"></div>
            <div className="cml-section-header">
              <div className="cml-accent-bar"></div>
              <h2 className="cml-section-title">Rules & Regulations</h2>
            </div>
            <div className="cml-bullet-list">
              {(() => {
                let parsedRules = [];
                try {
                  parsedRules = JSON.parse(comp.rules);
                } catch(e) {
                  parsedRules = [{ subtitle: '', description: comp.rules }];
                }
                
                if (Array.isArray(parsedRules)) {
                  return parsedRules.map((sec: any, idx: number) => (
                    <div key={idx} style={{ marginTop: idx === 0 ? (sec.subtitle ? 12 : 4) : (sec.subtitle ? 24 : 8) }}>
                      {sec.subtitle ? <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>{sec.subtitle.trim()}</h3> : null}
                      {sec.description ? (
                        <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {sec.description.split('\n').filter((l: string) => l.trim().length > 0).map((line: string, i: number) => (
                            <li key={i} style={{ color: '#d4d4d8', fontSize: '0.95rem', lineHeight: '1.6' }}>
                              {line.trim()}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ));
                }
                return (
                  <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {comp.rules.split('\n').filter((l: string) => l.trim().length > 0).map((rule: string, idx: number) => (
                      <li key={idx} style={{ color: '#d4d4d8', fontSize: '0.95rem', lineHeight: '1.6' }}>
                        {rule.trim()}
                      </li>
                    ))}
                  </ul>
                );
              })()}
            </div>
          </div>
        )}

        {/* CONTACT */}
        {(comp.contact_email || comp.contact_phone || comp.contact_whatsapp) && (
          <div className="cml-section">
            <div className="cml-divider"></div>
            <div className="cml-section-header">
              <div className="cml-accent-bar"></div>
              <h2 className="cml-section-title">Contact</h2>
            </div>
            <div style={{ padding: '0 12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(comp.contact_email || comp.contact_phone) && (
                  <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '16px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {comp.contact_email && (
                      <a href={`mailto:${comp.contact_email}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#fff', textDecoration: 'none', fontSize: '13px', fontWeight: 500 }}>
                        <Mail size={16} color="#8b5cf6" /> {comp.contact_email}
                      </a>
                    )}
                    {comp.contact_email && comp.contact_phone && (
                      <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
                    )}
                    {comp.contact_phone && (
                      <a href={`tel:${comp.contact_phone}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#fff', textDecoration: 'none', fontSize: '13px', fontWeight: 500 }}>
                        <Phone size={16} color="#8b5cf6" /> {comp.contact_phone}
                      </a>
                    )}
                  </div>
                )}
                {comp.contact_whatsapp && (
                  <a href={comp.contact_whatsapp.startsWith('http') ? comp.contact_whatsapp : `https://wa.me/${comp.contact_whatsapp}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '16px', padding: '14px', color: '#fff', textDecoration: 'none', fontSize: '13px', fontWeight: 500 }}>
                    <MessageCircle size={16} color="#8b5cf6" /> <span style={{ flex: 1 }}>WhatsApp Group</span> <ExternalLink size={14} color="#52525b" />
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        <div style={{ height: '120px' }}></div>

        {/* FLOATING DOCK */}
        <div className="mobile-event-dock cml-dock">
          {(!myReg && !isDeadlinePassed && daysLeft !== null && daysLeft > 0 && daysLeft <= 30) && (
            <div style={{
              position: 'absolute',
              top: '-32px',
              right: '24px',
              backgroundColor: '#09090b',
              padding: '6px 16px 20px',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px',
              border: '1px solid rgba(255,255,255,0.15)',
              borderBottom: 'none',
              zIndex: -1,
            }}>
              <span style={{ fontSize: '12px', fontWeight: 800 }}>
                <span style={{ color: '#fb923c' }}>{daysLeft}</span>
                <span style={{ color: '#ffffff' }}> {daysLeft === 1 ? 'Day' : 'Days'} Left</span>
              </span>
            </div>
          )}
          <button className="cml-back-btn" onClick={() => navigate(-1)} style={{ zIndex: 10 }}>
            <ArrowLeft size={16} color="#d4d4d8" />
            <span>Back</span>
          </button>
          
          <div className="cml-dock-action" style={{ zIndex: 10 }}>
            {isRegLoading ? (
              <button className="book-btn-mobile disabled" style={{ backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 size={16} className="spin" color="#a1a1aa" />
              </button>
            ) : isStaff ? (
              <button className="book-btn-mobile disabled">Staff Preview</button>
            ) : isPureOrganizer ? (
              <button className="book-btn-mobile disabled">Organizer Preview</button>
            ) : isAdminUser ? (
              <button className="book-btn-mobile disabled">Admin Preview</button>
            ) : myReg ? (
              !isRegCompleted ? (
                isDeadlinePassed ? (
                  <button className="book-btn-mobile disabled">Registration Closed</button>
                ) : (
                  <button className="book-btn-mobile" style={{ backgroundColor: '#be831e', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#fff', border: 'none' }} onClick={() => handleRegisterClick(`/competition/${id}/register`)}>
                    <Clock size={16} /> Registration Pending
                  </button>
                )
              ) : (
                <button className="book-btn-mobile" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }} onClick={() => handleRegisterClick(`/competition/${id}/register`)}>
                  <CheckCircle2 size={16} color="#10b981" /> Registered
                </button>
              )
            ) : isDeadlinePassed ? (
              <button className="book-btn-mobile disabled">Registration Closed</button>
            ) : canRegister ? (
              <button className="book-btn-mobile primary" onClick={() => {
                const isIndividualOnly = comp?.registration_type === 'individual' || (comp?.team_size_max ?? 1) <= 1;
                if (!user) {
                  handleRegisterClick(`/competition/${id}/register${isIndividualOnly ? '?mode=individual' : ''}`);
                } else if (isIndividualOnly) {
                  navigate(`/competition/${id}/register?mode=individual`);
                } else {
                  setShowRegModal(true);
                }
              }}>
                Register Now
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* REGISTRATION TYPE MODAL */}
      {showRegModal && comp && (
        <div className="registration-modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', justifyContent: 'center', padding: '0px' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={() => setShowRegModal(false)} />
          <div className="registration-modal-sheet" style={{ 
            position: 'relative', 
            width: '100%', 
            backgroundColor: '#121212', 
            overflowY: 'auto' 
          }}>
            <div className="registration-modal-handle" style={{ width: '36px', height: '4px', borderRadius: '2px', backgroundColor: 'rgba(255,255,255,0.15)', margin: '0 auto 20px' }}></div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', marginBottom: '20px', marginTop: 0 }}>How would you like to participate?</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {comp.registration_type === 'both' && (
                <button onClick={() => { setShowRegModal(false); handleRegisterClick(`/competition/${comp.id}/register?mode=individual`); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '14px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '24px', padding: '16px', border: 'none', textAlign: 'left', cursor: 'pointer' }}>
                  <div style={{ width: '50px', height: '50px', borderRadius: '16px', backgroundColor: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <UserIcon size={24} color="#a78bfa" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#e4e4e7', marginBottom: '3px' }}>Solo Participant</div>
                    <div style={{ fontSize: '12px', color: '#71717a', lineHeight: 1.4 }}>Register directly as an individual candidate</div>
                  </div>
                </button>
              )}
              <button onClick={() => { setShowRegModal(false); handleRegisterClick(`/competition/${comp.id}/register?mode=create`); }}
                style={{ display: 'flex', alignItems: 'center', gap: '14px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '24px', padding: '16px', border: 'none', textAlign: 'left', cursor: 'pointer' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <UserPlus size={24} color="#38bdf8" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#e4e4e7', marginBottom: '3px' }}>Create A Team</div>
                  <div style={{ fontSize: '12px', color: '#71717a', lineHeight: 1.4 }}>Form a team & invite members via invite code or search</div>
                </div>
              </button>

              <button onClick={() => { setShowRegModal(false); handleRegisterClick(`/competition/${comp.id}/register?mode=join`); }}
                style={{ display: 'flex', alignItems: 'center', gap: '14px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '24px', padding: '16px', border: 'none', textAlign: 'left', cursor: 'pointer' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Users size={24} color="#38bdf8" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#e4e4e7', marginBottom: '3px' }}>Join A Team</div>
                  <div style={{ fontSize: '12px', color: '#71717a', lineHeight: 1.4 }}>Browse teams seeking members or enter invite code</div>
                </div>
              </button>

              <button onClick={() => { setShowRegModal(false); handleRegisterClick(`/competition/${comp.id}/register?mode=existing`); }}
                style={{ display: 'flex', alignItems: 'center', gap: '14px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '24px', padding: '16px', border: 'none', textAlign: 'left', cursor: 'pointer' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Inbox size={24} color="#38bdf8" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#e4e4e7', marginBottom: '3px' }}>Add Existing Team</div>
                  <div style={{ fontSize: '12px', color: '#71717a', lineHeight: 1.4 }}>Use a team you already built in Team Builder</div>
                </div>
              </button>
            </div>

            <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '20px', padding: '16px', marginTop: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <Info size={14} color="#38bdf8" />
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#38bdf8' }}>Important Notes:</div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', color: '#38bdf8', fontWeight: 700 }}>•</span>
                <span style={{ fontSize: '12px', color: '#a1a1aa', flex: 1, lineHeight: 1.4 }}>Your team must have at least {comp.team_size_min || 1} and no more than {comp.team_size_max || 5} members.</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', color: '#38bdf8', fontWeight: 700 }}>•</span>
                <span style={{ fontSize: '12px', color: '#a1a1aa', flex: 1, lineHeight: 1.4 }}>If you select "Join A Team", your registration won't be finalized until you join a team.</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: '#38bdf8', fontWeight: 700 }}>•</span>
                <span style={{ fontSize: '12px', color: '#a1a1aa', flex: 1, lineHeight: 1.4 }}>Each team member must verify themselves before the deadline.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {isPosterModalOpen && comp.banner_url && (
        <div className="poster-modal-overlay" onClick={() => setIsPosterModalOpen(false)}>
          <button className="poster-modal-close" onClick={() => setIsPosterModalOpen(false)}>
            <X size={24} />
          </button>
          <img 
            src={getCdnUrl(comp.banner_url)} 
            alt={comp.title} 
            className="poster-modal-img"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <SubmissionModal
        isOpen={submissionModal.open}
        onClose={() => setSubmissionModal({ open: false, stageIndex: 0 })}
        stageIndex={submissionModal.stageIndex}
        stageName={comp.stages?.[submissionModal.stageIndex]?.name || ''}
        submissionTypes={comp.stages?.[submissionModal.stageIndex]?.submission_types || []}
        registrationType={myReg?.registration_type || 'individual'}
        entityId={myReg?.registration_type === 'team' ? (myReg?.team_id || '') : (myReg?.id || '')}
        existingSubmission={submissionModal.existing}
      />
    </>
  )
}
