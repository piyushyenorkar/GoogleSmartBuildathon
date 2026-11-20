import React, { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  X, Check, AlertCircle, Link as LinkIcon, HelpCircle,
  Sparkles, Loader2, Send, CheckCircle2, Eye
} from 'lucide-react'
import { SelectDropdown } from '@/components/ui/SelectDropdown'
import type { CustomFormConfig } from '@/types/form'
import './forms.css'

interface CustomFormFillModalProps {
  isOpen: boolean
  onClose: () => void
  formConfig: CustomFormConfig
  competitionTitle?: string
  teamName?: string
  initialAnswers?: Record<string, any>
  initialValues?: Record<string, any>
  readOnly?: boolean
  onSubmit: (answers: Record<string, any>) => Promise<void> | void
  isSubmitting?: boolean
}

export const CustomFormFillModal: React.FC<CustomFormFillModalProps> = ({
  isOpen,
  onClose,
  formConfig,
  competitionTitle = 'Competition',
  teamName,
  initialAnswers,
  initialValues,
  readOnly = false,
  onSubmit,
  isSubmitting = false,
}) => {
  // Normalize fields so each question has a guaranteed unique string id
  const normalizedFields = useMemo(() => {
    if (!formConfig || !formConfig.fields) return []
    const seen = new Set<string>()
    return formConfig.fields.map((f, idx) => {
      let uniqueId = (f.id && typeof f.id === 'string' && f.id.trim()) ? f.id.trim() : `f_${idx}`
      if (seen.has(uniqueId)) {
        uniqueId = `${uniqueId}_${idx}`
      }
      seen.add(uniqueId)
      return { ...f, id: uniqueId }
    })
  }, [formConfig?.fields])

  // Answers state: initialize once
  const [answers, setAnswers] = useState<Record<string, any>>(() => {
    return initialValues || initialAnswers || {}
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPurposeModal, setShowPurposeModal] = useState(false)

  // ONLY sync initial answers when modal opens, NEVER clear or overwrite typed answers on parent re-renders!
  const wasOpenRef = useRef(false)
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      const incoming = initialValues || initialAnswers
      if (incoming && Object.keys(incoming).length > 0) {
        setAnswers({ ...incoming })
      }
    }
    wasOpenRef.current = isOpen
  }, [isOpen, initialValues, initialAnswers])

  if (!isOpen || !formConfig || normalizedFields.length === 0) {
    return null
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    normalizedFields.forEach(field => {
      const val = answers[field.id]

      if (field.required) {
        if (val === undefined || val === null || val === '') {
          newErrors[field.id] = 'This field is required'
        } else if (Array.isArray(val) && val.length === 0) {
          newErrors[field.id] = 'Please select at least one option'
        }
      }

      // URL format check
      if (field.type === 'url' && val && typeof val === 'string' && val.trim().length > 0) {
        const urlStr = val.trim()
        if (!urlStr.startsWith('http://') && !urlStr.startsWith('https://')) {
          newErrors[field.id] = 'URL must start with http:// or https://'
        }
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    try {
      await onSubmit(answers)
    } catch (err) {
      console.error('Failed to submit form:', err)
    }
  }

  const handleInputChange = (fieldId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [fieldId]: value }))
    if (errors[fieldId]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[fieldId]
        return next
      })
    }
  }

  return createPortal(
    <div className="cf-overlay" onClick={onClose}>
      <div className="cf-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '680px' }}>
        {/* Banner Header */}
        <div className="cf-fill-header-banner">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span className="cf-fill-badge">
              <Sparkles size={11} /> Registration Application Form
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {formConfig.purpose && (
                <button
                  type="button"
                  className="cf-btn-ghost"
                  style={{ padding: '4px 10px', fontSize: 11, borderRadius: 20 }}
                  onClick={() => setShowPurposeModal(!showPurposeModal)}
                  title="View Purpose"
                >
                  <Eye size={12} /> {showPurposeModal ? 'Hide Purpose' : 'Why this form?'}
                </button>
              )}
              <button className="cf-btn-close" onClick={onClose}>
                <X size={18} />
              </button>
            </div>
          </div>

          <h2 className="cf-fill-title">{formConfig.title || 'Team Application Details'}</h2>
          <p className="cf-fill-desc">
            {teamName ? `Registering Team: "${teamName}" • ` : ''}
            {competitionTitle}
          </p>
          {formConfig.description && (
            <p className="cf-fill-desc" style={{ marginTop: 6, color: '#d4d4d8' }}>
              {formConfig.description}
            </p>
          )}
        </div>

        {/* Purpose Explainer (Collapsible / Banner) */}
        {formConfig.purpose && showPurposeModal && (
          <div style={{ padding: '0 24px', paddingTop: 16 }}>
            <div className="cf-purpose-card">
              <div className="cf-purpose-icon">
                <HelpCircle size={18} />
              </div>
              <div className="cf-purpose-content">
                <div className="cf-purpose-title">Purpose of this form</div>
                <p className="cf-purpose-desc">{formConfig.purpose}</p>
              </div>
            </div>
          </div>
        )}

        {/* Questions Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="cf-body">
            {normalizedFields.map((field, idx) => {
              const err = errors[field.id]
              const val = answers[field.id]

              return (
                <div key={field.id} className={`cf-fill-question ${err ? 'has-error' : ''}`}>
                  <label className="cf-fill-q-label">
                    <span>{idx + 1}. {field.label}</span>
                    {field.required && <span className="cf-required-star">*</span>}
                  </label>

                  {field.helpText && <div className="cf-fill-q-help">{field.helpText}</div>}

                  {/* Short Answer */}
                  {field.type === 'text' && (
                    <input
                      className="cf-input"
                      placeholder={field.placeholder || 'Your answer...'}
                      value={val || ''}
                      onChange={e => handleInputChange(field.id, e.target.value)}
                    />
                  )}

                  {/* Paragraph */}
                  {field.type === 'textarea' && (
                    <textarea
                      className="cf-textarea"
                      placeholder={field.placeholder || 'Your answer...'}
                      value={val || ''}
                      onChange={e => handleInputChange(field.id, e.target.value)}
                    />
                  )}

                  {/* URL */}
                  {field.type === 'url' && (
                    <div style={{ position: 'relative' }}>
                      <LinkIcon size={14} style={{ position: 'absolute', left: 12, top: 13, color: '#71717a' }} />
                      <input
                        className="cf-input"
                        style={{ paddingLeft: 34 }}
                        placeholder={field.placeholder || 'https://github.com/... or https://...'}
                        value={val || ''}
                        onChange={e => handleInputChange(field.id, e.target.value)}
                      />
                    </div>
                  )}

                  {/* Number */}
                  {field.type === 'number' && (
                    <input
                      type="number"
                      className="cf-input"
                      placeholder={field.placeholder || '0'}
                      value={val || ''}
                      onChange={e => handleInputChange(field.id, e.target.value)}
                    />
                  )}

                  {/* Dropdown */}
                  {field.type === 'select' && (
                    <SelectDropdown
                      value={val || ''}
                      onChange={v => handleInputChange(field.id, v)}
                      options={(field.options && field.options.length > 0) ? field.options : ['Option 1', 'Option 2']}
                      placeholder={field.placeholder || 'Select an option...'}
                      className="cf-preview-select"
                      showPlaceholderOption={false}
                    />
                  )}

                  {/* Radio / Multiple Choice */}
                  {field.type === 'radio' && (
                    <div className="cf-fill-options-list">
                      {(field.options || []).map((opt, i) => {
                        const isSelected = val === opt
                        return (
                          <div
                            key={i}
                            className={`cf-fill-option-item ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleInputChange(field.id, opt)}
                          >
                            <div className="cf-custom-radio">
                              {isSelected && <div className="cf-custom-radio-inner" />}
                            </div>
                            <span>{opt}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Checkboxes */}
                  {field.type === 'checkbox' && (
                    <div className="cf-fill-options-list">
                      {(field.options || []).map((opt, i) => {
                        const current = Array.isArray(val) ? val : []
                        const isSelected = current.includes(opt)
                        return (
                          <div
                            key={i}
                            className={`cf-fill-option-item ${isSelected ? 'selected' : ''}`}
                            onClick={() => {
                              const next = isSelected ? current.filter((x: string) => x !== opt) : [...current, opt]
                              handleInputChange(field.id, next)
                            }}
                          >
                            <div className="cf-custom-checkbox">
                              {isSelected && <Check size={12} color="#fff" />}
                            </div>
                            <span>{opt}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {err && (
                    <div className="cf-err-msg">
                      <AlertCircle size={12} /> {err}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div className="cf-footer">
            <div style={{ fontSize: 12, color: '#71717a' }}>
              All responses are securely submitted to the competition organizer.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="cf-btn-ghost" onClick={onClose} disabled={isSubmitting}>
                {readOnly ? 'Close' : 'Cancel'}
              </button>
              {!readOnly && (
                <button type="submit" className="cf-btn-save" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="spin" /> Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} /> Submit & Proceed
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
export default CustomFormFillModal
