import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Users, Calendar, IndianRupee, Download, Search, ChevronDown, CalendarPlus, CalendarDays, Ticket, LayoutGrid, FileSpreadsheet } from 'lucide-react'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { motion, AnimatePresence } from 'framer-motion'
import { useOrganizerEvents } from '@/hooks/useEvents'
import { useEventsBookings } from '@/hooks/useBookings'
import { useAuthStore } from '@/stores/authStore'
import { formatDate, formatPrice, formatCompactNumber, formatCompactPrice } from '@/lib/utils'
import ExcelJS from 'exceljs'

import './Dashboard.css'
import './OrganizerDashboard.css'
import './OrganizerBookings.css'

export default function OrganizerBookingsPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [selectedEventId, setSelectedEventId] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const { data: events = [], isLoading: loadingEvents } = useOrganizerEvents(user?.id)
  const eventIds = useMemo(() => events.map((e) => e.id), [events])
  const { data: allBookings = [], isLoading: loadingBookings } = useEventsBookings(eventIds)

  const filteredBookings = useMemo(() => {
    let bookings = allBookings

    if (selectedEventId !== 'all') {
      bookings = bookings.filter((b) => b.eventId === selectedEventId)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      bookings = bookings.filter((b) =>
        b.userName.toLowerCase().includes(q) ||
        b.userEmail.toLowerCase().includes(q) ||
        b.eventTitle.toLowerCase().includes(q)
      )
    }

    return bookings
  }, [allBookings, selectedEventId, searchQuery])

  const stats = useMemo(() => {
    const total = filteredBookings.length
    const revenue = filteredBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0)
    const tickets = filteredBookings.reduce((sum, b) => sum + (b.quantity || 0), 0)
    return { total, revenue, tickets }
  }, [filteredBookings])

  const handleExportExcel = async () => {
    if (selectedEventId === 'all' || filteredBookings.length === 0) return;
    
    const selectedEvent = events.find(e => e.id === selectedEventId);
    const eventName = selectedEvent ? selectedEvent.title : 'Event';

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Pluto Organizer';
    const worksheet = workbook.addWorksheet('Bookings', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
    });

    worksheet.columns = [
      { header: 'Booking ID', key: 'bookingId', width: 20 },
      { header: 'Event Name', key: 'eventName', width: 35 },
      { header: 'User Name', key: 'userName', width: 25 },
      { header: 'User Email', key: 'userEmail', width: 35 },
      { header: 'Tickets', key: 'quantity', width: 12 },
      { header: 'Amount Paid', key: 'amount', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Booking Date', key: 'date', width: 20 }
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

    filteredBookings.forEach((b, index) => {
      const row = worksheet.addRow({
        bookingId: b.id.substring(0, 8).toUpperCase(),
        eventName: b.eventTitle,
        userName: b.userName,
        userEmail: b.userEmail,
        quantity: b.quantity,
        amount: formatPrice(b.totalAmount || 0),
        status: b.status.toUpperCase(),
        date: new Date(b.bookingDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
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
    link.download = `Bookings_${eventName.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
  }

  const isLoading = loadingEvents || loadingBookings

  if (!user) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🔒</div>
        <h3>Sign in required</h3>
        <p>Please sign in to view bookings.</p>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>Bookings | PLUTO Organizer</title>
      </Helmet>

      <div className="org-bookings-page">
        <div className="container org-dashboard-container" style={{ maxWidth: '1140px', margin: '0 auto' }}>
          {/* MOBILE MAIN TABS */}
          <div className="org-main-tabs hide-desktop">
            <button
              className="org-main-tab-btn"
              onClick={() => navigate('/organizer')}
            >
              <LayoutGrid size={16} /> <span>Dashboard</span>
            </button>
            <button
              className="org-main-tab-btn"
              onClick={() => navigate('/organizer/events')}
            >
              <CalendarDays size={16} /> <span>Events</span>
            </button>
            <button
              className="org-main-tab-btn active"
              onClick={() => navigate('/organizer/bookings')}
            >
              <Ticket size={16} /> <span>Bookings</span>
            </button>
          </div>

          {/* ─── Desktop Header ────────────────────── */}
          <motion.div
            className="org-header hide-mobile"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="org-header-text">
              <h1>Bookings</h1>
              <p>View who booked your events</p>
            </div>
            <button className="btn btn-primary org-create-btn" onClick={() => navigate('/create-event')}>
              <CalendarPlus size={16} /> Create Event
            </button>
          </motion.div>

          {/* ─── Mobile Header ─────────────────────── */}
          <motion.div
            className="dashboard-header hide-desktop"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ justifyContent: 'space-between', marginTop: '1.5rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="header-icon-wrap">
                <Ticket size={22} color="#a78bfa" />
              </div>
              <div className="org-header-text" style={{ margin: 0 }}>
                <h1 style={{ margin: 0 }}>Bookings</h1>
              </div>
            </div>
          </motion.div>

          {/* Stats Overview */}
          <div className="dashboard-stats">
            <motion.div className="dstat dstat-primary" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
              <div className="dstat-icon"><CalendarDays size={22} /></div>
              <div className="dstat-info">
                <div className="dstat-value">
                  <span className="hide-mobile">{stats.total}</span>
                  <span className="hide-desktop">{formatCompactNumber(stats.total)}</span>
                </div>
                <div className="dstat-label">Total Bookings</div>
              </div>
            </motion.div>
            <motion.div className="dstat dstat-primary" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="dstat-icon"><Ticket size={22} /></div>
              <div className="dstat-info">
                <div className="dstat-value">
                  <span className="hide-mobile">{stats.tickets}</span>
                  <span className="hide-desktop">{formatCompactNumber(stats.tickets)}</span>
                </div>
                <div className="dstat-label">Tickets Sold</div>
              </div>
            </motion.div>
            <motion.div className="dstat dstat-primary" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className="dstat-icon"><IndianRupee size={22} /></div>
              <div className="dstat-info">
                <div className="dstat-value">
                  <span className="hide-mobile">{stats.revenue > 0 ? formatPrice(stats.revenue) : '₹0'}</span>
                  <span className="hide-desktop">{stats.revenue > 0 ? formatCompactPrice(stats.revenue) : '₹0'}</span>
                </div>
                <div className="dstat-label">Revenue</div>
              </div>
            </motion.div>
          </div>

          {/* Filters */}
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
                {selectedEventId === 'all' ? 'All Events' : events.find(e => e.id === selectedEventId)?.title || 'Select Event'}
                <ChevronDown size={14} />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSelectedEventId('all')}>All Events</DropdownMenuItem>
                {events.map((ev) => (
                  <DropdownMenuItem key={ev.id} onClick={() => setSelectedEventId(ev.id)}>
                    {ev.title}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <div 
              className="export-tooltip-wrapper"
            >
              {(selectedEventId === 'all' || filteredBookings.length === 0) && (
                <div className="export-tooltip">
                  Select an event to export bookings
                </div>
              )}
              <button 
                onClick={handleExportExcel}
                disabled={selectedEventId === 'all' || filteredBookings.length === 0}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 14px',
                  height: '40px',
                  borderRadius: '20px',
                  background: (selectedEventId === 'all' || filteredBookings.length === 0) ? '#3f3f46' : 'linear-gradient(135deg, #107c41, #185c37)',
                  border: 'none',
                  color: (selectedEventId === 'all' || filteredBookings.length === 0) ? '#a1a1aa' : '#fff',
                  fontWeight: 600,
                  fontSize: '14px',
                  boxShadow: (selectedEventId === 'all' || filteredBookings.length === 0) ? 'none' : '0 2px 8px rgba(16, 124, 65, 0.4)',
                  pointerEvents: (selectedEventId === 'all' || filteredBookings.length === 0) ? 'none' : 'auto'
                }}
              >
                <FileSpreadsheet size={16} /> Export Sheet
              </button>
            </div>
          </div>

          {/* Bookings Table */}
          {isLoading ? (
            <div className="booking-strips dashboard-section hide-mobile" style={{ marginTop: '2rem' }}>
              <div className="booking-grid-header">
                <div>Booking ID</div>
                <div>Event Name</div>
                <div>User Email</div>
                <div>Tickets</div>
                <div>Amount</div>
                <div>Date</div>
                <div>Status</div>
              </div>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="booking-strip history-strip booking-grid-row" style={{ padding: '1.25rem', height: 'auto', marginBottom: '0.75rem', cursor: 'default' }}>
                  <div className="b-col b-col-id" data-label="Booking ID">
                    <div className="skeleton-block" style={{ height: 16, width: '60px', borderRadius: 4 }} />
                  </div>
                  <div className="b-col b-col-title" data-label="Event Name">
                    <div className="skeleton-block" style={{ height: 16, width: '120px', borderRadius: 4 }} />
                  </div>
                  <div className="b-col b-col-email" data-label="User Email">
                    <div className="skeleton-block" style={{ height: 16, width: '150px', borderRadius: 4 }} />
                  </div>
                  <div className="b-col b-col-tickets" data-label="Tickets">
                    <div className="skeleton-block" style={{ height: 16, width: '24px', borderRadius: 4 }} />
                  </div>
                  <div className="b-col b-col-amount" data-label="Amount">
                    <div className="skeleton-block" style={{ height: 16, width: '48px', borderRadius: 4 }} />
                  </div>
                  <div className="b-col b-col-date" data-label="Date">
                    <div className="skeleton-block" style={{ height: 16, width: '80px', borderRadius: 4 }} />
                  </div>
                  <div className="b-col b-col-status" data-label="Status">
                    <div className="skeleton-block" style={{ height: 24, width: '80px', borderRadius: 12 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="booking-strips dashboard-section hide-mobile" style={{ marginTop: '2rem' }}>
                <div className="booking-grid-header">
                  <div>Booking ID</div>
                  <div>Event Name</div>
                  <div>User Email</div>
                  <div>Tickets</div>
                  <div>Amount</div>
                  <div>Date</div>
                  <div>Status</div>
                </div>

                {filteredBookings.length === 0 ? (
                  <div className="dashboard-empty" style={{ marginTop: '2rem', marginBottom: '2rem' }}>
                    <div className="empty-state-icon">📋</div>
                    <h3>No bookings yet</h3>
                    <p>When people book your events, they'll appear here.</p>
                  </div>
                ) : (
                  filteredBookings.map((booking, i) => {
                    const statusLabel = booking.status === 'confirmed' ? 'Confirmed' : booking.status
                    const badgeClass = booking.status === 'confirmed' ? 'strip-badge-upcoming' : booking.status === 'cancelled' ? 'strip-badge-cancelled' : 'strip-badge-attended'

                    return (
                      <motion.div
                        key={booking.id}
                        className="booking-strip history-strip booking-grid-row"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.03 * i }}
                        style={{ cursor: 'default', padding: '1.25rem', height: 'auto' }}
                      >
                        <div className="b-col b-col-id" data-label="Booking ID">#{booking.id.toUpperCase()}</div>
                        <div className="b-col b-col-title" data-label="Event Name">{booking.eventTitle}</div>
                        <div className="b-col b-col-email" data-label="User Email">{booking.userEmail}</div>
                        <div className="b-col b-col-tickets" data-label="Tickets">{booking.quantity}</div>
                        <div className="b-col b-col-amount" data-label="Amount">{formatPrice(booking.totalAmount)}</div>
                        <div className="b-col b-col-date" data-label="Date">{formatDate(booking.bookingDate)}</div>
                        <div className="b-col b-col-status" data-label="Status">
                          <span className={`strip-badge ${badgeClass}`}>{statusLabel}</span>
                        </div>
                      </motion.div>
                    )
                  })
                )}
              </div>

              {/* MOBILE CARDS FOR BOOKINGS */}
              <div className="hide-desktop" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '1.5rem' }}>
                <AnimatePresence>
                  {filteredBookings.length === 0 ? (
                    <div className="dashboard-empty" style={{ padding: '2rem' }}>
                      <div className="empty-state-icon" style={{ fontSize: '2rem', marginBottom: '1rem' }}>📋</div>
                      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>No bookings found.</p>
                    </div>
                  ) : (
                    filteredBookings.map((booking, i) => (
                      <motion.div
                        key={booking.id}
                        className="booking-card"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 * i }}
                      >
                        <div className="booking-card-row">

                          <div className="booking-card-meta">
                            <div className="booking-card-title">{booking.eventTitle}</div>
                            <div className="booking-card-subrow" style={{ marginTop: 2 }}>
                              <span style={{ color: '#a1a1aa', fontSize: '11px' }}>{booking.userEmail}</span>
                            </div>
                          </div>
                          <div className={`booking-card-badge ${booking.status === 'confirmed' ? 'confirmed' : ''}`} style={booking.status !== 'confirmed' ? { backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff' } : {}}>
                            {booking.status === 'confirmed' ? 'Confirmed' : booking.status}
                          </div>
                        </div>

                        <div className="booking-card-inline">
                          <div className="booking-card-inline-item">
                            <span className="booking-card-inline-label">TICKETS</span>
                            <span className="booking-card-inline-value">{booking.quantity}</span>
                          </div>
                          <div className="booking-card-inline-item">
                            <span className="booking-card-inline-label">AMOUNT</span>
                            <span className="booking-card-inline-value">{formatPrice(booking.totalAmount)}</span>
                          </div>
                          <div className="booking-card-inline-item">
                            <span className="booking-card-inline-label">DATE</span>
                            <span className="booking-card-inline-value">{formatDate(booking.bookingDate)}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>
      </div>


    </>
  )
}
