import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import {
  IndianRupee, Building2, CheckCircle2, Clock,
  Wallet, ArrowUpRight, Shield, AlertTriangle, BanknoteIcon,
  ArrowRightLeft, ExternalLink, Timer, TrendingUp, XCircle, Send, Info, Trophy, Ticket
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { usePayoutSummary, usePayoutTransactions, usePayoutHistory, useRequestPayout } from '@/hooks/usePayouts'
import { formatCurrency, formatDate } from '@/lib/utils'
import { INDIAN_BANKS } from '@/lib/banks'
import type { PayoutTransaction, Payout } from '@/services/payoutService'

import './Dashboard.css'
import './OrganizerPayouts.css'
import './OrganizerBookings.css'

type PayoutTab = 'transactions' | 'history'

export default function OrganizerPayouts() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<PayoutTab>('transactions')
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'event' | 'competition'>('all')
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawSuccess, setWithdrawSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (showWithdrawModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showWithdrawModal])

  // Real data from backend
  const { data: summary, isLoading: summaryLoading } = usePayoutSummary(user?.email)
  const { data: transactions = [], isLoading: txLoading } = usePayoutTransactions(user?.email)
  const { data: payouts = [], isLoading: payoutsLoading } = usePayoutHistory(user?.email)
  const requestPayoutMutation = useRequestPayout()

  const filteredTransactions = transactions.filter((tx: PayoutTransaction) => {
    if ((tx.total_paid || 0) <= 0) return false;
    return transactionFilter === 'all' || tx.source_type === transactionFilter;
  });

  // Withdraw handler
  const handleWithdraw = async () => {
    if (!user?.email) return
    try {
      const result = await requestPayoutMutation.mutateAsync(user.email)
      setShowWithdrawModal(false)
      setWithdrawSuccess(result.message)
      setTimeout(() => setWithdrawSuccess(null), 8000)
    } catch {
      // Error is available via requestPayoutMutation.error
    }
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { icon: typeof CheckCircle2; className: string; label: string }> = {
      unsettled: { icon: Timer, className: 'status-unsettled', label: 'Unsettled' },
      included: { icon: Clock, className: 'status-included', label: 'In Payout' },
      settled: { icon: CheckCircle2, className: 'status-settled', label: 'Settled' },
    }
    const c = config[status] || config.unsettled
    const Icon = c.icon
    return (
      <span className={`tx-status-badge ${c.className}`}>
        <Icon size={12} />
        {c.label}
      </span>
    )
  }

  const getPayoutStatusBadge = (status: string) => {
    const config: Record<string, { icon: typeof CheckCircle2; className: string; label: string }> = {
      requested: { icon: Clock, className: 'payout-status-requested', label: 'Requested' },
      processing: { icon: ArrowUpRight, className: 'payout-status-processing', label: 'Processing' },
      completed: { icon: CheckCircle2, className: 'payout-status-completed', label: 'Completed' },
      failed: { icon: XCircle, className: 'payout-status-failed', label: 'Failed' },
    }
    const c = config[status] || config.requested
    const Icon = c.icon
    return (
      <span className={`payout-status-badge ${c.className}`}>
        <Icon size={12} />
        {c.label}
      </span>
    )
  }

  if (!user) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '4rem' }}>
        <h2 style={{ color: 'var(--white)' }}>Login Required</h2>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>Organizer Payouts | PLUTO</title>
      </Helmet>

      <div className="container dashboard-container" style={{ maxWidth: '1200px', paddingTop: '1.2rem' }}>

        {/* ─── Success Toast ────────────────────────── */}
        <AnimatePresence>
          {withdrawSuccess && (
            <motion.div
              className="withdraw-success-toast"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <CheckCircle2 size={18} />
              {withdrawSuccess}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Bank Card UI ────────────────────────── */}
        <motion.div
          style={{ marginBottom: '2rem', marginTop: '-1rem', width: '100%' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bank-details-wrapper" style={{ margin: '0', padding: '0', width: '100%' }}>
            {summaryLoading ? (
              <div className="bank-card-glass row-mode" style={{ margin: '0', maxWidth: '100%', padding: '0.9rem 1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div className="skeleton-block" style={{ width: '40px', height: '40px', borderRadius: '12px' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div className="skeleton-block" style={{ width: '120px', height: '16px', borderRadius: '4px' }} />
                    <div className="skeleton-block" style={{ width: '80px', height: '12px', borderRadius: '4px' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                  <div className="skeleton-block" style={{ width: '100px', height: '28px', borderRadius: '4px' }} />
                  <div className="skeleton-block" style={{ width: '100px', height: '28px', borderRadius: '4px' }} />
                </div>
                <div>
                  <div className="skeleton-block" style={{ width: '120px', height: '32px', borderRadius: '8px' }} />
                </div>
              </div>
            ) : summary?.bankLinked ? (
              <div className="bank-card-glass row-mode" style={{ margin: '0', maxWidth: '100%', padding: '0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '0.9rem 1.75rem', flexWrap: 'wrap' }}>

                  {/* Left: Logo & Bank Name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div className="bank-card-logo-container" style={{ width: '40px', height: '40px', marginBottom: 0 }}>
                      {INDIAN_BANKS.find((b: any) => b.name === summary.bankInfo?.bank_name)?.logo ? (
                        <img
                          src={INDIAN_BANKS.find((b: any) => b.name === summary.bankInfo?.bank_name)?.logo}
                          alt={summary.bankInfo?.bank_name || 'Bank Logo'}
                          className="bank-card-logo"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            target.nextElementSibling?.setAttribute('style', 'display: block')
                          }}
                        />
                      ) : null}
                      <Building2
                        size={20}
                        className="fallback-bank-icon"
                        style={{ display: INDIAN_BANKS.find((b: any) => b.name === summary.bankInfo?.bank_name)?.logo ? 'none' : 'block' }}
                      />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--white)' }}>{summary.bankInfo?.bank_name || 'Bank Account'}</h4>
                        <span className="bank-card-badge" style={{ padding: '2px 6px', fontSize: '0.65rem', marginBottom: 0 }}><CheckCircle2 size={10} /> Verified</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {summary.bankInfo?.account_holder_name || user?.name}
                      </div>
                    </div>
                  </div>

                  {/* Middle: Details */}
                  <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                    <div className="bank-card-field" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.7rem' }}>Account Number</label>
                      <p className="mono-text" style={{ margin: 0, fontSize: '0.9rem' }}>•••• {summary.bankInfo?.account_number?.slice(-4) || '****'}</p>
                    </div>
                    {summary.bankInfo?.upi_id && (
                      <div className="bank-card-field" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.7rem' }}>UPI ID</label>
                        <p className="mono-text" style={{ margin: 0, fontSize: '0.9rem' }}>{summary.bankInfo?.upi_id}</p>
                      </div>
                    )}
                  </div>

                  {/* Right: Action */}
                  <div>
                    <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => navigate('/settings?tab=payouts')}>
                      <ExternalLink size={14} /> Update Details
                    </button>
                  </div>

                </div>
              </div>
            ) : (
              <div className="bank-card-empty" style={{ margin: '0', maxWidth: '100%', padding: '0.85rem 1.5rem', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '0.5rem', borderRadius: '50%', display: 'flex' }}>
                    <AlertTriangle size={20} style={{ color: '#f59e0b' }} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--white)' }}>Bank Account Required</h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Link your bank account or UPI so we can securely transfer your requested withdrawals.</p>
                  </div>
                </div>
                <button className="btn btn-primary" style={{ margin: '0', padding: '0.4rem 0.8rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }} onClick={() => navigate('/settings?tab=payouts')}>
                  <ExternalLink size={14} /> Link Bank Account
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* ─── Metric Cards ────────────────────────── */}
        <motion.div
          className="dashboard-stats"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2.5rem' }}
        >
          {/* Available Balance */}
          <div className="dstat dstat-success" style={{ position: 'relative' }}>
            <div className="dstat-icon">
              <Wallet size={24} />
            </div>
            <div className="dstat-info">
              <div className="dstat-value">
                {summaryLoading ? <div className="skeleton-block" style={{ width: 80, height: 28, borderRadius: 6 }} /> : formatCurrency(summary?.availableBalance || 0)}
              </div>
              <div className="dstat-label">Available to Withdraw</div>
            </div>
          </div>

          {/* Held Balance */}
          <div className="dstat dstat-secondary">
            <div className="dstat-icon">
              <Timer size={24} />
            </div>
            <div className="dstat-info">
              <div className="dstat-value">
                {summaryLoading ? <div className="skeleton-block" style={{ width: 80, height: 28, borderRadius: 6 }} /> : formatCurrency(summary?.heldBalance || 0)}
              </div>
              <div className="dstat-label">Held (24hr)</div>
            </div>
          </div>

          {/* In Transit */}
          <div className="dstat dstat-primary">
            <div className="dstat-icon">
              <ArrowUpRight size={24} />
            </div>
            <div className="dstat-info">
              <div className="dstat-value">
                {summaryLoading ? <div className="skeleton-block" style={{ width: 80, height: 28, borderRadius: 6 }} /> : formatCurrency(summary?.inTransit || 0)}
              </div>
              <div className="dstat-label">In Transit</div>
            </div>
          </div>

          {/* Total Withdrawn & Lifetime */}
          <div className="dstat" style={{ borderLeft: '3px solid rgba(255,255,255,0.2)' }}>
            <div className="dstat-icon" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>
              <BanknoteIcon size={24} />
            </div>
            <div className="dstat-info">
              <div className="dstat-value">
                {summaryLoading ? <div className="skeleton-block" style={{ width: 80, height: 28, borderRadius: 6 }} /> : formatCurrency(summary?.totalWithdrawn || 0)}
              </div>
              <div className="dstat-label">Total Withdrawn</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Lifetime Earnings: <strong style={{ color: 'var(--white)' }}>{summaryLoading ? '—' : formatCurrency(summary?.lifetimeEarnings || 0)}</strong>
              </div>
            </div>
          </div>
        </motion.div>



        {/* ─── Tabs ───────────────────────────────── */}
        <motion.div
          className="payouts-tabs-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="payouts-tabs-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div className="payouts-tabs-wrap">
              <button
                className={`payouts-tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
                onClick={() => setActiveTab('transactions')}
              >
                <ArrowRightLeft size={15} />
                Transaction Ledger
              </button>
              <button
                className={`payouts-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => setActiveTab('history')}
              >
                <BanknoteIcon size={15} />
                Payout History
              </button>
            </div>

            {activeTab === 'transactions' && (
              <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.35rem', borderRadius: '8px' }}>
                <button
                  className={`payouts-tab-btn ${transactionFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setTransactionFilter('all')}
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                >
                  All
                </button>
                <button
                  className={`payouts-tab-btn ${transactionFilter === 'event' ? 'active' : ''}`}
                  onClick={() => setTransactionFilter('event')}
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                >
                  Events
                </button>
                <button
                  className={`payouts-tab-btn ${transactionFilter === 'competition' ? 'active' : ''}`}
                  onClick={() => setTransactionFilter('competition')}
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                >
                  Competitions
                </button>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', paddingRight: '0.5rem' }}>
              {(summary?.availableBalance ?? 0) > 0 && summary?.bankLinked ? (
                <button
                  className="btn btn-success"
                  onClick={() => setShowWithdrawModal(true)}
                  disabled={requestPayoutMutation.isPending}
                  style={{
                    padding: '0.6rem 1.25rem',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                    border: 'none'
                  }}
                >
                  <Send size={16} />
                  Withdraw {summaryLoading ? '—' : formatCurrency(summary?.availableBalance || 0)}
                </button>
              ) : (
                <div style={{
                  padding: '0.6rem 1.25rem',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.04)',
                  color: 'var(--text-secondary)'
                }}>
                  Withdrawable: {summaryLoading ? '—' : formatCurrency(summary?.availableBalance || 0)}
                </div>
              )}
            </div>
          </div>

          {/* ─── Tab: Transaction Ledger ──────────── */}
          {activeTab === 'transactions' && (
            <div className="booking-strips dashboard-section">
              <div className="booking-grid-header" style={{ gridTemplateColumns: 'minmax(100px, 1fr) minmax(140px, 1.5fr) minmax(140px, 1.5fr) minmax(130px, 1.2fr) minmax(140px, 1.4fr) 1fr 1fr auto' }}>
                <div>Date</div>
                <div style={{ whiteSpace: 'nowrap' }}>
                  {transactionFilter === 'competition' ? 'Competition' : transactionFilter === 'event' ? 'Event' : 'Event / Comp'}
                </div>
                <div>Student</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', position: 'relative', left: '-15px' }}>
                  Ticket Price
                  <div className="info-tooltip-wrapper">
                    <Info size={14} style={{ color: 'var(--text-muted)', cursor: 'pointer' }} />
                    <div className="custom-tooltip">
                      Price per ticket multiplied by number of tickets sold
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', position: 'relative', left: '-15px' }}>
                  Total Paid
                  <div className="info-tooltip-wrapper">
                    <Info size={14} style={{ color: 'var(--text-muted)', cursor: 'pointer' }} />
                    <div className="custom-tooltip">
                      Ticket Price + 2.5% booking fee paid by student
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', position: 'relative', left: '-25px' }}>
                  Fees
                  <div className="info-tooltip-wrapper">
                    <Info size={14} style={{ color: 'var(--text-muted)', cursor: 'pointer' }} />
                    <div className="custom-tooltip">
                      2.5% booking fees on ticket price and 1% pluto commission on the ticket price
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', position: 'relative', left: '-35px' }}>
                  Your Net
                  <div className="info-tooltip-wrapper">
                    <Info size={14} style={{ color: 'var(--text-muted)', cursor: 'pointer' }} />
                    <div className="custom-tooltip">
                      Your net profit after the 1% platform commission is deducted.
                    </div>
                  </div>
                </div>
                <div style={{ position: 'relative', left: '-15px' }}>Status</div>
              </div>

              {txLoading ? (
                [1, 2, 3, 4].map(i => (
                  <div key={i} className="booking-strip history-strip booking-grid-row" style={{ gridTemplateColumns: 'minmax(100px, 1fr) minmax(140px, 1.5fr) minmax(140px, 1.5fr) minmax(130px, 1.2fr) minmax(140px, 1.4fr) 1fr 1fr auto', padding: '1.25rem', height: 'auto', marginBottom: '0.75rem', cursor: 'default' }}>
                    <div className="skeleton-block" style={{ height: 16, width: '80%', borderRadius: 4 }} />
                    <div className="skeleton-block" style={{ height: 16, width: '80%', borderRadius: 4 }} />
                    <div className="skeleton-block" style={{ height: 16, width: '80%', borderRadius: 4 }} />
                    <div className="skeleton-block" style={{ height: 16, width: '80%', borderRadius: 4 }} />
                    <div className="skeleton-block" style={{ height: 16, width: '80%', borderRadius: 4 }} />
                    <div className="skeleton-block" style={{ height: 16, width: '80%', borderRadius: 4 }} />
                    <div className="skeleton-block" style={{ height: 16, width: '80%', borderRadius: 4 }} />
                    <div className="skeleton-block" style={{ height: 24, width: '80px', borderRadius: 12 }} />
                  </div>
                ))
              ) : filteredTransactions.length === 0 ? (
                <div className="dashboard-empty" style={{ marginTop: '2rem' }}>
                  <div className="empty-state-icon">💸</div>
                  <h3>No transactions yet</h3>
                  <p>Revenue from ticket sales will appear here.</p>
                </div>
              ) : (
                filteredTransactions.map((tx: PayoutTransaction, i) => (
                  <motion.div
                    key={tx.id}
                    className="booking-strip history-strip booking-grid-row"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.03 * i }}
                    style={{ gridTemplateColumns: 'minmax(100px, 1fr) minmax(140px, 1.5fr) minmax(140px, 1.5fr) minmax(130px, 1.2fr) minmax(140px, 1.4fr) 1fr 1fr auto', padding: '1.25rem', height: 'auto', marginBottom: '0.75rem', cursor: 'default' }}
                  >
                    <div className="b-col" data-label="Date">{formatDate(tx.created_at)}</div>
                    <div className="b-col" data-label="Event" style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {tx.source_type === 'competition' ? <Trophy size={16} style={{ color: '#8b5cf6', flexShrink: 0 }} /> : <Ticket size={16} style={{ color: '#f59e0b', flexShrink: 0 }} />}
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {tx.source_type === 'competition' ? (tx.competitions?.title || '—') : (tx.events?.title || '—')}
                      </span>
                    </div>
                    <div className="b-col" data-label="Student" style={{ color: 'var(--text-secondary)' }}>
                      {tx.source_type === 'competition' 
                        ? (tx.competition_registrations?.registration_type === 'team'
                            ? (tx.competition_registrations?.competition_teams?.name || '—')
                            : (tx.competition_registrations?.users?.name || tx.competition_registrations?.users?.email || '—'))
                        : (tx.bookings?.users?.name || tx.bookings?.users?.email || '—')}
                    </div>
                    <div className="b-col" data-label="Ticket Price">
                      <div className="ticket-price-box">
                        <div className="ticket-price-math">
                          {tx.source_type === 'competition' ? (
                            tx.competition_registrations?.registration_type === 'team'
                              ? <>{formatCurrency(tx.ticket_subtotal / (tx.competition_registrations?.competition_teams?.team_size || 1))} × {tx.competition_registrations?.competition_teams?.team_size || 1}</>
                              : <>{formatCurrency(tx.ticket_subtotal)} × 1</>
                          ) : (
                            tx.bookings?.selected_seats && Array.isArray(tx.bookings.selected_seats) && tx.bookings.selected_seats.length > 0
                              ? <>{tx.bookings.selected_seats.length} seat{tx.bookings.selected_seats.length > 1 ? 's' : ''} (mixed prices)</>
                              : <>{formatCurrency(tx.ticket_subtotal / (tx.bookings?.quantity || 1))} × {tx.bookings?.quantity || 1}</>
                          )}
                        </div>
                        <div className="ticket-price-total">
                          {formatCurrency(tx.ticket_subtotal)}
                        </div>
                      </div>
                    </div>
                    <div className="b-col" data-label="Total Paid">
                      <div className="total-paid-box">
                        <div className="total-paid-math">
                          {formatCurrency(tx.ticket_subtotal)} + {formatCurrency(tx.booking_fee)}
                        </div>
                        <div className="total-paid-value">
                          {formatCurrency(tx.total_paid)}
                        </div>
                      </div>
                    </div>
                    <div className="b-col" data-label="Fees" style={{ color: '#f43f5e' }}>
                      - {formatCurrency(tx.razorpay_fee + tx.pluto_commission)}
                    </div>
                    {(tx.source_type === 'competition' ? tx.competition_registrations?.status === 'refunded' : tx.bookings?.booking_status === 'refunded') ? (
                      <>
                        <div className="b-col" data-label="Your Net" style={{ color: '#ef4444', fontWeight: 600 }}>
                          - {formatCurrency(tx.organizer_net)}
                        </div>
                        <div className="b-col" data-label="Status">
                          <span className="tx-status-badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                            <XCircle size={12} />
                            Refunded
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="b-col" data-label="Your Net" style={{ color: '#10b981', fontWeight: 600 }}>
                          + {formatCurrency(tx.organizer_net)}
                        </div>
                        <div className="b-col" data-label="Status">
                          {getStatusBadge(tx.payout_status)}
                        </div>
                      </>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          )}

          {/* ─── Tab: Payout History ─────────────── */}
          {activeTab === 'history' && (
            <div className="booking-strips dashboard-section">
              <div className="booking-grid-header" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr 1.5fr 1fr auto' }}>
                <div>Requested</div>
                <div>Amount</div>
                <div>Bookings</div>
                <div>Method</div>
                <div>Reference</div>
                <div>Processed</div>
                <div>Status</div>
              </div>

              {payoutsLoading ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="booking-strip history-strip booking-grid-row" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr 1.5fr 1fr auto', padding: '1.25rem', height: 'auto', marginBottom: '0.75rem', cursor: 'default' }}>
                    <div className="skeleton-block" style={{ height: 16, width: '80%', borderRadius: 4 }} />
                    <div className="skeleton-block" style={{ height: 16, width: '80%', borderRadius: 4 }} />
                    <div className="skeleton-block" style={{ height: 16, width: '80%', borderRadius: 4 }} />
                    <div className="skeleton-block" style={{ height: 16, width: '80%', borderRadius: 4 }} />
                    <div className="skeleton-block" style={{ height: 16, width: '80%', borderRadius: 4 }} />
                    <div className="skeleton-block" style={{ height: 16, width: '80%', borderRadius: 4 }} />
                    <div className="skeleton-block" style={{ height: 24, width: '80px', borderRadius: 12 }} />
                  </div>
                ))
              ) : payouts.length === 0 ? (
                <div className="dashboard-empty" style={{ marginTop: '2rem' }}>
                  <div className="empty-state-icon">🏦</div>
                  <h3>No payouts yet</h3>
                  <p>Request a withdrawal when you have available balance.</p>
                </div>
              ) : (
                payouts.map((p: Payout, i) => (
                  <motion.div
                    key={p.id}
                    className="booking-strip history-strip booking-grid-row"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.03 * i }}
                    style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr 1.5fr 1fr auto', padding: '1.25rem', height: 'auto', marginBottom: '0.75rem', cursor: 'default' }}
                  >
                    <div className="b-col" data-label="Requested" style={{ color: 'var(--text-secondary)' }}>{formatDate(p.requested_at)}</div>
                    <div className="b-col" data-label="Amount" style={{ fontWeight: 600 }}>{formatCurrency(p.amount)}</div>
                    <div className="b-col" data-label="Bookings">{p.booking_count}</div>
                    <div className="b-col" data-label="Method" style={{ textTransform: 'capitalize' }}>{p.payout_method?.replace('_', ' ') || '—'}</div>
                    <div className="b-col" data-label="Reference" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{p.reference_number || '—'}</div>
                    <div className="b-col" data-label="Processed" style={{ color: 'var(--text-secondary)' }}>{p.processed_at ? formatDate(p.processed_at) : '—'}</div>
                    <div className="b-col" data-label="Status">
                      {getPayoutStatusBadge(p.status)}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}

        </motion.div>
      </div>

      {/* ─── Withdraw Confirmation Modal ──────────── */}
      <AnimatePresence>
        {showWithdrawModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowWithdrawModal(false)}
          >
            <motion.div
              className="withdraw-modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="withdraw-modal-header">
                <IndianRupee size={24} />
                <h3>Confirm Withdrawal</h3>
              </div>

              <div className="withdraw-modal-body">
                <div className="withdraw-amount">
                  {formatCurrency(summary?.availableBalance || 0)}
                </div>
                <p className="withdraw-desc">
                  This will transfer your available balance to:
                </p>
                {summary?.bankInfo && (
                  <div className="withdraw-bank-info">
                    {summary.bankInfo.bank_name && <div><strong>Bank:</strong> {summary.bankInfo.bank_name}</div>}
                    {summary.bankInfo.account_number && <div><strong>A/C:</strong> {summary.bankInfo.account_number}</div>}
                    {summary.bankInfo.upi_id && <div><strong>UPI:</strong> {summary.bankInfo.upi_id}</div>}
                  </div>
                )}
                <p className="withdraw-eta">
                  <Clock size={14} />
                  Estimated arrival: 3–5 business days
                </p>

                {requestPayoutMutation.isError && (
                  <div className="withdraw-error">
                    <AlertTriangle size={14} />
                    {(requestPayoutMutation.error as Error)?.message || 'Failed to process withdrawal.'}
                  </div>
                )}
              </div>

              <div className="withdraw-modal-actions">
                <button
                  className="btn btn-ghost"
                  style={{ color: '#fff', border: '1px solid rgba(255, 255, 255, 0.15)' }}
                  onClick={() => setShowWithdrawModal(false)}
                  disabled={requestPayoutMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleWithdraw}
                  disabled={requestPayoutMutation.isPending}
                >
                  {requestPayoutMutation.isPending ? 'Processing...' : 'Confirm Withdrawal'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
