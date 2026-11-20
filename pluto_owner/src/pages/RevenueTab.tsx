import { useState, useMemo } from 'react';
import { motion } from 'framer-motion'
import {
  IndianRupee, TrendingUp, Percent, CreditCard,
  Wallet, ArrowDownRight, ArrowUpRight, BarChart2,
  Trophy, Ticket, Info
} from 'lucide-react'
import Dropdown from '@/components/Dropdown'
import type { HQRevenueEvent, HQRevenueSummary } from '@/services/plutoHQService'

interface Props {
  summary: HQRevenueSummary | undefined
  eventBreakdown: HQRevenueEvent[] | undefined
  isLoading: boolean
}

export default function RevenueTab({ summary, eventBreakdown, isLoading }: Props) {
  const [filter, setFilter] = useState<'all' | 'event' | 'competition'>('all')

  const filteredBreakdown = useMemo(() => {
    if (!eventBreakdown) return []
    if (filter === 'all') return eventBreakdown
    return eventBreakdown.filter(e => e.source_type === filter)
  }, [eventBreakdown, filter])

  if (isLoading || !summary) {
    return (
      <div className="hq-tab-content">
        <div className="hq-financial-grid">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="hq-finance-card skeleton-shimmer" style={{ height: 120 }} />
          ))}
        </div>
        <div className="hq-revenue-table-wrap skeleton-shimmer" style={{ height: 300, marginTop: 24 }} />
      </div>
    )
  }

  const cards = [
    {
      label: 'Total GMV',
      subtitle: 'All money through platform',
      value: summary.totalGMV,
      icon: IndianRupee,
      color: '#8b5cf6',
      bg: 'rgba(167, 139, 250, 0.15)',
    },
    {
      label: 'Booking Fees',
      subtitle: '2.5% from students',
      value: summary.totalBookingFees,
      icon: CreditCard,
      color: '#3b82f6',
      bg: 'rgba(96, 165, 250, 0.15)',
    },
    {
      label: 'Razorpay Fees',
      subtitle: '2.36% gateway cost',
      value: summary.totalRazorpayFees,
      icon: ArrowDownRight,
      color: '#ef4444',
      bg: 'rgba(248, 113, 113, 0.15)',
    },
    {
      label: 'Pluto Commission',
      subtitle: '1% Commission + 0.14% from Booking Fees',
      value: summary.totalCommission,
      icon: Percent,
      color: '#10b981',
      bg: 'rgba(52, 211, 153, 0.15)',
    },
  ]

  return (
    <div className="hq-tab-content">
      {/* Revenue summary cards */}
      <div className="bento-grid">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            className="spatial-card hq-kpi-card"
            style={{ position: 'relative' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <div className="hq-kpi-icon" style={{ background: card.bg, color: card.color }}>
              <card.icon size={24} />
            </div>
            <div>
              <div className="hq-kpi-value" title={`₹${card.value.toLocaleString('en-IN')}`}>₹{fmt(card.value)}</div>
              <div className="hq-kpi-label">{card.label}</div>
            </div>
            <div className="hq-kpi-subtitle" style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>
              {card.subtitle}
            </div>
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', marginTop: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h3 className="hq-section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BarChart2 size={22} color="#6366f1" /> Revenue by {filter === 'all' ? 'Event & Competition' : filter === 'event' ? 'Event' : 'Competition'}
        </h3>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <Dropdown
            value={filter}
            onChange={(val) => setFilter(val as any)}
            buttonStyle={{ color: '#64748b' }}
            options={[
              { label: 'All', value: 'all' },
              { label: 'Events', value: 'event' },
              { label: 'Competitions', value: 'competition' }
            ]}
          />

          <div style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid var(--glass-border-strong)', padding: '0.5rem 1rem', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: '0.4rem', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }} title={`₹${summary.totalOrganizerNet.toLocaleString('en-IN')}`}>
            <Wallet size={16} color="#64748b" /> Paid to Organizers: ₹{fmt(summary.totalOrganizerNet)}
          </div>
          <div style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid var(--glass-border-strong)', padding: '0.5rem 1rem', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 600, color: '#475569', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }} title={summary.totalTransactions.toLocaleString('en-IN')}>
            Total Transactions: {fmt(summary.totalTransactions)}
          </div>
        </div>
      </div>
      {filteredBreakdown && filteredBreakdown.length > 0 ? (
        <div className="hq-revenue-table-wrap spatial-card">
          <table className="hq-revenue-table">
            <thead>
              <tr>
                <th>{filter === 'competition' ? 'COMPETITION' : filter === 'event' ? 'EVENT' : 'EVENT/COMPETITION'}</th>
                <th>Bookings</th>
                <th>
                  Ticket Revenue
                  <div className="hq-tooltip-wrapper">
                    <Info size={14} color="#94a3b8" />
                    <span className="hq-tooltip-text">Total value of all tickets sold for the event/competition (without booking fees).</span>
                  </div>
                </th>
                <th>
                  Booking Fees
                  <div className="hq-tooltip-wrapper">
                    <Info size={14} color="#94a3b8" />
                    <span className="hq-tooltip-text">Total extra platform fees paid by attendees on top of ticket prices.</span>
                  </div>
                </th>
                <th>
                  Razorpay Cost
                  <div className="hq-tooltip-wrapper">
                    <Info size={14} color="#94a3b8" />
                    <span className="hq-tooltip-text">Payment gateway processing fee (~2.5% of total transaction value).</span>
                  </div>
                </th>
                <th>
                  Organizer Net
                  <div className="hq-tooltip-wrapper align-right">
                    <Info size={14} color="#94a3b8" />
                    <span className="hq-tooltip-text">Amount the organizer takes home after Pluto Commission and booking fees are deducted.</span>
                  </div>
                </th>
                <th>
                  Net Profit
                  <div className="hq-tooltip-wrapper align-right">
                    <Info size={14} color="#94a3b8" />
                    <span className="hq-tooltip-text">Pluto's actual profit (Pluto Commission + Booking Fees - Razorpay Cost).</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredBreakdown.map((e, i) => (
                <motion.tr
                  key={e.event_id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 + i * 0.03 }}
                >
                  <td className="hq-rt-event" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {e.source_type === 'competition' ? <Trophy size={16} color="#8b5cf6" /> : <Ticket size={16} color="#f59e0b" />}
                    {e.event_title || 'Unknown'}
                  </td>
                  <td>{e.bookings}</td>
                  <td>₹{e.ticket_revenue.toLocaleString('en-IN')}</td>
                  <td>₹{e.booking_fees.toLocaleString('en-IN')}</td>
                  <td style={{ color: '#f87171' }}>₹{e.razorpay_cost.toLocaleString('en-IN')}</td>
                  <td>₹{e.organizer_net.toLocaleString('en-IN')}</td>
                  <td className={`hq-rt-profit ${e.net_profit >= 0 ? 'positive' : 'negative'}`}>
                    ₹{e.net_profit.toLocaleString('en-IN')}
                  </td>
                </motion.tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td><strong>Total</strong></td>
                <td><strong>{filteredBreakdown.reduce((s, e) => s + e.bookings, 0)}</strong></td>
                <td><strong>₹{filteredBreakdown.reduce((s, e) => s + e.ticket_revenue, 0).toLocaleString('en-IN')}</strong></td>
                <td><strong>₹{filteredBreakdown.reduce((s, e) => s + e.booking_fees, 0).toLocaleString('en-IN')}</strong></td>
                <td style={{ color: '#f87171' }}><strong>₹{filteredBreakdown.reduce((s, e) => s + e.razorpay_cost, 0).toLocaleString('en-IN')}</strong></td>
                <td><strong>₹{filteredBreakdown.reduce((s, e) => s + e.organizer_net, 0).toLocaleString('en-IN')}</strong></td>
                <td className="hq-rt-profit positive"><strong>₹{filteredBreakdown.reduce((s, e) => s + e.net_profit, 0).toLocaleString('en-IN')}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <div className="hq-empty">
          <p>No revenue data yet. Revenue will appear after bookings are made.</p>
        </div>
      )}
    </div>
  )
}

function fmt(n: number): string {
  if (n >= 100000) return `${(n / 100000).toFixed(2)}L`
  if (n >= 10000) return `${(n / 1000).toFixed(1)}K`
  return n.toLocaleString('en-IN')
}
