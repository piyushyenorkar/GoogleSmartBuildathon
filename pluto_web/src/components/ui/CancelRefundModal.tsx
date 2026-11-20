/**
 * CancelRefundModal.tsx — PLUTO
 * Professional cancellation & refund modal inspired by Unstop / BookMyShow.
 *
 * Flow:
 *   1. loading  → eligibility check spinner
 *   2. confirm  → "Are you sure?" step with event details
 *   3. breakdown → transparent fee breakdown table
 *   4. processing → Razorpay refund in-progress
 *   5. success  → animated confirmation with refund amount
 *   6. error    → clear error message with retry / dismiss
 */

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, AlertCircle, Clock, CheckCircle2, Loader2,
  AlertTriangle, Info, Wallet, Tag, Receipt, Scissors, ArrowDownLeft,
} from 'lucide-react'
import { useCheckRefundEligibility, useRequestRefund } from '@/hooks/useBookings'
import type { RefundEligibility } from '@/services/bookingService'
import './CancelRefundModal.css'

interface CancelRefundModalProps {
  bookingId: string | null
  onClose: () => void
}

type ModalStep = 'loading' | 'confirm' | 'breakdown' | 'processing' | 'success' | 'error'

export function CancelRefundModal({ bookingId, onClose }: CancelRefundModalProps) {
  const [step, setStep] = useState<ModalStep>('loading')
  const [eligibility, setEligibility] = useState<RefundEligibility | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [refundAmount, setRefundAmount] = useState(0)
  const [refundMessage, setRefundMessage] = useState('')
  const [showPolicy, setShowPolicy] = useState(false)

  const checkEligibility = useCheckRefundEligibility()
  const requestRefund = useRequestRefund()

  // Check eligibility when modal opens
  useEffect(() => {
    if (!bookingId) return

    setStep('loading')
    checkEligibility.mutate(bookingId, {
      onSuccess: (result) => {
        if (!result.eligible) {
          setErrorMessage(result.reason)
          setStep('error')
        } else {
          setEligibility(result)
          setStep('confirm')
        }
      },
      onError: (err) => {
        setErrorMessage(err instanceof Error ? err.message : 'Failed to check eligibility')
        setStep('error')
      },
    })
  }, [bookingId])

  const handleConfirmRefund = async () => {
    if (!bookingId) return
    setStep('processing')

    // Small artificial delay so user sees the processing state
    await new Promise((r) => setTimeout(r, 1200))

    requestRefund.mutate(bookingId, {
      onSuccess: (result) => {
        if (result.success) {
          setRefundAmount(result.refundAmount || 0)
          setRefundMessage(
            result.message ||
            'Your refund will be credited to your original payment method within 5-10 business days.'
          )
          setStep('success')
        } else {
          setErrorMessage(result.error || 'Refund failed. Please try again or contact support.')
          setStep('error')
        }
      },
      onError: (err) => {
        setErrorMessage(err instanceof Error ? err.message : 'Refund request failed')
        setStep('error')
      },
    })
  }

  if (!bookingId) return null

  const b = eligibility?.refundBreakdown

  return (
    <AnimatePresence>
      <motion.div
        className="refund-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        <motion.div
          className="refund-modal"
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.96 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Close button */}
          <button className="refund-modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>

          {/* ─── Step 1: Loading ──────────────── */}
          {step === 'loading' && (
            <div className="refund-step-content">
              <Loader2 size={36} className="refund-spinner" />
              <p className="refund-modal-subtitle">Checking cancellation eligibility…</p>
            </div>
          )}

          {/* ─── Step 2: Confirm Intent ──────── */}
          {step === 'confirm' && (
            <div className="refund-step-content">
              <div className="refund-icon-circle refund-icon-warning">
                <AlertTriangle size={26} />
              </div>
              <h3 className="refund-modal-title">Cancel Booking?</h3>
              <p className="refund-modal-event-name">
                {eligibility?.eventTitle || 'This Event'}
              </p>
              <p className="refund-confirm-subtitle">
                A cancellation fee will apply.
                {eligibility?.deadlineHours != null && (
                  <span className="refund-deadline-inline">
                    <Clock size={12} /> {eligibility.deadlineHours}h left
                  </span>
                )}
              </p>

              {/* Collapsible policy — hidden behind ⓘ */}
              <button
                className="refund-policy-toggle"
                onClick={() => setShowPolicy(!showPolicy)}
              >
                <Info size={13} />
                {showPolicy ? 'Hide' : 'View'} cancellation policy
              </button>
              {showPolicy && (
                <div className="refund-policy-tooltip">
                  <p>• Cancellations allowed up to <strong>24h</strong> before event</p>
                  {/* will implement after it will come in production */}
                  {/* <p>• Booking fee & GST are non-refundable</p> */}
                  <p>• Booking fee is non-refundable</p>
                  <p>• Flat <strong>₹30</strong> cancellation penalty applies</p>
                  <p>• Refund credited in 5-10 business days</p>
                </div>
              )}

              <div className="refund-actions">
                <button className="refund-btn refund-btn-ghost" onClick={onClose}>
                  Keep Ticket
                </button>
                <button className="refund-btn refund-btn-proceed" onClick={() => setStep('breakdown')}>
                  Get Refund
                </button>
              </div>
            </div>
          )}

          {/* ─── Step 3: Breakdown ───────────── */}
          {step === 'breakdown' && b && (
            <div className="refund-step-content">
              <h3 className="refund-modal-title">Refund Summary</h3>

              <div className="refund-receipt">
                <div className="receipt-row">
                  <span className="receipt-label"><Wallet size={14} className="receipt-icon" /> Amount Paid</span>
                  <span className="receipt-value">₹{b.originalAmount.toLocaleString('en-IN')}</span>
                </div>

                <div className="receipt-row receipt-sub">
                  <span className="receipt-label"><Tag size={13} className="receipt-icon" /> Ticket Price</span>
                  <span className="receipt-value">₹{b.ticketPrice.toLocaleString('en-IN')}</span>
                </div>

                <div className="receipt-divider" />

                <div className="receipt-row receipt-deduct">
                  {/* will implement after it will come in production */}
                  {/* <span className="receipt-label"><Receipt size={13} className="receipt-icon" /> Convenience Fee & GST</span> */}
                  <span className="receipt-label"><Receipt size={13} className="receipt-icon" /> Convenience Fee</span>
                  <span className="receipt-value">− ₹{b.bookingFee.toFixed(2)}</span>
                </div>

                <div className="receipt-row receipt-deduct">
                  <span className="receipt-label"><Scissors size={13} className="receipt-icon" /> Cancellation Fee</span>
                  <span className="receipt-value">− ₹{b.cancellationPenalty.toFixed(2)}</span>
                </div>

                <div className="receipt-divider receipt-divider-strong" />

                <div className="receipt-row receipt-total">
                  <span className="receipt-label"><ArrowDownLeft size={14} className="receipt-icon" /> Refund Amount</span>
                  <span className="receipt-value receipt-highlight">₹{b.refundAmount.toFixed(2)}</span>
                </div>
              </div>

              <p className="refund-timeline-note">
                Credited to original payment method in 5–10 business days
              </p>

              <div className="refund-actions">
                <button className="refund-btn refund-btn-ghost" onClick={() => setStep('confirm')}>
                  Go Back
                </button>
                <button className="refund-btn refund-btn-confirm" onClick={handleConfirmRefund}>
                  Confirm Cancellation
                </button>
              </div>
            </div>
          )}

          {/* ─── Step 4: Processing ──────────── */}
          {step === 'processing' && (
            <div className="refund-step-content">
              <div className="refund-processing-ring">
                <Loader2 size={40} className="refund-spinner" />
              </div>
              <h3 className="refund-modal-title">Processing Refund</h3>
              <p className="refund-modal-subtitle">
                Communicating with Razorpay…<br />
                Please don't close this window.
              </p>
            </div>
          )}

          {/* ─── Step 5: Success ─────────────── */}
          {step === 'success' && (
            <div className="refund-step-content">
              <div className="refund-icon-circle refund-icon-success refund-success-pulse">
                <CheckCircle2 size={28} />
              </div>
              <h3 className="refund-modal-title">Cancellation Successful</h3>
              <p className="refund-success-amount">₹{refundAmount.toFixed(2)}</p>
              <p className="refund-success-label">will be refunded to you</p>
              <p className="refund-modal-subtitle">{refundMessage}</p>
              <button
                className="refund-btn refund-btn-success-close"
                onClick={() => { onClose(); window.location.reload() }}
              >
                Back to Dashboard
              </button>
            </div>
          )}

          {/* ─── Step 6: Error ──────────────── */}
          {step === 'error' && (
            <div className="refund-step-content">
              <div className="refund-icon-circle refund-icon-error">
                <AlertCircle size={26} />
              </div>
              <h3 className="refund-modal-title">Cancellation Unavailable</h3>
              <p className="refund-modal-subtitle">{errorMessage}</p>
              <button className="refund-btn refund-btn-ghost" onClick={onClose}>
                Got It
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
