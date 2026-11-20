import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, ChevronDown, BookOpen, Building2, Calendar, LayoutGrid } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { SelectDropdown } from '@/components/ui/SelectDropdown'
import Strands from '@/components/ui/Strands'

import './Onboarding.css'

export default function Onboarding() {
  const navigate = useNavigate()
  const { user, setUser, isLoading } = useAuthStore()
  const [onboardingRole, setOnboardingRole] = useState<'student' | 'staff'>(user?.roles?.includes('staff') ? 'staff' : 'student')

  const [colleges, setColleges] = useState<string[]>([])
  const [college, setCollege] = useState(user?.college || '')
  const [course, setCourse] = useState(user?.course || '')
  const [department, setDepartment] = useState(user?.department || '')
  const [year, setYear] = useState(user?.year || '')
  const [section, setSection] = useState(user?.section || '')
  const [loading, setLoading] = useState(false)

  // Dynamic course/department from college_departments table
  const [availableCourses, setAvailableCourses] = useState<string[]>([])
  const [availableDepartments, setAvailableDepartments] = useState<string[]>([])
  const [availableYears, setAvailableYears] = useState<string[]>([])
  const [availableSections, setAvailableSections] = useState<string[]>([])
  const [hasSections, setHasSections] = useState(false)
  const [resolvedCollegeId, setResolvedCollegeId] = useState<string | null>(user?.college_id || null)

  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollDown, setCanScrollDown] = useState(false)

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
      setCanScrollDown(scrollTop + clientHeight < scrollHeight - 20)
    }
  }

  useEffect(() => {
    handleScroll()
    window.addEventListener('resize', handleScroll)
    return () => window.removeEventListener('resize', handleScroll)
  }, [availableCourses, availableDepartments, availableYears, availableSections])

  const isCollegeLocked = !!user?.college_id

  // Redirect logic: Admin users go to their panels, fully onboarded students go to explore
  // Check in background if user has missing year data — if yes, stay on onboarding
  useEffect(() => {
    if (!user) return

    const isAdminUser = !!user.admin_type || user.roles?.includes('admin') || user.email?.endsWith('@admin.com')
    const isPureOrganizer = user.roles?.includes('organizer') && !user.roles?.includes('user') && !user.roles?.includes('student') && !user.roles?.includes('admin') && !user.roles?.includes('staff')

    if (user.admin_type === 'department_admin' && user.department) {
      navigate(`/admin/dept/${encodeURIComponent(user.department)}`, { replace: true })
    } else if (isAdminUser) {
      navigate('/admin', { replace: true })
    } else if (isPureOrganizer) {
      navigate('/organizer', { replace: true })
    } else if (user.college_id && user.course && user.department && (user.roles?.includes('staff') || (user.roles?.includes('student') && user.year))) {
      // For staff, year isn't required. For students, we also require year.
      navigate('/explore', { replace: true })
    }
  }, [user, navigate])

  // Fetch colleges list
  useEffect(() => {
    supabase
      .from('colleges')
      .select('name')
      .order('name', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setColleges(data.map((c) => c.name))
        }
      })
  }, [])

  // When college changes, resolve its ID and fetch courses/departments
  useEffect(() => {
    if (!college) {
      setResolvedCollegeId(null)
      setAvailableCourses([])
      setAvailableDepartments([])
      setAvailableYears([])
      setAvailableSections([])
      return
    }

    // If college_id is already known (locked), use it directly
    if (isCollegeLocked && user?.college_id) {
      setResolvedCollegeId(user.college_id)
      fetchCoursesForCollege(user.college_id)
      return
    }

    // Otherwise resolve by name
    supabase
      .from('colleges')
      .select('id')
      .ilike('name', college.trim())
      .maybeSingle()
      .then(({ data }) => {
        if (data?.id) {
          setResolvedCollegeId(data.id)
          fetchCoursesForCollege(data.id)
        } else {
          setResolvedCollegeId(null)
          setAvailableCourses([])
          setAvailableDepartments([])
        }
      })
  }, [college])

  // When course changes, filter departments for that course
  useEffect(() => {
    if (!resolvedCollegeId || !course) {
      setAvailableDepartments([])
      return
    }

    supabase
      .from('college_departments')
      .select('department')
      .eq('college_id', resolvedCollegeId)
      .eq('course', course)
      .order('department')
      .then(({ data }) => {
        if (data && data.length > 0) {
          setAvailableDepartments([...new Set(data.map(d => d.department))])
        } else {
          setAvailableDepartments([])
        }
      })

    // Only reset downstream fields if the user actually changed the course manually
    if (course !== user?.course) {
      setDepartment('')
      setYear('')
      setSection('')
    }
    setAvailableYears([])
    setAvailableSections([])
  }, [course, resolvedCollegeId])

  // When department changes, fetch duration_years and sections from college_departments
  useEffect(() => {
    if (!resolvedCollegeId || !course || !department) {
      setAvailableYears([])
      setAvailableSections([])
      setHasSections(false)
      return
    }

    supabase
      .from('college_departments')
      .select('duration_years, sections')
      .eq('college_id', resolvedCollegeId)
      .eq('course', course)
      .eq('department', department)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          const duration = data.duration_years || 4
          const years: string[] = []
          for (let i = 1; i <= duration; i++) {
            years.push(String(i))
          }
          setAvailableYears(years)

          // Check if this department has sections configured
          const sectionsData = data.sections as Record<string, string[]> | null
          const hasAnySections = sectionsData && Object.keys(sectionsData).length > 0 &&
            Object.values(sectionsData).some((arr: string[]) => arr && arr.length > 0)
          setHasSections(!!hasAnySections)
        } else {
          // Fallback: 4 years, no sections
          setAvailableYears(['1', '2', '3', '4'])
          setHasSections(false)
        }
      })

    // Reset year and section when department changes
    setYear('')
    setSection('')
    setAvailableSections([])
  }, [department, resolvedCollegeId, course])

  // When year changes, fetch available sections for that year
  useEffect(() => {
    if (!resolvedCollegeId || !course || !department || !year || !hasSections) {
      setAvailableSections([])
      return
    }

    supabase
      .from('college_departments')
      .select('sections')
      .eq('college_id', resolvedCollegeId)
      .eq('course', course)
      .eq('department', department)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.sections) {
          const sectionsData = data.sections as Record<string, string[]>
          const yearSections = sectionsData[year] || []
          setAvailableSections(yearSections)
        } else {
          setAvailableSections([])
        }
      })

    // Reset section when year changes
    setSection('')
  }, [year, resolvedCollegeId, course, department, hasSections])

  async function fetchCoursesForCollege(collegeId: string) {
    const { data } = await supabase
      .from('college_departments')
      .select('course')
      .eq('college_id', collegeId)
      .order('course')

    if (data && data.length > 0) {
      setAvailableCourses([...new Set(data.map(d => d.course))])
    } else {
      setAvailableCourses([])
    }
  }

  const yearLabel = (y: string) => {
    const n = parseInt(y)
    if (n === 1) return '1st Year'
    if (n === 2) return '2nd Year'
    if (n === 3) return '3rd Year'
    return `${n}th Year`
  }

  const handleComplete = async () => {
    if (!college || !course || !department || (onboardingRole === 'student' && !year)) {
      alert('Please fill all required fields to continue.')
      return
    }

    setLoading(true)
    try {
      let finalCollegeId = resolvedCollegeId

      if (!finalCollegeId) {
        // Try to resolve or create the college
        const { data: collegeRow } = await supabase
          .from('colleges')
          .select('id')
          .ilike('name', college.trim())
          .maybeSingle()

        if (collegeRow) {
          finalCollegeId = collegeRow.id
        } else {
          const { data: newCollege, error: insertError } = await supabase
            .from('colleges')
            .insert({ name: college.trim() })
            .select('id')
            .single()

          if (insertError) throw insertError
          finalCollegeId = newCollege.id
        }
      }

      if (user && finalCollegeId) {
        const currentRoles = user?.roles || []
        const filteredRoles = currentRoles.filter(r => r !== 'user' && r !== 'student' && r !== 'staff')
        const finalRoles = [...filteredRoles, onboardingRole === 'staff' ? 'staff' : 'student']

        // Update user row
        await supabase
          .from('users')
          .update({
            college_id: finalCollegeId,
            course: course.trim(),
            department: department.trim(),
            year: onboardingRole === 'staff' ? null : year,
            section: onboardingRole === 'staff' ? null : (section || null),
            roles: finalRoles
          })
          .eq('id', user.id)

        // Update local store
        setUser({
          ...user,
          college: college,
          college_id: finalCollegeId,
          course: course.trim(),
          department: department.trim(),
          year: onboardingRole === 'staff' ? undefined : year,
          section: onboardingRole === 'staff' ? undefined : (section || undefined),
          roles: finalRoles
        })

        navigate('/explore', { replace: true })
      }
    } catch (err) {
      console.error(err)
      alert('Failed to save college. Please try again.')
    } finally {
      setLoading(false)
    }
  }


  if (!user) return null

  if (isLoading) {
    return <div style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="onboarding-spinner" style={{ width: 40, height: 40, borderTopColor: 'var(--primary)' }} /></div>
  }

  return (
    <div className="onboarding-page">
      <div className="landing-background" style={{ zIndex: 0, opacity: 0.6 }}>
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
      <div className="onboarding-content">
        <motion.div
          className="onboarding-card"
          ref={scrollRef}
          onScroll={handleScroll}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="onboarding-header">
            <h1>Almost there!</h1>
            <p>Just a few details before we get started</p>
          </div>

          <div className="onboarding-role-toggle">
            <button
              className={onboardingRole === 'student' ? 'active' : ''}
              onClick={() => setOnboardingRole('student')}
            >
              Student
            </button>
            <button
              className={onboardingRole === 'staff' ? 'active' : ''}
              onClick={() => setOnboardingRole('staff')}
            >
              Staff
            </button>
          </div>

          <div className="onboarding-form">
            <div className="onboarding-input-group">
              <label>Select your College <span style={{ color: '#ef4444', fontSize: '0.85rem' }}>*</span></label>
              <SelectDropdown
                value={college}
                onChange={(val) => {
                  setCollege(val)
                  setCourse('')
                  setDepartment('')
                  setYear('')
                  setSection('')
                }}
                options={colleges}
                placeholder="Choose your college..."
                icon={<GraduationCap size={18} />}
                disabled={isCollegeLocked}
              />
            </div>

            <div className="onboarding-input-group">
              <label>Select your Course <span style={{ color: '#ef4444', fontSize: '0.85rem' }}>*</span></label>
              <SelectDropdown
                value={course}
                onChange={setCourse}
                options={availableCourses}
                placeholder={!college ? 'Select a college first' : availableCourses.length === 0 ? 'No courses available' : 'Choose your course...'}
                icon={<BookOpen size={18} />}
                disabled={!college || availableCourses.length === 0}
              />
            </div>

            <div className="onboarding-input-group">
              <label>Select your Department <span style={{ color: '#ef4444', fontSize: '0.85rem' }}>*</span></label>
              <SelectDropdown
                value={department}
                onChange={setDepartment}
                options={availableDepartments}
                placeholder={!course ? 'Select a course first' : availableDepartments.length === 0 ? 'No departments available' : 'Choose your department...'}
                icon={<Building2 size={18} />}
                disabled={!course || availableDepartments.length === 0}
              />
            </div>

            {/* Year & Section - Only for students */}
            {onboardingRole === 'student' && (
              <>
                {/* Year dropdown — mandatory */}
                {department && availableYears.length > 0 && (
                  <div className="onboarding-input-group">
                    <label>Select your Year <span style={{ color: '#ef4444', fontSize: '0.85rem' }}>*</span></label>
                    <SelectDropdown
                      value={year ? yearLabel(year) : ''}
                      onChange={(val) => {
                        // Extract year number from label
                        const match = val.match(/(\d+)/)
                        if (match) setYear(match[1])
                      }}
                      options={availableYears.map(y => yearLabel(y))}
                      placeholder="Choose your year..."
                      icon={<Calendar size={18} />}
                    />
                  </div>
                )}

                {/* Section dropdown — only if college defines sections */}
                {year && hasSections && availableSections.length > 0 && (
                  <div className="onboarding-input-group">
                    <label>Select your Section <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem', fontWeight: 400 }}>(optional)</span></label>
                    <SelectDropdown
                      value={section}
                      onChange={setSection}
                      options={availableSections}
                      placeholder="Choose your section..."
                      icon={<LayoutGrid size={18} />}
                    />
                  </div>
                )}
              </>
            )}

            <button
              className="onboarding-submit-btn"
              onClick={handleComplete}
              disabled={loading || !college || !course || !department || (onboardingRole === 'student' && !year)}
            >
              {loading ? <div className="onboarding-spinner" /> : 'Continue to Dashboard'}
            </button>
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
                    scrollRef.current.scrollBy({ top: 200, behavior: 'smooth' })
                  }
                }}
              >
                <ChevronDown size={18} color="#fff" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
