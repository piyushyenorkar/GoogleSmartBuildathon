import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Users, Ticket, Banknote, Activity,
  TrendingUp, AlertCircle, Clock,
  CreditCard, Wallet, Percent, ArrowDownRight, ArrowUpRight, ChevronDown, ChevronRight
} from 'lucide-react'
import Dropdown from '@/components/Dropdown'
import type { HQOverview } from '@/services/plutoHQService'
import HQDetailModal from '@/components/HQDetailModal'
import {
  useDetailedUsers,
  useDetailedOrganizers,
  useDetailedColleges,
  useDetailedBookings,
  useDetailedEvents,
  useDetailedPayouts
} from '@/hooks/useDashboardDetails'

interface Props {
  data: HQOverview | undefined
  isLoading: boolean
  onNavigate?: (tab: 'overview' | 'organizers' | 'payouts' | 'revenue') => void
}

type ModalType = 'users' | 'bookings' | 'events' | 'payouts' | 'pending_approvals' | null

export default function OverviewTab({ data, isLoading, onNavigate }: Props) {
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>('')
  const [usersTab, setUsersTab] = useState('all') // 'all', 'colleges', 'organizers'
  const [orgSubTab, setOrgSubTab] = useState<'college' | 'independent'>('college')
  const [colSubTab, setColSubTab] = useState<'all' | 'select'>('all')

  const [bookingEventFilter, setBookingEventFilter] = useState<string>('')
  const [bookingCollegeFilter, setBookingCollegeFilter] = useState<string>('')

  const [eventCollegeFilter, setEventCollegeFilter] = useState<string>('')
  const [eventIsIndependent, setEventIsIndependent] = useState<boolean>(false)
  const [eventSourceFilter, setEventSourceFilter] = useState<string>('') // '' = all, 'events', 'competitions'
  const [bookingSourceFilter, setBookingSourceFilter] = useState<string>('') // '' = all, 'events', 'competitions'

  // Data fetching (only active when needed)
  const { data: users, isLoading: loadingUsers } = useDetailedUsers(
    activeModal === 'users' && usersTab !== 'colleges' ? searchQuery : '',
    usersTab === 'colleges' ? (colSubTab === 'all' ? 'all_colleges' : selectedCollegeId) : null
  )
  const { data: organizers, isLoading: loadingOrgs } = useDetailedOrganizers(activeModal === 'users' ? searchQuery : '')
  const { data: colleges, isLoading: loadingColleges } = useDetailedColleges(activeModal === 'users' || activeModal === 'bookings' ? searchQuery : '')
  const { data: bookings, isLoading: loadingBookings } = useDetailedBookings(
    activeModal === 'bookings' ? searchQuery : '',
    activeModal === 'bookings' ? bookingEventFilter : undefined,
    activeModal === 'bookings' ? bookingCollegeFilter : undefined,
    activeModal === 'bookings' ? bookingSourceFilter : undefined
  )
  const { data: events, isLoading: loadingEvents } = useDetailedEvents(
    activeModal === 'events' || activeModal === 'bookings' || activeModal === 'pending_approvals' ? searchQuery : '',
    activeModal === 'events' || activeModal === 'pending_approvals' ? eventCollegeFilter : undefined,
    activeModal === 'events' || activeModal === 'pending_approvals' ? eventIsIndependent : undefined,
    activeModal === 'pending_approvals' ? 'pending' : undefined,
    activeModal === 'events' || activeModal === 'pending_approvals' ? eventSourceFilter : undefined
  )
  const { data: payouts, isLoading: loadingPayouts } = useDetailedPayouts(activeModal === 'payouts' ? searchQuery : '')

  if (isLoading || !data) {
    return (
      <div className="bento-grid">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="spatial-card skeleton-shimmer" style={{ height: 140 }} />
        ))}
        <div className="spatial-card skeleton-shimmer bento-col-span-2 bento-row-span-2" />
        <div className="spatial-card skeleton-shimmer bento-col-span-2" />
      </div>
    )
  }

  const growth = data.lastMonthBookings > 0
    ? ((data.thisMonthBookings - data.lastMonthBookings) / data.lastMonthBookings) * 100
    : 100

  const handleOpenModal = (type: ModalType) => {
    setSearchQuery('')
    setSelectedCollegeId('')
    setUsersTab('all')
    setActiveModal(type)
  }

  return (
    <>
      <div>
        <div className="bento-grid">
          {/* TOP ROW: 4 KPI Cards */}
          <motion.div 
            className="spatial-card hq-kpi-card clickable" 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            onClick={() => handleOpenModal('users')}
            style={{ cursor: 'pointer', position: 'relative' }}
          >
            <div className="hq-kpi-icon" style={{ background: 'rgba(96, 165, 250, 0.15)', color: '#3b82f6' }}><Users size={24} /></div>
            <div>
              <div className="hq-kpi-value" title={data.totalUsers.toLocaleString('en-IN')}>{fmt(data.totalUsers)}</div>
              <div className="hq-kpi-label">Total Users</div>
            </div>
            <ChevronRight size={20} style={{ position: 'absolute', bottom: '1rem', right: '1rem', color: '#64748b' }} />
          </motion.div>

          <motion.div 
            className="spatial-card hq-kpi-card clickable" 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            onClick={() => handleOpenModal('bookings')}
            style={{ cursor: 'pointer', position: 'relative' }}
          >
            <div className="hq-kpi-icon" style={{ background: 'rgba(167, 139, 250, 0.15)', color: '#8b5cf6' }}><Ticket size={24} /></div>
            <div>
              <div className="hq-kpi-value" title={data.totalBookings.toLocaleString('en-IN')}>{fmt(data.totalBookings)}</div>
              <div className="hq-kpi-label">Total Bookings</div>
            </div>
            <ChevronRight size={20} style={{ position: 'absolute', bottom: '1rem', right: '1rem', color: '#64748b' }} />
          </motion.div>

          <motion.div 
            className="spatial-card hq-kpi-card clickable" 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            onClick={() => handleOpenModal('events')}
            style={{ cursor: 'pointer', position: 'relative' }}
          >
            <div className="hq-kpi-icon" style={{ background: 'rgba(52, 211, 153, 0.15)', color: '#10b981' }}><Activity size={24} /></div>
            <div>
              <div className="hq-kpi-value" title={data.activeEvents.toLocaleString('en-IN')}>{fmt(data.activeEvents)}</div>
              <div className="hq-kpi-label">Active Events</div>
            </div>
            <ChevronRight size={20} style={{ position: 'absolute', bottom: '1rem', right: '1rem', color: '#64748b' }} />
          </motion.div>

          <motion.div 
            className="spatial-card hq-kpi-card clickable" 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            onClick={() => {
              if (onNavigate) {
                onNavigate('payouts')
              } else {
                handleOpenModal('payouts')
              }
            }}
            style={{ cursor: 'pointer', position: 'relative' }}
          >
            <div className="hq-kpi-icon" style={{ background: 'rgba(100, 116, 139, 0.15)', color: '#64748b' }}><Banknote size={24} /></div>
            <div>
              <div className="hq-kpi-value" title={`₹${data.totalPaidOut.toLocaleString('en-IN')}`}>₹{fmt(data.totalPaidOut)}</div>
              <div className="hq-kpi-label">Total Paid Out</div>
            </div>
            <ArrowUpRight size={20} style={{ position: 'absolute', bottom: '1rem', right: '1rem', color: '#64748b' }} />
          </motion.div>

          {/* MIDDLE ROW: Hero + Alerts */}
          <motion.div
            className="hq-profit-hero bento-col-span-2"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.25 }}
          >
            <div className="hq-profit-label">
              <TrendingUp size={24} /> Total Platform GMV
            </div>
            <div className="hq-profit-value" title={`₹${data.totalGMV.toLocaleString('en-IN')}`}>
              ₹{fmt(data.totalGMV)}
            </div>
            <div className="hq-profit-formula">
              {growth >= 0 ? '↑' : '↓'} {Math.abs(growth).toFixed(1)}% vs Last Month
            </div>
            <div className="hq-profit-meta">
              <span title={`₹${data.platformRevenue.toLocaleString('en-IN')}`}><Wallet size={18} /> Platform Net Profit: ₹{fmt(data.platformRevenue)}</span>
            </div>
          </motion.div>

          <motion.div
            className="spatial-card bento-col-span-2 hq-alerts-widget"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="hq-alert-item" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '1.25rem' }}>
              <div className="hq-alert-label" style={{ color: '#f59e0b' }}>
                <Clock size={16} /> Pending Payouts
              </div>
              <div className="hq-alert-value" title={`₹${data.pendingPayoutAmount.toLocaleString('en-IN')}`}>
                ₹{fmt(data.pendingPayoutAmount)}
              </div>
              <div className="hq-finance-subtitle">{data.pendingPayoutCount} requests waiting to be processed</div>
            </div>
            
            <div 
              className="hq-alert-item clickable" 
              style={{ paddingTop: '1.25rem', cursor: 'pointer' }}
              onClick={() => handleOpenModal('pending_approvals')}
            >
              <div className="hq-alert-label" style={{ color: '#ef4444' }}>
                <AlertCircle size={16} /> Pending Approvals
              </div>
              <div className="hq-alert-value" title={data.pendingApprovals.toLocaleString('en-IN')}>
                {fmt(data.pendingApprovals)}
              </div>
              <div className="hq-finance-subtitle">Events waiting to go live</div>
            </div>
          </motion.div>
        </div>
        
        {/* BOTTOM ROW: Financial Summary */}
        <h3 className="hq-section-title">Revenue Breakdown</h3>
        <div className="hq-financial-grid">
          <div className="spatial-card">
            <div className="hq-finance-header">
              <Percent size={18} color="#34d399" />
              <span className="hq-finance-label">Commission Earned</span>
              <ArrowUpRight size={14} color="#34d399" />
            </div>
            <div className="hq-finance-value" title={`₹${data.totalPlutoCommission.toLocaleString('en-IN')}`}>₹{fmt(data.totalPlutoCommission)}</div>
            <div className="hq-finance-subtitle">1% Commission + 0.14% from Booking Fees</div>
          </div>
          
          <div className="spatial-card">
            <div className="hq-finance-header">
              <CreditCard size={18} color="#60a5fa" />
              <span className="hq-finance-label">Booking Fees</span>
              <ArrowUpRight size={14} color="#34d399" />
            </div>
            <div className="hq-finance-value" title={`₹${data.totalBookingFees.toLocaleString('en-IN')}`}>₹{fmt(data.totalBookingFees)}</div>
            <div className="hq-finance-subtitle">2.5% from students</div>
          </div>

          <div className="spatial-card">
            <div className="hq-finance-header">
              <ArrowDownRight size={18} color="#f87171" />
              <span className="hq-finance-label">Razorpay Costs</span>
              <ArrowDownRight size={14} color="#f87171" />
            </div>
            <div className="hq-finance-value" title={`₹${data.totalRazorpayFees.toLocaleString('en-IN')}`}>₹{fmt(data.totalRazorpayFees)}</div>
            <div className="hq-finance-subtitle">2.36% gateway cost</div>
          </div>

          <div className="spatial-card">
            <div className="hq-finance-header">
              <Wallet size={18} color="#8b5cf6" />
              <span className="hq-finance-label">Organizer Net Earnings</span>
            </div>
            <div className="hq-finance-value" title={`₹${data.totalOrganizerNet.toLocaleString('en-IN')}`}>₹{fmt(data.totalOrganizerNet)}</div>
            <div className="hq-finance-subtitle">Total owed to organizers</div>
          </div>
        </div>
      </div>

      {/* MODALS */}
      <HQDetailModal
        isOpen={activeModal === 'users'}
        onClose={() => setActiveModal(null)}
        title="Users Directory"
        icon={<Users size={20} />}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeTab={usersTab}
        onTabChange={(tabId) => {
          setUsersTab(tabId)
          if (tabId === 'colleges') {
            setColSubTab('all')
            setSelectedCollegeId('')
          }
        }}
        tabs={[
          { id: 'all', label: 'All Users' },
          { id: 'colleges', label: 'Colleges' },
          { id: 'organizers', label: 'Organizers' }
        ]}
      >
        {usersTab === 'all' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {loadingUsers ? <p>Loading users...</p> : users?.map((u: any) => (
              <div key={u.id} className="spatial-card" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#e2e8f0', overflow: 'hidden' }}>
                  {u.profile_avatar ? <img src={u.profile_avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Users size={20} style={{ margin: 10, color: '#94a3b8' }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{u.name}</div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{u.email}</div>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  {u.colleges?.name && (
                    <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>{u.colleges.name}</span>
                  )}
                  {u.roles?.includes('organizer') && (
                    <span style={{ fontSize: '0.75rem', background: '#e0e7ff', color: '#4f46e5', padding: '4px 10px', borderRadius: '12px', fontWeight: 500 }}>Organizer</span>
                  )}
                  {u.email?.endsWith('@admin.com') && (
                    <span style={{ fontSize: '0.75rem', background: '#fce7f3', color: '#be185d', padding: '4px 10px', borderRadius: '12px', fontWeight: 500 }}>Admin</span>
                  )}
                </div>
              </div>
            ))}
            {users?.length === 0 && <p>No users found.</p>}
          </div>
        )}

        {usersTab === 'colleges' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '8px', padding: '4px', background: 'rgba(0,0,0,0.03)', borderRadius: '12px', width: 'fit-content' }}>
              <button 
                onClick={() => { setColSubTab('all'); setSelectedCollegeId(''); }}
                style={{ padding: '6px 16px', border: 'none', background: colSubTab === 'all' ? '#fff' : 'transparent', color: colSubTab === 'all' ? '#0f172a' : '#64748b', borderRadius: '8px', fontWeight: 500, cursor: 'pointer', boxShadow: colSubTab === 'all' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
              >
                All College Users
              </button>
              <Dropdown
                value={colSubTab === 'select' ? selectedCollegeId : ''}
                onChange={(val) => { setColSubTab('select'); setSelectedCollegeId(val); }}
                style={{ minWidth: '140px' }} buttonStyle={{ background: colSubTab === 'select' ? '#fff' : 'transparent', border: 'none', boxShadow: colSubTab === 'select' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', color: '#64748b' }}
                options={[
                  { label: 'Select College', value: '' },
                  ...(colleges?.map((c: any) => ({ label: `${c.name} (${c.city})`, value: c.id })) || [])
                ]}
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {(colSubTab === 'all' || selectedCollegeId) ? (
                <>
                  {loadingUsers ? <p>Loading students...</p> : users?.map((u: any) => (
                    <div key={u.id} className="spatial-card" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#e2e8f0', overflow: 'hidden' }}>
                        {u.profile_avatar ? <img src={u.profile_avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Users size={20} style={{ margin: 10, color: '#94a3b8' }} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{u.name}</div>
                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{u.email}</div>
                      </div>
                      <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        {u.colleges?.name && (
                          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>{u.colleges.name}</span>
                        )}
                        {u.email?.endsWith('@admin.com') && (
                          <span style={{ fontSize: '0.75rem', background: '#fce7f3', color: '#be185d', padding: '4px 10px', borderRadius: '12px', fontWeight: 500 }}>Admin</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {(!users || users.length === 0) && <p>No students found for this college.</p>}
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'rgba(0,0,0,0.02)', borderRadius: '12px', border: '1px dashed rgba(0,0,0,0.1)' }}>
                  <Users size={32} style={{ color: '#cbd5e1', margin: '0 auto 1rem' }} />
                  <p style={{ color: '#64748b', margin: 0 }}>Please select a college from the dropdown above to view its students.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {usersTab === 'organizers' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '8px', padding: '4px', background: 'rgba(0,0,0,0.03)', borderRadius: '12px', width: 'fit-content' }}>
              <button 
                onClick={() => setOrgSubTab('college')}
                style={{ padding: '6px 16px', border: 'none', background: orgSubTab === 'college' ? '#fff' : 'transparent', color: orgSubTab === 'college' ? '#0f172a' : '#64748b', borderRadius: '8px', fontWeight: 500, cursor: 'pointer', boxShadow: orgSubTab === 'college' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
              >
                College Organizers
              </button>
              <button 
                onClick={() => setOrgSubTab('independent')}
                style={{ padding: '6px 16px', border: 'none', background: orgSubTab === 'independent' ? '#fff' : 'transparent', color: orgSubTab === 'independent' ? '#0f172a' : '#64748b', borderRadius: '8px', fontWeight: 500, cursor: 'pointer', boxShadow: orgSubTab === 'independent' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
              >
                Independent Organizers
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {loadingOrgs ? <p>Loading organizers...</p> : organizers?.filter((o: any) => orgSubTab === 'college' ? !!o.college_id : !o.college_id).map((o: any) => (
                <div key={o.id} className="spatial-card" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#e2e8f0', overflow: 'hidden' }}>
                    {o.profile_avatar ? <img src={o.profile_avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Users size={20} style={{ margin: 10, color: '#94a3b8' }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{o.name}</div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{o.email}</div>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    {o.colleges?.name && (
                      <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>{o.colleges.name}</span>
                    )}
                    <span style={{ fontSize: '0.75rem', background: '#e0e7ff', color: '#4f46e5', padding: '4px 10px', borderRadius: '12px', fontWeight: 500 }}>Organizer</span>
                    {o.email?.endsWith('@admin.com') && (
                      <span style={{ fontSize: '0.75rem', background: '#fce7f3', color: '#be185d', padding: '4px 10px', borderRadius: '12px', fontWeight: 500 }}>Admin</span>
                    )}
                  </div>
                </div>
              ))}
              {(!organizers || organizers.filter((o: any) => orgSubTab === 'college' ? !!o.college_id : !o.college_id).length === 0) && (
                <p>No organizers found in this category.</p>
              )}
            </div>
          </div>
        )}
      </HQDetailModal>

      <HQDetailModal
        isOpen={activeModal === 'bookings'}
        onClose={() => {
          setActiveModal(null)
          setBookingEventFilter('')
          setBookingCollegeFilter('')
        }}
        title="Recent Bookings"
        icon={<Ticket size={20} />}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        toolbarExtra={
          <>
            <Dropdown
              value={bookingSourceFilter}
              onChange={(val) => setBookingSourceFilter(val)}
              style={{ width: '150px' }}
              buttonStyle={{ height: '34px', background: 'rgba(0,0,0,0.04)', border: 'none', borderRadius: '20px', color: '#64748b' }}
              options={[
                { label: 'All Types', value: '' },
                { label: 'Events', value: 'events' },
                { label: 'Competitions', value: 'competitions' }
              ]}
            />

            <Dropdown
              value={bookingEventFilter}
              onChange={(val) => setBookingEventFilter(val)}
              style={{ width: '150px' }}
              buttonStyle={{ height: '34px', background: 'rgba(0,0,0,0.04)', border: 'none', borderRadius: '20px', color: '#64748b' }}
              options={[
                { label: bookingSourceFilter === 'competitions' ? 'All Competitions' : 'All Events', value: '' },
                ...(events?.filter((e: any) => !bookingSourceFilter || e._sourceTable === bookingSourceFilter).map((e: any) => ({ label: e.title, value: e.id })) || [])
              ]}
            />

            <Dropdown
              value={bookingCollegeFilter}
              onChange={(val) => setBookingCollegeFilter(val)}
              style={{ width: '150px' }}
              buttonStyle={{ height: '34px', background: 'rgba(0,0,0,0.04)', border: 'none', borderRadius: '20px', color: '#64748b' }}
              options={[
                { label: 'All Colleges', value: '' },
                ...(colleges?.map((c: any) => ({ label: c.name, value: c.id })) || [])
              ]}
            />
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {loadingBookings ? <p>Loading bookings...</p> : bookings?.map((b: any) => (
            <div key={b.id} className="spatial-card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 40, height: 40, borderRadius: '8px', background: '#e2e8f0', overflow: 'hidden' }}>
                  {b.event?.banner_url && <img src={b.event.banner_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{b.event?.title || 'Unknown Event'}</div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{b.user?.name} ({b.user?.email}) • {b.quantity} Tickets</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 600 }}>₹{b.total_amount}</div>
                <div style={{ fontSize: '0.75rem', color: b.booking_status === 'confirmed' ? '#10b981' : '#f59e0b' }}>
                  {b.booking_status.toUpperCase()}
                </div>
              </div>
            </div>
          ))}
          {!loadingBookings && (!bookings || bookings.length === 0) && (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'rgba(0,0,0,0.02)', borderRadius: '12px', border: '1px dashed rgba(0,0,0,0.1)' }}>
              <p style={{ color: '#64748b', margin: 0 }}>No bookings found matching your criteria.</p>
            </div>
          )}
        </div>
      </HQDetailModal>

      <HQDetailModal
        isOpen={activeModal === 'events'}
        onClose={() => {
          setActiveModal(null)
          setEventCollegeFilter('')
          setEventIsIndependent(false)
        }}
        title="Active Events"
        icon={<Activity size={20} />}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        toolbarExtra={
          <>
            <Dropdown
              value={eventSourceFilter}
              onChange={(val) => setEventSourceFilter(val)}
              style={{ width: '150px' }}
              buttonStyle={{ height: '34px', background: 'rgba(0,0,0,0.04)', border: 'none', borderRadius: '20px', color: '#64748b' }}
              options={[
                { label: 'All Types', value: '' },
                { label: 'Events', value: 'events' },
                { label: 'Competitions', value: 'competitions' }
              ]}
            />

            <Dropdown
              value={eventCollegeFilter}
              onChange={(val) => {
                setEventCollegeFilter(val)
                if (val) setEventIsIndependent(false)
              }}
              style={{ width: '150px' }}
              buttonStyle={{ height: '34px', background: 'rgba(0,0,0,0.04)', border: 'none', borderRadius: '20px', color: '#64748b' }}
              options={[
                { label: 'All Colleges', value: '' },
                ...(colleges?.map((c: any) => ({ label: c.name, value: c.id })) || [])
              ]}
            />

            <button
              onClick={() => {
                const isIndep = !eventIsIndependent;
                setEventIsIndependent(isIndep);
                if (isIndep) setEventCollegeFilter('');
              }}
              style={{
                height: '34px',
                padding: '0 1rem',
                border: 'none',
                background: eventIsIndependent ? 'var(--accent-primary)' : 'rgba(0,0,0,0.04)',
                borderRadius: '20px',
                fontSize: '0.85rem',
                color: eventIsIndependent ? '#fff' : '#64748b',
                fontWeight: 500,
                cursor: 'pointer',
                boxShadow: eventIsIndependent ? '0 2px 4px rgba(79, 70, 229, 0.2)' : 'none',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              Independent Organizer
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {loadingEvents ? <p>Loading events...</p> : events?.map((e: any) => (
            <div key={e.id} className="spatial-card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 48, height: 48, borderRadius: '8px', background: '#e2e8f0', overflow: 'hidden' }}>
                  {e.banner_url && <img src={e.banner_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{e.title}</div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>By {e.organizer?.name} • {e.college?.name || 'Universal'}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 600, color: e.status === 'approved' ? '#10b981' : '#64748b' }}>{e.status.toUpperCase()}</div>
                <div style={{ fontSize: '0.85rem' }}>{e.ticket_price === 0 ? 'Free' : `₹${e.ticket_price} per ticket`}</div>
              </div>
            </div>
          ))}
          {!loadingEvents && (!events || events.length === 0) && (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'rgba(0,0,0,0.02)', borderRadius: '12px', border: '1px dashed rgba(0,0,0,0.1)' }}>
              <p style={{ color: '#64748b', margin: 0 }}>No active events found matching your criteria.</p>
            </div>
          )}
        </div>
      </HQDetailModal>

      <HQDetailModal
        isOpen={activeModal === 'payouts'}
        onClose={() => setActiveModal(null)}
        title="Recent Payouts"
        icon={<Banknote size={20} />}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {loadingPayouts ? <p>Loading payouts...</p> : payouts?.map((p: any) => (
            <div key={p.id} className="spatial-card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#e2e8f0', overflow: 'hidden' }}>
                  {p.organizer?.profile_avatar ? <img src={p.organizer.profile_avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Users size={20} style={{ margin: 10, color: '#94a3b8' }} />}
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{p.organizer?.name}</div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{p.organizer?.email}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 600 }}>₹{p.amount.toLocaleString()}</div>
                <div style={{ fontSize: '0.75rem', color: p.status === 'completed' ? '#10b981' : (p.status === 'requested' ? '#f59e0b' : '#ef4444') }}>
                  {p.status.toUpperCase()}
                </div>
                {p.reference_number && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Ref: {p.reference_number}</div>}
              </div>
            </div>
          ))}
          {!loadingPayouts && (!payouts || payouts.length === 0) && (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'rgba(0,0,0,0.02)', borderRadius: '12px', border: '1px dashed rgba(0,0,0,0.1)' }}>
              <p style={{ color: '#64748b', margin: 0 }}>No recent payouts found matching your criteria.</p>
            </div>
          )}
        </div>
      </HQDetailModal>
      <HQDetailModal
        isOpen={activeModal === 'pending_approvals'}
        onClose={() => {
          setActiveModal(null)
          setEventCollegeFilter('')
          setEventIsIndependent(false)
        }}
        title="Pending Approvals"
        icon={<AlertCircle size={20} />}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        toolbarExtra={
          <>
            <Dropdown
              value={eventSourceFilter}
              onChange={(val) => setEventSourceFilter(val)}
              style={{ width: '150px' }}
              buttonStyle={{ height: '34px', background: 'rgba(0,0,0,0.04)', border: 'none', borderRadius: '20px', color: '#64748b' }}
              options={[
                { label: 'All Types', value: '' },
                { label: 'Events', value: 'events' },
                { label: 'Competitions', value: 'competitions' }
              ]}
            />

            <Dropdown
              value={eventCollegeFilter}
              onChange={(val) => {
                setEventCollegeFilter(val)
                if (val) setEventIsIndependent(false)
              }}
              style={{ width: '150px' }}
              buttonStyle={{ height: '34px', background: 'rgba(0,0,0,0.04)', border: 'none', borderRadius: '20px', color: '#64748b' }}
              options={[
                { label: 'All Colleges', value: '' },
                ...(colleges?.map((c: any) => ({ label: c.name, value: c.id })) || [])
              ]}
            />

            <button
              onClick={() => {
                const isIndep = !eventIsIndependent;
                setEventIsIndependent(isIndep);
                if (isIndep) setEventCollegeFilter('');
              }}
              style={{
                height: '34px',
                padding: '0 1rem',
                border: 'none',
                background: eventIsIndependent ? 'var(--accent-primary)' : 'rgba(0,0,0,0.04)',
                borderRadius: '20px',
                fontSize: '0.85rem',
                color: eventIsIndependent ? '#fff' : '#64748b',
                fontWeight: 500,
                cursor: 'pointer',
                boxShadow: eventIsIndependent ? '0 2px 4px rgba(79, 70, 229, 0.2)' : 'none',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              Independent Organizer
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {loadingEvents ? <p>Loading pending events...</p> : events?.map((e: any) => (
            <div key={e.id} className="spatial-card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 48, height: 48, borderRadius: '8px', background: '#e2e8f0', overflow: 'hidden' }}>
                  {e.banner_url ? <img src={e.banner_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Activity size={24} style={{ margin: 12, color: '#94a3b8' }} />}
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{e.title}</div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 500 }}>{e.organizer?.name}</span>
                    <span style={{ opacity: 0.5 }}>•</span>
                    <span style={{ 
                      background: e.college?.name ? 'rgba(79, 70, 229, 0.1)' : 'rgba(139, 92, 246, 0.1)', 
                      color: e.college?.name ? '#4f46e5' : '#8b5cf6',
                      padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 600
                    }}>
                      {e.college?.name || 'Organizer'}
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 600, color: '#f59e0b' }}>PENDING</div>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  {e.type} • {e.ticket_price === 0 ? 'Free' : `₹${e.ticket_price}`}
                </div>
              </div>
            </div>
          ))}
          {!loadingEvents && (!events || events.length === 0) && (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'rgba(0,0,0,0.02)', borderRadius: '12px', border: '1px dashed rgba(0,0,0,0.1)' }}>
              <p style={{ color: '#64748b', margin: 0 }}>No pending events waiting for approval.</p>
            </div>
          )}
        </div>
      </HQDetailModal>
    </>
  )
}

function fmt(n: number): string {
  if (n >= 100000) return `${(n / 100000).toFixed(2)}L`
  if (n >= 10000) return `${(n / 1000).toFixed(1)}K`
  return n.toLocaleString('en-IN')
}
