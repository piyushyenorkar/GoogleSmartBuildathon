import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Filter, ChevronDown, ChevronUp,
  Building2, GraduationCap, CheckCircle2, AlertCircle,
  Banknote, IndianRupee, Clock
} from 'lucide-react'
import type { HQOrganizer } from '@/services/plutoHQService'
import { INDIAN_BANKS } from '@/lib/banks'

interface Props {
  organizers: HQOrganizer[] | undefined
  isLoading: boolean
}

export default function OrganizersTab({ organizers, isLoading }: Props) {
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'college' | '3rd_party'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (isLoading || !organizers) {
    return (
      <div className="hq-tab-content">
        <div className="hq-org-list">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="hq-org-card skeleton-shimmer" style={{ height: 70 }} />
          ))}
        </div>
      </div>
    )
  }

  const filtered = organizers.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(search.toLowerCase()) ||
      org.email.toLowerCase().includes(search.toLowerCase())
    const matchesType = filterType === 'all' || org.type === filterType
    return matchesSearch && matchesType
  })

  return (
    <div className="hq-tab-content">
      {/* Controls */}
      <div className="hq-filter-row" style={{ alignItems: 'center' }}>
        <div style={{ position: 'relative', width: 320 }}>
          <Search size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#000', zIndex: 10, pointerEvents: 'none' }} />
          <input
            type="text"
            className="glass-input"
            placeholder="Search organizers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '2.75rem', height: '40px', borderRadius: '999px', margin: 0, boxSizing: 'border-box' }}
          />
        </div>

        <button
          className={`hq-filter-pill ${filterType === 'all' ? 'active' : ''}`}
          onClick={() => setFilterType('all')}
          style={{ height: '40px', borderRadius: '999px', display: 'flex', alignItems: 'center' }}
        >
          All
        </button>
        <button
          className={`hq-filter-pill ${filterType === 'college' ? 'active' : ''}`}
          onClick={() => setFilterType('college')}
          style={{ height: '40px', borderRadius: '999px', display: 'flex', alignItems: 'center' }}
        >
          <GraduationCap size={14} /> Official College
        </button>
        <button
          className={`hq-filter-pill ${filterType === '3rd_party' ? 'active' : ''}`}
          onClick={() => setFilterType('3rd_party')}
          style={{ height: '40px', borderRadius: '999px', display: 'flex', alignItems: 'center' }}
        >
          <Building2 size={14} /> Individual Organisers
        </button>
      </div>

      {/* List */}
      <div className="hq-org-list">
        {filtered.length === 0 ? (
          <div className="hq-empty">
            <Search size={40} style={{ opacity: 0.3 }} />
            <p>No organizers found matching your criteria.</p>
          </div>
        ) : (
          filtered.map((org, i) => {
            const isExpanded = expandedId === org.id
            return (
              <motion.div
                key={org.id}
                className={`hq-org-card spatial-card ${isExpanded ? 'expanded' : ''}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                {/* Header Row */}
                <div
                  className="hq-org-header"
                  onClick={() => setExpandedId(isExpanded ? null : org.id)}
                >
                  <div className="hq-org-info" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {org.photo_url ? (
                      <img
                        src={org.photo_url}
                        alt={org.name}
                        className="hq-org-avatar"
                        style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.8)', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                      />
                    ) : (
                      <div className="hq-org-avatar" style={{ width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)', color: '#4f46e5', fontWeight: 600, fontSize: '1.2rem', border: '2px solid rgba(255,255,255,0.8)', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                        {org.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="hq-org-name" style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1e293b' }}>{org.name}</div>
                        <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', background: org.type === 'college' ? '#eff6ff' : '#f8fafc', color: org.type === 'college' ? '#3b82f6' : '#64748b', border: `1px solid ${org.type === 'college' ? '#bfdbfe' : '#e2e8f0'}`, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                          {org.type === 'college' ? <GraduationCap size={10} /> : <Building2 size={10} />}
                          {org.type === 'college' ? 'College' : 'Individual'}
                        </span>
                      </div>
                      <div className="hq-org-email" style={{ color: '#64748b', fontSize: '0.85rem' }}>{org.email}</div>
                    </div>
                  </div>

                  <div className="hq-org-stats" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                      <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Earnings</span>
                      <span className="hq-org-stat" style={{ fontWeight: 700, color: '#334155', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        ₹{org.totalEarnings.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', background: org.bankLinked ? '#ecfdf5' : '#fef2f2', color: org.bankLinked ? '#10b981' : '#ef4444', border: `1px solid ${org.bankLinked ? '#a7f3d0' : '#fecaca'}` }}>
                      {org.bankLinked ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                      {org.bankLinked ? 'Bank Linked' : 'No Bank'}
                    </span>
                    <div style={{ padding: '6px', background: 'rgba(0,0,0,0.03)', borderRadius: '50%', color: '#64748b', marginLeft: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      className="hq-org-details"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* Financial summary */}
                      <div className="hq-org-detail-grid">
                        <div className="hq-org-detail-card" style={{ borderLeft: '4px solid #818cf8' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ background: 'rgba(99, 102, 241, 0.12)', color: '#818cf8', width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <IndianRupee size={20} />
                            </div>
                            <div>
                              <div className="hq-org-detail-label">Total Earnings</div>
                              <div className="hq-org-detail-value" style={{ color: '#334155' }}>
                                ₹{org.totalEarnings.toLocaleString('en-IN')}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="hq-org-detail-card" style={{ borderLeft: '4px solid #fbbf24' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ background: 'rgba(251, 191, 36, 0.12)', color: '#fbbf24', width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Clock size={20} />
                            </div>
                            <div>
                              <div className="hq-org-detail-label">Unsettled Balance</div>
                              <div className="hq-org-detail-value" style={{ color: '#334155' }}>
                                ₹{org.unsettledBalance.toLocaleString('en-IN')}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="hq-org-detail-card" style={{ borderLeft: '4px solid #f87171' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ background: 'rgba(248, 113, 113, 0.12)', color: '#f87171', width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <AlertCircle size={20} />
                            </div>
                            <div>
                              <div className="hq-org-detail-label">Pending Payouts</div>
                              <div className="hq-org-detail-value" style={{ color: '#334155' }}>
                                ₹{org.pendingPayoutAmount.toLocaleString('en-IN')}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="hq-org-detail-card" style={{ borderLeft: '4px solid #34d399' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#34d399', width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <CheckCircle2 size={20} />
                            </div>
                            <div>
                              <div className="hq-org-detail-label">Total Paid Out</div>
                              <div className="hq-org-detail-value" style={{ color: '#334155' }}>
                                ₹{org.totalPaidOut.toLocaleString('en-IN')}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Bank Info */}
                      <div className="hq-org-bank-info">
                        <div className="hq-org-bank-title">Payment / Bank Details</div>
                        {org.bankLinked ? (
                          <div className="hq-org-bank-grid">
                            {org.bankDetails.bank_name && (
                              <div>
                                <span className="hq-bank-label">Bank:</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {(() => {
                                    const bankLogo = INDIAN_BANKS.find(b => b.name === org.bankDetails.bank_name)?.logo;
                                    return bankLogo ? <img src={bankLogo} alt="" style={{ width: 14, height: 14, borderRadius: 2 }} /> : null;
                                  })()}
                                  {org.bankDetails.bank_name}
                                </div>
                              </div>
                            )}
                            {org.bankDetails.account_number && <div><span className="hq-bank-label">Account:</span> {org.bankDetails.account_number}</div>}
                            {org.bankDetails.ifsc_code && <div><span className="hq-bank-label">IFSC:</span> {org.bankDetails.ifsc_code}</div>}
                            {org.bankDetails.upi_id && <div><span className="hq-bank-label">UPI:</span> {org.bankDetails.upi_id}</div>}
                          </div>
                        ) : (
                          <div style={{ color: '#fbbf24', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <AlertCircle size={14} /> Organizer has not linked any bank account or UPI ID.
                          </div>
                        )}
                      </div>

                      <div className="hq-org-meta" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.5rem 1rem', borderRadius: '999px', fontSize: '0.85rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          Events created: <strong style={{ color: '#0f172a' }}>{org.eventCount}</strong>
                        </div>
                        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.5rem 1rem', borderRadius: '999px', fontSize: '0.85rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          Total bookings sold: <strong style={{ color: '#0f172a' }}>{org.bookingCount}</strong>
                        </div>
                        {org.college && (
                          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '0.5rem 1rem', borderRadius: '999px', fontSize: '0.85rem', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            College: <strong style={{ color: '#1e3a8a' }}>{org.college}</strong>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  )
}
