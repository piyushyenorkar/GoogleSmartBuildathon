import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Building2, MapPin, BookOpen, CheckCircle, ArrowLeft, ArrowRight, Plus, X, GraduationCap, Globe, Phone, Mail, Calendar, Users, ChevronDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { INDIAN_STATES_CITIES } from '@/lib/constants'
import Strands from '@/components/ui/Strands'
import { SelectDropdown } from '@/components/ui/SelectDropdown'
import './CollegeOnboarding.css'

const COMMON_COURSES = ['B.Tech', 'B.E.', 'BCA', 'BBA', 'B.Sc', 'MBA', 'M.Tech', 'M.E.', 'MCA', 'M.Sc', 'Diploma', 'B.Pharm', 'B.Arch']

const COMMON_DEPARTMENTS: Record<string, string[]> = {
  'B.Tech': ['Computer Engineering', 'Information Technology', 'CSE AI & ML', 'CSE Data Science', 'Electronics & Telecommunication', 'Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering', 'Chemical Engineering', 'Biotechnology Engineering'],
  'B.E.': ['Computer Engineering', 'Information Technology', 'Electronics & Telecommunication', 'Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering'],
  'BCA': ['Computer Applications'],
  'BBA': ['Business Administration', 'Marketing', 'Finance', 'Human Resources'],
  'B.Sc': ['Computer Science', 'Physics', 'Chemistry', 'Mathematics', 'Biology', 'Biotechnology'],
  'MBA': ['Marketing', 'Finance', 'HR Management', 'Operations', 'Business Analytics', 'IT Management'],
  'M.Tech': ['Computer Engineering', 'AI & ML', 'Data Science', 'VLSI Design', 'Structural Engineering'],
  'M.E.': ['Computer Engineering', 'Information Technology', 'Electronics & Telecommunication', 'Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering'],
  'MCA': ['Computer Applications'],
  'M.Sc': ['Computer Science', 'Physics', 'Chemistry', 'Mathematics', 'Biotechnology'],
  'Diploma': ['Computer Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering', 'Electronics'],
  'B.Pharm': ['Pharmacy'],
  'B.Arch': ['Architecture'],
}

interface CourseEntry {
  name: string
  departments: string[]
  duration_years: number
  enableSections: boolean
  departmentSections: Record<string, Record<string, string[]>>
  // e.g. { "Computer Engineering": { "1": ["A","B"], "2": ["A"] } }
  isCustom?: boolean
}

type Step = 1 | 2 | 3 | 4

export default function CollegeOnboarding() {
  const [step, setStep] = useState<Step>(1)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [canScrollDown, setCanScrollDown] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Step 1: Identity
  const [collegeName, setCollegeName] = useState('')
  const [collegeEmail, setCollegeEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)

  // Step 2: Location
  const [selectedState, setSelectedState] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [address, setAddress] = useState('')
  const [affiliation, setAffiliation] = useState('')
  const [establishedYear, setEstablishedYear] = useState('')
  const [studentCount, setStudentCount] = useState('')

  // Step 3: Academic Structure
  const [courses, setCourses] = useState<CourseEntry[]>([{ name: '', departments: [], duration_years: 4, enableSections: true, departmentSections: {} }])
  const [customDeptInputs, setCustomDeptInputs] = useState<Record<number, string>>({})

  const cities = selectedState ? INDIAN_STATES_CITIES[selectedState] || [] : []

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
      setCanScrollDown(scrollHeight - scrollTop > clientHeight + 10)
    }
  }

  useEffect(() => {
    checkScroll()
    const timer = setTimeout(checkScroll, 300)
    window.addEventListener('resize', checkScroll)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', checkScroll)
    }
  }, [step, courses, customDeptInputs])

  // ── Validation ────────────────────────────────────
  const validateStep = (s: Step): string | null => {
    if (s === 1) {
      if (!collegeName.trim()) return 'College name is required'
      if (!collegeEmail.trim()) return 'Official email is required'
      if (!/\S+@\S+\.\S+/.test(collegeEmail)) return 'Please enter a valid email'
      if (!contactPhone.trim()) return 'Contact phone is required'
      if (contactPhone.replace(/\D/g, '').length < 10) return 'Please enter a valid phone number'
      if (!logoFile) return 'College logo is required'
    }
    if (s === 2) {
      if (!selectedState) return 'Please select a state'
      if (!selectedCity) return 'Please select a city'
      if (!affiliation.trim()) return 'University/Affiliation is required'
    }
    if (s === 3) {
      const validCourses = courses.filter(c => c.name && c.departments.length > 0)
      if (validCourses.length === 0) return 'Add at least one course with departments'
    }
    return null
  }

  const handleNext = () => {
    const err = validateStep(step)
    if (err) {
      setError(err)
      return
    }
    setError('')
    setStep((s) => Math.min(s + 1, 4) as Step)
  }

  const handleBack = () => {
    setError('')
    setStep((s) => Math.max(s - 1, 1) as Step)
  }

  // ── Course/Dept Management ────────────────────────
  const updateCourseName = (idx: number, name: string) => {
    setCourses(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], name }
      return next
    })
  }

  const toggleDept = (courseIdx: number, dept: string) => {
    setCourses(prev => {
      const next = [...prev]
      const deps = next[courseIdx].departments
      if (deps.includes(dept)) {
        // Remove from departments list
        next[courseIdx] = { ...next[courseIdx], departments: deps.filter(d => d !== dept) }
        
        // Cleanup section configurations so it doesn't persist in Review/DB
        const newSecs = { ...next[courseIdx].departmentSections }
        delete newSecs[dept]
        next[courseIdx].departmentSections = newSecs
      } else {
        next[courseIdx] = { ...next[courseIdx], departments: [...deps, dept] }
      }
      return next
    })
  }

  const addCustomDept = (courseIdx: number) => {
    const val = (customDeptInputs[courseIdx] || '').trim()
    if (!val) return
    setCourses(prev => {
      const next = [...prev]
      if (!next[courseIdx].departments.includes(val)) {
        next[courseIdx] = { ...next[courseIdx], departments: [...next[courseIdx].departments, val] }
      }
      return next
    })
    setCustomDeptInputs(prev => ({ ...prev, [courseIdx]: '' }))
  }

  const addCourse = () => {
    setCourses(prev => [...prev, { name: '', departments: [], duration_years: 4, enableSections: true, departmentSections: {} }])
  }

  const removeCourse = (idx: number) => {
    if (courses.length <= 1) return
    setCourses(prev => prev.filter((_, i) => i !== idx))
  }

  const updateDuration = (courseIdx: number, years: number) => {
    setCourses(prev => {
      const next = [...prev]
      next[courseIdx] = { ...next[courseIdx], duration_years: Math.max(1, Math.min(8, years)) }
      return next
    })
  }

  const toggleSections = (courseIdx: number) => {
    setCourses(prev => {
      const next = [...prev]
      next[courseIdx] = { ...next[courseIdx], enableSections: !next[courseIdx].enableSections }
      if (!next[courseIdx].enableSections) {
        next[courseIdx] = { ...next[courseIdx], departmentSections: {} }
      }
      return next
    })
  }

  const addSection = (courseIdx: number, dept: string, year: string, sectionName: string) => {
    if (!sectionName.trim()) return
    setCourses(prev => {
      const next = [...prev]
      const deptSec = { ...next[courseIdx].departmentSections }
      if (!deptSec[dept]) deptSec[dept] = {}
      const yearSec = { ...deptSec[dept] }
      const existing = yearSec[year] || []
      if (!existing.includes(sectionName.trim())) {
        yearSec[year] = [...existing, sectionName.trim()]
      }
      deptSec[dept] = yearSec
      next[courseIdx] = { ...next[courseIdx], departmentSections: deptSec }
      return next
    })
  }

  const removeSection = (courseIdx: number, dept: string, year: string, sectionName: string) => {
    setCourses(prev => {
      const next = [...prev]
      const deptSec = { ...next[courseIdx].departmentSections }
      if (!deptSec[dept]?.[year]) return next
      const yearSec = { ...deptSec[dept] }
      yearSec[year] = yearSec[year].filter((s: string) => s !== sectionName)
      deptSec[dept] = yearSec
      next[courseIdx] = { ...next[courseIdx], departmentSections: deptSec }
      return next
    })
  }

  const initDefaultSections = (courseIdx: number, dept: string, duration: number) => {
    setCourses(prev => {
      const next = [...prev]
      const deptSec = { ...next[courseIdx].departmentSections }
      if (!deptSec[dept]) {
        const yearSections: Record<string, string[]> = {}
        for (let y = 1; y <= duration; y++) {
          yearSections[String(y)] = ['A']
        }
        deptSec[dept] = yearSections
        next[courseIdx] = { ...next[courseIdx], departmentSections: deptSec }
      }
      return next
    })
  }

  // ── Submit ────────────────────────────────────────
  const handleSubmit = async () => {
    const err = validateStep(3)
    if (err) {
      setError(err)
      return
    }
    setError('')
    setSubmitting(true)

    try {
      const validCourses = courses.filter(c => c.name && c.departments.length > 0)

      let uploadedLogoUrl = null
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop()
        const fileName = `college-logo-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`
        const path = `logos/${fileName}`
        const { error: uploadErr } = await supabase.storage.from('event-banners').upload(path, logoFile)
        if (uploadErr) throw new Error(`Failed to upload college logo: ${uploadErr.message}`)
        const { data: urlData } = supabase.storage.from('event-banners').getPublicUrl(path)
        uploadedLogoUrl = urlData.publicUrl
      }

      const { error: insertError } = await supabase
        .from('college_requests')
        .insert({
          college_name: collegeName.trim(),
          college_email: collegeEmail.trim(),
          contact_phone: contactPhone.trim(),
          website_url: websiteUrl.trim() || null,
          logo_url: uploadedLogoUrl,
          state: selectedState,
          city: selectedCity,
          address: address.trim() || null,
          affiliation: affiliation.trim(),
          established_year: establishedYear ? parseInt(establishedYear) : null,
          student_count: studentCount ? parseInt(studentCount) : null,
          courses: validCourses,
        })

      if (insertError) throw insertError
      setSubmitted(true)
    } catch (err: any) {
      console.error('[CollegeOnboarding] Submit error:', err)
      setError(err?.message || 'Failed to submit. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const validCourses = courses.filter(c => c.name && c.departments.length > 0)

  // ── Success Screen ────────────────────────────────
  if (submitted) {
    return (
      <div className="college-onboard-page">
        <div className="college-onboard-bg">
          <Strands
            colors={["#F97316", "#7C3AED", "#06B6D4"]}
            count={3}
            speed={0.5}
            amplitude={1}
            waviness={1}
            thickness={0.7}
            glow={1.2}
            taper={3}
            spread={1}
            intensity={0.55}
            saturation={2}
            opacity={1}
            scale={1.5}
            glass={false}
            refraction={1}
            dispersion={1}
            glassSize={1}
            hueShift={0}
          />
        </div>
        <div className="college-onboard-content">
          <motion.div className="college-onboard-card" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="co-success">
              <div className="co-success-icon">
                <CheckCircle size={40} color="#10b981" />
              </div>
              <h2>Request Submitted!</h2>
              <p>
                Your college registration request for <strong>{collegeName}</strong> has been submitted successfully.
                Our team will verify your college within 2-3 business days. You'll receive the admin credentials once approved.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  // ── Main Form ─────────────────────────────────────
  return (
    <div className="college-onboard-page">
      <div className="college-onboard-bg">
        <Strands
          colors={["#F97316", "#7C3AED", "#06B6D4"]}
          count={3}
          speed={0.5}
          amplitude={1}
          waviness={1}
          thickness={0.7}
          glow={1.2}
          taper={3}
          spread={1}
          intensity={0.55}
          saturation={2}
          opacity={1}
          scale={1.5}
          glass={false}
          refraction={1}
          dispersion={1}
          glassSize={1}
          hueShift={0}
        />
      </div>
      <div className="college-onboard-content" style={{ position: 'relative' }}>
        <motion.div
          className="college-onboard-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          ref={scrollRef}
          onScroll={checkScroll}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '2rem' }}>
            <img src="/plutocampus.png" alt="PlutoCampus Logo" style={{ height: '28px', objectFit: 'contain', marginBottom: '0.4rem' }} />
            <h1 style={{ marginBottom: '0.25rem' }}>Register Your College</h1>
            <p className="subtitle" style={{ marginBottom: 0 }}>Join PlutoCampus and bring events to your campus</p>
          </div>

          {/* Step Indicator */}
          <div className="step-indicator">
            {[1, 2, 3, 4].map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < 3 ? 1 : 'none' }}>
                <div className={`step-dot ${step === s ? 'active' : step > s ? 'done' : ''}`}>
                  {step > s ? '✓' : s}
                </div>
                {i < 3 && <div className={`step-line ${step > s ? 'done' : ''}`} />}
              </div>
            ))}
          </div>

          {error && <div className="co-error">{error}</div>}

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* ── Step 1: Identity ────────────────────── */}
              {step === 1 && (
                <div>
                  <div className="co-field">
                    <label>College Name <span className="required">*</span></label>
                    <input type="text" placeholder="Your College Name" value={collegeName} onChange={e => setCollegeName(e.target.value)} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '1.5rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div className="co-field" style={{ marginBottom: 0 }}>
                      <label>College Logo <span className="required">*</span></label>
                      <input
                        type="file"
                        accept="image/*"
                        ref={logoInputRef}
                        style={{ display: 'none' }}
                        onChange={e => {
                          const file = e.target.files?.[0]
                          if (file) {
                            setLogoFile(file)
                            setLogoPreview(URL.createObjectURL(file))
                          }
                        }}
                      />
                      <div
                        onClick={() => logoInputRef.current?.click()}
                        style={{ width: '120px', height: '120px', border: '2px dashed rgba(255,255,255,0.2)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', background: 'rgba(255,255,255,0.02)' }}
                      >
                        {logoPreview ? (
                          <img src={logoPreview} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,0.4)' }}>
                            <Plus size={24} />
                            <span style={{ fontSize: '0.7rem' }}>Upload</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div className="co-field" style={{ marginBottom: 0 }}>
                        <label>Official Email <span className="required">*</span></label>
                        <input type="email" placeholder="admin@college.edu.in" value={collegeEmail} onChange={e => setCollegeEmail(e.target.value)} />
                      </div>
                      <div className="co-field" style={{ marginBottom: 0 }}>
                        <label>Contact Phone <span className="required">*</span></label>
                        <input type="tel" placeholder="+91 98765 43210" value={contactPhone} onChange={e => setContactPhone(e.target.value)} />
                      </div>
                    </div>
                  </div>

                  <div className="co-field">
                    <label>College Website</label>
                    <input type="url" placeholder="https://www.college.edu.in" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} />
                  </div>
                </div>
              )}

              {/* ── Step 2: Location & Affiliation ──────── */}
              {step === 2 && (
                <div>
                  <div className="co-form-grid">
                    <div className="co-field">
                      <label>State <span className="required">*</span></label>
                      <SelectDropdown
                        value={selectedState}
                        onChange={v => { setSelectedState(v); setSelectedCity('') }}
                        options={Object.keys(INDIAN_STATES_CITIES)}
                        placeholder="Select State"
                        icon={<MapPin size={18} />}
                        className="co-select-dropdown"
                      />
                    </div>
                    <div className="co-field">
                      <label>City <span className="required">*</span></label>
                      <SelectDropdown
                        value={selectedCity}
                        onChange={setSelectedCity}
                        options={cities}
                        placeholder="Select City"
                        icon={<Building2 size={18} />}
                        disabled={!selectedState}
                        className="co-select-dropdown"
                      />
                    </div>
                  </div>
                  <div className="co-field">
                    <label>Full Address</label>
                    <textarea placeholder="College road, area, pin code..." value={address} onChange={e => setAddress(e.target.value)} />
                  </div>
                  <div className="co-field">
                    <label>University / Affiliation <span className="required">*</span></label>
                    <input type="text" placeholder="e.g. Mumbai University, AICTE" value={affiliation} onChange={e => setAffiliation(e.target.value)} />
                  </div>
                  <div className="co-form-grid">
                    <div className="co-field">
                      <label>Established Year</label>
                      <input type="number" placeholder="e.g. 2005" min="1800" max={new Date().getFullYear()} value={establishedYear} onChange={e => setEstablishedYear(e.target.value)} />
                    </div>
                    <div className="co-field">
                      <label>Approx. Student Count</label>
                      <input type="number" placeholder="e.g. 3000" value={studentCount} onChange={e => setStudentCount(e.target.value)} />
                    </div>
                  </div>
                </div>
              )}

              {/* ── Step 3: Academic Structure ──────────── */}
              {step === 3 && (
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                    Add the courses your college offers, set course duration, select departments, and optionally configure sections (divisions) per year.
                  </p>
                  {courses.map((course, idx) => (
                    <div className="course-block" key={idx}>
                      <div className="course-block-header">
                        <h3>Course {idx + 1}</h3>
                        {courses.length > 1 && (
                          <button className="remove-course-btn" onClick={() => removeCourse(idx)}>
                            <X size={12} /> Remove
                          </button>
                        )}
                      </div>
                      <div className="co-field" style={{ marginBottom: '0.75rem' }}>
                        <label>Course Name <span className="required">*</span></label>
                        <SelectDropdown
                          value={course.isCustom ? 'Other (type below)' : course.name}
                          onChange={v => {
                            if (v === 'Other (type below)') {
                              setCourses(prev => {
                                const next = [...prev]
                                next[idx] = { ...next[idx], name: '', isCustom: true }
                                return next
                              })
                            } else {
                              setCourses(prev => {
                                const next = [...prev]
                                next[idx] = { ...next[idx], name: v, isCustom: false }
                                return next
                              })
                              updateCourseName(idx, v)
                            }
                          }}
                          options={[...COMMON_COURSES, 'Other (type below)']}
                          placeholder="Select Course"
                          icon={<GraduationCap size={18} />}
                          className="co-select-dropdown"
                        />
                        {course.isCustom && (
                          <input
                            type="text"
                            placeholder="Enter custom course name"
                            value={course.name}
                            style={{ marginTop: '0.5rem' }}
                            onChange={e => {
                              setCourses(prev => {
                                const next = [...prev]
                                next[idx] = { ...next[idx], name: e.target.value }
                                return next
                              })
                            }}
                          />
                        )}
                      </div>

                      {/* Duration */}
                      {course.name && (
                        <div className="co-field" style={{ marginBottom: '0.75rem' }}>
                          <label>Course Duration (Years) <span className="required">*</span></label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                              type="number"
                              min={1}
                              max={8}
                              value={course.duration_years}
                              onChange={e => updateDuration(idx, parseInt(e.target.value) || 4)}
                              style={{ width: '80px' }}
                            />
                            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
                              {course.duration_years === 1 ? '1 year' : `${course.duration_years} years`}
                            </span>
                          </div>
                        </div>
                      )}

                      {course.name && (
                        <>
                          <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'rgba(255,255,255,0.4)', marginBottom: '0.3rem' }}>
                            Departments
                          </label>
                          <div className="dept-chips">
                            {(COMMON_DEPARTMENTS[course.name] || []).map(dept => (
                              <button
                                key={dept}
                                className={`dept-chip ${course.departments.includes(dept) ? 'selected' : ''}`}
                                onClick={() => {
                                  toggleDept(idx, dept)
                                  // Initialize default sections when a dept is selected
                                  if (!course.departments.includes(dept) && course.enableSections) {
                                    initDefaultSections(idx, dept, course.duration_years)
                                  }
                                }}
                              >
                                {course.departments.includes(dept) ? <CheckCircle size={13} /> : <Plus size={13} />}
                                {dept}
                              </button>
                            ))}
                            {/* Show custom departments not in common list */}
                            {course.departments
                              .filter(d => !(COMMON_DEPARTMENTS[course.name] || []).includes(d))
                              .map(dept => (
                                <button key={dept} className="dept-chip selected" onClick={() => toggleDept(idx, dept)}>
                                  <X size={13} /> {dept}
                                </button>
                              ))
                            }
                          </div>
                          <div className="add-dept-row">
                            <input
                              type="text"
                              placeholder="Add custom department..."
                              value={customDeptInputs[idx] || ''}
                              onChange={e => setCustomDeptInputs(prev => ({ ...prev, [idx]: e.target.value }))}
                              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomDept(idx) } }}
                            />
                            <button className="add-dept-btn" onClick={() => addCustomDept(idx)}>
                              <Plus size={14} /> Add
                            </button>
                          </div>
                        </>
                      )}

                      {/* Sections Toggle & Configuration */}
                      {course.name && course.departments.length > 0 && (
                        <div style={{ marginTop: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                            <label style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                              Enable Sections / Divisions
                            </label>
                            <label className="switch" style={{ transform: 'scale(0.8)' }}>
                              <input type="checkbox" checked={course.enableSections} onChange={() => toggleSections(idx)} />
                              <span className="slider"></span>
                            </label>
                            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>
                              {course.enableSections ? 'On' : 'Off — no sections'}
                            </span>
                          </div>

                          {course.enableSections && course.departments.map(dept => {
                            // Init sections if not yet
                            if (!course.departmentSections[dept]) {
                              setTimeout(() => initDefaultSections(idx, dept, course.duration_years), 0)
                            }
                            const deptYears = course.departmentSections[dept] || {}
                            return (
                              <div key={dept} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '0.75rem', marginBottom: '0.5rem' }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.5rem' }}>
                                  {dept}
                                </div>
                                {Array.from({ length: course.duration_years }, (_, y) => y + 1).map(year => {
                                  const yearStr = String(year)
                                  const sections = deptYears[yearStr] || []
                                  const SUGGESTED = ['A', 'B', 'C', 'D', 'E', 'F']
                                  return (
                                    <div key={year} style={{ marginBottom: '0.4rem', paddingLeft: '0.5rem' }}>
                                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.25rem', fontWeight: 500 }}>
                                        Year {year}
                                      </div>
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', alignItems: 'center' }}>
                                        {sections.map((sec: string) => (
                                          <span
                                            key={sec}
                                            style={{
                                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                                              padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem',
                                              background: 'rgba(124, 58, 237, 0.15)', color: '#a78bfa', fontWeight: 500
                                            }}
                                          >
                                            {sec}
                                            <X
                                              size={10}
                                              style={{ cursor: 'pointer', opacity: 0.7 }}
                                              onClick={() => removeSection(idx, dept, yearStr, sec)}
                                            />
                                          </span>
                                        ))}
                                        {/* Quick-add buttons for suggested letters */}
                                        {SUGGESTED.filter(s => !sections.includes(s)).slice(0, 2).map(s => (
                                          <button
                                            key={s}
                                            onClick={() => addSection(idx, dept, yearStr, s)}
                                            style={{
                                              padding: '2px 8px', borderRadius: '12px', fontSize: '0.68rem',
                                              border: '1px dashed rgba(255,255,255,0.15)', background: 'transparent',
                                              color: 'rgba(255,255,255,0.3)', cursor: 'pointer'
                                            }}
                                          >
                                            +{s}
                                          </button>
                                        ))}
                                        {/* Custom section input */}
                                        <input
                                          type="text"
                                          placeholder="Custom..."
                                          style={{
                                            width: '80px', padding: '2px 6px', borderRadius: '8px',
                                            fontSize: '0.68rem', border: '1px solid rgba(255,255,255,0.1)',
                                            background: 'rgba(255,255,255,0.03)', color: '#fff'
                                          }}
                                          onKeyDown={e => {
                                            if (e.key === 'Enter') {
                                              e.preventDefault()
                                              addSection(idx, dept, yearStr, (e.target as HTMLInputElement).value)
                                                ; (e.target as HTMLInputElement).value = ''
                                            }
                                          }}
                                        />
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                  <button className="add-course-btn" onClick={addCourse}>
                    <Plus size={16} style={{ marginRight: 6 }} /> Add Another Course
                  </button>
                </div>
              )}

              {/* ── Step 4: Review ─────────────────────── */}
              {step === 4 && (
                <div>
                  <div className="review-section">
                    <h3><Building2 size={14} style={{ marginRight: 6 }} /> College Identity</h3>
                    <div className="review-grid">
                      <div className="review-item">
                        <span className="r-label">Name</span>
                        <span className="r-value">{collegeName}</span>
                      </div>
                      <div className="review-item">
                        <span className="r-label">Email</span>
                        <span className="r-value">{collegeEmail}</span>
                      </div>
                      <div className="review-item">
                        <span className="r-label">Phone</span>
                        <span className="r-value">{contactPhone}</span>
                      </div>
                      {websiteUrl && (
                        <div className="review-item">
                          <span className="r-label">Website</span>
                          <span className="r-value">{websiteUrl}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="review-section">
                    <h3><MapPin size={14} style={{ marginRight: 6 }} /> Location & Affiliation</h3>
                    <div className="review-grid">
                      <div className="review-item">
                        <span className="r-label">Location</span>
                        <span className="r-value">{selectedCity}, {selectedState}</span>
                      </div>
                      <div className="review-item">
                        <span className="r-label">Affiliation</span>
                        <span className="r-value">{affiliation}</span>
                      </div>
                      {address && (
                        <div className="review-item" style={{ gridColumn: '1 / -1' }}>
                          <span className="r-label">Full Address</span>
                          <span className="r-value">{address}</span>
                        </div>
                      )}
                      {establishedYear && (
                        <div className="review-item">
                          <span className="r-label">Established</span>
                          <span className="r-value">{establishedYear}</span>
                        </div>
                      )}
                      {studentCount && (
                        <div className="review-item">
                          <span className="r-label">Students</span>
                          <span className="r-value">~{parseInt(studentCount).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="review-section">
                    <h3><GraduationCap size={14} style={{ marginRight: 6 }} /> Academic Structure ({validCourses.length} course{validCourses.length !== 1 ? 's' : ''})</h3>
                    <div className="review-courses">
                      {validCourses.map((c, i) => (
                        <div key={i} className="review-course-item">
                          <h4>{c.name} <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>({c.duration_years} year{c.duration_years !== 1 ? 's' : ''})</span></h4>
                          <div className="review-course-depts">
                            {c.departments.map(d => (
                              <span key={d} className="review-dept-tag">{d}</span>
                            ))}
                          </div>
                          {c.enableSections && Object.keys(c.departmentSections).length > 0 && (
                            <div style={{ marginTop: '0.4rem', fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }}>
                              {Object.entries(c.departmentSections).map(([dept, years]) => (
                                <div key={dept} style={{ marginBottom: '0.2rem' }}>
                                  <strong style={{ color: 'rgba(255,255,255,0.6)' }}>{dept}:</strong>{' '}
                                  {Object.entries(years).map(([y, secs]) => (
                                    <span key={y}>Y{y}({(secs as string[]).join(',')}) </span>
                                  ))}
                                </div>
                              ))}
                            </div>
                          )}
                          {!c.enableSections && (
                            <div style={{ marginTop: '0.3rem', fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)' }}>No sections</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* ── Navigation Buttons ──────────────────── */}
          <div className="co-btn-row">
            {step > 1 && (
              <button className="co-btn co-btn-secondary" onClick={handleBack}>
                <ArrowLeft size={18} /> Back
              </button>
            )}
            {step < 4 ? (
              <button className="co-btn co-btn-primary" onClick={handleNext}>
                Next <ArrowRight size={18} />
              </button>
            ) : (
              <button className="co-btn co-btn-primary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? <div className="co-spinner" /> : <><CheckCircle size={18} /> Submit Request</>}
              </button>
            )}
          </div>
        </motion.div>

        {/* Scroll Indicator Overlay */}
        <AnimatePresence>
          {canScrollDown && (
            <motion.div
              className="scroll-indicator-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="scroll-indicator-gradient" />
              <div
                className="scroll-indicator-btn"
                onClick={() => {
                  if (scrollRef.current) {
                    scrollRef.current.scrollBy({ top: 250, behavior: 'smooth' })
                  }
                }}
              >
                <ChevronDown size={24} color="#fff" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
