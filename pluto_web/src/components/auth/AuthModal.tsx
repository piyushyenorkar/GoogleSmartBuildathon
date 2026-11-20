import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronDown, Sparkles, Rocket, Users, Mail, Lock, User, GraduationCap } from 'lucide-react'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { supabase } from '@/lib/supabase'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import './AuthModal.css'

export function AuthModal() {
  const { authModalOpen, authModalMode, authModalSignupType, closeAuthModal } = useUIStore()
  const { setUser } = useAuthStore()
  const [mode, setMode] = useState<'login' | 'signup'>(authModalMode)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [colleges, setColleges] = useState<string[]>([])
  const [signupType, setSignupType] = useState<'student' | 'organizer'>(authModalSignupType || 'student')

  // Form fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [college, setCollege] = useState('')

  // Sync mode with store and lock body scroll
  useEffect(() => { 
    setMode(authModalMode)
    if (authModalOpen && authModalMode === 'signup') {
      setSignupType(authModalSignupType || 'student')
    }
    
    // Lock body scroll when modal is open
    if (authModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [authModalMode, authModalSignupType, authModalOpen])

  // Legacy fallback if DB fetch is blocked by missing anonymous RLS policies
  const FALLBACK_COLLEGES = [
    "Pluto's campus"
  ]

  // Load colleges for signup
  useEffect(() => {
    if (!authModalOpen) return
    Promise.resolve(
      supabase
        .from('colleges')
        .select('name')
        .order('name', { ascending: true })
    ).then(({ data, error }) => {
      if (error) {
        console.warn('[AuthModal] Failed to fetch colleges from DB (RLS?). Using fallback array.', error.message)
        setColleges(FALLBACK_COLLEGES)
      } else if (data && data.length > 0) {
        setColleges(data.map((c) => c.name))
      } else {
        setColleges(FALLBACK_COLLEGES)
      }
    })
      .catch(() => setColleges(FALLBACK_COLLEGES))
  }, [authModalOpen])

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setName('')
    setCollege('')
    setError('')
    setLoading(false)
    setGoogleLoading(false)
  }

  const handleClose = () => {
    resetForm()
    closeAuthModal()
  }

  const handleGoogleLogin = async () => {
    setError('')
    setGoogleLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/'
        }
      })
      if (error) {
        setError(error.message)
        setGoogleLoading(false)
      }
      // If no error, the browser will redirect to Google's login page
    } catch (err: any) {
      setError('Google login failed. Please try again.')
      setGoogleLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const isAdmin = email.endsWith('@admin.com')
    
    // We allow any email for login now, as organizers can use custom domains.
    // However, if they try to sign up, we restrict students to @gmail.com.

    try {
      let authResponse = await supabase.auth.signInWithPassword({ email, password })

      // Auto-retry once if we hit the notorious React 18/Vite HMR lock steal error
      if (authResponse.error && authResponse.error.message.includes('Lock broken')) {
        console.warn('[AuthModal] Lock stolen by HMR/Strict Mode. Retrying login...')
        authResponse = await supabase.auth.signInWithPassword({ email, password })
      }

      const { data, error: authError } = authResponse

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please try again.')
        } else if (authError.message.includes('Email not confirmed')) {
          await supabase.auth.resend({ type: 'signup', email })
          setError('A confirmation link has been sent to your email. Check your inbox.')
        } else {
          setError(authError.message)
        }
        setLoading(false)
        return
      }

      if (!data.user) {
        setError('Login successful but no user returned. Please try again.')
        setLoading(false)
        return
      }

      // Fetch user profile from public.users with college name
      const meta = data.user.user_metadata || {}
      const { data: userRow, error: profileError } = await supabase
        .from('users')
        .select('*, college_ref:colleges!college_id(name)')
        .eq('email', email)
        .maybeSingle()

      if (profileError) {
        throw new Error(profileError.message)
      }

      if (userRow) {
        const collegeName = (userRow as any).college_ref?.name || meta.college || ''
        setUser({
          id: userRow.id,
          email: userRow.email,
          name: userRow.name || meta.name || email.split('@')[0],
          college: collegeName,
          college_id: userRow.college_id,
          avatar_url: userRow.profile_avatar || '',
          roles: userRow.roles || meta.roles || ['student'],
          bio: userRow.bio,
          course: userRow.course,
          department: userRow.department,
          year: userRow.year,
          section: userRow.section,
          admin_type: userRow.admin_type || undefined,
        })
      } else {
        // Fallback if no row exists in users table yet (legacy accounts)
        setUser({
          id: data.user.id,
          email: data.user.email || email,
          name: meta.name || email.split('@')[0],
          college: meta.college || '',
          roles: meta.roles || ['student'],
        })
      }

      setLoading(false)
      handleClose()

      // Let the centralized routing in PageShell/Landing handle the redirect
      // based on the new user state in the store.
    } catch (err: any) {
      console.error('[AuthModal] Login error:', err)
      setError(`Login failed: ${err?.message || 'Unknown error. Please try again.'}`)
      setLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!name || !email || !password) {
      setError('Please fill in all fields.')
      setLoading(false)
      return
    }

    if (signupType === 'student' && !college) {
      setError('Please select a college.')
      setLoading(false)
      return
    }

    const isAdmin = email.endsWith('@admin.com')

    if (signupType === 'student' && !email.endsWith('@gmail.com') && !isAdmin) {
      setError('Students must use a @gmail.com address.')
      setLoading(false)
      return
    }

    const roles = isAdmin ? ['admin'] : (signupType === 'organizer' ? ['organizer'] : ['student'])

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, college, roles } },
      })

      if (authError) {
        if (authError.message.includes('already registered')) {
          setError('Account already exists. Please login.')
        } else if (authError.message.includes('Password should')) {
          setError('Password must be at least 6 characters.')
        } else {
          setError(authError.message)
        }
        setLoading(false)
        return
      }

      let finalCollegeId: string | undefined

      if (data.user) {
        // Resolve college_id from college name
        if (college) {
          const { data: collegeRow } = await supabase
            .from('colleges')
            .select('id')
            .ilike('name', college.trim())
            .maybeSingle()
          if (collegeRow) {
            finalCollegeId = collegeRow.id
            // Patch the user row with college_id
            await supabase
              .from('users')
              .update({ college_id: collegeRow.id })
              .eq('id', data.user.id)
          }
        }

        setUser({
          id: data.user.id,
          email: data.user.email ?? email,
          name,
          college,
          college_id: finalCollegeId,
          roles,
        })
      }

      handleClose()
      // Let the centralized routing handle navigation
    } catch (err: unknown) {
      setError('Signup failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {authModalOpen && (
        <motion.div
          className="auth-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="auth-modal"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <svg width="0" height="0" style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
              <defs>
                <clipPath id="wave-left-panel" clipPathUnits="objectBoundingBox">
                  <path d="M 0,0 L 0.833,0 C 0.95,0.3 0.7,0.7 0.833,1 L 0,1 Z" />
                </clipPath>
                <clipPath id="wave-right-panel" clipPathUnits="objectBoundingBox">
                  <path d="M 0.167,0 C 0.383,0.3 0.133,0.7 0.167,1 L 1,1 L 1,0 Z" />
                </clipPath>
              </defs>
            </svg>
            <button className="auth-close" onClick={handleClose}>
              <X size={20} />
            </button>

            <div className={`auth-split-container ${mode}`}>
              {/* Shimmering Gap Effect */}
              <svg className="auth-shimmer-line" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', width: '100%', height: '100%', zIndex: 5, pointerEvents: 'none' }}>
                <defs>
                  <filter id="shimmer-glow">
                    <feGaussianBlur stdDeviation="1" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <linearGradient id="flowing-light" x1="0" y1="-30" x2="0" y2="0" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="rgba(165, 180, 252, 0)" />
                    <stop offset="50%" stopColor="rgba(255, 255, 255, 0.9)" />
                    <stop offset="100%" stopColor="rgba(165, 180, 252, 0)" />
                    <animateTransform
                      attributeName="gradientTransform"
                      type="translate"
                      from="0 0"
                      to="0 130"
                      dur="3s"
                      repeatCount="indefinite"
                    />
                  </linearGradient>
                </defs>


                {/* Traveling bright light */}
                <path
                  d="M 50,0 C 60,30 45,70 50,100"
                  fill="none"
                  stroke="url(#flowing-light)"
                  strokeWidth="2.5"
                  vectorEffect="non-scaling-stroke"
                  filter="url(#shimmer-glow)"
                />
              </svg>

              {/* Form Side */}
              <motion.div className="auth-form-side" layout transition={{ type: 'spring', damping: 25, stiffness: 200 }}>
                <div className="auth-header">
                  <h2 style={{ fontSize: '1.8rem', fontWeight: 700, letterSpacing: '-0.5px' }}>
                    {mode === 'login' ? 'Welcome Back' : 'Join PLUTO'}
                  </h2>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginTop: '2px' }}>
                    {mode === 'login' ? 'Sign in to continue to your account' : 'Create an account to start exploring'}
                  </p>
                </div>

                {error && <div className="auth-error">{error}</div>}

                <AnimatePresence mode="wait">
                  {mode === 'login' && (
                    <motion.form
                      key="login"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2 }}
                      onSubmit={handleLogin}
                      className="auth-form-content"
                    >
                      <div className="auth-form-group">
                        <label>Email Address</label>
                        <div className="input-wrapper">
                          <Mail size={16} className="input-icon" />
                          <input
                            type="email"
                            className="auth-input"
                            required
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="auth-form-group">
                        <label>Password</label>
                        <div className="input-wrapper">
                          <Lock size={16} className="input-icon" />
                          <input
                            type="password"
                            className="auth-input"
                            required
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />
                        </div>
                      </div>
                      <button type="submit" className="auth-submit" disabled={loading || googleLoading}>
                        {loading ? <div className="auth-loading-spinner" /> : 'Login'}
                      </button>

                      <div className="auth-divider">or continue with</div>
                      <button type="button" className="google-btn" onClick={handleGoogleLogin} disabled={loading || googleLoading}>
                        {googleLoading ? (
                          <div className="auth-loading-spinner" />
                        ) : (
                          <>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Google
                          </>
                        )}
                      </button>

                      <div className="auth-footer" style={{ marginTop: '1rem' }}>
                        Don't have an account?{' '}
                        <a href="#" onClick={(e) => { e.preventDefault(); setMode('signup'); setError('') }}>
                          Sign Up
                        </a>
                      </div>
                    </motion.form>
                  )}

                  {mode === 'signup' && (
                    <motion.form
                      key="signup"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      onSubmit={handleSignup}
                      className="auth-form-content"
                    >
                      <div className="auth-form-group" style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.25rem', borderRadius: '12px' }}>
                          <button
                            type="button"
                            onClick={() => { setSignupType('student'); setError(''); }}
                            style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: 'none', background: signupType === 'student' ? 'rgba(255,255,255,0.15)' : 'transparent', color: signupType === 'student' ? '#fff' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}
                          >
                            Student / Staff
                          </button>
                          <button
                            type="button"
                            onClick={() => { setSignupType('organizer'); setError(''); setCollege(''); }}
                            style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: 'none', background: signupType === 'organizer' ? 'rgba(255,255,255,0.15)' : 'transparent', color: signupType === 'organizer' ? '#fff' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}
                          >
                            Organizer
                          </button>
                        </div>
                      </div>
                      
                      {signupType === 'organizer' && (
                        <div style={{ backgroundColor: 'rgba(59,130,246,0.1)', padding: '0.75rem', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.2)', marginBottom: '1rem', color: '#93c5fd', fontSize: '0.85rem', lineHeight: '1.4' }}>
                          <strong style={{ color: '#bfdbfe' }}>Note: </strong>
                          This is strictly for independent organizations and community creators. If you are a student, please sign up as a <strong style={{ color: '#bfdbfe' }}>Student</strong> to organize events directly from your college dashboard.
                        </div>
                      )}

                      {signupType === 'student' && (
                        <div className="auth-form-group">
                          <label>Select College</label>
                          <div className="input-wrapper">
                            <GraduationCap size={16} className="input-icon" style={{ zIndex: 10 }} />
                            <DropdownMenu>
                              <DropdownMenuTrigger className="auth-input" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: '2.4rem', paddingRight: '0.75rem', paddingTop: '0.4rem', paddingBottom: '0.4rem', minHeight: '38px' }}>
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: college ? '#fff' : 'rgba(255,255,255,0.3)' }}>
                                  {college || 'Choose your college'}
                                </span>
                                <ChevronDown size={16} style={{ flexShrink: 0, color: 'rgba(255,255,255,0.4)' }} />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => setCollege('')}>Choose your college</DropdownMenuItem>
                                {colleges.map((c) => (
                                  <DropdownMenuItem key={c} onClick={() => setCollege(c)}>{c}</DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      )}
                      <div className="auth-form-group">
                        <label>Full Name</label>
                        <div className="input-wrapper">
                          <User size={16} className="input-icon" />
                          <input
                            type="text"
                            className="auth-input"
                            required
                            placeholder="Enter your full name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="auth-form-group">
                        <label>Email Address</label>
                        <div className="input-wrapper">
                          <Mail size={16} className="input-icon" />
                          <input
                            type="email"
                            className="auth-input"
                            required
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="auth-form-group">
                        <label>Password</label>
                        <div className="input-wrapper">
                          <Lock size={16} className="input-icon" />
                          <input
                            type="password"
                            className="auth-input"
                            required
                            placeholder="Create a password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />
                        </div>
                      </div>
                      <button type="submit" className="auth-submit" disabled={loading || googleLoading}>
                        {loading ? <div className="auth-loading-spinner" /> : 'Create Account'}
                      </button>

                      {signupType !== 'organizer' && (
                        <>
                          <div className="auth-divider">or continue with</div>
                          <button type="button" className="google-btn" onClick={handleGoogleLogin} disabled={loading || googleLoading}>
                            {googleLoading ? (
                              <div className="auth-loading-spinner" />
                            ) : (
                              <>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Google
                              </>
                            )}
                          </button>
                        </>
                      )}

                      <div className="auth-footer" style={{ marginTop: '1rem' }}>
                        Already have an account?{' '}
                        <a href="#" onClick={(e) => { e.preventDefault(); setMode('login'); setError('') }}>
                          Login
                        </a>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Info Side */}
              <motion.div className="auth-info-side" layout transition={{ type: 'spring', damping: 25, stiffness: 200 }}>
                <div className="auth-info-content">
                  <div className="auth-logo-large" style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                    <img src="/plutocampus.png" alt="Pluto Campus" style={{ height: '55px', objectFit: 'contain' }} />
                  </div>
                  <div className="auth-info-text">
                    <h3 style={{ marginBottom: '1rem', color: '#fff', fontSize: '1.4rem' }}>
                      {mode === 'login' ? 'Welcome Back!' : 'Start Your Journey'}
                    </h3>
                    <p style={{ marginBottom: '1.5rem', color: 'rgba(255,255,255,0.7)' }}>
                      Discover amazing Events, Projects and collaborate with top talent across colleges.
                    </p>
                    <ul style={{ textAlign: 'left', margin: '0 auto', display: 'inline-block', listStyle: 'none', padding: 0 }}>
                      <li style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Sparkles size={16} color="#a5b4fc" /> <span style={{ color: 'rgba(255,255,255,0.9)' }}>Showcase your portfolio</span>
                      </li>
                      <li style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Rocket size={16} color="#f472b6" /> <span style={{ color: 'rgba(255,255,255,0.9)' }}>Join exclusive events</span>
                      </li>
                      <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Users size={16} color="#34d399" /> <span style={{ color: 'rgba(255,255,255,0.9)' }}>Build your dream team</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
