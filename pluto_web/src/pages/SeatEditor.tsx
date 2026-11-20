import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQueryClient } from '@tanstack/react-query'
import { eventService } from '@/services/eventService'
import { useEvent } from '@/hooks/useEvents'
import { PageLoader } from '@/components/ui/PageLoader'
import { X, Save, Trash2, Eye, LayoutGrid, PlusCircle, ChevronDown } from 'lucide-react'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import './SeatStyles.css'

interface Seat {
  id: string
  label: string
  row: string
  rowId: string
  x: number
  y: number
  price: number
  status: string
}

interface Row {
  id: string
  name: string
  seatIds: string[]
}

interface TableSeat {
  id: string
  label: string
  status: string
}

interface Table {
  id: string
  label: string
  x: number
  y: number
  price: number
  seats: TableSeat[]
}

interface Layout {
  stagePosition: 'top' | 'bottom' | 'left' | 'right'
  seats: Seat[]
  tables: Table[]
  rows: Row[]
}

export default function SeatEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const { data: event, isLoading: loading } = useEvent(id)
  const [layout, setLayout] = useState<Layout>({
    stagePosition: 'top',
    seats: [],
    tables: [],
    rows: []
  })

  // Selection
  const [selectedRow, setSelectedRow] = useState<string | null>(null)
  const clickTimers = useRef<{ [key: string]: ReturnType<typeof setTimeout> }>({})
  const clickCounts = useRef<{ [key: string]: number }>({})

  // Modals state
  const [showRowModal, setShowRowModal] = useState(false)
  const [showTableModal, setShowTableModal] = useState(false)
  const [showEditSeatModal, setShowEditSeatModal] = useState(false)
  const [editingSeatId, setEditingSeatId] = useState<string | null>(null)
  const [editSeatData, setEditSeatData] = useState({ label: '', price: 0 })

  // Row Modal form state
  const [numRows, setNumRows] = useState(3)
  const [autoNumber, setAutoNumber] = useState(true)
  const [rowConfigs, setRowConfigs] = useState<{ name: string; count: number; price: number }[]>([])

  // Table Modal form state
  const [numTables, setNumTables] = useState(1)
  const [tableConfigs, setTableConfigs] = useState<{ name: string; seats: number; price: number }[]>([])

  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (event && event.seat_layout && typeof event.seat_layout === 'object' && Object.keys(event.seat_layout as Record<string, any>).length > 0) {
      setLayout(event.seat_layout as unknown as Layout)
    }
  }, [event])

  // --- Row Modal Logic ---
  useEffect(() => {
    if (showRowModal) {
      const configs = []
      for (let i = 0; i < numRows; i++) {
        configs.push({
          name: String.fromCharCode(65 + i),
          count: 10,
          price: 500
        })
      }
      setRowConfigs(configs)
    }
  }, [showRowModal, numRows])

  const handleAddRows = () => {
    let currentY = 120
    if (layout.seats.length > 0) {
      currentY = Math.max(...layout.seats.map(s => s.y)) + 70
    }

    const newSeats: Seat[] = []
    const newRows: Row[] = []
    const MAX_SEATS_PER_LINE = 15
    const spacing = 45

    rowConfigs.forEach((config, i) => {
      const rowId = `row_${Date.now()}_${i}`
      const rowData: Row = { id: rowId, name: config.name, seatIds: [] }
      const totalLines = Math.ceil(config.count / MAX_SEATS_PER_LINE)

      for (let j = 0; j < config.count; j++) {
        const lineIndex = Math.floor(j / MAX_SEATS_PER_LINE)
        const posInLine = j % MAX_SEATS_PER_LINE
        const seatId = `seat_${Date.now()}_${i}_${j}`
        const seatLabel = autoNumber ? `${config.name}${j + 1}` : `${config.name}-${j + 1}`

        newSeats.push({
          id: seatId,
          label: seatLabel,
          row: config.name,
          rowId,
          x: 50 + (posInLine * spacing),
          y: currentY + (lineIndex * 50),
          price: config.price,
          status: 'available'
        })
        rowData.seatIds.push(seatId)
      }

      newRows.push(rowData)
      currentY += (totalLines * 50) + 30
    })

    setLayout(prev => ({
      ...prev,
      seats: [...prev.seats, ...newSeats],
      rows: [...prev.rows, ...newRows]
    }))
    setShowRowModal(false)
  }

  // --- Table Modal Logic ---
  useEffect(() => {
    if (showTableModal) {
      const configs = []
      for (let i = 0; i < numTables; i++) {
        configs.push({
          name: `T${layout.tables.length + i + 1}`,
          seats: 6,
          price: 800
        })
      }
      setTableConfigs(configs)
    }
  }, [showTableModal, numTables, layout.tables.length])

  const findAvailableTablePosition = () => {
    const tableSize = 200
    const padding = 20
    const cols = Math.floor((800 - padding * 2) / (tableSize + 50))

    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < 5; row++) {
        const x = padding + col * (tableSize + 50)
        const y = 100 + row * (tableSize + 50)

        const hasOverlap = layout.tables.some(table => {
          const dx = Math.abs(table.x - x)
          const dy = Math.abs(table.y - y)
          return dx < tableSize && dy < tableSize
        })

        if (!hasOverlap) return { x, y }
      }
    }

    const lastTable = layout.tables[layout.tables.length - 1]
    if (lastTable) {
      return { x: lastTable.x + 250, y: lastTable.y }
    }
    return { x: 300, y: 200 }
  }

  const handleAddTables = () => {
    const newTables: Table[] = []

    tableConfigs.forEach((config, i) => {
      const tableId = `table_${Date.now()}_${i}`
      const position = findAvailableTablePosition()
      const tableData: Table = {
        id: tableId,
        label: config.name,
        x: position.x,
        y: position.y,
        price: config.price,
        seats: []
      }

      for (let j = 0; j < config.seats; j++) {
        tableData.seats.push({
          id: `${tableId}_seat_${j}`,
          label: `${config.name}-${j + 1}`,
          status: 'available'
        })
      }
      newTables.push(tableData)
      // Temporarily push to layout.tables for the next iteration of findAvailableTablePosition
      layout.tables.push(tableData)
    })

    setLayout(prev => ({
      ...prev,
      tables: [...prev.tables.filter(t => !newTables.find(nt => nt.id === t.id)), ...newTables] // avoid duplicates if we mutated layout.tables directly above
    }))
    setShowTableModal(false)
  }

  const deleteSeat = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setLayout(prev => ({ ...prev, seats: prev.seats.filter(s => s.id !== id) }))
  }

  const deleteTable = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setLayout(prev => ({ ...prev, tables: prev.tables.filter(t => t.id !== id) }))
  }

  const openSeatEdit = (seat: Seat) => {
    setEditingSeatId(seat.id)
    setEditSeatData({ label: seat.label, price: seat.price })
    setShowEditSeatModal(true)
  }

  const handleSeatClick = (seat: Seat) => {
    clickCounts.current[seat.id] = (clickCounts.current[seat.id] || 0) + 1

    if (clickCounts.current[seat.id] === 1) {
      clickTimers.current[seat.id] = setTimeout(() => {
        if (clickCounts.current[seat.id] === 1) {
          openSeatEdit(seat)
        }
        clickCounts.current[seat.id] = 0
      }, 300)
    } else if (clickCounts.current[seat.id] === 2) {
      clearTimeout(clickTimers.current[seat.id])
      setSelectedRow(seat.rowId === selectedRow ? null : seat.rowId)
      clickCounts.current[seat.id] = 0
    }
  }

  const handleDrag = (seat: Seat, info: any) => {
    if (selectedRow === seat.rowId) {
      const siblings = layout.seats.filter(s => s.rowId === selectedRow && s.id !== seat.id)
      siblings.forEach(sibling => {
        const el = document.getElementById(`framer-${sibling.id}`)
        if (el) {
          el.style.transform = `translateX(${sibling.x + info.offset.x}px) translateY(${sibling.y + info.offset.y}px) translateZ(0px)`
        }
      })
    }
  }

  const handleDragEnd = (seat: Seat, info: any) => {
    if (selectedRow === seat.rowId) {
      setLayout(prev => ({
        ...prev,
        seats: prev.seats.map(s => s.rowId === selectedRow ? { ...s, x: s.x + info.offset.x, y: s.y + info.offset.y } : s)
      }))
    } else {
      setLayout(prev => ({
        ...prev,
        seats: prev.seats.map(s => s.id === seat.id ? { ...s, x: s.x + info.offset.x, y: s.y + info.offset.y } : s)
      }))
    }
  }

  const handleSaveSeatEdit = () => {
    setLayout(prev => ({
      ...prev,
      seats: prev.seats.map(s => s.id === editingSeatId ? { ...s, ...editSeatData } : s)
    }))
    setShowEditSeatModal(false)
  }

  const totalSeats = layout.seats.length + layout.tables.reduce((acc, t) => acc + t.seats.length, 0)

  const handleSaveAndPublish = async () => {
    if (totalSeats === 0) {
      alert('Please add at least one seat before saving')
      return
    }

    try {
      const updatedEvent = await eventService.updateEvent(id!, {
        layout,
        ticketLimit: totalSeats,
        price: Math.min(
          ...(layout.seats.length ? layout.seats.map(s => s.price) : [0]),
          ...(layout.tables.length ? layout.tables.map(t => t.price) : [0])
        )
      } as any)
      if (updatedEvent) {
        alert('Seat layout saved successfully!')
        queryClient.invalidateQueries({ queryKey: ['events'] })
        navigate('/organizer/events')
      }
    } catch (err: any) {
      alert(`Failed to save layout: ${err.message}`)
    }
  }

  if (loading) return <PageLoader />

  return (
    <>
      <section className="hero" style={{ padding: '20px 0 0 0' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: '2.5rem', margin: 0 }}>Design Seat Layout</h1>
          <span style={{ fontSize: '1.5rem', color: 'var(--gray-light)', opacity: 0.5 }}>•</span>
          <p id="event-title-display" style={{ color: 'var(--gray-light)', fontSize: '1.2rem', margin: 0, fontWeight: 500 }}>
            {event?.title || 'Configure your seating arrangement'}
          </p>
        </div>
      </section>

      <div style={{ padding: '2rem 0 5rem' }}>
        <div className="container" style={{ maxWidth: '1400px' }}>
          <div className="seat-editor-container">
            {/* Toolbar */}
            <div className="seat-toolbar glow-card-container">
              <div className="toolbar-section">
            <h3>🎭 Stage Position</h3>
            <div className="stage-position-selector">
              {['top', 'bottom', 'left', 'right'].map(pos => (
                <button
                  key={pos}
                  className={`stage-pos-btn ${layout.stagePosition === pos ? 'active' : ''}`}
                  onClick={() => setLayout({ ...layout, stagePosition: pos as any })}
                >
                  {pos.charAt(0).toUpperCase() + pos.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="toolbar-section">
            <h3>➕ Add Elements</h3>
            <button className="toolbar-btn" onClick={() => setShowRowModal(true)}>
              <LayoutGrid size={18} /> Add Row
            </button>
            <button className="toolbar-btn" onClick={() => setShowTableModal(true)}>
              <PlusCircle size={18} /> Add Table
            </button>
          </div>

          <div className="toolbar-section">
            <h3>⚙️ Actions</h3>
            <button className="toolbar-btn" onClick={() => alert('Preview not implemented in this snippet.')}>
              <Eye size={18} /> Preview
            </button>
            <button className="toolbar-btn" onClick={() => {
              if (confirm('Clear entire layout?')) {
                setLayout({ ...layout, seats: [], tables: [], rows: [] })
              }
            }}>
              <Trash2 size={18} /> Clear All
            </button>
          </div>

            <button className="toolbar-btn primary" onClick={handleSaveAndPublish}>
              <Save size={18} /> Save & Publish
            </button>
          </div>

          {/* Canvas */}
          <div className="seat-canvas-wrapper glow-card-container">
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>Total Seats:</strong> <span id="seat-count">{totalSeats}</span>
              </div>
              <div style={{ color: 'var(--gray-light)', fontSize: '0.85rem' }}>
                💡 Click: Edit | Double-click: Select row | Drag: Move
              </div>
            </div>

            <div 
              className="seat-canvas" 
              ref={containerRef}
              onClick={(e) => {
                if ((e.target as HTMLElement).classList.contains('seat-canvas')) {
                  setSelectedRow(null)
                }
              }}
            >
            {/* Stage */}
            <motion.div
              drag
              dragMomentum={false}
              className="stage"
              style={{
                width: ['top', 'bottom'].includes(layout.stagePosition) ? 400 : 100,
                height: ['top', 'bottom'].includes(layout.stagePosition) ? 60 : 300,
                left: layout.stagePosition === 'top' || layout.stagePosition === 'bottom' ? 200 : layout.stagePosition === 'left' ? 20 : 'calc(100% - 120px)',
                top: layout.stagePosition === 'top' ? 20 : layout.stagePosition === 'bottom' ? 520 : 150,
                position: 'absolute'
              }}
            >
              STAGE
            </motion.div>

            {/* Seats */}
            {layout.seats.map(seat => (
              <motion.div
                key={seat.id}
                id={`framer-${seat.id}`}
                drag
                dragMomentum={false}
                onDrag={(e, info) => handleDrag(seat, info)}
                onDragEnd={(e, info) => handleDragEnd(seat, info)}
                className={`seat ${selectedRow === seat.rowId ? 'row-selected' : ''}`}
                style={{ x: seat.x, y: seat.y }}
                onClick={() => handleSeatClick(seat)}
              >
                {seat.label}
                <button className="delete-btn" onClick={(e) => deleteSeat(e, seat.id)}><X size={12} /></button>
              </motion.div>
            ))}

            {/* Tables */}
            {layout.tables.map(table => (
              <motion.div
                key={table.id}
                drag
                dragMomentum={false}
                onDragEnd={(_, info) => {
                  setLayout(prev => ({
                    ...prev,
                    tables: prev.tables.map(t => t.id === table.id ? { ...t, x: t.x + info.offset.x, y: t.y + info.offset.y } : t)
                  }))
                }}
                className="table-group"
                style={{ x: table.x, y: table.y }}
              >
                <div className="table-center">{table.label}</div>
                {table.seats.map((seat, index) => {
                  const angle = (2 * Math.PI * index) / table.seats.length
                  const radius = 60
                  return (
                    <div key={seat.id} className="table-seat" style={{
                      left: 40 + radius * Math.cos(angle) - 17.5,
                      top: 40 + radius * Math.sin(angle) - 17.5
                    }}>
                      {seat.label.split('-')[1]}
                    </div>
                  )
                })}
                <button className="delete-btn" onClick={(e) => deleteTable(e, table.id)}><X size={12} /></button>
              </motion.div>
            ))}
            </div>
          </div>
        </div>
      </div>
    </div>
      {/* Row Modal */}
      {showRowModal && (
        <div className="seat-modal active">
          <div className="modal-content">
            <h3>Add Rows of Seats</h3>
            <div className="input-group">
              <label>How Many Rows?</label>
              <input type="number" min="1" max="26" value={numRows} onChange={e => setNumRows(Number(e.target.value))} />
            </div>
            <div className="row-table-container">
              <table className="row-table">
                <thead><tr><th>Row Name</th><th>Seats</th><th>Price (₹)</th></tr></thead>
                <tbody>
                  {rowConfigs.map((config, i) => (
                    <tr key={i}>
                      <td><input value={config.name} onChange={e => { const c = [...rowConfigs]; c[i].name = e.target.value; setRowConfigs(c) }} /></td>
                      <td><input type="number" value={config.count} onChange={e => { const c = [...rowConfigs]; c[i].count = Number(e.target.value); setRowConfigs(c) }} /></td>
                      <td><input type="number" value={config.price} onChange={e => { const c = [...rowConfigs]; c[i].price = Number(e.target.value); setRowConfigs(c) }} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="checkbox-group">
              <input type="checkbox" checked={autoNumber} onChange={e => setAutoNumber(e.target.checked)} />
              <label>Auto-number seats</label>
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowRowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAddRows}>Add Rows</button>
            </div>
          </div>
        </div>
      )}

      {/* Table Modal */}
      {showTableModal && (
        <div className="seat-modal active">
          <div className="modal-content">
            <h3>Add Round Tables</h3>
            <div className="input-group">
              <label>Number of Tables</label>
              <input type="number" min="1" max="10" value={numTables} onChange={e => setNumTables(Number(e.target.value))} />
            </div>
            <div className="row-table-container">
              <table className="row-table">
                <thead><tr><th>Table Name</th><th>Seats</th><th>Price (₹)</th></tr></thead>
                <tbody>
                  {tableConfigs.map((config, i) => (
                    <tr key={i}>
                      <td><input value={config.name} onChange={e => { const c = [...tableConfigs]; c[i].name = e.target.value; setTableConfigs(c) }} /></td>
                      <td>
                        <DropdownMenu>
                          <DropdownMenuTrigger style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0.5rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', color: 'var(--white)', fontSize: '0.9rem', cursor: 'pointer' }}>
                            <span>{config.seats} Seats</span>
                            <ChevronDown size={14} />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {[4, 6, 8, 10].map(num => (
                              <DropdownMenuItem key={num} onClick={() => { const c = [...tableConfigs]; c[i].seats = num; setTableConfigs(c) }}>
                                {num} Seats
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                      <td><input type="number" value={config.price} onChange={e => { const c = [...tableConfigs]; c[i].price = Number(e.target.value); setTableConfigs(c) }} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowTableModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAddTables}>Add Tables</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Seat Modal */}
      {showEditSeatModal && (
        <div className="seat-modal active">
          <div className="modal-content">
            <h3>Edit Seat</h3>
            <div className="input-group">
              <label>Seat Label *</label>
              <input value={editSeatData.label} onChange={e => setEditSeatData(prev => ({ ...prev, label: e.target.value }))} />
            </div>
            <div className="input-group">
              <label>Price (₹) *</label>
              <input type="number" value={editSeatData.price} onChange={e => setEditSeatData(prev => ({ ...prev, price: Number(e.target.value) }))} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowEditSeatModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveSeatEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
