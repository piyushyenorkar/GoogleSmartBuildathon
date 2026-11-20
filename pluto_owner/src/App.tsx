import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users, Banknote, TrendingUp,
  LogOut, RefreshCw, Shield, Building2
} from 'lucide-react'
import { lazy, Suspense } from 'react'
import PinGate from './pages/PinGate'

// Lazy loaded tabs
const OverviewTab = lazy(() => import('./pages/OverviewTab'))
const OrganizersTab = lazy(() => import('./pages/OrganizersTab'))
const PayoutsTab = lazy(() => import('./pages/PayoutsTab'))
const RevenueTab = lazy(() => import('./pages/RevenueTab'))
const CollegesTab = lazy(() => import('./pages/CollegesTab'))
import { useHQOverview, useHQOrganizers, useHQPayouts, useProcessPayout, useHQRevenue } from './hooks/usePlutoHQ'

type HQTab = 'overview' | 'organizers' | 'payouts' | 'revenue' | 'colleges'

const TABS: { id: HQTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'organizers', label: 'Organizers', icon: Users },
  { id: 'payouts', label: 'Payouts', icon: Banknote },
  { id: 'revenue', label: 'Revenue', icon: TrendingUp },
  { id: 'colleges', label: 'Colleges', icon: Building2 },
]

export default function App() {
  const [authenticated, setAuthenticated] = useState(() => {
    return !!sessionStorage.getItem('pluto-owner-pin')
  })
  const [activeTab, setActiveTab] = useState<HQTab>('overview')
  const [processingPayoutId, setProcessingPayoutId] = useState<string | null>(null)
  const [isSpinning, setIsSpinning] = useState(false)

  // Data hooks
  const { data: overview, isLoading: overviewLoading, refetch: refetchOverview } = useHQOverview()
  const { data: organizers, isLoading: organizersLoading, refetch: refetchOrganizers } = useHQOrganizers()
  const { data: payouts, isLoading: payoutsLoading, refetch: refetchPayouts } = useHQPayouts()
  const { data: revenueData, isLoading: revenueLoading, refetch: refetchRevenue } = useHQRevenue()
  const processPayoutMutation = useProcessPayout()

  const handleRefresh = useCallback(() => {
    setIsSpinning(true)
    Promise.all([
      refetchOverview(),
      refetchOrganizers(),
      refetchPayouts(),
      refetchRevenue()
    ]).finally(() => {
      setTimeout(() => setIsSpinning(false), 600)
    })
  }, [refetchOverview, refetchOrganizers, refetchPayouts, refetchRevenue])

  const handleLogout = () => {
    sessionStorage.removeItem('pluto-owner-pin')
    setAuthenticated(false)
  }

  const handleProcessPayout = useCallback(async (
    payoutId: string,
    action: 'approve' | 'complete' | 'reject',
    data?: { referenceNumber?: string; failureReason?: string }
  ) => {
    setProcessingPayoutId(payoutId)
    try {
      await processPayoutMutation.mutateAsync({ payoutId, action, ...data })
    } catch (err) {
      console.error('Failed to process payout:', err)
    } finally {
      setProcessingPayoutId(null)
    }
  }, [processPayoutMutation])

  // PIN Gate
  if (!authenticated) {
    return <PinGate onUnlock={() => setAuthenticated(true)} />
  }

  const pendingCount = payouts?.filter(p => p.status === 'requested' || p.status === 'processing').length || 0

  return (
    <div className="pluto-hq top-nav-layout" style={{ position: 'relative' }}>
      {/* Animated Mesh Background */}
      <div className="mesh-bg">
        <div className="mesh-blob primary"></div>
        <div className="mesh-blob success"></div>
        <div className="mesh-blob warning"></div>
      </div>

      {/* Top Navigation Bar - Glassmorphism */}
      <header className="hq-top-nav">
        <div className="hq-nav-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          
          {/* Logo / Heading (Left) */}
          <div className="hq-brand" style={{ whiteSpace: 'nowrap' }}>
            <img src="/p.png" alt="Pluto Logo" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: '8px' }} />
            <h1>Pluto Campus</h1>
            <span className="hq-brand-badge">HQ</span>
          </div>

          {/* Segmented Control (Center) */}
          <nav className="hq-segmented-tabs" style={{ display: 'flex', justifyContent: 'center', marginLeft: '1rem' }}>
            {TABS.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  className={`hq-seg-btn ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeSeg"
                      className="hq-seg-bg"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="hq-seg-content">
                    <tab.icon size={18} />
                    {tab.label}
                    {tab.id === 'payouts' && pendingCount > 0 && (
                      <span className="hq-tab-badge" style={{ marginLeft: 6 }}>{pendingCount}</span>
                    )}
                  </span>
                </button>
              )
            })}
          </nav>

          {/* Actions (Right) */}
          <div className="hq-nav-actions" style={{ justifySelf: 'end' }}>
            <button className="hq-icon-btn" onClick={handleRefresh} title="Refresh Data">
              <motion.div
                animate={{ rotate: isSpinning ? 360 : 0 }}
                transition={{ duration: 0.8, ease: "linear", repeat: isSpinning ? Infinity : 0 }}
                style={{ display: 'flex', alignItems: 'center' }}
              >
                <RefreshCw size={20} />
              </motion.div>
            </button>
            <button className="hq-icon-btn logout" onClick={handleLogout} title="Lock Dashboard">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="hq-main" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        <div style={{ width: '100%', maxWidth: 1400 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="hq-tab-wrapper"
            >
              <Suspense fallback={
                <div className="bento-grid">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="spatial-card skeleton-shimmer" style={{ height: 140 }} />
                  ))}
                  <div className="spatial-card skeleton-shimmer bento-col-span-2 bento-row-span-2" />
                  <div className="spatial-card skeleton-shimmer bento-col-span-2" />
                </div>
              }>
                {activeTab === 'overview' && (
                  <OverviewTab data={overview} isLoading={overviewLoading} onNavigate={setActiveTab} />
                )}
                {activeTab === 'organizers' && (
                  <OrganizersTab organizers={organizers} isLoading={organizersLoading} />
                )}
                {activeTab === 'payouts' && (
                  <PayoutsTab
                    payouts={payouts}
                    isLoading={payoutsLoading}
                    onProcess={handleProcessPayout}
                    processingId={processingPayoutId}
                  />
                )}
                {activeTab === 'revenue' && (
                  <RevenueTab
                    summary={revenueData?.summary}
                    eventBreakdown={revenueData?.eventBreakdown}
                    isLoading={revenueLoading}
                  />
                )}
                {activeTab === 'colleges' && (
                  <CollegesTab />
                )}
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
