import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Suspense, useEffect } from 'react'
import { SpaceBackground } from './SpaceBackground'
import { Navbar } from './Navbar'
import { MobileDock } from './MobileDock'
import { useAuthStore } from '@/stores/authStore'
import { PageLoader } from '@/components/ui/PageLoader'

/**
 * Main layout shell wrapping all pages.
 * Provides: space background, navbar, content area, mobile dock.
 *
 * The `key` on `<main>` forces React to destroy and recreate the DOM element
 * when auth state changes (login/logout). This prevents stale layout styles
 * from the previous render (e.g. flex centering from the logged-out view)
 * from contaminating the new layout — ensuring pixel-parity with a fresh
 * page load.
 */
export function PageShell() {
  const { user, isLoading } = useAuthStore()
  const userId = user?.id ?? 'anon'
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const isExploreOrCommunity = pathname === '/explore' || pathname === '/community'

  // Global protection: Redirect students to onboarding if they haven't selected a college
  // Exempt: pure organizers, admin users, and pages that don't need protection
  useEffect(() => {
    if (!isLoading && user) {
      const isPureOrganizer = user.roles?.includes('organizer') && !user.roles?.includes('user') && !user.roles?.includes('student') && !user.roles?.includes('admin') && !user.roles?.includes('staff')
      const isAdminUser = !!user.admin_type || user.roles?.includes('admin') || user.email?.endsWith('@admin.com')
      const isOnAdminPage = pathname === '/admin' || pathname.startsWith('/admin/dept/')

      // Admin users and pure organizers skip onboarding
      if (isPureOrganizer || isAdminUser) return

      // Staff need base info, Students need base info + year
      const isStaff = user.roles?.includes('staff')
      const missingBaseOnboarding = !user.college_id || !user.course || !user.department
      const missingStudentOnboarding = !isStaff && !user.year
      
      if ((missingBaseOnboarding || missingStudentOnboarding) && pathname !== '/onboarding') {
        navigate('/onboarding', { replace: true })
      }
    }
  }, [user, isLoading, pathname, navigate])

  const isEventDetails = pathname.startsWith('/event/')

  return (
    <>
      <SpaceBackground />
      <Navbar />
      <main key={userId} className={`page-content ${isExploreOrCommunity ? 'no-bottom-padding' : ''} ${pathname === '/settings' ? 'settings-mobile-no-nav' : ''} ${isEventDetails ? 'event-details-page-shell' : ''} ${pathname.startsWith('/book/') || pathname.startsWith('/payment/') || pathname === '/success' ? 'booking-page-shell' : ''} ${pathname.includes('/participants') ? 'participants-page-shell' : ''}`}>
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <MobileDock />
    </>
  )
}
