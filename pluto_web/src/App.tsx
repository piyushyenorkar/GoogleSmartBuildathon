import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HelmetProvider } from 'react-helmet-async'
import { Compass } from 'lucide-react'
import { PageShell } from '@/components/layout'
import { AuthModal } from '@/components/auth/AuthModal'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { useAuthListener } from '@/hooks/useAuth'
import { PlaceholderPage } from '@/pages/PlaceholderPage'

// Lazy load pages for code splitting
const Landing = lazy(() => import('@/pages/Landing'))
const OnboardingPage = lazy(() => import('@/pages/Onboarding'))
const Explore = lazy(() => import('@/pages/Explore'))
const Community = lazy(() => import('@/pages/Community'))
const EventsPage = lazy(() => import('@/pages/Events'))
const EventDetails = lazy(() => import('@/pages/EventDetails'))
const BookingPage = lazy(() => import('@/pages/Booking'))
const PaymentPage = lazy(() => import('@/pages/Payment'))
const SuccessPage = lazy(() => import('@/pages/Success'))
const DashboardPage = lazy(() => import('@/pages/Dashboard'))
const SettingsPage = lazy(() => import('@/pages/Settings'))
const PortfolioPage = lazy(() => import('@/pages/Portfolio'))
const OrganizerDashboardPage = lazy(() => import('@/pages/OrganizerDashboard'))
const OrganizerEventsPage = lazy(() => import('@/pages/OrganizerEvents'))
const OrganizerBookingsPage = lazy(() => import('@/pages/OrganizerBookings'))
const OrganizerPayoutsPage = lazy(() => import('@/pages/OrganizerPayouts'))
const CreateEventPage = lazy(() => import('@/pages/CreateEvent'))
const EditEventPage = lazy(() => import('@/pages/EditEvent'))
const SeatEditorPage = lazy(() => import('@/pages/SeatEditor'))
const SeatSelectionPage = lazy(() => import('@/pages/SeatSelection'))
const AdminDashboardPage = lazy(() => import('@/pages/AdminDashboard'))
const TeamBuilderPage = lazy(() => import('@/pages/TeamBuilder'))
const MyProjectsPage = lazy(() => import('@/pages/MyProjects'))
const StudentProfilePage = lazy(() => import('@/pages/StudentProfile'))
const LegalPage = lazy(() => import('@/pages/LegalPage'))
const DeleteAccountPage = lazy(() => import('@/pages/DeleteAccount'))
const CollegeOnboardingPage = lazy(() => import('@/pages/CollegeOnboarding'))
const DeptAdminDashboardPage = lazy(() => import('@/pages/DeptAdminDashboard'))

// Competition Pages — completely separate from Event pages
// const CreateCompetitionPage = lazy(() => import('@/pages/CreateCompetition'))
const CompetitionDetailsPage = lazy(() => import('@/pages/CompetitionDetails'))
const CompetitionRegistrationPage = lazy(() => import('@/pages/CompetitionRegistration'))
const CompetitionRegSuccessPage = lazy(() => import('@/pages/CompetitionRegSuccess'))
const OrganizerCompetitionsPage = lazy(() => import('@/pages/OrganizerCompetitions'))
const CompetitionParticipantsPage = lazy(() => import('@/pages/CompetitionParticipants'))

// TanStack Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: true,
    },
  },
})

import { PageLoader } from '@/components/ui/PageLoader'

// Inner app component that uses hooks (must be inside BrowserRouter)
function AppRoutes() {
  useAuthListener()

  return (
    <>
      <AuthModal />
      <Routes>
        {/* Landing — no shell */}
        <Route path="/" element={<Suspense fallback={<PageLoader />}><Landing /></Suspense>} />
        
        {/* Onboarding — no shell */}
        <Route path="/onboarding" element={<Suspense fallback={<PageLoader />}><OnboardingPage /></Suspense>} />

        {/* Legal Pages — standalone shell-less pages */}
        <Route path="/legal/:policyType" element={<Suspense fallback={<PageLoader />}><LegalPage /></Suspense>} />

        {/* College Registration — public, no shell, no auth */}
        <Route path="/register-college" element={<Suspense fallback={<PageLoader />}><CollegeOnboardingPage /></Suspense>} />

        {/* All app pages — wrapped in PageShell */}
        <Route element={<PageShell />}>
          {/* Core Pages */}
          <Route path="/explore" element={<Explore />} />
          <Route path="/community" element={<Community />} />
          <Route path="/events" element={<EventsPage />} />

          {/* Event Flow */}
          <Route path="/event/:id" element={<EventDetails />} />
          <Route path="/book/:id" element={<BookingPage />} />
          <Route path="/payment/:id" element={<PaymentPage />} />
          <Route path="/success" element={<SuccessPage />} />

          {/* Portfolio & Teams */}
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/portfolio/:id" element={<PortfolioPage />} />
          <Route path="/team-builder" element={<TeamBuilderPage />} />
          <Route path="/my-projects" element={<MyProjectsPage />} />
          <Route path="/students" element={<StudentProfilePage />} />
          <Route path="/students/:id" element={<StudentProfilePage />} />

          {/* User Pages */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/delete-account" element={<Suspense fallback={<PageLoader />}><DeleteAccountPage /></Suspense>} />

          {/* Organizer Pages */}
          <Route path="/organizer" element={<OrganizerDashboardPage />} />
          <Route path="/organizer/events" element={<OrganizerEventsPage />} />
          <Route path="/organizer/bookings" element={<OrganizerBookingsPage />} />
          <Route path="/organizer/payouts" element={<OrganizerPayoutsPage />} />
          <Route path="/create-event" element={<CreateEventPage />} />
          <Route path="/edit-event/:id" element={<ErrorBoundary><EditEventPage /></ErrorBoundary>} />
          <Route path="/seat-editor/:id" element={<SeatEditorPage />} />
          <Route path="/seat-selection/:id" element={<SeatSelectionPage />} />

          {/* Competition Pages — completely separate from Event pages */}
          <Route path="/competition/:id" element={<CompetitionDetailsPage />} />
          <Route path="/competition/:id/register" element={<CompetitionRegistrationPage />} />
          <Route path="/competition/:id/registration-success" element={<CompetitionRegSuccessPage />} />
          {/* Route removed as CreateCompetition is now in CreateEvent */}
          <Route path="/organizer/competitions" element={<OrganizerCompetitionsPage />} />
          <Route path="/organizer/competitions/:competitionId/participants" element={<CompetitionParticipantsPage />} />

          {/* Admin */}
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/dept/:department" element={<DeptAdminDashboardPage />} />

          {/* 404 */}
          <Route path="*" element={
            <PlaceholderPage title="Page Not Found" subtitle="The page you're looking for doesn't exist" icon={<Compass size={64} style={{ color: 'var(--primary)' }} />} />
          } />
        </Route>
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </QueryClientProvider>
    </HelmetProvider>
  )
}
