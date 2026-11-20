import { useState, useMemo, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Shield, CalendarDays, Users, Ticket, CheckCircle,
  XCircle, Clock, Building2, BarChart3, TrendingUp, Trophy, FileSpreadsheet
} from 'lucide-react'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend, CartesianGrid
} from 'recharts'
import ExcelJS from 'exceljs'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { formatDate, formatPrice, formatEventDate, formatYearLabel } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import type { Event } from '@/types'
import { SelectDropdown } from '@/components/ui/SelectDropdown'
import './AdminDashboard.css'
import './Dashboard.css'

type AdminTab = 'analytics' | 'pending' | 'approved' | 'rejected' | 'all' | 'departments' | 'users'

interface CollegeUser {
  id: string
  name: string
  email: string
  roles: string[]
  department?: string
  year?: string
  section?: string
  created_at: string
}

// ─── Fetchers ─────────────────────────────
async function fetchAdminEvents(collegeId?: string, isSuperAdmin?: boolean): Promise<any[]> {
  if (!isSuperAdmin && !collegeId) return []
  let eventsQ = supabase.from('events').select('*, bookings(count)').order('created_at', { ascending: false })
  let compsQ = supabase.from('competitions').select('*, competition_registrations(count)').order('created_at', { ascending: false })

  if (collegeId) {
    eventsQ = eventsQ.eq('college_id', collegeId)
    compsQ = compsQ.eq('college_id', collegeId)
  }

  const [eventsRes, compsRes] = await Promise.all([eventsQ, compsQ])
  if (eventsRes.error) throw eventsRes.error
  if (compsRes.error) throw compsRes.error

  const allEvents = [
    ...(eventsRes.data || []).map(e => ({ ...e, _sourceTable: 'events', attendee_count: e.bookings?.[0]?.count || 0 })),
    ...(compsRes.data || []).map(c => ({ ...c, _sourceTable: 'competitions', type: 'competition', attendee_count: c.competition_registrations?.[0]?.count || 0 }))
  ]

  const creatorIds = [...new Set(allEvents.map(e => e.created_by).filter(Boolean))]
  let creatorMap: Record<string, {name: string, department: string}> = {}
  
  if (creatorIds.length > 0) {
    const { data: creators } = await supabase
      .from('users')
      .select('id, name, department')
      .in('id', creatorIds)
    if (creators) {
      creatorMap = Object.fromEntries(creators.map(c => [c.id, { name: c.name, department: c.department || 'Unknown' }]))
    }
  }

  const eventsWithCreators = allEvents.map(e => ({
    ...e,
    creator_name: creatorMap[e.created_by]?.name || 'Unknown',
    creator_dept: creatorMap[e.created_by]?.department || 'Unknown'
  }))

  eventsWithCreators.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  return eventsWithCreators
}

async function fetchAdminStats(collegeId?: string, isSuperAdmin?: boolean) {
  if (!isSuperAdmin && !collegeId) {
    return { totalEvents: 0, totalUsers: 0, totalBookings: 0 }
  }
  const [eventsRes, compRes, usersRes, bookingsRes] = await Promise.all([
    collegeId
      ? supabase.from('events').select('id', { count: 'exact', head: true }).eq('college_id', collegeId)
      : supabase.from('events').select('id', { count: 'exact', head: true }),
    collegeId
      ? supabase.from('competitions').select('id', { count: 'exact', head: true }).eq('college_id', collegeId)
      : supabase.from('competitions').select('id', { count: 'exact', head: true }),
    collegeId
      ? supabase.from('users').select('id', { count: 'exact', head: true }).eq('college_id', collegeId)
      : supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase.from('bookings').select('id', { count: 'exact', head: true }),
  ])
  return {
    totalEvents: (eventsRes.count || 0) + (compRes.count || 0),
    totalUsers: usersRes.count || 0,
    totalBookings: bookingsRes.count || 0,
  }
}

// Analytics: events by status, category, department
async function fetchAnalyticsData(collegeId?: string, isSuperAdmin?: boolean) {
  if (!isSuperAdmin && !collegeId) {
    return { statusData: [], categoryData: [], typeData: [], trendData: [], departments: [] }
  }
  let evQuery = supabase.from('events').select('status, category, department, created_at, created_by')
  let compQuery = supabase.from('competitions').select('status, category, department, created_at, created_by')
  let usersQuery = supabase.from('users').select('department, course, created_at, roles, admin_type, email')
  let collegeQuery = supabase.from('colleges').select('departments')

  if (collegeId) {
    evQuery = evQuery.eq('college_id', collegeId)
    compQuery = compQuery.eq('college_id', collegeId)
    usersQuery = usersQuery.eq('college_id', collegeId)
    collegeQuery = collegeQuery.eq('id', collegeId)
  }

  const [evRes, compRes, usersRes, collegeRes] = await Promise.all([
    evQuery, compQuery, usersQuery, collegeQuery.maybeSingle()
  ])

  const allItems = [
    ...(evRes.data || []).map(e => ({ ...e, _type: 'event' })),
    ...(compRes.data || []).map(c => ({ ...c, _type: 'competition' })),
  ]

  // Events by status
  const statusCounts: Record<string, number> = {}
  allItems.forEach(i => {
    statusCounts[i.status || 'unknown'] = (statusCounts[i.status || 'unknown'] || 0) + 1
  })

  // Events by category
  const categoryCounts: Record<string, number> = {}
  allItems.forEach(i => {
    const cat = i.category || 'Other'
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
  })

  // Events by Type (Events vs Competitions)
  const typeCounts: Record<string, number> = {}
  allItems.forEach(i => {
    const typeLabel = i._type === 'event' ? 'Regular Events' : 'Competitions'
    typeCounts[typeLabel] = (typeCounts[typeLabel] || 0) + 1
  })

  const creatorIds = [...new Set(allItems.map(i => i.created_by).filter(Boolean))]
  let creatorMap: Record<string, {name: string, department: string}> = {}
  
  if (creatorIds.length > 0) {
    const { data: creators } = await supabase
      .from('users')
      .select('id, name, department')
      .in('id', creatorIds)
    if (creators) {
      creatorMap = Object.fromEntries(creators.map(c => [c.id, { name: c.name, department: c.department || 'Unknown' }]))
    }
  }

  // Events by department
  const deptEventCounts: Record<string, number> = {}
  allItems.forEach(i => {
    const dept = creatorMap[i.created_by]?.department || 'Unassigned'
    deptEventCounts[dept] = (deptEventCounts[dept] || 0) + 1
  })

  // Users by department (count only non-admins as students)
  const deptUserCounts: Record<string, number> = {}
    ; (usersRes.data || []).forEach((u: any) => {
      const dept = u.department || 'Unassigned'
      if (deptUserCounts[dept] === undefined) {
        deptUserCounts[dept] = 0
      }
      if (!(u.roles?.includes('admin') || u.admin_type || u.email?.endsWith('@admin.com'))) {
        deptUserCounts[dept] += 1
      }
    })

  // Departments summary (include all from college settings + any observed)
  const collegeDepts: any[] = collegeRes.data?.departments || [];
  const officialDeptNames = collegeDepts.map(d => typeof d === 'string' ? d : d.name);

  const deptNames = [...new Set([
    ...officialDeptNames,
    ...Object.keys(deptEventCounts),
    ...Object.keys(deptUserCounts),
  ])].filter(d => d !== 'Unassigned').sort()

  // Pending per department
  const deptPendingCounts: Record<string, number> = {}
  allItems.filter(i => i.status === 'pending').forEach(i => {
    const dept = creatorMap[i.created_by]?.department || 'Unassigned'
    deptPendingCounts[dept] = (deptPendingCounts[dept] || 0) + 1
  })

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

  return {
    statusData: Object.entries(statusCounts).map(([name, value]) => ({ name, value })),
    categoryData: Object.entries(categoryCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8),
    typeData: Object.entries(typeCounts).map(([name, value]) => ({ name, value })),
    trendData,
    departments: deptNames.map(name => ({
      name,
      students: deptUserCounts[name] || 0,
      events: deptEventCounts[name] || 0,
      pending: deptPendingCounts[name] || 0,
    })),
  }
}

async function fetchCollegeUsers(collegeId?: string, isSuperAdmin?: boolean): Promise<CollegeUser[]> {
  if (!isSuperAdmin && !collegeId) return []

  // Try college-scoped first
  if (collegeId) {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, roles, department, year, section, created_at')
      .eq('college_id', collegeId)
      .order('created_at', { ascending: true })
    if (error) throw error
    if (data && data.length > 0) return data as CollegeUser[]
  }

  if (isSuperAdmin) {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, roles, department, created_at')
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data || []) as CollegeUser[]
  }
  
  return []
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

export default function AdminDashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<AdminTab>('pending')
  const [filterType, setFilterType] = useState<'all' | 'events' | 'competitions'>('all')
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'live' | 'upcoming' | 'done'>('all')
  const [userDeptFilter, setUserDeptFilter] = useState<string>('All Departments')
  const [toast, setToast] = useState<{ type: 'approve' | 'reject'; message: string } | null>(null)

  // ─── Admin gate: strict role check ─────────────────
  const isAdmin = (user?.roles?.includes('admin') && user?.admin_type !== 'department_admin') || user?.email?.endsWith('@admin.com') || user?.admin_type === 'college_admin'

  // Auto-redirect department admins to their department page
  useEffect(() => {
    if (user && !isAdmin && user.admin_type === 'department_admin' && user.department) {
      navigate(`/admin/dept/${encodeURIComponent(user.department)}`, { replace: true })
    }
  }, [user, isAdmin, navigate])

  const collegeId = user?.college_id || undefined

  const isSuperAdmin = user?.email?.endsWith('@admin.com')

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['admin', 'events', collegeId],
    queryFn: () => fetchAdminEvents(collegeId, isSuperAdmin),
    staleTime: 30_000,
    enabled: !!isAdmin,
  })

  const { data: stats } = useQuery({
    queryKey: ['admin', 'stats', collegeId],
    queryFn: () => fetchAdminStats(collegeId, isSuperAdmin),
    staleTime: 30_000,
    enabled: !!isAdmin,
  })

  const { data: collegeUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ['admin', 'users', collegeId],
    queryFn: () => fetchCollegeUsers(collegeId, isSuperAdmin),
    staleTime: 60_000,
    enabled: !!isAdmin && activeTab === 'users',
  })

  const deptNamesForDropdown = useMemo(() => {
    const depts = [...new Set(collegeUsers.map(u => u.department).filter(Boolean))].sort() as string[]
    return ['All Departments', ...depts]
  }, [collegeUsers])

  const filteredCollegeUsers = useMemo(() => {
    if (userDeptFilter === 'All Departments') return collegeUsers;
    return collegeUsers.filter(u => u.department === userDeptFilter);
  }, [collegeUsers, userDeptFilter])

  const { data: analytics } = useQuery({
    queryKey: ['admin', 'analytics', collegeId],
    queryFn: () => fetchAnalyticsData(collegeId, isSuperAdmin),
    staleTime: 60_000,
    enabled: !!isAdmin && (activeTab === 'analytics' || activeTab === 'departments'),
  })

  const { data: collegeData } = useQuery({
    queryKey: ['admin', 'college', collegeId],
    queryFn: async () => {
      if (!collegeId) return null;
      const { data, error } = await supabase.from('colleges').select('logo_url').eq('id', collegeId).single();
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
    enabled: !!isAdmin && !!collegeId,
  })

  const STATUS_COLORS: Record<string, string> = {
    pending: '#f59e0b', approved: '#10b981', rejected: '#ef4444',
    live: '#3b82f6', draft: '#64748b', unknown: '#94a3b8',
  }
  const CATEGORY_COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6']

  const updateStatusMutation = useMutation({
    mutationFn: async ({ eventId, status, sourceTable }: { eventId: string; status: 'approved' | 'rejected'; sourceTable?: string }) => {
      const table = sourceTable || 'events';
      const { data, error } = await supabase.from(table).update({ status }).eq('id', eventId).select('created_by, title, category, is_universal').single()
      if (error) throw error

      if (status === 'approved' && data && data.created_by) {
        const BACKEND = import.meta.env.VITE_API_BASE || '';
        if (BACKEND) {
          try {
            const visibilityText = data.is_universal ? "everyone" : "everyone on campus";
            // Push Notification to Organizer
            await fetch(`${BACKEND}/api/notification/send`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                organizerId: data.created_by,
                title: '🚀 Your event is live!',
                body: `Great news! ${data.title} has been approved and is now visible to ${visibilityText}.`
              })
            }).catch(e => console.error('[Push API Error]', e));

            // AI Proactive Pings
            await fetch(`${BACKEND}/api/match-event`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                eventId: eventId,
                title: data.title,
                category: data.category
              })
            }).catch(e => console.error('[AI Match API Error]', e));
          } catch (e) {
            console.error('[AdminDashboard] Failed to trigger backend events:', e);
          }
        }
      }
    },
    onMutate: async ({ eventId, status }) => {
      await queryClient.cancelQueries({ queryKey: ['admin'] })
      const previousEvents = queryClient.getQueryData(['admin', 'events', collegeId])
      queryClient.setQueryData(['admin', 'events', collegeId], (old: any) => {
        if (!old) return old
        return old.map((e: any) => e.id === eventId ? { ...e, status } : e)
      })
      return { previousEvents }
    },
    onError: (err, newTodo, context: any) => {
      if (context?.previousEvents) {
        queryClient.setQueryData(['admin', 'events', collegeId], context.previousEvents)
      }
      setToast({ type: 'reject', message: 'Failed to update status' })
      setTimeout(() => setToast(null), 2500)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
    onSuccess: (_, vars) => {
      setToast({
        type: vars.status === 'approved' ? 'approve' : 'reject',
        message: `Event ${vars.status}!`,
      })
      setTimeout(() => setToast(null), 2500)
    },
  })

  const filteredEvents = useMemo(() => {
    let list = events
    if (activeTab === 'pending') list = list.filter(e => e.status === 'pending')
    else if (activeTab === 'approved') list = list.filter(e => e.status === 'approved' || e.status === 'live')
    else if (activeTab === 'rejected') list = list.filter(e => e.status === 'rejected')

    if (filterType === 'events') {
      list = list.filter(e => e._sourceTable === 'events')
    } else if (filterType === 'competitions') {
      list = list.filter(e => e._sourceTable === 'competitions')
    }

    if (activeTab === 'all' && timelineFilter !== 'all') {
      const now = new Date().getTime()
      list = list.filter(e => {
        const start = new Date(e.start_date).getTime()
        const end = e.end_date ? new Date(e.end_date).getTime() : start + 86400000 // default to +1 day if no end date

        if (timelineFilter === 'live') return now >= start && now <= end
        if (timelineFilter === 'upcoming') return now < start
        if (timelineFilter === 'done') return now > end
        return true
      })
    }

    return list
  }, [events, activeTab, filterType, timelineFilter])

  const pendingCount = useMemo(() => {
    let list = events.filter(e => e.status === 'pending')
    if (filterType === 'events') list = list.filter(e => e._sourceTable === 'events')
    else if (filterType === 'competitions') list = list.filter(e => e._sourceTable === 'competitions')
    return list.length
  }, [events, filterType])

  // ─── Access denied: not logged in ───────────────────
  if (!user) {
    return (
      <div className="admin-fullpage">
        <Shield size={64} strokeWidth={1} style={{ color: 'var(--primary)', opacity: 0.5 }} />
        <h2 style={{ marginTop: '1rem', color: 'var(--white)' }}>Login Required</h2>
        <p style={{ color: 'var(--text-muted)' }}>Please log in to access the admin dashboard.</p>
      </div>
    )
  }

  // ─── Access denied: not an admin ────────────────────
  // Department admins get redirected to their own department page
  if (!isAdmin) {
    if (user?.admin_type === 'department_admin' && user?.department) {
      return (
        <div className="admin-fullpage">
          <Building2 size={64} strokeWidth={1} style={{ color: 'var(--primary)', opacity: 0.6 }} />
          <h2 style={{ marginTop: '1rem', color: 'var(--white)' }}>Department Admin</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            You are a department admin for <strong>{user.department}</strong>. Redirecting to your dashboard...
          </p>
          <button
            onClick={() => navigate(`/admin/dept/${encodeURIComponent(user.department!)}`)}
            style={{
              padding: '0.75rem 2rem', borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff',
              fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem'
            }}
          >
            Go to {user.department} Dashboard
          </button>
        </div>
      )
    }
    return (
      <div className="admin-fullpage">
        <Shield size={64} strokeWidth={1} style={{ color: '#f87171', opacity: 0.6 }} />
        <h2 style={{ marginTop: '1rem', color: 'var(--white)' }}>Access Denied</h2>
        <p style={{ color: 'var(--text-muted)' }}>You do not have admin privileges.</p>
      </div>
    )
  }

  // ─── Helper to safely extract fields from raw DB rows ───
  const getPriceDisplay = (event: Event | any) => {
    if (event._sourceTable === 'competitions' || 'entry_fee' in event) {
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

  const getUserRole = (u: CollegeUser) => {
    if (u.email?.endsWith('@admin.com')) return 'admin'
    return (u.roles || ['user']).join(', ')
  }

  const handleExportCSV = async () => {
    if (!filteredEvents || filteredEvents.length === 0) return;
    
    // 1. Create a new Workbook and Worksheet using exceljs
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Pluto Admin';
    const worksheet = workbook.addWorksheet('Events', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }] // freeze the header row
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

    // 3. Style the header row (Violet Background with Bold White Text)
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

    const formatExportDate = (dateString: string) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    }

    // 4. Map and add data rows
    filteredEvents.forEach((event, index) => {
      const yr = event.target_years ? [...event.target_years].sort((a,b) => Number(a) - Number(b)).join(', ') : 'ALL';
      let sec = 'ALL';
      if (event.target_sections && Object.keys(event.target_sections).length > 0) {
        sec = Object.entries(event.target_sections).map(([y, secs]) => `${formatYearLabel(y, event.course)}: ${(secs as string[]).join(',')}`).join(' | ');
      }
      const row = worksheet.addRow({
        title: event.title || '',
        startDate: event.start_date ? formatExportDate(event.start_date) : '',
        endDate: event.end_date ? formatExportDate(event.end_date) : (event.start_date ? formatExportDate(event.start_date) : ''),
        speaker: event.speaker_name || '',
        speakerOrg: event.speaker_org || '',
        department: event.creator_dept || '',
        targetScope: event.is_universal ? 'Universal' : event.department ? (event.department === 'ALL' ? 'College-wide' : event.department) : 'College-wide',
        course: event.course || 'ALL',
        year: event.is_universal ? 'Universal' : (event.target_years ? [...event.target_years].sort((a,b) => Number(a) - Number(b)).map(y => formatYearLabel(y, event.course)).join(', ') : 'ALL'),
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
            fgColor: { argb: 'FFF9FAFB' } // Very subtle light gray for alternate rows
          };
        }
      }
    });

    // 5. Generate and Download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Pluto_Events_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <Helmet>
        <title>Campus Admin Dashboard | PLUTO</title>
      </Helmet>

      <div className="admin-container-v2">
        {/* ─── Header ──────────────────────── */}
        <motion.div className="admin-header-v2" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {collegeData?.logo_url && (
            <img src={collegeData.logo_url} alt="College Logo" style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'contain', background: 'rgba(255,255,255,0.05)', padding: 4 }} />
          )}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ margin: 0 }}>Campus Admin Dashboard</h1>
              {user.college && (
                <span style={{ marginTop: '0.4rem', display: 'inline-flex', fontSize: '1rem', fontWeight: 500, color: 'rgba(255,255,255,0.7)', alignItems: 'center' }}>
                  <Building2 size={14} style={{ marginRight: '6px' }} /> {user.college}
                </span>
              )}
            </div>

            <button
              onClick={() => setActiveTab(activeTab === 'analytics' ? 'pending' : 'analytics')}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: activeTab === 'analytics' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                color: '#fff',
                border: 'none', padding: '8px 16px',
                borderRadius: '24px', fontSize: '0.85rem', fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              <BarChart3 size={16} /> {activeTab === 'analytics' ? 'Back to Dashboard' : 'Detailed Analytics'}
            </button>
          </div>
        </motion.div>

        {/* ─── Stats ───────────────────────── */}
        <motion.div
          className="dashboard-stats"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ marginBottom: '2rem' }}
        >
          <div className="dstat dstat-primary">
            <div className="dstat-icon"><CalendarDays size={22} /></div>
            <div className="dstat-info">
              <div className="dstat-value">{stats?.totalEvents ?? '—'}</div>
              <div className="dstat-label">Total Events</div>
            </div>
          </div>
          <div className="dstat dstat-secondary">
            <div className="dstat-icon"><Users size={22} /></div>
            <div className="dstat-info">
              <div className="dstat-value">{stats?.totalUsers ?? '—'}</div>
              <div className="dstat-label">College Users</div>
            </div>
          </div>
          <div className="dstat dstat-success">
            <div className="dstat-icon"><Ticket size={22} /></div>
            <div className="dstat-info">
              <div className="dstat-value">{stats?.totalBookings ?? '—'}</div>
              <div className="dstat-label">Total Bookings</div>
            </div>
          </div>
          <div className="dstat dstat-warning">
            <div className="dstat-icon"><Clock size={22} /></div>
            <div className="dstat-info">
              <div className="dstat-value">{pendingCount}</div>
              <div className="dstat-label">Pending Approval</div>
            </div>
          </div>
        </motion.div>

        {/* ─── Tabs ────────────────────────── */}
        {activeTab !== 'analytics' && (
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <div className="admin-tabs" style={{ marginBottom: 0, flex: 1 }}>
              {([
                { id: 'pending' as const, label: `Pending (${pendingCount})` },
                { id: 'approved' as const, label: 'Approved' },
                { id: 'rejected' as const, label: 'Rejected' },
              ]).map(tab => (
                <button
                  key={tab.id}
                  className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="admin-tabs" style={{ marginBottom: 0, flex: 1 }}>
              {([
                { id: 'all' as const, label: 'All Events/Competitions' },
                { id: 'departments' as const, label: 'Departments' },
                { id: 'users' as const, label: 'Users' },
              ]).map(tab => (
                <button
                  key={tab.id}
                  className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ─── Filter Pills ────────────────────────── */}
        {(activeTab === 'pending' || activeTab === 'approved' || activeTab === 'rejected' || activeTab === 'all') && (
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

            {activeTab === 'all' && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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

        {/* ─── User Department Filter ───────────────── */}
        {activeTab === 'users' && (
          <div className="admin-filters" style={{ display: 'flex', marginBottom: '20px' }}>
            <SelectDropdown
              value={userDeptFilter}
              onChange={setUserDeptFilter}
              options={deptNamesForDropdown}
            />
          </div>
        )}

        {/* ─── OVERVIEW TAB: Analytics ──────── */}
        {activeTab === 'analytics' && analytics && (
          <motion.div
            className="admin-analytics-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>

              {/* Events by Status */}
              <div style={{ background: '#1e1e1e', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.1rem', fontWeight: 600, color: '#fff' }}>Events by Status</h3>
                <div style={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.statusData}
                        cx="50%" cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {analytics.statusData.map((entry: any, index: number) => (
                          <Cell stroke="none" key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#6366f1'} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Events by Category */}
              <div style={{ background: '#1e1e1e', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.1rem', fontWeight: 600, color: '#fff' }}>Events by Category</h3>
                <div style={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.categoryData}
                        cx="50%" cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {analytics.categoryData.map((_: any, index: number) => (
                          <Cell stroke="none" key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Events by Type */}
              <div style={{ background: '#1e1e1e', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.1rem', fontWeight: 600, color: '#fff' }}>Format Breakdown</h3>
                <div style={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.typeData}
                        cx="50%" cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {analytics.typeData.map((entry: any, index: number) => (
                          <Cell stroke="none" key={`cell-${index}`} fill={index === 0 ? '#38bdf8' : '#a855f7'} />
                        ))}
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
                    <BarChart data={analytics.trendData}>
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

            {/* Department Overview Cards */}
            {analytics.departments.length > 0 && (
              <div>
                <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Building2 size={18} /> Department Overview
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                  {analytics.departments.map((dept: any) => (
                    <motion.div
                      key={dept.name}
                      className="admin-stat-card"
                      onClick={() => navigate(`/admin/dept/${encodeURIComponent(dept.name)}`)}
                      style={{ cursor: 'pointer', padding: '1.5rem', display: 'block' }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div style={{ fontWeight: 700, color: '#fff', fontSize: '1.2rem', marginBottom: '1.5rem', textAlign: 'center' }}>
                        {dept.name}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                        <div style={{ background: '#262626', borderRadius: '16px', padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ background: '#333', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Users size={18} color="#38bdf8" />
                          </div>
                          <div style={{ fontWeight: 800, color: '#fff', fontSize: '1.3rem' }}>{dept.students}</div>
                          <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Students</div>
                        </div>

                        <div style={{ background: '#262626', borderRadius: '16px', padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ background: '#333', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CalendarDays size={18} color="#38bdf8" />
                          </div>
                          <div style={{ fontWeight: 800, color: '#fff', fontSize: '1.3rem' }}>{dept.events}</div>
                          <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Events</div>
                        </div>

                        <div style={{ background: '#262626', borderRadius: '16px', padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ background: '#333', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Clock size={18} color="#38bdf8" />
                          </div>
                          <div style={{ fontWeight: 800, color: '#fff', fontSize: '1.3rem' }}>{dept.pending}</div>
                          <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ─── DEPARTMENTS TAB ──────────────── */}
        {activeTab === 'departments' && analytics && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {analytics.departments.length === 0 ? (
              <div className="admin-empty">
                <Building2 size={48} strokeWidth={1} style={{ color: 'var(--primary)', opacity: 0.4 }} />
                <p>No departments found.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                {analytics.departments.map((dept: any) => (
                  <motion.div
                    key={dept.name}
                    className="admin-stat-card"
                    onClick={() => navigate(`/admin/dept/${encodeURIComponent(dept.name)}`)}
                    style={{ cursor: 'pointer', padding: '1.5rem', display: 'block' }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div style={{ fontWeight: 700, color: '#fff', fontSize: '1.2rem', marginBottom: '1.5rem', textAlign: 'center' }}>
                      {dept.name}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                      <div style={{ background: '#262626', borderRadius: '16px', padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ background: '#333', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Users size={18} color="#38bdf8" />
                        </div>
                        <div style={{ fontWeight: 800, color: '#fff', fontSize: '1.3rem' }}>{dept.students}</div>
                        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Students</div>
                      </div>

                      <div style={{ background: '#262626', borderRadius: '16px', padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ background: '#333', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <CalendarDays size={18} color="#38bdf8" />
                        </div>
                        <div style={{ fontWeight: 800, color: '#fff', fontSize: '1.3rem' }}>{dept.events}</div>
                        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Events</div>
                      </div>

                      <div style={{ background: '#262626', borderRadius: '16px', padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ background: '#333', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Clock size={18} color="#38bdf8" />
                        </div>
                        <div style={{ fontWeight: 800, color: '#fff', fontSize: '1.3rem' }}>{dept.pending}</div>
                        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ─── Users Table ─────────────────── */}
        {activeTab === 'users' && (
          <motion.div
            className="admin-table-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {usersLoading ? (
              <div style={{ padding: '2rem' }}>
                {[1, 2, 3].map(i => (
                  <div key={i} className="skeleton-block" style={{ height: 50, borderRadius: 10, marginBottom: 10 }} />
                ))}
              </div>
            ) : filteredCollegeUsers.length === 0 ? (
              <div className="admin-empty">
                <Users size={48} strokeWidth={1} style={{ color: 'var(--primary)', opacity: 0.4 }} />
                <p>No users registered yet.</p>
              </div>
            ) : (
              <table className="admin-table-v2">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Year</th>
                    <th>Section</th>
                    <th>Role</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCollegeUsers.map(u => (
                    <tr key={u.id}>
                      <td data-label="User">{u.name || '—'}</td>
                      <td data-label="Email">{u.email}</td>
                      <td data-label="Department">{u.department || '—'}</td>
                      <td data-label="Year">{u.year ? `${u.year}${u.year === '1' ? 'st' : u.year === '2' ? 'nd' : u.year === '3' ? 'rd' : 'th'} Year` : '—'}</td>
                      <td data-label="Section">{u.section || '—'}</td>
                      <td data-label="Role">
                        <span className={`admin-type-pill ${getUserRole(u) === 'admin' ? 'type-ann' : 'type-event'}`}>
                          {getUserRole(u)}
                        </span>
                      </td>
                      <td data-label="Joined">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </motion.div>
        )}

        {/* ─── Events Table ────────────────── */}
        {(activeTab === 'pending' || activeTab === 'approved' || activeTab === 'rejected' || activeTab === 'all') && (
          <motion.div
            className="admin-table-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {isLoading ? (
              <div style={{ padding: '2rem' }}>
                {[1, 2, 3].map(i => (
                  <div key={i} className="skeleton-block" style={{ height: 60, borderRadius: 10, marginBottom: 10 }} />
                ))}
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="admin-empty">
                <CalendarDays size={48} strokeWidth={1} style={{ color: 'var(--primary)', opacity: 0.4 }} />
                <p>No events in this category</p>
              </div>
            ) : (
              <table className="admin-table-v2">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    {activeTab === 'all' ? (
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
                    {activeTab === 'all' && <th>Department</th>}
                    {activeTab === 'all' ? <th>Target Scope</th> : <th>Department</th>}
                    {activeTab === 'all' && <th>Year</th>}
                    {activeTab === 'all' && <th>Section</th>}
                    {activeTab !== 'all' && <th style={{ width: '100px' }}>Status</th>}
                    {activeTab === 'all' && <th style={{ width: '100px' }}>Attendees</th>}
                    {(activeTab === 'pending' || activeTab === 'rejected') && <th style={{ width: '180px' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filteredEvents.map(event => (
                      <motion.tr
                        key={event.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, x: 30 }}
                        layout
                        onClick={() => navigate(`/${event._sourceTable === 'competitions' ? 'competition' : 'event'}/${event.id}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td data-label="Event">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ position: 'relative', width: 48, height: 48, borderRadius: 8, overflow: 'hidden', background: '#333', flexShrink: 0 }}>
                              <img src={event.banner_url || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=500&auto=format&fit=crop&q=60'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <div style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--primary)', padding: 4, borderTopLeftRadius: 8, display: 'flex' }}>
                                {event._sourceTable === 'competitions' ? <Trophy size={10} color="#fff" /> : <Ticket size={10} color="#fff" />}
                              </div>
                            </div>
                            <div>
                              <div className="admin-event-name" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                {event.title}
                                {event.is_universal && (
                                  <span className="admin-type-pill type-universal" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>🌍 Universal</span>
                                )}
                              </div>
                              {event.course && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{event.course}</span>
                                </div>
                              )}
                              {(event.creator_name || event.organizer_name || event.organizer_email) && (
                                <small className="admin-event-org">{event.creator_name || event.organizer_name || event.organizer_email}</small>
                              )}
                            </div>
                          </div>
                        </td>
                        <td data-label="Start Date">{event.start_date ? formatDate(event.start_date) : '—'}</td>
                        <td data-label="End Date">{event.end_date ? formatDate(event.end_date) : (event.start_date ? formatDate(event.start_date) : '—')}</td>
                        {activeTab === 'all' ? (
                          <>
                            <td data-label="Speaker">{event.speaker_name || '—'}</td>
                            <td data-label="Speaker Org">{event.speaker_org || '—'}</td>
                          </>
                        ) : (
                          <>
                            <td data-label="Venue">{event.is_online ? 'Online' : (event.venue || '—')}</td>
                            <td data-label="Price">{getPriceDisplay(event)}</td>
                          </>
                        )}
                        <>
                          {activeTab === 'all' && (
                            <td data-label="Department">
                              {event.creator_dept}
                            </td>
                          )}
                          <td data-label={activeTab === 'all' ? "Target Scope" : "Department"}>
                            {activeTab !== 'all' ? (
                              <span>{event.creator_dept}</span>
                            ) : event.is_universal ? (
                              <span>Universal</span>
                            ) : event.target_departments && event.target_departments.length > 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {event.target_departments.map((td: any, i: number) => (
                                  <span key={i} style={{ fontSize: '0.85rem' }}>{td.department}</span>
                                ))}
                              </div>
                            ) : event.department ? (
                              <span>{event.department === 'ALL' ? 'College-wide' : event.department}</span>
                            ) : (
                              <span>College-wide</span>
                            )}
                          </td>
                          {activeTab === 'all' && (
                            <td data-label="Year" style={{ textAlign: 'left' }}>
                              {event.target_departments && event.target_departments.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  {event.target_departments.map((td: any, i: number) => (
                                    <span key={i} style={{ fontSize: '0.85rem' }}>
                                      {td.years && td.years.length > 0 
                                        ? [...td.years].sort((a: any, b: any) => Number(a) - Number(b)).map((y: string) => formatYearLabel(y, td.course || event.course)).join(', ')
                                        : <span style={{ color: 'white', fontWeight: 500 }}>ALL</span>}
                                    </span>
                                  ))}
                                </div>
                              ) : event.target_years && event.target_years.length > 0 ? (
                                  <span>{[...event.target_years].sort((a: any, b: any) => Number(a) - Number(b)).map((y: string) => formatYearLabel(y, event.course)).join(', ')}</span>
                              ) : (
                                <span style={{ color: 'white', fontWeight: 500 }}>ALL</span>
                              )}
                            </td>
                          )}
                          {activeTab === 'all' && (
                            <td data-label="Section" style={{ textAlign: 'left' }}>
                              {event.target_departments && event.target_departments.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  {event.target_departments.map((td: any, i: number) => (
                                    <span key={i} style={{ fontSize: '0.85rem' }}>
                                      {td.sections && Object.keys(td.sections).length > 0
                                        ? Object.entries(td.sections).map(([y, secs]) => `${formatYearLabel(y, td.course || event.course)}: ${(secs as string[]).join(',')}`).join(' | ')
                                        : <span style={{ color: 'white', fontWeight: 500 }}>ALL</span>}
                                    </span>
                                  ))}
                                </div>
                              ) : event.target_sections && Object.keys(event.target_sections).length > 0 ? (
                                <span style={{ fontSize: '0.85rem' }}>
                                  {Object.entries(event.target_sections).map(([y, secs]) => 
                                `${formatYearLabel(y, event.course)}: ${(secs as string[]).join(',')}`
                              ).join(' | ')}
                                </span>
                              ) : (
                                <span style={{ color: 'white', fontWeight: 500 }}>ALL</span>
                              )}
                            </td>
                          )}
                        </>
                        {activeTab !== 'all' && (
                          <td data-label="Status">
                            <span className={`admin-status-badge status-${event.status}`}>
                              {event.status}
                            </span>
                          </td>
                        )}
                        {activeTab === 'all' && (
                          <td data-label="Attendees" style={{ fontWeight: 600, textAlign: 'left' }}>{event.attendee_count}</td>
                        )}
                        {activeTab === 'pending' && (
                          <td data-label="Actions">
                            <div className="admin-actions">
                              <button
                                className="admin-action-btn btn-approve"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateStatusMutation.mutate({ eventId: event.id, status: 'approved', sourceTable: event._sourceTable })
                                }}
                                disabled={updateStatusMutation.isPending}
                              >
                                <CheckCircle size={14} /> Approve
                              </button>
                              <button
                                className="admin-action-btn btn-reject"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateStatusMutation.mutate({ eventId: event.id, status: 'rejected', sourceTable: event._sourceTable })
                                }}
                                disabled={updateStatusMutation.isPending}
                              >
                                <XCircle size={14} /> Reject
                              </button>
                            </div>
                          </td>
                        )}
                        {activeTab === 'rejected' && (
                          <td data-label="Actions">
                            <div className="admin-actions">
                              <button
                                className="admin-action-btn btn-approve"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateStatusMutation.mutate({ eventId: event.id, status: 'approved', sourceTable: event._sourceTable })
                                }}
                                disabled={updateStatusMutation.isPending}
                              >
                                <CheckCircle size={14} /> Re-approve
                              </button>
                            </div>
                          </td>
                        )}
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            )}
          </motion.div>
        )}

        {/* ─── Toast ───────────────────────── */}
        <AnimatePresence>
          {toast && (
            <motion.div
              className={`admin-toast ${toast.type === 'approve' ? 'toast-approve' : 'toast-reject'}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
            >
              {toast.type === 'approve' ? <CheckCircle size={16} /> : <XCircle size={16} />}
              {toast.message}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
