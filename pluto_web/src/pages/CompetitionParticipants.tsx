import React, { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  Users, User, ArrowLeft, Search, CheckCircle2, XCircle, Clock, FileText, ChevronRight, Settings, Calendar, Star, X, UserCheck, ListChecks, CheckSquare, Square, Video, GitBranch, Link as LinkIcon, ArrowUpCircle, Award, Download
} from 'lucide-react'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { CustomFormResponseViewer } from '@/components/forms/CustomFormResponseViewer'
import type { CustomFormConfig } from '@/types/form'

import { useCompParticipants, useCompTeams, useUpdateParticipantStatus, useBulkUpdateStatus } from '@/hooks/useCompetitionRegistrations'
import { useCompetition, useUpdateCompetition } from '@/hooks/useCompetitions'
import './Dashboard.css'
import './OrganizerDashboard.css'
import './CompetitionParticipants.css'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  registered: { label: 'Registered', color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
  confirmed: { label: 'Confirmed', color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
  shortlisted: { label: 'Shortlisted', color: '#38bdf8', bg: 'rgba(56,189,248,0.1)' },
  eliminated: { label: 'Eliminated', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  winner: { label: 'Winner', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  withdrawn: { label: 'Withdrawn', color: '#71717a', bg: 'rgba(113,113,122,0.1)' },
}

const FILTER_TABS = ['All', 'Registered', 'Shortlisted', 'Eliminated', 'Winner']

export default function CompetitionParticipants() {
  const { competitionId } = useParams<{ competitionId: string }>()
  const navigate = useNavigate()

  useEffect(() => {
    document.body.classList.add('cp-mobile-active')
    return () => {
      document.body.classList.remove('cp-mobile-active')
    }
  }, [])

  const [search, setSearch] = useState('')
  const [confirmAction, setConfirmAction] = useState<{ type: 'advance' | 'eliminate' | 'winner' | 'bulk_advance' | 'bulk_eliminate', group?: any } | null>(null)
  const [activeFilter, setActiveFilter] = useState('All')
  const [dashboardTab, setDashboardTab] = useState<'participants' | 'submissions' | 'settings'>('participants')
  const [submissionStageFilter, setSubmissionStageFilter] = useState<number | 'all'>('all')
  
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [detailModal, setDetailModal] = useState<any | null>(null)
  const [selectedMemberProfile, setSelectedMemberProfile] = useState<any | null>(null)

  const { data: participants, isLoading, refetch } = useCompParticipants(competitionId)
  const { data: teams } = useCompTeams(competitionId)
  const { data: competition } = useCompetition(competitionId)
  
  const updateStatus = useUpdateParticipantStatus()
  const bulkUpdate = useBulkUpdateStatus()
  const updateCompetition = useUpdateCompetition()

  // Grouping logic across all participants first
  const allGroupedParticipants = useMemo(() => {
    if (!participants) return []
    const groups: { [key: string]: any } = {}
    participants.forEach(p => {
      if (p.registration_type === 'team' && p.team_id) {
        if (!groups[p.team_id]) {
          groups[p.team_id] = { isTeam: true, id: p.team_id, team: p.team, members: [], status: p.status, current_stage: p.current_stage }
        }
        groups[p.team_id].members.push(p)
      } else {
        groups[p.id] = { isTeam: false, id: p.id, participant: p, status: p.status, current_stage: p.current_stage }
      }
    })
    return Object.values(groups)
  }, [participants])

  // Stats based on unique entities (groups)
  const stats = useMemo(() => {
    if (!allGroupedParticipants.length) return { total: 0, individuals: 0, teams: 0, shortlisted: 0 }
    return {
      total: participants?.length || 0,
      teams: allGroupedParticipants.filter((g: any) => g.isTeam).length,
      shortlisted: allGroupedParticipants.filter((g: any) => g.status === 'shortlisted').length,
    }
  }, [allGroupedParticipants, participants])

  // Filter & search
  const groupedParticipants = useMemo(() => {
    let list = [...allGroupedParticipants]
    if (activeFilter !== 'All') {
      list = list.filter(g => g.status === activeFilter.toLowerCase())
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(g => {
        if (g.isTeam) return g.team?.name?.toLowerCase().includes(q)
        return g.participant?.user?.name?.toLowerCase().includes(q) || g.participant?.user?.email?.toLowerCase().includes(q)
      })
    }
    return list
  }, [allGroupedParticipants, activeFilter, search])

  // Individual Actions
  const handleAdvanceGroup = (group: any) => setConfirmAction({ type: 'advance', group })
  const handleEliminateGroup = (group: any) => setConfirmAction({ type: 'eliminate', group })
  const handleWinnerGroup = (group: any) => setConfirmAction({ type: 'winner', group })

  // Collect Submissions
  const allSubmissions = useMemo(() => {
    const result: any[] = [];
    allGroupedParticipants.forEach((group: any) => {
      const submissionsObj = group.isTeam ? group.team?.submissions : group.participant?.submissions;
      if (submissionsObj && typeof submissionsObj === 'object') {
        Object.keys(submissionsObj).forEach(stageIdxStr => {
          if (stageIdxStr === 'custom_form_response') return;
          const stageIdx = parseInt(stageIdxStr, 10);
          if (isNaN(stageIdx)) return;
          const sub = submissionsObj[stageIdxStr];
          if (!sub || typeof sub !== 'object') return;
          result.push({
            group,
            stageIdx,
            submission: sub
          });
        });
      }
    });
    return result.sort((a, b) => new Date(b.submission?.submitted_at || 0).getTime() - new Date(a.submission?.submitted_at || 0).getTime());
  }, [allGroupedParticipants]);

  const uniqueSubmittingGroups = useMemo(() => new Set(allSubmissions.map(sub => sub.group.isTeam ? sub.group.team?.id : (sub.group.participant?.user?.id || sub.group.id))).size, [allSubmissions]);
  const pendingGroups = allGroupedParticipants.length - uniqueSubmittingGroups;

  const submissionStages = useMemo(() => {
    const stages = new Set<number>();
    allSubmissions.forEach(sub => {
      if (!isNaN(sub.stageIdx)) stages.add(sub.stageIdx);
    });
    return Array.from(stages).sort((a,b) => a - b);
  }, [allSubmissions]);

  // Bulk Actions
  const toggleSelection = (groupId: string, isTeam: boolean, members?: any[]) => {
    if (isTeam && members) {
      setSelectedIds(prev => {
        const next = new Set(prev)
        const allSelected = members.every(m => next.has(m.id))
        if (allSelected) members.forEach(m => next.delete(m.id))
        else members.forEach(m => next.add(m.id))
        if (next.size === 0) setIsSelectionMode(false)
        return next
      })
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev)
        if (next.has(groupId)) next.delete(groupId)
        else next.add(groupId)
        if (next.size === 0) setIsSelectionMode(false)
        return next
      })
    }
  }

  const toggleSelectGroup = (groupId: string, isTeam: boolean, members?: any[]) => {
    if (!isSelectionMode) setIsSelectionMode(true);
    toggleSelection(groupId, isTeam, members);
  }

  const exportExcel = async () => {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Participants')

    // Define Headers
    const headers = ['Entity Name', 'Member Name', 'Email', 'Type', 'Status', 'Registered At']
    submissionStages.forEach(stage => headers.push(`Round ${stage + 1} Submission`))

    const customForm: CustomFormConfig | null = (competition as any)?.custom_form || (competition as any)?.eligibility?.custom_form || null
    const formFields = customForm?.fields || []
    if (formFields.length > 0) {
      formFields.forEach(f => headers.push(`[Form] ${f.label}`))
    }

    worksheet.addRow(headers)

    // Style Header Row
    const headerRow = worksheet.getRow(1)
    headerRow.eachCell({ includeEmpty: false }, (cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF3c3c3e' }
      }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFDDDDDD' } },
        left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
        bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } },
        right: { style: 'thin', color: { argb: 'FFFFFFFF' } }
      }
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
    })
    
    // Add Data
    let currentRowIdx = 2 // Row 1 is header

    allGroupedParticipants.forEach((group: any) => {
      const isTeam = group.isTeam
      const entityName = isTeam ? group.team.name : (group.participant.user?.name || group.participant.user?.email || 'Unknown')
      const regType = isTeam ? 'Team' : 'Individual'
      const statusLabel = STATUS_CONFIG[group.status]?.label || group.status
      
      const members = isTeam ? group.members : [group.participant]
      const startRowIdx = currentRowIdx

      // Submission data for the group
      const submissionsObj = isTeam ? group.team?.submissions : group.participant?.submissions

      members.forEach((member: any) => {
        const rowData: any[] = [
          entityName,
          member.user?.name || '',
          member.user?.email || '',
          regType,
          statusLabel,
          new Date(member.created_at).toLocaleDateString()
        ]
        
        // Add submission links
        submissionStages.forEach(stage => {
          let subText = 'N/A'
          const sub = submissionsObj?.[stage]
          if (sub) {
            const urls = Object.keys(sub)
              .filter(k => k !== 'submitted_at' && typeof sub[k] === 'string' && sub[k].trim() !== '')
              .map(k => sub[k])
            
            if (urls.length > 0) {
              subText = urls.join('\n')
            } else {
              subText = 'Submitted'
            }
          }
          rowData.push(subText)
        })

        // Add custom form answers
        if (formFields.length > 0) {
          const formResponseObj = submissionsObj?.custom_form_response ||
            (isTeam ? (group.members?.find((m: any) => m.team_role === 'leader')?.submissions?.custom_form_response || group.team?.submissions?.custom_form_response) : group.participant?.submissions?.custom_form_response)
          const formAnswers = formResponseObj?.answers || {}

          formFields.forEach(f => {
            const ans = formAnswers[f.id]
            let ansStr = '—'
            if (ans !== undefined && ans !== null && ans !== '') {
              if (Array.isArray(ans)) {
                ansStr = ans.join(', ')
              } else {
                ansStr = String(ans)
              }
            }
            rowData.push(ansStr)
          })
        }

        const row = worksheet.addRow(rowData)
        
        // Style cells
        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true }
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFDDDDDD' } },
            left: { style: 'thin', color: { argb: 'FFDDDDDD' } },
            bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } },
            right: { style: 'thin', color: { argb: 'FFDDDDDD' } }
          }
          
          // Make link clickable if it looks like a URL
          if (typeof cell.value === 'string' && cell.value.startsWith('http') && !cell.value.includes('\n')) {
            cell.value = { text: cell.value, hyperlink: cell.value }
            cell.font = { color: { argb: 'FF0563C1' }, underline: true }
          }
        })
        
        currentRowIdx++
      })

      // Merge cells for teams
      if (isTeam && members.length > 1) {
        const endRowIdx = currentRowIdx - 1
        // Merge Entity Name (col 1), Type (col 4), Status (col 5), Registered At (col 6)
        worksheet.mergeCells(startRowIdx, 1, endRowIdx, 1)
        worksheet.mergeCells(startRowIdx, 4, endRowIdx, 4)
        worksheet.mergeCells(startRowIdx, 5, endRowIdx, 5)
        worksheet.mergeCells(startRowIdx, 6, endRowIdx, 6)
        
        // Merge submission columns
        submissionStages.forEach((_, idx) => {
          const colIdx = 7 + idx // Columns are 1-indexed: 1-6 are base cols
          worksheet.mergeCells(startRowIdx, colIdx, endRowIdx, colIdx)
        })

        // Merge form columns
        if (formFields.length > 0) {
          formFields.forEach((_, fIdx) => {
            const colIdx = 7 + submissionStages.length + fIdx
            worksheet.mergeCells(startRowIdx, colIdx, endRowIdx, colIdx)
          })
        }
      }
    })

    // Set Column Widths
    worksheet.columns.forEach((col, idx) => {
      if (idx === 2) col.width = 30 // Email
      else if (idx === 0) col.width = 25 // Entity Name
      else if (idx === 1) col.width = 25 // Member Name
      else if (idx >= 6) col.width = 35 // Submissions
      else col.width = 15
    })

    // Write file
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    saveAs(blob, `${competition?.title || 'Competition'}_Participants.xlsx`)
  }

  if (isLoading) {
    return (
      <>
        <Helmet><title>Loading Dashboard | PLUTO</title></Helmet>
        <div className="cp-container">
          <div className="cp-header">
            <div className="cp-header-normal org-header hide-mobile" style={{ margin: 0 }}>
              <div className="org-header-text" style={{ flex: 1 }}>
                <div className="skeleton-block" style={{ width: 280, height: 32, borderRadius: 8, marginBottom: 8 }} />
                <div className="skeleton-block" style={{ width: 160, height: 20, borderRadius: 4 }} />
              </div>
            </div>
          </div>
          
          <div className="dashboard-tab-row hide-desktop" style={{ margin: '0 auto 24px', display: 'flex', gap: '0.5rem', width: 'fit-content' }}>
            <div className="skeleton-block" style={{ width: 100, height: 36, borderRadius: 50 }} />
            <div className="skeleton-block" style={{ width: 100, height: 36, borderRadius: 50 }} />
            <div className="skeleton-block" style={{ width: 100, height: 36, borderRadius: 50 }} />
          </div>

          <div className="dashboard-tab-row hide-mobile" style={{ marginBottom: '24px' }}>
            <div className="skeleton-block" style={{ width: 120, height: 40, borderRadius: 8 }} />
            <div className="skeleton-block" style={{ width: 120, height: 40, borderRadius: 8 }} />
            <div className="skeleton-block" style={{ width: 120, height: 40, borderRadius: 8 }} />
          </div>

          {/* Stats Row Desktop */}
          <div className="dashboard-stats hide-mobile" style={{ marginBottom: '24px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="dstat dstat-primary" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div className="skeleton-block" style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  <div className="skeleton-block" style={{ height: 24, width: '40%', borderRadius: 4 }} />
                  <div className="skeleton-block" style={{ height: 14, width: '70%', borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>

          <div className="cp-main-content">
            <div className="cp-search-wrap">
              <div className="skeleton-block" style={{ height: 24, width: 24, borderRadius: '50%' }} />
              <div className="skeleton-block" style={{ height: 16, width: '30%', borderRadius: 4 }} />
            </div>

            <div className="cp-participants-grid">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="cp-participant-card" style={{ cursor: 'default' }}>
                  <div className="cp-participant-header">
                    <div className="skeleton-block" style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0 }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div className="skeleton-block" style={{ height: 16, width: '70%', borderRadius: 4 }} />
                      <div className="skeleton-block" style={{ height: 12, width: '40%', borderRadius: 4 }} />
                    </div>
                  </div>
                  <div className="cp-participant-content" style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="skeleton-block" style={{ height: 12, width: '100%', borderRadius: 4 }} />
                    <div className="skeleton-block" style={{ height: 12, width: '80%', borderRadius: 4 }} />
                    <div className="skeleton-block" style={{ height: 32, width: '100%', borderRadius: 20, marginTop: '8px' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Helmet><title>Dashboard — {competition?.title || 'Competition'} | PLUTO</title></Helmet>
      <div className="cp-container">
        
        {/* Header */}
        <div className="cp-header">
          {isSelectionMode ? (
            <div className="cp-header-selection">
              <button onClick={() => { setIsSelectionMode(false); setSelectedIds(new Set()) }} className="cp-icon-btn">
                <X size={20} color="#fff" />
              </button>
              <div className="cp-header-text">
                <h2>{selectedIds.size} Selected</h2>
              </div>
              <button onClick={() => setSelectedIds(new Set((participants || []).map(p => p.id)))} className="cp-select-all-btn">
                Select All
              </button>
            </div>
          ) : (
            <>
              <div className="cp-header-normal org-header hide-mobile" style={{ margin: 0 }}>
                <div className="org-header-text" style={{ flex: 1 }}>
                  <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    Competition Manager
                  </h1>
                  <p>{competition?.title || 'Competition'}</p>
                </div>
                <button className="btn btn-primary org-create-btn" onClick={exportExcel}>
                  <Download size={16} /> Export Excel
                </button>
              </div>
              
              <div className="mobile-app-header hide-desktop">
                <button onClick={() => navigate(-1)} className="mobile-app-header-btn">
                  <ArrowLeft size={20} color="#fff" />
                </button>
                <div style={{ flex: 1 }}>
                  <h1 className="mobile-app-header-title">Organizer Dashboard</h1>
                  <p className="mobile-app-header-sub">{competition?.title || 'Competition'}</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Dashboard Tabs */}
        {!isSelectionMode && (
          <>
            {/* Dashboard Tabs (Mobile) */}
            <div className="mobile-app-tabs hide-desktop">
              <button className={`mobile-app-tab-btn ${dashboardTab === 'participants' ? 'active' : ''}`} onClick={() => setDashboardTab('participants')}>
                <Users size={14} color={dashboardTab === 'participants' ? '#09090b' : '#71717a'} />
                Participants
              </button>
              <button className={`mobile-app-tab-btn ${dashboardTab === 'submissions' ? 'active' : ''}`} onClick={() => setDashboardTab('submissions')}>
                <FileText size={14} color={dashboardTab === 'submissions' ? '#09090b' : '#71717a'} />
                Submissions
              </button>
              <button className={`mobile-app-tab-btn ${dashboardTab === 'settings' ? 'active' : ''}`} onClick={() => setDashboardTab('settings')}>
                <Settings size={14} color={dashboardTab === 'settings' ? '#09090b' : '#71717a'} />
                Settings
              </button>
            </div>

            {/* Dashboard Tabs (Desktop) */}
            <div className="dashboard-tab-row hide-mobile" style={{ marginBottom: '24px' }}>
              <button className={`dashboard-tab-btn ${dashboardTab === 'participants' ? 'active' : ''}`} onClick={() => setDashboardTab('participants')}>
                <Users size={18} /> Participants
              </button>
              <button className={`dashboard-tab-btn ${dashboardTab === 'submissions' ? 'active' : ''}`} onClick={() => setDashboardTab('submissions')}>
                <FileText size={18} /> Submissions
              </button>
              <button className={`dashboard-tab-btn ${dashboardTab === 'settings' ? 'active' : ''}`} onClick={() => setDashboardTab('settings')}>
                <Settings size={18} /> Settings
              </button>
            </div>
          </>
        )}

        {dashboardTab === 'participants' && (
          <>
            {/* Stats Row */}
            {!isSelectionMode && (
              <>
                {/* Stats Row (Mobile) */}
                <div className="mobile-app-stats hide-desktop">
                  <div className="mobile-app-stat-chip">
                    <div className="mobile-app-stat-icon">
                      <UserCheck size={14} color="#38bdf8" />
                    </div>
                    <div className="mobile-app-stat-val">{stats.total}</div>
                    <div className="mobile-app-stat-lbl">Participants</div>
                  </div>
                  <div className="mobile-app-stat-chip">
                    <div className="mobile-app-stat-icon">
                      <Users size={14} color="#38bdf8" />
                    </div>
                    <div className="mobile-app-stat-val">{stats.teams}</div>
                    <div className="mobile-app-stat-lbl">Teams</div>
                  </div>
                  <div className="mobile-app-stat-chip">
                    <div className="mobile-app-stat-icon">
                      <ListChecks size={14} color="#38bdf8" />
                    </div>
                    <div className="mobile-app-stat-val" style={{ color: '#34d399' }}>{stats.shortlisted}</div>
                    <div className="mobile-app-stat-lbl">Shortlisted</div>
                  </div>
                </div>

                {/* Stats Row (Desktop) */}
                <div className="dashboard-stats hide-mobile" style={{ marginBottom: '24px' }}>
                  <div className="dstat dstat-primary">
                    <div className="dstat-icon"><Users size={22} /></div>
                    <div className="dstat-info">
                      <div className="dstat-value">
                        <span>{stats.total}</span>
                      </div>
                      <div className="dstat-label">Participants</div>
                    </div>
                  </div>
                  <div className="dstat dstat-primary">
                    <div className="dstat-icon"><Users size={22} /></div>
                    <div className="dstat-info">
                      <div className="dstat-value">
                        <span>{stats.teams}</span>
                      </div>
                      <div className="dstat-label">Teams</div>
                    </div>
                  </div>
                  <div className="dstat dstat-primary">
                    <div className="dstat-icon"><ListChecks size={22} /></div>
                    <div className="dstat-info">
                      <div className="dstat-value">
                        <span>{stats.shortlisted}</span>
                      </div>
                      <div className="dstat-label">Shortlisted</div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Filter Tabs */}
            <div className="cp-filter-tabs-wrap hide-mobile">
              <div className="cp-filter-tabs">
                {FILTER_TABS.map(tab => (
                  <button key={tab} className={`cp-filter-tab ${activeFilter === tab ? 'active' : ''}`} onClick={() => setActiveFilter(tab)}>
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Filter Tabs (Mobile) */}
            <div className="mobile-app-filters hide-desktop">
              {FILTER_TABS.map(tab => (
                <button key={tab} className={`mobile-app-filter-btn ${activeFilter === tab ? 'active' : ''}`} onClick={() => setActiveFilter(tab)}>{tab}</button>
              ))}
            </div>

            <div className="cp-main-content mobile-list-container-override">
              {/* Search */}
              <div className="cp-search-wrap hide-mobile">
                <Search size={16} color="#52525b" />
                <input type="text" placeholder="Search participants..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div className="mobile-app-search hide-desktop">
                <Search size={16} color="#52525b" />
                <input type="text" placeholder="Search participants..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>

              <div className="cp-participants-grid">
                {groupedParticipants.length === 0 ? (
                  <div className="cp-empty-state">
                    <Users size={40} color="rgba(255,255,255,0.1)" />
                    <p>No participants found</p>
                  </div>
                ) : (
                  groupedParticipants.map(group => {
                    const statusConf = STATUS_CONFIG[group.status] || STATUS_CONFIG.registered
                    const isTeam = group.isTeam
                    const displayName = isTeam ? group.team.name : (group.participant.user?.name || group.participant.user?.email || 'Unknown')
                    const showActions = group.status !== 'eliminated' && group.status !== 'winner' && group.status !== 'withdrawn'
                    
                    const isSelected = isTeam ? group.members.every((m: any) => selectedIds.has(m.id)) : selectedIds.has(group.id)

                    return (
                      <div 
                        key={group.id} 
                        className={`cp-participant-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => isSelectionMode ? toggleSelectGroup(group.id, isTeam, group.members) : setDetailModal(group)}
                      >
                        <div className="cp-participant-header">
                          
                          {isSelectionMode && (
                            <div className="cp-checkbox" onClick={(e) => { e.stopPropagation(); toggleSelectGroup(group.id, isTeam, group.members) }}>
                              {isSelected ? <CheckSquare size={20} color="#8b5cf6" /> : <Square size={20} color="#52525b" />}
                            </div>
                          )}

                          {/* Avatar */}
                          <div className={`cp-avatar ${isTeam ? 'team' : ''}`}>
                            {isTeam ? (
                              (() => {
                                const leader = group.members.find((m: any) => m.team_role === 'leader') || group.members[0];
                                if (leader?.user?.profile_avatar) {
                                  return <img src={leader.user.profile_avatar} alt="Avatar" />
                                }
                                return <Users size={16} color="#a1a1aa" />
                              })()
                            ) : (
                              group.participant.user?.profile_avatar ? (
                                <img src={group.participant.user.profile_avatar} alt="Avatar" />
                              ) : (
                                <UserCheck size={16} color="#a78bfa" />
                              )
                            )}
                          </div>

                          {/* Info */}
                          <div className="cp-participant-info">
                            <h4>{displayName}</h4>
                            <div className="cp-participant-meta">
                              {isTeam ? (
                                <div className="cp-meta-item">
                                  <Users size={10} />
                                  <span>{group.members.length} Members</span>
                                </div>
                              ) : (
                                <div className="cp-meta-item">
                                  <UserCheck size={10} />
                                  <span>Individual</span>
                                </div>
                              )}
                              <span className="cp-stage-text">Stage {group.current_stage}</span>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div className="cp-status-badge" style={{ backgroundColor: statusConf.bg, color: statusConf.color }}>
                            {statusConf.label}
                          </div>
                        </div>

                        {/* Team Members Preview */}
                        {isTeam && (
                          <div className="cp-team-preview">
                            {group.members.map((m: any) => (
                              <div key={m.id} className="cp-team-preview-item">
                                {m.user?.profile_avatar ? (
                                  <img src={m.user.profile_avatar} alt="" />
                                ) : (
                                  <div className="cp-avatar-placeholder"><UserCheck size={8} /></div>
                                )}
                                <span>{m.user?.name?.split(' ')[0] || 'User'}</span>
                                {m.team_role === 'leader' && <strong>(lead)</strong>}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Actions */}
                        {!isSelectionMode && showActions && (
                          <div className="cp-action-row">
                            <button className="cp-action-btn" onClick={(e) => { e.stopPropagation(); handleAdvanceGroup(group) }}>
                              <ChevronRight size={14} /> <span>Advance</span>
                            </button>
                            <button className="cp-action-btn" onClick={(e) => { e.stopPropagation(); handleEliminateGroup(group) }}>
                              <XCircle size={14} /> <span>Eliminate</span>
                            </button>
                            <button className="cp-action-btn" onClick={(e) => { e.stopPropagation(); handleWinnerGroup(group) }}>
                              <Star size={14} /> <span>Winner</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </>
        )}

        {dashboardTab === 'submissions' && (
          <>
            {allGroupedParticipants.length > 0 && (
              <>
                {/* Stats Row (Mobile) */}
                <div className="mobile-app-stats hide-desktop">
                  <div className="mobile-app-stat-chip">
                    <div className="mobile-app-stat-icon">
                      <CheckCircle2 size={14} color="#38bdf8" />
                    </div>
                    <div className="mobile-app-stat-val">{uniqueSubmittingGroups}</div>
                    <div className="mobile-app-stat-lbl">Submitted</div>
                  </div>
                  <div className="mobile-app-stat-chip">
                    <div className="mobile-app-stat-icon">
                      <Clock size={14} color="#38bdf8" />
                    </div>
                    <div className="mobile-app-stat-val">{pendingGroups}</div>
                    <div className="mobile-app-stat-lbl">Pending</div>
                  </div>
                  <div className="mobile-app-stat-chip">
                    <div className="mobile-app-stat-icon">
                      <CheckSquare size={14} color="#38bdf8" />
                    </div>
                    <div className="mobile-app-stat-val">{Math.round((uniqueSubmittingGroups / (allGroupedParticipants.length || 1)) * 100)}%</div>
                    <div className="mobile-app-stat-lbl">Completion</div>
                  </div>
                </div>

                {/* Stats Row (Desktop) */}
                <div className="dashboard-stats hide-mobile" style={{ marginBottom: '24px' }}>
                  <div className="dstat dstat-primary">
                    <div className="dstat-icon"><CheckCircle2 size={22} /></div>
                    <div className="dstat-info">
                      <div className="dstat-value">
                        <span>{uniqueSubmittingGroups}</span>
                      </div>
                      <div className="dstat-label">Submitted</div>
                    </div>
                  </div>
                  <div className="dstat dstat-primary">
                    <div className="dstat-icon"><Clock size={22} /></div>
                    <div className="dstat-info">
                      <div className="dstat-value">
                        <span>{pendingGroups}</span>
                      </div>
                      <div className="dstat-label">Pending</div>
                    </div>
                  </div>
                  <div className="dstat dstat-primary">
                    <div className="dstat-icon"><CheckSquare size={22} /></div>
                    <div className="dstat-info">
                      <div className="dstat-value">
                        <span>{Math.round((uniqueSubmittingGroups / (allGroupedParticipants.length || 1)) * 100)}%</span>
                      </div>
                      <div className="dstat-label">Completion</div>
                    </div>
                  </div>
                </div>
                {/* Filters moved below stats, outside the box */}
                {submissionStages.length > 0 && (
                  <>
                    <div className="cp-filter-tabs-wrap hide-mobile" style={{ marginBottom: '16px' }}>
                      <div className="cp-filter-tabs">
                        <button className={`cp-filter-tab ${submissionStageFilter === 'all' ? 'active' : ''}`} onClick={() => setSubmissionStageFilter('all')}>
                          All Submissions
                        </button>
                        {submissionStages.map(stageIdx => (
                          <button key={stageIdx} className={`cp-filter-tab ${submissionStageFilter === stageIdx ? 'active' : ''}`} onClick={() => setSubmissionStageFilter(stageIdx)}>
                            {competition?.stages?.[stageIdx]?.name || `Round ${stageIdx + 1}`}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="mobile-app-filters hide-desktop" style={{ paddingBottom: '8px', marginBottom: '16px' }}>
                      <button className={`mobile-app-filter-btn ${submissionStageFilter === 'all' ? 'active' : ''}`} onClick={() => setSubmissionStageFilter('all')}>
                        All
                      </button>
                      {submissionStages.map(stageIdx => (
                        <button key={stageIdx} className={`mobile-app-filter-btn ${submissionStageFilter === stageIdx ? 'active' : ''}`} onClick={() => setSubmissionStageFilter(stageIdx)}>
                          {competition?.stages?.[stageIdx]?.name || `Round ${stageIdx + 1}`}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

            <div className="cp-main-content mobile-list-container-override">
              {allSubmissions.length === 0 ? (
                <div className="cp-empty-state">
                  <FileText size={48} color="rgba(255,255,255,0.1)" />
                  <h4>No Submissions Yet</h4>
                  <p>Submissions for this event will appear here.</p>
                </div>
              ) : (
                <>
                  <div className="cp-search-wrap hide-mobile">
                    <Search size={16} color="#52525b" />
                    <input type="text" placeholder="Search submissions..." value={search} onChange={e => setSearch(e.target.value)} />
                  </div>
                  <div className="mobile-app-search hide-desktop">
                    <Search size={16} color="#52525b" />
                    <input type="text" placeholder="Search submissions..." value={search} onChange={e => setSearch(e.target.value)} />
                  </div>

                <div className="cp-submissions-grid">
                  {allSubmissions.filter(sub => {
                    if (submissionStageFilter !== 'all' && sub.stageIdx !== submissionStageFilter) return false;
                    if (!search.trim()) return true;
                    const q = search.toLowerCase();
                    const name = sub.group.isTeam ? sub.group.team?.name : (sub.group.participant.user?.name || '');
                    return name?.toLowerCase().includes(q);
                  }).map((sub, idx) => {
                    const name = sub.group.isTeam ? sub.group.team.name : (sub.group.participant.user?.name || 'Unknown');
                    const avatar = sub.group.isTeam ? sub.group.team.leader?.profile_avatar : sub.group.participant.user?.profile_avatar;
                    const stageName = competition?.stages?.[sub.stageIdx]?.name || `Round ${sub.stageIdx + 1}`;
                    
                    return (
                      <div key={idx} className="cp-submission-card" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="cp-sub-header">
                          <span className="cp-sub-stage">{stageName}</span>
                          <span className="cp-sub-date">Submitted {new Date(sub.submission.submitted_at).toLocaleDateString()}</span>
                        </div>
                        
                        <div className="cp-sub-user">
                          <div className="cp-sub-avatar">
                            {avatar ? <img src={avatar} alt="Avatar" /> : <UserCheck size={16} color="#a1a1aa" />}
                          </div>
                          <div className="cp-sub-info">
                            <h4>{name}</h4>
                            <div className="cp-sub-meta">
                              {sub.group.isTeam ? (
                                <><Users size={10} /> <span>{sub.group.members.length} Members</span></>
                              ) : (
                                <><UserCheck size={10} /> <span>Individual</span></>
                              )}
                              <span className="cp-stage-text">Stage {sub.group.current_stage}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="cp-sub-links">
                          {(() => {
                            const dataObj = sub.submission?.data || sub.submission;
                            if (!dataObj || typeof dataObj !== 'object') return null;
                            return Object.keys(dataObj).map((type: string) => {
                              if (type === 'submitted_at' || type === 'data') return null;
                              const url = dataObj[type];
                              if (!url || typeof url !== 'string') return null;
                              
                              let Icon = LinkIcon;
                              let label = 'Live URL / Other Link';
                              
                              if (type === 'video') { Icon = Video; label = 'Video Demo'; } 
                              else if (type === 'github') { Icon = GitBranch; label = 'GitHub Repository'; } 
                              else if (type === 'ppt') { Icon = FileText; label = 'Presentation/PDF'; }

                              return (
                                <a key={type} href={url} target="_blank" rel="noopener noreferrer" className="cp-link-btn" onClick={e => e.stopPropagation()}>
                                  <Icon size={14} /> {label}
                                </a>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
          </>
        )}

        {dashboardTab === 'settings' && (
          <div className="cp-settings-wrap">
            <h3 className="cp-section-title">General Settings</h3>
            <div className="cp-detail-card">
              <div className="cp-detail-row">
                <span className="cp-label">Visibility</span>
                <span className={`cp-value ${competition?.is_universal ? 'live' : ''}`}>{competition?.is_universal ? 'Live' : 'Private'}</span>
              </div>
              <div className="cp-detail-row">
                <span className="cp-label">Registrations</span>
                <span className="cp-value live">Open</span>
              </div>
              <div className="cp-detail-row no-border">
                <span className="cp-label">Max Team Size</span>
                <span className="cp-value">{competition?.team_size_max || 1} Members</span>
              </div>
            </div>

            <h3 className="cp-section-title">Rounds & Timeline</h3>
            <div className="cp-detail-card">
              <div className="cp-detail-row">
                <span className="cp-label">Current Round</span>
                <span className="cp-value">Idea Submission</span>
              </div>
              <div className="cp-detail-row no-border">
                <span className="cp-label">Registration Deadline</span>
                <input 
                  type="date"
                  className="cp-date-input"
                  value={competition?.registration_deadline ? new Date(competition.registration_deadline).toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    if (e.target.value) {
                      updateCompetition.mutate({ id: competitionId!, data: { registration_deadline: new Date(e.target.value).toISOString() } });
                    }
                  }}
                  disabled={updateCompetition.isPending}
                />
              </div>
            </div>
          </div>
        )}

        {/* Bulk Action Bar */}
        {isSelectionMode && selectedIds.size > 0 && (
          <div className="cp-bulk-action-bar">
            <button className="cp-bulk-btn eliminate" onClick={() => setConfirmAction({ type: 'bulk_eliminate' })}>
              <XCircle size={16} /> <span>Eliminate ({selectedIds.size})</span>
            </button>
            <button className="cp-bulk-btn advance" onClick={() => setConfirmAction({ type: 'bulk_advance' })}>
              <CheckSquare size={16} /> <span>Advance ({selectedIds.size})</span>
            </button>
          </div>
        )}

      </div>

      {/* Participant Details ATS Modal */}
      {detailModal && (
        <div className="cp-modal-overlay" onClick={() => {
          if (selectedMemberProfile) setSelectedMemberProfile(null);
          else setDetailModal(null);
        }}>
          <div className="cp-modal-content" onClick={e => e.stopPropagation()}>
            <div className="cp-modal-handle" />
            
            {(() => {
              const isTeamOverview = detailModal?.isTeam && !selectedMemberProfile;
              const profile = isTeamOverview ? null : (selectedMemberProfile || (detailModal && !detailModal.isTeam ? detailModal.participant : null));

              if (isTeamOverview) {
                const leader = detailModal.members.find((m: any) => m.team_role === 'leader') || detailModal.members[0];
                return (
                  <>
                    <div className="cp-modal-header">
                      <div className="cp-modal-avatar team">
                        {leader?.user?.profile_avatar ? <img src={leader.user.profile_avatar} alt="" /> : <Users size={24} color="#a78bfa" />}
                      </div>
                      <div className="cp-modal-title">
                        <h2>{detailModal.team?.name || 'Unknown Team'}</h2>
                        <p>Team • {detailModal.members.length} Members</p>
                      </div>
                      <button className="cp-close-btn" onClick={() => setDetailModal(null)}><X size={20} /></button>
                    </div>

                    <div className="cp-modal-body">
                      <h3 className="cp-section-title">Team Members</h3>
                      <div className="cp-member-list">
                        {[...detailModal.members].sort((a: any, b: any) => (a.team_role === 'leader' ? -1 : (b.team_role === 'leader' ? 1 : 0))).map((m: any) => (
                          <div key={m.id} className="cp-member-item" onClick={() => setSelectedMemberProfile(m)}>
                            <div className="cp-member-avatar">
                              {m.user?.profile_avatar ? <img src={m.user.profile_avatar} alt="" /> : <UserCheck size={16} color="#a78bfa" />}
                            </div>
                            <div className="cp-member-info">
                              <h4>{m.user?.name || m.user?.email || 'Unknown'}</h4>
                              {m.team_role === 'leader' && <span>Team Leader</span>}
                            </div>
                            <ChevronRight size={16} color="#52525b" />
                          </div>
                        ))}
                      </div>

                      <h3 className="cp-section-title">Registration Details</h3>
                      <div className="cp-detail-card">
                        <div className="cp-detail-row">
                          <span className="cp-label">Current Stage</span>
                          <span className="cp-value">Stage {detailModal.current_stage}</span>
                        </div>
                        <div className="cp-detail-row no-border">
                          <span className="cp-label">Status</span>
                          <span className="cp-value">{STATUS_CONFIG[detailModal.status || 'registered']?.label}</span>
                        </div>
                      </div>

                      {((competition as any)?.custom_form || (competition as any)?.eligibility?.custom_form) && (
                        <>
                          <h3 className="cp-section-title" style={{ marginTop: 20 }}>Application Form Responses</h3>
                          <CustomFormResponseViewer
                            formConfig={(competition as any)?.custom_form || (competition as any)?.eligibility?.custom_form}
                            response={
                              detailModal.team?.submissions?.custom_form_response ||
                              detailModal.members?.find((m: any) => m.team_role === 'leader')?.submissions?.custom_form_response
                            }
                          />
                        </>
                      )}
                    </div>

                    <div className="cp-modal-footer">
                      <button className="cp-full-btn" onClick={() => setDetailModal(null)}>Close Team Profile</button>
                    </div>
                  </>
                );
              }

              if (profile) {
                return (
                  <>
                    <div className="cp-modal-header">
                      <div className="cp-modal-avatar">
                        {profile?.user?.profile_avatar ? <img src={profile.user.profile_avatar} alt="" /> : <UserCheck size={24} color="#a78bfa" />}
                      </div>
                      <div className="cp-modal-title">
                        <h2>{profile?.user?.name || profile?.user?.email || 'Unknown'}</h2>
                        <p>{profile?.user?.email}</p>
                      </div>
                      <button className="cp-close-btn" onClick={() => selectedMemberProfile ? setSelectedMemberProfile(null) : setDetailModal(null)}>
                        {selectedMemberProfile ? <ArrowLeft size={20} /> : <X size={20} />}
                      </button>
                    </div>

                    <div className="cp-modal-body">
                      <h3 className="cp-section-title">Registration Details</h3>
                      <div className="cp-detail-card">
                        <div className="cp-detail-row">
                          <span className="cp-label">Type</span>
                          <span className="cp-value">{profile?.registration_type === 'team' ? 'Team Member' : 'Individual'}</span>
                        </div>
                        {profile?.registration_type === 'team' && (
                          <div className="cp-detail-row">
                            <span className="cp-label">Team Name</span>
                            <span className="cp-value">{profile?.team?.name}</span>
                          </div>
                        )}
                        <div className="cp-detail-row">
                          <span className="cp-label">Current Stage</span>
                          <span className="cp-value">Stage {profile?.current_stage}</span>
                        </div>
                        <div className="cp-detail-row no-border">
                          <span className="cp-label">Status</span>
                          <span className="cp-value">{STATUS_CONFIG[profile?.status || 'registered']?.label}</span>
                        </div>
                      </div>

                      <h3 className="cp-section-title">Submissions</h3>
                      <div className="cp-detail-card">
                        {profile?.resume_url ? (
                          <a href={profile.resume_url} target="_blank" rel="noreferrer" className="cp-resume-link">
                            <div className="cp-resume-icon"><FileText size={16} /></div>
                            <div className="cp-resume-info">
                              <h4>View Resume</h4>
                              <span>resume.pdf</span>
                            </div>
                            <ChevronRight size={16} color="#52525b" />
                          </a>
                        ) : (
                          <div className="cp-resume-empty">
                            <div className="cp-resume-icon empty"><FileText size={16} /></div>
                            <div className="cp-resume-info">
                              <h4>Resume</h4>
                              <span>Not requested or uploaded</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {((competition as any)?.custom_form || (competition as any)?.eligibility?.custom_form) && (
                        <>
                          <h3 className="cp-section-title" style={{ marginTop: 20 }}>Application Form Responses</h3>
                          <CustomFormResponseViewer
                            formConfig={(competition as any)?.custom_form || (competition as any)?.eligibility?.custom_form}
                            response={
                              profile?.submissions?.custom_form_response ||
                              (profile?.registration_type === 'team' ? profile?.team?.submissions?.custom_form_response : null)
                            }
                          />
                        </>
                      )}
                    </div>
                    
                    <div className="cp-modal-footer">
                      <button className="cp-full-btn" onClick={() => selectedMemberProfile ? setSelectedMemberProfile(null) : setDetailModal(null)}>
                        {selectedMemberProfile ? 'Back to Team' : 'Close Profile'}
                      </button>
                    </div>
                  </>
                );
              }
              
              return null;
            })()}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="cp-modal-overlay center" onClick={() => setConfirmAction(null)}>
          <div className="cp-confirm-modal" onClick={e => e.stopPropagation()}>
            {(() => {
              const isBulk = confirmAction.type.startsWith('bulk');
              const group = confirmAction.group;
              const name = !isBulk && group ? (group.isTeam ? group.team.name : (group.participant.user?.name || 'Unknown')) : '';
              
              let title = '';
              let desc = '';
              let btnText = '';
              let btnClass = '';
              let Icon = ArrowUpCircle;

              if (confirmAction.type === 'advance') {
                title = 'Advance to Next Stage';
                desc = `Are you sure you want to shortlist "${name}" and advance them to Stage ${group.current_stage + 1}?`;
                btnText = 'Yes, Advance';
                btnClass = 'advance';
                Icon = ArrowUpCircle;
              } else if (confirmAction.type === 'eliminate') {
                title = 'Eliminate Participant';
                desc = `Are you sure you want to eliminate "${name}" from the competition? This action cannot be easily undone.`;
                btnText = 'Eliminate';
                btnClass = 'eliminate';
                Icon = XCircle;
              } else if (confirmAction.type === 'winner') {
                title = 'Declare Winner 🏆';
                desc = `Are you sure you want to mark "${name}" as a winner of this competition?`;
                btnText = 'Mark as Winner';
                btnClass = 'winner';
                Icon = Award;
              } else if (confirmAction.type === 'bulk_advance') {
                title = 'Bulk Advance';
                desc = `Advance ${selectedIds.size} participants to the next stage?`;
                btnText = 'Advance All';
                btnClass = 'advance';
                Icon = ArrowUpCircle;
              } else if (confirmAction.type === 'bulk_eliminate') {
                title = 'Bulk Eliminate';
                desc = `Eliminate ${selectedIds.size} participants?`;
                btnText = 'Eliminate All';
                btnClass = 'eliminate';
                Icon = XCircle;
              }

              const executeConfirmAction = async () => {
                try {
                  if (isBulk) {
                    const status = confirmAction.type === 'bulk_advance' ? 'shortlisted' : 'eliminated';
                    // We need to expand team ids into member ids for bulk updates because the hook expects registrationIds
                    const memberIds = Array.from(selectedIds).flatMap(id => {
                      const g = allGroupedParticipants.find(x => x.id === id);
                      if (g?.isTeam) return g.members.map((m: any) => m.id);
                      return [id];
                    });
                    if(memberIds.length > 0) {
                      await bulkUpdate.mutateAsync({ competitionId: competitionId!, registrationIds: memberIds, status });
                    }
                    setSelectedIds(new Set());
                    setIsSelectionMode(false);
                  } else {
                    const status = confirmAction.type === 'advance' ? 'shortlisted' : confirmAction.type === 'winner' ? 'winner' : 'eliminated';
                    if (group.isTeam) {
                      const memberIds = group.members.map((m: any) => m.id);
                      await bulkUpdate.mutateAsync({ competitionId: competitionId!, registrationIds: memberIds, status });
                    } else {
                      await updateStatus.mutateAsync({ registrationId: group.id, status });
                    }
                  }
                  setConfirmAction(null);
                } catch (e) {
                  console.error(e);
                }
              };

              return (
                <>
                  <div className={`cp-confirm-icon ${btnClass}`}><Icon size={40} /></div>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                  <div className="cp-confirm-actions">
                    <button className="cp-btn-cancel" onClick={() => setConfirmAction(null)}>Cancel</button>
                    <button className={`cp-btn-confirm ${btnClass}`} onClick={executeConfirmAction} disabled={bulkUpdate.isPending || updateStatus.isPending}>
                      {btnText}
                    </button>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}
    </>
  )
}
