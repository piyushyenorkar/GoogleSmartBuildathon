/**
 * SubmissionModal.tsx — Modal for submitting stage deliverables
 * Ported from pluto_app/src/components/SubmissionModal.tsx
 */

import { useState, useEffect } from 'react'
import { X, Link as LinkIcon, Video, FileText, ExternalLink, CheckCircle2, Loader2, GitBranch, AlertTriangle } from 'lucide-react'
import { useSubmitStageDeliverable } from '@/hooks/useCompetitionRegistrations'

interface SubmissionModalProps {
  isOpen: boolean
  onClose: () => void
  stageIndex: number
  stageName: string
  submissionTypes: string[]
  registrationType: 'individual' | 'team'
  entityId: string // registration ID (individual) or team ID (team)
  existingSubmission?: Record<string, string>
}

export function SubmissionModal({
  isOpen, onClose, stageIndex, stageName,
  submissionTypes, registrationType, entityId,
  existingSubmission,
}: SubmissionModalProps) {
  const submitMutation = useSubmitStageDeliverable()
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [confirmState, setConfirmState] = useState<'idle' | 'confirming' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const activeTypes = submissionTypes.filter(t => t !== 'none')
  const isSubmitted = !!existingSubmission
  const isReadOnly = isSubmitted

  useEffect(() => {
    if (existingSubmission) {
      setFormData(existingSubmission)
    } else {
      setFormData({})
    }
    if (isOpen) {
      setConfirmState('idle')
    }
  }, [isOpen, existingSubmission])

  const handleSubmit = () => {
    if (activeTypes.length === 0) return
    const hasAtLeastOne = activeTypes.some(t => formData[t]?.trim())
    if (!hasAtLeastOne) {
      setErrorMessage('Please provide at least one valid link for your submission.')
      setConfirmState('error')
      return
    }
    setConfirmState('confirming')
  }

  const confirmSubmission = async () => {
    try {
      await submitMutation.mutateAsync({
        registrationType,
        id: entityId,
        stageIndex,
        submissionData: formData,
      })
      setConfirmState('success')
    } catch (err: any) {
      console.error('Submission failed:', err)
      setErrorMessage(err.message || 'Failed to submit deliverable')
      setConfirmState('error')
    }
  }

  const handleClose = () => {
    if (confirmState === 'success') {
      // You can trigger an onSuccess callback here if needed
    }
    setConfirmState('idle')
    onClose()
  }

  const getTypeDetails = (type: string) => {
    switch (type) {
      case 'video':
        return { icon: <Video size={20} color="#ef4444" />, label: 'Video Demo', placeholder: 'Add YouTube/Drive Video Link' }
      case 'github':
        return { icon: <GitBranch size={20} color="#a1a1aa" />, label: 'GitHub Repository', placeholder: 'https://github.com/...' }
      case 'ppt':
        return { icon: <FileText size={20} color="#3b82f6" />, label: 'Presentation/PDF', placeholder: 'Google Drive Link (public)' }
      case 'link':
      default:
        return { icon: <LinkIcon size={20} color="#8b5cf6" />, label: 'Live Deployment URL / Other Link', placeholder: 'https://...' }
    }
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
      padding: '20px'
    }} onClick={handleClose}>
      <div style={{
        background: '#121212',
        borderRadius: '24px',
        border: '1px solid #27272a',
        width: '100%', maxWidth: '520px',
        maxHeight: '90vh', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 -4px 30px rgba(0,0,0,0.5)',
      }} onClick={e => e.stopPropagation()}>
        
        {confirmState === 'idle' && (
          <>
            {/* Header */}
            <div style={{ padding: '24px 24px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '1.35rem', color: '#fff', fontWeight: 800 }}>
                  {isSubmitted ? 'View Submission' : 'Submit Deliverable'}
                </h3>
                <p style={{ margin: 0, fontSize: '0.95rem', color: '#a8ff83', fontWeight: 600 }}>
                  {stageName || `Stage ${stageIndex + 1}`}
                </p>
              </div>
              <button onClick={handleClose} style={{
                background: 'rgba(255,255,255,0.05)', border: 'none',
                borderRadius: '16px', padding: '8px', cursor: 'pointer', color: '#a1a1aa',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '0 24px', overflowY: 'auto', paddingBottom: '20px', flex: 1 }}>
              <p style={{ fontSize: '0.85rem', color: '#a1a1aa', margin: '0 0 24px', lineHeight: 1.5 }}>
                {isSubmitted 
                  ? 'Here is what you have submitted for this stage.' 
                  : 'Please provide links for the deliverables requested below. Make sure all drive links have public access.'}
              </p>

              {activeTypes.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: '20px 0' }}>
                  No submissions required for this stage.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {activeTypes.map(type => {
                    const details = getTypeDetails(type)
                    const currentLink = formData[type] || ''

                    return (
                      <div key={type}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#e4e4e7', marginBottom: '8px', marginLeft: '4px' }}>
                          {details.label}
                        </label>
                        <div style={{
                          display: 'flex', alignItems: 'center',
                          background: '#18181b', borderRadius: '24px',
                          border: '1px solid #27272a', padding: '0 4px',
                        }}>
                          <div style={{ width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {details.icon}
                          </div>
                          
                          {isSubmitted ? (
                            <div style={{ flex: 1, padding: '14px 0', overflow: 'hidden' }}>
                              {currentLink ? (
                                <a href={currentLink} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'underline', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                                  {currentLink}
                                </a>
                              ) : (
                                <span style={{ color: '#52525b', fontSize: '0.95rem' }}>No link provided</span>
                              )}
                            </div>
                          ) : (
                            <input
                              type="url"
                              value={currentLink}
                              onChange={e => setFormData(prev => ({ ...prev, [type]: e.target.value }))}
                              placeholder={details.placeholder}
                              readOnly={isReadOnly}
                              style={{
                                flex: 1, padding: '14px 16px 14px 0',
                                background: 'transparent', border: 'none',
                                color: '#fff', fontSize: '0.95rem', outline: 'none',
                                opacity: isReadOnly ? 0.5 : 1,
                              }}
                            />
                          )}
                          
                          {isSubmitted && currentLink && (
                            <a href={currentLink} target="_blank" rel="noopener noreferrer" style={{ padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <ExternalLink size={16} color="#a1a1aa" />
                            </a>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '16px 24px 24px', borderTop: '1px solid #27272a', background: '#121212' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={handleClose} style={{
                  flex: 1, background: 'rgba(255,255,255,0.05)', color: '#fff',
                  border: 'none', borderRadius: '24px', padding: '16px',
                  fontSize: '1rem', fontWeight: 600, cursor: 'pointer'
                }}>
                  Close
                </button>

                {!isReadOnly && activeTypes.length > 0 && (
                  <button
                    onClick={handleSubmit}
                    disabled={submitMutation.isPending}
                    style={{
                      flex: 1, background: '#a8ff83', color: '#000',
                      border: 'none', borderRadius: '24px', padding: '16px',
                      fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      opacity: submitMutation.isPending ? 0.5 : 1
                    }}
                  >
                    {submitMutation.isPending ? <><Loader2 size={16} className="spin" /> Submitting...</> : 'Submit'}
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {/* Confirm State */}
        {confirmState === 'confirming' && (
          <div style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '32px', background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <AlertTriangle size={32} color="#a78bfa" />
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>Confirm Submission</h3>
            <p style={{ fontSize: '0.95rem', color: '#a1a1aa', textAlign: 'center', marginBottom: '32px', lineHeight: 1.5 }}>
              Are you sure you want to submit? Please ensure your links are accessible. You won't be able to edit this once submitted.
            </p>
            
            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
              <button 
                onClick={() => setConfirmState('idle')}
                disabled={submitMutation.isPending}
                style={{ flex: 1, padding: '16px', borderRadius: '24px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={confirmSubmission}
                disabled={submitMutation.isPending}
                style={{ flex: 1, padding: '16px', borderRadius: '24px', background: '#a78bfa', color: '#000', border: 'none', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {submitMutation.isPending ? <Loader2 size={16} className="spin" color="#000" /> : 'Confirm'}
              </button>
            </div>
          </div>
        )}

        {/* Success State */}
        {confirmState === 'success' && (
          <div style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '32px', background: 'rgba(52,211,153,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <CheckCircle2 size={32} color="#34d399" />
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>Submitted Successfully!</h3>
            <p style={{ fontSize: '0.95rem', color: '#a1a1aa', textAlign: 'center', marginBottom: '32px', lineHeight: 1.5 }}>
              Your deliverable has been successfully recorded.
            </p>
            
            <button 
              onClick={handleClose}
              style={{ width: '100%', padding: '16px', borderRadius: '24px', background: '#34d399', color: '#000', border: 'none', fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Done
            </button>
          </div>
        )}

        {/* Error State */}
        {confirmState === 'error' && (
          <div style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '32px', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <AlertTriangle size={32} color="#ef4444" />
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>Action Failed</h3>
            <p style={{ fontSize: '0.95rem', color: '#a1a1aa', textAlign: 'center', marginBottom: '32px', lineHeight: 1.5 }}>
              {errorMessage}
            </p>
            
            <button 
              onClick={() => setConfirmState('idle')}
              style={{ width: '100%', padding: '16px', borderRadius: '24px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Okay
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
