import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Calendar, Trophy, Clock, CheckCircle, XCircle,
  AlertCircle, Building2, GraduationCap, MapPin, Tag, User, BarChart3, Ticket, FileSpreadsheet
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import ExcelJS from 'exceljs'
import { formatYearLabel } from '@/lib/utils'
import './DeptAdminDashboard.css'
import './Dashboard.css'
import './AdminDashboard.css'

type DeptTab = 'pending' | 'approved' | 'rejected' | 'all' | 'students' | 'analytics'

interface DeptEvent {
  id: string
  title: string
  description: string
  category: string
  status: string
  date: string
  venue: string
  type: string
  created_at: string
  created_by: string
  creator_name?: string
  itemType?: 'event' | 'competition'
  banner_url?: string
}

interface DeptStudent {
  id: string
  name: string
  email: string
  course: string
  year?: string
  section?: string
  created_at: string
}


const ChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="select-dropdown-content" style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '120px' }}>
        {label && <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', padding: '0 4px' }}>{label}</span>}
        {payload.map((p: any, i: number) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', gap: '12px' }}>
            <span style={{ color: '#fff', fontSize: '0.9rem' }}>{p.name}</span>
            <span style={{ color: p.color || p.fill || '#fff', fontWeight: 600, fontSize: '0.9rem' }}>{p.value}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function DeptAdminDashboard() {
  const { department } = useParams<{ department: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [tab, setTab] = useState<DeptTab>('pending')
  const [filterType, setFilterType] = useState<'all' | 'events' | 'competitions'>('all')
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'live' | 'upcoming' | 'done'>('all')
  const [events, setEvents] = useState<DeptEvent[]>([])
  const [competitions, setCompetitions] = useState<any[]>([])
  const [students, setStudents] = useState<DeptStudent[]>([])
  const [activeStudentCount, setActiveStudentCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState<string | null>(null)

  const decodedDept = department ? decodeURIComponent(department) : ''
  const deptInitials = decodedDept
    ? decodedDept.split(' ').map(w => w[0]?.toUpperCase()).join('')
    : ''
  const studentsLabel = deptInitials ? `${deptInitials} Students` : 'Students'

  // Access check: must be department_admin for this department, or college_admin, or pluto_hq
  const hasAccess = user && (
    (user.admin_type === 'department_admin' && user.department === decodedDept) ||
    user.admin_type === 'college_admin' ||
    user.admin_type === 'pluto_hq' ||
    user.email?.endsWith('@admin.com')
  )

  useEffect(() => {
    if (!user?.college_id || !decodedDept) return
    loadData()
  }, [user?.college_id, decodedDept])

  const loadData = async () => {
    if (!user?.college_id) return
    setLoading(true)

    try {
      // Fetch all users in this department (including admins initially)
      const { data: studentsData } = await supabase
        .from('users')
        .select('id, name, email, course, year, section, created_at, admin_type')
        .eq('college_id', user.college_id)
        .eq('department', decodedDept)
        .order('name')

      // Fetch all events for the college
      const { data: allEventsData } = await supabase
        .from('events')
        .select('id, title, description, category, status, start_date, end_date, venue, type, banner_url, created_at, created_by, department, speaker_name, speaker_org, target_years, target_sections, target_departments, course, is_universal, ticket_price, has_seating, seat_layout, bookings(count)')
        .eq('college_id', user.college_id)
        .order('created_at', { ascending: false })

      // Fetch all competitions for the college
      const { data: allCompsData } = await supabase
        .from('competitions')
        .select('id, title, description, category, status, start_date, end_date, venue, banner_url, created_at, created_by, department, target_years, target_sections, target_departments, course, is_universal, entry_fee, competition_registrations(count)')
        .eq('college_id', user.college_id)
        .order('created_at', { ascending: false })

      // Get creator names and departments for ALL events/comps
      const allCreatorIds = [...new Set([
        ...(allEventsData || []).map(e => e.created_by),
        ...(allCompsData || []).map(c => c.created_by),
      ].filter(Boolean))]

      let creatorMap: Record<string, {name: string, department: string}> = {}
      if (allCreatorIds.length > 0) {
        const { data: creators } = await supabase
          .from('users')
          .select('id, name, department')
          .in('id', allCreatorIds)
        if (creators) {
          creatorMap = Object.fromEntries(creators.map(c => [c.id, { name: c.name, department: c.department || 'Unknown' }]))
        }
      }

      const deptUserIds = new Set((studentsData || []).map(u => u.id))

      const matchDept = (d1: string | null | undefined, d2: string | null | undefined) => {
        return (d1 || '').trim().toLowerCase() === (d2 || '').trim().toLowerCase()
      }

      // Filter events: targeted to this department OR created by someone in this department
      // We check deptUserIds.has() to guarantee backward compatibility with the old logic
      const eventsData = (allEventsData || []).filter(e => 
        e.department === decodedDept || 
        matchDept(e.department, decodedDept) || 
        deptUserIds.has(e.created_by) || 
        matchDept(creatorMap[e.created_by]?.department, decodedDept) ||
        (Array.isArray(e.target_departments) && e.target_departments.some((td: any) => matchDept(td.department, decodedDept)))
      )
      
      const compsData = (allCompsData || []).filter(c => 
        c.department === decodedDept || 
        matchDept(c.department, decodedDept) || 
        deptUserIds.has(c.created_by) || 
        matchDept(creatorMap[c.created_by]?.department, decodedDept) ||
        (Array.isArray(c.target_departments) && c.target_departments.some((td: any) => matchDept(td.department, decodedDept)))
      )

      setEvents((eventsData || []).map(e => ({
        ...e,
        date: e.start_date, // Map start_date to date for display
        attendee_count: e.bookings?.[0]?.count || 0,
        creator_name: creatorMap[e.created_by]?.name || 'Unknown',
        creator_dept: creatorMap[e.created_by]?.department || 'Unknown',
        itemType: 'event'
      })))

      setCompetitions((compsData || []).map(c => ({
        ...c,
        date: c.start_date,
        attendee_count: c.competition_registrations?.[0]?.count || 0,
        creator_name: creatorMap[c.created_by]?.name || 'Unknown',
        creator_dept: creatorMap[c.created_by]?.department || 'Unknown',
        itemType: 'competition'
      })))

      // Filter out admin users from student list
      const onlyStudents = (studentsData || []).filter(s => !s.admin_type)
      setStudents(onlyStudents)

      // Get Active Students (Students who have registered for anything)
      if (onlyStudents.length > 0) {
        const studentIds = onlyStudents.map(s => s.id)
        const { data: bookings } = await supabase.from('bookings').select('user_id').in('user_id', studentIds)
        const { data: compRegs } = await supabase.from('competition_registrations').select('user_id').in('user_id', studentIds)
        
        const activeIds = new Set([
          ...(bookings || []).map(b => b.user_id),
          ...(compRegs || []).map(r => r.user_id)
        ])
        setActiveStudentCount(activeIds.size)
      } else {
        setActiveStudentCount(0)
      }

    } catch (err) {
      console.error('[DeptAdmin] Load error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: string, type: 'event' | 'competition') => {
    setApproving(id)
    try {
      const table = type === 'event' ? 'events' : 'competitions'
      const { error } = await supabase
        .from(table)
        .update({ status: 'approved' })
        .eq('id', id)

      if (error) throw error
      await loadData()
    } catch (err: any) {
      alert(`Failed to approve: ${err.message}`)
    } finally {
      setApproving(null)
    }
  }

  const handleReject = async (id: string, type: 'event' | 'competition') => {
    const reason = prompt('Reason for rejection (optional):')
    setApproving(id)
    try {
      const table = type === 'event' ? 'events' : 'competitions'
      const { error } = await supabase
        .from(table)
        .update({ status: 'rejected' })
        .eq('id', id)

      if (error) throw error
      await loadData()
    } catch (err: any) {
      alert(`Failed to reject: ${err.message}`)
    } finally {
      setApproving(null)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price)
  }

  const getPriceDisplay = (event: any) => {
    if (event.itemType === 'competition' || 'entry_fee' in event) {
      if (!event.entry_fee || event.entry_fee === 0) return 'Free';
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: '1.2' }}>
          <span>{formatPrice(event.entry_fee)}</span>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>per member</span>
        </div>
      );
    }

    if (event.has_seating && event.seat_layout) {
      let minPrice = Infinity
      let maxPrice = -Infinity
      const seats = event.seat_layout.seats || []
      const tables = event.seat_layout.tables || []

      seats.forEach((s: any) => {
        if (s.price < minPrice) minPrice = s.price
        if (s.price > maxPrice) maxPrice = s.price
      })
      tables.forEach((t: any) => {
        if (t.price < minPrice) minPrice = t.price
        if (t.price > maxPrice) maxPrice = t.price
      })

      if (minPrice !== Infinity && maxPrice !== -Infinity) {
        if (minPrice === maxPrice) {
          return formatPrice(minPrice)
        } else {
          return `${formatPrice(minPrice)} - ${formatPrice(maxPrice).replace('₹', '').trim()}`
        }
      }
    }
    return formatPrice(event.ticket_price ?? event.price ?? 0)
  }

  const handleExportCSV = async () => {
    if (!filtered || filtered.length === 0) return;
    
    // 1. Create a new Workbook and Worksheet using exceljs
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Pluto Dept Admin';
    const worksheet = workbook.addWorksheet('Events', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
    });

    // 2. Define formatted columns with explicit widths
    worksheet.columns = [
      { header: 'Event Name', key: 'title', width: 35 },
      { header: 'Start Date', key: 'startDate', width: 20 },
      { header: 'End Date', key: 'endDate', width: 20 },
      { header: 'Speaker', key: 'speaker', width: 25 },
      { header: 'Speaker Org', key: 'speakerOrg', width: 20 },
      { header: 'Department', key: 'department', width: 25 },
      { header: 'Course', key: 'course', width: 20 },
      { header: 'Target Scope', key: 'targetScope', width: 25 },
      { header: 'Year', key: 'year', width: 15 },
      { header: 'Section', key: 'section', width: 30 },
      { header: 'Attendees', key: 'attendees', width: 12 }
    ];

    // 3. Style the header row
    const headerRow = worksheet.getRow(1);
    headerRow.height = 25;
    for (let i = 1; i <= 10; i++) {
      const cell = headerRow.getCell(i);
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF6366F1' } // Pluto Primary Violet/Indigo
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
      };
    }

    const formatDate = (dateString: string) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    }

    // 4. Map and add data rows
    filtered.forEach((event: any, index) => {
      const yr = event.target_years ? [...event.target_years].sort((a,b) => Number(a) - Number(b)).join(', ') : 'ALL';
      let sec = 'ALL';
      if (event.target_sections && Object.keys(event.target_sections).length > 0) {
        sec = Object.entries(event.target_sections).map(([y, secs]) => `${formatYearLabel(y, event.course)}: ${(secs as string[]).join(',')}`).join(' | ');
      }
      const row = worksheet.addRow({
        title: event.title || '',
        startDate: event.start_date ? formatDate(event.start_date) : '',
        endDate: event.end_date ? formatDate(event.end_date) : (event.start_date ? formatDate(event.start_date) : ''),
        speaker: event.itemType === 'event' && event.speaker_name ? event.speaker_name : '',
        speakerOrg: event.itemType === 'event' && event.speaker_org ? event.speaker_org : '',
        department: event.creator_dept || '',
        targetScope: event.is_universal ? 'Universal' : event.department ? (event.department === 'ALL' ? 'College-wide' : event.department) : 'College-wide',
        course: event.course || 'ALL',
        year: event.is_universal ? 'Universal' : (event.target_years ? [...event.target_years].sort((a,b) => Number(a) - Number(b)).map((y: string) => formatYearLabel(y, event.course)).join(', ') : 'ALL'),
        section: event.is_universal ? 'Universal' : sec,
        attendees: event.attendee_count || 0
      });

      // Style data cells with borders and subtle alternating backgrounds
      const isEven = index % 2 === 0;
      for (let i = 1; i <= 10; i++) {
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

    // 5. Generate and Download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Pluto_Dept_Events_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Merge events + competitions for display
  const allItems = [
    ...events.map(e => ({ ...e, itemType: 'event' as const })),
    ...competitions.map(c => ({ ...c, itemType: 'competition' as const })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const baseFiltered = tab === 'students' ? [] :
    tab === 'all' ? allItems :
    tab === 'approved' ? allItems.filter(e => e.status === 'approved' || e.status === 'live') :
    allItems.filter(e => e.status === tab)

  const filtered = baseFiltered.filter(e => {
    if (filterType !== 'all') {
      if (filterType === 'events' && e.itemType !== 'event') return false;
      if (filterType === 'competitions' && e.itemType !== 'competition') return false;
    }
    
    if (tab === 'all' && timelineFilter !== 'all') {
      const now = new Date().getTime()
      const start = new Date(e.start_date).getTime()
      const end = e.end_date ? new Date(e.end_date).getTime() : start + 86400000 // default to +1 day if no end date
      
      if (timelineFilter === 'live' && !(now >= start && now <= end)) return false
      if (timelineFilter === 'upcoming' && !(now < start)) return false
      if (timelineFilter === 'done' && !(now > end)) return false
    }
    
    return true
  })

  const pendingCount = allItems.filter(e => e.status === 'pending').length

  // Stats
  const stats = {
    students: students.length,
    totalEvents: allItems.length,
    pending: pendingCount,
    approved: allItems.filter(e => e.status === 'approved' || e.status === 'live').length,
  }

  // Chart Data Processing
  const categoryData = Object.entries(
    allItems.reduce((acc, curr) => {
      acc[curr.category || 'General'] = (acc[curr.category || 'General'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const typeData = [
    { name: 'Competitions', value: competitions.length },
    { name: 'Regular Events', value: events.length },
  ].filter(d => d.value > 0);

  const engagementData = [
    { name: 'Active (Registered)', value: activeStudentCount },
    { name: 'Inactive', value: Math.max(0, students.length - activeStudentCount) },
  ];

  const currentYear = new Date().getFullYear();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const initialTrendData: Record<string, number> = {};
  months.forEach(m => initialTrendData[m] = 0);

  allItems.forEach(curr => {
    const d = new Date(curr.created_at);
    if (d.getFullYear() === currentYear) {
      const month = d.toLocaleString('default', { month: 'short' });
      if (initialTrendData[month] !== undefined) {
        initialTrendData[month] += 1;
      }
    }
  });

  const trendData = months.map(name => ({ name, "Events/Competitions": initialTrendData[name] }));
  
  const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f59e0b', '#10b981'];

  if (!hasAccess) {
    return (
      <div className="dept-admin-page">
        <div className="dept-denied">
          <AlertCircle size={48} color="#f59e0b" style={{ marginBottom: '1rem' }} />
          <h2>Access Denied</h2>
          <p>You don't have permission to view this department's admin dashboard.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="dept-admin-page">
      {/* Header */}
      <div className="dept-admin-header">
        <h1 style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <Building2 size={24} style={{ marginRight: '8px' }} />
          {decodedDept}
          {user?.college && (
            <span style={{ marginLeft: 'auto', fontSize: '1.1rem', fontWeight: 500, color: 'rgba(255,255,255,0.7)' }}>
              {user.college}
            </span>
          )}
        </h1>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
          <p className="subtitle" style={{ margin: 0 }}>Manage events and students for your department</p>
          <button
            onClick={() => setTab(tab === 'analytics' ? 'pending' : 'analytics')}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: tab === 'analytics' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)', 
              color: '#fff',
              border: 'none', padding: '8px 16px',
              borderRadius: '24px', fontSize: '0.85rem', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <BarChart3 size={16} /> {tab === 'analytics' ? 'Back to Dashboard' : 'Detailed Analytics'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <motion.div
        className="dashboard-stats"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{ marginBottom: '3rem' }}
      >
        <div className="dstat dstat-primary">
          <div className="dstat-icon"><Users size={22} /></div>
          <div className="dstat-info">
            <div className="dstat-value">{stats.students}</div>
            <div className="dstat-label">{studentsLabel}</div>
          </div>
        </div>
        <div className="dstat dstat-secondary">
          <div className="dstat-icon"><Calendar size={22} /></div>
          <div className="dstat-info">
            <div className="dstat-value">{stats.totalEvents}</div>
            <div className="dstat-label">Total Events</div>
          </div>
        </div>
        <div className="dstat dstat-warning">
          <div className="dstat-icon"><Clock size={22} /></div>
          <div className="dstat-info">
            <div className="dstat-value">{stats.pending}</div>
            <div className="dstat-label">Pending</div>
          </div>
        </div>
        <div className="dstat dstat-success">
          <div className="dstat-icon"><CheckCircle size={22} /></div>
          <div className="dstat-info">
            <div className="dstat-value">{stats.approved}</div>
            <div className="dstat-label">Approved</div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      {tab !== 'analytics' && (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div className="admin-tabs" style={{ marginBottom: 0, flex: 1 }}>
            {([
              { id: 'pending', label: `Pending (${pendingCount})` },
              { id: 'approved', label: 'Approved' },
              { id: 'rejected', label: 'Rejected' },
            ] as const).map(t => (
              <button
                key={t.id}
                className={`admin-tab ${tab === t.id ? 'active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
          
          <div className="admin-tabs" style={{ marginBottom: 0, flex: 1 }}>
            {([
              { id: 'all', label: 'All Events/Competitions' },
              { id: 'students', label: studentsLabel },
            ] as const).map(t => (
              <button
                key={t.id}
                className={`admin-tab ${tab === t.id ? 'active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── Filter Pills ────────────────────────── */}
      {(tab === 'pending' || tab === 'approved' || tab === 'rejected' || tab === 'all') && (
        <div className="admin-filters" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {([
              { id: 'all', label: 'All' },
              { id: 'events', label: 'Events' },
              { id: 'competitions', label: 'Competitions' },
            ]).map(f => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id as any)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  border: '1px solid ' + (filterType === f.id ? 'var(--primary)' : 'rgba(255,255,255,0.1)'),
                  background: filterType === f.id ? 'var(--primary)' : 'transparent',
                  color: filterType === f.id ? '#fff' : 'var(--text-muted)',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {tab === 'all' && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                {([
                  { id: 'all', label: 'All Timeline' },
                  { id: 'live', label: 'Live' },
                  { id: 'upcoming', label: 'Upcoming' },
                  { id: 'done', label: 'Done' },
                ]).map(f => (
                  <button
                    key={f.id}
                    onClick={() => setTimelineFilter(f.id as any)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      border: '1px solid ' + (timelineFilter === f.id ? 'var(--primary)' : 'rgba(255,255,255,0.1)'),
                      background: timelineFilter === f.id ? 'var(--primary)' : 'transparent',
                      color: timelineFilter === f.id ? '#fff' : 'var(--text-muted)',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <button
                onClick={handleExportCSV}
                title="Export to Excel / CSV"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #107c41, #185c37)',
                  border: 'none',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '14px',
                  marginLeft: '8px',
                  boxShadow: '0 2px 8px rgba(16, 124, 65, 0.4)'
                }}
              >
                <FileSpreadsheet size={16} /> Export Sheet
              </button>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{ height: 80, borderRadius: 16, background: 'rgba(255,255,255,0.03)', animation: 'pulse 1.5s ease infinite' }} />
          ))}
        </div>
      ) : tab === 'students' ? (
        /* ── Students List ──────────────────────── */
        <motion.div
          className="admin-table-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <table className="admin-table-v2">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Course</th>
                <th>Year</th>
                <th>Section</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <div className="admin-empty" style={{ background: 'transparent', border: 'none', padding: 0 }}>
                      <Users size={48} strokeWidth={1} style={{ color: 'var(--primary)', opacity: 0.4, margin: '0 auto 1rem' }} />
                      <p>No students in this department yet.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                students.map(s => (
                  <tr key={s.id}>
                    <td data-label="Name" style={{ fontWeight: 600 }}>{s.name}</td>
                    <td data-label="Email">{s.email}</td>
                    <td data-label="Course">{s.course || '—'}</td>
                    <td data-label="Year">{s.year ? `${s.year}${s.year === '1' ? 'st' : s.year === '2' ? 'nd' : s.year === '3' ? 'rd' : 'th'} Year` : '—'}</td>
                    <td data-label="Section">{s.section || '—'}</td>
                    <td data-label="Joined">
                      {new Date(s.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </motion.div>
      ) : tab === 'analytics' ? (
        /* ── Analytics ──────────── */
        <motion.div
          className="admin-analytics-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            
            {/* Category Chart */}
            <div style={{ background: '#1e1e1e', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
               <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.1rem', fontWeight: 600, color: '#fff' }}>Events by Category</h3>
               <div style={{ height: 280 }}>
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%" cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell stroke="none" key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                   </PieChart>
                 </ResponsiveContainer>
               </div>
            </div>

            {/* Type Ratio Chart */}
            <div style={{ background: '#1e1e1e', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
               <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.1rem', fontWeight: 600, color: '#fff' }}>Competitions vs Events</h3>
               <div style={{ height: 280 }}>
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                      <Pie
                        data={typeData}
                        cx="50%" cy="50%"
                        outerRadius={90}
                        dataKey="value"
                        stroke="none"
                        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        <Cell stroke="none" fill="#f59e0b" />
                        <Cell stroke="none" fill="#6366f1" />
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                   </PieChart>
                 </ResponsiveContainer>
               </div>
            </div>

            {/* Student Engagement Chart */}
            <div style={{ background: '#1e1e1e', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
               <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.1rem', fontWeight: 600, color: '#fff' }}>Student Engagement</h3>
               <div style={{ height: 280 }}>
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                      <Pie
                        data={engagementData}
                        cx="50%" cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        <Cell stroke="none" fill="#10b981" />
                        <Cell stroke="none" fill="#4b5563" />
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                   </PieChart>
                 </ResponsiveContainer>
               </div>
            </div>

            {/* Activity Trend Chart */}
            <div style={{ background: '#1e1e1e', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', gridColumn: '1 / -1' }}>
               <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.1rem', fontWeight: 600, color: '#fff' }}>Event Activity Trend ({new Date().getFullYear()})</h3>
               <div style={{ height: 320 }}>
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={trendData}>
                     <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                     <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.5)' }} />
                     <YAxis stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.5)' }} />
                     <Tooltip content={<ChartTooltip />} cursor={false} />
                     <Bar dataKey="Events/Competitions" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                   </BarChart>
                 </ResponsiveContainer>
               </div>
            </div>

          </div>
        </motion.div>
      ) : (
        /* ── Events/Competitions List ──────────── */
        <motion.div
          className="admin-table-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <table className="admin-table-v2">
            <thead>
              <tr>
                <th>Event</th>
                <th>Start Date</th>
                <th>End Date</th>
                {tab === 'all' ? (
                  <>
                    <th>Speaker</th>
                    <th>Speaker Org</th>
                  </>
                ) : (
                  <>
                    <th>Venue</th>
                    <th>Price</th>
                  </>
                )}
                {tab === 'all' && <th>Department</th>}
                {tab === 'all' && <th>Target Scope</th>}
                {tab === 'all' && <th>Year</th>}
                {tab === 'all' && <th>Section</th>}
                {tab !== 'all' && <th>Status</th>}
                {tab === 'all' && <th>Attendees</th>}
                {tab === 'pending' && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={tab === 'pending' ? 10 : 9} style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <div className="admin-empty" style={{ background: 'transparent', border: 'none', padding: 0 }}>
                      <Calendar size={48} strokeWidth={1} style={{ color: 'var(--primary)', opacity: 0.4, margin: '0 auto 1rem' }} />
                      <p>No {tab === 'all' ? '' : tab} events found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {filtered.map(item => (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, x: 30 }}
                      layout
                      onClick={() => navigate(`/${item.itemType === 'competition' ? 'competition' : 'event'}/${item.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td data-label="Event">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ position: 'relative', width: 48, height: 48, borderRadius: 8, overflow: 'hidden', background: '#333', flexShrink: 0 }}>
                            <img src={item.banner_url || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=500&auto=format&fit=crop&q=60'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--primary)', padding: 4, borderTopLeftRadius: 8, display: 'flex' }}>
                              {item.itemType === 'competition' ? <Trophy size={10} color="#fff" /> : <Ticket size={10} color="#fff" />}
                            </div>
                          </div>
                          <div>
                            <div className="admin-event-name" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              {item.title}
                              {item.is_universal && (
                                <span className="admin-type-pill type-universal" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>🌍 Universal</span>
                              )}
                            </div>
                            {(item as any).course && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{(item as any).course}</span>
                              </div>
                            )}
                            {(item as any).creator_name && (
                              <small className="admin-event-org">{(item as any).creator_name}</small>
                            )}
                          </div>
                        </div>
                      </td>
                      <td data-label="Start Date">
                        {item.start_date ? new Date(item.start_date).toLocaleDateString() : '—'}
                      </td>
                      <td data-label="End Date">
                        {item.end_date ? new Date(item.end_date).toLocaleDateString() : (item.start_date ? new Date(item.start_date).toLocaleDateString() : '—')}
                      </td>
                      {tab === 'all' ? (
                        <>
                          <td data-label="Speaker">
                            {item.itemType === 'event' && (item as any).speaker_name ? (item as any).speaker_name : '—'}
                          </td>
                          <td data-label="Speaker Org">
                            {item.itemType === 'event' && (item as any).speaker_org ? (item as any).speaker_org : '—'}
                          </td>
                        </>
                      ) : (
                        <>
                          <td data-label="Venue">{item.venue || '—'}</td>
                          <td data-label="Price">{getPriceDisplay(item)}</td>
                        </>
                      )}
                      {tab === 'all' && (
                        <td data-label="Department">
                          {(item as any).creator_dept}
                        </td>
                      )}
                      {tab === 'all' && (
                        <td data-label="Target Scope">
                          {item.is_universal ? (
                            <span>Universal</span>
                          ) : item.target_departments && item.target_departments.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {item.target_departments.map((td: any, i: number) => (
                                <span key={i} style={{ fontSize: '0.85rem' }}>{td.department}</span>
                              ))}
                            </div>
                          ) : item.department ? (
                            <span>{item.department === 'ALL' ? 'College-wide' : item.department}</span>
                          ) : (
                            <span>College-wide</span>
                          )}
                        </td>
                      )}
                      {tab === 'all' && (
                        <td data-label="Year" style={{ textAlign: 'left' }}>
                          {item.target_departments && item.target_departments.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {item.target_departments.map((td: any, i: number) => (
                                <span key={i} style={{ fontSize: '0.85rem' }}>
                                  {td.years && td.years.length > 0 
                                    ? [...td.years].sort((a: any, b: any) => Number(a) - Number(b)).map((y: string) => formatYearLabel(y, td.course || (item as any).course)).join(', ')
                                    : <span style={{ color: 'white', fontWeight: 500 }}>ALL</span>}
                                </span>
                              ))}
                            </div>
                          ) : item.target_years && item.target_years.length > 0 ? (
                            <span>{[...item.target_years].sort((a,b) => Number(a) - Number(b)).map((y: string) => formatYearLabel(y, (item as any).course)).join(', ')}</span>
                          ) : (
                            <span style={{ color: 'white', fontWeight: 500 }}>ALL</span>
                          )}
                        </td>
                      )}
                      {tab === 'all' && (
                        <td data-label="Section" style={{ textAlign: 'left' }}>
                          {item.target_departments && item.target_departments.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {item.target_departments.map((td: any, i: number) => (
                                <span key={i} style={{ fontSize: '0.85rem' }}>
                                  {td.sections && Object.keys(td.sections).length > 0
                                    ? Object.entries(td.sections).map(([y, secs]) => `${formatYearLabel(y, td.course || (item as any).course)}: ${(secs as string[]).join(',')}`).join(' | ')
                                    : <span style={{ color: 'white', fontWeight: 500 }}>ALL</span>}
                                </span>
                              ))}
                            </div>
                          ) : item.target_sections && Object.keys(item.target_sections).length > 0 ? (
                            <span>
                              {Object.entries(item.target_sections).map(([y, secs]) => 
                                `${formatYearLabel(y, (item as any).course)}: ${(secs as string[]).join(',')}`
                              ).join(' | ')}
                            </span>
                          ) : (
                            <span style={{ color: 'white', fontWeight: 500 }}>ALL</span>
                          )}
                        </td>
                      )}
                      {tab !== 'all' && (
                        <td data-label="Status">
                          <span className={`admin-status-badge status-${item.status}`}>
                            {item.status}
                          </span>
                        </td>
                      )}
                      {tab === 'all' && (
                        <td data-label="Attendees" style={{ fontWeight: 600 }}>{item.attendee_count}</td>
                      )}
                      {tab === 'pending' && (
                        <td data-label="Actions">
                          <div className="admin-actions">
                            <button
                              className="admin-action-btn btn-approve"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApprove(item.id, item.itemType);
                              }}
                              disabled={approving === item.id}
                            >
                              <CheckCircle size={14} /> Approve
                            </button>
                            <button
                              className="admin-action-btn btn-reject"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReject(item.id, item.itemType);
                              }}
                              disabled={approving === item.id}
                            >
                              <XCircle size={14} /> Reject
                            </button>
                          </div>
                        </td>
                      )}
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </motion.div>
      )}
    </div>
  )
}
