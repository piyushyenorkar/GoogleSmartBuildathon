import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useCreateEvent } from '@/hooks/useEvents'
import { useCreateCompetition } from '@/hooks/useCompetitions'
import { SelectDropdown } from '@/components/ui/SelectDropdown'

import { ChevronDown, Trophy, X, Plus, Trash2, Award, Shield, Mail, Phone, MessageCircle, Tent, Megaphone, Image as ImageIcon, CalendarDays, Clock, MapPin, Map, Tag, AlignLeft, Globe, CreditCard, Users, Ticket, IndianRupee, Building2, ArrowRight, Eye, FileText } from 'lucide-react'
import { CustomFormBuilderModal } from '@/components/forms/CustomFormBuilderModal'
import { CustomFormPurposeModal } from '@/components/forms/CustomFormPurposeModal'
import type { CustomFormConfig } from '@/types/form'
import { INDIAN_STATES_CITIES, THEME_SUGGESTIONS, YEAR_OF_STUDY_OPTIONS, BRANCH_OPTIONS, SUBMISSION_TYPES } from '@/lib/constants'
import '@/components/event/EventCard.css'
import './CreateEvent.css'
import { formatYearLabel } from '@/lib/utils'

type Mode = 'competition' | 'event' | 'announcement'

export default function CreateEvent() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const queryMode = searchParams.get('type') as Mode | null
  const initialMode = queryMode || location.state?.mode || 'competition'
  const [mode, setMode] = useState<Mode>(initialMode)

  useEffect(() => {
    if (queryMode) {
      setMode(queryMode)
    }
  }, [queryMode])
  const bannerContainerRef = useRef<HTMLDivElement>(null)
  const [seatingType, setSeatingType] = useState<'simple' | 'seats'>('simple')
  const [isUniversal, setIsUniversal] = useState(false)
  const [publishOnDepartment, setPublishOnDepartment] = useState(false)
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([])
  const [targetYears, setTargetYears] = useState<Record<string, string[]>>({})
  const [targetSections, setTargetSections] = useState<Record<string, Record<string, string[]>>>({})
  const [deptConfigLoaded, setDeptConfigLoaded] = useState(false)
  const [collegeDepartments, setCollegeDepartments] = useState<Array<{ department: string, course: string, duration_years: number, sections: any }>>([])
  const [categories, setCategories] = useState<{ name: string }[]>([])
  const [venues, setVenues] = useState<{ name: string }[]>([])
  const [title, setTitle] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [venue, setVenue] = useState('')
  const [venueState, setVenueState] = useState('')
  const [venueCity, setVenueCity] = useState('')
  const [category, setCategory] = useState('')
  const [customCategory, setCustomCategory] = useState('')
  const [description, setDescription] = useState('')
  const [speakerName, setSpeakerName] = useState('')
  const [speakerOrg, setSpeakerOrg] = useState('')

  const [aboutSections, setAboutSections] = useState([{ subtitle: '', description: '' }])
  const [regDeadline, setRegDeadline] = useState('')
  const [isOnline, setIsOnline] = useState(false)
  const [registrationType, setRegistrationType] = useState('individual')
  const [teamSizeMin, setTeamSizeMin] = useState('1')
  const [teamSizeMax, setTeamSizeMax] = useState('4')
  const [stages, setStages] = useState([{ name: '', description: '', start_date: '', end_date: '', submission_types: [] as any[] }])
  const [prizes, setPrizes] = useState([{ rank: '1st Place', amount: '', title: '', description: '' }])
  const [themes, setThemes] = useState<string[]>([])
  const [eligibility, setEligibility] = useState<{ open_to_all: boolean; year_of_study: string[]; branches: string[]; min_cgpa?: number }>({ open_to_all: true, year_of_study: [], branches: [] })
  const [rulesSections, setRulesSections] = useState([{ subtitle: '', description: '' }])
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactWhatsapp, setContactWhatsapp] = useState('')

  const [customForm, setCustomForm] = useState<CustomFormConfig | null>(null)
  const [isFormBuilderOpen, setIsFormBuilderOpen] = useState(false)
  const [isFormPurposeOpen, setIsFormPurposeOpen] = useState(false)

  const [capacity, setCapacity] = useState('')
  const [price, setPrice] = useState('')
  const [refundPolicy, setRefundPolicy] = useState('no_refund')

  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [bannerZoom, setBannerZoom] = useState(1)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      navigate('/?auth=login')
      return;
    }

    const loadData = async () => {
      // Load categories
      const { data: catData } = await supabase.from('categories').select('name').order('sort_order')
      if (catData) setCategories(catData)

      // Load venues
      const { data: venData } = await supabase.from('venues').select('name').order('name')
      if (venData) setVenues(venData)
    }

    loadData()
  }, [user, navigate])

  const isPureOrganizer = user?.roles?.includes('organizer') && !user?.roles?.includes('user') && !user?.roles?.includes('student') && !user?.roles?.includes('admin') && !user?.roles?.includes('staff')

  useEffect(() => {
    if (isPureOrganizer) {
      setMode('event')
      setIsUniversal(true)
    }
  }, [isPureOrganizer])

  // Fetch all departments for the college
  useEffect(() => {
    if (!user?.college_id) {
      return
    }
    supabase
      .from('college_departments')
      .select('department, course, duration_years, sections')
      .eq('college_id', user.college_id)
      .then(({ data }) => {
        if (data) {
          setCollegeDepartments(data)
        }
        setDeptConfigLoaded(true)
      })
  }, [user?.college_id])



  // Reset targeting when toggled off
  useEffect(() => {
    if (!publishOnDepartment) {
      setSelectedDepartments([])
      setTargetYears({})
      setTargetSections({})
    }
  }, [publishOnDepartment])

  // Mouse move effect for all glow cards
  useEffect(() => {
    const cards = document.querySelectorAll<HTMLElement>('.glow-card-container')

    const handleMouseMove = (e: MouseEvent, card: HTMLElement) => {
      const rect = card.getBoundingClientRect()


      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const glow1 = card.querySelector('.card-glow-effect') as HTMLElement
      const glow2 = card.querySelector('.glow-layer-extra') as HTMLElement
      const glow3 = card.querySelector('.glow-layer-tertiary') as HTMLElement

      if (glow1) {
        setTimeout(() => {
          glow1.style.left = `${x}px`
          glow1.style.top = `${y}px`
          glow1.style.display = 'block'
          glow1.style.opacity = '1'
        }, 50)
      }

      if (glow2) {
        setTimeout(() => {
          glow2.style.left = `${x}px`
          glow2.style.top = `${y}px`
          glow2.style.display = 'block'
          glow2.style.opacity = '1'
        }, 100)
      }

      if (glow3) {
        setTimeout(() => {
          glow3.style.left = `${x}px`
          glow3.style.top = `${y}px`
          glow3.style.display = 'block'
          glow3.style.opacity = '1'
        }, 150)
      }
    }

    const handleMouseLeave = (card: HTMLElement) => {
      const glow1 = card.querySelector('.card-glow-effect') as HTMLElement
      const glow2 = card.querySelector('.glow-layer-extra') as HTMLElement
      const glow3 = card.querySelector('.glow-layer-tertiary') as HTMLElement
      if (glow1) glow1.style.opacity = '0'
      if (glow2) glow2.style.opacity = '0'
      if (glow3) glow3.style.opacity = '0'
    }

    const listeners: { card: HTMLElement; moveListener: EventListener; leaveListener: EventListener }[] = []

    cards.forEach((card) => {
      const moveListener = (e: Event) => handleMouseMove(e as MouseEvent, card)
      const leaveListener = () => handleMouseLeave(card)

      card.addEventListener('mousemove', moveListener)
      card.addEventListener('mouseleave', leaveListener)

      listeners.push({ card, moveListener, leaveListener })
    })

    return () => {
      listeners.forEach(({ card, moveListener, leaveListener }) => {
        card.removeEventListener('mousemove', moveListener)
        card.removeEventListener('mouseleave', leaveListener)
      })
    }
  }, [mode, isUniversal, seatingType]) // Re-bind if mode/toggles change DOM structure

  const renderDepartmentTargeting = () => (
    <AnimatePresence>
      {publishOnDepartment && !deptConfigLoaded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', margin: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
        >
          <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#f472b6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Loading department data...</span>
        </motion.div>
      )}
      {publishOnDepartment && deptConfigLoaded && (
        <motion.div 
          initial={{ height: 0, opacity: 0, overflow: 'hidden' }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', margin: '0.5rem 0', overflow: 'hidden' }}
        >
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.4rem', paddingTop: '0.5rem' }}>
            Select target departments
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1rem' }}>
            {collegeDepartments.filter(dept => dept.course === user?.course).map(dept => {
              const isSelected = selectedDepartments.includes(dept.department);
              return (
                <button
                  key={dept.department}
                  type="button"
                  onClick={() => {
                    setSelectedDepartments(prev => 
                      isSelected ? prev.filter(d => d !== dept.department) : [...prev, dept.department]
                    )
                  }}
                  style={{
                    padding: '4px 12px', borderRadius: '16px', fontSize: '0.75rem', fontWeight: 500,
                    border: isSelected ? '1px solid #0ea5e9' : '1px solid rgba(255,255,255,0.12)',
                    background: isSelected ? 'rgba(14,165,233,0.15)' : 'transparent',
                    color: isSelected ? '#38bdf8' : 'rgba(255,255,255,0.4)',
                    cursor: 'pointer',
                  }}
                >
                  {dept.department}
                </button>
              );
            })}
          </div>

          {selectedDepartments.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {selectedDepartments.map(deptName => {
                const deptConfig = collegeDepartments.find(d => d.department === deptName)
                if (!deptConfig) return null;
                const deptDuration = deptConfig.duration_years || 4;
                const deptSectionsConfig = (deptConfig.sections as Record<string, string[]>) || {};
                const currentYears = targetYears[deptName] || [];
                const currentSections = targetSections[deptName] || {};
                
                return (
                  <div key={deptName} style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '0.75rem', color: '#f472b6', marginBottom: '0.4rem', fontWeight: 600 }}>
                      {deptName} <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400, marginLeft: '4px' }}>Target specific years & sections (leave empty = entire dept)</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.4rem' }}>
                      {Array.from({ length: deptDuration }, (_, i) => String(i + 1)).map(y => (
                        <button
                          key={y}
                          type="button"
                          onClick={() => {
                            setTargetYears(prev => {
                              const deptY = prev[deptName] || []
                              const updated = deptY.includes(y) ? deptY.filter(v => v !== y) : [...deptY, y]
                              return { ...prev, [deptName]: updated }
                            })
                            if (currentYears.includes(y)) {
                              setTargetSections(prev => {
                                const deptS = { ...(prev[deptName] || {}) };
                                delete deptS[y];
                                return { ...prev, [deptName]: deptS }
                              })
                            }
                          }}
                          style={{
                            padding: '3px 10px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 500,
                            border: currentYears.includes(y) ? '1px solid #7c3aed' : '1px solid rgba(255,255,255,0.12)',
                            background: currentYears.includes(y) ? 'rgba(124,58,237,0.2)' : 'transparent',
                            color: currentYears.includes(y) ? '#a78bfa' : 'rgba(255,255,255,0.4)',
                            cursor: 'pointer',
                          }}
                        >
                          {formatYearLabel(y, deptConfig.course)}
                        </button>
                      ))}
                    </div>
                    {currentYears.map(y => {
                      const yearSecs = deptSectionsConfig[y] || []
                      if (yearSecs.length === 0) return null
                      return (
                        <div key={y} style={{ marginBottom: '0.3rem', paddingLeft: '0.5rem' }}>
                          <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)' }}>{formatYearLabel(y, deptConfig.course)} sections:</span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.15rem' }}>
                            {yearSecs.map((sec: string) => {
                              const isSelected = currentSections[y]?.includes(sec)
                              return (
                                <button
                                  key={sec}
                                  type="button"
                                  onClick={() => {
                                    setTargetSections(prev => {
                                      const deptS = prev[deptName] || {}
                                      const yearArr = deptS[y] || []
                                      const updated = isSelected ? yearArr.filter(s => s !== sec) : [...yearArr, sec]
                                      return { ...prev, [deptName]: { ...deptS, [y]: updated } }
                                    })
                                  }}
                                  style={{
                                    padding: '2px 8px', borderRadius: '12px', fontSize: '0.68rem',
                                    border: isSelected ? '1px solid #06b6d4' : '1px solid rgba(255,255,255,0.1)',
                                    background: isSelected ? 'rgba(6,182,212,0.15)' : 'transparent',
                                    color: isSelected ? '#67e8f9' : 'rgba(255,255,255,0.3)',
                                    cursor: 'pointer'
                                  }}
                                >
                                  {sec}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 200 * 1024) {
        alert("Oops! This image is too large. Please select an image smaller than 200 KB to help keep the app fast!")
        return
      }
      const reader = new FileReader()
      reader.onload = (event) => {
        setBannerPreview(event.target?.result as string)
        setBannerZoom(1)
      }
      reader.readAsDataURL(file)
    }
  }

  const createMutation = useCreateEvent()
  const createCompMutation = useCreateCompetition()

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    // Prevent double-click / rapid re-submissions
    if (createMutation.isPending || createCompMutation.isPending) return

    if (mode === 'competition') {
      if (!title || !category || !startDate || !endDate) {
        alert('Please fill all required fields')
        return
      }

      let generatedTargetDepartments: any[] | undefined = undefined;
      if (publishOnDepartment && selectedDepartments.length > 0) {
        generatedTargetDepartments = selectedDepartments.map(deptName => {
          const courseStr = collegeDepartments.find(d => d.department === deptName)?.course;
          const y = targetYears[deptName] || [];
          const s = targetSections[deptName] || {};
          return {
            department: deptName,
            course: courseStr,
            years: y.length > 0 ? y : undefined,
            sections: Object.keys(s).length > 0 ? s : undefined
          };
        });
      }

      const compData = {
        title,
        description,
        category: (category === 'other' ? customCategory : category) as any,
        start_date: startDate,
        end_date: endDate,
        registration_deadline: regDeadline || endDate,
        is_online: isOnline,
        venue: isOnline ? undefined : venue,
        is_universal: isPureOrganizer ? true : isUniversal,
        department: null,
        target_years: null,
        target_sections: null,
        target_departments: generatedTargetDepartments,
        course: user?.course || null,
        venue_state: venueState || undefined,
        venue_city: venueCity || undefined,
        participation_type: registrationType,
        team_size_min: registrationType === 'individual' ? 1 : parseInt(teamSizeMin),
        team_size_max: registrationType === 'individual' ? 1 : parseInt(teamSizeMax),
        capacity: capacity ? parseInt(capacity) : undefined,
        entry_fee: price ? parseInt(price) : 0,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        contact_whatsapp: contactWhatsapp,
        themes,
        eligibility,
        rules: rulesSections as any,
        about_sections: aboutSections,
        status: isPureOrganizer ? 'approved' : 'pending', // Admin verification support
        banner_url: bannerPreview || '', // In a real app this should be uploaded first
      }
      createCompMutation.mutate({
        ...compData,
        custom_form: customForm,
        stages: stages.map((s, idx) => ({ ...s, order: idx + 1 })),
        prizes: prizes.map(p => ({ ...p, amount: Number(p.amount) || 0 }))
      }, {
        onSuccess: async () => {
          if (user?.email) {
            try {
              const { data: updatedUser } = await supabase
                .from('users')
                .select('*, college_ref:colleges!college_id(name, city, state)')
                .eq('email', user.email)
                .maybeSingle()

              if (updatedUser) {
                // Optimistically append the 'organizer' role so the hub appears immediately
                if (!updatedUser.roles?.includes('organizer')) {
                  updatedUser.roles = [...(updatedUser.roles || []), 'organizer']
                }
                useAuthStore.getState().setUser(updatedUser)
              }
            } catch (err) {
              console.error('Failed to refresh user profile:', err)
            }
          }

          if (isPureOrganizer) {
            alert('Competition published to community successfully!')
            navigate('/community?tab=competitions')
          } else {
            alert('Competition sent to admin for verification!')
            navigate('/explore')
          }
        },
        onError: (err) => {
          alert(`Failed to create competition: ${err.message}`)
        }
      })
      return
    }



    // Explicit manual validation to prevent silent browser "required" blockages
    if (!title) return alert("Please fill out the Title.")
    if (!category) return alert("Please select a Category.")
    if (!description) return alert("Please add a Description.")
    if (mode === 'event' && (!startDate || !endDate || !startTime || !endTime)) {
      return alert("Please fill out all Dates and Times for your event.")
    }
    if (mode === 'announcement' && (!startTime || !endTime)) {
      return alert("Please provide Start and End times for your announcement.")
    }
    if ((!isUniversal || mode === 'announcement') && !venue) {
      return alert("Please provide a Venue.")
    }

    const now = new Date()
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

    const finalStartDate = mode === 'announcement' ? todayStr : startDate
    const finalEndDate = mode === 'announcement' ? todayStr : endDate
    const finalCategory = category === 'other' ? customCategory : category

    const finalVenue = venue || (venueCity && venueState ? `${venueCity}, ${venueState}` : '')

    let generatedTargetDepartments: any[] | null = null;
    if (publishOnDepartment && selectedDepartments.length > 0) {
      generatedTargetDepartments = selectedDepartments.map(deptName => {
        const courseStr = collegeDepartments.find(d => d.department === deptName)?.course;
        const y = targetYears[deptName] || [];
        const s = targetSections[deptName] || {};
        return {
          department: deptName,
          course: courseStr,
          years: y.length > 0 ? y : undefined,
          sections: Object.keys(s).length > 0 ? s : undefined
        };
      });
    }

    const payload = {
      title,
      description,
      category: finalCategory,
      type: mode,
      bannerUrl: bannerPreview || '', // In a real app this should be uploaded first
      status: isPureOrganizer ? 'approved' : 'pending',
      date: finalStartDate,
      endDate: finalEndDate,
      time: startTime,
      endTime,
      venue: finalVenue,
      city: venueCity || '',
      state: venueState || '',
      isUniversal,
      price: price ? Number(price) : 0,
      ticketLimit: capacity ? Number(capacity) : 100,
      refundPolicy,
      hasSeating: seatingType === 'seats',
      layout: null,
      department: null,
      target_years: null,
      target_sections: null,
      target_departments: generatedTargetDepartments,
      course: user?.course || null,
      speakerName: mode === 'event' ? speakerName : undefined,
      speakerOrg: mode === 'event' ? speakerOrg : undefined,
    }

    createMutation.mutate(payload, {
      onSuccess: async (data: any) => {
        // Refresh user session so they get the organizer role if they didn't have it
        if (user?.email) {
          try {
            const { data: updatedUser } = await supabase
              .from('users')
              .select('*, college_ref:colleges!college_id(name, city, state)')
              .eq('email', user.email)
              .maybeSingle()
            if (updatedUser) {
              // Optimistically append the 'organizer' role so the hub appears immediately
              if (!updatedUser.roles?.includes('organizer')) {
                updatedUser.roles = [...(updatedUser.roles || []), 'organizer']
              }
              useAuthStore.getState().setUser(updatedUser)
            }
          } catch (err) {
            console.error('Failed to refresh user profile:', err)
          }
        }

        if (payload.hasSeating && data?.id) {
          alert('Event created successfully! Continuing to Seat Editor...')
          navigate(`/seat-editor/${data.id}`)
        } else {
          if (isPureOrganizer) {
            alert('Event published to community successfully!')
            navigate('/community')
          } else {
            alert(mode === 'event' ? 'Event sent to admin for approval!' : 'Announcement published successfully!')
            navigate('/explore')
          }
        }
      },
      onError: (err) => {
        alert(`Failed to create: ${err.message}`)
      }
    })
  }

  return (
    <>
      <Helmet>
        <title>Create - PLUTO</title>
      </Helmet>

      {/* Main Container */}
      <div className="container">
      <div className="create-page">
        <div className={`create-layout-grid ${isPureOrganizer ? 'organizer-layout' : ''}`}>
          
          {/* Left Sidebar - Mode Toggles */}
          {!isPureOrganizer && (
            <div className="create-sidebar">
              <div className="create-tabs">
                <button
                  className={`create-tab ${mode === 'competition' ? 'active' : ''}`}
                  onClick={() => setMode('competition')}
                >
                  <Trophy size={18} />
                  <span>Create Competition</span>
                </button>
                <button
                  className={`create-tab ${mode === 'event' ? 'active' : ''}`}
                  onClick={() => setMode('event')}
                >
                  <Tent size={18} />
                  <span>Create Event</span>
                </button>
                <button
                  className={`create-tab ${mode === 'announcement' ? 'active' : ''}`}
                  onClick={() => setMode('announcement')}
                >
                  <Megaphone size={18} />
                  <span>Create Announcement</span>
                </button>
              </div>
            </div>
          )}

          {/* Main Content Area */}
          <div className="create-main-content">
            <form className="create-container" onSubmit={handleCreate}>

          {/* Left Side - Banner & Live Preview */}
          <div className="banner-section">
            {/* Title Input on the Background */}
            <input
              type="text"
              placeholder="Enter Title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="title-background-input"
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                boxShadow: 'none',
                color: 'white',
                fontSize: '1.8rem',
                fontWeight: 800,
                padding: '0.5rem 0.4rem',
                marginBottom: '-0.5rem',
                marginTop: '0.8rem',
                textTransform: 'uppercase'
              }}
            />
            {mode === 'announcement' ? (
              <div
                className="banner-upload-box"
                onClick={() => bannerInputRef.current?.click()}
              >
                {bannerPreview ? (
                  <img src={bannerPreview} alt="Banner Preview" className="banner-preview" style={{ display: 'block' }} />
                ) : (
                  <div className="banner-placeholder">
                    <ImageIcon size={32} style={{ color: 'var(--white)', opacity: 0.9, marginBottom: '0.5rem' }} />
                    <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>Upload Poster</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray)', marginTop: '0.5rem' }}>Recommended</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="event-card live-preview-card" style={{ cursor: 'default', height: 'auto', width: '100%', maxWidth: '380px', pointerEvents: 'auto', background: '#1e1e1e' }}>

                <div 
                  ref={bannerContainerRef}
                  className="event-card-image-wrapper" 
                  style={{ 
                    cursor: bannerPreview ? 'default' : 'pointer',
                    height: '160px',
                    overflow: 'hidden'
                  }} 
                  onClick={(e) => {
                    if (!bannerPreview) {
                      bannerInputRef.current?.click()
                    }
                  }}
                >
                  {mode === 'competition' && (
                    <div style={{
                      position: 'absolute', top: '12px', left: '12px', zIndex: 10,
                      background: 'rgba(0, 0, 0, 0.5)', color: '#fff',
                      padding: '4px 10px', borderRadius: '20px',
                      fontSize: '0.65rem', fontWeight: 700,
                      backdropFilter: 'blur(8px)', textTransform: 'uppercase'
                    }}>
                      {category === 'other' ? (customCategory || 'Category') : (category ? category.replace('_', ' ') : 'Category')}
                    </div>
                  )}
                  {mode === 'competition' && (
                    <div style={{
                      position: 'absolute', bottom: '12px', right: '12px', zIndex: 10,
                      background: 'rgba(0, 0, 0, 0.5)', color: '#fff',
                      padding: '4px 10px', borderRadius: '20px',
                      fontSize: '0.65rem', fontWeight: 600,
                      backdropFilter: 'blur(8px)',
                      display: 'flex', alignItems: 'center', gap: '4px'
                    }}>
                      <Clock size={12} />
                      {regDeadline ? 'Ends ' + new Date(regDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Set Deadline'}
                    </div>
                  )}

                  {bannerPreview ? (
                    <motion.img 
                      src={bannerPreview} 
                      className="event-card-image"
                      alt="Preview"
                      draggable={false}
                      drag
                      dragConstraints={false}
                      dragElastic={0}
                      dragMomentum={false}
                      style={{ 
                        cursor: 'grab', 
                        display: 'block',
                        scale: bannerZoom,
                        transformOrigin: 'center center',
                        transition: 'none',
                        objectFit: 'unset',
                        maxWidth: 'none',
                        maxHeight: 'none'
                      }}
                      onLoad={(e) => {
                        const img = e.currentTarget;
                        const container = img.parentElement;
                        if (!container) return;
                        
                        // Ensure aspect ratio is preserved by overriding any CSS
                        img.style.width = 'auto';
                        img.style.height = 'auto';
                        
                        const imgAspect = img.naturalWidth / img.naturalHeight;
                        const containerAspect = container.offsetWidth / container.offsetHeight;
                        
                        if (imgAspect > containerAspect) {
                          // Image is relatively wider. Match height, let width overflow naturally.
                          img.style.height = '100%';
                          img.style.width = 'auto';
                        } else {
                          // Image is relatively taller. Match width, let height overflow naturally.
                          img.style.width = '100%';
                          img.style.height = 'auto';
                        }
                      }}
                      whileTap={{ cursor: 'grabbing' }}
                    />
                  ) : (
                    <div className="event-card-placeholder" style={{ background: 'rgba(255, 255, 255, 0.08)', width: '100%', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none' }}>
                        <ImageIcon size={32} style={{ color: 'var(--white)', opacity: 0.9 }} />
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '0.5rem', color: 'rgba(255,255,255,0.9)' }}>Upload Poster</div>
                      </div>
                    </div>
                  )}
                  {bannerPreview && (
                    <>
                      <div 
                        onClick={(e) => e.stopPropagation()}
                        style={{ position: 'absolute', bottom: 8, left: 8, display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.6)', padding: '4px', borderRadius: '6px', zIndex: 10, pointerEvents: 'auto' }}
                      >
                        <button 
                          type="button"
                          style={{ width: '24px', height: '24px', borderRadius: '4px', border: 'none', background: 'rgba(255,255,255,0.2)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        >
                          -
                        </button>
                        <button 
                          type="button"
                          style={{ width: '24px', height: '24px', borderRadius: '4px', border: 'none', background: 'rgba(255,255,255,0.2)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        >
                          +
                        </button>
                      </div>
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); bannerInputRef.current?.click() }}
                        style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer', zIndex: 10, pointerEvents: 'auto' }}
                      >
                        Change
                      </button>
                    </>
                  )}
                </div>

                <div className="event-card-body" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  <h3 className="event-card-title" style={{ fontSize: '1.2rem', marginBottom: 0 }}>{title || (mode === 'competition' ? 'Competition Title' : 'Event Title')}</h3>
                  
                  <p className="event-card-description" style={{ fontSize: '0.9rem', marginBottom: 0 }}>
                    {description 
                      ? (description.length > 80 ? description.substring(0, 80) + '...' : description)
                      : (mode === 'competition' ? 'Competition description will appear here...' : 'Event description will appear here...')}
                  </p>

                    <div className="event-card-meta" style={{ gap: '0.5rem', marginBottom: '0' }}>
                    {mode === 'competition' ? (
                      <>
                        <div className="event-card-meta-item">
                          <div style={{ background: 'rgba(255, 255, 255, 0.1)', borderRadius: '6px', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CalendarDays size={14} color="#38bdf8" />
                          </div>
                          <span>
                            {(startDate || endDate) 
                              ? `${startDate ? new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}${endDate && endDate !== startDate ? ' - ' + new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}`
                              : 'Select Dates'
                            }
                          </span>
                        </div>
                        <div className="event-card-meta-item">
                          <div style={{ background: 'rgba(255, 255, 255, 0.1)', borderRadius: '6px', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Users size={14} color="#38bdf8" />
                          </div>
                          <span>{registrationType === 'individual' ? 'Individual' : `Team: ${teamSizeMin}-${teamSizeMax}`}</span>
                        </div>
                        <div className="event-card-meta-item">
                          <div style={{ background: 'rgba(255, 255, 255, 0.1)', borderRadius: '6px', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Clock size={14} color="#38bdf8" />
                          </div>
                          <span>Deadline: {regDeadline ? new Date(regDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Set Date'}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="event-card-meta-item">
                          <div style={{ background: 'rgba(255, 255, 255, 0.1)', borderRadius: '6px', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CalendarDays size={14} color="#38bdf8" />
                          </div>
                          <span>
                            {(startDate || endDate) 
                              ? `${startDate ? new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}${endDate && endDate !== startDate ? ' - ' + new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}`
                              : 'Select Dates'
                            }
                          </span>
                        </div>
                        <div className="event-card-meta-item">
                          <div style={{ background: 'rgba(255, 255, 255, 0.1)', borderRadius: '6px', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Clock size={14} color="#38bdf8" />
                          </div>
                          <span>
                            {(startTime || endTime) ? `${startTime || ''}${endTime ? ` - ${endTime}` : ''}` : 'Select Time'}
                          </span>
                        </div>
                        <div className="event-card-meta-item">
                          <div style={{ background: 'rgba(255, 255, 255, 0.1)', borderRadius: '6px', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <MapPin size={14} color="#38bdf8" />
                          </div>
                          <span>
                            {(venue || venueCity || venueState) ? (
                              isUniversal ? (
                                `${venue || 'Venue'}${venueCity || venueState ? ` • ${venueCity ? venueCity + ', ' : ''}${venueState}` : ''}`
                              ) : (
                                venue || 'Venue'
                              )
                            ) : 'Select Venue'}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="event-card-footer-wrapper" style={{ marginTop: 'auto', paddingTop: '0.25rem' }}>
                    <div className="event-card-footer">
                      {mode === 'competition' ? (
                        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                          <span className="event-card-price" style={{ color: '#2eece2ff', fontSize: '1rem', padding: '6px 13px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            Register <ArrowRight size={16} />
                          </span>
                        </div>
                      ) : (
                        <>
                          <span className="event-card-price" style={{ fontSize: '1.2rem', color: '#ffffff' }}>{!price || price === '0' ? 'Free' : `₹${price}`}</span>
                          {seatingType === 'seats' ? (
                            <span className="seat-badge" style={{ fontSize: '0.85rem', padding: '0.5rem 0.8rem' }}><MapPin size={14} style={{ marginRight: "4px" }} /> Seated Layout</span>
                          ) : (
                            <span className="badge badge-success" style={{ fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}>{capacity ? `${capacity} left` : 'Available'}</span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <input
              type="file"
              ref={bannerInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleBannerUpload}
            />
          </div>

          {/* Right Side - Details */}
          <div className="create-right-panel">
            {mode === 'competition' ? (
               <div className="form-sections">
                {/* 1. BASIC DETAILS */}
                <div className="form-section">
                  <div className="section-title">BASIC DETAILS</div>
                  
                  <div className="field-row">
                    <Trophy className="field-icon" size={16} />
                    <span className="field-label">Category *</span>
                    <SelectDropdown
                      value={category === 'other' ? 'Other' : category.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      onChange={(val) => {
                        if (val === 'Other') setCategory('other')
                        else setCategory(val.toLowerCase().replace(/ /g, '_'))
                      }}
                      options={['Hackathon', 'Coding Competition', 'Case Study', 'Ideathon', 'Other']}
                      placeholder="Select Category"
                      className={`field-input ${!category ? 'empty-input' : ''}`}
                    />
                  </div>
                  {category === 'other' && (
                    <div className="field-row">
                      <Tag className="field-icon" size={16} />
                      <input type="text" value={customCategory} onChange={e => setCustomCategory(e.target.value)} placeholder="Enter custom category" className="field-input" style={{ width: '100%' }} />
                    </div>
                  )}

                  <div className="field-row" style={{ borderBottom: 'none' }}>
                    <AlignLeft className="field-icon" size={16} />
                    <span className="field-label" style={{ alignSelf: 'flex-start', paddingTop: '0.75rem' }}>Main Title (Description) *</span>
                    <textarea 
                      value={description} 
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Enter competition description..."
                      className="field-input description-field"
                      style={{ width: '100%', minHeight: '100px', resize: 'vertical' }}
                    />
                  </div>

                  {aboutSections.map((sec, idx) => (
                    <div key={idx} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '20px', padding: '1rem', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <span style={{ color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <AlignLeft size={14} color="#8b5cf6" /> Sub-section {idx + 1}
                        </span>
                        <button type="button" onClick={() => setAboutSections(aboutSections.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem' }}><Trash2 size={14} /> Remove</button>
                      </div>
                      <input type="text" className="field-input" value={sec.subtitle} onChange={e => { const newSec = [...aboutSections]; newSec[idx].subtitle = e.target.value; setAboutSections(newSec) }} placeholder="Subtitle (e.g. About the Hackathon, Eligibility)" style={{ width: '100%', marginBottom: '0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                      <textarea className="field-input description-field" value={sec.description} onChange={e => { const newSec = [...aboutSections]; newSec[idx].description = e.target.value; setAboutSections(newSec) }} placeholder="Paragraph content..." style={{ width: '100%', minHeight: '80px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                    </div>
                  ))}
                  <button type="button" onClick={() => setAboutSections([...aboutSections, { subtitle: '', description: '' }])} style={{ width: '100%', padding: '0.8rem', background: 'transparent', border: '1px dashed rgba(255,255,255,0.2)', color: 'white', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Plus size={16} color="#8b5cf6" /> Add Sub-section
                  </button>
                </div>

                {/* 2. DATES & LOCATION */}
                <div className="form-section">
                  <div className="section-title">DATES & LOCATION</div>
                  
                  <div className="field-row" style={{ display: 'flex', alignItems: 'center', flexWrap: 'nowrap' }}>
                    <CalendarDays className="field-icon" size={16} />
                    <span className="field-label">Dates *</span>
                    <div className="field-input-group" style={{ width: '100%' }}>
                      <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={`field-input ${!startDate ? 'empty-input' : ''}`} />
                      <span style={{ color: 'white', alignSelf: 'center', padding: '0 8px' }}>-</span>
                      <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={`field-input ${!endDate ? 'empty-input' : ''}`} />
                    </div>
                  </div>

                  <div className="field-row">
                    <Clock className="field-icon" size={16} />
                    <span className="field-label">Registration Deadline</span>
                    <input type="date" value={regDeadline} onChange={e => setRegDeadline(e.target.value)} className={`field-input ${!regDeadline ? 'empty-input' : ''}`} style={{ width: '100%' }} />
                  </div>

                  <div className="field-row toggle-row">
                    <Globe className="field-icon" size={16} color="#8b5cf6" />
                    <div style={{ flex: 1 }}>
                      <div className="field-label" style={{ marginBottom: 2 }}>Online Competition</div>
                      <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>No physical venue needed</div>
                    </div>
                    <label className="switch">
                      <input type="checkbox" checked={isOnline} onChange={e => setIsOnline(e.target.checked)} />
                      <span className="slider"></span>
                    </label>
                  </div>

                  {!isOnline && (
                    <div className="field-row">
                      <MapPin className="field-icon" size={16} />
                      <span className="field-label">Venue</span>
                      <input type="text" value={venue} onChange={e => setVenue(e.target.value)} placeholder="e.g. Innovation Lab, Block A" className="field-input" style={{ width: '100%' }} />
                    </div>
                  )}

                  {!isPureOrganizer && (
                    <>
                      <div className="field-row universal-row" style={{ borderBottom: 'none', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <Globe className="field-icon" size={16} color="#8b5cf6" />
                          <div>
                            <span className="field-label" style={{ fontWeight: 700, color: 'white', marginBottom: 2 }}>Open to All Colleges</span>
                            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Show in Community feed</div>
                          </div>
                        </div>
                        <label className="switch">
                          <input type="checkbox" checked={isUniversal} onChange={e => setIsUniversal(e.target.checked)} />
                          <span className="slider"></span>
                        </label>
                      </div>

                      {(!isOnline && (isUniversal || isPureOrganizer)) && (
                        <div className="field-row" style={{ display: 'flex', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                          <Map className="field-icon" size={16} />
                          <SelectDropdown
                            value={venueState}
                            onChange={(val) => { setVenueState(val); setVenueCity(''); }}
                            options={Object.keys(INDIAN_STATES_CITIES)}
                            placeholder="State"
                            className={`field-input ${!venueState ? 'empty-input' : ''}`}
                          />
                          <SelectDropdown
                            value={venueCity}
                            onChange={(val) => setVenueCity(val)}
                            options={venueState ? INDIAN_STATES_CITIES[venueState as keyof typeof INDIAN_STATES_CITIES] : []}
                            placeholder="City"
                            disabled={!venueState}
                            className={`field-input ${!venueCity ? 'empty-input' : ''}`}
                          />
                        </div>
                      )}

                      {user?.department && (
                        <>
                          <div className="field-row universal-row" style={{ borderBottom: 'none', justifyContent: 'space-between', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              <Building2 className="field-icon" size={16} color="#ec4899" />
                              <div>
                                <span className="field-label" style={{ fontWeight: 700, color: 'white', marginBottom: 2 }}>Department Only</span>
                                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Publish only for {user?.department}</div>
                              </div>
                            </div>
                            <label className="switch">
                              <input type="checkbox" checked={publishOnDepartment} onChange={e => setPublishOnDepartment(e.target.checked)} />
                              <span className="slider"></span>
                            </label>
                          </div>
                          {renderDepartmentTargeting()}
                        </>
                      )}
                    </>
                  )}    

                 
                </div>

                {/* 3. REGISTRATION SETTINGS */}
                <div className="form-section">
                  <div className="section-title">REGISTRATION</div>
                  
                  <div className="field-row">
                    <Users className="field-icon" size={16} />
                    <span className="field-label">Participation Type</span>
                    <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                      {['individual', 'team', 'both'].map(t => (
                        <button key={t} type="button" onClick={() => setRegistrationType(t as any)} style={{ flex: 1, padding: '8px', borderRadius: '8px', background: registrationType === t ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.05)', color: registrationType === t ? '#a78bfa' : '#a1a1aa', border: registrationType === t ? '1px solid #8b5cf6' : '1px solid transparent', cursor: 'pointer', textTransform: 'capitalize' }}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {registrationType !== 'individual' && (
                    <div className="field-row" style={{ display: 'flex', gap: '1rem' }}>
                      <div className="field-icon" style={{width: 16}} />
                      <div style={{ flex: 1 }}>
                        <span className="field-label" style={{ fontSize: '0.8rem' }}>Min Team Size</span>
                        <input type="number" value={teamSizeMin} onChange={e => setTeamSizeMin(e.target.value)} className="field-input" style={{ width: '100%' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <span className="field-label" style={{ fontSize: '0.8rem' }}>Max Team Size</span>
                        <input type="number" value={teamSizeMax} onChange={e => setTeamSizeMax(e.target.value)} className="field-input" style={{ width: '100%' }} />
                      </div>
                    </div>
                  )}

                  <div className="field-row">
                    <Users className="field-icon" size={16} />
                    <span className="field-label">Max Participants</span>
                    <input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} placeholder="500 (default)" className="field-input" style={{ width: '100%' }} />
                  </div>

                  <div className="field-row">
                    <IndianRupee className="field-icon" size={16} />
                    <span className="field-label">Entry Fee (Per Participant)</span>
                    <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0 for Free" className="field-input" style={{ width: '100%' }} />
                  </div>
                </div>

                {/* 3B. CUSTOM APPLICATION FORM */}
                <div className="form-section">
                  <div className="section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={16} color="#8b5cf6" />
                      <span>APPLICATION FORM (SCREENING QUESTIONS)</span>
                    </div>
                    {customForm && (
                      <span style={{ fontSize: '0.75rem', color: '#34d399', background: 'rgba(52, 211, 153, 0.1)', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                        Attached ({customForm.fields?.length} Questions)
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '14px', lineHeight: 1.5 }}>
                    Create a custom application form (like Google Forms) to collect student details, portfolios, GitHub links, tech stacks, or screening answers when participants register.
                  </div>

                  {!customForm ? (
                    <div
                      onClick={() => setIsFormBuilderOpen(true)}
                      style={{
                        padding: '18px',
                        borderRadius: '16px',
                        background: '#24242b',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        color: '#f4f4f5',
                        fontWeight: 600,
                        fontSize: '0.92rem',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#2c2c34')}
                      onMouseLeave={e => (e.currentTarget.style.background = '#24242b')}
                    >
                      <Plus size={18} color="#a78bfa" />
                      <span>Create Application Form for Competitors</span>
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: '18px 20px',
                        borderRadius: '16px',
                        background: '#24242b',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '12px',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{customForm.title}</span>
                          <span style={{ fontSize: '0.75rem', color: '#a78bfa', background: 'rgba(167, 139, 250, 0.15)', padding: '2px 8px', borderRadius: '10px' }}>
                            {customForm.fields.length} {customForm.fields.length === 1 ? 'Question' : 'Questions'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#a1a1aa', marginTop: '4px' }}>
                          {customForm.purpose || customForm.description || 'Custom questions enabled for team registration'}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => setIsFormPurposeOpen(true)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(56, 189, 248, 0.12)',
                            border: '1px solid rgba(56, 189, 248, 0.3)',
                            color: '#38bdf8',
                            padding: '6px 14px',
                            borderRadius: '10px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                          title="View Form Purpose & Preview"
                        >
                          Purpose & Preview
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsFormBuilderOpen(true)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            color: '#e4e4e7',
                            padding: '6px 12px',
                            borderRadius: '10px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Edit Questions
                        </button>

                        <button
                          type="button"
                          onClick={() => setCustomForm(null)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            color: '#ef4444',
                            padding: '6px 10px',
                            borderRadius: '10px',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                          }}
                          title="Remove Form"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. STAGES / ROUNDS */}
                <div className="form-section">
                  <div className="section-title">STAGES / ROUNDS</div>
                  {stages.map((stage, idx) => (
                    <div key={idx} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '20px', padding: '1rem', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <span style={{ color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: '16px', fontSize: '0.85rem' }}>Stage {idx + 1}</span>
                        </span>
                        <button type="button" onClick={() => setStages(stages.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}><Trash2 size={16} /> Remove</button>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <input type="text" className="field-input" value={stage.name} onChange={e => { const newStages = [...stages]; newStages[idx].name = e.target.value; setStages(newStages) }} placeholder="Stage name (e.g. Ideation Round)" style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                        <textarea className="field-input description-field" value={stage.description} onChange={e => { const newStages = [...stages]; newStages[idx].description = e.target.value; setStages(newStages) }} placeholder="Brief description (optional)" style={{ width: '100%', minHeight: '60px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                        
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <input type="date" className={`field-input ${!stage.start_date ? 'empty-input' : ''}`} value={stage.start_date} onChange={e => { const newStages = [...stages]; newStages[idx].start_date = e.target.value; setStages(newStages) }} style={{ flex: 1 }} />
                          <input type="date" className={`field-input ${!stage.end_date ? 'empty-input' : ''}`} value={stage.end_date} onChange={e => { const newStages = [...stages]; newStages[idx].end_date = e.target.value; setStages(newStages) }} style={{ flex: 1 }} />
                        </div>
                        
                        <div style={{ padding: '0 4px' }}>
                          <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>Submission Types</div>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {SUBMISSION_TYPES.map(st => (
                              <button
                                key={st.id}
                                type="button"
                                onClick={() => {
                                  const newStages = [...stages];
                                  const currentTypes = newStages[idx].submission_types || [];
                                  if (currentTypes.includes(st.id)) {
                                    newStages[idx].submission_types = currentTypes.filter(x => x !== st.id);
                                  } else {
                                    newStages[idx].submission_types = [...currentTypes, st.id];
                                  }
                                  setStages(newStages);
                                }}
                                style={{
                                  background: (stage.submission_types || []).includes(st.id) ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.05)',
                                  border: `1px solid ${(stage.submission_types || []).includes(st.id) ? 'rgba(139, 92, 246, 0.5)' : 'rgba(255,255,255,0.1)'}`,
                                  color: (stage.submission_types || []).includes(st.id) ? '#c4b5fd' : 'rgba(255,255,255,0.7)',
                                  padding: '6px 12px',
                                  borderRadius: '20px',
                                  fontSize: '0.85rem',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  transition: 'all 0.2s'
                                }}
                              >
                                {st.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => setStages([...stages, { name: '', description: '', start_date: '', end_date: '', submission_types: [] }])} style={{ width: '100%', padding: '12px', background: 'transparent', border: '1px dashed rgba(255,255,255,0.2)', color: 'white', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Plus size={16} color="#8b5cf6" /> Add Stage
                  </button>
                </div>

                {/* 5. PRIZES */}
                <div className="form-section">
                  <div className="section-title">PRIZES</div>
                  {prizes.map((prize, idx) => (
                    <div key={idx} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '20px', padding: '1rem', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <span style={{ color: idx === 0 ? '#fbbf24' : idx === 1 ? '#9ca3af' : idx === 2 ? '#b45309' : '#a1a1aa', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Award size={18} /> Prize {idx + 1}
                        </span>
                        <button type="button" onClick={() => setPrizes(prizes.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}><Trash2 size={16} /> Remove</button>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <input type="text" className="field-input" value={prize.rank} onChange={e => { const newPrizes = [...prizes]; newPrizes[idx].rank = e.target.value; setPrizes(newPrizes) }} placeholder="Rank (e.g. 1st Place)" style={{ flex: 1 }} />
                          <input type="number" className="field-input" value={prize.amount} onChange={e => { const newPrizes = [...prizes]; newPrizes[idx].amount = e.target.value; setPrizes(newPrizes) }} placeholder="Amount (₹)" style={{ flex: 1 }} />
                        </div>
                        <input type="text" className="field-input" value={prize.title} onChange={e => { const newPrizes = [...prizes]; newPrizes[idx].title = e.target.value; setPrizes(newPrizes) }} placeholder="Title (e.g. Winner, Runner Up)" style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                        <textarea className="field-input description-field" value={prize.description} onChange={e => { const newPrizes = [...prizes]; newPrizes[idx].description = e.target.value; setPrizes(newPrizes) }} placeholder="Description (optional)" style={{ width: '100%', minHeight: '60px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => setPrizes([...prizes, { rank: '', amount: '', title: '', description: '' }])} style={{ width: '100%', padding: '12px', background: 'transparent', border: '1px dashed rgba(255,255,255,0.2)', color: 'white', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Plus size={16} color="#8b5cf6" /> Add Prize
                  </button>
                </div>

                {/* 6. THEMES / TRACKS */}
                <div className="form-section">
                  <div className="section-title">THEMES / TRACKS</div>
                  
                  {themes.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '1rem' }}>
                      {themes.map(t => (
                        <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(139, 92, 246, 0.2)', color: '#a78bfa', padding: '4px 10px', borderRadius: '16px', fontSize: '0.85rem', fontWeight: 600 }}>
                          {t}
                          <button type="button" onClick={() => setThemes(themes.filter(theme => theme !== t))} style={{ background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer', padding: 0, display: 'flex' }}><X size={12} /></button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="field-row" style={{ borderBottom: 'none' }}>
                    <Tag className="field-icon" size={16} />
                    <input 
                      type="text" 
                      className="field-input" 
                      placeholder="Type a theme & press Enter" 
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = e.currentTarget.value.trim();
                          if (val && !themes.includes(val)) {
                            setThemes([...themes, val]);
                            e.currentTarget.value = '';
                          }
                        }
                      }}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} 
                    />
                  </div>
                  
                  <div style={{ fontSize: '0.75rem', color: '#71717a', fontWeight: 600, letterSpacing: '0.5px', marginBottom: '8px', marginTop: '12px' }}>SUGGESTIONS</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {THEME_SUGGESTIONS?.filter((t: string) => !themes.includes(t)).map((t: string) => (
                      <button key={t} type="button" onClick={() => setThemes([...themes, t])} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.05)', color: '#e4e4e7', padding: '4px 10px', borderRadius: '16px', fontSize: '0.85rem', border: 'none', cursor: 'pointer' }}>
                        {t} <Plus size={12} color="#71717a" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* 7. ELIGIBILITY */}
                <div className="form-section">
                  <div className="section-title">ELIGIBILITY</div>
                  <div className="field-row toggle-row">
                    <Shield className="field-icon" size={16} color="#8b5cf6" />
                    <div style={{ flex: 1 }}>
                      <div className="field-label" style={{ marginBottom: 2 }}>Open to All Students</div>
                      <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>No restrictions on year, branch, or CGPA</div>
                    </div>
                    <label className="switch">
                      <input type="checkbox" checked={eligibility.open_to_all} onChange={e => setEligibility({ ...eligibility, open_to_all: e.target.checked })} />
                      <span className="slider"></span>
                    </label>
                  </div>

                  {!eligibility.open_to_all && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 500, color: '#e4e4e7', marginBottom: '8px' }}>Year of Study</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {YEAR_OF_STUDY_OPTIONS?.map((y: string) => {
                            const active = (eligibility.year_of_study || []).includes(y)
                            return (
                              <button key={y} type="button" onClick={() => {
                                const arr = eligibility.year_of_study || []
                                setEligibility({ ...eligibility, year_of_study: active ? arr.filter(i => i !== y) : [...arr, y] })
                              }} style={{ background: active ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.05)', color: active ? '#a78bfa' : '#a1a1aa', border: active ? '1px solid #8b5cf6' : '1px solid transparent', padding: '6px 12px', borderRadius: '16px', fontSize: '0.85rem', cursor: 'pointer' }}>
                                {y}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                      
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 500, color: '#e4e4e7', marginBottom: '8px' }}>Branches / Departments</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {BRANCH_OPTIONS?.map((b: string) => {
                            const active = (eligibility.branches || []).includes(b)
                            return (
                              <button key={b} type="button" onClick={() => {
                                const arr = eligibility.branches || []
                                setEligibility({ ...eligibility, branches: active ? arr.filter(i => i !== b) : [...arr, b] })
                              }} style={{ background: active ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.05)', color: active ? '#a78bfa' : '#a1a1aa', border: active ? '1px solid #8b5cf6' : '1px solid transparent', padding: '6px 12px', borderRadius: '16px', fontSize: '0.85rem', cursor: 'pointer' }}>
                                {b}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                      
                      <div className="field-row" style={{ borderBottom: 'none' }}>
                        <span className="field-label" style={{ fontSize: '0.9rem', width: 'auto', marginRight: '16px' }}>Minimum CGPA (optional)</span>
                        <input type="number" className="field-input" step="0.1" value={eligibility.min_cgpa || ''} onChange={e => setEligibility({ ...eligibility, min_cgpa: Number(e.target.value) || undefined })} placeholder="e.g. 7.0" style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* 8. RULES & GUIDELINES */}
                <div className="form-section">
                  <div className="section-title">RULES & GUIDELINES</div>
                  {rulesSections.map((sec, idx) => (
                    <div key={idx} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '20px', padding: '1rem', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <span style={{ color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <AlignLeft size={14} color="#8b5cf6" /> Rule Section {idx + 1}
                        </span>
                        <button type="button" onClick={() => setRulesSections(rulesSections.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}><Trash2 size={16} /> Remove</button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <input type="text" className="field-input" value={sec.subtitle} onChange={e => { const newSec = [...rulesSections]; newSec[idx].subtitle = e.target.value; setRulesSections(newSec) }} placeholder="Subtitle (e.g. Code of Conduct)" style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                        <textarea className="field-input description-field" value={sec.description} onChange={e => { const newSec = [...rulesSections]; newSec[idx].description = e.target.value; setRulesSections(newSec) }} placeholder="Enter guidelines..." style={{ width: '100%', minHeight: '80px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => setRulesSections([...rulesSections, { subtitle: '', description: '' }])} style={{ width: '100%', padding: '12px', background: 'transparent', border: '1px dashed rgba(255,255,255,0.2)', color: 'white', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Plus size={16} color="#8b5cf6" /> Add Rule Section
                  </button>
                </div>

                {/* 9. CONTACT INFORMATION */}
                <div className="form-section">
                  <div className="section-title">CONTACT INFORMATION</div>
                  <div className="field-row">
                    <Mail className="field-icon" size={16} />
                    <span className="field-label">Contact Email</span>
                    <input type="email" className="field-input" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="organizer@example.com" style={{ width: '100%' }} />
                  </div>
                  <div className="field-row">
                    <Phone className="field-icon" size={16} />
                    <span className="field-label">Contact Phone Number</span>
                    <input type="tel" className="field-input" value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="+91 9876543210" style={{ width: '100%' }} />
                  </div>
                  <div className="field-row">
                    <MessageCircle className="field-icon" size={16} />
                    <span className="field-label">WhatsApp Group Link</span>
                    <input type="text" className="field-input" value={contactWhatsapp} onChange={e => setContactWhatsapp(e.target.value)} placeholder="https://chat.whatsapp.com/..." style={{ width: '100%' }} />
                  </div>
                </div>
               </div>
            ) : (
               <>

              {/* Details Section */}
              <div className="form-section">
                <div className="section-title">Details</div>

                {mode === 'event' && (
                  <div className="field-row" style={{ display: 'flex', alignItems: 'center', flexWrap: 'nowrap' }}>
                    <CalendarDays className="field-icon" size={16} />
                    <span className="field-label">Dates</span>
                    <div className="field-input-group" style={{ width: '100%' }}>
                      <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={`field-input ${!startDate ? 'empty-input' : ''}`} />
                      <span style={{ color: 'white', alignSelf: 'center' }}>-</span>
                      <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={`field-input ${!endDate ? 'empty-input' : ''}`} />
                    </div>
                  </div>
                )}

                <div className="field-row" style={{ display: 'flex', alignItems: 'center', flexWrap: 'nowrap' }}>
                  <Clock className="field-icon" size={16} />
                  <span className="field-label">Time</span>
                  <div className="field-input-group" style={{ width: '100%' }}>
                    <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className={`field-input ${!startTime ? 'empty-input' : ''}`} />
                    <span style={{ color: 'white', alignSelf: 'center' }}>-</span>
                    <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className={`field-input ${!endTime ? 'empty-input' : ''}`} />
                  </div>
                </div>

                {/* Normal Venue - hidden if universal is toggled, but always shown for announcements. Also hidden for Pure Organizers */}
                {(!isPureOrganizer && (!isUniversal || mode === 'announcement')) && (
                  <div className="field-row">
                    <MapPin className="field-icon" size={16} />
                    <span className="field-label">Venue</span>
                    <div className="field-input-group" style={{ width: '100%' }}>
                      <input
                        type="text"
                        value={venue}
                        onChange={e => setVenue(e.target.value)}
                        className="field-input"
                        placeholder="Select or type venue..."
                        list="venue-options"
                        style={{ width: '100%' }}
                      />
                      <datalist id="venue-options">
                        {venues.map(v => (
                          <option key={v.name} value={v.name} />
                        ))}
                      </datalist>
                    </div>
                  </div>
                )}

                {/* Organizer Venue & Location (in Details block) */}
                {isPureOrganizer && (
                  <>
                    <div className="field-row">
                      <MapPin className="field-icon" size={16} />
                      <span className="field-label">Venue</span>
                      <input type="text" className="field-input" placeholder="Specific location..." value={venue} onChange={e => setVenue(e.target.value)} style={{ width: '100%' }} />
                    </div>
                    <div className="field-row">
                      <Map className="field-icon" size={16} />
                      <span className="field-label">Location</span>
                      <div className="field-input-group">
                        <SelectDropdown
                          value={venueState}
                          onChange={(val) => { setVenueState(val); setVenueCity(''); }}
                          options={Object.keys(INDIAN_STATES_CITIES)}
                          placeholder="Select State"
                          className="field-input"
                        />
                        <SelectDropdown
                          value={venueCity}
                          onChange={(val) => setVenueCity(val)}
                          options={venueState ? INDIAN_STATES_CITIES[venueState as keyof typeof INDIAN_STATES_CITIES] : []}
                          placeholder="Select City"
                          disabled={!venueState}
                          className="field-input"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="field-row">
                  <Tag className="field-icon" size={16} />
                  <span className="field-label">Category</span>
                  <div className="field-input-group" style={{ flexDirection: 'column' }}>
                    <SelectDropdown
                      value={category === 'other' ? 'Other (Custom...)' : (category ? category.charAt(0).toUpperCase() + category.slice(1) : '')}
                      onChange={(val) => {
                        if (val === 'Other (Custom...)') setCategory('other')
                        else setCategory(val.toLowerCase())
                      }}
                      options={[...categories.map(c => c.name.charAt(0).toUpperCase() + c.name.slice(1)), 'Other (Custom...)']}
                      placeholder="Select category"
                      className={`field-input ${!category ? 'empty-input' : ''}`}
                    />
                    {category === 'other' && (
                      <input
                        type="text"
                        value={customCategory}
                        onChange={e => setCustomCategory(e.target.value)}
                        className="field-input"
                        placeholder="Type custom category..."
                        style={{ marginTop: '0.5rem' }}
                      />
                    )}
                  </div>
                </div>

                <div className="field-row" style={{ borderBottom: 'none' }}>
                  <AlignLeft className="field-icon" size={16} />
                  <span className="field-label" style={{ alignSelf: 'flex-start', paddingTop: '0.75rem' }}>Description</span>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="description-field"
                    placeholder="Describe the event..."
                  />
                </div>
              </div>

              {/* Speaker Section */}
              {mode === 'event' && (
                <div className="form-section">
                  <div className="section-title">Speaker (Optional)</div>
                  
                  <div className="field-row">
                    <Users className="field-icon" size={16} />
                    <span className="field-label">Speaker Name</span>
                    <input 
                      type="text" 
                      value={speakerName} 
                      onChange={e => setSpeakerName(e.target.value)} 
                      placeholder="e.g. John Doe" 
                      className="field-input" 
                      style={{ width: '100%' }} 
                    />
                  </div>
                  
                  <div className="field-row" style={{ borderBottom: 'none' }}>
                    <Building2 className="field-icon" size={16} />
                    <span className="field-label">Speaker Organisation</span>
                    <input 
                      type="text" 
                      value={speakerOrg} 
                      onChange={e => setSpeakerOrg(e.target.value)} 
                      placeholder="e.g. Google" 
                      className="field-input" 
                      style={{ width: '100%' }} 
                    />
                  </div>
                </div>
              )}

              {/* Announcement Add-ons */}
              {mode === 'announcement' && !isPureOrganizer && user?.department && (
                <div className="form-section">
                  <div className="field-row universal-row" style={{ borderBottom: 'none', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <Building2 className="field-icon" size={16} color="#ec4899" />
                      <div>
                        <span className="field-label" style={{ fontWeight: 700, color: 'white' }}>Department Only</span>
                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Publish only for {user.department}</div>
                      </div>
                    </div>
                    <label className="switch">
                      <input type="checkbox" checked={publishOnDepartment} onChange={e => setPublishOnDepartment(e.target.checked)} />
                      <span className="slider"></span>
                    </label>
                  </div>
                  {renderDepartmentTargeting()}
                </div>
              )}

              {/* Event Specific Add-ons */}
              {mode === 'event' && (
                <>
                  {!isPureOrganizer && (
                    <div className="form-section">

                      <div className="field-row universal-row" style={{ borderBottom: 'none', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <Globe className="field-icon" size={16} />
                          <div>
                            <span className="field-label" style={{ fontWeight: 700, color: 'white' }}>Universal Event</span>
                            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Show to all colleges in Community</div>
                          </div>
                        </div>
                        <label className="switch">
                          <input type="checkbox" checked={isUniversal} onChange={e => setIsUniversal(e.target.checked)} />
                          <span className="slider"></span>
                        </label>
                      </div>

                      {isUniversal && (
                        <div id="universal-location-details" style={{ marginTop: '0.5rem', paddingTop: '0.75rem' }}>
                        <div className="field-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
                              <MapPin className="field-icon" size={16} />
                              <span className="field-label">Venue</span>
                              <input type="text" className="field-input" placeholder="Specific location..." value={venue} onChange={e => setVenue(e.target.value)} style={{ width: '100%' }} />
                            </div>
                            <div className="field-row" style={{ paddingTop: '0.75rem', borderBottom: 'none' }}>
                              <Map className="field-icon" size={16} />
                              <span className="field-label">Location</span>
                              <div className="field-input-group">
                                <SelectDropdown
                                  value={venueState}
                                  onChange={(val) => { setVenueState(val); setVenueCity(''); }}
                                  options={Object.keys(INDIAN_STATES_CITIES)}
                                  placeholder="Select State"
                                  className={`field-input ${!venueState ? 'empty-input' : ''}`}
                                />
                                <SelectDropdown
                                  value={venueCity}
                                  onChange={(val) => setVenueCity(val)}
                                  options={venueState ? INDIAN_STATES_CITIES[venueState as keyof typeof INDIAN_STATES_CITIES] : []}
                                  placeholder="Select City"
                                  disabled={!venueState}
                                  className={`field-input ${!venueCity ? 'empty-input' : ''}`}
                                />
                              </div>
                            </div>
                          </div>
                      )}

                      {user?.department && (
                        <>
                          <div className="field-row universal-row" style={{ borderBottom: 'none', justifyContent: 'space-between', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              <Building2 className="field-icon" size={16} color="#ec4899" />
                              <div>
                                <span className="field-label" style={{ fontWeight: 700, color: 'white' }}>Department Only</span>
                                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Publish only for {user?.department}</div>
                              </div>
                            </div>
                            <label className="switch">
                              <input type="checkbox" checked={publishOnDepartment} onChange={e => setPublishOnDepartment(e.target.checked)} />
                              <span className="slider"></span>
                            </label>
                          </div>
                          {renderDepartmentTargeting()}
                        </>
                      )}
                    </div>
                  )}

                  <div className="form-section">
                    <div className="section-title">Event Operations</div>

                    <div className="field-row">
                      <CreditCard className="field-icon" size={16} />
                      <span className="field-label">Refunds</span>
                      <SelectDropdown
                        value={refundPolicy === 'no_refund' ? 'No Refund' : refundPolicy === '24_hours' ? '24 Hours Before' : ''}
                        onChange={(val) => {
                          if (val === 'No Refund') setRefundPolicy('no_refund')
                          else if (val === '24 Hours Before') setRefundPolicy('24_hours')
                          else setRefundPolicy('')
                        }}
                        options={['No Refund', '24 Hours Before']}
                        placeholder="Select Refund Policy"
                        disabled={Number(price) === 0 && price !== ''}
                        className={`field-input ${(Number(price) === 0 && price !== '') ? 'blurred-disabled' : ''}`}
                      />
                    </div>

                    <div className="field-row" style={{ borderBottom: 'none' }}>
                      <Users className="field-icon" size={16} />
                      <span className="field-label">Capacity</span>
                      <input
                        type="number"
                        value={capacity}
                        onChange={e => setCapacity(e.target.value)}
                        className={`field-input ${seatingType === 'seats' ? 'blurred-disabled' : ''}`}
                        placeholder="Max attendees"
                        min="1"
                        disabled={seatingType === 'seats'}
                      />
                    </div>
                  </div>

                  <div className="form-section">
                    <div className="section-title">Ticketing</div>
                    <div className="seating-cards">
                      <div
                        className={`seating-card ${seatingType === 'simple' ? 'active' : ''}`}
                        onClick={() => setSeatingType('simple')}
                      >
                        <h4 style={{ display: "flex", alignItems: "center", gap: "8px" }}><Ticket className="field-icon" size={18} /> Simple</h4>
                        <p>Set price, no layout</p>
                      </div>
                      <div
                        className={`seating-card ${seatingType === 'seats' ? 'active' : ''}`}
                        onClick={() => setSeatingType('seats')}
                      >
                        <h4 style={{ display: "flex", alignItems: "center", gap: "8px" }}><MapPin className="field-icon" size={18} /> Seated</h4>
                        <p>Visual layout editor</p>
                      </div>
                    </div>

                    {seatingType === 'simple' && (
                      <div style={{ marginTop: '1rem' }}>
                        <div className="field-row" style={{ borderBottom: 'none' }}>
                          <IndianRupee className="field-icon" size={16} />
                          <span className="field-label">Price</span>
                          <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="field-input" placeholder="0 for Free" min="0" />
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              </>
            )}
              <button
                type="submit"
                className={`create-button ${mode === 'announcement' ? 'announcement' : ''}`}
                disabled={createMutation.isPending}
                style={createMutation.isPending ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
              >
                {(createMutation.isPending || createCompMutation.isPending)
                  ? 'Creating...'
                  : mode === 'competition' ? 'Create Competition'
                  : (mode === 'event' && seatingType === 'seats'
                    ? 'Continue to Seat Editor'
                    : `Create ${mode === 'event' ? 'Event' : 'Announcement'}`)}
              </button>
            </div>
          </form>
        </div>
      </div>
      </div>
      </div>

      <CustomFormBuilderModal
        isOpen={isFormBuilderOpen}
        onClose={() => setIsFormBuilderOpen(false)}
        initialConfig={customForm}
        competitionTitle={title || 'Competition'}
        onSave={(cfg) => setCustomForm(cfg)}
      />

      <CustomFormPurposeModal
        isOpen={isFormPurposeOpen}
        onClose={() => setIsFormPurposeOpen(false)}
        formConfig={customForm}
        onEdit={() => setIsFormBuilderOpen(true)}
      />
    </>
  )
}
