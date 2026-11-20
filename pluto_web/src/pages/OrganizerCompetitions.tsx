import React, { useState, useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy, Users, IndianRupee, Search, Plus, Edit, Trash2, Eye,
  CalendarDays, Calendar, Code, Terminal, FileText, Lightbulb, Loader2, UserCheck, Ticket, ChevronDown, List, MoreVertical, ChevronRight, Settings, FileSpreadsheet
} from 'lucide-react'
import ExcelJS from 'exceljs'
import { useAuthStore } from '@/stores/authStore'
import { useOrganizerCompetitions, useDeleteCompetition } from '@/hooks/useCompetitions'
import { useCompetitionsRegistrations } from '@/hooks/useCompetitionRegistrations'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { isEventActive } from '@/lib/utils'
import './Dashboard.css'
import './OrganizerEvents.css'
import './OrganizerCompetitions.css'
import './OrganizerBookings.css'

const CATEGORY_ICONS: Record<string, any> = {
  hackathon: Code, coding_competition: Terminal, case_study: FileText, ideathon: Lightbulb,
}
const CATEGORY_COLORS: Record<string, string> = {
  hackathon: '#a78bfa', coding_competition: '#60a5fa', case_study: '#34d399', ideathon: '#fbbf24',
}

export default function OrganizerCompetitions() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: competitions = [], isLoading, refetch } = useOrganizerCompetitions(user?.id)
  const compIds = useMemo(() => competitions.map(c => c.id), [competitions])
  const { data: allRegistrations = [], isLoading: isLoadingRegs } = useCompetitionsRegistrations(compIds)
  const deleteMutation = useDeleteCompetition()

  const activeTab = searchParams.get('tab') === 'registrations' ? 'registrations' : 'competitions'
  const [searchQuery, setSearchQuery] = useState('')
  const [compTab, setCompTab] = useState<'all' | 'active' | 'past'>('all')
  const [filterCompId, setFilterCompId] = useState<string>('all')
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const { activeComps, pastComps } = useMemo(() => {
    const active: typeof competitions = []
    const past: typeof competitions = []

    competitions.forEach((c) => {
      if (isEventActive({ date: c.start_date, endDate: c.end_date })) {
        active.push(c)
      } else {
        past.push(c)
      }
    })
    return { activeComps: active, pastComps: past }
  }, [competitions])

  const filteredComps = useMemo(() => {
    const list = compTab === 'all' ? (competitions || []) : compTab === 'active' ? activeComps : pastComps
    if (!searchQuery.trim()) return list
    const q = searchQuery.toLowerCase()
    return list.filter(c => c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q))
  }, [competitions, activeComps, pastComps, compTab, searchQuery])

  const groupedParticipants = useMemo(() => {
    let filtered = allRegistrations
    if (filterCompId !== 'all') {
      filtered = filtered.filter(p => p.competition_id === filterCompId)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(p => 
        p.user?.name?.toLowerCase().includes(q) || 
        p.user?.email?.toLowerCase().includes(q) ||
        (p as any).team?.name?.toLowerCase().includes(q)
      )
    }

    const groups: { [key: string]: any } = {}
    filtered.forEach(p => {
      if (p.registration_type === 'team' && p.team_id) {
        if (!groups[p.team_id]) {
          groups[p.team_id] = { isTeam: true, id: p.team_id, team: (p as any).team, members: [], status: p.status, comp_id: p.competition_id, created_at: p.created_at }
        }
        groups[p.team_id].members.push(p)
      } else {
        groups[p.id] = { isTeam: false, id: p.id, participant: p, status: p.status, comp_id: p.competition_id, created_at: p.created_at }
      }
    })
    
    return Object.values(groups).sort((a: any, b: any) => {
      const aDate = new Date(a.created_at || 0).getTime()
      const bDate = new Date(b.created_at || 0).getTime()
      return bDate - aDate
    })
  }, [allRegistrations, searchQuery])

  const stats = useMemo(() => {
    const totalRegs = allRegistrations.length
    const totalRevenue = allRegistrations.reduce((sum, r) => {
      const c = competitions.find(comp => comp.id === r.competition_id);
      const fee = Number(c?.entry_fee) || 0;
      const count = (r.registration_type === 'team' && r.team_id && (r as any).team?.members) ? (r as any).team.members.length : 1;
      const baseAmount = fee * count;
      const platformFee = baseAmount === 0 ? 0 : Number((baseAmount * 0.025).toFixed(2));
      return sum + baseAmount + platformFee;
    }, 0)
    return { total: competitions.length, regs: totalRegs, revenue: totalRevenue }
  }, [competitions, allRegistrations])

  const getRegCount = (compId: string) => allRegistrations.filter(r => r.competition_id === compId).length

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This action cannot be undone.`)) return
    try {
      await deleteMutation.mutateAsync(id)
      refetch()
    } catch (e) { console.error(e) }
  }

  const handleExportExcel = async () => {
    if (filterCompId === 'all' || groupedParticipants.length === 0) return;
    
    const selectedComp = competitions.find(c => c.id === filterCompId);
    const compName = selectedComp ? selectedComp.title : 'Competition';

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Pluto Organizer';
    const worksheet = workbook.addWorksheet('Registrations', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
    });

    worksheet.columns = [
      { header: 'Registration ID', key: 'regId', width: 20 },
      { header: 'Competition Name', key: 'compName', width: 35 },
      { header: 'Type', key: 'regType', width: 15 },
      { header: 'Name (Team/User)', key: 'name', width: 25 },
      { header: 'Email/Members', key: 'sub', width: 35 },
      { header: 'Amount Paid', key: 'amount', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Date', key: 'date', width: 20 }
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.height = 25;
    for (let i = 1; i <= 8; i++) {
      const cell = headerRow.getCell(i);
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF6366F1' }
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
      };
    }

    groupedParticipants.forEach((group, index) => {
      const comp = competitions.find(c => c.id === group.comp_id);
      const fee = Number(comp?.entry_fee) || 0;
      const count = group.isTeam ? group.members.length : 1;
      const baseAmount = fee * count;
      const platformFee = baseAmount === 0 ? 0 : Number((baseAmount * 0.025).toFixed(2));
      const paid = baseAmount + platformFee;

      const row = worksheet.addRow({
        regId: group.id.substring(0, 8).toUpperCase(),
        compName: comp?.title || 'Unknown',
        regType: group.isTeam ? 'Team' : 'Individual',
        name: group.isTeam ? (group.team?.name || 'Unknown Team') : (group.participant?.user?.name || 'Unknown User'),
        sub: group.isTeam ? `${group.members.length} Members` : (group.participant?.user?.email || 'N/A'),
        amount: paid > 0 ? `₹${paid}` : 'Free',
        status: (group.status === 'winner' ? 'Registered' : group.status).toUpperCase(),
        date: new Date(group.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      });

      const isEven = index % 2 === 0;
      for (let i = 1; i <= 8; i++) {
        const cell = row.getCell(i);
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
        };
        if (!isEven) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF9FAFB' }
          };
        }
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Registrations_${compName.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
  }

  return (
    <>
      <Helmet><title>My Competitions | PLUTO</title></Helmet>
      
      <div className="organizer-events-page">
        <div className="container dashboard-container" style={{ maxWidth: '1140px' }}>

          {/* MOBILE MAIN TABS */}
          <div className="org-main-tabs hide-desktop" style={{ marginBottom: '1rem' }}>
            <button
              className={`org-main-tab-btn ${activeTab === 'competitions' ? 'active' : ''}`}
              onClick={() => setSearchParams({ tab: 'competitions' })}
            >
              <Trophy size={16} /> <span>My Competitions</span>
            </button>
            <button
              className={`org-main-tab-btn ${activeTab === 'registrations' ? 'active' : ''}`}
              onClick={() => setSearchParams({ tab: 'registrations' })}
            >
              <Ticket size={16} /> <span>All Registrations</span>
            </button>
          </div>
          
          {/* Desktop Header */}
          <motion.div className="org-header hide-mobile" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="org-header-text">
              <h1 style={{ margin: 0 }}>{activeTab === 'competitions' ? 'My Competitions' : 'All Registrations'}</h1>
              <p>
                {activeTab === 'competitions' 
                  ? 'Manage your hackathons, coding contests, and challenges' 
                  : 'View all participant registrations'}
              </p>
            </div>
            <button className="btn btn-primary org-create-btn" onClick={() => navigate('/create-event', { state: { mode: 'competition' } })}>
              <Plus size={16} /> Create Competition
            </button>
          </motion.div>

          {/* Mobile Header */}
          <motion.div
            className="dashboard-header hide-desktop"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ justifyContent: 'space-between', marginTop: '0.5rem', marginBottom: '1.5rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="header-icon-wrap" style={{ backgroundColor: 'rgba(139,92,246,0.15)' }}>
                {activeTab === 'competitions' ? <Trophy size={22} color="#a78bfa" /> : <Ticket size={22} color="#a78bfa" />}
              </div>
              <div className="org-header-text" style={{ margin: 0 }}>
                <h1 style={{ margin: 0 }}>{activeTab === 'competitions' ? 'My Competitions' : 'All Registrations'}</h1>
              </div>
            </div>
          </motion.div>



          {/* Stats Row */}
          <motion.div
            className="dashboard-stats"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="dstat dstat-primary">
              <div className="dstat-icon"><Trophy size={22} /></div>
              <div className="dstat-info">
                <div className="dstat-value">{isLoading ? <div className="skeleton-block" style={{ width: 40, height: 24, borderRadius: 6 }} /> : stats.total}</div>
                <div className="dstat-label">Competitions</div>
              </div>
            </div>
            
            <div className="dstat dstat-primary">
              <div className="dstat-icon"><Users size={22} /></div>
              <div className="dstat-info">
                <div className="dstat-value">{isLoadingRegs ? <div className="skeleton-block" style={{ width: 40, height: 24, borderRadius: 6 }} /> : stats.regs}</div>
                <div className="dstat-label">Registrations</div>
              </div>
            </div>

            <div className="dstat dstat-primary">
              <div className="dstat-icon"><IndianRupee size={22} /></div>
              <div className="dstat-info">
                <div className="dstat-value">{isLoadingRegs ? <div className="skeleton-block" style={{ width: 60, height: 24, borderRadius: 6 }} /> : (stats.revenue > 0 ? `₹${stats.revenue.toLocaleString('en-IN')}` : '₹0')}</div>
                <div className="dstat-label">Revenue</div>
              </div>
            </div>
          </motion.div>

          {/* Search Row */}
          {activeTab === 'competitions' ? (
            <>
              {/* Mobile Active/Past Tabs */}
              <div className="dashboard-tab-row hide-desktop" style={{ margin: '0 auto 1rem', opacity: isLoading ? 0.5 : 1, pointerEvents: isLoading ? 'none' : 'auto', display: 'flex', gap: '0.5rem', width: 'fit-content' }}>
                <button
                  className={`dashboard-sub-tab-btn ${compTab === 'all' ? 'active' : ''}`}
                  onClick={() => setCompTab('all')}
                >
                  All {(competitions || []).length > 0 && `(${(competitions || []).length})`}
                </button>
                <button
                  className={`dashboard-sub-tab-btn ${compTab === 'active' ? 'active' : ''}`}
                  onClick={() => setCompTab('active')}
                >
                  Active {activeComps.length > 0 && `(${activeComps.length})`}
                </button>
                <button
                  className={`dashboard-sub-tab-btn ${compTab === 'past' ? 'active' : ''}`}
                  onClick={() => setCompTab('past')}
                >
                  Past {pastComps.length > 0 && `(${pastComps.length})`}
                </button>
              </div>

              {/* Desktop Toolbar */}
              <div className="org-events-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', width: '100%', flexWrap: 'nowrap', gap: '1rem' }}>
                <div className="dashboard-tab-row hide-mobile" style={{ marginBottom: 0, opacity: isLoading ? 0.5 : 1, pointerEvents: isLoading ? 'none' : 'auto', flexShrink: 0, display: 'flex', whiteSpace: 'nowrap' }}>
                  <button
                    className={`dashboard-tab-btn ${compTab === 'all' ? 'active' : ''}`}
                    onClick={() => setCompTab('all')}
                  >
                    <List size={18} /> All {(competitions || []).length > 0 && <span className="section-count">{(competitions || []).length}</span>}
                  </button>
                  <button
                    className={`dashboard-tab-btn ${compTab === 'active' ? 'active' : ''}`}
                    onClick={() => setCompTab('active')}
                  >
                    <Calendar size={18} /> Active {activeComps.length > 0 && <span className="section-count">{activeComps.length}</span>}
                  </button>
                  <button
                    className={`dashboard-tab-btn ${compTab === 'past' ? 'active' : ''}`}
                    onClick={() => setCompTab('past')}
                  >
                    <CalendarDays size={18} /> Past {pastComps.length > 0 && <span className="section-count">{pastComps.length}</span>}
                  </button>
                </div>

                <div className="dashboard-search org-events-search" style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  opacity: isLoading ? 0.5 : 1,
                  pointerEvents: isLoading ? 'none' : 'auto',
                  flex: 1,
                  minWidth: '250px'
                }}>
                  <Search size={16} strokeWidth={2.5} style={{ position: 'absolute', left: '14px', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
                  <input 
                    type="text" 
                    placeholder="Search competitions" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 1rem 0.65rem 2.5rem', background: 'rgba(255, 255, 255, 0.04)', border: 'none', borderRadius: '50px', color: 'var(--white)', fontSize: '13px', outline: 'none', boxShadow: 'none' }}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="booking-filters">
              <div className="filter-search">
                <Search size={16} />
                <input 
                  type="text" 
                  placeholder="Search by name, email, or event" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger className="filter-select" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '200px' }}>
                  {filterCompId === 'all' ? 'All Competitions' : competitions.find(c => c.id === filterCompId)?.title || 'Select Competition'}
                  <ChevronDown size={14} />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setFilterCompId('all')}>All Competitions</DropdownMenuItem>
                  {competitions.map(c => (
                    <DropdownMenuItem key={c.id} onClick={() => setFilterCompId(c.id)}>
                      {c.title}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <div 
                className="export-tooltip-wrapper"
              >
                {(filterCompId === 'all' || groupedParticipants.length === 0) && (
                  <div className="export-tooltip">
                    Select a competition to export
                  </div>
                )}
                <button 
                  onClick={handleExportExcel}
                  disabled={filterCompId === 'all' || groupedParticipants.length === 0}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 14px',
                    height: '40px',
                    borderRadius: '20px',
                    background: (filterCompId === 'all' || groupedParticipants.length === 0) ? '#3f3f46' : 'linear-gradient(135deg, #107c41, #185c37)',
                    border: 'none',
                    color: (filterCompId === 'all' || groupedParticipants.length === 0) ? '#a1a1aa' : '#fff',
                    fontWeight: 600,
                    fontSize: '14px',
                    boxShadow: (filterCompId === 'all' || groupedParticipants.length === 0) ? 'none' : '0 2px 8px rgba(16, 124, 65, 0.4)',
                    pointerEvents: (filterCompId === 'all' || groupedParticipants.length === 0) ? 'none' : 'auto'
                  }}
                >
                  <FileSpreadsheet size={16} /> Export Sheet
                </button>
              </div>
            </div>
          )}


          {/* Lists */}
          {activeTab === 'competitions' ? (
            isLoading ? (
              <div className="booking-strips" style={{ marginTop: '0' }}>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="booking-strip" style={{ cursor: 'default' }}>
                    <div className="strip-header" style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1.5fr) 1fr 1fr 1fr auto', alignItems: 'center', gap: '1rem', width: '100%', padding: '1rem 1.25rem' }}>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                        <div className="skeleton-block" style={{ width: 44, height: 44, borderRadius: 8, flexShrink: 0 }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                          <div className="skeleton-block" style={{ height: 16, width: '70%', borderRadius: 4 }} />
                          <div className="skeleton-block" style={{ height: 12, width: '40%', borderRadius: 4 }} />
                        </div>
                      </div>

                      <div className="org-stats-column" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Registrations</span>
                        <div className="skeleton-block" style={{ height: 16, width: '60%', borderRadius: 4, marginTop: 2 }} />
                      </div>

                      <div className="org-stats-column" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Entry Fee</span>
                        <div className="skeleton-block" style={{ height: 16, width: '40%', borderRadius: 4, marginTop: 2 }} />
                      </div>

                      <div className="org-stats-column" style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                        <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Status</span>
                        <div className="skeleton-block" style={{ height: 16, width: '80%', borderRadius: 4, marginTop: 2 }} />
                      </div>

                      <div className="strip-right" style={{ display: 'flex', justifyContent: 'flex-end', marginLeft: 'auto' }}>
                        <div className="skeleton-block" style={{ height: 26, width: 60, borderRadius: 8 }} />
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            ) : filteredComps.length === 0 ? (
              <div className="dashboard-empty">
                <Trophy size={48} strokeWidth={1} style={{ color: 'var(--primary)', opacity: 0.6 }} />
                <h3>No {searchQuery ? 'matches found' : compTab === 'all' ? 'competitions yet' : compTab === 'active' ? 'active competitions' : 'past competitions'}</h3>
                <p>{searchQuery ? 'Try adjusting your search.' : compTab === 'all' ? 'Create your first competition to get started!' : `You don't have any ${compTab} competitions.`}</p>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <div className="booking-strips">
                  {filteredComps.map((comp, i) => {
                    const isHovered = hoveredId === comp.id
                    const CatIcon = CATEGORY_ICONS[comp.category] || Code
                    const regs = getRegCount(comp.id)

                    return (
                      <React.Fragment key={comp.id}>
                        {/* Desktop View */}
                        <motion.div
                          className={`booking-strip hide-mobile ${isHovered ? 'expanded' : ''}`}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.04 * i }}
                          onMouseEnter={() => setHoveredId(comp.id)}
                          onMouseLeave={() => setHoveredId(null)}
                          style={{ cursor: 'default' }}
                          layout
                        >
                          <div className="strip-header" style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1.5fr) 1fr 1fr 1fr auto', alignItems: 'center', gap: '1rem', width: '100%', padding: '1rem 1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                              <div className="strip-thumb" style={{ flexShrink: 0 }}>
                                {comp.banner_url ? (
                                  <img src={comp.banner_url} alt={comp.title} />
                                ) : (
                                  <Trophy size={18} style={{ color: 'var(--primary)', opacity: 0.6 }} />
                                )}
                              </div>
                              <div className="strip-main" style={{ margin: 0, minWidth: 0 }}>
                                <div className="strip-title" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{comp.title || 'Untitled Competition'}</div>
                                <div className="strip-sub">
                                  {comp.start_date && <><CalendarDays size={11} /> {new Date(comp.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</>}
                                  <span style={{ marginLeft: 6 }}><CatIcon size={11} /> {comp.category.replace('_', ' ')}</span>
                                </div>
                              </div>
                            </div>

                            <div className="org-stats-column" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Registrations</span>
                              <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                                <Users size={13} style={{ color: 'var(--text-muted)' }} /> 
                                {regs}
                              </span>
                            </div>

                            <div className="org-stats-column" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Entry Fee</span>
                              <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                                <Ticket size={13} style={{ color: 'var(--text-muted)' }} /> 
                                {comp.entry_fee > 0 ? `₹${comp.entry_fee}` : 'Free'}
                              </span>
                            </div>

                            <div className="org-stats-column" style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                              <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Status</span>
                              <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500, textTransform: 'capitalize' }}>
                                {comp.status}
                              </span>
                            </div>

                            <div className="strip-right" style={{ display: 'flex', alignItems: 'center', gap: '16px', justifyContent: 'flex-end', marginLeft: 'auto' }}>
                              <button 
                                className="btn btn-primary" 
                                style={{ padding: '6px 14px', fontSize: '0.8rem', height: '32px', borderRadius: '50px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/organizer/competitions/${comp.id}/participants`);
                                }}
                              >
                                <Settings size={14} /> Manage
                              </button>
                              <ChevronDown size={18} className="strip-chevron" />
                            </div>
                          </div>

                          <AnimatePresence>
                            {isHovered && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2, ease: 'easeOut' }}
                                style={{ overflow: 'hidden' }}
                              >
                                <div style={{ 
                                  display: 'flex', gap: '12px', justifyContent: 'flex-end', 
                                  padding: '0 1.25rem 1rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.05)',
                                  marginTop: '0.25rem', paddingTop: '1rem'
                                }}>
                                  <button className="btn btn-outline" onClick={(e) => { e.stopPropagation(); navigate(`/competition/${comp.id}`) }}
                                    style={{ padding: '6px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255, 255, 255, 0.7)', background: '#3c3c3e', border: 'none', borderRadius: '20px' }}>
                                    <Eye size={14} color="var(--primary, #8b5cf6)" /> View Details
                                  </button>
                                  
                                  <button className="btn btn-outline" onClick={(e) => { e.stopPropagation(); navigate(`/edit-event/${comp.id}?type=competition`) }}
                                    style={{ padding: '6px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255, 255, 255, 0.7)', background: '#3c3c3e', border: 'none', borderRadius: '20px' }}>
                                    <Edit size={14} color="#60a5fa" /> Edit
                                  </button>

                                  <button className="btn btn-outline" onClick={(e) => { e.stopPropagation(); handleDelete(comp.id, comp.title) }}
                                    style={{ padding: '6px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255, 255, 255, 0.7)', background: '#3c3c3e', border: 'none', borderRadius: '20px' }}>
                                    <Trash2 size={14} color="#fca5a5" /> Delete
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>

                        {/* Mobile View */}
                        <div className="hide-desktop" style={{ flexDirection: 'column', backgroundColor: '#1e1e1e', borderRadius: '24px', padding: '14px', marginBottom: '16px', position: 'relative', overflow: 'hidden', cursor: 'pointer' }} onClick={() => navigate(`/competition/${comp.id}`)}>
                          <div style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.08) 0%, transparent 100%)', position: 'absolute', left: 0, top: 0, bottom: 0, width: 80, zIndex: 0 }} />
                          
                          <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}>
                            <DropdownMenu>
                              <DropdownMenuTrigger style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }} onClick={(e) => e.stopPropagation()}>
                                <MoreVertical size={20} color="#71717a" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/competition/${comp.id}`) }}>
                                  <Eye size={14} style={{ marginRight: 8 }} /> View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/edit-event/${comp.id}?type=competition`) }}>
                                  <Edit size={14} style={{ marginRight: 8 }} /> Edit Competition
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/organizer/competitions/${comp.id}/participants`) }}>
                                  <UserCheck size={14} style={{ marginRight: 8 }} /> Participants
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDelete(comp.id, comp.title) }} style={{ color: '#ef4444' }}>
                                  <Trash2 size={14} style={{ marginRight: 8 }} /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', position: 'relative', zIndex: 1 }}>
                            <div style={{ width: 80, height: 80, borderRadius: 16, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.05)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {comp.banner_url ? (
                                <img src={comp.banner_url} alt={comp.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <Trophy size={24} color="rgba(139,92,246,0.3)" />
                              )}
                            </div>
                            
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingRight: '24px' }}>
                              <div style={{ fontSize: '16px', fontWeight: 800, color: '#fff', marginBottom: '8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {comp.title}
                              </div>
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, color: '#fff' }}>
                                  {comp.entry_fee > 0 ? `₹${comp.entry_fee}` : 'Free'}
                                </div>
                                <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, color: CATEGORY_COLORS[comp.category] || '#38bdf8' }}>
                                  {comp.category.replace('_', ' ')}
                                </div>
                                <div style={{ backgroundColor: comp.status === 'pending' ? 'rgba(251,191,36,0.12)' : comp.status === 'rejected' ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, color: comp.status === 'pending' ? '#fbbf24' : comp.status === 'rejected' ? '#ef4444' : '#34d399', textTransform: 'capitalize' }}>
                                  {comp.status || 'pending'}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', position: 'relative', zIndex: 1 }}>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '10px 0' }}>
                              <span style={{ fontSize: '9px', color: '#71717a', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Team Size</span>
                              <span style={{ fontSize: '13px', color: '#e4e4e7', fontWeight: 600 }}>
                                {comp.registration_type === 'individual' ? '1' : `${comp.team_size_min || 2}-${comp.team_size_max || 5}`}
                              </span>
                            </div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '10px 0' }}>
                              <span style={{ fontSize: '9px', color: '#71717a', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Deadline</span>
                              <span style={{ fontSize: '13px', color: '#e4e4e7', fontWeight: 600 }}>
                                {comp.registration_deadline ? new Date(comp.registration_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'N/A'}
                              </span>
                            </div>
                            <div 
                              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '10px 0' }}
                              onClick={(e) => { e.stopPropagation(); navigate(`/organizer/competitions/${comp.id}/participants`); }}
                            >
                              <span style={{ fontSize: '9px', color: '#71717a', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Control</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                <span style={{ fontSize: '13px', color: '#e4e4e7', fontWeight: 600 }}>Manage</span>
                                <ChevronRight size={14} color="#e4e4e7" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    )
                  })}
                </div>
              </AnimatePresence>
            )
          ) : (
            isLoadingRegs ? (
              <div className="booking-strips" style={{ marginTop: '0' }}>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="booking-strip" style={{ cursor: 'default' }}>
                    <div className="strip-header" style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1.5fr) 1fr 1fr 1fr auto', alignItems: 'center', gap: '1rem', width: '100%', padding: '1rem 1.25rem' }}>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                        <div className="skeleton-block" style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0 }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                          <div className="skeleton-block" style={{ height: 16, width: '70%', borderRadius: 4 }} />
                          <div className="skeleton-block" style={{ height: 12, width: '40%', borderRadius: 4 }} />
                        </div>
                      </div>

                      <div className="org-stats-column" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Competition</span>
                        <div className="skeleton-block" style={{ height: 16, width: '60%', borderRadius: 4, marginTop: 2 }} />
                      </div>

                      <div className="org-stats-column" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Amount Paid</span>
                        <div className="skeleton-block" style={{ height: 16, width: '40%', borderRadius: 4, marginTop: 2 }} />
                      </div>

                      <div className="org-stats-column" style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                        <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Status</span>
                        <div className="skeleton-block" style={{ height: 16, width: '80%', borderRadius: 4, marginTop: 2 }} />
                      </div>

                      <div className="strip-right" style={{ display: 'flex', justifyContent: 'flex-end', marginLeft: 'auto' }}>
                        <div style={{ width: 60 }} />
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            ) : groupedParticipants.length === 0 ? (
              <div className="dashboard-empty">
                <Ticket size={48} strokeWidth={1} style={{ color: 'var(--primary)', opacity: 0.6 }} />
                <h3>No {searchQuery ? 'participants found' : 'registrations yet'}</h3>
              </div>
            ) : (
              <div className="booking-strips">
                {groupedParticipants.map((group, i) => {
                  const comp = competitions.find(c => c.id === group.comp_id)
                  const displayName = group.isTeam ? (group.team?.name || 'Unknown Team') : (group.participant?.user?.name || 'Unknown User')
                  const displaySub = group.isTeam ? `${group.members.length} Members` : (group.participant?.user?.email || 'Individual')
                  
                  return (
                    <React.Fragment key={group.id}>
                      {/* Desktop View */}
                      <motion.div
                        className="booking-strip hide-mobile"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.04 * i }}
                        style={{ cursor: 'default', height: 'auto', flexDirection: 'column' }}
                      >
                        <div className="strip-header" style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1.5fr) 1fr 1fr 1fr auto', alignItems: 'center', gap: '1rem', width: '100%', padding: '1rem 1.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                            <div style={{ width: 40, height: 40, borderRadius: '12px', backgroundColor: 'rgba(139,92,246,0.1)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              {comp?.banner_url ? (
                                <img src={comp.banner_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <Trophy size={18} color="#a78bfa" />
                              )}
                            </div>
                            <div className="strip-main" style={{ margin: 0, minWidth: 0 }}>
                              <div className="strip-title" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName}</div>
                              <div className="strip-sub" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displaySub}</div>
                            </div>
                          </div>

                          <div className="org-stats-column" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Competition</span>
                            <span style={{ fontSize: '0.85rem', color: '#a78bfa', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{comp?.title || 'Unknown'}</span>
                          </div>

                          <div className="org-stats-column" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Amount Paid</span>
                            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                              <Ticket size={13} style={{ color: 'var(--text-muted)' }} /> 
                              {(() => {
                                const fee = Number(comp?.entry_fee) || 0;
                                const count = group.isTeam ? group.members.length : 1;
                                const baseAmount = fee * count;
                                const platformFee = baseAmount === 0 ? 0 : Number((baseAmount * 0.025).toFixed(2));
                                const paid = baseAmount + platformFee;
                                return paid > 0 ? `₹${paid.toLocaleString('en-IN')}` : 'Free';
                              })()}
                            </span>
                          </div>

                          <div className="org-stats-column" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Status</span>
                            <span style={{ fontSize: '0.85rem', color: '#34d399', fontWeight: 600, textTransform: 'capitalize' }}>
                              {group.status === 'winner' ? 'Registered' : group.status}
                            </span>
                          </div>
                        </div>
                        
                        {group.isTeam && group.members.length > 0 && (
                          <div style={{ display: 'flex', gap: '0.5rem', padding: '0 1.25rem 1rem 1.25rem', flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                            {group.members.map((m: any) => (
                              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(255,255,255,0.05)', padding: '0.25rem 0.5rem', borderRadius: '0.5rem' }}>
                                {m.user?.profile_avatar ? (
                                  <img src={m.user.profile_avatar} style={{ width: 16, height: 16, borderRadius: '50%' }} />
                                ) : (
                                  <div style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: 'rgba(167,139,250,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <UserCheck size={10} color="#a78bfa" />
                                  </div>
                                )}
                                <span style={{ fontSize: '0.75rem', color: '#e4e4e7' }}>{m.user?.name?.split(' ')[0] || 'User'}</span>
                                {m.team_role === 'leader' && <span style={{ fontSize: '0.65rem', color: '#e3be63' }}>(lead)</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>

                      {/* Mobile View */}
                      <div className="hide-desktop" style={{ flexDirection: 'column', backgroundColor: '#1e1e1e', borderRadius: '24px', padding: '16px', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                          <div style={{ width: 44, height: 44, borderRadius: '12px', backgroundColor: 'rgba(139,92,246,0.1)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', display: 'flex', flexShrink: 0 }}>
                            {comp?.banner_url ? (
                              <img src={comp.banner_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <Trophy size={18} color="#a78bfa" />
                            )}
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px', gap: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                                {!group.isTeam && (
                                  <div style={{ width: 20, height: 20, borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                                    {group.participant?.user?.profile_avatar ? (
                                      <img src={group.participant.user.profile_avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                      <UserCheck size={10} color="#e4e4e7" />
                                    )}
                                  </div>
                                )}
                                <span style={{ fontSize: '14px', fontWeight: 700, color: '#e4e4e7', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.2 }}>{displayName}</span>
                              </div>

                              <div style={{ padding: '4px 10px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.12)' }}>
                                <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#34d399', lineHeight: 1 }}>
                                  {group.status === 'winner' ? 'Registered' : group.status || 'Registered'}
                                </span>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                              <span style={{ fontSize: '11px', color: '#71717a', lineHeight: 1.2 }}>
                                {group.isTeam ? `${group.members.length} Members` : 'Individual'}
                              </span>
                              <span style={{ fontSize: '10px', color: '#52525b', lineHeight: 1.2 }}>Stage {group.current_stage}</span>
                            </div>
                            <div style={{ fontSize: '11px', color: '#a1a1aa', marginTop: '2px', lineHeight: 1.2 }}>{comp?.title || 'Unknown Competition'}</div>
                            
                            <div style={{ display: 'inline-flex', alignItems: 'center', marginTop: '8px', backgroundColor: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '6px' }}>
                              {(() => {
                                const fee = Number(comp?.entry_fee) || 0;
                                const count = group.isTeam ? group.members.length : 1;
                                const baseAmount = fee * count;
                                const platformFee = baseAmount === 0 ? 0 : Number((baseAmount * 0.025).toFixed(2));
                                const paid = baseAmount + platformFee;
                                if (paid === 0) return <span style={{ fontSize: '11px', color: '#fff', fontWeight: 700 }}>Free</span>;
                                return (
                                  <span style={{ fontSize: '11px', color: '#a1a1aa' }}>
                                    ₹{baseAmount} + ₹{platformFee} fees = <span style={{ color: '#fff', fontWeight: 700 }}>₹{paid}</span>
                                  </span>
                                )
                              })()}
                            </div>
                          </div>
                        </div>

                        {group.isTeam && group.members.length > 0 && (
                          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {group.members.map((m: any) => (
                              <div key={m.id} style={{ display: 'flex', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: '6px 8px', borderRadius: '12px', gap: '6px' }}>
                                {m.user?.profile_avatar ? (
                                  <img src={m.user.profile_avatar} style={{ width: 16, height: 16, borderRadius: '8px', objectFit: 'cover' }} />
                                ) : (
                                  <div style={{ width: 16, height: 16, borderRadius: '8px', backgroundColor: 'rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <UserCheck size={8} color="#a78bfa" />
                                  </div>
                                )}
                                <span style={{ fontSize: '11px', color: '#e4e4e7' }}>{m.user?.name?.split(' ')[0] || 'User'}</span>
                                {m.team_role === 'leader' && <span style={{ fontSize: '10px', color: '#e3be63', marginLeft: '2px' }}>(lead)</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </React.Fragment>
                  )
                })}
              </div>
            )
          )}

        </div>
      </div>
    </>
  )
}
