import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { supabase } from '@/lib/supabase'
import Strands from '@/components/ui/Strands'
import { LegalModal } from '@/components/ui/LegalModal'
import SplitText from '@/components/ui/SplitText'
import './Landing.css'

export default function Landing() {
  const navigate = useNavigate()
  const { user, isLoading } = useAuthStore()
  const { openAuthModal } = useUIStore()

  const [phase, setPhase] = useState<'intro' | 'settle' | 'reveal'>('intro')
  const [taglineIndex, setTaglineIndex] = useState(0)
  const [legalModalType, setLegalModalType] = useState<'terms' | 'privacy' | 'refund' | 'contact' | null>(null)
  const [googleLoading, setGoogleLoading] = useState(false)

  const rotatingTaglines = [
    "Find hackathons near you",
    "Build teams with top talent",
    "Showcase your portfolio",
    "Host your own events"
  ]

  useEffect(() => {
    if (phase === 'reveal') {
      const interval = setInterval(() => {
        setTaglineIndex((prev) => (prev + 1) % rotatingTaglines.length)
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [phase])

  useEffect(() => {
    if (!isLoading && user) {
      const isAdmin = user.email?.endsWith('@admin.com') || user.roles?.includes('admin') || !!user.admin_type
      const isPureOrganizer = user.roles?.includes('organizer') && !user.roles?.includes('user') && !user.roles?.includes('student') && !user.roles?.includes('admin') && !user.roles?.includes('staff')

      const isStaff = user.roles?.includes('staff')
      const missingBaseOnboarding = !user.college_id || !user.course || !user.department
      const missingStudentOnboarding = !isStaff && !user.year

      if (!isPureOrganizer && !isAdmin && (missingBaseOnboarding || missingStudentOnboarding)) {
        navigate('/onboarding', { replace: true })
      } else if (user.admin_type === 'department_admin' && user.department) {
        navigate(`/admin/dept/${encodeURIComponent(user.department)}`, { replace: true })
      } else if (user.admin_type === 'college_admin' || user.email?.endsWith('@admin.com') || (user.roles?.includes('admin') && !user.admin_type)) {
        navigate('/admin', { replace: true })
      } else if (isPureOrganizer) {
        navigate('/organizer', { replace: true })
      } else {
        navigate('/explore', { replace: true })
      }
    }
  }, [user, isLoading, navigate])

  useEffect(() => {
    const settleTimer = setTimeout(() => setPhase('settle'), 2600)
    const revealTimer = setTimeout(() => setPhase('reveal'), 3600)
    return () => {
      clearTimeout(settleTimer)
      clearTimeout(revealTimer)
    }
  }, [])

  const handleGetStarted = () => {
    openAuthModal('login')
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/'
        }
      })
    } catch (err: any) {
      console.error('Google login failed', err)
      setGoogleLoading(false)
    }
  }

  if (!isLoading && user) return null

  return (
    <>
      <div className="landing-background">
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
      <section className="landing-no-dock">
        {/* ONE logo starts center, moves to navbar, stays there */}
        <div className={`landing-logo-animated ${phase === 'intro' ? 'logo-at-center' : 'logo-at-navbar'
          }`}>
          <div className={`logo-wrapper ${phase === 'intro' ? 'play-intro' : ''}`}>
            <img src="/plutocampus.png" alt="Pluto Campus" className="landing-pluto-campus-logo" />
          </div>
        </div>

        {/* Navbar bar — appears when logo starts moving */}
        <header className={`landing-topbar ${phase === 'intro' ? 'topbar-hidden' : 'topbar-visible'}`}>
          <div className="topbar-content">
            {/* Empty space where the animated logo sits */}
            <div className="topbar-logo-spacer"></div>

            {/* Navigation Links with Premium Tooltips */}
            <nav className={`landing-nav-center ${phase === 'intro' ? 'actions-hidden' : 'actions-visible'}`}>
              <div className="nav-item-with-tooltip">
                <span className="landing-nav-link" style={{ cursor: 'default' }}>Explore</span>
                <div className="premium-tooltip">Discover trending events</div>
              </div>
              <div className="nav-item-with-tooltip">
                <span className="landing-nav-link" style={{ cursor: 'default' }}>Community</span>
                <div className="premium-tooltip">Events & Team Networking</div>
              </div>
              <div className="nav-item-with-tooltip">
                <span className="landing-nav-link" style={{ cursor: 'default' }}>Portfolio</span>
                <div className="premium-tooltip">Track your performance</div>
              </div>
              <div className="nav-item-with-tooltip">
                <span className="landing-nav-link" style={{ cursor: 'default' }}>Students</span>
                <div className="premium-tooltip">Network with top talent</div>
              </div>
              <div className="nav-item-with-tooltip">
                <span className="landing-nav-link" style={{ cursor: 'default' }}>Projects</span>
                <div className="premium-tooltip">Manage your big ideas</div>
              </div>
              <div className="nav-item-with-tooltip">
                <span className="landing-nav-link" style={{ cursor: 'default' }}>Create Team</span>
                <div className="premium-tooltip">Build your dream team</div>
              </div>
            </nav>

            <div className={`topbar-actions ${phase === 'intro' ? 'actions-hidden' : 'actions-visible'}`}>
              <button className="topbar-btn topbar-btn-ghost" onClick={() => openAuthModal('login')}>
                Login
              </button>
              <button className="topbar-btn topbar-btn-primary" onClick={() => openAuthModal('signup')}>
                Sign Up
              </button>
            </div>
          </div>
        </header>

        {/* Hero Content */}
        <section className={`landing-hero-new ${phase === 'reveal' ? 'hero-visible' : 'hero-hidden'}`}>
          <div className="landing-content-new">
            {phase === 'reveal' ? (
              <>
                <SplitText
                  tag="h1"
                  text={"Welcome to\nPluto Campus"}
                  className="landing-title-new"
                  delay={30}
                  duration={0.8}
                  splitType="words"
                />
                <SplitText
                  tag="p"
                  text={"The premier event ticketing\nand college networking platform"}
                  className="landing-tagline"
                  delay={20}
                  duration={0.6}
                  splitType="words"
                />
                <div className="landing-rotating-text-wrapper">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={taglineIndex}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                      className="landing-rotating-text"
                    >
                      {rotatingTaglines[taglineIndex]}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <>
                <h1 className="landing-title-new" style={{ opacity: 0 }}>
                  {"Welcome to\nPluto Campus"}
                </h1>
                <p className="landing-tagline" style={{ opacity: 0 }}>{"The premier event ticketing\nand college networking platform"}</p>
                <div className="landing-rotating-text-wrapper" style={{ opacity: 0 }}>
                  <div className="landing-rotating-text">{rotatingTaglines[0]}</div>
                </div>
              </>
            )}
            <div className="landing-action-buttons">
              {/* Desktop Actions */}
              <div className="desktop-actions">
                <button onClick={() => openAuthModal('signup')} className="landing-cta-new cta-primary">
                  Join the Platform
                </button>
                <button onClick={() => openAuthModal('login')} className="landing-cta-new cta-ghost">
                  I have an account
                </button>
              </div>

              {/* Mobile Actions */}
              <div className="mobile-actions">
                <div className="mobile-auth-row">
                  <button onClick={() => openAuthModal('login')} className="landing-cta-new cta-ghost mobile-btn">
                    Login
                  </button>
                  <button onClick={() => openAuthModal('signup')} className="landing-cta-new cta-primary mobile-btn">
                    Sign Up
                  </button>
                </div>
                <button className="landing-cta-new mobile-google-btn" onClick={handleGoogleLogin} disabled={googleLoading}>
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
                      Continue with Google
                    </>
                  )}
                </button>
              </div>
            </div>
            {phase === 'reveal' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.8 }}
                style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}
              >
                Are you a creator or organizer?{' '}
                <button
                  onClick={() => openAuthModal('signup', 'organizer')}
                  style={{ background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer', textDecoration: 'underline', padding: 0, font: 'inherit' }}
                >
                  Join here
                </button>
              </motion.div>
            )}
          </div>
        </section>

        {/* Floating Play Store Link */}
        {phase === 'reveal' && (
          <motion.div
            className="landing-playstore-corner"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.8 }}
          >
            <a href="https://play.google.com/store/apps/details?id=com.pluto_app" className="playstore-badge" target="_blank" rel="noopener noreferrer">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.2,1.3C2.8,1.6,2.5,2.1,2.5,2.9v18.2c0,0.8,0.3,1.3,0.7,1.6l0.1,0.1l10.3-10.3v-0.4L3.3,1.2L3.2,1.3z" fill="#00a6ff" />
                <path d="M18.2,16.4l-4.6-4.6v-0.4l4.6-4.6l0.1,0.1l5.5,3.1c1.5,0.9,1.5,2.2,0,3.1l-5.5,3.1L18.2,16.4z" fill="#ffc100" />
                <path d="M13.7,12l-10.4,10.4c0.5,0.5,1.2,0.6,2.1,0.1l12.8-7.3L13.7,12z" fill="#ff3b30" />
                <path d="M13.7,12L18.2,7.5l-12.8-7.3C4.5-0.3,3.8-0.2,3.3,0.3L13.7,12z" fill="#00e676" />
              </svg>
              <div className="playstore-text">
                <span className="playstore-get">GET IT ON</span>
                <span className="playstore-store">Google Play</span>
              </div>
            </a>
          </motion.div>
        )}

        {/* Floating Legal Links for Razorpay */}
        {phase === 'reveal' && (
          <motion.div
            className="landing-legal-corner"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.8 }}
          >
            <button onClick={() => setLegalModalType('terms')}>Terms</button>
            <span className="dot">·</span>
            <button onClick={() => setLegalModalType('privacy')}>Privacy</button>
            <span className="dot">·</span>
            <button onClick={() => setLegalModalType('refund')}>Refunds</button>
            <span className="dot">·</span>
            <button onClick={() => setLegalModalType('contact')}>Contact</button>
          </motion.div>
        )}
      </section>

      <LegalModal type={legalModalType} onClose={() => setLegalModalType(null)} />
    </>
  )
}
