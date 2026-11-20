import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock, CheckCircle2, XCircle, ArrowRight,
  Banknote, Building2, Copy, Send, AlertTriangle,
  ChevronDown, ChevronUp, CreditCard
} from 'lucide-react'
import type { HQPayout } from '@/services/plutoHQService'
import { INDIAN_BANKS } from '@/lib/banks'

interface Props {
  payouts: HQPayout[] | undefined
  isLoading: boolean
  onProcess: (payoutId: string, action: 'approve' | 'complete' | 'reject', data?: { referenceNumber?: string; failureReason?: string }) => void
  processingId: string | null
}

type PayoutFilter = 'all' | 'requested' | 'processing' | 'completed' | 'failed'

const STATUS_CONFIG: Record<string, { icon: typeof Clock; label: string; color: string; bg: string }> = {
  requested: { icon: Clock, label: 'Pending', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
  processing: { icon: ArrowRight, label: 'Processing', color: '#60a5fa', bg: 'rgba(59,130,246,0.12)' },
  completed: { icon: CheckCircle2, label: 'Completed', color: '#34d399', bg: 'rgba(16,185,129,0.12)' },
  failed: { icon: XCircle, label: 'Rejected', color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
}

export default function PayoutsTab({ payouts, isLoading, onProcess, processingId }: Props) {
  const [filter, setFilter] = useState<PayoutFilter>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [utrInputs, setUtrInputs] = useState<Record<string, string>>({})
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({})
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: string } | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  if (isLoading || !payouts) {
    return (
      <div className="hq-tab-content">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="hq-payout-card skeleton-shimmer" style={{ height: 120, marginBottom: 16 }} />
        ))}
      </div>
    )
  }

  const safePayouts = payouts || []
  const filtered = filter === 'all' ? safePayouts : safePayouts.filter(p => p.status === filter)

  const counts = {
    all: safePayouts.length,
    requested: safePayouts.filter(p => p.status === 'requested').length,
    processing: safePayouts.filter(p => p.status === 'processing').length,
    completed: safePayouts.filter(p => p.status === 'completed').length,
    failed: safePayouts.filter(p => p.status === 'failed').length,
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div className="hq-tab-content">
      {/* Summary bar */}
      <div className="bento-grid" style={{ marginBottom: '2rem' }}>
        <div className="spatial-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.5rem' }}>
          <div className="hq-kpi-icon" style={{ background: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', margin: 0, width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 16 }}>
            <Clock size={28} />
          </div>
          <div>
            <div className="hq-kpi-value">{counts.requested}</div>
            <div className="hq-kpi-label">Pending</div>
          </div>
        </div>
        <div className="spatial-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.5rem' }}>
          <div className="hq-kpi-icon" style={{ background: 'rgba(96, 165, 250, 0.15)', color: '#3b82f6', margin: 0, width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 16 }}>
            <Send size={28} />
          </div>
          <div>
            <div className="hq-kpi-value">{counts.processing}</div>
            <div className="hq-kpi-label">Processing</div>
          </div>
        </div>
        <div className="spatial-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.5rem' }}>
          <div className="hq-kpi-icon" style={{ background: 'rgba(52, 211, 153, 0.15)', color: '#10b981', margin: 0, width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 16 }}>
            <CheckCircle2 size={28} />
          </div>
          <div>
            <div className="hq-kpi-value">{counts.completed}</div>
            <div className="hq-kpi-label">Completed</div>
          </div>
        </div>
        <div className="spatial-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.5rem' }}>
          <div className="hq-kpi-icon" style={{ background: 'rgba(248, 113, 113, 0.15)', color: '#f87171', margin: 0, width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 16 }}>
            <XCircle size={28} />
          </div>
          <div>
            <div className="hq-kpi-value">{counts.failed}</div>
            <div className="hq-kpi-label">Rejected</div>
          </div>
        </div>
      </div>

      {/* Filter pills */}
      <div className="hq-filter-row">
        {(['all', 'requested', 'processing', 'completed', 'failed'] as const).map(f => (
          <button
            key={f}
            className={`hq-filter-pill ${filter === f ? 'active' : ''} ${f !== 'all' ? f : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All' : STATUS_CONFIG[f]?.label || f} ({counts[f]})
          </button>
        ))}
      </div>

      {/* Payout list Table */}
      <div className="hq-revenue-table-wrap spatial-card" style={{ overflow: 'visible' }}>
        <table className="hq-revenue-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Organizer</th>
              <th>Amount</th>
              <th>Bookings</th>
              <th>Date</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#64748b' }}>
                    <Banknote size={48} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
                    <p style={{ fontSize: '1.1rem', margin: 0, color: '#334155', fontWeight: 600 }}>No {filter === 'all' ? '' : filter} payouts found.</p>
                    <p style={{ fontSize: '0.9rem', marginTop: '0.5rem', opacity: 0.7 }}>When organizers request a withdrawal, it will appear here.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((payout, i) => {
                const isExpanded = expandedId === payout.id
                const config = STATUS_CONFIG[payout.status] || STATUS_CONFIG.requested
                const StatusIcon = config.icon

                return (
                  <React.Fragment key={payout.id}>
                    <motion.tr
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => setExpandedId(isExpanded ? null : payout.id)}
                      style={{ cursor: 'pointer', borderBottom: isExpanded ? 'none' : undefined, background: isExpanded ? 'rgba(0,0,0,0.01)' : undefined }}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div className="hq-payout-avatar" style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden' }}>
                            {payout.organizer?.photo_url ? (
                              <img src={payout.organizer.photo_url} alt={payout.organizer?.name || 'Organizer'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              payout.organizer?.name?.charAt(0)?.toUpperCase() || '?'
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.95rem' }}>{payout.organizer?.name || 'Unknown'}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{payout.organizer?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontWeight: 700, fontSize: '1rem', color: '#334155' }}>
                        ₹{payout.amount.toLocaleString('en-IN')}
                      </td>
                      <td>{payout.booking_count}</td>
                      <td style={{ fontSize: '0.85rem', color: '#64748b' }}>{formatDate(payout.requested_at)}</td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: config.bg, color: config.color, padding: '4px 10px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600 }}>
                          <StatusIcon size={12} />
                          {config.label}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {isExpanded ? <ChevronUp size={18} color="#94a3b8" /> : <ChevronDown size={18} color="#94a3b8" />}
                      </td>
                    </motion.tr>

                    {/* Expanded details row */}
                    <AnimatePresence>
                      {isExpanded && (
                        <tr style={{ background: 'transparent' }}>
                          <td colSpan={6} style={{ padding: 0, border: 'none', background: 'transparent' }}>
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25 }}
                              style={{ overflow: 'hidden' }}
                            >
                              <div style={{ padding: '0 2rem 2rem 2rem' }}>
                                <div className="hq-payout-details" style={{ margin: 0, padding: '1.5rem', border: '1px solid var(--glass-border-strong)', background: 'rgba(248, 250, 252, 0.6)', borderRadius: '16px' }}>
                                  {/* Bank details */}
                                  <div className="hq-payout-bank-section">
                                    <h4 className="hq-payout-section-title">
                                      <Building2 size={16} /> Bank / Payment Details
                                    </h4>
                                    <div className="hq-payout-bank-grid">
                                      {payout.organizer?.bank_name && (
                                        <div className="hq-payout-bank-row">
                                          <span className="hq-pbl">Bank</span>
                                          <span className="hq-pbv" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            {(() => {
                                              const bankLogo = INDIAN_BANKS.find(b => b.name === payout.organizer?.bank_name)?.logo;
                                              return bankLogo ? (
                                                <img src={bankLogo} alt="" style={{ width: 16, height: 16, borderRadius: 2 }} />
                                              ) : null;
                                            })()}
                                            {payout.organizer.bank_name}
                                          </span>
                                        </div>
                                      )}
                                      {payout.organizer?.account_name && (
                                        <div className="hq-payout-bank-row">
                                          <span className="hq-pbl">Account Name</span>
                                          <span className="hq-pbv">{payout.organizer.account_name}</span>
                                        </div>
                                      )}
                                      {payout.organizer?.account_number && (
                                        <div className="hq-payout-bank-row">
                                          <span className="hq-pbl">Account Number</span>
                                          <span className="hq-pbv">
                                            {payout.organizer.account_number}
                                            <button className="hq-copy-btn" onClick={(e) => { e.stopPropagation(); handleCopy(payout.organizer!.account_number!, `acc-${payout.id}`) }} title={copiedId === `acc-${payout.id}` ? "Copied!" : "Copy"}>
                                              {copiedId === `acc-${payout.id}` ? <CheckCircle2 size={12} color="#10b981" /> : <Copy size={12} />}
                                            </button>
                                          </span>
                                        </div>
                                      )}
                                      {payout.organizer?.ifsc_code && (
                                        <div className="hq-payout-bank-row">
                                          <span className="hq-pbl">IFSC Code</span>
                                          <span className="hq-pbv">
                                            {payout.organizer.ifsc_code}
                                            <button className="hq-copy-btn" onClick={(e) => { e.stopPropagation(); handleCopy(payout.organizer!.ifsc_code!, `ifsc-${payout.id}`) }} title={copiedId === `ifsc-${payout.id}` ? "Copied!" : "Copy"}>
                                              {copiedId === `ifsc-${payout.id}` ? <CheckCircle2 size={12} color="#10b981" /> : <Copy size={12} />}
                                            </button>
                                          </span>
                                        </div>
                                      )}
                                      {payout.organizer?.upi_id && (
                                        <div className="hq-payout-bank-row">
                                          <span className="hq-pbl">UPI ID</span>
                                          <span className="hq-pbv">
                                            {payout.organizer.upi_id}
                                            <button className="hq-copy-btn" onClick={(e) => { e.stopPropagation(); handleCopy(payout.organizer!.upi_id!, `upi-${payout.id}`) }} title={copiedId === `upi-${payout.id}` ? "Copied!" : "Copy"}>
                                              {copiedId === `upi-${payout.id}` ? <CheckCircle2 size={12} color="#10b981" /> : <Copy size={12} />}
                                            </button>
                                          </span>
                                        </div>
                                      )}
                                      {!payout.organizer?.account_number && !payout.organizer?.upi_id && (
                                        <div className="hq-payout-bank-row hq-bank-missing">
                                          <AlertTriangle size={14} />
                                          <span>No bank account or UPI linked by organizer</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Reference number (for completed/processing) */}
                                  {payout.reference_number && (
                                    <div className="hq-payout-ref">
                                      <CreditCard size={14} />
                                      <span>UTR/Reference: <strong>{payout.reference_number}</strong></span>
                                    </div>
                                  )}

                                  {payout.failure_reason && (
                                    <div className="hq-payout-failure">
                                      <XCircle size={14} />
                                      <span>Reason: {payout.failure_reason}</span>
                                    </div>
                                  )}

                                  {payout.processed_at && (
                                    <div className="hq-payout-processed-at">
                                      Processed: {formatDate(payout.processed_at)}
                                    </div>
                                  )}

                                  {/* Action buttons */}
                                  <div className="hq-payout-actions">
                                    {payout.status === 'requested' && (
                                      <>
                                        {confirmAction?.id === payout.id && confirmAction?.action === 'approve' ? (
                                          <div className="hq-confirm-row">
                                            <span>Approve this payout of ₹{payout.amount.toLocaleString('en-IN')}?</span>
                                            <button
                                              className="hq-action-btn approve"
                                              disabled={processingId === payout.id}
                                              onClick={() => { onProcess(payout.id, 'approve'); setConfirmAction(null) }}
                                            >
                                              {processingId === payout.id ? 'Processing...' : 'Yes, Approve'}
                                            </button>
                                            <button className="hq-action-btn cancel" onClick={() => setConfirmAction(null)}>Cancel</button>
                                          </div>
                                        ) : confirmAction?.id === payout.id && confirmAction?.action === 'reject' ? (
                                          <div className="hq-confirm-row">
                                            <input
                                              type="text"
                                              className="hq-utr-input"
                                              placeholder="Rejection reason (optional)"
                                              value={rejectReason[payout.id] || ''}
                                              onChange={(e) => setRejectReason(prev => ({ ...prev, [payout.id]: e.target.value }))}
                                            />
                                            <button
                                              className="hq-action-btn reject"
                                              disabled={processingId === payout.id}
                                              onClick={() => { onProcess(payout.id, 'reject', { failureReason: rejectReason[payout.id] }); setConfirmAction(null) }}
                                            >
                                              {processingId === payout.id ? 'Processing...' : 'Confirm Reject'}
                                            </button>
                                            <button className="hq-action-btn cancel" onClick={() => setConfirmAction(null)}>Cancel</button>
                                          </div>
                                        ) : (
                                          <>
                                            <button
                                              className="hq-action-btn approve"
                                              onClick={() => setConfirmAction({ id: payout.id, action: 'approve' })}
                                            >
                                              <CheckCircle2 size={14} /> Approve & Process
                                            </button>
                                            <button
                                              className="hq-action-btn reject"
                                              onClick={() => setConfirmAction({ id: payout.id, action: 'reject' })}
                                            >
                                              <XCircle size={14} /> Reject
                                            </button>
                                          </>
                                        )}
                                      </>
                                    )}

                                    {payout.status === 'processing' && (
                                      <div className="hq-complete-section">
                                        <div className="hq-complete-info">
                                          <Send size={14} />
                                          Transfer ₹{payout.amount.toLocaleString('en-IN')} to the bank details above, then enter the UTR below.
                                        </div>
                                        <div className="hq-utr-row">
                                          <input
                                            type="text"
                                            className="hq-utr-input"
                                            placeholder="Enter UTR / Reference Number"
                                            value={utrInputs[payout.id] || ''}
                                            onChange={(e) => setUtrInputs(prev => ({ ...prev, [payout.id]: e.target.value }))}
                                          />
                                          <button
                                            className="hq-action-btn complete"
                                            disabled={processingId === payout.id}
                                            onClick={() => onProcess(payout.id, 'complete', { referenceNumber: utrInputs[payout.id] })}
                                          >
                                            {processingId === payout.id ? 'Completing...' : '✅ Mark Completed'}
                                          </button>
                                        </div>
                                        <button
                                          className="hq-action-btn reject small"
                                          onClick={() => setConfirmAction({ id: payout.id, action: 'reject' })}
                                        >
                                          <XCircle size={12} /> Reject Instead
                                        </button>
                                        {confirmAction?.id === payout.id && confirmAction?.action === 'reject' && (
                                          <div className="hq-confirm-row" style={{ marginTop: 8 }}>
                                            <input
                                              type="text"
                                              className="hq-utr-input"
                                              placeholder="Rejection reason"
                                              value={rejectReason[payout.id] || ''}
                                              onChange={(e) => setRejectReason(prev => ({ ...prev, [payout.id]: e.target.value }))}
                                            />
                                            <button
                                              className="hq-action-btn reject"
                                              disabled={processingId === payout.id}
                                              onClick={() => { onProcess(payout.id, 'reject', { failureReason: rejectReason[payout.id] }); setConfirmAction(null) }}
                                            >
                                              Confirm Reject
                                            </button>
                                            <button className="hq-action-btn cancel" onClick={() => setConfirmAction(null)}>Cancel</button>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
